/**
 * Jest setup spécifique pour l'environnement Node.js
 * Utilisé pour les tests services qui n'ont pas besoin du DOM
 */

// Polyfills pour Node.js seulement (pas de window/DOM)
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Mocks pour les modules qui nécessitent des globals
global.fetch = jest.fn();

// Mock console methods pour les tests silencieux si nécessaire
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  // Garder les logs pour debug mais on peut les désactiver si besoin
  log: originalConsole.log,
  warn: originalConsole.warn,
  error: originalConsole.error,
  info: originalConsole.info,
  debug: originalConsole.debug,
};

// Setup des variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-services';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock pour éviter les erreurs de modules non disponibles en Node
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

// Note: Ne pas mock les modules qui ne sont pas installés
// Les mocks seront créés dans chaque test individuellement si nécessaire

console.log('🔧 Jest Node.js setup loaded for service tests');