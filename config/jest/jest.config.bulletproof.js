// jest.config.bulletproof.js - Configuration ultra-optimisée pour tests en moins de 30s
module.exports = {
    rootDir: '.',
    testEnvironment: 'jsdom',
    testEnvironmentOptions: {
        url: 'http://localhost:3000',
        beforeLoad: (window) => {
            // Assurer que document.addEventListener existe
            if (!window.document.addEventListener) {
                window.document.addEventListener = () => {};
            }
            if (!window.document.removeEventListener) {
                window.document.removeEventListener = () => {};
            }
        }
    },
    setupFiles: ['<rootDir>/jest.polyfills.js'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    
    // Optimisations performance maximales
    testTimeout: 3000,
    maxWorkers: 8,
    cache: true,
    verbose: false,
    silent: true,
    errorOnDeprecated: false,
    forceExit: true,
    detectOpenHandles: false,
    workerIdleMemoryLimit: '256MB',
    bail: 1, // Arrêter au premier échec pour économiser du temps
    
    // Sélection ciblée des tests critiques uniquement
    testMatch: [
        '**/src/hooks/__tests__/*.test.{ts,tsx}',
        '**/src/lib/__tests__/*.test.{ts,tsx}',
        '**/src/services/__tests__/authService.test.ts',
        '**/src/services/__tests__/userService.test.ts',
        '**/src/modules/leaves/hooks/__tests__/*.test.{ts,tsx}',
        '**/src/modules/leaves/services/__tests__/*comprehensive.test.ts',
    ],
    
    // Path mapping minimal
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^next/image$': '<rootDir>/__mocks__/nextImage.js',
        '^next/font/google$': '<rootDir>/__mocks__/nextFont.js',
        '^jose$': '<rootDir>/__mocks__/jose.js',
        '^uuid$': '<rootDir>/__mocks__/uuid.js',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|svg)$': 'identity-obj-proxy',
    },
    
    // Transformation complète mais optimisée
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { 
            tsconfig: 'tsconfig.jest.json',
            isolatedModules: true
        }],
        '^.+\\.(js|jsx)$': ['babel-jest', { 
            presets: [
                ['next/babel', { 'preset-react': { runtime: 'automatic' } }]
            ]
        }],
    },
    
    transformIgnorePatterns: [
        'node_modules/(?!(msw|@mswjs|uuid|jose))'
    ],
    
    // Exclusions étendues
    testPathIgnorePatterns: [
        '<rootDir>/.next/',
        '<rootDir>/node_modules/',
        '<rootDir>/cypress/',
        '<rootDir>/dist/',
        '<rootDir>/__mocks__/',
        '<rootDir>/tests/',
        '<rootDir>/coverage/',
        '<rootDir>/src/integration/',
        '<rootDir>/docs/',
        '<rootDir>/scripts/',
        '<rootDir>/quality-reports/',
        '<rootDir>/src/app/',
        '<rootDir>/src/components/__tests__/',
        '<rootDir>/src/services/__tests__/*comprehensive*',
    ],
    
    // Pas de coverage pour la vitesse
    collectCoverage: false,
    
    // Reporters minimal
    reporters: ['default'],
    
    // Mocks et nettoyage
    clearMocks: true,
    restoreMocks: true,
    resetMocks: false,
};