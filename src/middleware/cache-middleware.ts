import { NextRequest, NextResponse } from 'next/server';
import { redisCache, CACHE_TTL } from '@/lib/redis-cache';

// Configuration des routes cachables
const CACHEABLE_ROUTES = {
  // Routes API avec cache long
  '/api/auth/me': { ttl: CACHE_TTL.USER_PROFILE, vary: ['Authorization'] },
  '/api/utilisateurs': { ttl: CACHE_TTL.USER_PROFILE, vary: ['Authorization'] },
  '/api/planning': { ttl: CACHE_TTL.PLANNING_DATA, vary: ['Authorization', 'date'] },
  '/api/conges': { ttl: CACHE_TTL.LEAVES_DATA, vary: ['Authorization', 'status'] },
  '/api/sectors': { ttl: CACHE_TTL.STATIC_DATA, vary: [] },
  '/api/sites': { ttl: CACHE_TTL.STATIC_DATA, vary: [] },
  '/api/specialties': { ttl: CACHE_TTL.STATIC_DATA, vary: [] },

  // Routes statiques avec cache très long
  '/api/health': { ttl: 60, vary: [] },
  '/api/version': { ttl: 3600, vary: [] },
} as const;

// Routes qui invalident le cache
const CACHE_INVALIDATION_ROUTES = {
  '/api/auth/login': ['auth', 'user'],
  '/api/auth/logout': ['auth', 'user'],
  '/api/utilisateurs': ['user'],
  '/api/planning': ['planning'],
  '/api/conges': ['leaves'],
} as const;

interface CacheConfig {
  ttl: number;
  vary: string[];
}

export class ApiCacheMiddleware {
  static async handleRequest(request: NextRequest): Promise<NextResponse | null> {
    const { pathname } = request.nextUrl;
    const method = request.method;

    // Seuls les GET sont cachés
    if (method !== 'GET') {
      return null;
    }

    const cacheConfig = CACHEABLE_ROUTES[pathname as keyof typeof CACHEABLE_ROUTES];
    if (!cacheConfig) {
      return null;
    }

    try {
      const cacheKey = ApiCacheMiddleware.generateCacheKey(request, cacheConfig);
      const cached = await redisCache.get(cacheKey);

      if (cached) {
        console.log(`🎯 Cache HIT: ${pathname}`);

        return new NextResponse(JSON.stringify(cached), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey,
            'Cache-Control': `public, max-age=${cacheConfig.ttl}`,
          },
        });
      }

