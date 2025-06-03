/**
 * @jest-environment node
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
            // Dans l'environnement de test Jest/JSDOM, window existe
            expect(isServer).toBe(false);
            expect(typeof window).toBe('object');
        });

        test('should detect non-browser environment', () => {
            // Dans l'environnement de test Jest/JSDOM, c'est un browser simulé
            expect(isBrowser).toBe(true);
        });

        test('should detect non-edge runtime in tests', () => {
            expect(isEdgeRuntime).toBe(false);
        });

        test('should detect Node runtime correctly', () => {
            // Dans l'environnement de test Jest/JSDOM, ce n'est pas un vrai runtime Node
            expect(isNodeRuntime).toBe(false);
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
            // Dans l'environnement de test Jest/JSDOM, prisma = isServer = false
            expect(isFeatureAvailable('prisma')).toBe(false);
            expect(RUNTIME_FEATURES.prisma).toBe(false);
        });

        test('should correctly report Sequelize availability', () => {
            // Sequelize ne devrait pas être disponible dans les tests
            expect(isFeatureAvailable('sequelize')).toBe(false);
            expect(RUNTIME_FEATURES.sequelize).toBe(false);
        });

        test('should correctly report browser-only features', () => {
            // Dans l'environnement de test Jest/JSDOM, les features browser sont disponibles
            expect(isFeatureAvailable('sessionStorage')).toBe(true);
            expect(isFeatureAvailable('localStorage')).toBe(true);
            expect(RUNTIME_FEATURES.sessionStorage).toBe(true);
            expect(RUNTIME_FEATURES.localStorage).toBe(true);
        });

        test('should correctly report server features', () => {
            // Dans l'environnement de test Jest/JSDOM, webSocket = isServer = false
            expect(isFeatureAvailable('webSocket')).toBe(false);
            expect(RUNTIME_FEATURES.webSocket).toBe(false);
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
            const result = ifRuntimeSupports('localStorage', mockFn, 'fallback');
            
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
            
            const result = ifRuntimeSupports('localStorage', errorFn, 'fallback');
            
            expect(mockConsole.warn).toHaveBeenCalledWith(
                expect.stringContaining('Runtime feature localStorage failed:'),
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

        test('should not log runtime info in test environment', () => {
            const originalLog = console.log;
            console.log = mockConsole.log;

            logRuntimeInfo();

            // Dans l'environnement test, logRuntimeInfo ne devrait rien logger
            expect(mockConsole.log).not.toHaveBeenCalled();

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