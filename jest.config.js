// jest.config.js
// const nextJest = require('next/jest'); // Supprimer cette ligne

// const createJestConfig = nextJest({ // Supprimer cette ligne
// dir: './', // Supprimer cette ligne
// }); // Supprimer cette ligne

// Notre config personnalisée de base
module.exports = {
    rootDir: '.',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jsdom',
    setupFiles: ['<rootDir>/jest.polyfills.js'],
    moduleNameMapper: {
        '^msw/node$': require.resolve('msw/node'),
        '^@mswjs/interceptors/ClientRequest$': require.resolve('@mswjs/interceptors/ClientRequest'),
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
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        'next/image': '<rootDir>/__mocks__/nextImage.js',
        'next/font/google': '<rootDir>/__mocks__/nextFont.js',
    },
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
        '^.+\\.(js|jsx|mjs)$': ['babel-jest', { presets: [['next/babel', { 'preset-react': { runtime: 'automatic' } }]] }],
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(msw|@mswjs\\/interceptors|uuid|react-day-picker|date-fns|@radix-ui|@fullcalendar|react-beautiful-dnd))/',
    ],
    testPathIgnorePatterns: [
        '<rootDir>/.next/',
        '<rootDir>/node_modules/',
        '<rootDir>/cypress/',
        '__mocks__'
    ],
    testTimeout: 30000,
    reporters: [
        'default',
        ['jest-html-reporters', {
            publicPath: './coverage',
            filename: 'jest_reporter.html',
            expand: true,
        }],
    ],
    collectCoverage: true,
    coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
    coverageDirectory: './coverage',

    // Configuration avancée de la couverture
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.stories.{ts,tsx}',
        '!src/**/__tests__/**',
        '!src/**/*.test.{ts,tsx}',
        '!src/**/*.spec.{ts,tsx}',
        '!src/tests/**',
        '!src/**/node_modules/**',
        '!src/generated/**',
        '!src/migrations/**',
        '!src/scripts/**',
    ],

    // Seuils de couverture globaux et par module
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 75,
            statements: 75,
        },
        // Module leaves - Objectif 85%
        'src/modules/conges/services/leaveService.ts': {
            branches: 85,
            functions: 85,
            lines: 85,
            statements: 85,
        },
        'src/modules/conges/services/leaveCalculator.ts': {
            branches: 85,
            functions: 85,
            lines: 85,
            statements: 85,
        },
        'src/modules/conges/services/quotaService.ts': {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
        // Module auth - Objectif 80%
        'src/lib/auth/**/*.ts': {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
        'src/middleware/auth.ts': {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
        'src/hooks/**/useAuth*.ts': {
            branches: 75,
            functions: 75,
            lines: 75,
            statements: 75,
        },
        // Module bloc-operatoire - Objectif 70%
        'src/modules/planning/bloc-operatoire/services/blocPlanningService.ts': {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
        'src/modules/planning/bloc-operatoire/components/**/*.tsx': {
            branches: 65,
            functions: 65,
            lines: 65,
            statements: 65,
        },
    },

    // Surveillance des performances des tests
    slowTestThreshold: 5,
    verbose: true,
    errorOnDeprecated: true,
};

// module.exports = async () => { // Supprimer cette section
//   const jestNextConfig = await createJestConfig(customJestConfig)();
//   jestNextConfig.transform = {
//     ...jestNextConfig.transform,
//     '^.+\\\.mjs$': ['babel-jest', { presets: [['@babel/preset-env', { targets: { node: 'current' } }]] }],
//   };
//   return jestNextConfig;
// }; // Supprimer cette section

// Le but est que customJestConfig devienne directement module.exports = { ... } 