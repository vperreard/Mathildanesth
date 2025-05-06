import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-utils';
import type { UserJWTPayload } from '@/lib/auth-utils';

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
            const authResult = await verifyAuthToken(authCookie.value);

            if (authResult.authenticated && authResult.user) {
                const user = authResult.user as UserJWTPayload;
                // Ajouter les informations utilisateur aux en-têtes
                requestHeaders.set('x-user-id', user.userId.toString());
                requestHeaders.set('x-user-login', user.login);
                requestHeaders.set('x-user-role', user.role);
                console.log('En-têtes ajoutés avec les informations utilisateur');
            } else {
                console.warn('Token invalide ou expiré');
            }
        } catch (error) {
            console.error('Erreur lors de la vérification du token:', error);
        }
    }

    // Pour les routes API protégées, vérifier l'authentification
    if (pathname.startsWith('/api/') &&
        !pathname.startsWith('/api/auth/') &&
        !pathname.includes('public')) {

        if (!authCookie || !authCookie.value) {
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