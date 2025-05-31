// jest.config.node.js - Configuration temporaire Node.js pour diagnostic
module.exports = {
    rootDir: '.',
    testEnvironment: 'node',
    setupFiles: ['<rootDir>/jest.polyfills.js'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    
    // Optimisations performance
    testTimeout: 5000,
    maxWorkers: 2,
    cache: true,
    verbose: false,
    silent: false,
    
    // Test seulement les hooks simples pour diagnostic
    testMatch: [
        '**/src/hooks/__tests__/useAppearance.test.tsx',
        '**/src/hooks/__tests__/useDebounce.test.ts',
    ],
    
    // Path mapping
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^next/image$': '<rootDir>/__mocks__/nextImage.js',
        '^next/font/google$': '<rootDir>/__mocks__/nextFont.js',
        '^jose$': '<rootDir>/__mocks__/jose.js',
        '^uuid$': '<rootDir>/__mocks__/uuid.js',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|svg)$': 'identity-obj-proxy',
    },
    
    // Transformation
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { 
            tsconfig: 'tsconfig.jest.json',
            isolatedModules: false
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
    
    // Exclusions
    testPathIgnorePatterns: [
        '<rootDir>/.next/',
        '<rootDir>/node_modules/',
        '<rootDir>/cypress/',
        '<rootDir>/dist/',
    ],
    
    // Pas de coverage pour la vitesse
    collectCoverage: false,
    
    // Mocks et nettoyage
    clearMocks: true,
    restoreMocks: true,
    resetMocks: false,
};