/**
 * Tests pour Redis Client Optimisé - Phase 2 Validation
 */

import { getRedisClient, OptimizedRedisClient } from '../redis-optimized';

// Mock du runtime detector
jest.mock('../runtime-detector', () => ({
    isFeatureAvailable: jest.fn(() => false), // Force fallback memory pour tests
    DYNAMIC_IMPORTS: {
        redis: jest.fn(() => null)
    }
}));

describe('OptimizedRedisClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    let client: OptimizedRedisClient;

    beforeEach(() => {
    jest.clearAllMocks();
        client = getRedisClient();
    });

    afterEach(async () => {
        await client.flushdb();
    });

    describe('Basic Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should set and get values', async () => {
            const result = await client.set('test:key', 'test-value');
            expect(result).toBe('OK');

            const value = await client.get('test:key');
            expect(value).toBe('test-value');
        });

        test('should handle non-existent keys', async () => {
            const value = await client.get('non:existent');
            expect(value).toBeNull();
        });

        test('should delete keys', async () => {
            await client.set('test:delete', 'value');
            const deleted = await client.del('test:delete');
            expect(deleted).toBe(1);

            const value = await client.get('test:delete');
            expect(value).toBeNull();
        });
    });

    describe('Expiration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should set key with expiration using setex', async () => {
            const result = await client.setex('test:expire', 1, 'expiring-value');
            expect(result).toBe('OK');

            const value = await client.get('test:expire');
            expect(value).toBe('expiring-value');

            const ttl = await client.ttl('test:expire');
            expect(ttl).toBeGreaterThan(0);
        });

        test('should expire keys after TTL', async () => {
            await client.setex('test:quick-expire', 1, 'will-expire');
            
            // Simulate expiration by waiting
            await new Promise(resolve => setTimeout(resolve, 1100));
            
            const value = await client.get('test:quick-expire');
            expect(value).toBeNull();
        });

        test('should set expiration on existing keys', async () => {
            await client.set('test:set-expire', 'value');
            const expireResult = await client.expire('test:set-expire', 1);
            expect(expireResult).toBe(1);

            const ttl = await client.ttl('test:set-expire');
            expect(ttl).toBeGreaterThan(0);
        });
    });

    describe('Hash Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should handle hash operations', async () => {
            const hsetResult = await client.hset('test:hash', 'field1', 'value1');
            expect(hsetResult).toBe(1);

            const value = await client.hget('test:hash', 'field1');
            expect(value).toBe('value1');

            const hmsetResult = await client.hmset('test:hash2', {
                field1: 'value1',
                field2: 'value2'
            });
            expect(hmsetResult).toBe('OK');

            const all = await client.hgetall('test:hash2');
            expect(all).toEqual({
                field1: 'value1',
                field2: 'value2'
            });
        });
    });

    describe('Key Pattern Matching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should find keys by pattern', async () => {
            await client.set('user:1', 'user1');
            await client.set('user:2', 'user2');
            await client.set('order:1', 'order1');

            const userKeys = await client.keys('user:*');
            expect(userKeys).toContain('user:1');
            expect(userKeys).toContain('user:2');
            expect(userKeys).not.toContain('order:1');

            const allKeys = await client.keys('*');
            expect(allKeys?.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('Connection and Health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should ping successfully', async () => {
            const pong = await client.ping();
            expect(pong).toBe('PONG'); // Fallback response in tests
        });

        test('should provide connection info', () => {
            const info = client.getConnectionInfo();
            expect(info).toHaveProperty('enabled');
            expect(info).toHaveProperty('connected');
            expect(info).toHaveProperty('fallbackCacheSize');
            expect(info).toHaveProperty('client');
        });

        test('should track fallback cache size', async () => {
            const initialSize = client.getFallbackCacheSize();
            
            await client.set('cache:test1', 'value1');
            await client.set('cache:test2', 'value2');
            
            const newSize = client.getFallbackCacheSize();
            expect(newSize).toBe(initialSize + 2);
        });
    });

    describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should handle connection gracefully', () => {
            expect(() => getRedisClient()).not.toThrow();
        });

        test('should disconnect without errors', async () => {
            await expect(client.disconnect()).resolves.not.toThrow();
        });

        test('should flush database safely', async () => {
            await client.set('test:flush', 'value');
            const result = await client.flushdb();
            expect(result).toBe('OK');
            
            const value = await client.get('test:flush');
            expect(value).toBeNull();
        });
    });

    describe('Memory Fallback Behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should use memory fallback when Redis unavailable', () => {
            const info = client.getConnectionInfo();
            expect(info.client).toBe('memory');
            expect(info.enabled).toBe(false);
        });

        test('should handle concurrent operations', async () => {
            const operations = Array.from({ length: 10 }, (_, i) =>
                client.set(`concurrent:${i}`, `value${i}`)
            );

            const results = await Promise.all(operations);
            expect(results.every(r => r === 'OK')).toBe(true);

            const getOperations = Array.from({ length: 10 }, (_, i) =>
                client.get(`concurrent:${i}`)
            );

            const values = await Promise.all(getOperations);
            values.forEach((value, i) => {
                expect(value).toBe(`value${i}`);
            });
        });
    });
});

describe('Redis Client Singleton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    test('should return same instance', () => {
        const client1 = getRedisClient();
        const client2 = getRedisClient();
        expect(client1).toBe(client2);
    });

    test('should maintain state across calls', async () => {
        const client1 = getRedisClient();
        await client1.set('singleton:test', 'persistent-value');

        const client2 = getRedisClient();
        const value = await client2.get('singleton:test');
        expect(value).toBe('persistent-value');
    });
});