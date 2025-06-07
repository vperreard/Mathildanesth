import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { generateOptimizedAuthToken, setOptimizedAuthToken } from '@/lib/auth/optimized-auth-server-utils';
import { OptimizedAuthCache } from '@/lib/auth/optimized-auth-cache';
import { authPerformanceMonitor } from '@/lib/auth/performance-monitor';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { withAuthRateLimit } from '@/lib/rateLimit';

async function optimizedLoginHandler(req: NextRequest) {
  return authPerformanceMonitor.measure('loginEndpoint', async () => {
    try {
      const { login, password } = await req.json();

      if (!login || !password) {
        return NextResponse.json(
          { error: 'Login et mot de passe requis' },
          { status: 400 }
        );
      }

      // Optimized user query - select only needed fields
      const user = await authPerformanceMonitor.measure('findUser', () =>
        prisma.user.findFirst({
          where: { login },
          select: {
            id: true,
            login: true,
            email: true,
            nom: true,
            prenom: true,
            role: true,
            password: true,
            actif: true,
          }
        })
      );

      if (!user || !user.password) {
        return NextResponse.json(
          { error: 'Identifiants invalides' },
          { status: 401 }
        );
      }

      if (!user.actif) {
        return NextResponse.json(
          { error: 'Compte désactivé' },
          { status: 403 }
        );
      }

      // Async password verification
      const isValidPassword = await authPerformanceMonitor.measure(
        'bcryptCompare',
        () => bcrypt.compare(password, user.password!)
      );

      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Identifiants invalides' },
          { status: 401 }
        );
      }

      // Generate optimized token
      const token = await generateOptimizedAuthToken({
        userId: user.id,
        login: user.login,
        role: user.role
      });

      // Cache user data for subsequent requests
      const userData = {
        id: user.id,
        login: user.login,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role
      };
      
      await OptimizedAuthCache.cacheAuthToken(token, {
        userId: user.id,
        login: user.login,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
        iat: Math.floor(Date.now() / 1000),
      });

      // Create response
      const response = NextResponse.json({
        user: userData,
        token: token,
        redirectUrl: '/dashboard'
      });

      // Set optimized cookie
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60,
        path: '/',
      });

      // Log performance metrics
      const stats = authPerformanceMonitor.getStats('loginEndpoint');
      if (stats && stats.avg > 1000) {
        logger.warn('Login endpoint performance degraded', { stats });
      }

      return response;
    } catch (error: unknown) {
      logger.error('Optimized login error:', { error });
      return NextResponse.json(
        { error: 'Erreur serveur lors de la connexion' },
        { status: 500 }
      );
    }
  });
}

// Export with rate limiting
export const POST = withAuthRateLimit(optimizedLoginHandler);