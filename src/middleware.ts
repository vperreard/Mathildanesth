import { NextRequest, NextResponse } from 'next/server';
import { logger } from "./lib/logger";
import { verifyAuthToken } from '@/lib/auth-server-utils';

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    
    logger.info(`[MIDDLEWARE] ${request.method} ${pathname}`);
    
    // Ignorer les ressources statiques
    if (
        pathname.includes('/_next/') ||
        pathname.includes('/static/') ||
        pathname.endsWith('.ico') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.svg') ||
        pathname.endsWith('.css') ||
        pathname.endsWith('.js')
    ) {
        return NextResponse.next();
    }
    
    // Routes publiques
    const publicRoutes = [
        '/',
        '/auth/connexion',
        '/auth/reset-password',
        '/api/auth/login',
        '/api/auth/logout', 
        '/api/auth/forgot-password',
        '/api/auth/reset-password',
        '/api/test-logout',
        '/sw-killer.js',
        '/clear-auth-cookie.html',
        '/manifest.json'
    ];
    
    // Check if public route
    const isPublicRoute = publicRoutes.some(route => {
        if (route === '/') {
            return pathname === '/';
        }
        return pathname === route || pathname.startsWith(route + '/') || pathname.startsWith(route + '?');
    });
    
    logger.info(`[MIDDLEWARE] isPublicRoute: ${isPublicRoute}`);
    
    // Get auth token
    const authCookie = request.cookies.get('auth_token');
    let isAuthenticated = false;
    let userId: string | null = null;
    let userRole: string | null = null;
    
    // Verify auth token if present
    if (authCookie?.value) {
        try {
            const authResult = await verifyAuthToken(authCookie.value);
            if (authResult.authenticated && authResult.userId) {
                isAuthenticated = true;
                userId = authResult.userId.toString();
                userRole = authResult.role || null;
                logger.info(`[MIDDLEWARE] User authenticated: ${userId} (${userRole})`);
            }
        } catch (error: unknown) {
            logger.error('[MIDDLEWARE] Token verification failed:', { error: error });
        }
    }
    
    // Check authentication for protected routes
    if (!pathname.startsWith('/api/') && !isPublicRoute) {
        logger.info(`[MIDDLEWARE] Protected route ${pathname}, authenticated: ${isAuthenticated}`);
        
        if (!isAuthenticated) {
            logger.info(`[MIDDLEWARE] Redirecting to login`);
            const url = new URL('/auth/connexion', request.url);
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }
    }
    
    // For API routes, add auth headers
    const requestHeaders = new Headers(request.headers);
    if (isAuthenticated && userId) {
        requestHeaders.set('x-user-id', userId);
        if (userRole) {
            requestHeaders.set('x-user-role', userRole);
        }
    }
    
    // Check API authentication
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/') && !pathname.includes('public')) {
        if (!isAuthenticated) {
            return NextResponse.json(
                { error: 'Authentification requise' },
                { status: 401 }
            );
        }
    }
    
    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
        '/(api)/:path*'
    ]
};