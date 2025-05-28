import { AuthCacheRedis } from '../authCache-redis';
import { redis } from '@/lib/redis';

jest.mock('@/lib/redis');

describe('AuthCacheRedis', () => {
  let authCache: AuthCacheRedis;
  let mockRedis: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRedis = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      scan: jest.fn(),
      pipeline: jest.fn(),
      info: jest.fn(),
    };

    (redis as any) = mockRedis;
    authCache = new AuthCacheRedis();
  });

  describe('cacheAuthToken', () => {
    it('should cache auth token with correct TTL', async () => {
      const token = 'test-token-123';
      const decodedToken = {
        userId: 'user123',
        login: 'testuser',
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };

      mockRedis.setex.mockResolvedValue('OK');

      await authCache.cacheAuthToken(token, decodedToken);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining('auth:token:'),
        expect.any(Number),
        JSON.stringify(decodedToken)
      );
    });

    it('should not cache expired tokens', async () => {
      const token = 'expired-token';
      const decodedToken = {
        userId: 'user123',
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200,
      };

      await authCache.cacheAuthToken(token, decodedToken);

      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      const token = 'test-token';
      const decodedToken = {
        userId: 'user123',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRedis.setex.mockRejectedValue(new Error('Redis error'));

      // Should not throw
      await expect(authCache.cacheAuthToken(token, decodedToken)).resolves.toBeUndefined();
    });
  });

  describe('getCachedAuthToken', () => {
    it('should retrieve cached token successfully', async () => {
      const token = 'test-token-123';
      const cachedData = {
        userId: 'user123',
        login: 'testuser',
        role: 'admin',
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await authCache.getCachedAuthToken(token);

      expect(result).toEqual(cachedData);
      expect(mockRedis.get).toHaveBeenCalledWith(expect.stringContaining('auth:token:'));
    });

    it('should return null for missing token', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await authCache.getCachedAuthToken('missing-token');

      expect(result).toBeNull();
    });

    it('should delete and return null for expired cached token', async () => {
      const token = 'expired-token';
      const expiredData = {
        userId: 'user123',
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(expiredData));
      mockRedis.del.mockResolvedValue(1);

      const result = await authCache.getCachedAuthToken(token);

      expect(result).toBeNull();
      expect(mockRedis.del).toHaveBeenCalledWith(expect.stringContaining('auth:token:'));
    });

    it('should handle JSON parse errors', async () => {
      mockRedis.get.mockResolvedValue('invalid-json');

      const result = await authCache.getCachedAuthToken('test-token');

      expect(result).toBeNull();
    });
  });

  describe('cacheUserData', () => {
    it('should cache user data with correct TTL', async () => {
      const userId = 'user123';
      const userData = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
      };

      mockRedis.setex.mockResolvedValue('OK');

      await authCache.cacheUserData(userId, userData);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        `auth:user:${userId}`,
        300, // 5 minutes
        JSON.stringify(userData)
      );
    });

    it('should handle cache errors gracefully', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis error'));

      await expect(authCache.cacheUserData('user123', {})).resolves.toBeUndefined();
    });
  });

  describe('invalidateUserCache', () => {
    it('should invalidate all user cache entries', async () => {
      const userId = 'user123';
      const mockPipeline = {
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      mockRedis.pipeline.mockReturnValue(mockPipeline);
      mockRedis.scan.mockResolvedValue([
        '0',
        [
          `auth:token:hash1:${userId}`,
          `auth:token:hash2:${userId}`,
          `auth:user:${userId}`,
          `auth:permissions:${userId}`,
        ],
      ]);

      await authCache.invalidateUserCache(userId);

      expect(mockPipeline.del).toHaveBeenCalledTimes(4);
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it('should handle no keys to delete', async () => {
      mockRedis.scan.mockResolvedValue(['0', []]);

      await expect(authCache.invalidateUserCache('user123')).resolves.toBeUndefined();
    });

    it('should ignore tokens for other users', async () => {
      const userId = 'user123';
      const mockPipeline = {
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      mockRedis.pipeline.mockReturnValue(mockPipeline);
      mockRedis.scan.mockResolvedValue([
        '0',
        [`auth:token:hash1:${userId}`, 'auth:token:hash2:otheruser', `auth:user:${userId}`],
      ]);

      await authCache.invalidateUserCache(userId);

      expect(mockPipeline.del).toHaveBeenCalledTimes(2); // Only user123's entries
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      mockRedis.info.mockResolvedValue(
        'used_memory_human:10M\r\n' +
          'connected_clients:5\r\n' +
          'total_commands_processed:1000\r\n'
      );

      const stats = await authCache.getCacheStats();

      expect(stats).toEqual({
        memory: '10M',
        connections: 5,
        commands: 1000,
      });
    });

    it('should handle missing info gracefully', async () => {
      mockRedis.info.mockResolvedValue('');

      const stats = await authCache.getCacheStats();

      expect(stats).toEqual({
        memory: 'N/A',
        connections: 0,
        commands: 0,
      });
    });

    it('should handle Redis errors', async () => {
      mockRedis.info.mockRejectedValue(new Error('Redis error'));

      const stats = await authCache.getCacheStats();

      expect(stats).toEqual({
        memory: 'N/A',
        connections: 0,
        commands: 0,
        error: 'Redis error',
      });
    });
  });
});
