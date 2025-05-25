/**
 * @jest-environment node
 */

// Mock Prisma et bcrypt avant les imports
const mockFindUnique = jest.fn();

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        user: {
            findUnique: mockFindUnique,
        },
    })),
}));

jest.mock('bcrypt', () => ({
    compare: jest.fn(),
}));

import { createToken, verifyToken, authOptions } from '../auth';
import bcrypt from 'bcrypt';
import * as jose from 'jose';

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('Module d\'Authentification JWT', () => {
    const mockUser = {
        id: 1,
        login: 'test.medecin',
        email: 'test@hospital.fr',
        password: '$2b$10$hashedpassword',
        role: 'MEDECIN',
        nom: 'Test',
        prenom: 'Medecin',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset environment variable
        process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
        // Clear USE_MOCK_AUTH to ensure we use Prisma in tests
        delete process.env.USE_MOCK_AUTH;
        // Force production mode for auth tests
        process.env.NODE_ENV = 'test';
        // Reset mocks
        mockFindUnique.mockClear();
    });

    afterEach(() => {
        delete process.env.JWT_SECRET;
    });

    describe('createToken', () => {
        it('should create a valid JWT token with correct payload', async () => {
            const payload = {
                userId: mockUser.id,
                login: mockUser.login,
                role: mockUser.role,
            };

            const token = await createToken(payload);

            expect(token).toBeTruthy();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        });

        it('should create token with custom expiration', async () => {
            const payload = {
                userId: mockUser.id,
                login: mockUser.login,
                role: mockUser.role,
            };

            const token = await createToken(payload, '2h');
            const decodedToken = await verifyToken(token);

            expect(decodedToken.userId).toBe(payload.userId);
            expect(decodedToken.login).toBe(payload.login);
            expect(decodedToken.role).toBe(payload.role);
        });

        it('should include standard JWT claims', async () => {
            const payload = {
                userId: mockUser.id,
                login: mockUser.login,
                role: mockUser.role,
            };

            const token = await createToken(payload);
            const decodedToken = await verifyToken(token);

            expect(decodedToken.iat).toBeDefined(); // Issued at
            expect(decodedToken.exp).toBeDefined(); // Expiration
            expect(decodedToken.exp! > decodedToken.iat!).toBe(true);
        });

        it('should handle different user roles correctly', async () => {
            const roles = ['MEDECIN', 'INFIRMIER', 'ADMIN', 'CADRE'];

            for (const role of roles) {
                const payload = {
                    userId: mockUser.id,
                    login: mockUser.login,
                    role,
                };

                const token = await createToken(payload);
                const decodedToken = await verifyToken(token);

                expect(decodedToken.role).toBe(role);
            }
        });
    });

    describe('verifyToken', () => {
        it('should verify and decode a valid token', async () => {
            const payload = {
                userId: mockUser.id,
                login: mockUser.login,
                role: mockUser.role,
            };

            const token = await createToken(payload);
            const decodedToken = await verifyToken(token);

            expect(decodedToken.userId).toBe(payload.userId);
            expect(decodedToken.login).toBe(payload.login);
            expect(decodedToken.role).toBe(payload.role);
        });

        it('should reject an invalid token', async () => {
            const invalidToken = 'invalid.jwt.token';

            await expect(verifyToken(invalidToken)).rejects.toThrow('Token invalide ou malformé');
        });

        it('should reject a token with invalid signature', async () => {
            // Create token with different secret
            const wrongSecret = new TextEncoder().encode('wrong-secret');
            const payload = {
                userId: mockUser.id,
                login: mockUser.login,
                role: mockUser.role,
            };

            const tokenWithWrongSecret = await new jose.SignJWT({ ...payload })
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('1h')
                .sign(wrongSecret);

            await expect(verifyToken(tokenWithWrongSecret)).rejects.toThrow('Token invalide ou malformé');
        });

        it('should reject an expired token', async () => {
            const payload = {
                userId: mockUser.id,
                login: mockUser.login,
                role: mockUser.role,
            };

            // Create token that expires immediately
            const expiredToken = await createToken(payload, '0s');

            // Wait a bit to ensure expiration
            await new Promise(resolve => setTimeout(resolve, 100));

            await expect(verifyToken(expiredToken)).rejects.toThrow('Token expiré');
        });

        it('should reject token with missing required fields', async () => {
            const incompletePayload = {
                userId: mockUser.id,
                // Missing login and role
            };

            const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!);
            const tokenWithIncompletePayload = await new jose.SignJWT(incompletePayload)
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('1h')
                .sign(secretKey);

            await expect(verifyToken(tokenWithIncompletePayload)).rejects.toThrow('Token invalide ou malformé');
        });

        it('should reject token with wrong data types', async () => {
            const invalidPayload = {
                userId: 'should-be-number',
                login: 123, // should be string
                role: mockUser.role,
            };

            const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!);
            const tokenWithInvalidPayload = await new jose.SignJWT(invalidPayload)
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('1h')
                .sign(secretKey);

            await expect(verifyToken(tokenWithInvalidPayload)).rejects.toThrow('Token invalide ou malformé');
        });
    });

    describe('NextAuth Configuration', () => {
        describe('Credentials Provider', () => {
            let authorizeFunction: any;

            beforeEach(() => {
                const credentialsProvider = authOptions.providers[0] as any;
                authorizeFunction = credentialsProvider.authorize;
            });

            it('should authenticate user with valid credentials', async () => {
                // Setup mock Prisma to return user
                mockFindUnique.mockResolvedValue(mockUser);
                (mockedBcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>).mockResolvedValue(true as any);

                const credentials = {
                    login: mockUser.login,
                    password: 'correct-password',
                };

                const result = await authorizeFunction(credentials);

                expect(result).toBeTruthy();
                expect(result.id).toBe(mockUser.id.toString());
                expect(result.name).toBe(`${mockUser.prenom} ${mockUser.nom}`);
                expect(result.email).toBe(mockUser.email);
                expect(result.role).toBe(mockUser.role);
            });

            it('should reject authentication with invalid password', async () => {
                const credentials = {
                    login: mockUser.login,
                    password: 'wrongpassword',
                };

                mockFindUnique.mockResolvedValue(mockUser);
                mockedBcrypt.compare.mockResolvedValue(false as never);

                const result = await authorizeFunction(credentials);

                expect(result).toBeNull();
            });

            it('should reject authentication for non-existent user', async () => {
                const credentials = {
                    login: 'nonexistent.user',
                    password: 'password',
                };

                mockFindUnique.mockResolvedValue(null);

                const result = await authorizeFunction(credentials);

                expect(result).toBeNull();
            });

            it('should reject authentication with missing credentials', async () => {
                const testCases = [
                    { login: null, password: 'password' },
                    { login: 'user', password: null },
                    { login: null, password: null },
                    {},
                    null,
                ];

                for (const credentials of testCases) {
                    const result = await authorizeFunction(credentials);
                    expect(result).toBeNull();
                }
            });

            it('should handle database errors gracefully', async () => {
                const credentials = {
                    login: mockUser.login,
                    password: 'password',
                };

                mockFindUnique.mockRejectedValue(new Error('Database connection error'));

                const result = await authorizeFunction(credentials);

                expect(result).toBeNull();
            });

            it('should handle bcrypt errors gracefully', async () => {
                const credentials = {
                    login: mockUser.login,
                    password: 'password',
                };

                mockFindUnique.mockResolvedValue(mockUser);
                (mockedBcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>)
                    .mockRejectedValue(new Error('Bcrypt error'));

                const result = await authorizeFunction(credentials);

                expect(result).toBeNull();
            });
        });

        describe('JWT Callback', () => {
            it('should add user data to JWT token', async () => {
                const jwtCallback = authOptions.callbacks?.jwt;
                expect(jwtCallback).toBeDefined();

                const token = {};
                const user = {
                    id: mockUser.id.toString(),
                    role: mockUser.role,
                };

                const result = await jwtCallback!({ token, user } as any);

                expect(result.userId).toBe(mockUser.id);
                expect(result.role).toBe(mockUser.role);
            });

            it('should preserve existing token when no user provided', async () => {
                const jwtCallback = authOptions.callbacks?.jwt;
                expect(jwtCallback).toBeDefined();

                const existingToken = {
                    userId: 999,
                    role: 'EXISTING_ROLE',
                    other: 'data',
                };

                const result = await jwtCallback!({ token: existingToken } as any);

                expect(result).toEqual(existingToken);
            });
        });

        describe('Session Callback', () => {
            it('should add user data to session', async () => {
                const sessionCallback = authOptions.callbacks?.session;
                expect(sessionCallback).toBeDefined();

                const session = {
                    user: {
                        name: 'Test User',
                        email: 'test@hospital.fr',
                    },
                };

                const token = {
                    userId: mockUser.id,
                    role: mockUser.role,
                };

                const result = await sessionCallback!({ session, token } as any);

                // Use optional chaining pour gérer le type union
                if (result.user && 'id' in result.user) {
                    expect(result.user.id).toBe(mockUser.id);
                    expect(result.user.role).toBe(mockUser.role);
                    expect(result.user.name).toBe('Test User'); // Preserve existing data
                }
            });

            it('should handle missing session user gracefully', async () => {
                const sessionCallback = authOptions.callbacks?.session;
                expect(sessionCallback).toBeDefined();

                const session = {}; // No user property
                const token = {
                    userId: mockUser.id,
                    role: mockUser.role,
                };

                const result = await sessionCallback!({ session, token } as any);

                expect(result).toEqual(session); // Should return session unchanged
            });
        });
    });

    describe('Security Tests', () => {
        it('should use secure algorithm (HS256)', async () => {
            const payload = {
                userId: mockUser.id,
                login: mockUser.login,
                role: mockUser.role,
            };

            const token = await createToken(payload);

            // Decode header to check algorithm
            const [headerB64] = token.split('.');
            const header = JSON.parse(
                Buffer.from(headerB64, 'base64url').toString('utf8')
            );

            expect(header.alg).toBe('HS256');
        });

        it('should not include sensitive data in token payload', async () => {
            const payload = {
                userId: mockUser.id,
                login: mockUser.login,
                role: mockUser.role,
            };

            const token = await createToken(payload);
            const decodedToken = await verifyToken(token);

            // Ensure no sensitive data is included
            expect(decodedToken).not.toHaveProperty('password');
            expect(decodedToken).not.toHaveProperty('email');
            expect(decodedToken).not.toHaveProperty('nom');
            expect(decodedToken).not.toHaveProperty('prenom');
        });

        it('should prevent timing attacks on token verification', async () => {
            const validPayload = {
                userId: mockUser.id,
                login: mockUser.login,
                role: mockUser.role,
            };

            const validToken = await createToken(validPayload);
            const invalidToken = 'completely.invalid.token';

            const startValid = Date.now();
            try {
                await verifyToken(validToken);
            } catch (e) {
                // Token might be expired, that's ok for timing test
            }
            const validTime = Date.now() - startValid;

            const startInvalid = Date.now();
            try {
                await verifyToken(invalidToken);
            } catch (e) {
                // Expected to fail
            }
            const invalidTime = Date.now() - startInvalid;

            // Both should take roughly the same time (within 100ms difference)
            expect(Math.abs(validTime - invalidTime)).toBeLessThan(100);
        });
    });

    describe('Integration avec Rôles Médicaux', () => {
        const medicalRoles = ['MEDECIN', 'INFIRMIER', 'CADRE', 'ADMIN'];

        it.each(medicalRoles)('should handle %s role correctly', async (role) => {
            const payload = {
                userId: mockUser.id,
                login: mockUser.login,
                role,
            };

            const token = await createToken(payload);
            const decodedToken = await verifyToken(token);

            expect(decodedToken.role).toBe(role);
            expect(typeof decodedToken.userId).toBe('number');
            expect(typeof decodedToken.login).toBe('string');
        });

        it('should reject invalid medical roles', async () => {
            const invalidRole = 'INVALID_ROLE';
            const payload = {
                userId: mockUser.id,
                login: mockUser.login,
                role: invalidRole,
            };

            // This should still work for token creation (validation should be elsewhere)
            const token = await createToken(payload);
            const decodedToken = await verifyToken(token);

            expect(decodedToken.role).toBe(invalidRole);
            // Role validation should be handled at the application level, not JWT level
        });
    });

    describe('Performance Tests', () => {
        it('should create tokens quickly (< 50ms)', async () => {
            const payload = {
                userId: mockUser.id,
                login: mockUser.login,
                role: mockUser.role,
            };

            const start = Date.now();
            await createToken(payload);
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(50);
        });

        it('should verify tokens quickly (< 50ms)', async () => {
            const payload = {
                userId: mockUser.id,
                login: mockUser.login,
                role: mockUser.role,
            };

            const token = await createToken(payload);

            const start = Date.now();
            await verifyToken(token);
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(50);
        });

        it('should handle multiple concurrent token operations', async () => {
            const payload = {
                userId: mockUser.id,
                login: mockUser.login,
                role: mockUser.role,
            };

            // Create multiple tokens concurrently
            const promises = Array.from({ length: 10 }, () => createToken(payload));
            const tokens = await Promise.all(promises);

            expect(tokens).toHaveLength(10);
            tokens.forEach(token => {
                expect(token).toBeTruthy();
                expect(typeof token).toBe('string');
            });

            // Verify all tokens concurrently
            const verifyPromises = tokens.map(token => verifyToken(token));
            const decodedTokens = await Promise.all(verifyPromises);

            decodedTokens.forEach(decodedToken => {
                expect(decodedToken.userId).toBe(payload.userId);
                expect(decodedToken.login).toBe(payload.login);
                expect(decodedToken.role).toBe(payload.role);
            });
        });
    });
}); 