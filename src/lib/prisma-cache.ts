import { PrismaClient } from '@prisma/client';

// Typage pour les entrées de cache
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

// Interface publique du service de cache
export interface PrismaCacheService {
    get<T>(key: string): T | null;
    set<T>(key: string, data: T, ttl?: number): void;
    invalidate(key: string): void;
    invalidateByPattern(pattern: string): void;
    clear(): void;
    stats(): CacheStats;
}

// Statistiques du cache
interface CacheStats {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
}

/**
 * Service de cache pour les requêtes Prisma
 * Permet de mettre en cache les résultats des requêtes fréquentes
 * avec un TTL configurable et une invalidation sélective
 */
export class PrismaCache implements PrismaCacheService {
    private cache: Map<string, CacheEntry<any>>;
    private hits: number;
    private misses: number;
    private DEFAULT_TTL: number;
    private cleanupInterval: NodeJS.Timeout | null;

    constructor(options?: { defaultTTL?: number; cleanupInterval?: number }) {
        this.cache = new Map();
        this.hits = 0;
        this.misses = 0;
        this.DEFAULT_TTL = options?.defaultTTL || 5 * 60 * 1000; // 5 minutes par défaut
        this.cleanupInterval = null;

        // Planifier le nettoyage périodique du cache
        const interval = options?.cleanupInterval || 10 * 60 * 1000; // 10 minutes par défaut
        this.cleanupInterval = setInterval(() => this.cleanup(), interval);
    }

    /**
     * Récupère une entrée du cache
     * @param key Clé du cache
     * @returns Les données en cache ou null si non trouvées/expirées
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        const now = Date.now();

        if (!entry) {
            this.misses++;
            return null;
        }

        // Vérifier si l'entrée a expiré
        if (now > entry.expiresAt) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }

        this.hits++;
        return entry.data;
    }

    /**
     * Définit une entrée dans le cache
     * @param key Clé du cache
     * @param data Données à mettre en cache
     * @param ttl Durée de vie en millisecondes (valeur par défaut sinon)
     */
    set<T>(key: string, data: T, ttl?: number): void {
        const now = Date.now();
        const expiresAt = now + (ttl || this.DEFAULT_TTL);

        this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt
        });
    }

    /**
     * Invalide une entrée spécifique du cache
     * @param key Clé à invalider
     */
    invalidate(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Invalide toutes les entrées correspondant à un motif
     * @param pattern Motif à rechercher dans les clés
     */
    invalidateByPattern(pattern: string): void {
        const regex = new RegExp(pattern);
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Vide complètement le cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Nettoie les entrées expirées du cache
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Retourne les statistiques actuelles du cache
     */
    stats(): CacheStats {
        const totalRequests = this.hits + this.misses;
        return {
            size: this.cache.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: totalRequests > 0 ? this.hits / totalRequests : 0
        };
    }

    /**
     * Libère les ressources utilisées par le cache
     */
    dispose(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// Singleton du cache
export const prismaCache = new PrismaCache({
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    cleanupInterval: 10 * 60 * 1000 // 10 minutes
});

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
    const prisma = new PrismaClient();
    const cache = prismaCache;

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
            model.findMany = async function (params: any) {
                const cacheKey = createCacheKey(modelName, 'findMany', params);
                const cachedResult = cache.get(cacheKey);

                if (cachedResult !== null) {
                    return cachedResult;
                }

                const result = await originalFindMany.call(this, params);
                cache.set(cacheKey, result);
                return result;
            };
        }

        // Intercepter findUnique avec cache
        if (typeof model.findUnique === 'function') {
            const originalFindUnique = model.findUnique;
            model.findUnique = async function (params: any) {
                const cacheKey = createCacheKey(modelName, 'findUnique', params);
                const cachedResult = cache.get(cacheKey);

                if (cachedResult !== null) {
                    return cachedResult;
                }

                const result = await originalFindUnique.call(this, params);
                cache.set(cacheKey, result);
                return result;
            };
        }

        // Intercepter findFirst avec cache
        if (typeof model.findFirst === 'function') {
            const originalFindFirst = model.findFirst;
            model.findFirst = async function (params: any) {
                const cacheKey = createCacheKey(modelName, 'findFirst', params);
                const cachedResult = cache.get(cacheKey);

                if (cachedResult !== null) {
                    return cachedResult;
                }

                const result = await originalFindFirst.call(this, params);
                cache.set(cacheKey, result);
                return result;
            };
        }

        // Intercepter count avec cache
        if (typeof model.count === 'function') {
            const originalCount = model.count;
            model.count = async function (params: any) {
                const cacheKey = createCacheKey(modelName, 'count', params);
                const cachedResult = cache.get(cacheKey);

                if (cachedResult !== null) {
                    return cachedResult;
                }

                const result = await originalCount.call(this, params);
                cache.set(cacheKey, result);
                return result;
            };
        }

        // Intercepter les mutations pour invalider le cache automatiquement
        const mutations = ['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany'];

        for (const mutation of mutations) {
            if (typeof model[mutation] === 'function') {
                const originalMutation = model[mutation];
                model[mutation] = async function (params: any) {
                    // Exécuter la mutation
                    const result = await originalMutation.call(this, params);

                    // Invalider toutes les entrées liées à ce modèle
                    cache.invalidateByPattern(`^${modelName}\\.`);

                    return result;
                };
            }
        }
    }

    // Ajouter une méthode pour accéder aux stats du cache
    (prisma as any).$cacheStats = () => cache.stats();

    // Retourner le client amélioré
    return prisma;
}

// Exporter une instance unique du client Prisma avec cache
export const cachedPrisma = createCachedPrismaClient(); 