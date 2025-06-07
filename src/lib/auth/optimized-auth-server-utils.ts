import { cookies, headers as nextHeaders } from 'next/headers';
import { logger } from '../logger';
import { SignJWT, jwtVerify } from 'jose';
import type { UserRole, AuthResult } from '../auth-client-utils';
import { OptimizedAuthCache } from './optimized-auth-cache';
import { authPerformanceMonitor } from './performance-monitor';

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'un_secret_jwt_robuste_et_difficile_a_deviner_pour_la_securite_de_l_application';
const TOKEN_EXPIRATION = 24 * 60 * 60; // 24 heures en secondes
const AUTH_TOKEN_KEY = 'auth_token';

// Pre-encode secret for reuse
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

// Request context cache to avoid multiple verifications in same request
const requestCache = new WeakMap<any, AuthResult>();

export async function generateOptimizedAuthToken(payload: any) {
  return authPerformanceMonitor.measure('generateToken', async () => {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + TOKEN_EXPIRATION;

    const tokenPayload = {
      ...payload,
      iss: 'mathildanesth',
      aud: 'mathildanesth-client',
      iat,
      exp,
    };

    const token = await new SignJWT(tokenPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(SECRET_KEY);

    // Cache with optimized cache
    await OptimizedAuthCache.cacheAuthToken(token, {
      userId: payload.userId,
      login: payload.login,
      role: payload.role,
      exp,
      iat,
    });

    return token;
  });
}

export async function verifyOptimizedAuthToken(
  token: string,
  requestContext?: any
): Promise<AuthResult> {
  // Check request context cache first
  if (requestContext && requestCache.has(requestContext)) {
    authPerformanceMonitor.measureSync('contextCacheHit', () => null);
    return requestCache.get(requestContext)!;
  }

  return authPerformanceMonitor.measure('verifyToken', async () => {
    try {
      // Check cache first
      const cachedData = await authPerformanceMonitor.measure(
        'getCachedToken',
        () => OptimizedAuthCache.getCachedAuthToken(token)
      );

      if (cachedData) {
        const result: AuthResult = {
          authenticated: true,
          userId: cachedData.userId,
          role: cachedData.role as string,
        };

        // Store in request context
        if (requestContext) {
          requestCache.set(requestContext, result);
        }

        authPerformanceMonitor.measureSync('cacheHit', () => null);
        return result;
      }

      authPerformanceMonitor.measureSync('cacheMiss', () => null);

      // Verify token if not in cache
      const { payload } = await jwtVerify(token, SECRET_KEY);

      if (!payload.userId || !payload.role) {
        return {
          authenticated: false,
          error: 'Token invalide',
        };
      }

      // Cache for future requests
      await OptimizedAuthCache.cacheAuthToken(token, {
        userId: payload.userId as string,
        login: payload.login as string,
        role: payload.role as string,
        exp: payload.exp as number,
        iat: payload.iat as number,
      });

      const result: AuthResult = {
        authenticated: true,
        userId: payload.userId as number,
        role: payload.role as string,
      };

      // Store in request context
      if (requestContext) {
        requestCache.set(requestContext, result);
      }

      return result;
    } catch (error: unknown) {
      logger.error('Token verification error:', { error });
      return {
        authenticated: false,
        error: 'Token invalide ou expiré',
      };
    }
  });
}

export async function getOptimizedAuthToken() {
  return authPerformanceMonitor.measure('getAuthToken', async () => {
    try {
      // Check Authorization header first (faster)
      const headersList = await nextHeaders();
      const authHeader = headersList.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (token) {
          return token;
        }
      }

      // Fall back to cookie
      const cookieStore = await cookies();
      const cookieToken = cookieStore.get(AUTH_TOKEN_KEY)?.value;
      return cookieToken || null;
    } catch (error: unknown) {
      logger.error('Error getting auth token:', { error });
      return null;
    }
  });
}

export async function setOptimizedAuthToken(token: string) {
  return authPerformanceMonitor.measure('setAuthToken', async () => {
    try {
      const cookieStore = await cookies();
      cookieStore.set(AUTH_TOKEN_KEY, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: TOKEN_EXPIRATION,
        path: '/',
      });
    } catch (error: unknown) {
      logger.error('Error setting auth token:', { error });
    }
  });
}

export async function removeOptimizedAuthToken() {
  return authPerformanceMonitor.measure('removeAuthToken', async () => {
    try {
      const cookieStore = await cookies();
      cookieStore.delete(AUTH_TOKEN_KEY);
    } catch (error: unknown) {
      logger.error('Error removing auth token:', { error });
    }
  });
}

// Optimized role check with caching
export async function checkOptimizedUserRole(
  allowedRoles: UserRole[],
  authToken?: string | null,
  requestContext?: any
): Promise<{
  hasRequiredRole: boolean;
  user: { id: number; role: string } | null;
  error: string | null;
}> {
  return authPerformanceMonitor.measure('checkUserRole', async () => {
    let tokenToVerify = authToken;
    if (authToken === undefined) {
      tokenToVerify = await getOptimizedAuthToken();
    }

    if (!tokenToVerify) {
      return {
        hasRequiredRole: false,
        user: null,
        error: 'Token non fourni ou non récupérable',
      };
    }

    const authResult = await verifyOptimizedAuthToken(tokenToVerify, requestContext);

    if (!authResult.authenticated || !authResult.userId || !authResult.role) {
      return {
        hasRequiredRole: false,
        user: null,
        error: authResult.error || 'Utilisateur non authentifié',
      };
    }

    const user = { id: authResult.userId, role: authResult.role };
    const userRole = authResult.role as UserRole;
    const hasRole = allowedRoles.includes(userRole);

    return {
      hasRequiredRole: hasRole,
      user: user,
      error: hasRole ? null : 'Accès non autorisé pour ce rôle',
    };
  });
}

// Helper to get performance stats
export function getAuthPerformanceStats() {
  return authPerformanceMonitor.generateReport();
}