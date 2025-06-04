#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSTIC DES TESTS\n');

// 1. Analyser les types d'erreurs
console.log('📊 Analyse des erreurs...\n');

try {
  const testOutput = execSync('npm test -- --json --outputFile=test-results.json 2>&1', { 
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10 // 10MB
  });
} catch (error) {
  // Les tests échouent, c'est attendu
}

// Lire les résultats
let results;
try {
  results = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
} catch (error) {
  console.error('❌ Impossible de lire les résultats des tests');
  process.exit(1);
}

// Analyser les erreurs
const errorPatterns = {
  importErrors: 0,
  typeErrors: 0,
  mockErrors: 0,
  syntaxErrors: 0,
  otherErrors: 0
};

const errorDetails = {
  importErrors: [],
  typeErrors: [],
  mockErrors: [],
  syntaxErrors: []
};

results.testResults.forEach(testFile => {
  if (testFile.status === 'failed') {
    testFile.assertionResults.forEach(assertion => {
      if (assertion.status === 'failed') {
        const errorMessage = assertion.failureMessages.join(' ');
        
        if (errorMessage.includes('Cannot find module') || errorMessage.includes('Could not locate module')) {
          errorPatterns.importErrors++;
          errorDetails.importErrors.push({
            file: testFile.name,
            error: errorMessage.substring(0, 200)
          });
        } else if (errorMessage.includes('TS') || errorMessage.includes('type')) {
          errorPatterns.typeErrors++;
          errorDetails.typeErrors.push({
            file: testFile.name,
            error: errorMessage.substring(0, 200)
          });
        } else if (errorMessage.includes('mock') || errorMessage.includes('Mock')) {
          errorPatterns.mockErrors++;
          errorDetails.mockErrors.push({
            file: testFile.name,
            error: errorMessage.substring(0, 200)
          });
        } else if (errorMessage.includes('SyntaxError') || errorMessage.includes('Unexpected')) {
          errorPatterns.syntaxErrors++;
          errorDetails.syntaxErrors.push({
            file: testFile.name,
            error: errorMessage.substring(0, 200)
          });
        } else {
          errorPatterns.otherErrors++;
        }
      }
    });
  }
});

// Afficher le rapport
console.log('📈 RÉSUMÉ DES ERREURS:');
console.log('------------------------');
console.log(`Import errors: ${errorPatterns.importErrors}`);
console.log(`Type errors: ${errorPatterns.typeErrors}`);
console.log(`Mock errors: ${errorPatterns.mockErrors}`);
console.log(`Syntax errors: ${errorPatterns.syntaxErrors}`);
console.log(`Other errors: ${errorPatterns.otherErrors}`);
console.log('------------------------');
console.log(`TOTAL: ${Object.values(errorPatterns).reduce((a, b) => a + b, 0)}\n`);

// Sauvegarder le rapport détaillé
const report = {
  summary: errorPatterns,
  details: errorDetails,
  timestamp: new Date().toISOString()
};

fs.writeFileSync('test-diagnostic-report.json', JSON.stringify(report, null, 2));
console.log('📄 Rapport détaillé sauvegardé dans: test-diagnostic-report.json\n');

// Suggestions de réparation
console.log('💡 RECOMMANDATIONS:');
if (errorPatterns.importErrors > 10) {
  console.log('1. ⚠️  Beaucoup d\'erreurs d\'import - vérifier jest.config.js et tsconfig.json');
}
if (errorPatterns.typeErrors > 10) {
  console.log('2. ⚠️  Beaucoup d\'erreurs de type - mettre à jour les types et interfaces');
}
if (errorPatterns.mockErrors > 10) {
  console.log('3. ⚠️  Beaucoup d\'erreurs de mock - créer un fichier de mocks centralisé');
}