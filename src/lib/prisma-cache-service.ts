import { redis, CachePrefixes, CacheTTL } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';

export class PrismaCacheService {
    /**
     * Génère une clé de cache unique basée sur la requête
     */
    static generateCacheKey(model: string, operation: string, params: unknown): string {
        const paramsStr = JSON.stringify(params, Object.keys(params).sort());
        const hash = createHash('md5').update(paramsStr).digest('hex');
        return `${CachePrefixes.QUERY_RESULT}${model}:${operation}:${hash}`;
    }

    /**
     * Cache le résultat d'une requête
     */
    static async cacheQueryResult<T>(
        model: string, 
        operation: string, 
        params: unknown, 
        result: T, 
        ttl?: number
    ): Promise<void> {
        try {
            const key = this.generateCacheKey(model, operation, params);
            const cacheTTL = ttl || CacheTTL.QUERY_RESULT;
            
            await redis.setex(key, cacheTTL, JSON.stringify(result));
            logger.debug(`Query result cached: ${model}.${operation}`);
        } catch (error: unknown) {
            logger.error('Failed to cache query result:', error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Récupère le résultat d'une requête depuis le cache
     */
    static async getCachedQueryResult<T>(
        model: string, 
        operation: string, 
        params: unknown
    ): Promise<T | null> {
        try {
            const key = this.generateCacheKey(model, operation, params);
            const cached = await redis.get(key);
            
            if (!cached) return null;
            
            logger.debug(`Query result found in cache: ${model}.${operation}`);
            return JSON.parse(cached) as T;
        } catch (error: unknown) {
            logger.error('Failed to get cached query result:', error instanceof Error ? error : new Error(String(error)));
            return null;
        }
    }

    /**
     * Invalide le cache pour un template spécifique
     */
    static async invalidateModelCache(model: string): Promise<void> {
        try {
            const pattern = `${CachePrefixes.QUERY_RESULT}${model}:*`;
            const keys = await redis.keys(pattern);
            
            if (keys && keys.length > 0) {
                await redis.del(...keys);
                logger.debug(`Cache invalidated for model: ${model} (${keys.length} keys)`);
            }
        } catch (error: unknown) {
            logger.error('Failed to invalidate model cache:', error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Cache les données de planning
     */
    static async cachePlanningData(
        siteId: string, 
        date: string, 
        data: unknown, 
        ttl?: number
    ): Promise<void> {
        try {
            const key = `${CachePrefixes.PLANNING_DATA}${siteId}:${date}`;
            const cacheTTL = ttl || CacheTTL.PLANNING_DATA;
            
            await redis.setex(key, cacheTTL, JSON.stringify(data));
            logger.debug(`Planning data cached for site ${siteId} on ${date}`);
        } catch (error: unknown) {
            logger.error('Failed to cache planning data:', error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Récupère les données de planning depuis le cache
     */
    static async getCachedPlanningData(
        siteId: string, 
        date: string
    ): Promise<any | null> {
        try {
            const key = `${CachePrefixes.PLANNING_DATA}${siteId}:${date}`;
            const cached = await redis.get(key);
            
            if (!cached) return null;
            
            logger.debug(`Planning data found in cache for site ${siteId} on ${date}`);
            return JSON.parse(cached);
        } catch (error: unknown) {
            logger.error('Failed to get cached planning data:', error instanceof Error ? error : new Error(String(error)));
            return null;
        }
    }

    /**
     * Cache les données de secteur
     */
    static async cacheSectorData(sectorId: string, data: unknown): Promise<void> {
        try {
            const key = `${CachePrefixes.SECTOR_DATA}${sectorId}`;
            await redis.setex(key, CacheTTL.SECTOR_DATA, JSON.stringify(data));
            logger.debug(`Sector data cached for sector ${sectorId}`);
        } catch (error: unknown) {
            logger.error('Failed to cache sector data:', error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Récupère les données de secteur depuis le cache
     */
    static async getCachedSectorData(sectorId: string): Promise<any | null> {
        try {
            const key = `${CachePrefixes.SECTOR_DATA}${sectorId}`;
            const cached = await redis.get(key);
            
            if (!cached) return null;
            
            logger.debug(`Sector data found in cache for sector ${sectorId}`);
            return JSON.parse(cached);
        } catch (error: unknown) {
            logger.error('Failed to get cached sector data:', error instanceof Error ? error : new Error(String(error)));
            return null;
        }
    }

    /**
     * Cache les données de salle
     */
    static async cacheRoomData(roomId: string, data: unknown): Promise<void> {
        try {
            const key = `${CachePrefixes.ROOM_DATA}${roomId}`;
            await redis.setex(key, CacheTTL.ROOM_DATA, JSON.stringify(data));
            logger.debug(`Room data cached for room ${roomId}`);
        } catch (error: unknown) {
            logger.error('Failed to cache room data:', error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Récupère les données de salle depuis le cache
     */
    static async getCachedRoomData(roomId: string): Promise<any | null> {
        try {
            const key = `${CachePrefixes.ROOM_DATA}${roomId}`;
            const cached = await redis.get(key);
            
            if (!cached) return null;
            
            logger.debug(`Room data found in cache for room ${roomId}`);
            return JSON.parse(cached);
        } catch (error: unknown) {
            logger.error('Failed to get cached room data:', error instanceof Error ? error : new Error(String(error)));
            return null;
        }
    }

    /**
     * Cache le solde de congés d'un utilisateur
     */
    static async cacheLeaveBalance(userId: string, year: number, balance: unknown): Promise<void> {
        try {
            const key = `${CachePrefixes.LEAVE_BALANCE}${userId}:${year}`;
            await redis.setex(key, CacheTTL.LEAVE_BALANCE, JSON.stringify(balance));
            logger.debug(`Leave balance cached for user ${userId} year ${year}`);
        } catch (error: unknown) {
            logger.error('Failed to cache leave balance:', error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Récupère le solde de congés depuis le cache
     */
    static async getCachedLeaveBalance(userId: string, year: number): Promise<any | null> {
        try {
            const key = `${CachePrefixes.LEAVE_BALANCE}${userId}:${year}`;
            const cached = await redis.get(key);
            
            if (!cached) return null;
            
            logger.debug(`Leave balance found in cache for user ${userId} year ${year}`);
            return JSON.parse(cached);
        } catch (error: unknown) {
            logger.error('Failed to get cached leave balance:', error instanceof Error ? error : new Error(String(error)));
            return null;
        }
    }

    /**
     * Invalide le cache de balance pour un utilisateur
     */
    static async invalidateUserLeaveBalance(userId: string): Promise<void> {
        try {
            const pattern = `${CachePrefixes.LEAVE_BALANCE}${userId}:*`;
            const keys = await redis.keys(pattern);
            
            if (keys && keys.length > 0) {
                await redis.del(...keys);
                logger.debug(`Leave balance cache invalidated for user ${userId}`);
            }
        } catch (error: unknown) {
            logger.error('Failed to invalidate leave balance cache:', error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Récupère les statistiques du cache Prisma
     */
    static async getCacheStats(): Promise<{
        queries: number;
        planning: number;
        sectors: number;
        rooms: number;
        leaveBalances: number;
    }> {
        try {
            const [queryKeys, planningKeys, sectorKeys, roomKeys, balanceKeys] = await Promise.all([
                redis.keys(`${CachePrefixes.QUERY_RESULT}*`),
                redis.keys(`${CachePrefixes.PLANNING_DATA}*`),
                redis.keys(`${CachePrefixes.SECTOR_DATA}*`),
                redis.keys(`${CachePrefixes.ROOM_DATA}*`),
                redis.keys(`${CachePrefixes.LEAVE_BALANCE}*`),
            ]);

            return {
                queries: queryKeys?.length || 0,
                planning: planningKeys?.length || 0,
                sectors: sectorKeys?.length || 0,
                rooms: roomKeys?.length || 0,
                leaveBalances: balanceKeys?.length || 0,
            };
        } catch (error: unknown) {
            logger.error('Failed to get Prisma cache stats:', error instanceof Error ? error : new Error(String(error)));
            return { queries: 0, planning: 0, sectors: 0, rooms: 0, leaveBalances: 0 };
        }
    }
}