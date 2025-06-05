import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { verifyAuthToken, getAuthTokenServer } from '@/lib/auth-server-utils';
import { prisma } from '@/lib/prisma';
import { withUserRateLimit } from '@/lib/rateLimit';
import { AuthCacheService } from '@/lib/auth/authCache';

async function handler(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Optimized token extraction
    let token: string | null = null;

    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Faster than replace
    }

    if (!token) {
      token = await getAuthTokenServer();
    }

    if (!token) {
      return NextResponse.json(
        {
          error: 'Non authentifié',
          authenticated: false,
        },
        { status: 401 }
      );
    }

    // Check cache first for better performance
    const cachedAuth = await AuthCacheService.getCachedAuthToken(token);
    if (cachedAuth && cachedAuth.userId) {
      // Try to get cached user data
      const cachedUser = await AuthCacheService.getCachedUserData(cachedAuth.userId.toString());
      if (cachedUser) {
        return NextResponse.json(
          {
            user: cachedUser,
            authenticated: true,
          },
          {
            headers: {
              'X-Response-Time': `${Date.now() - startTime}ms`,
              'X-Cache': 'HIT',
            },
          }
        );
      }
    }

    // Verify token if not in cache
    const authResult = await verifyAuthToken(token);

    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json(
        {
          error: authResult.error || 'Session invalide ou expirée',
          authenticated: false,
        },
        { status: 401 }
      );
    }

    // Cache the auth token for future requests
    if (authResult.decodedToken) {
      await AuthCacheService.cacheAuthToken(token, authResult.decodedToken);
    }

    // Optimized user query
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: {
        id: true,
        login: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'Utilisateur non trouvé',
          authenticated: false,
        },
        { status: 404 }
      );
    }

    // Cache user data for future requests
    await AuthCacheService.cacheUserData(authResult.userId.toString(), user);

    return NextResponse.json(
      {
        user,
        authenticated: true,
      },
      {
        headers: {
          'X-Response-Time': `${Date.now() - startTime}ms`,
          'X-Cache': 'MISS',
        },
      }
    );
  } catch (error) {
    logger.error('API /auth/me error:', error);
    return NextResponse.json({ authenticated: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export const GET = withUserRateLimit(handler);
