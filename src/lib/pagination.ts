import { prisma } from '@/lib/prisma';

import { logger } from "./logger";
// Types pour la pagination
export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, unknown>;
}

export interface PaginationResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    performance: {
        queryTime: number;
        cacheHit: boolean;
        totalQueries: number;
    };
}

export interface PaginationOptions {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, unknown>;
    search?: string;
    searchFields?: string[];
}

export interface CacheEntry<T> {
    data: PaginationResult<T>;
    timestamp: number;
    ttl: number;
}

export class OptimizedPaginator<T> {
    private cache = new Map<string, CacheEntry<T>>();
    private defaultTTL = 5 * 60 * 1000; // 5 minutes par défaut
    private maxCacheSize = 100;
    private performanceMetrics = {
        totalQueries: 0,
        cacheHits: 0,
        averageQueryTime: 0
    };

    constructor(
        private prisma: PrismaClient,
        private model: string,
        private defaultTTL_ms: number = 5 * 60 * 1000
    ) {
        this.defaultTTL = defaultTTL_ms;

        // Nettoyage automatique du cache toutes les 10 minutes
        setInterval(() => this.cleanupCache(), 10 * 60 * 1000);
    }

    /**
     * Génère une clé de cache unique basée sur les options
     */
    private generateCacheKey(options: PaginationOptions): string {
        const key = {
            model: this.model,
            page: options.page,
            limit: options.limit,
            sortBy: options.sortBy,
            sortOrder: options.sortOrder,
            filters: options.filters,
            search: options.search,
            searchFields: options.searchFields
        };

        return Buffer.from(JSON.stringify(key)).toString('base64');
    }

    /**
     * Vérifie si une entrée de cache est valide
     */
    private isCacheValid(entry: CacheEntry<T>): boolean {
        return Date.now() - entry.timestamp < entry.ttl;
    }

