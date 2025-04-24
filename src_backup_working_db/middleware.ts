import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
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

    // Si un cookie auth_token est trouvé, décoder son contenu et ajouter le rôle aux en-têtes
    if (authCookie && authCookie.value) {
        try {
            // Extraire le payload JSON du JWT (partie du milieu)
            const parts = authCookie.value.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                console.log('JWT payload décodé:', payload);

                // Ajouter les informations utilisateur aux en-têtes
                if (payload.userId) requestHeaders.set('x-user-id', payload.userId.toString());
                if (payload.login) requestHeaders.set('x-user-login', payload.login);
                if (payload.role) requestHeaders.set('x-user-role', payload.role);

                console.log('En-têtes ajoutés avec les informations utilisateur');
            }
        } catch (error) {
            console.error('Erreur lors du décodage du JWT:', error);
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