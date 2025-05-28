import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { auditService, AuditAction } from '@/services/OptimizedAuditService';
import { verifyAuthToken } from '@/lib/auth-server-utils';

interface RateLimitConfig {
  interval: number; // in milliseconds
  uniqueTokenPerInterval: number; // max number of unique tokens
  maxRequests: number; // max requests per interval per token
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory store (consider using Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export const rateLimitConfigs = {
  auth: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
    maxRequests: 5 // 5 requests per minute for auth
  },
  public: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
    maxRequests: 20 // 20 requests per minute for public routes
  },
  user: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 1000,
    maxRequests: 100 // 100 requests per minute for authenticated users
  },
  admin: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 1000,
    maxRequests: 200 // 200 requests per minute for admins
  },
  sensitive: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 1000,
    maxRequests: 50 // 50 requests per minute for sensitive operations
  }
};

export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  identifier?: string
): Promise<RateLimitResult> {
  // Get identifier from IP or custom identifier
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
  
  const key = identifier ? `${identifier}:${ip}` : ip;
  const now = Date.now();
  const resetTime = now + config.interval;

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired one
    entry = { count: 1, resetTime };
    rateLimitStore.set(key, entry);
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: resetTime
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: entry.resetTime
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    reset: entry.resetTime
  };
}

// Helper function to create rate limit middleware for API routes
export function withRateLimit(
  handler: Function,
  configType: keyof typeof rateLimitConfigs = 'public'
) {
  return async (request: NextRequest, context?: any) => {
    const config = rateLimitConfigs[configType];
    const result = await rateLimit(request, config);

    if (!result.success) {
      // Tenter de récupérer l'ID utilisateur pour l'audit
      let userId: number | undefined;
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      
      if (token) {
        try {
          const authResult = await verifyAuthToken(token);
          if (authResult.authenticated) {
            userId = authResult.userId;
          }
        } catch (e) {
          // Ignorer les erreurs de vérification du token
        }
      }

      // Log d'audit pour le dépassement de rate limit
      const headersList = await headers();
      const forwardedFor = headersList.get('x-forwarded-for');
      const realIp = headersList.get('x-real-ip');
      
      await auditService.logAction({
        action: AuditAction.RATE_LIMIT_EXCEEDED,
        entityId: request.url,
        entityType: 'RateLimit',
        userId,
        severity: 'WARNING',
        success: false,
        details: {
          ipAddress: forwardedFor || realIp || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          metadata: {
            configType,
            limit: config.maxRequests,
            interval: config.interval,
            endpoint: request.url,
            method: request.method
          }
        }
      });

      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Please try again after ${new Date(result.reset).toISOString()}`,
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = await handler(request, context);
    
    if (response instanceof Response) {
      response.headers.set('X-RateLimit-Limit', result.limit.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.reset.toString());
    }

    return response;
  };
}

// Specific rate limiters for different route types
export const withAuthRateLimit = (handler: Function) => withRateLimit(handler, 'auth');
export const withPublicRateLimit = (handler: Function) => withRateLimit(handler, 'public');
export const withUserRateLimit = (handler: Function) => withRateLimit(handler, 'user');
export const withAdminRateLimit = (handler: Function) => withRateLimit(handler, 'admin');
export const withSensitiveRateLimit = (handler: Function) => withRateLimit(handler, 'sensitive');