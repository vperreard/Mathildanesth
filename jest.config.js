const nextJest = require('next/jest');

// Fonction helper pour configurer Next.js avec Jest
const createJestConfig = nextJest({
    // Le chemin vers l'app Next.js
    dir: './',
});

// Ajouter des options de configuration Jest personnalisées
const customJestConfig = {
    rootDir: '.',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jsdom',
    setupFiles: ['<rootDir>/jest.polyfills.js'], // Nouveau fichier pour les polyfills
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
        '^@/config/(.*)$': '<rootDir>/src/config/$1',
        '^@/context/(.*)$': '<rootDir>/src/context/$1',
        '^@/middleware/(.*)$': '<rootDir>/src/middleware/$1',
        '^@/core/(.*)$': '<rootDir>/src/core/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    transform: {
        '^.+\\.(js|jsx)$': ['babel-jest', { presets: ['next/babel'] }],
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: 'tsconfig.jest.json',
        }],
    },
    transformIgnorePatterns: [
        // Indiquer à Jest de ne pas ignorer les node_modules lors de la transformation
        // Cela est nécessaire pour les modules ESM qui ne fournissent pas de build CommonJS
        '/node_modules/(?!(msw|@mswjs\\/interceptors|uuid|react-day-picker|date-fns|@radix-ui|@fullcalendar|react-beautiful-dnd)/)',
    ],
    testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/.next/',
        '<rootDir>/tests/e2e/',
        '<rootDir>/cypress/',
        '<rootDir>/src/modules/leaves/permissions/__tests__/__mocks__/'
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.stories.{js,jsx,ts,tsx}',
        '!src/tests/**/*',
        '!src/pages/_app.tsx',
        '!src/pages/_document.tsx',
    ],
    // La durée maximale d'exécution d'un test avant qu'il soit considéré comme un échec
    testTimeout: 30000,
    // Options pour les tests qui généralement devraient passer - si un test échoue, il faut l'investiguer
    passWithNoTests: true,
    // Limiter le nombre de workers pour éviter les problèmes avec les ressources limitées
    maxWorkers: 4,
};

// createJestConfig est exporté dans ce fichier pour que nous puissions l'utiliser dans d'autres fichiers de configuration
module.exports = createJestConfig(customJestConfig); 