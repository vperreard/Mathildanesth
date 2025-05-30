module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.minimal.js'],
  testTimeout: 30000,
  maxWorkers: 1,
  
  // Seulement les tests planning
  testMatch: [
    '**/src/services/__tests__/planningService.test.ts',
    '**/src/services/__tests__/planningGenerator.test.ts', 
    '**/src/services/__tests__/planningRulesValidation.test.ts',
    '**/src/services/__tests__/planningSimulator.test.ts'
  ],
  
  // Résolution des modules
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Transformer TypeScript
  preset: 'ts-jest',
  
  // Ignorer les dépendances problématiques
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/cypress/'
  ],
  
  // Mode silencieux
  silent: true,
  verbose: false
};