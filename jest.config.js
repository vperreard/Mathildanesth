export default {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: [
        '<rootDir>/src/tests/setup/setup.ts',
        '<rootDir>/jest.setup.js'
    ],
    transform: {
        '^.+\\.(ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/.next/',
        '<rootDir>/dist/',
    ],
    coveragePathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/.next/',
        '<rootDir>/dist/',
        '<rootDir>/src/tests/',
        '<rootDir>/src/mocks/',
    ],
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/**/*.d.ts',
        '!src/pages/_app.tsx',
        '!src/pages/_document.tsx',
    ],
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
    verbose: true,
} 