/**
 * Redis Client Optimisé - Phase 2
 * Compatible avec Node.js Runtime, Edge Runtime et Tests
 */

import { logger } from './logger';
import { isFeatureAvailable, ifRuntimeSupports, DYNAMIC_IMPORTS } from './runtime-detector';

// Types pour Redis
interface RedisConfig {
    host: string;
    port: number;
    db: number;
    password?: string;
    keyPrefix: string;
    retryStrategy?: (times: number) => number | void | null;
    enableOfflineQueue?: boolean;
    maxRetriesPerRequest?: number;
}

interface RedisClientInterface {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, mode?: string, duration?: number): Promise<'OK' | null>;
    setex(key: string, seconds: number, value: string): Promise<'OK' | null>;
    del(...keys: string[]): Promise<number | null>;
    hget(key: string, field: string): Promise<string | null>;
    hset(key: string, field: string, value: string): Promise<number | null>;
    hmset(key: string, data: Record<string, any>): Promise<'OK' | null>;
    hgetall(key: string): Promise<Record<string, string> | null>;
    keys(pattern: string): Promise<string[] | null>;
    ttl(key: string): Promise<number | null>;
    expire(key: string, seconds: number): Promise<number | null>;
    flushdb(): Promise<'OK' | null>;
    ping(): Promise<string | null>;
    disconnect(): Promise<void>;
}

// Configuration Redis depuis les variables d'environnement
const getRedisConfig = (): RedisConfig => ({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    db: parseInt(process.env.REDIS_DB || '0', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    keyPrefix: process.env.REDIS_PREFIX || 'mathilda:',
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 1000, 30000);
        logger.warn(`Tentative de reconnexion Redis dans ${delay}ms (tentative ${times})`);
        return delay;
    },
    enableOfflineQueue: true,
    maxRetriesPerRequest: 3,
});

/**
 * Client Redis avec fallback en mémoire pour tests et Edge Runtime
 */
class OptimizedRedisClient implements RedisClientInterface {
    private client: any = null;
    private fallbackCache = new Map<string, { value: any; expires?: number }>();
    private isConnected = false;
    private readonly enabled: boolean;

    constructor() {
        this.enabled = isFeatureAvailable('redis');
        this.initializeClient();
    }

    private async initializeClient(): Promise<void> {
        if (!this.enabled) {
            logger.info('🔄 Redis désactivé - utilisation du cache mémoire');
            return;
        }

        try {
            const Redis = await DYNAMIC_IMPORTS.redis();
            if (!Redis) {
                throw new Error('Redis module non disponible');
            }

            const RedisClass = (Redis as any).default || Redis;
            const config = getRedisConfig();

            this.client = new RedisClass(config as Record<string, any>);

            this.client.on('connect', () => {
                logger.info('✅ Redis connecté');
                this.isConnected = true;
            });

            this.client.on('error', (error: any) => {
                logger.error('❌ Erreur Redis:', error);
                this.isConnected = false;
            });

            this.client.on('close', () => {
                logger.warn('📴 Connexion Redis fermée');
                this.isConnected = false;
            });

        } catch (error) {
            logger.warn('⚠️ Impossible d\'initialiser Redis, utilisation du fallback:', error);
            this.client = null;
        }
    }

    private async executeOperation<T>(
        operation: string,
        redisOp: () => Promise<T>,
        fallbackOp?: () => T | null
    ): Promise<T | null> {
        // Si Redis est disponible et connecté
        if (this.client && this.isConnected) {
            try {
                return await redisOp();
            } catch (error) {
                logger.error(`Erreur Redis ${operation}:`, error);
                // Fallback vers le cache mémoire en cas d'erreur
            }
        }

        // Fallback vers cache mémoire
        if (fallbackOp) {
            return fallbackOp();
        }

        return null;
    }

    // Méthodes de fallback pour cache mémoire
    private memoryGet(key: string): string | null {
        const entry = this.fallbackCache.get(key);
        if (!entry) return null;

        if (entry.expires && Date.now() > entry.expires) {
            this.fallbackCache.delete(key);
            return null;
        }

        return entry.value;
    }

    private memorySet(key: string, value: string, ttlSeconds?: number): 'OK' {
        const expires = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
        this.fallbackCache.set(key, { value, expires });
        return 'OK';
    }

    private memoryDel(...keys: string[]): number {
        let deleted = 0;
        keys.forEach(key => {
            if (this.fallbackCache.delete(key)) {
                deleted++;
            }
        });
        return deleted;
    }

    // Interface publique
    async get(key: string): Promise<string | null> {
        return this.executeOperation(
            'GET',
            () => this.client.get(key),
            () => this.memoryGet(key)
        );
    }

