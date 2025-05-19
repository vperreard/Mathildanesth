import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import type { UserJWTPayload, AuthResult } from '@/lib/auth-client-utils';

export async function middleware(request: NextRequest) {
    // Journaliser les informations sur la requête
    const url = request.nextUrl.href;
    const method = request.method;
    const pathname = request.nextUrl.pathname;

    console.log('=========================================');
    console.log(`[MIDDLEWARE TS] EXÉCUTÉ: ${method} ${pathname}`);
    console.log(`URL complète: ${url}`);
    console.log('Headers originaux:');
    request.headers.forEach((value, key) => {
        console.log(`  ${key}: ${value}`);
    });
    console.log('=========================================');

    // Extraire les informations du cookie auth_token
    const authCookie = request.cookies.get('auth_token');
    console.log('Cookie auth_token trouvé:', authCookie ? 'Oui' : 'Non');

    // Ajouter un en-tête pour confirmer que le middleware a été exécuté
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-middleware-executed', 'true');
    requestHeaders.set('x-middleware-timestamp', new Date().toISOString());

    // Si un cookie auth_token est trouvé, vérifier et décoder le token
    if (authCookie && authCookie.value) {
        try {
            const authResult: AuthResult = await verifyAuthToken(authCookie.value);

            if (authResult.authenticated && authResult.userId && authResult.role) {
                // Ajouter les informations utilisateur aux en-têtes
                requestHeaders.set('x-user-id', authResult.userId.toString());
                requestHeaders.set('x-user-role', authResult.role);
                console.log('En-têtes ajoutés avec les informations utilisateur (ID et rôle)');
            } else {
                console.warn('Token invalide ou expiré selon le middleware');
            }
        } catch (error) {
            console.error('Erreur lors de la vérification du token dans le middleware:', error);
        }
    }

    // Pour les routes API protégées, vérifier l'authentification
    if (pathname.startsWith('/api/') &&
        !pathname.startsWith('/api/auth/') &&
        !pathname.includes('public')) {

        // MODIFICATION: Autoriser les requêtes de développement avec les en-têtes x-user-role et x-user-id
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
// Utilisation d'un matcher plus simple pour tester
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ]
}; 