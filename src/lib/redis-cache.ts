import Redis from 'ioredis';

import { logger } from "./logger";
// Configuration Redis optimisée pour performance
const REDIS_CONFIG = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    family: 4,
    connectTimeout: 5000,
    commandTimeout: 3000,
};

// Cache TTL configurations (en secondes)
export const CACHE_TTL = {
    AUTH_TOKEN: 300, // 5 minutes
    USER_PROFILE: 600, // 10 minutes
    USER_PERMISSIONS: 1800, // 30 minutes
    PLANNING_DATA: 300, // 5 minutes
    LEAVES_DATA: 600, // 10 minutes
    SETTINGS: 3600, // 1 heure
    STATIC_DATA: 86400, // 24 heures
    SESSION: 1800, // 30 minutes
} as const;

// Cache key prefixes
const CACHE_KEYS = {
    AUTH: 'auth',
    USER: 'user',
    PLANNING: 'planning',
    LEAVES: 'leaves',
    SETTINGS: 'settings',
    API: 'api',
    SESSION: 'session',
} as const;

class RedisCacheService {
    private client: Redis | null = null;
    private fallbackCache = new Map<string, { data: any; expires: number }>();
    private isConnected = false;
    private connectionPromise: Promise<void> | null = null;

    constructor() {
        // Désactivé Redis en développement pour éviter les erreurs
        if (process.env.NODE_ENV === 'development') {
            logger.warn('Redis désactivé en mode développement - utilisation du cache mémoire');
            this.isConnected = false;
        } else {
            this.initializeClient();
        }
    }

    private async initializeClient(): Promise<void> {
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = this.connectRedis();
        return this.connectionPromise;
    }

    private async connectRedis(): Promise<void> {
        try {
            this.client = new Redis(REDIS_CONFIG);

            this.client.on('connect', () => {
                logger.info('✅ Redis connected');
                this.isConnected = true;
            });

            this.client.on('error', (error) => {
                logger.warn('⚠️ Redis connection error:', error.message);
                this.isConnected = false;
            });

            this.client.on('close', () => {
                logger.info('📴 Redis connection closed');
                this.isConnected = false;
            });

            // Test connection
            await this.client.ping();
            this.isConnected = true;

        } catch (error) {
            logger.warn('⚠️ Redis initialization failed, using fallback cache:', error);
            this.client = null;
            this.isConnected = false;
        }
    }

    // Méthodes principales du cache
    async get<T>(key: string): Promise<T | null> {
        try {
            if (this.isConnected && this.client) {
                const result = await this.client.get(key);
                return result ? JSON.parse(result) : null;
            }
            
            // Fallback vers cache mémoire
            return this.getFallback<T>(key);
        } catch (error) {
            logger.warn(`Cache get error for key ${key}:`, error);
            return this.getFallback<T>(key);
        }
    }

    async set(key: string, value: any, ttl: number = CACHE_TTL.STATIC_DATA): Promise<boolean> {
        try {
            if (this.isConnected && this.client) {
                await this.client.setex(key, ttl, JSON.stringify(value));
                return true;
            }
            
            // Fallback vers cache mémoire
            this.setFallback(key, value, ttl);
            return true;
        } catch (error) {
            logger.warn(`Cache set error for key ${key}:`, error);
            this.setFallback(key, value, ttl);
            return false;
        }
    }

    async del(key: string): Promise<boolean> {
        try {
            if (this.isConnected && this.client) {
                await this.client.del(key);
            }
            
            this.fallbackCache.delete(key);
            return true;
        } catch (error) {
            logger.warn(`Cache delete error for key ${key}:`, error);
            return false;
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            if (this.isConnected && this.client) {
                const result = await this.client.exists(key);
                return result === 1;
            }
            
            return this.fallbackCache.has(key) && 
                   this.fallbackCache.get(key)!.expires > Date.now();
        } catch (error) {
            logger.warn(`Cache exists error for key ${key}:`, error);
            return false;
        }
    }

    async flush(): Promise<void> {
        try {
            if (this.isConnected && this.client) {
                await this.client.flushdb();
            }
            
            this.fallbackCache.clear();
        } catch (error) {
            logger.warn('Cache flush error:', error);
        }
    }

    // Cache helpers pour auth
    async cacheAuthToken(userId: string, token: string): Promise<void> {
        const key = this.buildKey(CACHE_KEYS.AUTH, `token:${userId}`);
        await this.set(key, { token, userId, cachedAt: Date.now() }, CACHE_TTL.AUTH_TOKEN);
    }

    async getAuthToken(userId: string): Promise<string | null> {
        const key = this.buildKey(CACHE_KEYS.AUTH, `token:${userId}`);
        const cached = await this.get<{ token: string; userId: string; cachedAt: number }>(key);
        return cached?.token || null;
    }

    async invalidateAuthToken(userId: string): Promise<void> {
        const key = this.buildKey(CACHE_KEYS.AUTH, `token:${userId}`);
        await this.del(key);
    }

    // Cache helpers pour users
    async cacheUserProfile(userId: string, profile: any): Promise<void> {
        const key = this.buildKey(CACHE_KEYS.USER, `profile:${userId}`);
        await this.set(key, { ...profile, cachedAt: Date.now() }, CACHE_TTL.USER_PROFILE);
    }