    async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK' | null> {
        return this.executeOperation(
            'SET',
            () => {
                if (mode && duration) {
                    return this.client.set(key, value, mode, duration);
                }
                return this.client.set(key, value);
            },
            () => this.memorySet(key, value, mode === 'EX' ? duration : undefined)
        );
    }

    async setex(key: string, seconds: number, value: string): Promise<'OK' | null> {
        return this.executeOperation(
            'SETEX',
            () => this.client.setex(key, seconds, value),
            () => this.memorySet(key, value, seconds)
        );
    }

    async del(...keys: string[]): Promise<number | null> {
        return this.executeOperation(
            'DEL',
            () => this.client.del(...keys),
            () => this.memoryDel(...keys)
        );
    }

    async hget(key: string, field: string): Promise<string | null> {
        return this.executeOperation(
            'HGET',
            () => this.client.hget(key, field),
            () => {
                const hash = this.fallbackCache.get(key);
                return hash?.value?.[field] || null;
            }
        );
    }

    async hset(key: string, field: string, value: string): Promise<number | null> {
        return this.executeOperation(
            'HSET',
            () => this.client.hset(key, field, value),
            () => {
                const existing = this.fallbackCache.get(key);
                const hash = existing?.value || {};
                hash[field] = value;
                this.fallbackCache.set(key, { value: hash });
                return 1;
            }
        );
    }

    async hmset(key: string, data: Record<string, any>): Promise<'OK' | null> {
        return this.executeOperation(
            'HMSET',
            () => this.client.hmset(key, data as Record<string, any>),
            () => {
                this.fallbackCache.set(key, { value: data });
                return 'OK';
            }
        );
    }

    async hgetall(key: string): Promise<Record<string, string> | null> {
        return this.executeOperation(
            'HGETALL',
            () => this.client.hgetall(key),
            () => {
                const hash = this.fallbackCache.get(key);
                return hash?.value || null;
            }
        );
    }

    async keys(pattern: string): Promise<string[] | null> {
        return this.executeOperation(
            'KEYS',
            () => this.client.keys(pattern),
            () => {
                // Simple pattern matching pour le fallback
                const keys = Array.from(this.fallbackCache.keys());
                if (pattern === '*') return keys;
                return keys.filter(key => key.includes(pattern.replace('*', '')));
            }
        );
    }

    async ttl(key: string): Promise<number | null> {
        return this.executeOperation(
            'TTL',
            () => this.client.ttl(key),
            () => {
                const entry = this.fallbackCache.get(key);
                if (!entry || !entry.expires) return -1;
                const remaining = Math.ceil((entry.expires - Date.now()) / 1000);
                return remaining > 0 ? remaining : -2;
            }
        );
    }

    async expire(key: string, seconds: number): Promise<number | null> {
        return this.executeOperation(
            'EXPIRE',
            () => this.client.expire(key, seconds),
            () => {
                const entry = this.fallbackCache.get(key);
                if (!entry) return 0;
                entry.expires = Date.now() + (seconds * 1000);
                return 1;
            }
        );
    }

    async flushdb(): Promise<'OK' | null> {
        return this.executeOperation(
            'FLUSHDB',
            () => this.client.flushdb(),
            () => {
                this.fallbackCache.clear();
                return 'OK';
            }
        );
    }

    async ping(): Promise<string | null> {
        if (this.client && this.isConnected) {
            try {
                return await this.client.ping();
            } catch {
                return null;
            }
        }
        return 'PONG'; // Fallback pour les tests
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            try {
                await this.client.disconnect();
            } catch (error) {
                logger.warn('Erreur lors de la déconnexion Redis:', error);
            }
        }
        this.fallbackCache.clear();
    }

    // Méthodes utilitaires
    isRedisConnected(): boolean {
        return this.isConnected;
    }

    getFallbackCacheSize(): number {
        return this.fallbackCache.size;
    }

    getConnectionInfo(): object {
        return {
            enabled: this.enabled,
            connected: this.isConnected,
            fallbackCacheSize: this.getFallbackCacheSize(),
            client: this.client ? 'redis' : 'memory'
        };
    }
}

// Instance singleton
let redisClientInstance: OptimizedRedisClient | null = null;

export function getRedisClient(): OptimizedRedisClient {
    if (!redisClientInstance) {
        redisClientInstance = new OptimizedRedisClient();
    }
    return redisClientInstance;
}

// Export du client par défaut
export const redis = getRedisClient();

// Types exports
export type { RedisClientInterface, RedisConfig };
export { OptimizedRedisClient }; 