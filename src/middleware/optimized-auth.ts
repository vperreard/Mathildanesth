import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyOptimizedAuthToken } from '@/lib/auth/optimized-auth-server-utils';
import { authPerformanceMonitor } from '@/lib/auth/performance-monitor';

// Routes that don't require authentication
const PUBLIC_ROUTES = new Set([
  '/',
  '/auth/login',
  '/auth/reset-password',
  '/api/auth/login',
  '/api/auth/reset-password',
  '/api/health',
]);

// Static file extensions to skip
const STATIC_EXTENSIONS = new Set([
  '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', 
  '.ico', '.woff', '.woff2', '.ttf', '.eot', '.map'
]);

// Cache for route checks
const routeCheckCache = new Map<string, boolean>();

export async function optimizedAuthMiddleware(request: NextRequest) {
  const startTime = performance.now();
  const pathname = request.nextUrl.pathname;

  try {
    // Skip static files immediately
    const extension = pathname.substring(pathname.lastIndexOf('.'));
    if (STATIC_EXTENSIONS.has(extension)) {
      return NextResponse.next();
    }

    // Skip Next.js internal routes
    if (pathname.startsWith('/_next/') || pathname.startsWith('/__nextjs')) {
      return NextResponse.next();
    }

    // Check public routes with cache
    let isPublic = routeCheckCache.get(pathname);
    if (isPublic === undefined) {
      isPublic = PUBLIC_ROUTES.has(pathname) || 
                 pathname.startsWith('/images/') ||
                 pathname.startsWith('/fonts/') ||
                 pathname.startsWith('/sounds/');
      routeCheckCache.set(pathname, isPublic);
    }

    if (isPublic) {
      return NextResponse.next();
    }

    // Get auth token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : request.cookies.get('auth_token')?.value;

    if (!token) {
      return redirectToLogin(request);
    }

    // Verify token with request context for caching
    const authResult = await verifyOptimizedAuthToken(token, request);

    if (!authResult.authenticated) {
      return redirectToLogin(request);
    }

    // Create response with auth headers for downstream use
    const response = NextResponse.next();
    
    // Pass auth data via headers to avoid re-verification
    response.headers.set('x-user-id', String(authResult.userId));
    response.headers.set('x-user-role', authResult.role || '');
    response.headers.set('x-auth-verified', 'true');

    // Log performance metrics for slow requests
    const duration = performance.now() - startTime;
    if (duration > 50) {
      authPerformanceMonitor.measureSync('slowMiddleware', () => null, {
        pathname,
        duration
      });
    }

    return response;
  } catch (error) {
    console.error('Auth middleware error:', error);
    return redirectToLogin(request);
  }
}

function redirectToLogin(request: NextRequest) {
  const url = new URL('/auth/login', request.url);
  url.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

// Export middleware config
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth/login (login endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files) 
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc.)
     */
    '/((?!api/auth/login|_next/static|_next/image|favicon.ico|images|fonts|sounds).*)',
  ],
};