      console.log(`🔍 Cache MISS: ${pathname}`);
      return null; // Continue to API handler
    } catch (error) {
      console.warn('Cache middleware error:', error);
      return null; // Continue without cache
    }
  }

  static async handleResponse(request: NextRequest, response: NextResponse): Promise<NextResponse> {
    const { pathname } = request.nextUrl;
    const method = request.method;

    try {
      // Cache GET responses
      if (method === 'GET' && response.status === 200) {
        await ApiCacheMiddleware.cacheResponse(request, response);
      }

      // Invalidate cache for mutating operations
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        await ApiCacheMiddleware.invalidateCache(pathname);
      }

      return response;
    } catch (error) {
      console.warn('Cache response handling error:', error);
      return response;
    }
  }

  private static async cacheResponse(request: NextRequest, response: NextResponse): Promise<void> {
    const { pathname } = request.nextUrl;
    const cacheConfig = CACHEABLE_ROUTES[pathname as keyof typeof CACHEABLE_ROUTES];

    if (!cacheConfig) return;

    try {
      const responseClone = response.clone();
      const data = await responseClone.json();

      const cacheKey = ApiCacheMiddleware.generateCacheKey(request, cacheConfig);
      await redisCache.set(cacheKey, data, cacheConfig.ttl);

      console.log(`💾 Cached: ${pathname} for ${cacheConfig.ttl}s`);
    } catch (error) {
      console.warn('Failed to cache response:', error);
    }
  }

  private static async invalidateCache(pathname: string): Promise<void> {
    const invalidationKeys =
      CACHE_INVALIDATION_ROUTES[pathname as keyof typeof CACHE_INVALIDATION_ROUTES];

    if (!invalidationKeys) return;

    try {
      for (const keyPattern of invalidationKeys) {
        // Invalider tous les cache keys avec ce pattern
        await ApiCacheMiddleware.invalidateCachePattern(keyPattern);
      }

      console.log(`🗑️ Cache invalidated for: ${pathname}`);
    } catch (error) {
      console.warn('Cache invalidation error:', error);
    }
  }

  private static async invalidateCachePattern(pattern: string): Promise<void> {
    // Dans une vraie implémentation, on utiliserait SCAN pour trouver toutes les clés
    // Pour simplicité, on invalide les clés communes
    const commonKeys = [`mathilda:${pattern}:*`, `mathilda:api:*${pattern}*`];

    for (const key of commonKeys) {
      await redisCache.del(key);
    }
  }

  private static generateCacheKey(request: NextRequest, config: CacheConfig): string {
    const { pathname, searchParams } = request.nextUrl;

    // Base key
    let key = `api:${pathname}`;

    // Add query params
    const sortedParams = Array.from(searchParams.entries()).sort();
    if (sortedParams.length > 0) {
      const paramString = sortedParams.map(([k, v]) => `${k}=${v}`).join('&');
      key += `:${ApiCacheMiddleware.hash(paramString)}`;
    }

    // Add vary headers
    for (const header of config.vary) {
      const value = request.headers.get(header);
      if (value) {
        key += `:${header}=${ApiCacheMiddleware.hash(value)}`;
      }
    }

    return `mathilda:${key}`;
  }

  private static hash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

// Type pour les paramètres d'une fonction handler
type HandlerParams = [NextRequest, ...unknown[]];

// Fonction helper pour les API routes
export function withApiCache<T extends (...args: HandlerParams) => Promise<Response>>(
  handler: T,
  cacheConfig?: { ttl?: number; varyHeaders?: string[] }
): T {
  return (async (...args: HandlerParams) => {
    const request = args[0] as NextRequest;

    // Vérifier le cache si GET
    if (request.method === 'GET' && cacheConfig) {
      const cacheKey = `api:${request.nextUrl.pathname}:${Date.now()}`;
      const cached = await redisCache.get(cacheKey);

      if (cached) {
        return new Response(JSON.stringify(cached), {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
          },
        });
      }
    }

    // Exécuter le handler
    const response = await handler(...args);

    // Cache la réponse si succès
    if (request.method === 'GET' && response.status === 200 && cacheConfig) {
      try {
        const responseClone = response.clone();
        const data = await responseClone.json();
        const cacheKey = `api:${request.nextUrl.pathname}:${Date.now()}`;
        await redisCache.set(cacheKey, data, cacheConfig.ttl || 300);
      } catch (error) {
        console.warn('Failed to cache API response:', error);
      }
    }

    return response;
  }) as T;
}

// Cache warming pour les données critiques
export async function warmCriticalCache(): Promise<void> {
  try {
    console.log('🔥 Warming critical cache...');

    // Données statiques qui changent rarement
    const staticEndpoints = ['/api/sectors', '/api/sites', '/api/specialties', '/api/health'];

    for (const endpoint of staticEndpoints) {
      try {
        const response = await fetch(`http://localhost:3000${endpoint}`);
        if (response.ok) {
          const data = await response.json();
          await redisCache.set(`mathilda:api:${endpoint}`, data, CACHE_TTL.STATIC_DATA);
          console.log(`✅ Warmed cache: ${endpoint}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to warm cache for ${endpoint}:`, error);
      }
    }

    console.log('🔥 Cache warming completed');
  } catch (error) {
    console.warn('Cache warming failed:', error);
  }
}

export default ApiCacheMiddleware;
