export default {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: [
        '<rootDir>/src/tests/setup/setup.ts',
        '<rootDir>/jest.setup.js'
    ],
    transform: {
        '^.+\\.(t|j)s$': ['ts-jest', {
            tsconfig: 'tsconfig.jest.json'
        }],
        '^.+\\.(t|j)sx?$': ['ts-jest', {
            tsconfig: 'tsconfig.jest.json',
            babelConfig: true
        }],
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleDirectories: ['node_modules', '<rootDir>/src'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/.next/',
        '<rootDir>/dist/',
        '<rootDir>/cypress/',
    ],
    transformIgnorePatterns: [
        '/node_modules/',
        '<rootDir>/.next/',
        '<rootDir>/dist/'
    ],
    testMatch: [
        '**/__tests__/**/*.+(ts|tsx|js)',
        '**/?(*.)+(spec|test).+(ts|tsx|js)'
    ],
    verbose: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['json', 'lcov', 'text', 'clover'],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
        './src/services/blocPlanningService.ts': {
            branches: 50,
            functions: 60,
            lines: 60,
            statements: 60,
        },
        './src/hooks/useOperatingRoomData.ts': {
            branches: 70,
            functions: 80,
            lines: 80,
            statements: 80,
        },
        './src/hooks/useOperatingRoomPlanning.ts': {
            branches: 70,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
} 