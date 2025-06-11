import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, getAuthTokenServer } from '@/lib/auth-server-utils';
import { prisma } from '@/lib/prisma';
import { withUserRateLimit } from '@/lib/rateLimit';
import { AuthCacheService } from '@/lib/auth/authCache';
import { logger } from '@/lib/logger';

// Performance monitoring
const perfLogger = {
  start: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.time(label);
    }
  },
  end: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(label);
    }
  },
};

async function optimizedHandler(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  perfLogger.start(`auth-me-${requestId}`);

  try {
    // 1. Extract token (optimized)
    perfLogger.start(`token-extraction-${requestId}`);
    const token = extractToken(req);
    perfLogger.end(`token-extraction-${requestId}`);

    if (!token) {
      return unauthorizedResponse('Non authentifié');
    }

    // 2. Check cache first
    perfLogger.start(`cache-check-${requestId}`);
    const cachedAuth = await AuthCacheService.getCachedAuthToken(token);
    perfLogger.end(`cache-check-${requestId}`);

    if (cachedAuth && cachedAuth.userId) {
      // 3. Get cached user data
      perfLogger.start(`user-cache-${requestId}`);
      const cachedUser = await AuthCacheService.getCachedUserData(cachedAuth.userId.toString());
      perfLogger.end(`user-cache-${requestId}`);

      if (cachedUser) {
        perfLogger.end(`auth-me-${requestId}`);
        return successResponse(cachedUser);
      }
    }

    // 4. Verify token if not in cache
    perfLogger.start(`token-verify-${requestId}`);
    const authResult = await verifyAuthToken(token);
    perfLogger.end(`token-verify-${requestId}`);

    if (!authResult.authenticated || !authResult.userId) {
      return unauthorizedResponse(authResult.error || 'Session invalide ou expirée');
    }

    // 5. Cache the auth token
    if (authResult.decodedToken) {
      await AuthCacheService.cacheAuthToken(token, authResult.decodedToken);
    }

    // 6. Fetch user with optimized query
    perfLogger.start(`user-fetch-${requestId}`);
    const user = await fetchUserOptimized(authResult.userId);
    perfLogger.end(`user-fetch-${requestId}`);

    if (!user) {
      return notFoundResponse('Utilisateur non trouvé');
    }

    // 7. Cache user data
    await AuthCacheService.cacheUserData(authResult.userId.toString(), user);

    perfLogger.end(`auth-me-${requestId}`);
    return successResponse(user);
  } catch (error: unknown) {
    logger.error('API /auth/me optimized error:', { error: error });
    perfLogger.end(`auth-me-${requestId}`);
    return errorResponse('Erreur serveur');
  }
}

// Helper functions for better performance
function extractToken(req: NextRequest): string | null {
  // Check Authorization header first (faster)
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7); // Faster than replace
  }

  // Check cookies as fallback
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;

  // Parse cookies manually for performance
  const cookies = cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  return cookies['auth_token'] || cookies['next-auth.session-token'] || null;
}

async function fetchUserOptimized(userId: number) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      login: true,
      email: true,
      nom: true,
      prenom: true,
      role: true,
      // Avoid selecting large fields
      _count: false,
    },
  });
}

// Response helpers
function successResponse(user: unknown) {
  return NextResponse.json(
    { user, authenticated: true },
    {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
        'X-Auth-Cached': 'true',
      },
    }
  );
}

function unauthorizedResponse(error: string) {
  return NextResponse.json({ error, authenticated: false }, { status: 401 });
}

function notFoundResponse(error: string) {
  return NextResponse.json({ error, authenticated: false }, { status: 404 });
}

function errorResponse(error: string) {
  return NextResponse.json({ authenticated: false, error }, { status: 500 });
}

export const GET = withUserRateLimit(optimizedHandler);
