/**
 * @jest-environment node
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
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

// Use the mocked versions from standardMocks

describe('AuthService Security Tests', () => {
  let testEnv: any;

  beforeAll(() => {
    testEnv = setupTestEnvironment();
  });

  afterAll(() => {
    cleanupTestEnvironment();
    testEnv.restoreConsole?.();
  });
  const validUser = {
    id: 1,
    email: 'dr.test@hospital.com',
    login: 'dr.test',
    nom: 'Test',
    prenom: 'Doctor',
    password: '$2b$12$hashedPassword',
    role: 'MAR',
    active: true,
    mustChangePassword: false,
    loginAttempts: 0,
    lockedUntil: null,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validPassword = 'SecurePassword123!';
  const invalidPassword = 'wrong_password';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-jwt-secret-key';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Login Security Tests', () => {
    describe('Valid Authentication', () => {
      it('should authenticate valid user credentials', async () => {
        mockPrismaUser.findUnique.mockResolvedValue(validUser);
        mockBcryptCompare.mockResolvedValue(true);
        mockJwtSign.mockReturnValue('valid.jwt.token');
        mockPrismaUser.update.mockResolvedValue({
          ...validUser,
          loginAttempts: 0,
          lastLogin: new Date(),
        });

        const result = await authService.login(validUser.email, validPassword);

        expect(result).toEqual({
          user: {
            id: validUser.id,
            email: validUser.email,
            name: `${validUser.prenom} ${validUser.nom}`,
            role: validUser.role,
          },
          token: 'valid.jwt.token',
        });

        expect(mockPrismaUser.update).toHaveBeenCalledWith({
          where: { id: validUser.id },
          data: {
            loginAttempts: 0,
            lockedUntil: null,
            lastLogin: expect.any(Date),
          },
        });

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Successful login',
          expect.objectContaining({ email: validUser.email })
        );
      });

      it('should handle case-insensitive email lookup', async () => {
        const emailVariations = [
          'DR.TEST@HOSPITAL.COM',
          'Dr.Test@Hospital.Com',
          'dr.test@HOSPITAL.com',
        ];

        for (const email of emailVariations) {
          mockPrismaUser.findUnique.mockResolvedValue(validUser);
          mockBcryptCompare.mockResolvedValue(true);
          mockJwtSign.mockReturnValue('valid.jwt.token');

          const result = await authService.login(email, validPassword);

          expect(result).toBeDefined();
          expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
            where: { email: email.toLowerCase() },
          });

          jest.clearAllMocks();
        }
      });

      it('should update user last login timestamp', async () => {
        const loginTime = new Date();
        jest.spyOn(Date, 'now').mockReturnValue(loginTime.getTime());

        mockPrismaUser.findUnique.mockResolvedValue(validUser);
        mockBcryptCompare.mockResolvedValue(true);
        mockJwtSign.mockReturnValue('valid.jwt.token');

        await authService.login(validUser.email, validPassword);

        expect(mockPrismaUser.update).toHaveBeenCalledWith({
          where: { id: validUser.id },
          data: expect.objectContaining({
            lastLogin: expect.any(Date),
          }),
        });
      });
    });

    describe('Authentication Failures', () => {
      it('should reject login for non-existent users', async () => {
        mockPrismaUser.findUnique.mockResolvedValue(null);

        await expect(
          authService.login('nonexistent@hospital.com', validPassword)
        ).rejects.toThrow('Invalid credentials');

        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Login attempt failed: user not found',
          { email: 'nonexistent@hospital.com' }
        );
      });

      it('should reject login for inactive users', async () => {
        const inactiveUser = { ...validUser, active: false };
        mockPrismaUser.findUnique.mockResolvedValue(inactiveUser);

        await expect(
          authService.login(validUser.email, validPassword)
        ).rejects.toThrow('Account is disabled');

        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Login attempt failed: account disabled',
          { email: validUser.email }
        );
      });

      it('should reject login for incorrect passwords', async () => {
        mockPrismaUser.findUnique.mockResolvedValue(validUser);
        mockBcryptCompare.mockResolvedValue(false);

        await expect(
          authService.login(validUser.email, invalidPassword)
        ).rejects.toThrow('Invalid credentials');

        expect(mockPrismaUser.update).toHaveBeenCalledWith({
          where: { id: validUser.id },
          data: {
            loginAttempts: 1,
            lockedUntil: null,
          },
        });

        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Login attempt failed: invalid password',
          expect.objectContaining({ email: validUser.email })
        );
      });
    });

    describe('Account Lockout Security', () => {
      it('should increment failed login attempts', async () => {
        const userWithAttempts = { ...validUser, loginAttempts: 2 };
        mockPrismaUser.findUnique.mockResolvedValue(userWithAttempts);
        mockBcryptCompare.mockResolvedValue(false);

        await expect(
          authService.login(validUser.email, invalidPassword)
        ).rejects.toThrow('Invalid credentials');

        expect(mockPrismaUser.update).toHaveBeenCalledWith({
          where: { id: validUser.id },
          data: {
            loginAttempts: 3,
            lockedUntil: null,
          },
        });
      });

      it('should lock account after maximum failed attempts', async () => {
        const userNearLockout = { ...validUser, loginAttempts: 4 };
        mockPrismaUser.findUnique.mockResolvedValue(userNearLockout);
        mockBcryptCompare.mockResolvedValue(false);

        await expect(
          authService.login(validUser.email, invalidPassword)
        ).rejects.toThrow('Invalid credentials');

        expect(mockPrismaUser.update).toHaveBeenCalledWith({
          where: { id: validUser.id },
          data: {
            loginAttempts: 5,
            lockedUntil: expect.any(Date),
          },
        });

        // Verify lock duration is 30 minutes
        const updateCall = mockPrismaUser.update.mock.calls[0][0];
        const lockUntil = updateCall.data.lockedUntil;
        const lockDuration = lockUntil.getTime() - Date.now();
        expect(lockDuration).toBeCloseTo(30 * 60 * 1000, -3); // 30 minutes ±1 second
      });

      it('should reject login for locked accounts', async () => {
        const lockedUser = {
          ...validUser,
          loginAttempts: 5,
          lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // Locked for 30 minutes
        };
        mockPrismaUser.findUnique.mockResolvedValue(lockedUser);

        await expect(
          authService.login(validUser.email, validPassword)
        ).rejects.toThrow('Account locked due to too many failed attempts');

        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Login attempt failed: account locked',
          { email: validUser.email }
        );
      });

      it('should allow login for expired account locks', async () => {
        const expiredLockUser = {
          ...validUser,
          loginAttempts: 5,
          lockedUntil: new Date(Date.now() - 1000), // Lock expired 1 second ago
        };
        mockPrismaUser.findUnique.mockResolvedValue(expiredLockUser);
        mockBcryptCompare.mockResolvedValue(true);
        mockJwtSign.mockReturnValue('valid.jwt.token');

        const result = await authService.login(validUser.email, validPassword);

        expect(result).toBeDefined();
        expect(mockPrismaUser.update).toHaveBeenCalledWith({
          where: { id: validUser.id },
          data: {
            loginAttempts: 0,
            lockedUntil: null,
            lastLogin: expect.any(Date),
          },
        });
      });

      it('should reset failed attempts on successful login', async () => {
        const userWithAttempts = { ...validUser, loginAttempts: 3 };
        mockPrismaUser.findUnique.mockResolvedValue(userWithAttempts);
        mockBcryptCompare.mockResolvedValue(true);
        mockJwtSign.mockReturnValue('valid.jwt.token');

        await authService.login(validUser.email, validPassword);

        expect(mockPrismaUser.update).toHaveBeenCalledWith({
          where: { id: validUser.id },
          data: {
            loginAttempts: 0,
            lockedUntil: null,
            lastLogin: expect.any(Date),
          },
        });
      });
    });

    describe('Password Security', () => {
      it('should use secure password comparison', async () => {
        mockPrismaUser.findUnique.mockResolvedValue(validUser);
        mockBcryptCompare.mockResolvedValue(true);
        mockJwtSign.mockReturnValue('valid.jwt.token');

        await authService.login(validUser.email, validPassword);

        expect(mockBcryptCompare).toHaveBeenCalledWith(
          validPassword,
          validUser.password
        );
      });

      it('should handle bcrypt comparison errors', async () => {
        mockPrismaUser.findUnique.mockResolvedValue(validUser);
        mockBcryptCompare.mockRejectedValue(new Error('Bcrypt error'));

        await expect(
          authService.login(validUser.email, validPassword)
        ).rejects.toThrow('Authentication failed');

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Password comparison failed',
          expect.objectContaining({
            email: validUser.email,
            error: expect.any(Error),
          })
        );
      });

      it('should enforce password change requirements', async () => {
        const userNeedingPasswordChange = {
          ...validUser,
          mustChangePassword: true,
        };
        mockPrismaUser.findUnique.mockResolvedValue(userNeedingPasswordChange);
        mockBcryptCompare.mockResolvedValue(true);
        mockJwtSign.mockReturnValue('valid.jwt.token');

        const result = await authService.login(validUser.email, validPassword);

        expect(result.user).toEqual(
          expect.objectContaining({
            mustChangePassword: true,
          })
        );
      });
    });

    describe('JWT Token Security', () => {
      it('should generate secure JWT tokens', async () => {
        mockPrismaUser.findUnique.mockResolvedValue(validUser);
        mockBcryptCompare.mockResolvedValue(true);
        mockJwtSign.mockReturnValue('secure.jwt.token');

        await authService.login(validUser.email, validPassword);

        expect(mockJwtSign).toHaveBeenCalledWith(
          {
            userId: validUser.id,
            email: validUser.email,
            role: validUser.role,
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
      });

      it('should include required claims in JWT payload', async () => {
        mockPrismaUser.findUnique.mockResolvedValue(validUser);
        mockBcryptCompare.mockResolvedValue(true);
        mockJwtSign.mockReturnValue('secure.jwt.token');

        await authService.login(validUser.email, validPassword);

        const jwtPayload = mockJwtSign.mock.calls[0][0];
        expect(jwtPayload).toEqual({
          userId: validUser.id,
          email: validUser.email,
          role: validUser.role,
        });
      });

      it('should not include sensitive data in JWT payload', async () => {
        mockPrismaUser.findUnique.mockResolvedValue(validUser);
        mockBcryptCompare.mockResolvedValue(true);
        mockJwtSign.mockReturnValue('secure.jwt.token');

        await authService.login(validUser.email, validPassword);

        const jwtPayload = mockJwtSign.mock.calls[0][0];
        expect(jwtPayload).not.toHaveProperty('password');
        expect(jwtPayload).not.toHaveProperty('loginAttempts');
        expect(jwtPayload).not.toHaveProperty('lockedUntil');
      });

      it('should handle JWT signing errors', async () => {
        mockPrismaUser.findUnique.mockResolvedValue(validUser);
        mockBcryptCompare.mockResolvedValue(true);
        mockJwtSign.mockImplementation(() => {
          throw new Error('JWT signing failed');
        });

        await expect(
          authService.login(validUser.email, validPassword)
        ).rejects.toThrow('Token generation failed');

        expect(mockLogger.error).toHaveBeenCalledWith(
          'JWT token generation failed',
          expect.objectContaining({
            userId: validUser.id,
            error: expect.any(Error),
          })
        );
      });
    });
  });

  describe('Session Management Security', () => {
    describe('Session Creation', () => {
      it('should create secure user sessions', async () => {
        mockPrismaUser.findUnique.mockResolvedValue(validUser);
        mockBcryptCompare.mockResolvedValue(true);
        mockJwtSign.mockReturnValue('session.jwt.token');

        await authService.login(validUser.email, validPassword);

        expect(mockAuthCacheService.setUserSession).toHaveBeenCalledWith(
          validUser.id,
          expect.objectContaining({
            token: 'session.jwt.token',
            userId: validUser.id,
            role: validUser.role,
            loginTime: expect.any(Date),
          })
        );
      });

      it('should handle session creation failures', async () => {
        mockPrismaUser.findUnique.mockResolvedValue(validUser);
        mockBcryptCompare.mockResolvedValue(true);
        mockJwtSign.mockReturnValue('session.jwt.token');
        mockAuthCacheService.setUserSession.mockRejectedValue(
          new Error('Cache unavailable')
        );

        // Should continue even if session caching fails
        const result = await authService.login(validUser.email, validPassword);

        expect(result).toBeDefined();
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Failed to cache user session',
          expect.objectContaining({
            userId: validUser.id,
            error: expect.any(Error),
          })
        );
      });
    });

    describe('Session Validation', () => {
      it('should validate active user sessions', async () => {
        const sessionData = {
          userId: validUser.id,
          token: 'valid.session.token',
          role: validUser.role,
          loginTime: new Date(),
        };

        mockAuthCacheService.getUserSession.mockResolvedValue(sessionData);
        mockJwtVerify.mockReturnValue({
          userId: validUser.id,
          role: validUser.role,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 86400,
        });
        mockPrismaUser.findUnique.mockResolvedValue(validUser);

        const result = await authService.validateSession('valid.session.token');

        expect(result).toBe(true);
        expect(mockJwtVerify).toHaveBeenCalledWith(
          'valid.session.token',
          process.env.JWT_SECRET
        );
      });

      it('should reject invalid session tokens', async () => {
        mockAuthCacheService.getUserSession.mockResolvedValue(null);

        const result = await authService.validateSession('invalid.token');

        expect(result).toBe(false);
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Session validation failed: session not found',
          { token: 'invalid.token' }
        );
      });

      it('should reject sessions for inactive users', async () => {
        const sessionData = {
          userId: validUser.id,
          token: 'valid.session.token',
          role: validUser.role,
          loginTime: new Date(),
        };

        const inactiveUser = { ...validUser, active: false };

        mockAuthCacheService.getUserSession.mockResolvedValue(sessionData);
        mockJwtVerify.mockReturnValue({
          userId: validUser.id,
          role: validUser.role,
        });
        mockPrismaUser.findUnique.mockResolvedValue(inactiveUser);

        const result = await authService.validateSession('valid.session.token');

        expect(result).toBe(false);
        expect(mockAuthCacheService.invalidateUserSession).toHaveBeenCalledWith(
          validUser.id
        );
      });

      it('should handle expired JWT tokens', async () => {
        const sessionData = {
          userId: validUser.id,
          token: 'expired.session.token',
          role: validUser.role,
          loginTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        };

        mockAuthCacheService.getUserSession.mockResolvedValue(sessionData);
        mockJwtVerify.mockImplementation(() => {
          const error = new Error('Token expired');
          error.name = 'TokenExpiredError';
          throw error;
        });

        const result = await authService.validateSession('expired.session.token');

        expect(result).toBe(false);
        expect(mockAuthCacheService.invalidateUserSession).toHaveBeenCalledWith(
          validUser.id
        );
      });
    });

    describe('Session Termination', () => {
      it('should logout users and invalidate sessions', async () => {
        const sessionData = {
          userId: validUser.id,
          token: 'active.session.token',
          role: validUser.role,
          loginTime: new Date(),
        };

        mockAuthCacheService.getUserSession.mockResolvedValue(sessionData);

        await authService.logout('active.session.token');

        expect(mockAuthCacheService.invalidateUserSession).toHaveBeenCalledWith(
          validUser.id
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
          'User logged out',
          { userId: validUser.id }
        );
      });

      it('should handle logout for non-existent sessions', async () => {
        mockAuthCacheService.getUserSession.mockResolvedValue(null);

        // Should not throw error for non-existent sessions
        await expect(authService.logout('nonexistent.token')).resolves.not.toThrow();

        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Logout attempt for non-existent session',
          { token: 'nonexistent.token' }
        );
      });
    });
  });

  describe('Security Attack Prevention', () => {
    describe('Input Validation', () => {
      it('should validate email format', async () => {
        const invalidEmails = [
          'notanemail',
          '@hospital.com',
          'user@',
          'user..user@hospital.com',
          'user@hospital',
          '',
          null,
          undefined,
        ];

        for (const email of invalidEmails) {
          await expect(
            authService.login(email as any, validPassword)
          ).rejects.toThrow('Invalid email format');
        }
      });

      it('should validate password requirements', async () => {
        const weakPasswords = [
          '',
          '123',
          'password',
          'a'.repeat(5), // Too short
          null,
          undefined,
        ];

        for (const password of weakPasswords) {
          await expect(
            authService.login(validUser.email, password as any)
          ).rejects.toThrow('Invalid password format');
        }
      });

      it('should sanitize input parameters', async () => {
        const maliciousInputs = [
          "'; DROP TABLE users; --",
          "<script>alert('xss')</script>",
          "../../admin",
          "\\x00admin",
        ];

        for (const input of maliciousInputs) {
          mockPrismaUser.findUnique.mockResolvedValue(null);

          await expect(
            authService.login(input, validPassword)
          ).rejects.toThrow('Invalid email format');

          // Ensure no dangerous operations were attempted
          expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
            where: { email: input.toLowerCase() },
          });
        }
      });
    });

    describe('Timing Attack Prevention', () => {
      it('should take consistent time for user lookup', async () => {
        const iterations = 5;
        const existingUserTimes: number[] = [];
        const nonExistentUserTimes: number[] = [];

        // Test existing user
        for (let i = 0; i < iterations; i++) {
          mockPrismaUser.findUnique.mockResolvedValue(validUser);
          mockBcryptCompare.mockResolvedValue(false);

          const start = Date.now();
          try {
            await authService.login(validUser.email, invalidPassword);
          } catch (error) {
            // Expected to fail
          }
          existingUserTimes.push(Date.now() - start);

          jest.clearAllMocks();
        }

        // Test non-existent user
        for (let i = 0; i < iterations; i++) {
          mockPrismaUser.findUnique.mockResolvedValue(null);

          const start = Date.now();
          try {
            await authService.login('nonexistent@hospital.com', invalidPassword);
          } catch (error) {
            // Expected to fail
          }
          nonExistentUserTimes.push(Date.now() - start);

          jest.clearAllMocks();
        }

        // Calculate average times
        const avgExistingTime = existingUserTimes.reduce((a, b) => a + b, 0) / existingUserTimes.length;
        const avgNonExistentTime = nonExistentUserTimes.reduce((a, b) => a + b, 0) / nonExistentUserTimes.length;

        // Times should be within reasonable range
        const timeDifference = Math.abs(avgExistingTime - avgNonExistentTime);
        expect(timeDifference).toBeLessThan(100); // Less than 100ms difference
      });
    });

    describe('Rate Limiting', () => {
      it('should handle rapid login attempts gracefully', async () => {
        const numAttempts = 20;
        const attempts = [];

        mockPrismaUser.findUnique.mockResolvedValue(validUser);
        mockBcryptCompare.mockResolvedValue(false);

        for (let i = 0; i < numAttempts; i++) {
          attempts.push(
            authService.login(validUser.email, invalidPassword).catch(() => {
              // Expected to fail
            })
          );
        }

        // All attempts should complete without hanging
        await expect(Promise.all(attempts)).resolves.not.toThrow();

        // Login attempts should be tracked properly
        expect(mockPrismaUser.update).toHaveBeenCalledTimes(numAttempts);
      });
    });

    describe('Database Error Handling', () => {
      it('should handle database connection failures', async () => {
        mockPrismaUser.findUnique.mockRejectedValue(
          new Error('Database connection failed')
        );

        await expect(
          authService.login(validUser.email, validPassword)
        ).rejects.toThrow('Authentication service unavailable');

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Database error during authentication',
          expect.objectContaining({
            email: validUser.email,
            error: expect.any(Error),
          })
        );
      });

      it('should handle database update failures', async () => {
        mockPrismaUser.findUnique.mockResolvedValue(validUser);
        mockBcryptCompare.mockResolvedValue(true);
        mockJwtSign.mockReturnValue('valid.jwt.token');
        mockPrismaUser.update.mockRejectedValue(
          new Error('Database update failed')
        );

        // Should still return token but log error
        const result = await authService.login(validUser.email, validPassword);

        expect(result).toBeDefined();
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to update user login data',
          expect.objectContaining({
            userId: validUser.id,
            error: expect.any(Error),
          })
        );
      });
    });
  });

  describe('Password Management Security', () => {
    describe('Password Hashing', () => {
      it('should hash passwords with secure parameters', async () => {
        const plainPassword = 'NewSecurePassword123!';
        const hashedPassword = '$2b$12$secureHashedPassword';

        mockBcryptHash.mockResolvedValue(hashedPassword);

        const result = await authService.hashPassword(plainPassword);

        expect(result).toBe(hashedPassword);
        expect(mockBcryptHash).toHaveBeenCalledWith(plainPassword, 12); // Minimum 12 salt rounds
      });

      it('should handle password hashing errors', async () => {
        mockBcryptHash.mockRejectedValue(new Error('Hashing failed'));

        await expect(
          authService.hashPassword('password123')
        ).rejects.toThrow('Password hashing failed');

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Password hashing error',
          expect.objectContaining({
            error: expect.any(Error),
          })
        );
      });
    });

    describe('Password Change Security', () => {
      it('should enforce password change requirements', async () => {
        const userNeedingChange = {
          ...validUser,
          mustChangePassword: true,
        };

        mockPrismaUser.findUnique.mockResolvedValue(userNeedingChange);
        mockBcryptCompare.mockResolvedValue(true);

        const newPassword = 'NewSecurePassword123!';
        const hashedNewPassword = '$2b$12$newHashedPassword';

        mockBcryptHash.mockResolvedValue(hashedNewPassword);

        await authService.changePassword(
          validUser.id,
          validPassword,
          newPassword
        );

        expect(mockPrismaUser.update).toHaveBeenCalledWith({
          where: { id: validUser.id },
          data: {
            password: hashedNewPassword,
            mustChangePassword: false,
            updatedAt: expect.any(Date),
          },
        });

        // Should invalidate all existing sessions
        expect(mockAuthCacheService.invalidateAllUserSessions).toHaveBeenCalledWith(
          validUser.id
        );
      });

      it('should validate current password before change', async () => {
        mockPrismaUser.findUnique.mockResolvedValue(validUser);
        mockBcryptCompare.mockResolvedValue(false); // Wrong current password

        await expect(
          authService.changePassword(
            validUser.id,
            'wrongPassword',
            'NewSecurePassword123!'
          )
        ).rejects.toThrow('Current password is incorrect');

        expect(mockPrismaUser.update).not.toHaveBeenCalled();
      });

      it('should prevent password reuse', async () => {
        mockPrismaUser.findUnique.mockResolvedValue(validUser);
        mockBcryptCompare.mockResolvedValue(true);

        // Trying to use the same password
        await expect(
          authService.changePassword(
            validUser.id,
            validPassword,
            validPassword
          )
        ).rejects.toThrow('New password must be different from current password');

        expect(mockPrismaUser.update).not.toHaveBeenCalled();
      });
    });
  });
});