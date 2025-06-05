import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as jose from 'jose';
import bcrypt from 'bcrypt';
import { authOptions, createToken, verifyToken } from '../auth';
import { prisma } from '@/lib/prisma';

// Mock des dépendances
jest.mock('@/lib/prisma', () => ({
  prisma: {
    utilisateur: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('bcrypt');
jest.mock('jose');

describe('Auth Service', () => {
  const mockUser = {
    id: 1,
    login: 'testuser',
    password: '$2b$10$hashedpassword',
    prenom: 'Test',
    nom: 'User',
    email: 'test@example.com',
    role: 'USER',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('createToken', () => {
    it('should generate a valid JWT token', async () => {
      const mockJwt = 'mock.jwt.token';
      const signJWT = jest.spyOn(jose, 'SignJWT').mockReturnValue({
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue(mockJwt),
      } as any);

      const payload = { userId: 1, login: 'testuser', role: 'USER' };
      const token = await createToken(payload);

      expect(token).toBe(mockJwt);
      expect(signJWT).toHaveBeenCalledWith(payload);
    });

    it('should generate token with custom expiration', async () => {
      const mockJwt = 'mock.jwt.token';
      jest.spyOn(jose, 'SignJWT').mockReturnValue({
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue(mockJwt),
      } as any);

      const payload = { userId: 1, login: 'testuser', role: 'USER' };
      const token = await createToken(payload, '7d');

      expect(token).toBe(mockJwt);
    });
  });

  describe('verifyToken', () => {
    it('should verify and return valid token payload', async () => {
      const mockPayload = { 
        userId: 1, 
        login: 'testuser', 
        role: 'USER'
      };
      
      jest.spyOn(jose, 'jwtVerify').mockResolvedValue({
        payload: mockPayload,
        protectedHeader: {},
      } as any);

      const result = await verifyToken('valid.jwt.token');
      
      expect(result).toEqual(expect.objectContaining({
        userId: 1,
        login: 'testuser',
        role: 'USER',
      }));
    });

    it('should throw error for invalid token structure', async () => {
      const mockPayload = { 
        userId: 'invalid', // should be number
        login: 'testuser', 
        role: 'USER'
      };
      
      jest.spyOn(jose, 'jwtVerify').mockResolvedValue({
        payload: mockPayload,
        protectedHeader: {},
      } as any);

      await expect(verifyToken('invalid.token')).rejects.toThrow('Token invalide ou malformé');
    });

    it('should throw error for expired token', async () => {
      jest.spyOn(jose, 'jwtVerify').mockRejectedValue(new jose.errors.JWTExpired('Token expired'));

      await expect(verifyToken('expired.token')).rejects.toThrow('Token expiré');
    });

    it('should throw generic error for other JWT errors', async () => {
      jest.spyOn(jose, 'jwtVerify').mockRejectedValue(new Error('Some JWT error'));

      await expect(verifyToken('invalid.token')).rejects.toThrow('Token invalide ou malformé');
    });
  });

  describe('authOptions - Credentials Provider', () => {
    const credentialsProvider = authOptions.providers[0];
    
    it('should authenticate user with valid credentials', async () => {
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const authorize = credentialsProvider.authorize;
      const result = await authorize?.({ login: 'testuser', password: 'password' }, {} as any);

      expect(result).toEqual({
        id: '1',
        login: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
      });
    });

    it('should reject invalid login', async () => {
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);

      const authorize = credentialsProvider.authorize;
      const result = await authorize?.({ login: 'invalid', password: 'password' }, {} as any);

      expect(result).toBeNull();
    });

    it('should reject invalid password', async () => {
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const authorize = credentialsProvider.authorize;
      const result = await authorize?.({ login: 'testuser', password: 'wrong' }, {} as any);

      expect(result).toBeNull();
    });

    it('should use dev users in development mode', async () => {
      process.env.NODE_ENV = 'development';
      process.env.USE_MOCK_AUTH = 'true';
      
      // Recharger le module pour appliquer les nouvelles variables d'environnement
      jest.resetModules();
      const { authOptions: devAuthOptions } = await import('../auth');
      
      const devCredentialsProvider = devAuthOptions.providers[0];
      const authorize = devCredentialsProvider.authorize;
      
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      const result = await authorize?.({ login: 'admin', password: 'admin' }, {} as any);
      
      expect(result).toBeDefined();
      expect(result?.role).toBe('ADMIN');
    });
  });

  describe('Session Callbacks', () => {
    it('should add user info to JWT token', async () => {
      const token = {};
      const user = {
        id: '1',
        login: 'testuser',
        email: 'test@example.com',
        role: 'USER',
      };

      const result = await authOptions.callbacks?.jwt?.({ token, user } as any);

      expect(result).toEqual({
        id: '1',
        login: 'testuser',
        email: 'test@example.com',
        role: 'USER',
      });
    });

    it('should add user info to session', async () => {
      const session = { user: {} };
      const token = {
        id: '1',
        login: 'testuser',
        email: 'test@example.com',
        role: 'USER',
      };

      const result = await authOptions.callbacks?.session?.({ session, token } as any);

      expect(result.user).toEqual({
        id: '1',
        login: 'testuser',
        email: 'test@example.com',
        role: 'USER',
      });
    });
  });
});