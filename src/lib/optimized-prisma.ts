import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from "./logger";
import { redisCache, CACHE_TTL } from './redis-cache';

// Configuration optimisée Prisma
const prismaConfig: Prisma.PrismaClientOptions = {
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'minimal',
};

// Singleton Prisma avec optimisations
class OptimizedPrismaClient extends PrismaClient {
    constructor() {
        super(prismaConfig);
        
        // Middleware pour le cache
        this.$use(this.cacheMiddleware);
        
        // Middleware pour logging des queries lentes
        this.$use(this.performanceMiddleware);
    }

    // Middleware de cache pour les requêtes fréquentes
    private cacheMiddleware: Prisma.Middleware = async (params, next) => {
        const { model, action, args } = params;
        
        // Cache uniquement les lectures
        if (!['findFirst', 'findUnique', 'findMany'].includes(action)) {
            return next(params);
        }

        // Générer clé de cache
        const cacheKey = this.generateCacheKey(model, action, args);
        
        // Vérifier le cache
        const cached = await redisCache.get(cacheKey);
        if (cached) {
            logger.info(`🎯 DB Cache HIT: ${model}.${action}`);
            return cached;
        }

        // Exécuter la requête
        const result = await next(params);
        
        // Mettre en cache selon le modèle
        const ttl = this.getCacheTTL(model, action);
        if (ttl > 0) {
            await redisCache.set(cacheKey, result, ttl);
            logger.info(`💾 DB Cached: ${model}.${action} for ${ttl}s`);
        }

        return result;
    };

    // Middleware de performance pour détecter les requêtes lentes
    private performanceMiddleware: Prisma.Middleware = async (params, next) => {
        const start = Date.now();
        const result = await next(params);
        const duration = Date.now() - start;

        // Log des requêtes lentes (>100ms)
        if (duration > 100) {
            logger.warn(`🐌 Slow query detected: ${params.model}.${params.action} took ${duration}ms`);
            
            // Enregistrer pour analyse
            if (typeof window === 'undefined') {
                this.logSlowQuery(params, duration);
            }
        }

        return result;
    };

    private generateCacheKey(model: string, action: string, args: any): string {
        const argsHash = this.hashArgs(args);
        return `mathilda:db:${model}:${action}:${argsHash}`;
    }

