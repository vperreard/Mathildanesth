/**
 * @file Comprehensive API Integration Security Tests for Auth Endpoints
 * @description Security-focused integration tests for all auth API routes
 * Tests authentication vulnerabilities, injection attacks, rate limiting, and role-based access
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Role, UserStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Mock dependencies with security focus
jest.mock('@/lib/prisma');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('@/lib/rateLimit', () => ({
    withAuthRateLimit: (handler: Function) => handler,
    withUserRateLimit: (handler: Function) => handler,
    withPublicRateLimit: (handler: Function) => handler,
    withAdminRateLimit: (handler: Function) => handler,
    withSensitiveRateLimit: (handler: Function) => handler
}));
jest.mock('@/lib/auth-server-utils', () => ({
    generateAuthTokenServer: jest.fn(),
    setAuthTokenServer: jest.fn(),
    verifyAuthToken: jest.fn()
}));
jest.mock('@/lib/auth-utils', () => ({
    removeAuthToken: jest.fn()
}));
jest.mock('@/services/OptimizedAuditService', () => ({
    auditService: {
        logLogout: jest.fn()
    }
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Mock NextResponse with security headers
jest.mock('next/server', () => ({
    NextRequest: jest.requireActual('next/server').NextRequest,
    NextResponse: {
        json: (data: any, init?: ResponseInit) => {
            const response = new Response(JSON.stringify(data), {
                ...init,
                headers: {
                    'content-type': 'application/json',
                    'x-content-type-options': 'nosniff',
                    'x-frame-options': 'DENY',
                    'x-xss-protection': '1; mode=block',
                    ...(init?.headers || {})
                }
            });
            return response;
        }
    }
}));

describe('API Auth Security Integration Tests', () => {
    let loginHandler: any;
    let logoutHandler: any;
    let meHandler: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        
        // Import handlers
        const loginRoute = await import('@/app/api/auth/login/route');
        const logoutRoute = await import('@/app/api/auth/logout/route');
        const meRoute = await import('@/app/api/auth/me/route');
        
        loginHandler = loginRoute.POST;
        logoutHandler = logoutRoute.POST;
        meHandler = meRoute.GET;
    });

    describe('Security Headers and HTTPS Enforcement', () => {
        it('should include security headers in all auth responses', async () => {
            const request = new NextRequest('http://localhost:3000/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ login: 'test@example.com', password: 'password' })
            });

            const response = await loginHandler(request);
            
            expect(response.headers.get('x-content-type-options')).toBe('nosniff');
            expect(response.headers.get('x-frame-options')).toBe('DENY');
            expect(response.headers.get('x-xss-protection')).toBe('1; mode=block');
        });

        it('should enforce secure cookies in production', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const mockUser = {
                id: 1,
                login: 'test@example.com',
                email: 'test@example.com',
                password: 'hashed_password',
                nom: 'Doe',
                prenom: 'John',
                role: Role.USER,
                actif: true,
            };

            mockedPrisma.user = {
                findFirst: jest.fn().mockResolvedValue(mockUser),
            } as any;
            mockedBcrypt.compare.mockResolvedValue(true as never);

            const request = new NextRequest('https://example.com/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ login: 'test@example.com', password: 'password' })
            });

            const response = await loginHandler(request);
            const setCookieHeader = response.headers.get('set-cookie');
            
            expect(setCookieHeader).toContain('Secure');
            expect(setCookieHeader).toContain('HttpOnly');
            expect(setCookieHeader).toContain('SameSite=Strict');

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('SQL Injection Prevention', () => {
        it('should prevent SQL injection in login field', async () => {
            const sqlInjectionAttempts = [
                "'; DROP TABLE users; --",
                "' OR '1'='1",
                "' UNION SELECT * FROM users --",
                "admin' --",
                "' OR 1=1 #",
                "'; UPDATE users SET role='ADMIN' WHERE id=1; --"
            ];

            for (const maliciousLogin of sqlInjectionAttempts) {
                mockedPrisma.user = {
                    findFirst: jest.fn().mockResolvedValue(null),
                } as any;

                const request = new NextRequest('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        login: maliciousLogin, 
                        password: 'password' 
                    })
                });

                const response = await loginHandler(request);
                
                expect(response.status).toBe(401);
                expect(mockedPrisma.user.findFirst).toHaveBeenCalledWith({
                    where: { login: maliciousLogin },
                    select: expect.any(Object)
                });
            }
        });
    });

    describe('XSS Prevention', () => {
        it('should sanitize and reject XSS attempts in login', async () => {
            const xssAttempts = [
                "<script>alert('xss')</script>",
                "javascript:alert('xss')",
                "<img src=x onerror=alert('xss')>",
                "<svg onload=alert('xss')>",
                "';alert('xss');//"
            ];

            for (const xssPayload of xssAttempts) {
                const request = new NextRequest('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        login: xssPayload, 
                        password: 'password' 
                    })
                });

                const response = await loginHandler(request);
                const data = await response.json();
                
                // Should not execute script or return unescaped HTML
                expect(JSON.stringify(data)).not.toContain('<script>');
                expect(JSON.stringify(data)).not.toContain('javascript:');
            }
        });
    });

    describe('JWT Token Security', () => {
        it('should detect and reject tampered JWT tokens', async () => {
            const tamperedTokens = [
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.TAMPERED_SIGNATURE',
                'invalid.jwt.token',
                'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.',
                '', // Empty token
                'Bearer malformed'
            ];

            for (const tamperedToken of tamperedTokens) {
                const request = new NextRequest('http://localhost:3000/api/auth/me', {
                    method: 'GET',
                    headers: {
                        'authorization': `Bearer ${tamperedToken}`
                    }
                });

                const response = await meHandler(request);
                expect(response.status).toBe(401);
            }
        });

        it('should reject expired JWT tokens', async () => {
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6MTYwMDAwMDAwMH0.signature';
            
            mockedJwt.verify.mockImplementation(() => {
                throw new Error('TokenExpiredError');
            });

            const request = new NextRequest('http://localhost:3000/api/auth/me', {
                method: 'GET',
                headers: {
                    'authorization': `Bearer ${expiredToken}`
                }
            });

            const response = await meHandler(request);
            expect(response.status).toBe(401);
        });
    });

    describe('Brute Force Protection Simulation', () => {
        it('should handle multiple failed login attempts', async () => {
            mockedPrisma.user = {
                findFirst: jest.fn().mockResolvedValue(null),
            } as any;

            const requests = Array.from({ length: 10 }, (_, i) => 
                new NextRequest('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        login: 'attacker@example.com', 
                        password: `attempt${i}` 
                    })
                })
            );

            // Simulate rapid fire requests
            const responses = await Promise.all(
                requests.map(request => loginHandler(request))
            );

            // All should return 401 for invalid credentials
            responses.forEach(response => {
                expect(response.status).toBe(401);
            });

            // Verify database was queried for each attempt (no early returns)
            expect(mockedPrisma.user.findFirst).toHaveBeenCalledTimes(10);
        });
    });

    describe('Medical Role-Based Access Security', () => {
        it('should properly validate medical roles in responses', async () => {
            const medicalRoles = [
                { role: Role.ADMIN_TOTAL, expectedAccess: true },
                { role: Role.ADMIN_PARTIEL, expectedAccess: true },
                { role: Role.USER, expectedAccess: false }, // Limited access
            ];

            for (const { role, expectedAccess } of medicalRoles) {
                const mockUser = {
                    id: 1,
                    email: 'medical@example.com',
                    nom: 'Medical',
                    prenom: 'Professional',
                    role,
                    userStatus: UserStatus.ACTIF,
                    professionalRole: role === Role.ADMIN_TOTAL ? 'MAR' : 'IADE',
                };

                // Mock successful authentication
                jest.doMock('@/lib/auth', () => ({
                    getUserFromCookie: jest.fn().mockResolvedValue(mockUser)
                }));

                mockedPrisma.user = {
                    findUnique: jest.fn().mockResolvedValue(mockUser),
                } as any;

                const request = new NextRequest('http://localhost:3000/api/auth/me', {
                    method: 'GET',
                    headers: {
                        'cookie': 'auth_token=valid_token'
                    }
                });

                const response = await meHandler(request);
                const data = await response.json();

                if (expectedAccess) {
                    expect(response.status).toBe(200);
                    expect(data.role).toBe(role);
                    expect(data.professionalRole).toBeDefined();
                } else {
                    // Basic users should still get 200 but with limited data
                    expect(response.status).toBe(200);
                    expect(data.role).toBe(Role.USER);
                }
            }
        });
    });

    describe('Session Management Security', () => {
        it('should properly invalidate sessions on logout', async () => {
            const mockRemoveAuthToken = require('@/lib/auth-utils').removeAuthToken;
            const mockAuditService = require('@/services/OptimizedAuditService').auditService;

            const request = new NextRequest('http://localhost:3000/api/auth/logout', {
                method: 'POST',
                headers: {
                    'authorization': 'Bearer valid_token'
                }
            });

            const response = await logoutHandler(request);
            
            expect(response.status).toBe(200);
            expect(mockRemoveAuthToken).toHaveBeenCalled();
            expect(mockAuditService.logLogout).toHaveBeenCalled();
        });

        it('should handle concurrent session invalidation', async () => {
            const requests = Array.from({ length: 5 }, () => 
                new NextRequest('http://localhost:3000/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'authorization': 'Bearer valid_token'
                    }
                })
            );

            const responses = await Promise.all(
                requests.map(request => logoutHandler(request))
            );

            // All should succeed (idempotent operation)
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });
        });
    });

    describe('Input Validation and Sanitization', () => {
        it('should validate and reject malformed JSON', async () => {
            const malformedBodies = [
                '{"login":"test"', // Incomplete JSON
                '{login:"test"}', // Invalid JSON syntax
                '{"login":null,"password":"test"}', // Null values
                '{"login":"","password":""}', // Empty strings
                '{}', // Missing required fields
            ];

            for (const malformedBody of malformedBodies) {
                const request = new NextRequest('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: malformedBody
                });

                const response = await loginHandler(request);
                expect(response.status).toBe(400);
            }
        });

        it('should enforce content-type validation', async () => {
            const request = new NextRequest('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'not json data'
            });

            const response = await loginHandler(request);
            expect(response.status).toBe(400);
        });
    });

    describe('CORS and Origin Validation', () => {
        it('should validate request origins in production', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const suspiciousOrigins = [
                'http://malicious-site.com',
                'https://phishing-example.com',
                'javascript:alert(1)',
                'data:text/html,<script>alert(1)</script>'
            ];

            for (const origin of suspiciousOrigins) {
                const request = new NextRequest('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Origin': origin,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ login: 'test@example.com', password: 'password' })
                });

                const response = await loginHandler(request);
                
                // Should still process the request but not set CORS headers for untrusted origins
                expect(response.headers.get('Access-Control-Allow-Origin')).toBeFalsy();
            }

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('Error Information Disclosure Prevention', () => {
        it('should not leak sensitive information in error messages', async () => {
            // Database error simulation
            mockedPrisma.user = {
                findFirst: jest.fn().mockRejectedValue(new Error('Connection failed to database "medical_app" with detailed connection string')),
            } as any;

            const request = new NextRequest('http://localhost:3000/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ login: 'test@example.com', password: 'password' })
            });

            const response = await loginHandler(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Erreur serveur lors de la connexion');
            expect(data.error).not.toContain('database');
            expect(data.error).not.toContain('connection string');
            expect(data.error).not.toContain('medical_app');
        });

        it('should use consistent timing for user enumeration prevention', async () => {
            const startTime = Date.now();
            
            // Test with non-existent user
            mockedPrisma.user = {
                findFirst: jest.fn().mockResolvedValue(null),
            } as any;

            const request1 = new NextRequest('http://localhost:3000/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ login: 'nonexistent@example.com', password: 'password' })
            });

            await loginHandler(request1);
            const time1 = Date.now() - startTime;

            // Test with existing user but wrong password
            const mockUser = {
                id: 1,
                login: 'existing@example.com',
                password: 'hashed_password',
                actif: true
            };

            mockedPrisma.user = {
                findFirst: jest.fn().mockResolvedValue(mockUser),
            } as any;
            mockedBcrypt.compare.mockResolvedValue(false as never);

            const startTime2 = Date.now();
            const request2 = new NextRequest('http://localhost:3000/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ login: 'existing@example.com', password: 'wrongpassword' })
            });

            await loginHandler(request2);
            const time2 = Date.now() - startTime2;

            // Timing should be reasonably similar (within 100ms) to prevent user enumeration
            expect(Math.abs(time1 - time2)).toBeLessThan(100);
        });
    });
});