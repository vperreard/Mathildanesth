import { redis, CachePrefixes, CacheTTL } from '@/lib/redis';
import { logger } from '@/lib/logger';
import type { User } from '@prisma/client';

export interface CachedUserData {
    id: string;
    login: string;
    email: string;
    nom: string;
    prenom: string;
    role: string;
    professionalRole: string;
    siteIds?: string[];
    permissions?: string[];
}

export interface CachedAuthToken {
    userId: string;
    login: string;
    role: string;
    exp: number;
    iat: number;
}

export class AuthCacheService {
    /**
     * Cache un token JWT décodé
     */
    static async cacheAuthToken(token: string, decodedToken: CachedAuthToken): Promise<void> {
        try {
            const key = `${CachePrefixes.AUTH_TOKEN}${token.substring(0, 32)}`; // Utiliser seulement le début du token comme clé
            const ttl = Math.min(
                CacheTTL.AUTH_TOKEN,
                Math.max(0, decodedToken.exp - Math.floor(Date.now() / 1000))
            );
            
            if (ttl > 0) {
                await redis.setex(key, ttl, JSON.stringify(decodedToken));
                logger.debug(`Token cached for ${ttl}s`);
            }
        } catch (error: unknown) {
            logger.error('Failed to cache auth token:', { error: error });
        }
    }

    /**
     * Récupère un token JWT depuis le cache
     */
    static async getCachedAuthToken(token: string): Promise<CachedAuthToken | null> {
        try {
            const key = `${CachePrefixes.AUTH_TOKEN}${token.substring(0, 32)}`;
            const cached = await redis.get(key);
            
            if (!cached) return null;
            
            const data = JSON.parse(cached) as CachedAuthToken;
            
            // Vérifier l'expiration
            if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
                await redis.del(key);
                return null;
            }
            
            return data;
        } catch (error: unknown) {
            logger.error('Failed to get cached auth token:', { error: error });
            return null;
        }
    }

    /**
     * Cache les données utilisateur
     */
    static async cacheUserData(userId: string, userData: CachedUserData): Promise<void> {
        try {
            const key = `${CachePrefixes.USER_DATA}${userId}`;
            await redis.setex(key, CacheTTL.USER_DATA, JSON.stringify(userData));
            logger.debug(`User data cached for user ${userId}`);
        } catch (error: unknown) {
            logger.error('Failed to cache user data:', { error: error });
        }
    }

    /**
     * Récupère les données utilisateur depuis le cache
     */
    static async getCachedUserData(userId: string): Promise<CachedUserData | null> {
        try {
            const key = `${CachePrefixes.USER_DATA}${userId}`;
            const cached = await redis.get(key);
            
            if (!cached) return null;
            
            return JSON.parse(cached) as CachedUserData;
        } catch (error: unknown) {
            logger.error('Failed to get cached user data:', { error: error });
            return null;
        }
    }

    /**
     * Cache les permissions utilisateur
     */
    static async cacheUserPermissions(userId: string, permissions: string[]): Promise<void> {
        try {
            const key = `${CachePrefixes.USER_PERMISSIONS}${userId}`;
            await redis.setex(key, CacheTTL.USER_PERMISSIONS, JSON.stringify(permissions));
            logger.debug(`Permissions cached for user ${userId}`);
        } catch (error: unknown) {
            logger.error('Failed to cache user permissions:', { error: error });
        }
    }

    /**
     * Récupère les permissions utilisateur depuis le cache
     */
    static async getCachedUserPermissions(userId: string): Promise<string[] | null> {
        try {
            const key = `${CachePrefixes.USER_PERMISSIONS}${userId}`;
            const cached = await redis.get(key);
            
            if (!cached) return null;
            
            return JSON.parse(cached) as string[];
        } catch (error: unknown) {
            logger.error('Failed to get cached user permissions:', { error: error });
            return null;
        }
    }

    /**
     * Invalide toutes les données cachées pour un utilisateur
     */
    static async invalidateUserCache(userId: string): Promise<void> {
        try {
            const keys = [
                `${CachePrefixes.USER_DATA}${userId}`,
                `${CachePrefixes.USER_PERMISSIONS}${userId}`,
            ];
            
            // Invalider aussi les tokens de l'utilisateur
            const tokenKeys = await redis.keys(`${CachePrefixes.AUTH_TOKEN}*`);
            if (tokenKeys) {
                for (const tokenKey of tokenKeys) {
                    const tokenData = await redis.get(tokenKey);
                    if (tokenData) {
                        try {
                            const decoded = JSON.parse(tokenData) as CachedAuthToken;
                            if (decoded.userId === userId) {
                                keys.push(tokenKey);
                            }
                        } catch (e: unknown) {
                            // Ignorer les erreurs de parsing
                        }
                    }
                }
            }
            
            if (keys.length > 0) {
                await redis.del(...keys);
                logger.debug(`Cache invalidated for user ${userId}`);
            }
        } catch (error: unknown) {
            logger.error('Failed to invalidate user cache:', { error: error });
        }
    }

    /**
     * Récupère les statistiques du cache
     */
    static async getCacheStats(): Promise<{
        tokens: number;
        users: number;
        permissions: number;
    }> {
        try {
            const [tokenKeys, userKeys, permKeys] = await Promise.all([
                redis.keys(`${CachePrefixes.AUTH_TOKEN}*`),
                redis.keys(`${CachePrefixes.USER_DATA}*`),
                redis.keys(`${CachePrefixes.USER_PERMISSIONS}*`),
            ]);

            return {
                tokens: tokenKeys?.length || 0,
                users: userKeys?.length || 0,
                permissions: permKeys?.length || 0,
            };
        } catch (error: unknown) {
            logger.error('Failed to get cache stats:', { error: error });
            return { tokens: 0, users: 0, permissions: 0 };
        }
    }
}