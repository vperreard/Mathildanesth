// Empêcher le client browser d'exécuter ce code (pour Next.js App Router)
// Ce code s'exécute uniquement côté serveur
const isServer: boolean = typeof window === 'undefined';

import { prisma } from '@/lib/prisma';
import { logger } from "./logger";
import NodeCache from 'node-cache';

// Configuration du cache
const CACHE_TTL = 5 * 60; // 5 minutes en secondes
const CACHE_CHECK_PERIOD = 60; // Vérification d'expiration toutes les 60 secondes

// Création du cache
const prismaCache = new NodeCache({
    stdTTL: CACHE_TTL,
    checkperiod: CACHE_CHECK_PERIOD,
    useClones: false,
});

// Type pour les clés de cache
type CacheKey = string;

// Fonction pour générer une clé de cache basée sur le nom de la méthode et les arguments
function generateCacheKey(
    modelName: string,
    operation: string,
    args: unknown
): CacheKey {
    return `${modelName}:${operation}:${JSON.stringify(args)}`;
}

// Classe pour étendre PrismaClient avec le cache
export class PrismaCacheClient extends PrismaClient {
    constructor() {
        super();
        this.setupCache();
    }

    private setupCache() {
        // Intercepter les requêtes Prisma
        this.$use(async (params, next) => {
            // Ne pas mettre en cache les mutations
            if (
                params.action === 'create' ||
                params.action === 'update' ||
                params.action === 'delete' ||
                params.action === 'updateMany' ||
                params.action === 'deleteMany' ||
                params.action === 'upsert'
            ) {
                // Invalider le cache pour ce template lors des mutations
                if (params.model) {
                    this.invalidateCache(params.model);
                }
                return next(params);
            }

            // Pour les opérations de lecture, vérifier le cache
            if (
                params.action === 'findUnique' ||
                params.action === 'findFirst' ||
                params.action === 'findMany'
            ) {
                const cacheKey = generateCacheKey(
                    params.model || 'unknown', // Utiliser 'unknown' si model est undefined
                    params.action,
                    params.args
                );

                // Vérifier si les données sont dans le cache
                const cachedData = prismaCache.get<any>(cacheKey);
                if (cachedData) {
                    logger.info(`[PrismaCache] Cache hit: ${cacheKey}`);
                    return cachedData;
                }

                // Si pas dans le cache, exécuter la requête
                logger.info(`[PrismaCache] Cache miss: ${cacheKey}`);
                const result = await next(params);

                // Stocker le résultat dans le cache
                prismaCache.set(cacheKey, result);
                return result;
            }

            // Pour toutes les autres opérations, passer au middleware suivant
            return next(params);
        });
    }

    // Méthode pour invalider le cache pour un template spécifique
    public invalidateCache(modelName: string) {
        // Invalider uniquement les clés associées à ce template
        const keys = prismaCache.keys().filter((key) => key.startsWith(`${modelName}:`));
        logger.info(`[PrismaCache] Invalidating ${keys.length} keys for model ${modelName}`);
        keys.forEach((key: string) => prismaCache.del(key));
    }

    // Méthode pour invalider tout le cache
    public invalidateAllCache() {
        // Invalider tout le cache
        logger.info('[PrismaCache] Invalidating entire cache');
        prismaCache.flushAll();
    }

    // Méthode pour invalider une clé spécifique
    public invalidateCacheKey(key: CacheKey) {
        logger.info(`[PrismaCache] Invalidating specific key: ${key}`);
        prismaCache.del(key);
    }

    // Méthode pour précharger le cache
    public preloadCache(
        modelName: string,
        operation: string,
        args: unknown,
        data: unknown
    ) {
        const cacheKey = generateCacheKey(modelName, operation, args);
        logger.info(`[PrismaCache] Preloading cache: ${cacheKey}`);
        prismaCache.set(cacheKey, data);
    }

    // Statistiques du cache
    public getCacheStats() {
        return {
            keys: prismaCache.keys().length,
            hits: prismaCache.getStats().hits,
            misses: prismaCache.getStats().misses,
            ksize: prismaCache.getStats().ksize,
            vsize: prismaCache.getStats().vsize,
        };
    }
}

// Instance singleton du client Prisma avec cache
export const prismaCacheClient = new PrismaCacheClient();

