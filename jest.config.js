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
        // Ignorer les répertoires __mocks__ pour éviter qu'ils ne soient exécutés comme des suites de tests
        // Simplification du pattern pour __mocks__
        '__mocks__' 
    ],
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
    coverageThreshold: {
        global: {
            branches: 15,
            functions: 15,
            lines: 15,
            statements: 15,
        },
    },
    // Indicates whether the coverage information should be collected while executing the test
    // collectCoverage: true,

    // An array of glob patterns indicating a set of files for which coverage information should be collected
    // collectCoverageFrom: undefined,

    // The directory where Jest should output its coverage files
    // coverageDirectory: undefined,
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