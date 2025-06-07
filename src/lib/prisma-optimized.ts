import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { authPerformanceMonitor } from './auth/performance-monitor';

// Optimized Prisma configuration
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create optimized Prisma client with connection pooling
export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['error', 'warn']
    : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
});

// Configure connection pool via DATABASE_URL parameters:
// postgresql://user:password@host:port/db?connection_limit=10&pool_timeout=30

// Add performance monitoring to Prisma queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    
    const duration = after - before;
    
    // Log slow queries
    if (duration > 100) {
      logger.warn(`Slow Prisma query: ${params.model}.${params.action}`, {
        duration,
        args: params.args
      });
    }
    
    // Track in performance monitor
    authPerformanceMonitor.measureSync(`prisma.${params.model}.${params.action}`, () => null, {
      duration
    });
    
    return result;
  });
}

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Helper to optimize user queries
export const optimizedUserQueries = {
  // Get user for auth with minimal fields
  async getUserForAuth(login: string) {
    return authPerformanceMonitor.measure('prisma.user.findForAuth', () =>
      prisma.user.findFirst({
        where: { login },
        select: {
          id: true,
          login: true,
          password: true,
          role: true,
          actif: true,
        }
      })
    );
  },

  // Get user profile data
  async getUserProfile(id: number) {
    return authPerformanceMonitor.measure('prisma.user.findProfile', () =>
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          login: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
        }
      })
    );
  },

  // Batch get users for cache warming
  async getUsersForCache(ids: number[]) {
    return authPerformanceMonitor.measure('prisma.user.findManyForCache', () =>
      prisma.user.findMany({
        where: { 
          id: { in: ids },
          actif: true 
        },
        select: {
          id: true,
          login: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
        }
      })
    );
  }
};

// Export connection management utilities
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

export async function connectPrisma() {
  await prisma.$connect();
}

// Test connection on startup
connectPrisma().catch((error) => {
  logger.error('Failed to connect to database:', error);
});