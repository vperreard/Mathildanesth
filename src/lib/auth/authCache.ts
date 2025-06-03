import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

const CACHE_TTL = 5 * 60; // 5 minutes

// Cache en mémoire comme fallback si Redis n'est pas disponible
const memoryCache = new Map<string, { data: any; expiry: number }>();

export const AuthCacheService = {
  async cacheAuthToken(token: string, payload: any): Promise<void> {
    try {
      const key = `auth:token:${token}`;
      
      if (redis) {
        await redis.setex(key, CACHE_TTL, JSON.stringify(payload));
      } else {
        // Fallback to memory cache
        const expiry = Date.now() + (CACHE_TTL * 1000);
        memoryCache.set(key, { data: payload, expiry });
        logger.info('Using memory cache for auth token');
      }
    } catch (error) {
      logger.warn('Failed to cache auth token', error);
      // Try memory cache as last resort
      const key = `auth:token:${token}`;
      const expiry = Date.now() + (CACHE_TTL * 1000);
      memoryCache.set(key, { data: payload, expiry });
    }
  },

  async getCachedAuthToken(token: string): Promise<any | null> {
    try {
      const key = `auth:token:${token}`;
      
      if (redis) {
        const cached = await redis.get(key);
        if (cached) {
          return JSON.parse(cached);
        }
      } else {
        // Fallback to memory cache
        const entry = memoryCache.get(key);
        if (entry && entry.expiry > Date.now()) {
          logger.info('Using memory cache for auth token retrieval');
          return entry.data;
        } else if (entry) {
          // Clean up expired entry
          memoryCache.delete(key);
        }
      }
      
      return null;
    } catch (error) {
      logger.warn('Failed to get cached auth token', error);
      // Try memory cache as last resort
      const key = `auth:token:${token}`;
      const entry = memoryCache.get(key);
      if (entry && entry.expiry > Date.now()) {
        return entry.data;
      }
      return null;
    }
  },

  async invalidateAuthToken(token: string): Promise<void> {
    try {
      if (!redis) return;
      
      const key = `auth:token:${token}`;
      await redis.del(key);
    } catch (error) {
      logger.warn('Failed to invalidate auth token', error);
    }
  },

  async cacheUserData(userId: string, userData: any): Promise<void> {
    try {
      if (!redis) return;
      
      const key = `auth:user:${userId}`;
      await redis.setex(key, CACHE_TTL, JSON.stringify(userData));
    } catch (error) {
      logger.warn('Failed to cache user data', error);
    }
  },

  async getCachedUserData(userId: string): Promise<any | null> {
    try {
      if (!redis) return null;
      
      const key = `auth:user:${userId}`;
      const cached = await redis.get(key);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      logger.warn('Failed to get cached user data', error);
      return null;
    }
  },

  async invalidateUserData(userId: string): Promise<void> {
    try {
      if (!redis) return;
      
      const key = `auth:user:${userId}`;
      await redis.del(key);
    } catch (error) {
      logger.warn('Failed to invalidate user data', error);
    }
  },

  async clearAllCaches(): Promise<void> {
    try {
      if (!redis) return;
      
      // Clear all auth-related caches
      const keys = await redis.keys('auth:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.warn('Failed to clear auth caches', error);
    }
  },
};