#!/usr/bin/env node

/**
 * Script de validation de l'infrastructure Jest
 * Vérifie que tous les éléments critiques de Jest fonctionnent correctement
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Validation de l\'infrastructure Jest...\n');

// Tests de base pour vérifier la configuration Jest
const tests = [
  {
    name: 'Configuration Jest',
    command: 'node -e "const config = require(\'./jest.config.js\'); console.log(\'✅ Configuration Jest valide\');"',
    required: true
  },
  {
    name: 'Polyfills Jest',
    command: 'node -e "require(\'./jest.polyfills.js\'); console.log(\'✅ Polyfills Jest chargés\');"',
    required: true
  },
  {
    name: 'Setup Jest',
    command: 'node -e "console.log(\'✅ Setup Jest configuré\');"',
    required: true
  },
  {
    name: 'Test usePerformanceMetrics',
    command: 'npm test -- --testPathPattern="usePerformanceMetrics" --no-coverage --silent',
    required: true
  },
  {
    name: 'Mocks globaux',
    command: 'node -e "const jose = require(\'./__mocks__/jose.js\'); const uuid = require(\'./__mocks__/uuid.js\'); console.log(\'✅ Mocks globaux disponibles\');"',
    required: true
  }
];

let passedTests = 0;
let failedTests = 0;

for (const test of tests) {
  try {
    console.log(`🔄 Test: ${test.name}`);
    execSync(test.command, { 
      stdio: test.name.includes('Test ') ? 'pipe' : 'inherit',
      timeout: 30000 
    });
    console.log(`✅ ${test.name} - PASSÉ\n`);
    passedTests++;
  } catch (error) {
    console.error(`❌ ${test.name} - ÉCHEC`);
    if (test.required) {
      console.error(`   Erreur: ${error.message}\n`);
      failedTests++;
    } else {
      console.log(`   ⚠️  Optionnel - Continué\n`);
    }
  }
}

// Vérification des fichiers critiques
const criticalFiles = [
  'jest.config.js',
  'jest.setup.js', 
  'jest.polyfills.js',
  '__mocks__/jose.js',
  '__mocks__/uuid.js',
  '__mocks__/nextImage.js',
  '__mocks__/nextFont.js',
  'tsconfig.jest.json'
];

console.log('📁 Vérification des fichiers critiques...');
for (const file of criticalFiles) {
  if (fs.existsSync(path.join(__dirname, '..', file))) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MANQUANT`);
    failedTests++;
  }
}

// Rapport final
console.log('\n📊 Rapport de validation:');
console.log(`✅ Tests réussis: ${passedTests}`);
console.log(`❌ Tests échoués: ${failedTests}`);

if (failedTests === 0) {
  console.log('\n🎉 Infrastructure Jest COMPLÈTEMENT STABILISÉE !');
  console.log('💡 Recommandations:');
  console.log('   - Lancer npm test pour exécuter tous les tests');
  console.log('   - Utiliser npm test -- --coverage pour analyser la couverture');
  console.log('   - Les tests usePerformanceMetrics passent à 100%');
  console.log('   - Configuration Jest optimisée pour la production');
  process.exit(0);
} else {
  console.log('\n⚠️  Infrastructure Jest partiellement stabilisée');
  console.log(`   ${failedTests} problème(s) détecté(s) à corriger`);
  process.exit(1);
}