// jest.config.js - Configuration Jest stabilisée pour production
module.exports = {
    rootDir: '.',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    
    moduleNameMapper: {
        // Path mapping pour @ alias - ordre important !
        '^@/test-utils/(.*)$': '<rootDir>/src/test-utils/$1',
        '^@/components/(.*)$': '<rootDir>/src/components/$1',
        '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
        '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
        '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
        '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
        '^@/types/(.*)$': '<rootDir>/src/types/$1',
        '^@/modules/(.*)$': '<rootDir>/src/modules/$1',
        '^@/models/(.*)$': '<rootDir>/src/models/$1',
        '^@/services/(.*)$': '<rootDir>/src/services/$1',
        '^@/tests/(.*)$': '<rootDir>/src/tests/$1',
        '^@/app/(.*)$': '<rootDir>/src/app/$1',
        '^@/context/(.*)$': '<rootDir>/src/context/$1',
        '^@/middleware/(.*)$': '<rootDir>/src/middleware/$1',
        '^@/config$': '<rootDir>/src/config/index.ts',
        '^@/config/(.*)$': '<rootDir>/src/config/$1',
        '^@/styles/(.*)$': '<rootDir>/src/styles/$1',
        '^@/public/(.*)$': '<rootDir>/public/$1',
        '^@/core/(.*)$': '<rootDir>/src/core/$1',
        
        // Mocks externes - CENTRALISÉS
        '^next/image$': '<rootDir>/__mocks__/nextImage.js',
        '^next/font/google$': '<rootDir>/__mocks__/nextFont.js',
        '^next-auth/next$': '<rootDir>/__mocks__/next-auth.js',
        '^next-auth$': '<rootDir>/__mocks__/next-auth.js',
        '^socket\\.io-client$': '<rootDir>/__mocks__/socket.io-client.js',
        '^@tanstack/react-query$': '<rootDir>/__mocks__/@tanstack/react-query.js',
        '^@vercel/analytics/react$': '<rootDir>/__mocks__/@vercel/analytics/react.js',
        '^jose$': '<rootDir>/__mocks__/jose.js',
        '^uuid$': '<rootDir>/__mocks__/uuid.js',
        
        // CSS et assets
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|svg)$': 'identity-obj-proxy',
        
        // MSW specific mappings
        '^msw/node$': require.resolve('msw/node'),
        '^@mswjs/interceptors/ClientRequest$': require.resolve('@mswjs/interceptors/ClientRequest'),
    },
    transform: {
        // TypeScript avec ts-jest - Configuration optimisée pour éviter punycode warnings
        '^.+\\.(ts|tsx)$': ['ts-jest', { 
            tsconfig: 'tsconfig.jest.json'
        }],
        // JavaScript/JSX avec babel-jest
        '^.+\\.(js|jsx)$': ['babel-jest', { 
            presets: [
                ['next/babel', { 'preset-react': { runtime: 'automatic' } }]
            ]
        }],
        // ES modules
        '^.+\\.mjs$': ['babel-jest', { 
            presets: [['@babel/preset-env', { targets: { node: 'current' } }]]
        }],
    },
    
    transformIgnorePatterns: [
        'node_modules/(?!(msw|@mswjs|uuid|react-day-picker|date-fns|@radix-ui|@fullcalendar|react-beautiful-dnd|lucide-react|@hookform|@tanstack|nanoid|jose|next-auth|@panva|preact|@vercel))'
    ],
    
    testPathIgnorePatterns: [
        '<rootDir>/.next/',
        '<rootDir>/node_modules/',
        '<rootDir>/cypress/',
        '<rootDir>/dist/',
        '<rootDir>/__mocks__/',
        '<rootDir>/tests/e2e/',
        '<rootDir>/coverage/',
        '<rootDir>/src/integration/',
        '<rootDir>/docs/',
        '<rootDir>/scripts/',
        '<rootDir>/quality-reports/',
    ],
    
    // Configuration optimisée pour performance bulletproof
    testTimeout: 5000,
    maxWorkers: 6,
    cache: true,
    verbose: false,
    silent: true,
    errorOnDeprecated: false,
    forceExit: true,
    detectOpenHandles: false,
    workerIdleMemoryLimit: '512MB',
    
    // Supprimer warnings spécifiques node - config fusionnée
    testEnvironmentOptions: {
        url: 'http://localhost',
        beforeParse(window) {
            // Supprimer les warnings punycode et autres dépréciations Node.js
            const originalWarn = console.warn;
            console.warn = (...args) => {
                if (args[0] && typeof args[0] === 'string' && 
                    (args[0].includes('punycode') || args[0].includes('DEP0040'))) {
                    return;
                }
                originalWarn.apply(console, args);
            };
        }
    },
    
    reporters: [
        'default',
        ['jest-html-reporters', {
            publicPath: './coverage',
            filename: 'jest_reporter.html',
            expand: false,
        }],
    ],
    // Configuration de coverage optimisée
    collectCoverage: process.env.CI ? true : false,
    coverageReporters: ['text-summary', 'lcov'],
    coverageDirectory: './coverage',
    
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        // Exclusions
        '!src/**/*.d.ts',
        '!src/**/*.stories.{ts,tsx}',
        '!src/**/__tests__/**',
        '!src/**/*.test.{ts,tsx}',
        '!src/**/*.spec.{ts,tsx}',
        '!src/tests/**',
        '!src/test-utils/**',
        '!src/**/node_modules/**',
        '!src/generated/**',
        '!src/migrations/**',
        '!src/scripts/**',
        '!src/app/**/page.tsx',
        '!src/app/**/layout.tsx',
        '!src/app/globals.css',
        '!src/styles/**',
    ],

    // Seuils de couverture réalistes - pas de fail sur les seuils pour stabiliser les tests
    coverageThreshold: {
        global: {
            branches: 60,
            functions: 65,
            lines: 70,
            statements: 70,
        }
    },

    // Performance et stabilité - OPTIMISÉ
    slowTestThreshold: 10,
    bail: false,
    clearMocks: true,
    restoreMocks: true,
    resetMocks: false,
    
    // Éviter les warnings et erreurs
    globals: {
        'process.env.NODE_OPTIONS': '--no-deprecation --no-warnings',
    },
}; 