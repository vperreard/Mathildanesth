import { AuthCacheService } from '../authCache';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

// Mock des dépendances
jest.mock('@/lib/redis');
jest.mock('@/lib/logger');

describe('AuthCacheService', () => {
    const mockRedis = redis as jest.Mocked<typeof redis>;
    const mockLogger = logger as jest.Mocked<typeof logger>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('cacheAuthToken', () => {
        it('should cache auth token successfully', async () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
            const decodedToken = {
                userId: 'user123',
                login: 'testuser',
                role: 'admin',
                exp: Math.floor(Date.now() / 1000) + 3600, // 1 heure dans le futur
                iat: Math.floor(Date.now() / 1000)
            };

            await AuthCacheService.cacheAuthToken(token, decodedToken);

            expect(mockRedis.setex).toHaveBeenCalledWith(
                expect.stringContaining('auth:token:'),
                expect.any(Number),
                JSON.stringify(decodedToken)
            );
            expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('Token cached for'));
        });

        it('should not cache expired token', async () => {
            const token = 'expired.token';
            const decodedToken = {
                userId: 'user123',
                login: 'testuser',
                role: 'admin',
                exp: Math.floor(Date.now() / 1000) - 3600, // 1 heure dans le passé
                iat: Math.floor(Date.now() / 1000) - 7200
            };

            await AuthCacheService.cacheAuthToken(token, decodedToken);

            expect(mockRedis.setex).not.toHaveBeenCalled();
        });

        it('should handle cache errors gracefully', async () => {
            const token = 'test.token';
            const decodedToken = {
                userId: 'user123',
                login: 'testuser',
                role: 'admin',
                exp: Math.floor(Date.now() / 1000) + 3600,
                iat: Math.floor(Date.now() / 1000)
            };

            mockRedis.setex.mockRejectedValueOnce(new Error('Redis error'));

            await AuthCacheService.cacheAuthToken(token, decodedToken);

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to cache auth token:', expect.any(Error));
        });
    });

    describe('getCachedAuthToken', () => {
        it('should retrieve cached token successfully', async () => {
            const token = 'test.token';
            const cachedData = {
                userId: 'user123',
                login: 'testuser',
                role: 'admin',
                exp: Math.floor(Date.now() / 1000) + 3600,
                iat: Math.floor(Date.now() / 1000)
            };

            mockRedis.get.mockResolvedValueOnce(JSON.stringify(cachedData));

            const result = await AuthCacheService.getCachedAuthToken(token);

            expect(result).toEqual(cachedData);
            expect(mockRedis.get).toHaveBeenCalledWith(expect.stringContaining('auth:token:'));
        });

        it('should return null for missing token', async () => {
            mockRedis.get.mockResolvedValueOnce(null);

            const result = await AuthCacheService.getCachedAuthToken('missing.token');

            expect(result).toBeNull();
        });

        it('should delete and return null for expired token', async () => {
            const expiredData = {
                userId: 'user123',
                login: 'testuser',
                role: 'admin',
                exp: Math.floor(Date.now() / 1000) - 3600,
                iat: Math.floor(Date.now() / 1000) - 7200
            };

            mockRedis.get.mockResolvedValueOnce(JSON.stringify(expiredData));

            const result = await AuthCacheService.getCachedAuthToken('expired.token');

            expect(result).toBeNull();
            expect(mockRedis.del).toHaveBeenCalled();
        });

        it('should handle errors gracefully', async () => {
            mockRedis.get.mockRejectedValueOnce(new Error('Redis error'));

            const result = await AuthCacheService.getCachedAuthToken('error.token');

            expect(result).toBeNull();
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to get cached auth token:', expect.any(Error));
        });
    });

    describe('cacheUserData', () => {
        it('should cache user data successfully', async () => {
            const userId = 'user123';
            const userData = {
                id: userId,
                login: 'testuser',
                email: 'test@example.com',
                nom: 'Test',
                prenom: 'User',
                role: 'admin',
                professionalRole: 'MAR',
                siteIds: ['site1', 'site2'],
                permissions: ['read', 'write']
            };

            await AuthCacheService.cacheUserData(userId, userData);

            expect(mockRedis.setex).toHaveBeenCalledWith(
                expect.stringContaining('user:data:'),
                expect.any(Number),
                JSON.stringify(userData)
            );
            expect(mockLogger.debug).toHaveBeenCalledWith(`User data cached for user ${userId}`);
        });

        it('should handle cache errors gracefully', async () => {
            mockRedis.setex.mockRejectedValueOnce(new Error('Redis error'));

            await AuthCacheService.cacheUserData('user123', {} as any);

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to cache user data:', expect.any(Error));
        });
    });

    describe('getCachedUserData', () => {
        it('should retrieve cached user data successfully', async () => {
            const userData = {
                id: 'user123',
                login: 'testuser',
                email: 'test@example.com',
                nom: 'Test',
                prenom: 'User',
                role: 'admin',
                professionalRole: 'MAR'
            };

            mockRedis.get.mockResolvedValueOnce(JSON.stringify(userData));

            const result = await AuthCacheService.getCachedUserData('user123');

            expect(result).toEqual(userData);
        });

        it('should return null for missing data', async () => {
            mockRedis.get.mockResolvedValueOnce(null);

            const result = await AuthCacheService.getCachedUserData('missing');

            expect(result).toBeNull();
        });

        it('should handle errors gracefully', async () => {
            mockRedis.get.mockRejectedValueOnce(new Error('Redis error'));

            const result = await AuthCacheService.getCachedUserData('error');

            expect(result).toBeNull();
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to get cached user data:', expect.any(Error));
        });
    });

    describe('cacheUserPermissions', () => {
        it('should cache permissions successfully', async () => {
            const userId = 'user123';
            const permissions = ['read', 'write', 'delete'];

            await AuthCacheService.cacheUserPermissions(userId, permissions);

            expect(mockRedis.setex).toHaveBeenCalledWith(
                expect.stringContaining('user:permissions:'),
                expect.any(Number),
                JSON.stringify(permissions)
            );
            expect(mockLogger.debug).toHaveBeenCalledWith(`Permissions cached for user ${userId}`);
        });

        it('should handle errors gracefully', async () => {
            mockRedis.setex.mockRejectedValueOnce(new Error('Redis error'));

            await AuthCacheService.cacheUserPermissions('user123', []);

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to cache user permissions:', expect.any(Error));
        });
    });

    describe('getCachedUserPermissions', () => {
        it('should retrieve cached permissions successfully', async () => {
            const permissions = ['read', 'write', 'delete'];
            mockRedis.get.mockResolvedValueOnce(JSON.stringify(permissions));

            const result = await AuthCacheService.getCachedUserPermissions('user123');

            expect(result).toEqual(permissions);
        });

        it('should return null for missing permissions', async () => {
            mockRedis.get.mockResolvedValueOnce(null);

            const result = await AuthCacheService.getCachedUserPermissions('missing');

            expect(result).toBeNull();
        });

        it('should handle errors gracefully', async () => {
            mockRedis.get.mockRejectedValueOnce(new Error('Redis error'));

            const result = await AuthCacheService.getCachedUserPermissions('error');

            expect(result).toBeNull();
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to get cached user permissions:', expect.any(Error));
        });
    });

    describe('invalidateUserCache', () => {
        it('should invalidate all user cache entries', async () => {
            const userId = 'user123';
            const tokenKeys = ['auth:token:abc', 'auth:token:def'];
            const tokenData = JSON.stringify({ userId, login: 'test', role: 'admin', exp: 0, iat: 0 });

            mockRedis.keys.mockResolvedValueOnce(tokenKeys);
            mockRedis.get.mockResolvedValue(tokenData);

            await AuthCacheService.invalidateUserCache(userId);

            expect(mockRedis.del).toHaveBeenCalledWith(
                expect.stringContaining('user:data:'),
                expect.stringContaining('user:permissions:'),
                ...tokenKeys
            );
            expect(mockLogger.debug).toHaveBeenCalledWith(`Cache invalidated for user ${userId}`);
        });

        it('should handle no keys to delete', async () => {
            mockRedis.keys.mockResolvedValueOnce(null);

            await AuthCacheService.invalidateUserCache('user123');

            expect(mockRedis.del).not.toHaveBeenCalled();
        });

        it('should ignore tokens for other users', async () => {
            const userId = 'user123';
            const tokenKeys = ['auth:token:abc'];
            const otherUserToken = JSON.stringify({ userId: 'other', login: 'other', role: 'user', exp: 0, iat: 0 });

            mockRedis.keys.mockResolvedValueOnce(tokenKeys);
            mockRedis.get.mockResolvedValueOnce(otherUserToken);

            await AuthCacheService.invalidateUserCache(userId);

            expect(mockRedis.del).toHaveBeenCalledWith(
                expect.stringContaining('user:data:'),
                expect.stringContaining('user:permissions:')
            );
        });

        it('should handle JSON parse errors', async () => {
            const userId = 'user123';
            mockRedis.keys.mockResolvedValueOnce(['auth:token:invalid']);
            mockRedis.get.mockResolvedValueOnce('invalid json');

            await AuthCacheService.invalidateUserCache(userId);

            expect(mockRedis.del).toHaveBeenCalledWith(
                expect.stringContaining('user:data:'),
                expect.stringContaining('user:permissions:')
            );
        });

        it('should handle errors gracefully', async () => {
            mockRedis.keys.mockRejectedValueOnce(new Error('Redis error'));

            await AuthCacheService.invalidateUserCache('user123');

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to invalidate user cache:', expect.any(Error));
        });
    });

    describe('getCacheStats', () => {
        it('should return cache statistics', async () => {
            mockRedis.keys
                .mockResolvedValueOnce(['token1', 'token2']) // tokens
                .mockResolvedValueOnce(['user1', 'user2', 'user3']) // users
                .mockResolvedValueOnce(['perm1']); // permissions

            const stats = await AuthCacheService.getCacheStats();

            expect(stats).toEqual({
                tokens: 2,
                users: 3,
                permissions: 1
            });
        });

        it('should handle null responses', async () => {
            mockRedis.keys.mockResolvedValue(null);

            const stats = await AuthCacheService.getCacheStats();

            expect(stats).toEqual({
                tokens: 0,
                users: 0,
                permissions: 0
            });
        });

        it('should handle errors gracefully', async () => {
            mockRedis.keys.mockRejectedValueOnce(new Error('Redis error'));

            const stats = await AuthCacheService.getCacheStats();

            expect(stats).toEqual({
                tokens: 0,
                users: 0,
                permissions: 0
            });
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to get cache stats:', expect.any(Error));
        });
    });
});