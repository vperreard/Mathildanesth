import { PrismaClient } from '@prisma/client';
import { logger } from "./logger";
import NodeCache from 'node-cache';

// Configuration du cache
const CACHE_TTL = 5 * 60; // 5 minutes en secondes
const CACHE_CHECK_PERIOD = 60; // Vérification d'expiration toutes les 60 secondes

// Création du cache
const cache = new NodeCache({
    stdTTL: CACHE_TTL,
    checkperiod: CACHE_CHECK_PERIOD,
    useClones: false,
});

// Détermine si le code s'exécute côté serveur
const isServer = typeof window === 'undefined';

// Déclare une variable globale pour stocker le client Prisma
declare global {
    // eslint-disable-next-line no-var
    var prismaClientCached: PrismaClient | undefined;
}

// Créer l'instance Prisma avec cache
let prisma: PrismaClient;

if (isServer) {
    if (process.env.NODE_ENV === 'development') {
        // En développement, utiliser une instance globale pour éviter les reconnexions
        prisma = global.prismaClientCached || new PrismaClient({
            log: ['query', 'error', 'warn'],
        });
        global.prismaClientCached = prisma;
    } else {
        // En production, créer une nouvelle instance
        prisma = new PrismaClient();
    }
} else {
    // Côté client, créer une instance factice
    prisma = {} as PrismaClient;
}

// Intercepter les requêtes Prisma pour mettre en cache les résultats (seulement côté serveur)
if (isServer && prisma.$use) {
    prisma.$use(async (params, next) => {
    // Ne pas mettre en cache les mutations (create, update, delete...)
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
            const keys = cache.keys().filter((key) => key.startsWith(`${params.model}:`));
            logger.info(`[PrismaCache] Invalidating ${keys.length} keys for model ${params.model}`);
            keys.forEach((key) => cache.del(key));
        }
        return next(params);
    }

    // Pour les opérations de lecture, vérifier le cache
    if (
        params.action === 'findUnique' ||
        params.action === 'findFirst' ||
        params.action === 'findMany'
    ) {
        // Générer une clé de cache basée sur le template, l'action et les arguments
        const cacheKey = `${params.model}:${params.action}:${JSON.stringify(params.args)}`;

        // Vérifier si les données sont dans le cache
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            logger.info(`[PrismaCache] Cache hit: ${cacheKey}`);
            return cachedData;
        }

        // Si pas dans le cache, exécuter la requête
        logger.info(`[PrismaCache] Cache miss: ${cacheKey}`);
        const result = await next(params);

        // Stocker le résultat dans le cache
        cache.set(cacheKey, result);
        return result;
    }

    // Pour toutes les autres opérations, passer au middleware suivant
    return next(params);
    });
}

// Ajouter des méthodes utilitaires au client Prisma
(prisma as any).$cache = {
    // Obtenir les statistiques du cache
    getStats: () => ({
        keys: cache.keys().length,
        hits: cache.getStats().hits,
        misses: cache.getStats().misses,
        ksize: cache.getStats().ksize,
        vsize: cache.getStats().vsize,
    }),

    // Invalider tout le cache
    invalidateAll: () => {
        logger.info('[PrismaCache] Invalidating entire cache');
        cache.flushAll();
    },

    // Invalider le cache pour un template spécifique
    invalidateModel: (modelName: string) => {
        const keys = cache.keys().filter((key) => key.startsWith(`${modelName}:`));
        logger.info(`[PrismaCache] Invalidating ${keys.length} keys for model ${modelName}`);
        keys.forEach((key) => cache.del(key));
    },

    // Invalider une clé spécifique
    invalidateKey: (key: string) => {
        logger.info(`[PrismaCache] Invalidating specific key: ${key}`);
        cache.del(key);
    }
};

export { prisma }; 