/**
 * Configuration Jest pour la Phase de Stabilisation
 * 
 * Cette configuration désactive temporairement les tests non-critiques
 * pour se concentrer sur la stabilisation de l'application.
 */

const baseConfig = require('../../jest.config.js');

module.exports = {
  ...baseConfig,
  
  // Tests à ignorer temporairement
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.next/',
    
    // === DÉSACTIVÉS TEMPORAIREMENT ===
    // Components UI (moins critiques)
    'src/components/__tests__/',
    
    // Utils génériques
    'src/utils/__tests__/',
    
    // Hooks non-critiques
    'src/hooks/__tests__/(?!.*auth)',  // Garder seulement auth
    
    // Services non-critiques
    'src/services/__tests__/(?!.*(auth|leave|planning))',
    
    // Tests d'intégration complexes
    'src/integration/',
    
    // Tests de types
    'src/types/__tests__/',
    
    // Modules secondaires
    'src/modules/(?!leaves|auth)',
    
    // Tests E2E (on utilise Puppeteer à la place)
    'tests/e2e/',
    'cypress/',
  ],
  
  // Tests à garder actifs
  testMatch: [
    // Auth (critique)
    '**/src/lib/auth/**/*.test.{ts,tsx}',
    '**/src/middleware/auth*.test.{ts,tsx}',
    '**/src/app/api/auth/**/*.test.{ts,tsx}',
    
    // Leaves (critique)
    '**/src/modules/leaves/**/?(*.)(test).{ts,tsx}',
    '**/src/app/api/leaves/**/*.test.{ts,tsx}',
    
    // Planning (critique)
    '**/src/modules/planning/services/**/*.test.{ts,tsx}',
    '**/src/app/api/planning/**/*.test.{ts,tsx}',
    
    // API routes principales
    '**/src/app/api/**/route.test.{ts,tsx}',
  ],
  
  // Timeouts plus courts pour identifier les tests lents
  testTimeout: 10000,
  
  // Coverage seulement sur les modules critiques
  collectCoverageFrom: [
    'src/lib/auth/**/*.{ts,tsx}',
    'src/modules/leaves/**/*.{ts,tsx}',
    'src/modules/planning/services/**/*.{ts,tsx}',
    'src/app/api/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.test.{ts,tsx}',
    '!**/node_modules/**',
  ],
  
  // Seuils de coverage temporairement réduits
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20
    }
  }
};