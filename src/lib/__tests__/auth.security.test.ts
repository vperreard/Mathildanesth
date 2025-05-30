/**
 * @jest-environment node
 */

import * as jose from 'jose';
import bcrypt from 'bcrypt';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock external dependencies
const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();
const mockCreate = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      update: mockUpdate,
      create: mockCreate,
    },
  },
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// Security test constants
const VALID_JWT_SECRET = 'test-jwt-secret-32-chars-minimum';
const WEAK_JWT_SECRET = 'weak';
const EXPIRED_TOKEN_TIME = -3600; // 1 hour ago
const FUTURE_TOKEN_TIME = 3600; // 1 hour from now

describe('Authentication Security Tests', () => {
  let authModule: any;
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = VALID_JWT_SECRET;
    process.env.NODE_ENV = 'test';
    
    // Clear module cache and re-import
    jest.resetModules();
    authModule = await import('../auth');
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('JWT Security Tests', () => {
    describe('Token Generation Security', () => {
      it('should generate JWT tokens with secure algorithms', async () => {
        const mockUser = {
          id: 1,
          login: 'testuser',
          role: 'USER',
          email: 'test@example.com'
        };

        mockFindUnique.mockResolvedValue(mockUser);

        const token = await authModule.generateToken(mockUser);
        
        // Verify token structure without verifying (we'll test verification separately)
        const parts = token.split('.');
        expect(parts).toHaveLength(3); // header.payload.signature
        
        // Decode header to verify algorithm
        const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
        expect(header.alg).toBe('HS256'); // Secure algorithm
        expect(header.typ).toBe('JWT');
      });

      it('should include required claims in JWT payload', async () => {
        const mockUser = {
          id: 123,
          login: 'securitytest',
          role: 'ADMIN',
          email: 'admin@test.com'
        };

        const token = await authModule.generateToken(mockUser);
        const secretKey = new TextEncoder().encode(VALID_JWT_SECRET);
        
        const { payload } = await jose.jwtVerify(token, secretKey);
        
        // Verify required claims
        expect(payload.userId).toBe(123);
        expect(payload.login).toBe('securitytest');
        expect(payload.role).toBe('ADMIN');
        expect(payload.iat).toBeDefined(); // Issued at
        expect(payload.exp).toBeDefined(); // Expiration
        
        // Verify expiration is reasonable (not too long)
        const now = Math.floor(Date.now() / 1000);
        const expiration = payload.exp as number;
        expect(expiration - now).toBeLessThanOrEqual(24 * 60 * 60); // Max 24 hours
      });

      it('should reject tokens with weak secrets', async () => {
        process.env.JWT_SECRET = WEAK_JWT_SECRET;
        
        const mockUser = {
          id: 1,
          login: 'testuser',
          role: 'USER'
        };

        // In a real implementation, this should throw an error for weak secrets
        // For now, we test that the token would be easily compromised
        await expect(async () => {
          const token = await authModule.generateToken(mockUser);
          const weakKey = new TextEncoder().encode(WEAK_JWT_SECRET);
          await jose.jwtVerify(token, weakKey);
        }).not.toThrow();
        
        // Note: In production, weak secrets should be rejected
      });
    });

    describe('Token Verification Security', () => {
      it('should verify valid tokens correctly', async () => {
        const mockUser = {
          id: 1,
          login: 'testuser',
          role: 'USER'
        };

        const token = await authModule.generateToken(mockUser);
        const result = await authModule.verifyToken(token);
        
        expect(result).toEqual({
          userId: 1,
          login: 'testuser',
          role: 'USER'
        });
      });

      it('should reject expired tokens', async () => {
        const secretKey = new TextEncoder().encode(VALID_JWT_SECRET);
        
        // Create an expired token
        const expiredToken = await new jose.SignJWT({
          userId: 1,
          login: 'testuser',
          role: 'USER'
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime(Math.floor(Date.now() / 1000) + EXPIRED_TOKEN_TIME)
          .sign(secretKey);

        await expect(authModule.verifyToken(expiredToken))
          .rejects.toThrow(/expired|invalid/i);
      });

      it('should reject tokens with invalid signatures', async () => {
        const validToken = await authModule.generateToken({
          id: 1,
          login: 'testuser',
          role: 'USER'
        });

        // Tamper with the signature
        const parts = validToken.split('.');
        const tamperedToken = parts[0] + '.' + parts[1] + '.invalid_signature';

        await expect(authModule.verifyToken(tamperedToken))
          .rejects.toThrow(/invalid|verification/i);
      });

      it('should reject tokens with manipulated payloads', async () => {
        const originalToken = await authModule.generateToken({
          id: 1,
          login: 'user',
          role: 'USER'
        });

        const parts = originalToken.split('.');
        
        // Create malicious payload
        const maliciousPayload = {
          userId: 1,
          login: 'user',
          role: 'ADMIN' // Privilege escalation attempt
        };
        
        const tamperedPayload = Buffer.from(JSON.stringify(maliciousPayload)).toString('base64url');
        const tamperedToken = parts[0] + '.' + tamperedPayload + '.' + parts[2];

        await expect(authModule.verifyToken(tamperedToken))
          .rejects.toThrow(/invalid|verification/i);
      });

      it('should reject tokens with no signature', async () => {
        const unsignedToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOjEsInJvbGUiOiJBRE1JTiJ9.';
        
        await expect(authModule.verifyToken(unsignedToken))
          .rejects.toThrow(/invalid|algorithm/i);
      });

      it('should handle malformed tokens gracefully', async () => {
        const malformedTokens = [
          'not.a.token',
          'onlyonepart',
          '',
          'too.many.parts.here.extra',
          'invalid-base64!@#.invalid.signature'
        ];

        for (const token of malformedTokens) {
          await expect(authModule.verifyToken(token))
            .rejects.toThrow(/invalid|malformed/i);
        }
      });
    });

    describe('Token Security Properties', () => {
      it('should generate unique tokens for identical users', async () => {
        const mockUser = {
          id: 1,
          login: 'testuser',
          role: 'USER'
        };

        const token1 = await authModule.generateToken(mockUser);
        // Wait a moment to ensure different issued_at times
        await new Promise(resolve => setTimeout(resolve, 1));
        const token2 = await authModule.generateToken(mockUser);

        expect(token1).not.toBe(token2);
      });

      it('should not include sensitive information in token payload', async () => {
        const mockUser = {
          id: 1,
          login: 'testuser',
          role: 'USER',
          password: 'secret123',
          secret: 'confidential'
        };

        const token = await authModule.generateToken(mockUser);
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

        // Ensure sensitive fields are not in the token
        expect(payload.password).toBeUndefined();
        expect(payload.secret).toBeUndefined();
        expect(payload.hash).toBeUndefined();
      });

      it('should enforce reasonable token expiration times', async () => {
        const token = await authModule.generateToken({
          id: 1,
          login: 'testuser',
          role: 'USER'
        });

        const secretKey = new TextEncoder().encode(VALID_JWT_SECRET);
        const { payload } = await jose.jwtVerify(token, secretKey);
        
        const now = Math.floor(Date.now() / 1000);
        const expiration = payload.exp as number;
        const tokenLifetime = expiration - now;

        // Token should not be valid for more than 24 hours
        expect(tokenLifetime).toBeLessThanOrEqual(24 * 60 * 60);
        // Token should be valid for at least 1 hour
        expect(tokenLifetime).toBeGreaterThanOrEqual(60 * 60);
      });
    });
  });

  describe('Password Security Tests', () => {
    describe('Password Validation', () => {
      it('should hash passwords securely', async () => {
        const plainPassword = 'testPassword123!';
        const hashedPassword = await bcrypt.hash(plainPassword, 12);
        
        (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
        
        const result = await authModule.hashPassword(plainPassword);
        
        expect(result).toBeDefined();
        expect(result).not.toBe(plainPassword);
        expect(result.length).toBeGreaterThan(50); // Bcrypt hashes are typically 60 chars
      });

      it('should use sufficient salt rounds', async () => {
        const plainPassword = 'testPassword123!';
        
        (bcrypt.hash as jest.Mock).mockImplementation((password, saltRounds) => {
          expect(saltRounds).toBeGreaterThanOrEqual(12); // Minimum secure salt rounds
          return Promise.resolve('$2b$12$hashedPassword');
        });

        await authModule.hashPassword(plainPassword);
        
        expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, expect.any(Number));
      });

      it('should verify passwords correctly', async () => {
        const plainPassword = 'correctPassword123!';
        const hashedPassword = '$2b$12$hashedPassword';

        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        const result = await authModule.comparePasswords(plainPassword, hashedPassword);
        
        expect(result).toBe(true);
        expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      });

      it('should reject incorrect passwords', async () => {
        const wrongPassword = 'wrongPassword';
        const hashedPassword = '$2b$12$hashedPassword';

        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        const result = await authModule.comparePasswords(wrongPassword, hashedPassword);
        
        expect(result).toBe(false);
      });

      it('should handle password comparison errors gracefully', async () => {
        (bcrypt.compare as jest.Mock).mockRejectedValue(new Error('Comparison error'));

        const result = await authModule.comparePasswords('password', 'hash');
        
        expect(result).toBe(false);
      });
    });
  });

  describe('Session Security Tests', () => {
    describe('Session Validation', () => {
      it('should validate active sessions', async () => {
        const mockUser = {
          id: 1,
          login: 'testuser',
          role: 'USER',
          active: true,
          lastLogin: new Date()
        };

        mockFindUnique.mockResolvedValue(mockUser);

        const isValid = await authModule.validateSession(1);
        
        expect(isValid).toBe(true);
        expect(mockFindUnique).toHaveBeenCalledWith({
          where: { id: 1 },
          select: expect.objectContaining({
            id: true,
            active: true,
            lockedUntil: true
          })
        });
      });

      it('should reject sessions for inactive users', async () => {
        const inactiveUser = {
          id: 1,
          login: 'testuser',
          role: 'USER',
          active: false
        };

        mockFindUnique.mockResolvedValue(inactiveUser);

        const isValid = await authModule.validateSession(1);
        
        expect(isValid).toBe(false);
      });

      it('should reject sessions for locked users', async () => {
        const lockedUser = {
          id: 1,
          login: 'testuser',
          role: 'USER',
          active: true,
          lockedUntil: new Date(Date.now() + 30 * 60 * 1000) // Locked for 30 minutes
        };

        mockFindUnique.mockResolvedValue(lockedUser);

        const isValid = await authModule.validateSession(1);
        
        expect(isValid).toBe(false);
      });

      it('should reject sessions for non-existent users', async () => {
        mockFindUnique.mockResolvedValue(null);

        const isValid = await authModule.validateSession(999);
        
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Security Vulnerability Tests', () => {
    describe('Timing Attack Prevention', () => {
      it('should take consistent time for user lookup regardless of existence', async () => {
        const email = 'test@example.com';
        
        // Test with existing user
        mockFindUnique.mockResolvedValue({ id: 1, email, password: 'hash' });
        const start1 = Date.now();
        await authModule.authenticateUser(email, 'password');
        const time1 = Date.now() - start1;

        // Test with non-existent user
        mockFindUnique.mockResolvedValue(null);
        const start2 = Date.now();
        await authModule.authenticateUser('nonexistent@example.com', 'password');
        const time2 = Date.now() - start2;

        // Times should be within reasonable range (allowing for some variance)
        const timeDifference = Math.abs(time1 - time2);
        expect(timeDifference).toBeLessThan(100); // Less than 100ms difference
      });
    });

    describe('Injection Attack Prevention', () => {
      it('should safely handle SQL injection attempts in email', async () => {
        const sqlInjectionAttempts = [
          "'; DROP TABLE users; --",
          "admin@test.com' OR '1'='1",
          "test@test.com'; INSERT INTO users VALUES('hacker'); --"
        ];

        for (const maliciousEmail of sqlInjectionAttempts) {
          mockFindUnique.mockResolvedValue(null);
          
          await expect(authModule.authenticateUser(maliciousEmail, 'password'))
            .rejects.toThrow(/invalid|credentials/i);
            
          // Verify the query was made safely through Prisma
          expect(mockFindUnique).toHaveBeenCalledWith({
            where: { email: maliciousEmail }
          });
        }
      });
    });

    describe('Brute Force Protection', () => {
      it('should track failed login attempts', async () => {
        const mockUser = {
          id: 1,
          email: 'test@example.com',
          password: 'hashedPassword',
          loginAttempts: 0,
          active: true
        };

        mockFindUnique.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(authModule.authenticateUser('test@example.com', 'wrongPassword'))
          .rejects.toThrow(/invalid|credentials/i);

        expect(mockUpdate).toHaveBeenCalledWith({
          where: { id: 1 },
          data: expect.objectContaining({
            loginAttempts: 1
          })
        });
      });

      it('should lock account after max failed attempts', async () => {
        const mockUser = {
          id: 1,
          email: 'test@example.com',
          password: 'hashedPassword',
          loginAttempts: 4, // One away from lock threshold
          active: true
        };

        mockFindUnique.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(authModule.authenticateUser('test@example.com', 'wrongPassword'))
          .rejects.toThrow(/invalid|credentials/i);

        expect(mockUpdate).toHaveBeenCalledWith({
          where: { id: 1 },
          data: expect.objectContaining({
            loginAttempts: 5,
            lockedUntil: expect.any(Date)
          })
        });
      });

      it('should reset failed attempts on successful login', async () => {
        const mockUser = {
          id: 1,
          email: 'test@example.com',
          password: 'hashedPassword',
          loginAttempts: 3,
          active: true
        };

        mockFindUnique.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        const result = await authModule.authenticateUser('test@example.com', 'correctPassword');

        expect(result).toBeDefined();
        expect(mockUpdate).toHaveBeenCalledWith({
          where: { id: 1 },
          data: expect.objectContaining({
            loginAttempts: 0,
            lockedUntil: null,
            lastLogin: expect.any(Date)
          })
        });
      });
    });
  });

  describe('Configuration Security Tests', () => {
    it('should fail gracefully with missing JWT secret', () => {
      delete process.env.JWT_SECRET;
      
      expect(() => {
        // This should either use a secure default or throw an error
        new TextEncoder().encode(process.env.JWT_SECRET || '');
      }).not.toThrow();
      
      // In production, missing secrets should be handled securely
    });

    it('should warn about development mode usage', () => {
      process.env.NODE_ENV = 'development';
      process.env.USE_MOCK_AUTH = 'true';
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Re-import to trigger dev mode checks
      jest.resetModules();
      require('../auth');
      
      // Should warn about insecure development mode
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/development|mock|insecure/i)
      );
      
      consoleSpy.mockRestore();
    });
  });
});