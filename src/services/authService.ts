import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { AuthCacheService } from '@/lib/auth/authCache';
import { logger } from '@/lib/logger';

interface LoginResponse {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
  token: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        logger.warn('Login attempt failed: user not found', { email });
        throw new Error('Invalid credentials');
      }

      if (!user.active) {
        logger.warn('Login attempt failed: account disabled', { email });
        throw new Error('Account is disabled');
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        logger.warn('Login attempt failed: account locked', { email });
        throw new Error('Account locked due to too many failed attempts');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        // Increment failed attempts
        const loginAttempts = (user.loginAttempts || 0) + 1;
        let lockedUntil = null;

        if (loginAttempts >= 5) {
          lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts,
            lockedUntil,
            lastFailedAttempt: new Date(),
          },
        });

        logger.warn('Login attempt failed: invalid password', { email });
        
        if (lockedUntil) {
          throw new Error('Account locked due to too many failed attempts');
        }
        
        throw new Error('Invalid credentials');
      }

      // Reset login attempts on successful login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: 0,
          lockedUntil: null,
          lastLogin: new Date(),
        },
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      // Cache auth data
      await AuthCacheService.cacheAuthToken(token, {
        userId: user.id,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      });

      await AuthCacheService.cacheUserData(user.id.toString(), {
        id: user.id,
        email: user.email,
        name: user.name || '',
        role: user.role,
      });

      logger.info('User logged in successfully', { userId: user.id });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role,
        },
        token,
      };
    } catch (error: unknown) {
      logger.error('Login failed', { error: error });
      throw error;
    }
  },

  async validateToken(token: string): Promise<unknown> {
    try {
      // Check cache first
      const cachedAuth = await AuthCacheService.getCachedAuthToken(token);
      if (cachedAuth) {
        // Check expiration
        if (cachedAuth.exp && cachedAuth.exp < Math.floor(Date.now() / 1000)) {
          await AuthCacheService.invalidateAuthToken(token);
          throw new Error('Token expired');
        }
        return cachedAuth;
      }

      // Verify token
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;

      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }

      // Cache for future use
      await AuthCacheService.cacheAuthToken(token, payload);

      return payload;
    } catch (error: unknown) {
      logger.error('Token validation failed', { error: error });
      throw error;
    }
  },

  async refreshToken(oldToken: string): Promise<string> {
    try {
      const payload = jwt.verify(oldToken, process.env.JWT_SECRET!) as any;

      const newToken = jwt.sign(
        { userId: payload.userId, role: payload.role },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      // Invalidate old token
      await AuthCacheService.invalidateAuthToken(oldToken);

      // Cache new token
      await AuthCacheService.cacheAuthToken(newToken, {
        userId: payload.userId,
        role: payload.role,
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      });

      return newToken;
    } catch (error: unknown) {
      logger.error('Token refresh failed', { error: error });
      throw error;
    }
  },

  async logout(token: string): Promise<void> {
    try {
      // Get user info from token
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;

      // Invalidate token and user data cache
      await AuthCacheService.invalidateAuthToken(token);
      await AuthCacheService.invalidateUserData(payload.userId.toString());

      logger.info('User logged out successfully', { userId: payload.userId });
    } catch (error: unknown) {
      // Even if token is invalid, still try to invalidate it
      await AuthCacheService.invalidateAuthToken(token);
      logger.warn('Logout attempted with invalid token');
    }
  },

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      // Invalidate all user sessions
      await prisma.session.deleteMany({
        where: { userId },
      });

      logger.info('Password changed successfully', { userId });
    } catch (error: unknown) {
      logger.error('Password change failed', { error: error });
      throw error;
    }
  },
};