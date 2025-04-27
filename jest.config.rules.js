import baseConfig from './jest.config.js';

export default {
    // Étendre la configuration de base
    ...baseConfig,

    // Cibler spécifiquement les tests de règles
    testMatch: ['**/tests/unit/modules/rules/**/*.test.ts'],

    // Utiliser le coverage pour analyser la couverture des tests
    collectCoverage: true,
    collectCoverageFrom: [
        '<rootDir>/src/modules/rules/services/ruleCache.ts',
        '<rootDir>/src/modules/rules/engine/rule-engine.ts'
    ],
    coverageThreshold: {
        global: {
            branches: 65,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },

    // Configurer l'environnement des tests
    testEnvironment: 'jsdom',

    // Délai supérieur pour les tests de performance
    testTimeout: 10000,

    // Reporter détaillé pour les résultats des tests
    verbose: true
}; 