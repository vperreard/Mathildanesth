import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import type { UserJWTPayload, AuthResult } from '@/lib/auth-client-utils';

// Cache de vérification des tokens - durée de vie de 5 minutes
const tokenVerificationCache = new Map<string, { result: AuthResult, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Ignorer les ressources statiques pour éviter un traitement inutile
    if (
        pathname.includes('/_next/') ||
        pathname.includes('/static/') ||
        pathname.endsWith('.ico') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.svg')
    ) {
        return NextResponse.next();
    }

    // Journaliser les informations minimales sur la requête en production
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[MIDDLEWARE] ${request.method} ${pathname}`);
    }

    // Extraire les informations du cookie auth_token
    const authCookie = request.cookies.get('auth_token');
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-middleware-timestamp', new Date().toISOString());

    // Si un cookie auth_token est trouvé, vérifier et décoder le token
    if (authCookie && authCookie.value) {
        try {
            // Tenter de récupérer du cache d'abord
            let authResult: AuthResult;
            const cacheKey = authCookie.value;
            const cachedVerification = tokenVerificationCache.get(cacheKey);

            if (cachedVerification && (Date.now() - cachedVerification.timestamp) < CACHE_TTL) {
                // Utiliser le résultat en cache si valide
                authResult = cachedVerification.result;
            } else {
                // Sinon, vérifier le token et mettre en cache
                authResult = await verifyAuthToken(authCookie.value);
                tokenVerificationCache.set(cacheKey, {
                    result: authResult,
                    timestamp: Date.now()
                });

                // Nettoyer le cache si trop grand (éviter les fuites de mémoire)
                if (tokenVerificationCache.size > 1000) {
                    const keysToDelete = [...tokenVerificationCache.entries()]
                        .filter(([_, value]) => Date.now() - value.timestamp > CACHE_TTL)
                        .map(([key]) => key);

                    keysToDelete.forEach(key => tokenVerificationCache.delete(key));
                }
            }

            if (authResult.authenticated && authResult.userId && authResult.role) {
                // Ajouter les informations utilisateur aux en-têtes
                requestHeaders.set('x-user-id', authResult.userId.toString());
                requestHeaders.set('x-user-role', authResult.role);
            }
        } catch (error) {
            // Log minimal en cas d'erreur
            console.error('Erreur token:', error instanceof Error ? error.message : 'Inconnu');
        }
    }

    // Pour les routes API protégées, vérifier l'authentification
    if (pathname.startsWith('/api/') &&
        !pathname.startsWith('/api/auth/') &&
        !pathname.includes('public')) {

        // Autoriser les requêtes de développement avec les en-têtes x-user-role et x-user-id
        const devBypassHeaders = process.env.NODE_ENV === 'development' &&
            requestHeaders.has('x-user-role') &&
            requestHeaders.has('x-user-id');

        if (!authCookie && !devBypassHeaders) {
            return NextResponse.json(
                { error: 'Authentification requise' },
                { status: 401 }
            );
        }
    }

    // Continuer avec la requête modifiée
    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

// Configuration pour que le middleware s'applique aux routes spécifiques
export const config = {
    matcher: [
        // Appliquer le middleware à toutes les routes sauf les ressources statiques
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(jpg|png|svg|ico)).*)',
    ]
}; 