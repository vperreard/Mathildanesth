import { 
    generateAuthToken, 
    verifyAuthToken, 
    getAuthToken, 
    setAuthToken, 
    removeAuthToken, 
    checkUserRole,
    UserJWTPayload,
    UserRole
} from '../auth-utils';
import { cookies } from 'next/headers';
import * as jose from 'jose';

// Mock next/headers
jest.mock('next/headers', () => ({
    cookies: jest.fn()
}));

describe('auth-utils', () => {
    let consoleErrorSpy: jest.SpyInstance;
    const mockCookieStore = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset the jose mock state
        const jose = require('jose');
        if (jose.__resetMock) {
            jose.__resetMock();
        }
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (cookies as jest.Mock).mockResolvedValue(mockCookieStore);
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('generateAuthToken', () => {
        it('should generate a valid JWT token', async () => {
            const payload = {
                userId: 1,
                login: 'testuser',
                role: 'USER'
            };

            const token = await generateAuthToken(payload);

            expect(token).toBeTruthy();
            expect(typeof token).toBe('string');
            
            // Verify token structure (JWT has 3 parts separated by dots)
            const parts = token.split('.');
            expect(parts).toHaveLength(3);
        });

        it('should include issuer and audience in token', async () => {
            const payload = {
                userId: 1,
                login: 'admin',
                role: 'ADMIN_TOTAL'
            };

            const token = await generateAuthToken(payload);
            
            // Decode without verification to check claims
            const decoded = jose.decodeJwt(token);
            expect(decoded.iss).toBe('mathildanesth');
            expect(decoded.aud).toBe('mathildanesth-client');
            expect(decoded.userId).toBe(1);
            expect(decoded.login).toBe('admin');
            expect(decoded.role).toBe('ADMIN_TOTAL');
        });
    });

    describe('verifyAuthToken', () => {
        it('should verify a valid token', async () => {
            const payload = {
                userId: 1,
                login: 'testuser',
                role: 'USER'
            };

            const token = await generateAuthToken(payload);
            const result = await verifyAuthToken(token);

            expect(result.authenticated).toBe(true);
            expect(result.user).toEqual({
                userId: 1,
                login: 'testuser',
                role: 'USER'
            });
            expect(result.error).toBeUndefined();
        });

        it('should reject invalid token', async () => {
            const result = await verifyAuthToken('invalid.token.here');

            expect(result.authenticated).toBe(false);
            expect(result.error).toBe('Token invalide ou expiré');
            expect(consoleErrorSpy).toHaveBeenCalled();
            const errorCall = consoleErrorSpy.mock.calls[0][0];
            expect(errorCall).toContain('Erreur de vérification du token:');
        });

        it('should get token from cookies if not provided', async () => {
            const payload = {
                userId: 2,
                login: 'cookieuser',
                role: 'ADMIN_PARTIEL'
            };

            const token = await generateAuthToken(payload);
            mockCookieStore.get.mockReturnValue({ value: token });

            const result = await verifyAuthToken();

            expect(mockCookieStore.get).toHaveBeenCalledWith('auth_token');
            expect(result.authenticated).toBe(true);
            expect(result.user?.login).toBe('cookieuser');
        });

        it('should return error if no token provided and none in cookies', async () => {
            mockCookieStore.get.mockReturnValue(undefined);

            const result = await verifyAuthToken();

            expect(result.authenticated).toBe(false);
            expect(result.error).toBe('Token non fourni');
        });

        it('should reject token with invalid structure', async () => {
            // Create token with missing required fields
            const invalidPayload = {
                someField: 'value'
            };

            const token = await generateAuthToken(invalidPayload);
            const result = await verifyAuthToken(token);

            expect(result.authenticated).toBe(false);
            expect(result.error).toBe('Structure du token invalide');
        });

        it('should handle expired token', async () => {
            // Mock an expired token scenario
            const expiredToken = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsImxvZ2luIjoidGVzdCIsInJvbGUiOiJVU0VSIiwiaXNzIjoibWF0aGlsZGFuZXN0aCIsImF1ZCI6Im1hdGhpbGRhbmVzdGgtY2xpZW50IiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.invalid';

            const result = await verifyAuthToken(expiredToken);

            expect(result.authenticated).toBe(false);
            expect(result.error).toBe('Token invalide ou expiré');
        });
    });

    describe('getAuthToken', () => {
        it('should return token from cookies', async () => {
            mockCookieStore.get.mockReturnValue({ value: 'test-token' });

            const token = await getAuthToken();

            expect(cookies).toHaveBeenCalled();
            expect(mockCookieStore.get).toHaveBeenCalledWith('auth_token');
            expect(token).toBe('test-token');
        });

        it('should return null if no token in cookies', async () => {
            mockCookieStore.get.mockReturnValue(undefined);

            const token = await getAuthToken();

            expect(token).toBeUndefined();
        });

        it('should handle cookie access errors', async () => {
            (cookies as jest.Mock).mockRejectedValue(new Error('Cookie error'));

            const token = await getAuthToken();

            expect(token).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalled();
            const errorCall = consoleErrorSpy.mock.calls[0][0];
            expect(errorCall).toContain('Erreur lors de la récupération du token:');
        });
    });

    describe('setAuthToken', () => {
        it('should set token in cookies with correct options', async () => {
            await setAuthToken('new-token');

            expect(mockCookieStore.set).toHaveBeenCalledWith('auth_token', 'new-token', {
                httpOnly: true,
                secure: false, // NODE_ENV is 'test'
                sameSite: 'strict',
                maxAge: 86400, // 24 hours
                path: '/'
            });
        });

        it('should set secure cookie in production', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            await setAuthToken('secure-token');

            expect(mockCookieStore.set).toHaveBeenCalledWith('auth_token', 'secure-token', 
                expect.objectContaining({ secure: true })
            );

            process.env.NODE_ENV = originalEnv;
        });

        it('should handle cookie set errors', async () => {
            mockCookieStore.set.mockImplementation(() => {
                throw new Error('Set cookie error');
            });

            await setAuthToken('error-token');

            expect(consoleErrorSpy).toHaveBeenCalled();
            const errorCall = consoleErrorSpy.mock.calls[0][0];
            expect(errorCall).toContain('Erreur lors de la définition du token:');
        });
    });

    describe('removeAuthToken', () => {
        it('should delete auth token cookie', async () => {
            await removeAuthToken();

            expect(mockCookieStore.delete).toHaveBeenCalledWith('auth_token');
        });

        it('should handle cookie deletion errors', async () => {
            mockCookieStore.delete.mockImplementation(() => {
                throw new Error('Delete cookie error');
            });

            await removeAuthToken();

            expect(consoleErrorSpy).toHaveBeenCalled();
            const errorCall = consoleErrorSpy.mock.calls[0][0];
            expect(errorCall).toContain('Erreur lors de la suppression du token:');
        });
    });

    describe('checkUserRole', () => {
        it('should return true for user with allowed role', async () => {
            const payload = {
                userId: 1,
                login: 'admin',
                role: 'ADMIN_TOTAL'
            };

            const token = await generateAuthToken(payload);
            mockCookieStore.get.mockReturnValue({ value: token });

            const result = await checkUserRole(['ADMIN_TOTAL', 'ADMIN_PARTIEL']);

            expect(result.hasRequiredRole).toBe(true);
            expect(result.user).toEqual(payload);
            expect(result.error).toBeNull();
        });

        it('should return false for user without allowed role', async () => {
            const payload = {
                userId: 1,
                login: 'user',
                role: 'USER'
            };

            const token = await generateAuthToken(payload);
            mockCookieStore.get.mockReturnValue({ value: token });

            const result = await checkUserRole(['ADMIN_TOTAL', 'ADMIN_PARTIEL']);

            expect(result.hasRequiredRole).toBe(false);
            expect(result.error).toBe('Accès non autorisé pour ce rôle');
        });

        it('should handle unauthenticated user', async () => {
            mockCookieStore.get.mockReturnValue(undefined);

            const result = await checkUserRole(['USER']);

            expect(result.hasRequiredRole).toBe(false);
            expect(result.error).toBe('Token non fourni');
        });

        it('should work with single role check', async () => {
            const payload = {
                userId: 1,
                login: 'partial',
                role: 'ADMIN_PARTIEL'
            };

            const token = await generateAuthToken(payload);
            mockCookieStore.get.mockReturnValue({ value: token });

            const result = await checkUserRole(['ADMIN_PARTIEL']);

            expect(result.hasRequiredRole).toBe(true);
        });
    });
});