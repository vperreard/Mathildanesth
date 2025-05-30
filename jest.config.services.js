/**
 * Configuration Jest spécifique pour les tests services
 * Utilise l'environnement Node.js et un setup adapté
 */

const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  displayName: 'Services Tests',
  testMatch: [
    '<rootDir>/src/services/**/*.test.{ts,js}',
  ],
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.node.js'
  ],
  coverageDirectory: '<rootDir>/coverage/services',
  collectCoverageFrom: [
    'src/services/**/*.{ts,js}',
    '!src/services/**/*.test.{ts,js}',
    '!src/services/**/__tests__/**',
  ],
  // Désactiver les transformations qui posent problème avec Node
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@testing-library))'
  ],
  // Timeout plus long pour les services
  testTimeout: 10000,
  // Pas de cache pour éviter les conflits
  cache: false,
  // Verbeux pour debug
  verbose: true
};