import { authService } from '../authService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { AuthCacheService } from '@/lib/auth/authCache';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    session: {
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('@/lib/auth/authCache');
jest.mock('@/lib/logger');

describe('AuthService', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: '$2a$10$hashedpassword',
    name: 'Test User',
    role: 'USER',
    active: true,
    loginAttempts: 0,
    lockedUntil: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('valid.token');
      (AuthCacheService.cacheAuthToken as jest.Mock).mockResolvedValue(undefined);
      (AuthCacheService.cacheUserData as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toEqual({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER',
        },
        token: 'valid.token',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', '$2a$10$hashedpassword');
      expect(logger.info).toHaveBeenCalledWith('User logged in successfully', { userId: 1 });
    });

    it('should throw error for invalid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.login('test@example.com', 'password123')).rejects.toThrow(
        'Invalid credentials'
      );

      expect(logger.warn).toHaveBeenCalledWith('Login attempt failed: user not found', {
        email: 'test@example.com',
      });
    });

    it('should throw error for inactive user', async () => {
      const inactiveUser = { ...mockUser, active: false };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(inactiveUser);

      await expect(authService.login('test@example.com', 'password123')).rejects.toThrow(
        'Account is disabled'
      );

      expect(logger.warn).toHaveBeenCalledWith('Login attempt failed: account disabled', {
        email: 'test@example.com',
      });
    });

    it('should throw error for locked account', async () => {
      const lockedUser = { ...mockUser, lockedUntil: new Date(Date.now() + 60000) };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(lockedUser);

      await expect(authService.login('test@example.com', 'password123')).rejects.toThrow(
        'Account locked due to too many failed attempts'
      );

      expect(logger.warn).toHaveBeenCalledWith('Login attempt failed: account locked', {
        email: 'test@example.com',
      });
    });

    it('should increment failed attempts on wrong password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          loginAttempts: 1,
          lockedUntil: null,
          lastFailedAttempt: expect.any(Date),
        },
      });
    });

    it('should lock account after 5 failed attempts', async () => {
      const userWith4Attempts = { ...mockUser, loginAttempts: 4 };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWith4Attempts);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          loginAttempts: 5,
          lockedUntil: expect.any(Date),
          lastFailedAttempt: expect.any(Date),
        },
      });
    });

    it('should reset login attempts on successful login', async () => {
      const userWithAttempts = { ...mockUser, loginAttempts: 3 };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithAttempts);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('valid.token');

      await authService.login('test@example.com', 'password123');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          loginAttempts: 0,
          lockedUntil: null,
          lastLogin: expect.any(Date),
        },
      });
    });
  });

  describe('validateToken', () => {
    it('should validate token from cache', async () => {
      const cachedPayload = { userId: 1, role: 'USER', exp: Math.floor(Date.now() / 1000) + 3600 };
      (AuthCacheService.getCachedAuthToken as jest.Mock).mockResolvedValue(cachedPayload);

      const result = await authService.validateToken('valid.token');

      expect(result).toEqual(cachedPayload);
      expect(AuthCacheService.getCachedAuthToken).toHaveBeenCalledWith('valid.token');
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it('should validate token and cache it', async () => {
      const payload = { userId: 1, role: 'USER', exp: Math.floor(Date.now() / 1000) + 3600 };
      (AuthCacheService.getCachedAuthToken as jest.Mock).mockResolvedValue(null);
      (jwt.verify as jest.Mock).mockReturnValue(payload);

      const result = await authService.validateToken('valid.token');

      expect(result).toEqual(payload);
      expect(jwt.verify).toHaveBeenCalledWith('valid.token', 'test-secret');
      expect(AuthCacheService.cacheAuthToken).toHaveBeenCalledWith('valid.token', payload);
    });

    it('should throw error for expired token in cache', async () => {
      const expiredPayload = { userId: 1, role: 'USER', exp: Math.floor(Date.now() / 1000) - 3600 };
      (AuthCacheService.getCachedAuthToken as jest.Mock).mockResolvedValue(expiredPayload);

      await expect(authService.validateToken('expired.token')).rejects.toThrow('Token expired');

      expect(AuthCacheService.invalidateAuthToken).toHaveBeenCalledWith('expired.token');
    });

    it('should throw error for invalid token', async () => {
      (AuthCacheService.getCachedAuthToken as jest.Mock).mockResolvedValue(null);
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.validateToken('invalid.token')).rejects.toThrow('Invalid token');

      expect(logger.error).toHaveBeenCalledWith('Token validation failed', {
        error: expect.any(Error),
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const oldPayload = { userId: 1, role: 'USER' };
      (jwt.verify as jest.Mock).mockReturnValue(oldPayload);
      (jwt.sign as jest.Mock).mockReturnValue('new.token');

      const result = await authService.refreshToken('old.token');

      expect(result).toBe('new.token');
      expect(jwt.verify).toHaveBeenCalledWith('old.token', 'test-secret');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1, role: 'USER' },
        'test-secret',
        { expiresIn: '24h' }
      );
      expect(AuthCacheService.invalidateAuthToken).toHaveBeenCalledWith('old.token');
      expect(AuthCacheService.cacheAuthToken).toHaveBeenCalledWith('new.token', {
        userId: 1,
        role: 'USER',
        exp: expect.any(Number),
      });
    });

    it('should throw error for invalid token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken('invalid.token')).rejects.toThrow('Invalid token');

      expect(logger.error).toHaveBeenCalledWith('Token refresh failed', {
        error: expect.any(Error),
      });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const payload = { userId: 1, role: 'USER' };
      (jwt.verify as jest.Mock).mockReturnValue(payload);

      await authService.logout('valid.token');

      expect(jwt.verify).toHaveBeenCalledWith('valid.token', 'test-secret');
      expect(AuthCacheService.invalidateAuthToken).toHaveBeenCalledWith('valid.token');
      expect(AuthCacheService.invalidateUserData).toHaveBeenCalledWith('1');
      expect(logger.info).toHaveBeenCalledWith('User logged out successfully', { userId: 1 });
    });

    it('should handle logout with invalid token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authService.logout('invalid.token');

      expect(AuthCacheService.invalidateAuthToken).toHaveBeenCalledWith('invalid.token');
      expect(logger.warn).toHaveBeenCalledWith('Logout attempted with invalid token');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$10$newhashedpassword');

      await authService.changePassword(1, 'oldpassword', 'newpassword');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password: '$2a$10$newhashedpassword' },
      });
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
      expect(logger.info).toHaveBeenCalledWith('Password changed successfully', { userId: 1 });
    });

    it('should throw error for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.changePassword(1, 'oldpassword', 'newpassword')).rejects.toThrow(
        'User not found'
      );
    });

    it('should throw error for incorrect current password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.changePassword(1, 'wrongpassword', 'newpassword')).rejects.toThrow(
        'Current password is incorrect'
      );
    });
  });
});