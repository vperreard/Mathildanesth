// Version simplifiée du cache sans Redis
import { logger } from '../logger';

interface CachedToken {
    userId: string;
    login?: string;
    role: string;
    exp: number;
    iat: number;
}

// Cache en mémoire simple
const tokenCache = new Map<string, CachedToken>();

export class AuthCacheService {
    static async cacheAuthToken(token: string, payload: CachedToken): Promise<void> {
        try {
            tokenCache.set(token, payload);
            logger.debug('Token cached in memory');
        } catch (error) {
            logger.error('Failed to cache auth token:', error);
        }
    }

    static async getCachedAuthToken(token: string): Promise<CachedToken | null> {
        try {
            const cached = tokenCache.get(token);
            if (cached && cached.exp > Date.now() / 1000) {
                return cached;
            }
            // Token expiré, le supprimer
            if (cached) {
                tokenCache.delete(token);
            }
            return null;
        } catch (error) {
            logger.error('Failed to get cached auth token:', error);
            return null;
        }
    }

    static async invalidateUserTokens(userId: string): Promise<void> {
        try {
            // Supprimer tous les tokens de l'utilisateur
            for (const [token, payload] of tokenCache.entries()) {
                if (payload.userId === userId) {
                    tokenCache.delete(token);
                }
            }
        } catch (error) {
            logger.error('Failed to invalidate user tokens:', error);
        }
    }

    static async clearExpiredTokens(): Promise<void> {
        try {
            const now = Date.now() / 1000;
            for (const [token, payload] of tokenCache.entries()) {
                if (payload.exp <= now) {
                    tokenCache.delete(token);
                }
            }
        } catch (error) {
            logger.error('Failed to clear expired tokens:', error);
        }
    }
}

// Nettoyer les tokens expirés toutes les heures
setInterval(() => {
    AuthCacheService.clearExpiredTokens();
}, 60 * 60 * 1000);