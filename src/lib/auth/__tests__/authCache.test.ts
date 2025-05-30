import { AuthCacheService } from '../authCache';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

// Mock des dépendances
jest.mock('@/lib/redis', () => ({
  redis: {
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    keys: jest.fn()
  }
}));
jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn()
  }
}));

describe('AuthCacheService', () => {
    const mockRedis = redis as jest.Mocked<typeof redis>;
    const mockLogger = logger as jest.Mocked<typeof logger>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('cacheAuthToken', () => {
        it('should cache auth token successfully', async () => {
            const token = 'test-token-123';
            const payload = {
                userId: 'user123',
                role: 'admin'
            };
            
            mockRedis.setex.mockResolvedValue('OK');

            await AuthCacheService.cacheAuthToken(token, payload);

            expect(mockRedis.setex).toHaveBeenCalledWith(
                'auth:token:test-token-123',
                300, // 5 minutes
                JSON.stringify(payload)
            );
        });

        it('should handle redis unavailable gracefully', async () => {
            // Mock redis as null
            (redis as any) = null;
            
            const token = 'test-token-123';
            const payload = { userId: '1', role: 'user' };

            await expect(AuthCacheService.cacheAuthToken(token, payload)).resolves.not.toThrow();
            
            // Restore redis mock
            (redis as any) = mockRedis;
        });

        it('should handle cache errors gracefully', async () => {
            const token = 'test-token-123';
            const payload = { userId: 'user123', role: 'admin' };
            const error = new Error('Redis error');

            mockRedis.setex.mockRejectedValueOnce(error);

            await AuthCacheService.cacheAuthToken(token, payload);

            expect(mockLogger.warn).toHaveBeenCalledWith('Failed to cache auth token', error);
        });
    });

    describe('getCachedAuthToken', () => {
        it('should retrieve cached token successfully', async () => {
            const token = 'test-token-123';
            const cachedData = {
                userId: 'user123',
                role: 'admin'
            };

            mockRedis.get.mockResolvedValueOnce(JSON.stringify(cachedData));

            const result = await AuthCacheService.getCachedAuthToken(token);

            expect(result).toEqual(cachedData);
            expect(mockRedis.get).toHaveBeenCalledWith('auth:token:test-token-123');
        });

        it('should return null for missing token', async () => {
            mockRedis.get.mockResolvedValueOnce(null);

            const result = await AuthCacheService.getCachedAuthToken('missing-token');

            expect(result).toBeNull();
        });

        it('should return null when redis unavailable', async () => {
            // Mock redis as null
            (redis as any) = null;
            
            const token = 'test-token-123';

            const result = await AuthCacheService.getCachedAuthToken(token);
            
            expect(result).toBeNull();
            
            // Restore redis mock
            (redis as any) = mockRedis;
        });

        it('should handle errors gracefully', async () => {
            const error = new Error('Redis error');
            mockRedis.get.mockRejectedValueOnce(error);

            const result = await AuthCacheService.getCachedAuthToken('error-token');

            expect(result).toBeNull();
            expect(mockLogger.warn).toHaveBeenCalledWith('Failed to get cached auth token', error);
        });
    });

    describe('cacheUserData', () => {
        it('should cache user data successfully', async () => {
            const userId = 'user123';
            const userData = {
                id: userId,
                email: 'test@example.com',
                role: 'admin'
            };
            
            mockRedis.setex.mockResolvedValue('OK');

            await AuthCacheService.cacheUserData(userId, userData);

            expect(mockRedis.setex).toHaveBeenCalledWith(
                'auth:user:user123',
                300, // 5 minutes
                JSON.stringify(userData)
            );
        });

        it('should handle cache errors gracefully', async () => {
            const error = new Error('Redis error');
            mockRedis.setex.mockRejectedValueOnce(error);

            await AuthCacheService.cacheUserData('user123', {} as any);

            expect(mockLogger.warn).toHaveBeenCalledWith('Failed to cache user data', error);
        });
    });

    describe('getCachedUserData', () => {
        it('should retrieve cached user data successfully', async () => {
            const userData = {
                id: 'user123',
                email: 'test@example.com',
                role: 'admin'
            };

            mockRedis.get.mockResolvedValueOnce(JSON.stringify(userData));

            const result = await AuthCacheService.getCachedUserData('user123');

            expect(result).toEqual(userData);
            expect(mockRedis.get).toHaveBeenCalledWith('auth:user:user123');
        });

        it('should return null for missing data', async () => {
            mockRedis.get.mockResolvedValueOnce(null);

            const result = await AuthCacheService.getCachedUserData('missing');

            expect(result).toBeNull();
        });

        it('should handle errors gracefully', async () => {
            const error = new Error('Redis error');
            mockRedis.get.mockRejectedValueOnce(error);

            const result = await AuthCacheService.getCachedUserData('error');

            expect(result).toBeNull();
            expect(mockLogger.warn).toHaveBeenCalledWith('Failed to get cached user data', error);
        });
    });

    describe('invalidateAuthToken', () => {
        it('should invalidate auth token successfully', async () => {
            const token = 'test-token-123';
            
            mockRedis.del.mockResolvedValue(1);

            await AuthCacheService.invalidateAuthToken(token);

            expect(mockRedis.del).toHaveBeenCalledWith('auth:token:test-token-123');
        });

        it('should handle redis unavailable gracefully', async () => {
            // Mock redis as null
            (redis as any) = null;
            
            const token = 'test-token-123';

            await expect(AuthCacheService.invalidateAuthToken(token)).resolves.not.toThrow();
            
            // Restore redis mock
            (redis as any) = mockRedis;
        });

        it('should handle redis errors gracefully', async () => {
            const token = 'test-token-123';
            const error = new Error('Redis connection failed');
            
            mockRedis.del.mockRejectedValue(error);

            await AuthCacheService.invalidateAuthToken(token);

            expect(mockLogger.warn).toHaveBeenCalledWith('Failed to invalidate auth token', error);
        });
    });

    describe('invalidateUserData', () => {
        it('should invalidate user data successfully', async () => {
            const userId = 'user-123';
            
            mockRedis.del.mockResolvedValue(1);

            await AuthCacheService.invalidateUserData(userId);

            expect(mockRedis.del).toHaveBeenCalledWith('auth:user:user-123');
        });

        it('should handle redis unavailable gracefully', async () => {
            // Mock redis as null
            (redis as any) = null;
            
            const userId = 'user-123';

            await expect(AuthCacheService.invalidateUserData(userId)).resolves.not.toThrow();
            
            // Restore redis mock
            (redis as any) = mockRedis;
        });

        it('should handle redis errors gracefully', async () => {
            const userId = 'user-123';
            const error = new Error('Redis connection failed');
            
            mockRedis.del.mockRejectedValue(error);

            await AuthCacheService.invalidateUserData(userId);

            expect(mockLogger.warn).toHaveBeenCalledWith('Failed to invalidate user data', error);
        });
    });

    describe('clearAllCaches', () => {
        it('should clear all auth caches successfully', async () => {
            const keys = ['auth:token:token1', 'auth:user:user1', 'auth:token:token2'];
            
            mockRedis.keys.mockResolvedValue(keys);
            mockRedis.del.mockResolvedValue(3);

            await AuthCacheService.clearAllCaches();

            expect(mockRedis.keys).toHaveBeenCalledWith('auth:*');
            expect(mockRedis.del).toHaveBeenCalledWith(...keys);
        });

        it('should handle no keys found', async () => {
            mockRedis.keys.mockResolvedValue([]);

            await AuthCacheService.clearAllCaches();

            expect(mockRedis.keys).toHaveBeenCalledWith('auth:*');
            expect(mockRedis.del).not.toHaveBeenCalled();
        });

        it('should handle redis unavailable gracefully', async () => {
            // Mock redis as null
            (redis as any) = null;

            await expect(AuthCacheService.clearAllCaches()).resolves.not.toThrow();
            
            // Restore redis mock
            (redis as any) = mockRedis;
        });

        it('should handle redis errors gracefully', async () => {
            const error = new Error('Redis connection failed');
            
            mockRedis.keys.mockRejectedValue(error);

            await AuthCacheService.clearAllCaches();

            expect(mockLogger.warn).toHaveBeenCalledWith('Failed to clear auth caches', error);
        });
    });
});