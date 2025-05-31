/**
 * Tests pour Runtime Detector - Phase 2 Validation
 */

import {
    isServer,
    isBrowser,
    isEdgeRuntime,
    isTest,
    isDevelopment,
    isProduction,
    isNodeRuntime,
    canUseNodeAPIs,
    RUNTIME_FEATURES,
    isFeatureAvailable,
    ifRuntimeSupports,
    logRuntimeInfo,
    DYNAMIC_IMPORTS
} from '../runtime-detector';

// Mock console pour les tests de logging
const mockConsole = {
    log: jest.fn(),
    warn: jest.fn()
};

describe('Runtime Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    beforeEach(() => {
    jest.clearAllMocks();
        jest.clearAllMocks();
    });

    describe('Environment Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should detect test environment correctly', () => {
            expect(isTest).toBe(true);
            expect(process.env.NODE_ENV).toBe('test');
        });

        test('should detect server environment', () => {
            expect(isServer).toBe(true);
            expect(typeof window).toBe('undefined');
        });

        test('should detect non-browser environment', () => {
            expect(isBrowser).toBe(false);
        });

        test('should detect non-edge runtime in tests', () => {
            expect(isEdgeRuntime).toBe(false);
        });

        test('should detect Node runtime correctly', () => {
            expect(isNodeRuntime).toBe(true);
        });

        test('should restrict Node APIs in test environment', () => {
            // Dans les tests, canUseNodeAPIs devrait être false
            expect(canUseNodeAPIs).toBe(false);
        });
    });

    describe('Feature Availability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should correctly report Redis availability', () => {
            // Redis ne devrait pas être disponible dans les tests
            expect(isFeatureAvailable('redis')).toBe(false);
            expect(RUNTIME_FEATURES.redis).toBe(false);
        });

        test('should correctly report Prisma availability', () => {
            // Prisma devrait être disponible côté serveur
            expect(isFeatureAvailable('prisma')).toBe(true);
            expect(RUNTIME_FEATURES.prisma).toBe(true);
        });

        test('should correctly report Sequelize availability', () => {
            // Sequelize ne devrait pas être disponible dans les tests
            expect(isFeatureAvailable('sequelize')).toBe(false);
            expect(RUNTIME_FEATURES.sequelize).toBe(false);
        });

        test('should correctly report browser-only features', () => {
            expect(isFeatureAvailable('sessionStorage')).toBe(false);
            expect(isFeatureAvailable('localStorage')).toBe(false);
            expect(RUNTIME_FEATURES.sessionStorage).toBe(false);
            expect(RUNTIME_FEATURES.localStorage).toBe(false);
        });

        test('should correctly report server features', () => {
            expect(isFeatureAvailable('webSocket')).toBe(true);
            expect(RUNTIME_FEATURES.webSocket).toBe(true);
        });

        test('should handle invalid feature names', () => {
            // @ts-ignore - Test avec une clé invalide
            expect(isFeatureAvailable('invalidFeature')).toBe(undefined);
        });
    });

    describe('Conditional Execution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should execute function when feature is available', () => {
            const mockFn = jest.fn(() => 'success');
            const result = ifRuntimeSupports('prisma', mockFn, 'fallback');
            
            expect(mockFn).toHaveBeenCalled();
            expect(result).toBe('success');
        });

        test('should return fallback when feature is unavailable', () => {
            const mockFn = jest.fn(() => 'success');
            const result = ifRuntimeSupports('redis', mockFn, 'fallback');
            
            expect(mockFn).not.toHaveBeenCalled();
            expect(result).toBe('fallback');
        });

        test('should return undefined when no fallback provided', () => {
            const mockFn = jest.fn(() => 'success');
            const result = ifRuntimeSupports('redis', mockFn);
            
            expect(mockFn).not.toHaveBeenCalled();
            expect(result).toBeUndefined();
        });

        test('should handle function errors gracefully', () => {
            const originalWarn = console.warn;
            console.warn = mockConsole.warn;

            const errorFn = jest.fn(() => {
                throw new Error('Test error');
            });
            
            const result = ifRuntimeSupports('prisma', errorFn, 'fallback');
            
            expect(mockConsole.warn).toHaveBeenCalledWith(
                expect.stringContaining('Runtime feature prisma failed:'),
                expect.any(Error)
            );
            expect(result).toBe('fallback');

            console.warn = originalWarn;
        });
    });

    describe('Runtime Logging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should log runtime info in development', () => {
            const originalEnv = process.env.NODE_ENV;
            const originalLog = console.log;
            console.log = mockConsole.log;

            // Simuler l'environnement de développement
            process.env.NODE_ENV = 'development';

            logRuntimeInfo();

            expect(mockConsole.log).toHaveBeenCalledWith(
                '🔧 Runtime Detection:',
                expect.objectContaining({
                    isServer: expect.any(Boolean),
                    isBrowser: expect.any(Boolean),
                    isEdgeRuntime: expect.any(Boolean),
                    isTest: expect.any(Boolean),
                    isDevelopment: expect.any(Boolean),
                    isProduction: expect.any(Boolean),
                    isNodeRuntime: expect.any(Boolean),
                    canUseNodeAPIs: expect.any(Boolean),
                    features: expect.any(Object)
                })
            );

            process.env.NODE_ENV = originalEnv;
            console.log = originalLog;
        });

        test('should not log in production', () => {
            const originalEnv = process.env.NODE_ENV;
            const originalLog = console.log;
            console.log = mockConsole.log;

            process.env.NODE_ENV = 'production';

            logRuntimeInfo();

            expect(mockConsole.log).not.toHaveBeenCalled();

            process.env.NODE_ENV = originalEnv;
            console.log = originalLog;
        });
    });

    describe('Dynamic Imports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should return null for Redis in test environment', async () => {
            const redisImport = await DYNAMIC_IMPORTS.redis();
            expect(redisImport).toBeNull();
        });

        test('should return null for Sequelize in test environment', async () => {
            const sequelizeImport = await DYNAMIC_IMPORTS.sequelize();
            expect(sequelizeImport).toBeNull();
        });

        test('should handle dynamic import configuration', () => {
            expect(typeof DYNAMIC_IMPORTS.redis).toBe('function');
            expect(typeof DYNAMIC_IMPORTS.sequelize).toBe('function');
        });
    });

    describe('Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should handle missing globalThis gracefully', () => {
            // Dans les tests, globalThis peut ne pas être défini
            // On teste juste que l'état actuel est cohérent
            expect(isEdgeRuntime).toBe(false);
        });

        test('should handle undefined NODE_ENV', () => {
            const originalEnv = process.env.NODE_ENV;
            delete process.env.NODE_ENV;

            // Les valeurs devraient être cohérentes même sans NODE_ENV
            expect(typeof isTest).toBe('boolean');
            expect(typeof isDevelopment).toBe('boolean');
            expect(typeof isProduction).toBe('boolean');

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('Consistency Checks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should have consistent server/browser detection', () => {
            expect(isServer).toBe(!isBrowser);
        });

        test('should have consistent runtime detection', () => {
            if (isEdgeRuntime) {
                expect(isServer).toBe(true);
                expect(isNodeRuntime).toBe(false);
            }
            
            if (isNodeRuntime) {
                expect(isServer).toBe(true);
                expect(isEdgeRuntime).toBe(false);
            }
        });

        test('should have consistent feature availability', () => {
            // Redis nécessite Node APIs
            if (RUNTIME_FEATURES.redis) {
                expect(canUseNodeAPIs).toBe(true);
                expect(isEdgeRuntime).toBe(false);
            }

            // Sequelize nécessite Node APIs
            if (RUNTIME_FEATURES.sequelize) {
                expect(canUseNodeAPIs).toBe(true);
            }

            // Les fonctionnalités browser ne sont disponibles que côté client
            if (RUNTIME_FEATURES.localStorage || RUNTIME_FEATURES.sessionStorage) {
                expect(isBrowser).toBe(true);
            }
        });
    });
});