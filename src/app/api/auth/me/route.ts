import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, getAuthTokenServer } from '@/lib/auth-server-utils';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';
import { performanceMonitor } from '@/services/PerformanceMonitoringService';
import { redisClient } from '@/lib/redis';

// Utiliser une instance Prisma partagée pour éviter les connexions multiples
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Cache utilisateur en mémoire (pour les requêtes très fréquentes)
const memoryCache = new Map<string, { user: any; timestamp: number }>();
const MEMORY_CACHE_TTL = 30 * 1000; // 30 secondes

export async function GET(req: NextRequest) {
    const measure = performanceMonitor.startMeasure('auth_me_api');
    
    try {
        // 1. Vérifier d'abord via NextAuth (la méthode privilégiée)
        const sessionMeasure = performanceMonitor.startMeasure('auth_me_session_check');
        const session = await getServerSession(authOptions);
        performanceMonitor.endMeasure('auth_me_session_check');

        if (session?.user?.id) {
            // Utiliser les données de session directement (très rapide)
            const userData = {
                id: session.user.id,
                login: session.user.login,
                email: session.user.email,
                name: session.user.name,
                role: session.user.role,
                accessToken: session.user.accessToken
            };

            performanceMonitor.endMeasure('auth_me_api');
            return NextResponse.json({
                user: userData,
                authMethod: 'nextauth',
                authenticated: true
            });
        }

        // 2. Si pas de session NextAuth, essayer avec le token personnalisé
        let tokenFromHeader: string | null = null;
        const authHeader = req.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            tokenFromHeader = authHeader.replace('Bearer ', '');
        }

        let tokenFromCookie: string | null = null;
        if (!tokenFromHeader) {
            tokenFromCookie = await getAuthTokenServer();
        }

        const authToken: string | null = tokenFromHeader || tokenFromCookie;

        if (!authToken) {
            performanceMonitor.endMeasure('auth_me_api');
            return NextResponse.json({
                error: 'Non authentifié',
                authenticated: false
            }, { status: 401 });
        }

        // 3. Vérifier le cache mémoire d'abord
        const memoryCacheKey = `user_${authToken}`;
        const memoryCached = memoryCache.get(memoryCacheKey);
        if (memoryCached && Date.now() - memoryCached.timestamp < MEMORY_CACHE_TTL) {
            performanceMonitor.endMeasure('auth_me_api');
            return NextResponse.json({
                user: memoryCached.user,
                authMethod: 'memory_cache',
                authenticated: true
            });
        }

        // 4. Vérifier le cache Redis
        const redisCacheMeasure = performanceMonitor.startMeasure('auth_me_redis_check');
        const redisCacheKey = `auth:user:${authToken}`;
        
        if (redisClient) {
            try {
                const cachedUser = await redisClient.get(redisCacheKey);
                if (cachedUser) {
                    const user = JSON.parse(cachedUser);
                    
                    // Mettre à jour le cache mémoire
                    memoryCache.set(memoryCacheKey, { user, timestamp: Date.now() });
                    
                    performanceMonitor.endMeasure('auth_me_redis_check');
                    performanceMonitor.endMeasure('auth_me_api');
                    
                    return NextResponse.json({
                        user,
                        authMethod: 'redis_cache',
                        authenticated: true
                    });
                }
            } catch (redisError) {
                console.warn('Redis cache error:', redisError);
            }
        }
        performanceMonitor.endMeasure('auth_me_redis_check');

        // 5. Vérifier le token
        const tokenVerifyMeasure = performanceMonitor.startMeasure('auth_me_token_verify');
        const authResult = await verifyAuthToken(authToken);
        performanceMonitor.endMeasure('auth_me_token_verify');

        if (!authResult.authenticated || !authResult.userId) {
            performanceMonitor.endMeasure('auth_me_api');
            return NextResponse.json({
                error: authResult.error || 'Session invalide ou expirée',
                authenticated: false
            }, { status: 401 });
        }

        // 6. Récupérer l'utilisateur depuis la base de données
        const dbMeasure = performanceMonitor.startMeasure('auth_me_db_query');
        const user = await prisma.user.findUnique({
            where: { id: authResult.userId },
            select: {
                id: true,
                login: true,
                email: true,
                nom: true,
                prenom: true,
                role: true,
                // Éviter de charger les relations inutiles
            },
        });
        performanceMonitor.endMeasure('auth_me_db_query');

        if (!user) {
            performanceMonitor.endMeasure('auth_me_api');
            return NextResponse.json({
                error: 'Utilisateur non trouvé',
                authenticated: false
            }, { status: 404 });
        }

        // 7. Mettre en cache pour les prochaines requêtes
        const userToCache = {
            id: user.id,
            login: user.login,
            email: user.email,
            nom: user.nom,
            prenom: user.prenom,
            role: user.role
        };

        // Cache mémoire
        memoryCache.set(memoryCacheKey, { user: userToCache, timestamp: Date.now() });

        // Cache Redis (5 minutes)
        if (redisClient) {
            try {
                await redisClient.setex(redisCacheKey, 300, JSON.stringify(userToCache));
            } catch (redisError) {
                console.warn('Redis cache set error:', redisError);
            }
        }

        performanceMonitor.endMeasure('auth_me_api');
        
        return NextResponse.json({
            user: userToCache,
            authMethod: 'database',
            authenticated: true
        });

    } catch (error) {
        performanceMonitor.endMeasure('auth_me_api');
        console.error('## API /auth/me: Erreur générale:', error);
        return NextResponse.json(
            { authenticated: false, error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

// Nettoyer le cache mémoire périodiquement
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryCache.entries()) {
        if (now - value.timestamp > MEMORY_CACHE_TTL) {
            memoryCache.delete(key);
        }
    }
}, 60 * 1000); // Toutes les minutes