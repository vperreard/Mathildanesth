import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authService } from '../authService';
import { prisma } from '@/lib/prisma';
import { AuthCacheService } from '@/lib/auth/authCache';
import { logger } from '@/lib/logger';

// Mock des dépendances
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth/authCache');
jest.mock('@/lib/logger');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER',
    active: true,
    loginAttempts: 0,
    lastLogin: null,
    lockedUntil: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockToken = 'mock.jwt.token';
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        loginAttempts: 0,
        lastLogin: new Date(),
      });

      const result = await authService.login('test@example.com', 'password');

      expect(result).toEqual({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER',
        },
        token: mockToken,
      });

      expect(AuthCacheService.prototype.setUserSession).toHaveBeenCalledWith(
        mockToken,
        expect.objectContaining({
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER',
        })
      );
    });

    it('should throw error for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.login('unknown@example.com', 'password')).rejects.toThrow('Invalid credentials');
      
      expect(logger.warn).toHaveBeenCalledWith('Login attempt failed: user not found', { email: 'unknown@example.com' });
    });

    it('should throw error for inactive account', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        active: false,
      });

      await expect(authService.login('test@example.com', 'password')).rejects.toThrow('Account is disabled');
      
      expect(logger.warn).toHaveBeenCalledWith('Login attempt failed: account disabled', { email: 'test@example.com' });
    });

    it('should throw error for locked account', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        lockedUntil: futureDate,
      });

      await expect(authService.login('test@example.com', 'password')).rejects.toThrow('Account locked due to too many failed attempts');
      
      expect(logger.warn).toHaveBeenCalledWith('Login attempt failed: account locked', { email: 'test@example.com' });
    });

    it('should increment login attempts on wrong password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        loginAttempts: 1,
      });

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          loginAttempts: 1,
          lockedUntil: null,
        },
      });
    });

    it('should lock account after 5 failed attempts', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        loginAttempts: 4,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        loginAttempts: 5,
      });

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          loginAttempts: 5,
          lockedUntil: expect.any(Date),
        },
      });
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token and return user from cache', async () => {
      const mockTokenPayload = { userId: 1 };
      const mockCachedUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockTokenPayload);
      (AuthCacheService.prototype.getUserSession as jest.Mock).mockResolvedValue(mockCachedUser);

      const result = await authService.verifyToken('valid.token');

      expect(result).toEqual(mockCachedUser);
    });

    it('should fetch user from database if not in cache', async () => {
      const mockTokenPayload = { userId: 1 };
      
      (jwt.verify as jest.Mock).mockReturnValue(mockTokenPayload);
      (AuthCacheService.prototype.getUserSession as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.verifyToken('valid.token');

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      });

      expect(AuthCacheService.prototype.setUserSession).toHaveBeenCalled();
    });

    it('should throw error for invalid token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.verifyToken('invalid.token')).rejects.toThrow('Invalid token');
    });
  });

  describe('logout', () => {
    it('should clear user session from cache', async () => {
      await authService.logout('valid.token');

      expect(AuthCacheService.prototype.clearUserSession).toHaveBeenCalledWith('valid.token');
      expect(logger.info).toHaveBeenCalledWith('User logged out successfully');
    });
  });

  describe('refreshToken', () => {
    it('should generate new token for valid user', async () => {
      const mockNewToken = 'new.jwt.token';
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue(mockNewToken);

      const result = await authService.refreshToken(1);

      expect(result).toBe(mockNewToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1 },
        'test-secret',
        expect.any(Object)
      );
    });

    it('should throw error for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.refreshToken(999)).rejects.toThrow('User not found');
    });

    it('should throw error for inactive user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        active: false,
      });

      await expect(authService.refreshToken(1)).rejects.toThrow('User account is inactive');
    });
  });

  describe('changePassword', () => {
    it('should successfully change password', async () => {
      const hashedNewPassword = '$2b$10$newhashedpassword';
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedNewPassword);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: hashedNewPassword,
      });

      await authService.changePassword(1, 'oldpassword', 'newpassword');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password: hashedNewPassword },
      });
    });

    it('should throw error for wrong current password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.changePassword(1, 'wrongpassword', 'newpassword')).rejects.toThrow('Current password is incorrect');
    });
  });
});