    async getUserProfile(userId: string): Promise<any | null> {
        const key = this.buildKey(CACHE_KEYS.USER, `profile:${userId}`);
        return await this.get(key);
    }

    async invalidateUserProfile(userId: string): Promise<void> {
        const key = this.buildKey(CACHE_KEYS.USER, `profile:${userId}`);
        await this.del(key);
    }

    // Cache helpers pour permissions
    async cacheUserPermissions(userId: string, permissions: string[]): Promise<void> {
        const key = this.buildKey(CACHE_KEYS.USER, `permissions:${userId}`);
        await this.set(key, { permissions, cachedAt: Date.now() }, CACHE_TTL.USER_PERMISSIONS);
    }

    async getUserPermissions(userId: string): Promise<string[] | null> {
        const key = this.buildKey(CACHE_KEYS.USER, `permissions:${userId}`);
        const cached = await this.get<{ permissions: string[]; cachedAt: number }>(key);
        return cached?.permissions || null;
    }

    // Cache helpers pour planning
    async cachePlanningData(planningId: string, data: any): Promise<void> {
        const key = this.buildKey(CACHE_KEYS.PLANNING, `data:${planningId}`);
        await this.set(key, { ...data, cachedAt: Date.now() }, CACHE_TTL.PLANNING_DATA);
    }

    async getPlanningData(planningId: string): Promise<any | null> {
        const key = this.buildKey(CACHE_KEYS.PLANNING, `data:${planningId}`);
        return await this.get(key);
    }

    async invalidatePlanningData(planningId: string): Promise<void> {
        const key = this.buildKey(CACHE_KEYS.PLANNING, `data:${planningId}`);
        await this.del(key);
    }

    // Cache helpers pour API responses
    async cacheApiResponse(endpoint: string, params: any, response: any, ttl: number = 300): Promise<void> {
        const cacheKey = this.buildApiKey(endpoint, params);
        await this.set(cacheKey, { response, cachedAt: Date.now() }, ttl);
    }

    async getApiResponse(endpoint: string, params: any): Promise<any | null> {
        const cacheKey = this.buildApiKey(endpoint, params);
        const cached = await this.get<{ response: any; cachedAt: number }>(cacheKey);
        return cached?.response || null;
    }

    // Cache warming - précharger les données critiques
    async warmCache(userId: string): Promise<void> {
        try {
            // Simuler le chargement des données critiques
            logger.info(`🔥 Warming cache for user ${userId}...`);
            
            // Ici on pourrait précharger :
            // - Profil utilisateur
            // - Permissions
            // - Planning récent
            // - Préférences
            
        } catch (error) {
            logger.warn('Cache warming failed:', error);
        }
    }

    // Cache statistics
    async getStats(): Promise<any> {
        try {
            if (this.isConnected && this.client) {
                const info = await this.client.info('memory');
                const keyspace = await this.client.info('keyspace');
                
                return {
                    connected: true,
                    memory: info,
                    keyspace,
                    fallbackCacheSize: this.fallbackCache.size
                };
            }
            
            return {
                connected: false,
                fallbackCacheSize: this.fallbackCache.size,
                mode: 'fallback'
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                fallbackCacheSize: this.fallbackCache.size
            };
        }
    }

    // Utilitaires privées
    private buildKey(prefix: string, suffix: string): string {
        return `mathilda:${prefix}:${suffix}`;
    }

    private buildApiKey(endpoint: string, params: any): string {
        const paramStr = JSON.stringify(params);
        const hash = this.simpleHash(paramStr);
        return this.buildKey(CACHE_KEYS.API, `${endpoint}:${hash}`);
    }

    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    private getFallback<T>(key: string): T | null {
        const cached = this.fallbackCache.get(key);
        if (cached && cached.expires > Date.now()) {
            return cached.data;
        }
        
        if (cached) {
            this.fallbackCache.delete(key);
        }
        
        return null;
    }

    private setFallback(key: string, value: any, ttl: number): void {
        const expires = Date.now() + (ttl * 1000);
        this.fallbackCache.set(key, { data: value, expires });
        
        // Limiter la taille du cache fallback
        if (this.fallbackCache.size > 1000) {
            const firstKey = this.fallbackCache.keys().next().value;
            this.fallbackCache.delete(firstKey);
        }
    }

    // Cleanup
    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            this.isConnected = false;
        }
    }
}

// Instance singleton
export const redisCache = new RedisCacheService();

// Hook pour React components
export function useCache() {
    return {
        get: redisCache.get.bind(redisCache),
        set: redisCache.set.bind(redisCache),
        del: redisCache.del.bind(redisCache),
        exists: redisCache.exists.bind(redisCache),
        cacheUserProfile: redisCache.cacheUserProfile.bind(redisCache),
        getUserProfile: redisCache.getUserProfile.bind(redisCache),
        getStats: redisCache.getStats.bind(redisCache),
    };
}

// Wrapper pour middleware API
export function withCache<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    generateKey: (...args: Parameters<T>) => string,
    ttl: number = 300
): T {
    return (async (...args: Parameters<T>) => {
        const cacheKey = generateKey(...args);
        
        // Vérifier le cache d'abord
        const cached = await redisCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        
        // Exécuter la fonction
        const result = await fn(...args);
        
        // Mettre en cache le résultat
        await redisCache.set(cacheKey, result, ttl);
        
        return result;
    }) as T;
}

export default redisCache;