#!/usr/bin/env node
import { execSync } from 'child_process';

// Modules à tester
const CRITICAL_MODULES = [
  { name: 'auth', pattern: 'auth' },
  { name: 'leaves', pattern: 'leaves.*test' },
  { name: 'planning', pattern: 'planning' }
];

// Fonction pour extraire les statistiques des résultats de test
function parseTestResults(output: string): { suites: any, tests: any } {
  const suitesMatch = output.match(/Test Suites:\s*(\d+)\s*failed,\s*(\d+)\s*(?:skipped,\s*)?(\d+)\s*passed,\s*(\d+)\s*total/);
  const testsMatch = output.match(/Tests:\s*(\d+)\s*failed,\s*(\d+)\s*(?:skipped,\s*)?(\d+)\s*passed,\s*(\d+)\s*total/);
  
  return {
    suites: suitesMatch ? {
      failed: parseInt(suitesMatch[1]),
      passed: parseInt(suitesMatch[3]),
      total: parseInt(suitesMatch[4])
    } : null,
    tests: testsMatch ? {
      failed: parseInt(testsMatch[1]),
      passed: parseInt(testsMatch[3]),
      total: parseInt(testsMatch[4])
    } : null
  };
}

// Fonction pour calculer le pourcentage de succès
function calculateSuccessRate(passed: number, total: number): number {
  return Math.round((passed / total) * 100);
}

// Fonction principale
async function main() {
  console.log('📊 Rapport de Synthèse - État des Tests après Stabilisation');
  console.log('='.repeat(70));
  console.log();

  const results = [];

  for (const module of CRITICAL_MODULES) {
    console.log(`🔍 Test du module: ${module.name.toUpperCase()}`);
    
    try {
      const command = `npm test -- --no-coverage --testPathPattern="${module.pattern}" --passWithNoTests`;
      const output = execSync(command, { 
        encoding: 'utf8', 
        timeout: 60000, // 1 minute timeout
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const stats = parseTestResults(output);
      
      if (stats.tests && stats.suites) {
        const testSuccessRate = calculateSuccessRate(stats.tests.passed, stats.tests.total);
        const suiteSuccessRate = calculateSuccessRate(stats.suites.passed, stats.suites.total);
        
        results.push({
          module: module.name,
          tests: stats.tests,
          suites: stats.suites,
          testSuccessRate,
          suiteSuccessRate
        });
        
        console.log(`   Tests: ${stats.tests.passed}/${stats.tests.total} (${testSuccessRate}%)`);
        console.log(`   Suites: ${stats.suites.passed}/${stats.suites.total} (${suiteSuccessRate}%)`);
      } else {
        console.log(`   ❌ Impossible de parser les résultats`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erreur lors de l'exécution: ${error.message}`);
    }
    
    console.log();
  }

  // Synthèse globale
  console.log('📈 SYNTHÈSE GLOBALE');
  console.log('-'.repeat(50));
  
  let totalTests = 0;
  let totalTestsPassed = 0;
  let totalSuites = 0;
  let totalSuitesPassed = 0;
  
  results.forEach(result => {
    if (result.tests && result.suites) {
      totalTests += result.tests.total;
      totalTestsPassed += result.tests.passed;
      totalSuites += result.suites.total;
      totalSuitesPassed += result.suites.passed;
      
      console.log(`${result.module.padEnd(10)} | Tests: ${result.testSuccessRate}% | Suites: ${result.suiteSuccessRate}%`);
    }
  });
  
  if (totalTests > 0) {
    const globalTestSuccessRate = calculateSuccessRate(totalTestsPassed, totalTests);
    const globalSuiteSuccessRate = calculateSuccessRate(totalSuitesPassed, totalSuites);
    
    console.log('-'.repeat(50));
    console.log(`GLOBAL     | Tests: ${globalTestSuccessRate}% (${totalTestsPassed}/${totalTests}) | Suites: ${globalSuiteSuccessRate}% (${totalSuitesPassed}/${totalSuites})`);
  }
  
  console.log();
  console.log('🎯 RECOMMANDATIONS');
  console.log('-'.repeat(50));
  
  results.forEach(result => {
    if (result.testSuccessRate < 70) {
      console.log(`⚠️  ${result.module}: Nécessite attention (${result.testSuccessRate}% de succès)`);
    } else if (result.testSuccessRate < 90) {
      console.log(`🟡 ${result.module}: En bonne voie (${result.testSuccessRate}% de succès)`);
    } else {
      console.log(`✅ ${result.module}: Excellent (${result.testSuccessRate}% de succès)`);
    }
  });
  
  console.log();
  console.log('📝 Scripts de stabilisation créés:');
  console.log('  - scripts/fix-test-routes.ts');
  console.log('  - scripts/fix-test-imports.ts');
  console.log('  - scripts/fix-test-mocks.ts');
  console.log('  - scripts/comprehensive-test-fix.ts');
  console.log('  - scripts/final-test-stabilization.ts');
  
  console.log('\n✨ Stabilisation en cours - Progrès significatifs réalisés!');
}

// Exécution
main().catch(console.error);