    private hashArgs(args: any): string {
        const str = JSON.stringify(args, Object.keys(args).sort());
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    private getCacheTTL(model: string, action: string): number {
        // Configuration TTL par modèle
        const modelTTL: Record<string, number> = {
            User: CACHE_TTL.USER_PROFILE,
            Site: CACHE_TTL.STATIC_DATA,
            Sector: CACHE_TTL.STATIC_DATA,
            Specialty: CACHE_TTL.STATIC_DATA,
            Leave: CACHE_TTL.LEAVES_DATA,
            Planning: CACHE_TTL.PLANNING_DATA,
            Settings: CACHE_TTL.SETTINGS,
        };

        return modelTTL[model] || 0; // Pas de cache par défaut
    }

    private async logSlowQuery(params: any, duration: number): Promise<void> {
        try {
            // Enregistrer dans un fichier de log ou système de monitoring
            const logEntry = {
                timestamp: new Date().toISOString(),
                model: params.model,
                action: params.action,
                duration,
                args: params.args,
            };
            
            // Ici on pourrait envoyer vers un système de monitoring
            logger.info('Slow query logged:', logEntry);
        } catch (error) {
            logger.warn('Failed to log slow query:', error);
        }
    }

    // Méthodes optimisées pour les cas d'usage fréquents
    
    // Utilisateurs avec cache intelligent
    async findUserWithCache(id: string) {
        const cacheKey = `mathilda:user:full:${id}`;
        const cached = await redisCache.get(cacheKey);
        
        if (cached) {
            return cached;
        }

        const user = await this.user.findUnique({
            where: { id },
            include: {
                sites: true,
                professionalRoles: true,
                leaves: {
                    where: {
                        status: { in: ['PENDING', 'APPROVED'] },
                        endDate: { gte: new Date() }
                    },
                    take: 10,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (user) {
            await redisCache.set(cacheKey, user, CACHE_TTL.USER_PROFILE);
        }

        return user;
    }

    // Planning avec optimisations
    async findPlanningOptimized(filters: {
        startDate?: Date;
        endDate?: Date;
        siteId?: string;
        userId?: string;
    }) {
        const cacheKey = `mathilda:planning:optimized:${this.hashArgs(filters)}`;
        const cached = await redisCache.get(cacheKey);
        
        if (cached) {
            return cached;
        }

        // Requête optimisée avec indexes
        const planning = await this.assignment.findMany({
            where: {
                ...(filters.startDate && { date: { gte: filters.startDate } }),
                ...(filters.endDate && { date: { lte: filters.endDate } }),
                ...(filters.siteId && { siteId: filters.siteId }),
                ...(filters.userId && { userId: filters.userId }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        professionalRole: true
                    }
                },
                site: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                room: {
                    select: {
                        id: true,
                        name: true,
                        type: true
                    }
                }
            },
            orderBy: [
                { date: 'asc' },
                { startTime: 'asc' }
            ]
        });

        await redisCache.set(cacheKey, planning, CACHE_TTL.PLANNING_DATA);
        return planning;
    }

    // Congés avec pagination optimisée
    async findLeavesWithPagination(params: {
        userId?: string;
        status?: string;
        page: number;
        limit: number;
    }) {
        const { page, limit, ...filters } = params;
        const skip = (page - 1) * limit;
        
        const cacheKey = `mathilda:leaves:paginated:${this.hashArgs(params)}`;
        const cached = await redisCache.get(cacheKey);
        
        if (cached) {
            return cached;
        }

        // Utiliser transaction pour avoir count et data en une fois
        const [leaves, total] = await Promise.all([
            this.leave.findMany({
                where: filters,
                include: {
                    user: {
                        select: {
                            id: true,
                            nom: true,
                            prenom: true
                        }
                    },
                    leaveType: {
                        select: {
                            name: true,
                            color: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            this.leave.count({ where: filters })
        ]);

        const result = {
            data: leaves,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };

        await redisCache.set(cacheKey, result, CACHE_TTL.LEAVES_DATA);
        return result;
    }

    // Statistiques avec agrégation optimisée
    async getDashboardStats(userId?: string) {
        const cacheKey = `mathilda:stats:dashboard:${userId || 'global'}`;
        const cached = await redisCache.get(cacheKey);
        
        if (cached) {
            return cached;
        }

        // Requêtes agrégées optimisées
        const stats = await Promise.all([
            // Total utilisateurs actifs
            this.user.count({
                where: { actif: true }
            }),
            
            // Congés en attente
            this.leave.count({
                where: {
                    status: 'PENDING',
                    ...(userId && { userId })
                }
            }),
            
            // Affectations ce mois
            this.assignment.count({
                where: {
                    date: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                        lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
                    },
                    ...(userId && { userId })
                }
            }),
            
            // Violations de règles
            this.ruleViolation.count({
                where: {
                    resolved: false,
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 jours
                    }
                }
            })
        ]);

        const result = {
            activeUsers: stats[0],
            pendingLeaves: stats[1],
            monthlyAssignments: stats[2],
            ruleViolations: stats[3],
            cachedAt: new Date()
        };

        await redisCache.set(cacheKey, result, 300); // 5 minutes
        return result;
    }

    // Invalidation de cache intelligente
    async invalidateUserCache(userId: string) {
        const patterns = [
            `mathilda:user:*:${userId}`,
            `mathilda:db:User:*:*${userId}*`,
            `mathilda:planning:*${userId}*`,
            `mathilda:leaves:*${userId}*`
        ];

        for (const pattern of patterns) {
            await redisCache.del(pattern);
        }
    }

    async invalidatePlanningCache(date?: Date) {
        const patterns = [
            'mathilda:planning:*',
            'mathilda:db:Assignment:*',
            'mathilda:stats:dashboard:*'
        ];

        for (const pattern of patterns) {
            await redisCache.del(pattern);
        }
    }

    // Requêtes bulk optimisées
    async bulkCreateAssignments(assignments: any[]) {
        // Utiliser transaction pour performance
        const result = await this.$transaction(async (tx) => {
            const created = await tx.assignment.createMany({
                data: assignments,
                skipDuplicates: true
            });

            // Invalider cache planning
            await this.invalidatePlanningCache();

            return created;
        });

        return result;
    }

    // Recherche full-text optimisée
    async searchUsers(query: string, limit: number = 20) {
        const cacheKey = `mathilda:search:users:${query}:${limit}`;
        const cached = await redisCache.get(cacheKey);
        
        if (cached) {
            return cached;
        }

        // Recherche avec ILIKE pour PostgreSQL (à adapter selon la DB)
        const users = await this.user.findMany({
            where: {
                OR: [
                    { nom: { contains: query, mode: 'insensitive' } },
                    { prenom: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } }
                ],
                actif: true
            },
            select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                professionalRole: true
            },
            take: limit,
            orderBy: [
                { nom: 'asc' },
                { prenom: 'asc' }
            ]
        });

        await redisCache.set(cacheKey, users, 600); // 10 minutes
        return users;
    }
}

// Instance singleton optimisée
export const prisma = new OptimizedPrismaClient();

// Helper functions pour les patterns courants
export async function withOptimizedQuery<T>(
    queryFn: () => Promise<T>,
    cacheKey: string,
    ttl: number = 300
): Promise<T> {
    const cached = await redisCache.get<T>(cacheKey);
    if (cached) {
        return cached;
    }

    const result = await queryFn();
    await redisCache.set(cacheKey, result, ttl);
    return result;
}

// Export par défaut
export default prisma;