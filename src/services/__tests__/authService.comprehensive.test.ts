/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { authService } from '../authService';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  createMockPrismaClient,
  createMockBcrypt,
  createMockJWT,
  createMockLogger,
  testDataFactories
} from '../../test-utils/standardMocks';

// Mock external dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: createMockPrismaClient()
}));

jest.mock('@/lib/auth/authCache', () => ({
  AuthCacheService: {
    getToken: jest.fn(),
    setToken: jest.fn(),
    deleteToken: jest.fn(),
    clearUserTokens: jest.fn()
  }
}));

jest.mock('@/lib/logger', () => ({
  logger: createMockLogger()
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// Configure mocks after imports
const mockBcrypt = createMockBcrypt();
const mockJwt = createMockJWT();
const mockLogger = createMockLogger();
const mockPrisma = createMockPrismaClient();
const mockAuthCache = {
  getToken: jest.fn(),
  setToken: jest.fn(),
  deleteToken: jest.fn(),
  clearUserTokens: jest.fn()
};

// Apply mocks
require('bcryptjs').compare = mockBcrypt.compare;
require('bcryptjs').hash = mockBcrypt.hash;
require('jsonwebtoken').sign = mockJwt.sign;
require('jsonwebtoken').verify = mockJwt.verify;

// Test constants for medical application
const MEDICAL_USER_ROLES = {
  MAR: 'MAR', // Médecin Anesthésiste Réanimateur
  IADE: 'IADE', // Infirmier Anesthésiste Diplômé d'État
  ADMIN_TOTAL: 'ADMIN_TOTAL',
  ADMIN_PARTIEL: 'ADMIN_PARTIEL',
  CHIRURGIEN: 'CHIRURGIEN',
  USER: 'USER'
} as const;

const TEST_USERS = {
  validMAR: {
    id: 1,
    email: 'dr.martin@hospital.com',
    login: 'dr.martin',
    password: '$2b$12$validHashedPassword',
    role: MEDICAL_USER_ROLES.MAR,
    name: 'Dr. Martin',
    prenom: 'Jean',
    nom: 'Martin',
    active: true,
    mustChangePassword: false,
    loginAttempts: 0,
    lockedUntil: null,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  validIADE: {
    id: 2,
    email: 'nurse.jane@hospital.com',
    login: 'nurse.jane',
    password: '$2b$12$validHashedPassword',
    role: MEDICAL_USER_ROLES.IADE,
    name: 'Nurse Jane',
    prenom: 'Jane',
    nom: 'Dupont',
    active: true,
    mustChangePassword: false,
    loginAttempts: 0,
    lockedUntil: null,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  inactiveUser: {
    id: 3,
    email: 'inactive@hospital.com',
    login: 'inactive',
    password: '$2b$12$validHashedPassword',
    role: MEDICAL_USER_ROLES.USER,
    name: 'Inactive User',
    active: false,
    mustChangePassword: false,
    loginAttempts: 0,
    lockedUntil: null,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  lockedUser: {
    id: 4,
    email: 'locked@hospital.com',
    login: 'locked',
    password: '$2b$12$validHashedPassword',
    role: MEDICAL_USER_ROLES.USER,
    name: 'Locked User',
    active: true,
    mustChangePassword: false,
    loginAttempts: 5,
    lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

const SECURITY_CONFIG = {
  JWT_SECRET: 'test-jwt-secret-256-bit-key-for-medical-app',
  BCRYPT_ROUNDS: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_TIME: 30 * 60 * 1000, // 30 minutes
  TOKEN_EXPIRY: '24h'
};

describe('AuthService - Comprehensive Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = SECURITY_CONFIG.JWT_SECRET;
    process.env.NODE_ENV = 'test';
    
    // Reset all mocks to default behavior
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.user.update.mockReset();
    mockBcrypt.compare.mockReset();
    mockBcrypt.hash.mockReset();
    mockJwt.sign.mockReset();
    mockJwt.verify.mockReset();
    mockAuthCache.cacheAuthToken.mockReset();
    mockAuthCache.cacheUserData.mockReset();
    mockAuthCache.getCachedAuthToken.mockReset();
    mockAuthCache.invalidateAuthToken.mockReset();
    mockAuthCache.invalidateUserData.mockReset();
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('🔐 Authentication Security Tests', () => {
    describe('Valid Login Flow', () => {
      it('should authenticate MAR (Médecin Anesthésiste) with valid credentials', async () => {
        const validToken = 'valid-jwt-token-mar';
        
        mockPrisma.user.findUnique.mockResolvedValue(TEST_USERS.validMAR);
        mockPrisma.user.update.mockResolvedValue({
          ...TEST_USERS.validMAR,
          loginAttempts: 0,
          lastLogin: new Date()
        });
        mockBcrypt.compare.mockResolvedValue(true);
        mockJwt.sign.mockReturnValue(validToken);
        mockAuthCache.cacheAuthToken.mockResolvedValue(undefined);
        mockAuthCache.cacheUserData.mockResolvedValue(undefined);

        const result = await authService.login(TEST_USERS.validMAR.email, 'ValidPassword123!');

        expect(result).toEqual({
          user: {
            id: TEST_USERS.validMAR.id,
            email: TEST_USERS.validMAR.email,
            name: TEST_USERS.validMAR.name,
            role: TEST_USERS.validMAR.role
          },
          token: validToken
        });

        // Verify security measures
        expect(mockBcrypt.compare).toHaveBeenCalledWith('ValidPassword123!', TEST_USERS.validMAR.password);
        expect(mockJwt.sign).toHaveBeenCalledWith(
          { userId: 1, role: 'MAR' },
          SECURITY_CONFIG.JWT_SECRET,
          { expiresIn: '24h' }
        );
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: {
            loginAttempts: 0,
            lockedUntil: null,
            lastLogin: expect.any(Date)
          }
        });
      });

      it('should authenticate IADE (Infirmier Anesthésiste) with valid credentials', async () => {
        const validToken = 'valid-jwt-token-iade';
        
        mockPrisma.user.findUnique.mockResolvedValue(TEST_USERS.validIADE);
        mockPrisma.user.update.mockResolvedValue(TEST_USERS.validIADE);
        mockBcrypt.compare.mockResolvedValue(true);
        mockJwt.sign.mockReturnValue(validToken);
        mockAuthCache.cacheAuthToken.mockResolvedValue(undefined);
        mockAuthCache.cacheUserData.mockResolvedValue(undefined);

        const result = await authService.login(TEST_USERS.validIADE.email, 'ValidPassword123!');

        expect(result.user.role).toBe(MEDICAL_USER_ROLES.IADE);
        expect(result.token).toBe(validToken);
      });

      it('should handle case-insensitive email lookup securely', async () => {
        const emailVariations = [
          'DR.MARTIN@HOSPITAL.COM',
          'Dr.Martin@Hospital.Com',
          'dr.martin@HOSPITAL.com'
        ];

        for (const email of emailVariations) {
          mockPrisma.user.findUnique.mockResolvedValue(TEST_USERS.validMAR);
          mockBcrypt.compare.mockResolvedValue(true);
          mockJwt.sign.mockReturnValue('token');
          mockPrisma.user.update.mockResolvedValue(TEST_USERS.validMAR);

          await authService.login(email, 'ValidPassword123!');

          expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
            where: { email: email.toLowerCase() }
          });

          jest.clearAllMocks();
        }
      });
    });

    describe('Authentication Failures & Security', () => {
      it('should reject login for non-existent users', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
          authService.login('nonexistent@hospital.com', 'password123')
        ).rejects.toThrow('Invalid credentials');

        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Login attempt failed: user not found',
          { email: 'nonexistent@hospital.com' }
        );
      });

      it('should reject login for inactive medical staff', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(TEST_USERS.inactiveUser);

        await expect(
          authService.login(TEST_USERS.inactiveUser.email, 'password123')
        ).rejects.toThrow('Account is disabled');

        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Login attempt failed: account disabled',
          { email: TEST_USERS.inactiveUser.email }
        );
      });

      it('should reject login with incorrect passwords', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(TEST_USERS.validMAR);
        mockBcrypt.compare.mockResolvedValue(false);
        mockPrisma.user.update.mockResolvedValue({
          ...TEST_USERS.validMAR,
          loginAttempts: 1
        });

        await expect(
          authService.login(TEST_USERS.validMAR.email, 'WrongPassword')
        ).rejects.toThrow('Invalid credentials');

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: TEST_USERS.validMAR.id },
          data: {
            loginAttempts: 1,
            lockedUntil: null
          }
        });
      });

      it('should enforce account lockout after maximum failed attempts', async () => {
        const userNearLockout = {
          ...TEST_USERS.validMAR,
          loginAttempts: 4
        };
        
        mockPrisma.user.findUnique.mockResolvedValue(userNearLockout);
        mockBcrypt.compare.mockResolvedValue(false);
        mockPrisma.user.update.mockResolvedValue({
          ...userNearLockout,
          loginAttempts: 5,
          lockedUntil: new Date(Date.now() + 30 * 60 * 1000)
        });

        await expect(
          authService.login(userNearLockout.email, 'WrongPassword')
        ).rejects.toThrow('Invalid credentials');

        const updateCall = mockPrisma.user.update.mock.calls[0][0];
        expect(updateCall.data.loginAttempts).toBe(5);
        expect(updateCall.data.lockedUntil).toBeInstanceOf(Date);
        
        // Verify lockout duration (30 minutes)
        const lockDuration = updateCall.data.lockedUntil.getTime() - Date.now();
        expect(lockDuration).toBeCloseTo(30 * 60 * 1000, -3000); // ±3 seconds tolerance
      });

      it('should reject login for locked accounts', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(TEST_USERS.lockedUser);

        await expect(
          authService.login(TEST_USERS.lockedUser.email, 'ValidPassword123!')
        ).rejects.toThrow('Account locked due to too many failed attempts');

        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Login attempt failed: account locked',
          { email: TEST_USERS.lockedUser.email }
        );
      });

      it('should allow login after lock expiration', async () => {
        const expiredLockUser = {
          ...TEST_USERS.lockedUser,
          lockedUntil: new Date(Date.now() - 1000) // Expired 1 second ago
        };
        
        mockPrisma.user.findUnique.mockResolvedValue(expiredLockUser);
        mockBcrypt.compare.mockResolvedValue(true);
        mockJwt.sign.mockReturnValue('valid-token');
        mockPrisma.user.update.mockResolvedValue({
          ...expiredLockUser,
          loginAttempts: 0,
          lockedUntil: null,
          lastLogin: new Date()
        });

        const result = await authService.login(expiredLockUser.email, 'ValidPassword123!');

        expect(result).toBeDefined();
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: expiredLockUser.id },
          data: {
            loginAttempts: 0,
            lockedUntil: null,
            lastLogin: expect.any(Date)
          }
        });
      });
    });

    describe('Input Validation & Injection Prevention', () => {
      it('should validate email format and reject malicious inputs', async () => {
        const maliciousEmails = [
          "'; DROP TABLE users; --",
          "<script>alert('xss')</script>",
          "../../admin",
          "\\x00admin",
          "admin' OR '1'='1",
          "user@hospital.com'; DELETE FROM users; --"
        ];

        for (const email of maliciousEmails) {
          mockPrisma.user.findUnique.mockResolvedValue(null);

          await expect(
            authService.login(email, 'password123')
          ).rejects.toThrow('Invalid credentials');

          // Ensure database query is safe
          expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
            where: { email: email.toLowerCase() }
          });
        }
      });

      it('should handle extremely long inputs securely', async () => {
        const longEmail = 'a'.repeat(1000) + '@hospital.com';
        const longPassword = 'p'.repeat(10000);

        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
          authService.login(longEmail, longPassword)
        ).rejects.toThrow('Invalid credentials');
      });

      it('should sanitize and validate all input parameters', async () => {
        const invalidInputs = [
          { email: null, password: 'password' },
          { email: undefined, password: 'password' },
          { email: '', password: 'password' },
          { email: 'test@hospital.com', password: null },
          { email: 'test@hospital.com', password: undefined },
          { email: 'test@hospital.com', password: '' }
        ];

        for (const { email, password } of invalidInputs) {
          await expect(
            authService.login(email as any, password as any)
          ).rejects.toThrow();
        }
      });
    });
  });

  describe('🔑 JWT Token Security Tests', () => {
    describe('Token Generation', () => {
      it('should generate secure JWT tokens with proper claims', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(TEST_USERS.validMAR);
        mockBcrypt.compare.mockResolvedValue(true);
        mockJwt.sign.mockReturnValue('secure-jwt-token');
        mockPrisma.user.update.mockResolvedValue(TEST_USERS.validMAR);

        await authService.login(TEST_USERS.validMAR.email, 'ValidPassword123!');

        expect(mockJwt.sign).toHaveBeenCalledWith(
          {
            userId: TEST_USERS.validMAR.id,
            role: TEST_USERS.validMAR.role
          },
          SECURITY_CONFIG.JWT_SECRET,
          { expiresIn: '24h' }
        );
      });

      it('should not include sensitive data in JWT payload', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(TEST_USERS.validMAR);
        mockBcrypt.compare.mockResolvedValue(true);
        mockJwt.sign.mockReturnValue('secure-jwt-token');
        mockPrisma.user.update.mockResolvedValue(TEST_USERS.validMAR);

        await authService.login(TEST_USERS.validMAR.email, 'ValidPassword123!');

        const jwtPayload = mockJwt.sign.mock.calls[0][0];
        expect(jwtPayload).not.toHaveProperty('password');
        expect(jwtPayload).not.toHaveProperty('loginAttempts');
        expect(jwtPayload).not.toHaveProperty('lockedUntil');
        expect(jwtPayload).not.toHaveProperty('email');
      });
    });

    describe('Token Validation', () => {
      it('should validate cached tokens efficiently', async () => {
        const cachedAuth = {
          userId: 1,
          role: 'MAR',
          exp: Math.floor(Date.now() / 1000) + 3600
        };

        mockAuthCache.getCachedAuthToken.mockResolvedValue(cachedAuth);

        const result = await authService.validateToken('cached-token');

        expect(result).toEqual(cachedAuth);
        expect(mockAuthCache.getCachedAuthToken).toHaveBeenCalledWith('cached-token');
        expect(mockJwt.verify).not.toHaveBeenCalled(); // Should use cache
      });

      it('should validate non-cached tokens and cache them', async () => {
        const payload = {
          userId: 1,
          role: 'MAR',
          exp: Math.floor(Date.now() / 1000) + 3600
        };

        mockAuthCache.getCachedAuthToken.mockResolvedValue(null);
        mockJwt.verify.mockReturnValue(payload);
        mockAuthCache.cacheAuthToken.mockResolvedValue(undefined);

        const result = await authService.validateToken('non-cached-token');

        expect(result).toEqual(payload);
        expect(mockJwt.verify).toHaveBeenCalledWith('non-cached-token', SECURITY_CONFIG.JWT_SECRET);
        expect(mockAuthCache.cacheAuthToken).toHaveBeenCalledWith('non-cached-token', payload);
      });

      it('should reject expired tokens and invalidate cache', async () => {
        const expiredAuth = {
          userId: 1,
          role: 'MAR',
          exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
        };

        mockAuthCache.getCachedAuthToken.mockResolvedValue(expiredAuth);
        mockAuthCache.invalidateAuthToken.mockResolvedValue(undefined);

        await expect(
          authService.validateToken('expired-token')
        ).rejects.toThrow('Token expired');

        expect(mockAuthCache.invalidateAuthToken).toHaveBeenCalledWith('expired-token');
      });

      it('should reject invalid token signatures', async () => {
        mockAuthCache.getCachedAuthToken.mockResolvedValue(null);
        mockJwt.verify.mockImplementation(() => {
          throw new Error('Invalid signature');
        });

        await expect(
          authService.validateToken('invalid-signature-token')
        ).rejects.toThrow();

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Token validation failed',
          expect.any(Error)
        );
      });
    });

    describe('Token Refresh Security', () => {
      it('should securely refresh valid tokens', async () => {
        const oldPayload = {
          userId: 1,
          role: 'MAR',
          exp: Math.floor(Date.now() / 1000) + 3600
        };
        const newToken = 'new-refreshed-token';

        mockJwt.verify.mockReturnValue(oldPayload);
        mockJwt.sign.mockReturnValue(newToken);
        mockAuthCache.invalidateAuthToken.mockResolvedValue(undefined);
        mockAuthCache.cacheAuthToken.mockResolvedValue(undefined);

        const result = await authService.refreshToken('old-token');

        expect(result).toBe(newToken);
        expect(mockAuthCache.invalidateAuthToken).toHaveBeenCalledWith('old-token');
        expect(mockAuthCache.cacheAuthToken).toHaveBeenCalledWith(newToken, {
          userId: 1,
          role: 'MAR',
          exp: expect.any(Number)
        });
      });

      it('should reject refresh for invalid tokens', async () => {
        mockJwt.verify.mockImplementation(() => {
          throw new Error('Invalid token');
        });

        await expect(
          authService.refreshToken('invalid-token')
        ).rejects.toThrow();

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Token refresh failed',
          expect.any(Error)
        );
      });
    });
  });

  describe('🔒 Password Security Tests', () => {
    describe('Password Change Security', () => {
      it('should securely change passwords with proper validation', async () => {
        const newHashedPassword = '$2b$12$newSecureHashedPassword';

        mockPrisma.user.findUnique.mockResolvedValue(TEST_USERS.validMAR);
        mockBcrypt.compare.mockResolvedValue(true); // Current password correct
        mockBcrypt.hash.mockResolvedValue(newHashedPassword);
        mockPrisma.user.update.mockResolvedValue({
          ...TEST_USERS.validMAR,
          password: newHashedPassword
        });

        await authService.changePassword(
          TEST_USERS.validMAR.id,
          'CurrentPassword123!',
          'NewSecurePassword456!'
        );

        expect(mockBcrypt.compare).toHaveBeenCalledWith(
          'CurrentPassword123!',
          TEST_USERS.validMAR.password
        );
        expect(mockBcrypt.hash).toHaveBeenCalledWith('NewSecurePassword456!', 10);
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: TEST_USERS.validMAR.id },
          data: { password: newHashedPassword }
        });
      });

      it('should reject password change with incorrect current password', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(TEST_USERS.validMAR);
        mockBcrypt.compare.mockResolvedValue(false); // Wrong current password

        await expect(
          authService.changePassword(
            TEST_USERS.validMAR.id,
            'WrongCurrentPassword',
            'NewPassword123!'
          )
        ).rejects.toThrow('Current password is incorrect');

        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });

      it('should reject password change for non-existent users', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
          authService.changePassword(999, 'current', 'new')
        ).rejects.toThrow('User not found');
      });
    });
  });

  describe('🚫 Security Attack Prevention', () => {
    describe('Timing Attack Prevention', () => {
      it('should take consistent time for valid vs invalid credentials', async () => {
        const iterations = 5;
        const validTimes: number[] = [];
        const invalidTimes: number[] = [];

        // Test valid credentials
        for (let i = 0; i < iterations; i++) {
          mockPrisma.user.findUnique.mockResolvedValue(TEST_USERS.validMAR);
          mockBcrypt.compare.mockResolvedValue(true);
          mockJwt.sign.mockReturnValue('token');
          mockPrisma.user.update.mockResolvedValue(TEST_USERS.validMAR);

          const start = Date.now();
          await authService.login(TEST_USERS.validMAR.email, 'ValidPassword123!');
          validTimes.push(Date.now() - start);

          jest.clearAllMocks();
        }

        // Test invalid credentials
        for (let i = 0; i < iterations; i++) {
          mockPrisma.user.findUnique.mockResolvedValue(TEST_USERS.validMAR);
          mockBcrypt.compare.mockResolvedValue(false);
          mockPrisma.user.update.mockResolvedValue(TEST_USERS.validMAR);

          const start = Date.now();
          try {
            await authService.login(TEST_USERS.validMAR.email, 'InvalidPassword');
          } catch (error) {
            // Expected to fail
          }
          invalidTimes.push(Date.now() - start);

          jest.clearAllMocks();
        }

        const avgValidTime = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
        const avgInvalidTime = invalidTimes.reduce((a, b) => a + b, 0) / invalidTimes.length;
        
        // Times should be within reasonable range
        const timeDifference = Math.abs(avgValidTime - avgInvalidTime);
        expect(timeDifference).toBeLessThan(100); // Less than 100ms difference
      });
    });

    describe('Rate Limiting Behavior', () => {
      it('should handle rapid login attempts gracefully', async () => {
        const numAttempts = 20;
        const attempts = [];

        mockPrisma.user.findUnique.mockResolvedValue(TEST_USERS.validMAR);
        mockBcrypt.compare.mockResolvedValue(false);
        mockPrisma.user.update.mockResolvedValue(TEST_USERS.validMAR);

        for (let i = 0; i < numAttempts; i++) {
          attempts.push(
            authService.login(TEST_USERS.validMAR.email, 'wrong-password').catch(() => {
              // Expected to fail
            })
          );
        }

        // All attempts should complete without hanging
        await expect(Promise.all(attempts)).resolves.not.toThrow();
        expect(mockPrisma.user.update).toHaveBeenCalledTimes(numAttempts);
      });
    });

    describe('Database Error Handling', () => {
      it('should handle database connection failures securely', async () => {
        mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

        await expect(
          authService.login(TEST_USERS.validMAR.email, 'password')
        ).rejects.toThrow();

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Login failed',
          expect.any(Error)
        );
      });
    });
  });

  describe('🔐 Session Management Security', () => {
    describe('Logout Security', () => {
      it('should securely logout and invalidate all session data', async () => {
        const mockPayload = {
          userId: 1,
          role: 'MAR'
        };

        mockJwt.verify.mockReturnValue(mockPayload);
        mockAuthCache.invalidateAuthToken.mockResolvedValue(undefined);
        mockAuthCache.invalidateUserData.mockResolvedValue(undefined);

        await authService.logout('valid-token');

        expect(mockAuthCache.invalidateAuthToken).toHaveBeenCalledWith('valid-token');
        expect(mockAuthCache.invalidateUserData).toHaveBeenCalledWith('1');
        expect(mockLogger.info).toHaveBeenCalledWith(
          'User logged out successfully',
          { userId: 1 }
        );
      });

      it('should handle logout with invalid tokens gracefully', async () => {
        mockJwt.verify.mockImplementation(() => {
          throw new Error('Invalid token');
        });
        mockAuthCache.invalidateAuthToken.mockResolvedValue(undefined);

        // Should not throw error for invalid tokens
        await expect(authService.logout('invalid-token')).resolves.not.toThrow();

        expect(mockAuthCache.invalidateAuthToken).toHaveBeenCalledWith('invalid-token');
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Logout attempted with invalid token'
        );
      });
    });
  });

  describe('📊 Security Monitoring & Logging', () => {
    it('should log all security-relevant events', async () => {
      // Test successful login logging
      mockPrisma.user.findUnique.mockResolvedValue(TEST_USERS.validMAR);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('token');
      mockPrisma.user.update.mockResolvedValue(TEST_USERS.validMAR);

      await authService.login(TEST_USERS.validMAR.email, 'ValidPassword123!');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'User logged in successfully',
        { userId: TEST_USERS.validMAR.id }
      );
    });

    it('should log security violations and failed attempts', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login('attacker@malicious.com', 'password')
      ).rejects.toThrow();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Login attempt failed: user not found',
        { email: 'attacker@malicious.com' }
      );
    });
  });
});