import { prisma as prismaInstance } from '@/lib/prisma';
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

// Utiliser l'instance importée
const prisma = prismaInstance;

// Intercepter les requêtes Prisma pour mettre en cache les résultats
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
            console.log(`[PrismaCache] Invalidating ${keys.length} keys for model ${params.model}`);
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
            console.log(`[PrismaCache] Cache hit: ${cacheKey}`);
            return cachedData;
        }

        // Si pas dans le cache, exécuter la requête
        console.log(`[PrismaCache] Cache miss: ${cacheKey}`);
        const result = await next(params);

        // Stocker le résultat dans le cache
        cache.set(cacheKey, result);
        return result;
    }

    // Pour toutes les autres opérations, passer au middleware suivant
    return next(params);
});

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
        console.log('[PrismaCache] Invalidating entire cache');
        cache.flushAll();
    },

    // Invalider le cache pour un template spécifique
    invalidateModel: (modelName: string) => {
        const keys = cache.keys().filter((key) => key.startsWith(`${modelName}:`));
        console.log(`[PrismaCache] Invalidating ${keys.length} keys for model ${modelName}`);
        keys.forEach((key) => cache.del(key));
    },

    // Invalider une clé spécifique
    invalidateKey: (key: string) => {
        console.log(`[PrismaCache] Invalidating specific key: ${key}`);
        cache.del(key);
    }
};

export { prisma }; 