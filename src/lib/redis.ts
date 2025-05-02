import Redis from 'ioredis';
import { logger } from './logger';

// Configuration Redis depuis les variables d'environnement
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_PREFIX = process.env.REDIS_PREFIX || 'mathilda:';
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';

// Création du client Redis
const redisInstance = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    db: REDIS_DB,
    password: REDIS_PASSWORD || undefined,
    keyPrefix: REDIS_PREFIX,
    retryStrategy: (times) => {
        // Stratégie de reconnexion exponentielle avec plafond à 30 secondes
        const delay = Math.min(times * 1000, 30000);
        logger.warn(`Tentative de reconnexion Redis dans ${delay}ms (tentative ${times})`);
        return delay;
    },
    enableOfflineQueue: true, // File d'attente quand Redis est déconnecté
    maxRetriesPerRequest: 3, // Limiter les tentatives par requête
});

// Gestion des événements de connexion
redisInstance.on('connect', () => {
    logger.info('Connecté au serveur Redis');
});

redisInstance.on('ready', () => {
    logger.info(`Serveur Redis prêt (${REDIS_HOST}:${REDIS_PORT}, DB ${REDIS_DB})`);
});

redisInstance.on('error', (error) => {
    logger.error('Erreur de connexion Redis:', error);
});

redisInstance.on('close', () => {
    logger.warn('Connexion Redis fermée');
});

redisInstance.on('reconnecting', () => {
    logger.warn('Tentative de reconnexion au serveur Redis...');
});

// Wrapper autour de Redis pour la gestion du mode désactivé
type RedisOperation = (...args: any[]) => Promise<any>;

class RedisCacheClient {
    private client: Redis.Redis;
    private enabled: boolean;

    constructor(client: Redis.Redis, enabled: boolean = true) {
        this.client = client;
        this.enabled = enabled;
    }

    /**
     * Active ou désactive le cache
     */
    setEnabled(value: boolean): void {
        this.enabled = value;
        logger.info(`Cache Redis ${value ? 'activé' : 'désactivé'}`);
    }

    /**
     * Indique si le cache est activé
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Wrapper pour toutes les opérations Redis
     * Vérifie si le cache est activé avant d'exécuter la commande
     */
    private async executeIfEnabled<T>(operation: RedisOperation, ...args: any[]): Promise<T | null> {
        if (!this.enabled) {
            return null;
        }

        try {
            return await operation.apply(this.client, args);
        } catch (error) {
            logger.error(`Erreur Redis pour l'opération ${operation.name}:`, error);
            return null;
        }
    }

    // Implémentation des méthodes Redis couramment utilisées pour le cache

    async get(key: string): Promise<string | null> {
        return this.executeIfEnabled(this.client.get as RedisOperation, key);
    }

    async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK' | null> {
        return this.executeIfEnabled(this.client.set as RedisOperation, key, value, mode, duration);
    }

    async del(...keys: string[]): Promise<number | null> {
        return this.executeIfEnabled(this.client.del as RedisOperation, ...keys);
    }

    async scan(cursor: string, ...args: any[]): Promise<[string, string[]] | null> {
        return this.executeIfEnabled(this.client.scan as RedisOperation, cursor, ...args);
    }

    async keys(pattern: string): Promise<string[] | null> {
        return this.executeIfEnabled(this.client.keys as RedisOperation, pattern);
    }

    async ttl(key: string): Promise<number | null> {
        return this.executeIfEnabled(this.client.ttl as RedisOperation, key);
    }

    async expire(key: string, seconds: number): Promise<number | null> {
        return this.executeIfEnabled(this.client.expire as RedisOperation, key, seconds);
    }

    async flushdb(): Promise<'OK' | null> {
        return this.executeIfEnabled(this.client.flushdb as RedisOperation);
    }

    async info(): Promise<string | null> {
        return this.executeIfEnabled(this.client.info as RedisOperation);
    }

    /**
     * Vérifie si la connexion Redis est disponible
     */
    async ping(): Promise<boolean> {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        } catch (error) {
            logger.error('Erreur lors du ping Redis:', error);
            return false;
        }
    }
}

// Exporter le client Redis avec gestion du mode désactivé
export const redis = new RedisCacheClient(redisInstance, REDIS_ENABLED);

// Pour les tests ou les usages directs
export const redisClient = redis;

// Pour typehint
export type RedisClient = RedisCacheClient; 