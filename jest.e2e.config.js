/** @type {import('jest').Config} */
const config = {
    testEnvironment: 'node',
    testMatch: ['**/tests/e2e/**/*.e2e.test.js'],
    setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup.js'],
    globalSetup: '<rootDir>/tests/e2e/globalSetup.js',
    globalTeardown: '<rootDir>/tests/e2e/globalTeardown.js',
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    testTimeout: 60000, // 60 secondes pour les tests E2E
    maxWorkers: 1, // Tests E2E séquentiels pour éviter les conflits
    verbose: true,
    collectCoverage: false, // Pas de coverage pour les tests E2E

    // Configuration pour utiliser Puppeteer sans preset
    moduleFileExtensions: ['js', 'json'],
    globals: {
        'ts-jest': {
            useESM: false
        }
    }
};

module.exports = config; 