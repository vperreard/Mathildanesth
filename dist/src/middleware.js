import { NextResponse } from 'next/server';
export function middleware(request) {
    // Journaliser les informations sur la requête
    var url = request.nextUrl.href;
    var method = request.method;
    var pathname = request.nextUrl.pathname;
    console.log('=========================================');
    console.log("[MIDDLEWARE TS] EX\u00C9CUT\u00C9: ".concat(method, " ").concat(pathname));
    console.log("URL compl\u00E8te: ".concat(url));
    console.log('Headers originaux:');
    request.headers.forEach(function (value, key) {
        console.log("  ".concat(key, ": ").concat(value));
    });
    console.log('=========================================');
    // Extraire les informations du cookie auth_token
    var authCookie = request.cookies.get('auth_token');
    console.log('Cookie auth_token trouvé:', authCookie ? 'Oui' : 'Non');
    // Ajouter un en-tête pour confirmer que le middleware a été exécuté
    var requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-middleware-executed', 'true');
    requestHeaders.set('x-middleware-timestamp', new Date().toISOString());
    // Si un cookie auth_token est trouvé, décoder son contenu et ajouter le rôle aux en-têtes
    if (authCookie && authCookie.value) {
        try {
            // Extraire le payload JSON du JWT (partie du milieu)
            var parts = authCookie.value.split('.');
            if (parts.length === 3) {
                var payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                console.log('JWT payload décodé:', payload);
                // Ajouter les informations utilisateur aux en-têtes
                if (payload.userId)
                    requestHeaders.set('x-user-id', payload.userId.toString());
                if (payload.login)
                    requestHeaders.set('x-user-login', payload.login);
                if (payload.role)
                    requestHeaders.set('x-user-role', payload.role);
                console.log('En-têtes ajoutés avec les informations utilisateur');
            }
        }
        catch (error) {
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
export var config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ]
};
