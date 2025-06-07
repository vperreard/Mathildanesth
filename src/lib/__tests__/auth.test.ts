import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as jose from 'jose';
import bcrypt from 'bcrypt';
import { createToken, verifyToken } from '../auth';
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
});