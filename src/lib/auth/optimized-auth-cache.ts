import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';

// Optimized cache TTL - align with token lifetime for better efficiency
const CACHE_TTL = 60 * 60; // 1 hour (was 5 minutes)
const USER_CACHE_TTL = 30 * 60; // 30 minutes for user data

// Memory cache with automatic cleanup
class OptimizedMemoryCache {
  private cache = new Map<string, { data: unknown; expiry: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  set(key: string, data: unknown, ttl: number) {
    const expiry = Date.now() + (ttl * 1000);
    this.cache.set(key, { data, expiry });
  }

  get(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (entry.expiry > Date.now()) {
      return entry.data;
    }
    
    // Clean up expired entry
    this.cache.delete(key);
    return null;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry <= now) {
        this.cache.delete(key);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

const memoryCache = new OptimizedMemoryCache();

// Hash token for shorter cache keys
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex').substring(0, 16);
}

export const OptimizedAuthCache = {
  async cacheAuthToken(token: string, payload: unknown): Promise<void> {
    try {
      // Use hashed token for shorter key
      const key = `auth:t:${hashToken(token)}`;
      
      if (redis) {
        // Use pipeline for better performance
        const pipeline = redis.pipeline();
        pipeline.setex(key, CACHE_TTL, JSON.stringify(payload));
        
        // Also cache by userId for quick user lookups
        if (payload && typeof payload === 'object' && 'userId' in payload) {
          const userKey = `auth:u:${payload.userId}`;
          pipeline.setex(userKey, USER_CACHE_TTL, JSON.stringify(payload));
        }
        
        await pipeline.exec();
      } else {
        memoryCache.set(key, payload, CACHE_TTL);
        
        // Also cache by userId in memory
        if (payload && typeof payload === 'object' && 'userId' in payload) {
          const userKey = `auth:u:${payload.userId}`;
          memoryCache.set(userKey, payload, USER_CACHE_TTL);
        }
      }
    } catch (error: unknown) {
      logger.warn('Failed to cache auth token', { error });
      // Fallback to memory cache
      const key = `auth:t:${hashToken(token)}`;
      memoryCache.set(key, payload, CACHE_TTL);
    }
  },

  async getCachedAuthToken(token: string): Promise<any | null> {
    try {
      const key = `auth:t:${hashToken(token)}`;
      
      if (redis) {
        const cached = await redis.get(key);
        if (cached) {
          // Refresh TTL on access
          redis.expire(key, CACHE_TTL).catch(() => {});
          return JSON.parse(cached);
        }
      } else {
        const cached = memoryCache.get(key);
        if (cached) return cached;
      }
      
      return null;
    } catch (error: unknown) {
      logger.warn('Failed to get cached auth token', { error });
      // Try memory cache as fallback
      const key = `auth:t:${hashToken(token)}`;
      return memoryCache.get(key);
    }
  },

  async getCachedUserById(userId: string | number): Promise<any | null> {
    try {
      const key = `auth:u:${userId}`;
      
      if (redis) {
        const cached = await redis.get(key);
        if (cached) {
          // Refresh TTL on access
          redis.expire(key, USER_CACHE_TTL).catch(() => {});
          return JSON.parse(cached);
        }
      } else {
        const cached = memoryCache.get(key);
        if (cached) return cached;
      }
      
      return null;
    } catch (error: unknown) {
      logger.warn('Failed to get cached user by ID', { error });
      return null;
    }
  },

  async invalidateAuthToken(token: string): Promise<void> {
    try {
      const key = `auth:t:${hashToken(token)}`;
      
      if (redis) {
        await redis.del(key);
      } else {
        memoryCache.delete(key);
      }
    } catch (error: unknown) {
      logger.warn('Failed to invalidate auth token', { error });
      memoryCache.delete(`auth:t:${hashToken(token)}`);
    }
  },

  async invalidateUser(userId: string | number): Promise<void> {
    try {
      const userKey = `auth:u:${userId}`;
      
      if (redis) {
        // Also invalidate all tokens for this user
        const keys = await redis.keys(`auth:t:*`);
        const pipeline = redis.pipeline();
        
        // Check each token to see if it belongs to this user
        for (const key of keys) {
          const cached = await redis.get(key);
          if (cached) {
            const data = JSON.parse(cached);
            if (data.userId === userId) {
              pipeline.del(key);
            }
          }
        }
        
        pipeline.del(userKey);
        await pipeline.exec();
      } else {
        memoryCache.delete(userKey);
      }
    } catch (error: unknown) {
      logger.warn('Failed to invalidate user cache', { error });
    }
  },

  // Warm cache for frequently accessed users
  async warmCache(userIds: (string | number)[]): Promise<void> {
    if (!redis || userIds.length === 0) return;
    
    try {
      const pipeline = redis.pipeline();
      
      for (const userId of userIds) {
        const key = `auth:u:${userId}`;
        pipeline.get(key);
      }
      
      const results = await pipeline.exec();
      logger.info(`Warmed cache for ${userIds.length} users`);
    } catch (error: unknown) {
      logger.warn('Failed to warm cache', { error });
    }
  },

  async getStats(): Promise<{ redisKeys: number; memoryKeys: number }> {
    let redisKeys = 0;
    
    if (redis) {
      try {
        const keys = await redis.keys('auth:*');
        redisKeys = keys.length;
      } catch (error) {
        logger.warn('Failed to get Redis stats', { error });
      }
    }
    
    return {
      redisKeys,
      memoryKeys: memoryCache.cache.size
    };
  }
};