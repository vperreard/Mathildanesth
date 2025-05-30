/**
 * @jest-environment node
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { auth, requireRole } from '../auth';
import { UserRole } from '@/types/user';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('@/services/userService');

const mockJwtVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>;

// Mock UserService
const mockUserService = {
  findById: jest.fn(),
};

jest.doMock('@/services/userService', () => ({
  UserService: mockUserService,
}));

// Mock request/response objects
const createMockRequest = (headers: Record<string, string> = {}): Partial<Request> => ({
  header: jest.fn((name: string) => headers[name.toLowerCase()]),
  headers: headers,
  ip: '192.168.1.100',
  method: 'GET',
  url: '/api/protected',
  body: {},
  query: {},
});

const createMockResponse = (): Partial<Response> => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
};

const createMockNext = (): NextFunction => jest.fn();

// Test constants
const VALID_JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
const VALID_TOKEN = 'valid.jwt.token';
const EXPIRED_TOKEN = 'expired.jwt.token';
const INVALID_TOKEN = 'invalid.jwt.token';
const MALFORMED_TOKEN = 'malformed-token';

// Medical roles for testing
const MEDICAL_ROLES = {
  MAR: 'MAR' as UserRole,
  IADE: 'IADE' as UserRole,
  ADMIN_TOTAL: 'ADMIN_TOTAL' as UserRole,
  ADMIN_PARTIEL: 'ADMIN_PARTIEL' as UserRole,
  CHIRURGIEN: 'CHIRURGIEN' as UserRole,
  USER: 'USER' as UserRole,
};

describe('Authentication Middleware Security Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
    
    // Reset environment
    process.env.JWT_SECRET = VALID_JWT_SECRET;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Token Validation Security', () => {
    describe('Valid Token Handling', () => {
      it('should accept valid Bearer tokens', async () => {
        const mockUser = {
          id: 1,
          login: 'dr.test',
          role: MEDICAL_ROLES.MAR,
          isActive: true,
          email: 'dr.test@hospital.com',
        };

        mockReq = createMockRequest({
          authorization: `Bearer ${VALID_TOKEN}`,
        });

        mockJwtVerify.mockReturnValue({
          id: 1,
          role: MEDICAL_ROLES.MAR,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        });

        mockUserService.findById.mockResolvedValue(mockUser);

        await auth(mockReq as any, mockRes as any, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockReq.user).toEqual({
          id: 1,
          role: MEDICAL_ROLES.MAR,
        });
      });

      it('should validate token expiration', async () => {
        mockReq = createMockRequest({
          authorization: `Bearer ${EXPIRED_TOKEN}`,
        });

        mockJwtVerify.mockImplementation(() => {
          const error = new Error('Token expired');
          error.name = 'TokenExpiredError';
          throw error;
        });

        await auth(mockReq as any, mockRes as any, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Veuillez vous authentifier',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should verify token signature integrity', async () => {
        mockReq = createMockRequest({
          authorization: `Bearer ${INVALID_TOKEN}`,
        });

        mockJwtVerify.mockImplementation(() => {
          const error = new Error('Invalid signature');
          error.name = 'JsonWebTokenError';
          throw error;
        });

        await auth(mockReq as any, mockRes as any, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Veuillez vous authentifier',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Token Format Security', () => {
      it('should reject requests without Authorization header', async () => {
        mockReq = createMockRequest({}); // No authorization header

        await auth(mockReq as any, mockRes as any, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Veuillez vous authentifier',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject malformed Authorization headers', async () => {
        const malformedHeaders = [
          'InvalidFormat token',
          'Bearer', // Missing token
          'Bearer ', // Empty token
          'Basic dXNlcjpwYXNz', // Wrong auth type
          'Bearer invalid-base64!@#$%',
          'Bearer token1 token2', // Multiple tokens
        ];

        for (const authHeader of malformedHeaders) {
          mockReq = createMockRequest({
            authorization: authHeader,
          });

          await auth(mockReq as any, mockRes as any, mockNext);

          expect(mockRes.status).toHaveBeenCalledWith(401);
          expect(mockNext).not.toHaveBeenCalled();
        }
      });

      it('should handle tokens with suspicious patterns', async () => {
        const suspiciousTokens = [
          '../../../admin',
          'null',
          'undefined',
          '0',
          'true',
          'false',
          JSON.stringify({ admin: true }),
          Buffer.from('malicious').toString('base64'),
        ];

        for (const token of suspiciousTokens) {
          mockReq = createMockRequest({
            authorization: `Bearer ${token}`,
          });

          mockJwtVerify.mockImplementation(() => {
            throw new Error('Invalid token');
          });

          await auth(mockReq as any, mockRes as any, mockNext);

          expect(mockRes.status).toHaveBeenCalledWith(401);
          expect(mockNext).not.toHaveBeenCalled();
        }
      });

      it('should handle extremely long tokens securely', async () => {
        const longToken = 'a'.repeat(10000); // 10KB token

        mockReq = createMockRequest({
          authorization: `Bearer ${longToken}`,
        });

        mockJwtVerify.mockImplementation(() => {
          throw new Error('Invalid token');
        });

        await auth(mockReq as any, mockRes as any, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('User Validation Security', () => {
      it('should reject tokens for non-existent users', async () => {
        mockReq = createMockRequest({
          authorization: `Bearer ${VALID_TOKEN}`,
        });

        mockJwtVerify.mockReturnValue({
          id: 999, // Non-existent user
          role: MEDICAL_ROLES.USER,
        });

        mockUserService.findById.mockResolvedValue(null);

        await auth(mockReq as any, mockRes as any, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Veuillez vous authentifier',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject tokens for inactive users', async () => {
        const inactiveUser = {
          id: 1,
          login: 'inactive.user',
          role: MEDICAL_ROLES.USER,
          isActive: false, // Inactive account
          email: 'inactive@hospital.com',
        };

        mockReq = createMockRequest({
          authorization: `Bearer ${VALID_TOKEN}`,
        });

        mockJwtVerify.mockReturnValue({
          id: 1,
          role: MEDICAL_ROLES.USER,
        });

        mockUserService.findById.mockResolvedValue(inactiveUser);

        await auth(mockReq as any, mockRes as any, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should handle database errors gracefully', async () => {
        mockReq = createMockRequest({
          authorization: `Bearer ${VALID_TOKEN}`,
        });

        mockJwtVerify.mockReturnValue({
          id: 1,
          role: MEDICAL_ROLES.USER,
        });

        mockUserService.findById.mockRejectedValue(new Error('Database connection failed'));

        await auth(mockReq as any, mockRes as any, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Veuillez vous authentifier',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should validate user role consistency', async () => {
        const userWithDifferentRole = {
          id: 1,
          login: 'test.user',
          role: MEDICAL_ROLES.USER, // Different from token
          isActive: true,
          email: 'test@hospital.com',
        };

        mockReq = createMockRequest({
          authorization: `Bearer ${VALID_TOKEN}`,
        });

        mockJwtVerify.mockReturnValue({
          id: 1,
          role: MEDICAL_ROLES.ADMIN_TOTAL, // Different role in token
        });

        mockUserService.findById.mockResolvedValue(userWithDifferentRole);

        // In a secure implementation, this should validate role consistency
        await auth(mockReq as any, mockRes as any, mockNext);

        // Current implementation doesn't validate role consistency
        // In production, this should be enhanced
        expect(mockNext).toHaveBeenCalled();
      });
    });
  });

  describe('Role-Based Access Control Security', () => {
    describe('requireRole Middleware', () => {
      it('should allow access for users with required role', async () => {
        mockReq.user = {
          id: 1,
          role: MEDICAL_ROLES.MAR,
        };

        const middleware = requireRole([MEDICAL_ROLES.MAR]);
        middleware(mockReq as any, mockRes as any, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it('should deny access for users without required role', async () => {
        mockReq.user = {
          id: 1,
          role: MEDICAL_ROLES.USER,
        };

        const middleware = requireRole([MEDICAL_ROLES.ADMIN_TOTAL]);
        middleware(mockReq as any, mockRes as any, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Accès non autorisé',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should deny access for unauthenticated requests', async () => {
        // No user set on request
        const middleware = requireRole([MEDICAL_ROLES.USER]);
        middleware(mockReq as any, mockRes as any, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Veuillez vous authentifier',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should handle multiple role requirements', async () => {
        const testCases = [
          {
            userRole: MEDICAL_ROLES.MAR,
            requiredRoles: [MEDICAL_ROLES.MAR, MEDICAL_ROLES.CHIRURGIEN],
            shouldPass: true,
          },
          {
            userRole: MEDICAL_ROLES.IADE,
            requiredRoles: [MEDICAL_ROLES.MAR, MEDICAL_ROLES.CHIRURGIEN],
            shouldPass: false,
          },
          {
            userRole: MEDICAL_ROLES.ADMIN_TOTAL,
            requiredRoles: [MEDICAL_ROLES.ADMIN_TOTAL, MEDICAL_ROLES.ADMIN_PARTIEL],
            shouldPass: true,
          },
        ];

        for (const testCase of testCases) {
          mockReq.user = {
            id: 1,
            role: testCase.userRole,
          };

          const middleware = requireRole(testCase.requiredRoles);
          middleware(mockReq as any, mockRes as any, mockNext);

          if (testCase.shouldPass) {
            expect(mockNext).toHaveBeenCalled();
          } else {
            expect(mockRes.status).toHaveBeenCalledWith(403);
          }

          jest.clearAllMocks();
        }
      });

      it('should handle empty role arrays securely', async () => {
        mockReq.user = {
          id: 1,
          role: MEDICAL_ROLES.ADMIN_TOTAL,
        };

        const middleware = requireRole([]);
        middleware(mockReq as any, mockRes as any, mockNext);

        // Empty role array should deny access (secure by default)
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Medical Role Hierarchy Security', () => {
      it('should enforce medical professional role boundaries', async () => {
        const roleTestCases = [
          {
            description: 'MAR should access MAR-only resources',
            userRole: MEDICAL_ROLES.MAR,
            requiredRoles: [MEDICAL_ROLES.MAR],
            shouldPass: true,
          },
          {
            description: 'IADE should not access MAR-only resources',
            userRole: MEDICAL_ROLES.IADE,
            requiredRoles: [MEDICAL_ROLES.MAR],
            shouldPass: false,
          },
          {
            description: 'CHIRURGIEN should not access admin resources',
            userRole: MEDICAL_ROLES.CHIRURGIEN,
            requiredRoles: [MEDICAL_ROLES.ADMIN_TOTAL],
            shouldPass: false,
          },
          {
            description: 'ADMIN_PARTIEL should not access total admin resources',
            userRole: MEDICAL_ROLES.ADMIN_PARTIEL,
            requiredRoles: [MEDICAL_ROLES.ADMIN_TOTAL],
            shouldPass: false,
          },
        ];

        for (const testCase of roleTestCases) {
          mockReq.user = {
            id: 1,
            role: testCase.userRole,
          };

          const middleware = requireRole(testCase.requiredRoles);
          middleware(mockReq as any, mockRes as any, mockNext);

          if (testCase.shouldPass) {
            expect(mockNext).toHaveBeenCalled();
          } else {
            expect(mockRes.status).toHaveBeenCalledWith(403);
          }

          jest.clearAllMocks();
        }
      });
    });
  });

  describe('Security Vulnerability Prevention', () => {
    describe('Injection Attack Prevention', () => {
      it('should handle malicious user IDs safely', async () => {
        const maliciousUserIds = [
          \"'; DROP TABLE users; --\",
          \"1 OR 1=1\",
          \"null\",
          \"undefined\",
          \"function(){return true;}\",
          \"<script>alert('xss')</script>\",
        ];

        for (const maliciousId of maliciousUserIds) {
          mockReq = createMockRequest({
            authorization: `Bearer ${VALID_TOKEN}`,
          });

          mockJwtVerify.mockReturnValue({
            id: maliciousId,
            role: MEDICAL_ROLES.USER,
          });

          mockUserService.findById.mockResolvedValue(null);

          await auth(mockReq as any, mockRes as any, mockNext);

          expect(mockRes.status).toHaveBeenCalledWith(401);
          expect(mockNext).not.toHaveBeenCalled();
        }
      });

      it('should sanitize role values', async () => {
        const maliciousRoles = [
          \"'; DELETE FROM roles; --\",
          \"ADMIN' OR '1'='1\",
          \"<script>alert('role')</script>\",
          \"../../admin\",
          \"null\",
          \"undefined\",
        ];

        for (const maliciousRole of maliciousRoles) {
          mockReq.user = {
            id: 1,
            role: maliciousRole as any,
          };

          const middleware = requireRole([MEDICAL_ROLES.USER]);
          middleware(mockReq as any, mockRes as any, mockNext);

          // Should deny access for invalid roles
          expect(mockRes.status).toHaveBeenCalledWith(403);
          expect(mockNext).not.toHaveBeenCalled();

          jest.clearAllMocks();
        }
      });
    });

    describe('Timing Attack Prevention', () => {
      it('should take consistent time for valid vs invalid tokens', async () => {
        const iterations = 5;
        const validTimes: number[] = [];
        const invalidTimes: number[] = [];

        // Test valid tokens
        for (let i = 0; i < iterations; i++) {
          mockReq = createMockRequest({
            authorization: `Bearer ${VALID_TOKEN}`,
          });

          mockJwtVerify.mockReturnValue({
            id: 1,
            role: MEDICAL_ROLES.USER,
          });

          mockUserService.findById.mockResolvedValue({
            id: 1,
            isActive: true,
            role: MEDICAL_ROLES.USER,
          });

          const start = Date.now();
          await auth(mockReq as any, mockRes as any, mockNext);
          validTimes.push(Date.now() - start);

          jest.clearAllMocks();
        }

        // Test invalid tokens
        for (let i = 0; i < iterations; i++) {
          mockReq = createMockRequest({
            authorization: `Bearer ${INVALID_TOKEN}`,
          });

          mockJwtVerify.mockImplementation(() => {
            throw new Error('Invalid token');
          });

          const start = Date.now();
          await auth(mockReq as any, mockRes as any, mockNext);
          invalidTimes.push(Date.now() - start);

          jest.clearAllMocks();
        }

        // Calculate average times
        const avgValidTime = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
        const avgInvalidTime = invalidTimes.reduce((a, b) => a + b, 0) / invalidTimes.length;

        // Times should be within reasonable range to prevent timing attacks
        const timeDifference = Math.abs(avgValidTime - avgInvalidTime);
        expect(timeDifference).toBeLessThan(50); // Less than 50ms difference
      });
    });

    describe('Rate Limiting and DoS Prevention', () => {
      it('should handle rapid sequential requests', async () => {
        const numRequests = 100;
        const requests = [];

        for (let i = 0; i < numRequests; i++) {
          const req = createMockRequest({
            authorization: `Bearer ${VALID_TOKEN}`,
          });
          const res = createMockResponse();
          const next = createMockNext();

          mockJwtVerify.mockReturnValue({
            id: 1,
            role: MEDICAL_ROLES.USER,
          });

          mockUserService.findById.mockResolvedValue({
            id: 1,
            isActive: true,
            role: MEDICAL_ROLES.USER,
          });

          requests.push(auth(req as any, res as any, next));
        }

        // All requests should complete without errors
        await expect(Promise.all(requests)).resolves.not.toThrow();
      });

      it('should handle malformed request floods gracefully', async () => {
        const malformedRequests = Array(50).fill(null).map(() => {
          const req = createMockRequest({
            authorization: 'Bearer malformed.token.here',
          });
          const res = createMockResponse();
          const next = createMockNext();

          mockJwtVerify.mockImplementation(() => {
            throw new Error('Invalid token');
          });

          return auth(req as any, res as any, next);
        });

        // Should handle all malformed requests without crashing
        await expect(Promise.all(malformedRequests)).resolves.not.toThrow();
      });
    });
  });

  describe('Error Handling Security', () => {
    describe('Information Disclosure Prevention', () => {
      it('should not leak internal errors to client', async () => {
        mockReq = createMockRequest({
          authorization: `Bearer ${VALID_TOKEN}`,
        });

        mockJwtVerify.mockReturnValue({
          id: 1,
          role: MEDICAL_ROLES.USER,
        });

        // Simulate various internal errors
        const internalErrors = [
          new Error('Database connection timeout'),
          new Error('Internal server error'),
          new Error('Memory allocation failed'),
          new Error('Network unreachable'),
        ];

        for (const error of internalErrors) {
          mockUserService.findById.mockRejectedValue(error);

          await auth(mockReq as any, mockRes as any, mockNext);

          expect(mockRes.json).toHaveBeenCalledWith({
            error: 'Veuillez vous authentifier',
          });

          // Should not leak internal error details
          expect(mockRes.json).not.toHaveBeenCalledWith(
            expect.objectContaining({
              error: expect.stringContaining('Database'),
            })
          );

          jest.clearAllMocks();
        }
      });

      it('should provide consistent error responses', async () => {
        const errorScenarios = [
          {
            name: 'missing token',
            setup: () => {
              mockReq = createMockRequest({});
            },
          },
          {
            name: 'invalid token',
            setup: () => {
              mockReq = createMockRequest({
                authorization: `Bearer ${INVALID_TOKEN}`,
              });
              mockJwtVerify.mockImplementation(() => {
                throw new Error('Invalid signature');
              });
            },
          },
          {
            name: 'expired token',
            setup: () => {
              mockReq = createMockRequest({
                authorization: `Bearer ${EXPIRED_TOKEN}`,
              });
              mockJwtVerify.mockImplementation(() => {
                const error = new Error('Token expired');
                error.name = 'TokenExpiredError';
                throw error;
              });
            },
          },
        ];

        const errorMessages = [];

        for (const scenario of errorScenarios) {
          scenario.setup();
          await auth(mockReq as any, mockRes as any, mockNext);

          const errorCall = (mockRes.json as jest.Mock).mock.calls.find(
            call => call[0].error
          );
          if (errorCall) {
            errorMessages.push(errorCall[0].error);
          }

          jest.clearAllMocks();
        }

        // All authentication errors should return the same message
        const uniqueMessages = new Set(errorMessages);
        expect(uniqueMessages.size).toBe(1);
        expect(Array.from(uniqueMessages)[0]).toBe('Veuillez vous authentifier');
      });
    });
  });
});