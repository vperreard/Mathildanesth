import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Helper pour vérifier l'authentification et les permissions
async function authorizeAdminRequest(req: NextRequest) {
    const authorizationHeader = req.headers.get('authorization');

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return { error: 'Authentification requise (Bearer token manquant).', status: 401, userId: null, isAdmin: false };
    }

    const tokenString = authorizationHeader.split(' ')[1];

    if (!process.env.JWT_SECRET) {
        console.error('[API CacheStats Auth] JWT_SECRET is not defined in environment variables.');
        return { error: 'Configuration du serveur incorrecte (secret manquant).', status: 500, userId: null, isAdmin: false };
    }

    try {
        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET) as {
            sub?: string,
            userId?: string | number,
            role?: string,
            [key: string]: any
        };

        const userId = decoded.sub || decoded.userId;
        if (!userId) {
            return { error: 'Token invalide (ID utilisateur manquant).', status: 401, userId: null, isAdmin: false };
        }

        // Vérifier si l'utilisateur est administrateur
        const isAdmin = decoded.role === 'ADMIN_TOTAL' || decoded.role === 'ADMIN_PARTIEL';
        if (!isAdmin) {
            return { error: 'Permissions insuffisantes. Accès réservé aux administrateurs.', status: 403, userId: String(userId), isAdmin: false };
        }

        return { userId: String(userId), error: null, status: 0, isAdmin: true };
    } catch (err: any) {
        console.error(`[API CacheStats Auth] jwt.verify failed: ${err.name} - ${err.message}`);
        if (err.name === 'JsonWebTokenError') {
            return { error: 'Token invalide (signature incorrecte ou malformé).', status: 401, userId: null, isAdmin: false };
        } else if (err.name === 'TokenExpiredError') {
            return { error: 'Token expiré.', status: 401, userId: null, isAdmin: false };
        }
        return { error: 'Erreur d\'authentification inconnue.', status: 401, userId: null, isAdmin: false };
    }
}

export async function GET(request: NextRequest) {
    // Vérifier l'authentification et les permissions
    const authResult = await authorizeAdminRequest(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Récupérer les statistiques du cache Prisma
    try {
        const cacheStats = (prisma as any).$cache.getStats();

        // Calculer le taux de succès du cache
        const hitRate = cacheStats.hits + cacheStats.misses > 0
            ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100
            : 0;

        return NextResponse.json({
            stats: {
                ...cacheStats,
                hitRate: hitRate.toFixed(2) + '%',
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('[API CacheStats] Error retrieving cache stats:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des statistiques du cache.' },
            { status: 500 }
        );
    }
}

// Endpoint pour invalider le cache (réservé aux administrateurs)
export async function POST(request: NextRequest) {
    // Vérifier l'authentification et les permissions
    const authResult = await authorizeAdminRequest(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        // Récupérer les paramètres de la requête
        const body = await request.json();
        const { action, model, key } = body;

        if (!action) {
            return NextResponse.json(
                { error: 'Paramètre action manquant. Valeurs possibles: invalidateAll, invalidateModel, invalidateKey' },
                { status: 400 }
            );
        }

        // Effectuer l'action demandée
        switch (action) {
            case 'invalidateAll':
                (prisma as any).$cache.invalidateAll();
                return NextResponse.json({
                    message: 'Cache entièrement invalidé avec succès.',
                    timestamp: new Date().toISOString()
                });

            case 'invalidateModel':
                if (!model) {
                    return NextResponse.json(
                        { error: 'Paramètre model manquant pour l\'action invalidateModel.' },
                        { status: 400 }
                    );
                }
                (prisma as any).$cache.invalidateModel(model);
                return NextResponse.json({
                    message: `Cache du modèle ${model} invalidé avec succès.`,
                    timestamp: new Date().toISOString()
                });

            case 'invalidateKey':
                if (!key) {
                    return NextResponse.json(
                        { error: 'Paramètre key manquant pour l\'action invalidateKey.' },
                        { status: 400 }
                    );
                }
                (prisma as any).$cache.invalidateKey(key);
                return NextResponse.json({
                    message: `Clé de cache ${key} invalidée avec succès.`,
                    timestamp: new Date().toISOString()
                });

            default:
                return NextResponse.json(
                    { error: `Action '${action}' non reconnue. Valeurs possibles: invalidateAll, invalidateModel, invalidateKey` },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('[API CacheStats] Error invalidating cache:', error);
        return NextResponse.json(
            { error: 'Erreur lors de l\'invalidation du cache.' },
            { status: 500 }
        );
    }
} 