    /**
     * Nettoie le cache des entrées expirées
     */
    private cleanupCache(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
                cleaned++;
            }
        }

        // Si le cache est encore trop gros, supprimer les plus anciennes entrées
        if (this.cache.size > this.maxCacheSize) {
            const entries = Array.from(this.cache.entries())
                .sort(([, a], [, b]) => a.timestamp - b.timestamp);

            const toDelete = entries.slice(0, this.cache.size - this.maxCacheSize);
            toDelete.forEach(([key]) => this.cache.delete(key));
            cleaned += toDelete.length;
        }

        if (cleaned > 0) {
            logger.info(`[Pagination] Cache nettoyé: ${cleaned} entrées supprimées`);
        }
    }

    /**
     * Met en cache un résultat
     */
    private setCacheEntry(key: string, data: PaginationResult<T>, ttl?: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL
        });
    }

    /**
     * Récupère une entrée du cache
     */
    private getCacheEntry(key: string): PaginationResult<T> | null {
        const entry = this.cache.get(key);

        if (!entry) return null;

        if (!this.isCacheValid(entry)) {
            this.cache.delete(key);
            return null;
        }

        this.performanceMetrics.cacheHits++;
        return entry.data;
    }

    /**
     * Construit la clause WHERE pour Prisma
     */
    private buildWhereClause(options: PaginationOptions): any {
        const where: any = {};

        // Filtres
        if (options.filters) {
            Object.assign(where, options.filters);
        }

        // Recherche
        if (options.search && options.searchFields && options.searchFields.length > 0) {
            where.OR = options.searchFields.map(field => ({
                [field]: {
                    contains: options.search,
                    mode: 'insensitive'
                }
            }));
        }

        return where;
    }

    /**
     * Construit la clause ORDER BY pour Prisma
     */
    private buildOrderByClause(options: PaginationOptions): any {
        if (!options.sortBy) return undefined;

        return {
            [options.sortBy]: options.sortOrder || 'asc'
        };
    }

    /**
     * Exécute une requête paginée avec cache
     */
    async paginate(
        options: PaginationOptions,
        include?: unknown,
        customTTL?: number
    ): Promise<PaginationResult<T>> {
        const startTime = performance.now();
        const cacheKey = this.generateCacheKey(options);

        // Vérifier le cache
        const cachedResult = this.getCacheEntry(cacheKey);
        if (cachedResult) {
            return {
                ...cachedResult,
                performance: {
                    ...cachedResult.performance,
                    queryTime: performance.now() - startTime,
                    cacheHit: true
                }
            };
        }

        try {
            const where = this.buildWhereClause(options);
            const orderBy = this.buildOrderByClause(options);
            const skip = (options.page - 1) * options.limit;

            // Exécuter les requêtes en parallèle
            const [data, total] = await Promise.all([
                (this.prisma as any)[this.model].findMany({
                    where,
                    orderBy,
                    skip,
                    take: options.limit,
                    include
                }),
                (this.prisma as any)[this.model].count({ where })
            ]);

            const queryTime = performance.now() - startTime;
            const totalPages = Math.ceil(total / options.limit);

            const result: PaginationResult<T> = {
                data,
                pagination: {
                    page: options.page,
                    limit: options.limit,
                    total,
                    totalPages,
                    hasNext: options.page < totalPages,
                    hasPrev: options.page > 1
                },
                performance: {
                    queryTime,
                    cacheHit: false,
                    totalQueries: this.performanceMetrics.totalQueries + 1
                }
            };

            // Mettre en cache le résultat
            this.setCacheEntry(cacheKey, result, customTTL);

            // Mettre à jour les métriques
            this.performanceMetrics.totalQueries++;
            this.performanceMetrics.averageQueryTime =
                (this.performanceMetrics.averageQueryTime + queryTime) / 2;

            // Log des requêtes lentes
            if (queryTime > 1000) {
                logger.warn(`[Pagination] Requête lente détectée: ${queryTime.toFixed(2)}ms pour ${this.model}`);
            }

            return result;

        } catch (error: unknown) {
            logger.error(`[Pagination] Erreur lors de la requête ${this.model}:`, { error: error });
            throw error;
        }
    }

    /**
     * Compte rapide avec cache
     */
    async count(
        filters?: Record<string, unknown>,
        customTTL?: number
    ): Promise<{ count: number; performance: { queryTime: number; cacheHit: boolean } }> {
        const startTime = performance.now();
        const cacheKey = `count_${this.model}_${JSON.stringify(filters || {})}`;

        // Vérifier le cache
        const cached = this.cache.get(cacheKey);
        if (cached && this.isCacheValid(cached)) {
            return {
                count: (cached.data as any).count,
                performance: {
                    queryTime: performance.now() - startTime,
                    cacheHit: true
                }
            };
        }

        try {
            const where = filters || {};
            const count = await (this.prisma as any)[this.model].count({ where });
            const queryTime = performance.now() - startTime;

            const result = {
                count,
                performance: {
                    queryTime,
                    cacheHit: false
                }
            };

            // Mettre en cache
            this.setCacheEntry(cacheKey, { count } as any, customTTL);

            return result;

        } catch (error: unknown) {
            logger.error(`[Pagination] Erreur lors du comptage ${this.model}:`, { error: error });
            throw error;
        }
    }

    /**
     * Suggestions de recherche rapides
     */
    async searchSuggestions(
        query: string,
        field: string,
        limit: number = 10
    ): Promise<string[]> {
        const cacheKey = `suggestions_${this.model}_${field}_${query}_${limit}`;

        // Cache très court pour les suggestions (30 secondes)
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 30000) {
            return (cached.data as any).suggestions;
        }

        try {
            const results = await (this.prisma as any)[this.model].findMany({
                where: {
                    [field]: {
                        contains: query,
                        mode: 'insensitive'
                    }
                },
                select: {
                    [field]: true
                },
                distinct: [field],
                take: limit,
                orderBy: {
                    [field]: 'asc'
                }
            });

            const suggestions = results
                .map((item: unknown) => item[field])
                .filter((value: string) => value && value.toLowerCase().includes(query.toLowerCase()));

            // Cache court
            this.setCacheEntry(cacheKey, { suggestions } as any, 30000);

            return suggestions;

        } catch (error: unknown) {
            logger.error(`[Pagination] Erreur lors des suggestions ${this.model}:`, { error: error });
            return [];
        }
    }

    /**
     * Invalide le cache pour ce template
     */
    invalidateCache(pattern?: string): void {
        if (!pattern) {
            // Invalider tout le cache pour ce template
            for (const [key] of this.cache.entries()) {
                if (key.includes(this.model)) {
                    this.cache.delete(key);
                }
            }
        } else {
            // Invalider selon un pattern
            for (const [key] of this.cache.entries()) {
                if (key.includes(this.model) && key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        }
    }

    /**
     * Obtient les métriques de performance
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            cacheSize: this.cache.size,
            cacheHitRate: this.performanceMetrics.totalQueries > 0
                ? (this.performanceMetrics.cacheHits / this.performanceMetrics.totalQueries) * 100
                : 0
        };
    }

    /**
     * Réinitialise les métriques
     */
    resetMetrics(): void {
        this.performanceMetrics = {
            totalQueries: 0,
            cacheHits: 0,
            averageQueryTime: 0
        };
    }

    /**
     * Vide complètement le cache
     */
    clearCache(): void {
        this.cache.clear();
    }
}

// Factory pour créer des paginators
export function createPaginator<T>(
    prisma: PrismaClient,
    model: string,
    ttl?: number
): OptimizedPaginator<T> {
    return new OptimizedPaginator<T>(prisma, model, ttl);
}

// Utilitaires pour les réponses API
export function createPaginationResponse<T>(
    result: PaginationResult<T>,
    baseUrl: string,
    queryParams: Record<string, unknown> = {}
) {
    const { pagination } = result;

    const buildUrl = (page: number) => {
        const params = new URLSearchParams({
            ...queryParams,
            page: page.toString(),
            limit: pagination.limit.toString()
        });
        return `${baseUrl}?${params.toString()}`;
    };

    return {
        ...result,
        links: {
            self: buildUrl(pagination.page),
            first: buildUrl(1),
            last: buildUrl(pagination.totalPages),
            prev: pagination.hasPrev ? buildUrl(pagination.page - 1) : null,
            next: pagination.hasNext ? buildUrl(pagination.page + 1) : null
        }
    };
}

// Fonction helper pour les APIs Next.js
export function extractPaginationParams(searchParams: URLSearchParams): PaginationParams {
    return {
        page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20,
        search: searchParams.get('search') || undefined,
        sortBy: searchParams.get('sortBy') || undefined,
        sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
        filters: Object.fromEntries(
            Array.from(searchParams.entries())
                .filter(([key]) => !['page', 'limit', 'search', 'sortBy', 'sortOrder'].includes(key))
        ),
    };
} 