// Middleware pour les API qui expose les statistiques du cache
export function cacheStatsMiddleware(req: unknown, res: unknown, next: unknown) {
    if (req.url === '/api/cache-stats' && req.method === 'GET') {
        return res.json(prismaCacheClient.getCacheStats());
    }
    next();
}

/**
 * Crée une clé de cache basée sur la requête et ses paramètres
 */
export function createCacheKey(model: string, operation: string, params: any = {}): string {
    // Normaliser les paramètres pour générer une clé cohérente
    const normalizedParams = JSON.stringify(params, (key, value) => {
        // Trier les tableaux pour assurer une clé cohérente
        if (Array.isArray(value)) {
            return [...value].sort();
        }
        return value;
    });

    return `${model}.${operation}:${normalizedParams}`;
}

/**
 * Client Prisma amélioré avec cache intégré
 */
export function createCachedPrismaClient() {
    // Ne créer le client que côté serveur
    if (!isServer) {
        logger.warn('Tentative de création du client Prisma côté navigateur. Cette opération est ignorée.');
        return null;
    }

    const prisma = prisma;
    const cache = prismaCacheClient;

    if (!cache) {
        logger.warn('Cache non initialisé. Le client Prisma sera utilisé sans cache.');
        return prisma;
    }

    // Wrap des méthodes de requête pour ajouter le cache
    // Note: c'est une première implémentation, à étendre/améliorer
    // pour couvrir toutes les méthodes Prisma pertinentes

    // Exemple pour findUnique, findFirst et findMany
    const modelNames = Object.keys(prisma).filter(key => !key.startsWith('_') && key !== '$connect' && key !== '$disconnect');

    for (const modelName of modelNames) {
        const model = (prisma as any)[modelName];
        if (!model) continue;

        // Intercepter findMany avec cache
        if (typeof model.findMany === 'function') {
            const originalFindMany = model.findMany;
            model.findMany = async function (params: unknown) {
                const cacheKey = createCacheKey(modelName, 'findMany', params);
                const cachedResult = prismaCache.get(cacheKey);

                if (cachedResult !== null) {
                    return cachedResult;
                }

                const result = await originalFindMany.call(this, params);
                prismaCache.set(cacheKey, result);
                return result;
            };
        }

        // Intercepter findUnique avec cache
        if (typeof model.findUnique === 'function') {
            const originalFindUnique = model.findUnique;
            model.findUnique = async function (params: unknown) {
                const cacheKey = createCacheKey(modelName, 'findUnique', params);
                const cachedResult = prismaCache.get(cacheKey);

                if (cachedResult !== null) {
                    return cachedResult;
                }

                const result = await originalFindUnique.call(this, params);
                prismaCache.set(cacheKey, result);
                return result;
            };
        }

        // Intercepter findFirst avec cache
        if (typeof model.findFirst === 'function') {
            const originalFindFirst = model.findFirst;
            model.findFirst = async function (params: unknown) {
                const cacheKey = createCacheKey(modelName, 'findFirst', params);
                const cachedResult = prismaCache.get(cacheKey);

                if (cachedResult !== null) {
                    return cachedResult;
                }

                const result = await originalFindFirst.call(this, params);
                prismaCache.set(cacheKey, result);
                return result;
            };
        }

        // Intercepter count avec cache
        if (typeof model.count === 'function') {
            const originalCount = model.count;
            model.count = async function (params: unknown) {
                const cacheKey = createCacheKey(modelName, 'count', params);
                const cachedResult = prismaCache.get(cacheKey);

                if (cachedResult !== null) {
                    return cachedResult;
                }

                const result = await originalCount.call(this, params);
                prismaCache.set(cacheKey, result);
                return result;
            };
        }

        // Intercepter les mutations pour invalider le cache automatiquement
        const mutations = ['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany'];

        for (const mutation of mutations) {
            if (typeof model[mutation] === 'function') {
                const originalMutation = model[mutation];
                model[mutation] = async function (params: unknown) {
                    // Exécuter la mutation
                    const result = await originalMutation.call(this, params);

                    // Invalider toutes les entrées liées à ce template
                    cache.invalidateCache(modelName);

                    return result;
                };
            }
        }
    }

    // Ajouter une méthode pour accéder aux stats du cache
    (prisma as any).$cacheStats = () => cache.getCacheStats();

    // Retourner le client amélioré
    return prisma;
}

// Exporter une instance unique du client Prisma avec cache
export const cachedPrisma = isServer ? createCachedPrismaClient() : null; 