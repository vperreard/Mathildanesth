/**
 * Jest Configuration for Security Tests
 * Medical Application - Comprehensive Security Testing
 */

const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  
  // Override display name for security tests
  displayName: 'Security Tests',
  
  // Test patterns specifically for security tests
  testMatch: [
    '<rootDir>/src/**/*security*.test.{ts,tsx}',
    '<rootDir>/src/**/*injection*.test.{ts,tsx}',
    '<rootDir>/src/**/*xss*.test.{ts,tsx}',
    '<rootDir>/src/**/*auth*.security.test.{ts,tsx}',
    '<rootDir>/src/**/*authorization*.test.{ts,tsx}',
    '<rootDir>/src/tests/integration/security*.test.{ts,tsx}',
    '<rootDir>/src/services/__tests__/authService.comprehensive.test.ts'
  ],
  
  // Exclude non-security tests
  testPathIgnorePatterns: [
    ...baseConfig.testPathIgnorePatterns,
    '<rootDir>/cypress/',
    '<rootDir>/tests/e2e/'
  ],
  
  // Security-specific test environment setup
  setupFilesAfterEnv: [
    '<rootDir>/src/test-utils/setupTests.ts',
    '<rootDir>/jest.security.setup.js'
  ],
  
  // Enhanced coverage for security-critical files
  collectCoverageFrom: [
    'src/services/authService.{ts,tsx}',
    'src/lib/auth/**/*.{ts,tsx}',
    'src/middleware/**/*.{ts,tsx}',
    'src/lib/prisma*.{ts,tsx}',
    'src/lib/validation*.{ts,tsx}',
    'src/lib/security*.{ts,tsx}',
    'src/app/api/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/node_modules/**',
    '!src/**/__tests__/**',
    '!src/**/coverage/**'
  ],
  
  // Strict coverage thresholds for security components
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/services/authService.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/lib/auth/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/middleware/': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Security test specific reporters
  reporters: [
    'default'
  ],
  
  // Additional security test configuration
  testTimeout: 10000, // 10 seconds for security tests
  
  // Environment variables for security tests
  setupFiles: ['<rootDir>/jest.security.env.js'],
  
  // Security-specific module name mapping
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^@/security/(.*)$': '<rootDir>/src/lib/security/$1',
    '^@/tests/security/(.*)$': '<rootDir>/src/tests/security/$1'
  },
  
  // Transform configuration for security test files
  transform: {
    ...baseConfig.transform,
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
      isolatedModules: true
    }]
  },
  
  // Clear mocks between security tests for isolation
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Fail fast on security test failures
  bail: 0, // Don't bail - run all security tests
  
  // Verbose output for security test debugging
  verbose: true,
  
  // Additional Jest options for security testing
  errorOnDeprecated: true,
  
  // Custom test result processor for security analysis
  testResultsProcessor: '<rootDir>/scripts/security-test-processor.js'
};