import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authService } from '../authService';
import { AuthCacheService } from '@/lib/auth/authCache';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('@/lib/auth/authCache');
jest.mock('@/lib/logger');
jest.mock('@/lib/prisma');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
  });

  describe('login', () => {
    it('devrait authentifier un utilisateur avec des identifiants valides', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'ADMIN',
        name: 'Test User',
        active: true
      };

      const mockToken = 'mock-jwt-token';

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      mockPrisma.user.update = jest.fn().mockResolvedValue({ ...mockUser, loginAttempts: 0, lastLogin: expect.any(Date) });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);
      (AuthCacheService.cacheAuthToken as jest.Mock).mockResolvedValue(undefined);
      (AuthCacheService.cacheUserData as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role
        },
        token: mockToken
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1, role: 'ADMIN' },
        'test-secret',
        { expiresIn: '24h' }
      );
      expect(AuthCacheService.cacheAuthToken).toHaveBeenCalled();
      expect(AuthCacheService.cacheUserData).toHaveBeenCalled();
    });

    it('devrait rejeter avec email invalide', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(authService.login('invalid@example.com', 'password123'))
        .rejects.toThrow('Invalid credentials');

      expect(logger.warn).toHaveBeenCalledWith(
        'Login attempt failed: user not found',
        { email: 'invalid@example.com' }
      );
    });

    it('devrait rejeter avec mot de passe invalide', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        active: true,
        loginAttempts: 0
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      mockPrisma.user.update = jest.fn().mockResolvedValue({ ...mockUser, loginAttempts: 1 });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');

      expect(logger.warn).toHaveBeenCalledWith(
        'Login attempt failed: invalid password',
        { email: 'test@example.com' }
      );
    });

    it('devrait rejeter si utilisateur inactif', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        active: false
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(authService.login('test@example.com', 'password123'))
        .rejects.toThrow('Account is disabled');

      expect(logger.warn).toHaveBeenCalledWith(
        'Login attempt failed: account disabled',
        { email: 'test@example.com' }
      );
    });
  });

  describe('validateToken', () => {
    it('devrait valider un token valide depuis le cache', async () => {
      const mockCachedAuth = {
        userId: 1,
        role: 'ADMIN',
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      (AuthCacheService.getCachedAuthToken as jest.Mock).mockResolvedValue(mockCachedAuth);

      const result = await authService.validateToken('valid-token');

      expect(result).toEqual(mockCachedAuth);
      expect(AuthCacheService.getCachedAuthToken).toHaveBeenCalledWith('valid-token');
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it('devrait valider un token valide non-caché', async () => {
      const mockPayload = {
        userId: 1,
        role: 'ADMIN',
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      (AuthCacheService.getCachedAuthToken as jest.Mock).mockResolvedValue(null);
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      (AuthCacheService.cacheAuthToken as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.validateToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(AuthCacheService.cacheAuthToken).toHaveBeenCalled();
    });

    it('devrait rejeter un token expiré', async () => {
      const mockCachedAuth = {
        userId: 1,
        role: 'ADMIN',
        exp: Math.floor(Date.now() / 1000) - 3600 // Expiré
      };

      (AuthCacheService.getCachedAuthToken as jest.Mock).mockResolvedValue(mockCachedAuth);
      (AuthCacheService.invalidateAuthToken as jest.Mock).mockResolvedValue(undefined);

      await expect(authService.validateToken('expired-token'))
        .rejects.toThrow('Token expired');

      expect(AuthCacheService.invalidateAuthToken).toHaveBeenCalledWith('expired-token');
    });

    it('devrait rejeter un token invalide', async () => {
      (AuthCacheService.getCachedAuthToken as jest.Mock).mockResolvedValue(null);
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.validateToken('invalid-token'))
        .rejects.toThrow('Invalid token');

      expect(logger.error).toHaveBeenCalledWith(
        'Token validation failed',
        expect.any(Error)
      );
    });
  });

  describe('refreshToken', () => {
    it('devrait rafraîchir un token valide', async () => {
      const mockPayload = {
        userId: 1,
        role: 'ADMIN',
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const newToken = 'new-token';

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      (jwt.sign as jest.Mock).mockReturnValue(newToken);
      (AuthCacheService.invalidateAuthToken as jest.Mock).mockResolvedValue(undefined);
      (AuthCacheService.cacheAuthToken as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.refreshToken('old-token');

      expect(result).toBe(newToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1, role: 'ADMIN' },
        'test-secret',
        { expiresIn: '24h' }
      );
      expect(AuthCacheService.invalidateAuthToken).toHaveBeenCalledWith('old-token');
      expect(AuthCacheService.cacheAuthToken).toHaveBeenCalled();
    });

    it('devrait rejeter un token invalide', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken('invalid-token'))
        .rejects.toThrow('Invalid token');
    });
  });

  describe('logout', () => {
    it('devrait invalider le token et les données utilisateur', async () => {
      const mockPayload = {
        userId: 1,
        role: 'ADMIN'
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      (AuthCacheService.invalidateAuthToken as jest.Mock).mockResolvedValue(undefined);
      (AuthCacheService.invalidateUserData as jest.Mock).mockResolvedValue(undefined);

      await authService.logout('valid-token');

      expect(AuthCacheService.invalidateAuthToken).toHaveBeenCalledWith('valid-token');
      expect(AuthCacheService.invalidateUserData).toHaveBeenCalledWith('1');
      expect(logger.info).toHaveBeenCalledWith(
        'User logged out successfully',
        { userId: 1 }
      );
    });

    it('devrait gérer un token invalide lors du logout', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authService.logout('invalid-token');

      expect(AuthCacheService.invalidateAuthToken).toHaveBeenCalledWith('invalid-token');
      expect(logger.warn).toHaveBeenCalledWith(
        'Logout attempted with invalid token'
      );
    });
  });

  describe('changePassword', () => {
    it('devrait changer le mot de passe avec succès', async () => {
      const mockUser = {
        id: 1,
        password: 'oldHashedPassword'
      };
      const newHashedPassword = 'newHashedPassword';

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      mockPrisma.user.update = jest.fn().mockResolvedValue({
        ...mockUser,
        password: newHashedPassword
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue(newHashedPassword);

      await authService.changePassword(1, 'oldPassword', 'newPassword');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password: newHashedPassword }
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Password changed successfully',
        { userId: 1 }
      );
    });

    it('devrait rejeter avec ancien mot de passe invalide', async () => {
      const mockUser = {
        id: 1,
        password: 'oldHashedPassword'
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.changePassword(1, 'wrongPassword', 'newPassword'))
        .rejects.toThrow('Current password is incorrect');
    });

    it('devrait rejeter si utilisateur non trouvé', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(authService.changePassword(999, 'password', 'newPassword'))
        .rejects.toThrow('User not found');
    });
  });

  describe('Security Features', () => {
    it('devrait implémenter rate limiting pour login', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        active: true,
        loginAttempts: 4,
        lockedUntil: null
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      mockPrisma.user.update = jest.fn().mockResolvedValue({
        ...mockUser,
        loginAttempts: 5,
        lockedUntil: new Date(Date.now() + 30 * 60 * 1000)
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Account locked due to too many failed attempts');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          loginAttempts: 5,
          lockedUntil: expect.any(Date)
        }
      });
    });

    it('devrait réinitialiser les tentatives après login réussi', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        active: true,
        loginAttempts: 3,
        role: 'USER',
        name: 'Test User'
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      mockPrisma.user.update = jest.fn().mockResolvedValue({
        ...mockUser,
        loginAttempts: 0,
        lastLogin: new Date()
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('token');
      (AuthCacheService.cacheAuthToken as jest.Mock).mockResolvedValue(undefined);
      (AuthCacheService.cacheUserData as jest.Mock).mockResolvedValue(undefined);

      await authService.login('test@example.com', 'password123');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          loginAttempts: 0,
          lastLogin: expect.any(Date),
          lockedUntil: null
        }
      });
    });
  });
});