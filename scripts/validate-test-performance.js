#!/usr/bin/env node
/**
 * Script de validation continue des performances de tests
 * Objectif: Maintenir les tests sous 30 secondes
 */

const { execSync } = require('child_process');
const fs = require('fs');

const PERFORMANCE_THRESHOLDS = {
    totalTime: 30000, // 30 secondes max
    slowTestThreshold: 5000, // 5 secondes par test
    maxFailures: 0, // Tolérance zéro pour les échecs
    minCoverage: 70 // Couverture minimale
};

const COLORS = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function runTests() {
    const startTime = Date.now();
    
    try {
        log('🧪 Exécution des tests avec monitoring de performance...', 'blue');
        
        // Exécuter les tests avec configuration bulletproof
        const result = execSync('jest --config jest.config.bulletproof.js --passWithNoTests', {
            encoding: 'utf8',
            timeout: PERFORMANCE_THRESHOLDS.totalTime + 5000 // Buffer de 5s
        });
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        return {
            success: true,
            totalTime,
            output: result
        };
        
    } catch (error) {
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        return {
            success: false,
            totalTime,
            error: error.message,
            output: error.stdout || ''
        };
    }
}

function analyzeResults(testResult) {
    const { success, totalTime, output, error } = testResult;
    
    log('\n📊 Analyse des résultats de performance:', 'blue');
    
    // Temps total
    const timeStatus = totalTime <= PERFORMANCE_THRESHOLDS.totalTime ? 'green' : 'red';
    log(`⏱️  Temps total: ${(totalTime / 1000).toFixed(2)}s (seuil: ${PERFORMANCE_THRESHOLDS.totalTime / 1000}s)`, timeStatus);
    
    // Succès des tests
    const successStatus = success ? 'green' : 'red';
    log(`✅ Statut: ${success ? 'RÉUSSI' : 'ÉCHEC'}`, successStatus);
    
    // Analyse de l'output
    if (output) {
        const lines = output.split('\n');
        
        // Extraire les statistiques Jest
        const testStats = lines.find(line => line.includes('Tests:'));
        if (testStats) {
            log(`📋 ${testStats.trim()}`, success ? 'green' : 'red');
        }
        
        // Rechercher les tests lents
        const slowTests = lines.filter(line => 
            line.includes('ms') && 
            parseInt(line.match(/(\d+)ms/)?.[1] || 0) > PERFORMANCE_THRESHOLDS.slowTestThreshold
        );
        
        if (slowTests.length > 0) {
            log('⚠️  Tests lents détectés:', 'yellow');
            slowTests.forEach(test => log(`   ${test.trim()}`, 'yellow'));
        }
    }
    
    if (error) {
        log(`❌ Erreur: ${error}`, 'red');
    }
    
    return {
        passed: success && totalTime <= PERFORMANCE_THRESHOLDS.totalTime,
        totalTime,
        success
    };
}

function generateReport(results) {
    const report = {
        timestamp: new Date().toISOString(),
        performance: {
            totalTime: results.totalTime,
            passed: results.passed,
            threshold: PERFORMANCE_THRESHOLDS.totalTime
        },
        tests: {
            success: results.success
        }
    };
    
    // Sauvegarder le rapport
    const reportPath = './test-performance-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    log(`\n📄 Rapport sauvegardé: ${reportPath}`, 'blue');
    
    return report;
}

function main() {
    log('🚀 Validation continue des performances de tests', 'blue');
    log('════════════════════════════════════════════════', 'blue');
    
    const testResult = runTests();
    const analysis = analyzeResults(testResult);
    const report = generateReport(analysis);
    
    log('\n🎯 Résumé final:', 'blue');
    
    if (analysis.passed) {
        log('✅ VALIDATION RÉUSSIE - Tests bulletproof maintenus!', 'green');
        log(`   Temps: ${(analysis.totalTime / 1000).toFixed(2)}s / ${PERFORMANCE_THRESHOLDS.totalTime / 1000}s`, 'green');
    } else {
        log('❌ VALIDATION ÉCHOUÉE', 'red');
        
        if (!analysis.success) {
            log('   - Tests en échec détectés', 'red');
        }
        
        if (analysis.totalTime > PERFORMANCE_THRESHOLDS.totalTime) {
            log(`   - Dépassement de temps: ${(analysis.totalTime / 1000).toFixed(2)}s / ${PERFORMANCE_THRESHOLDS.totalTime / 1000}s`, 'red');
        }
        
        log('\n🔧 Actions recommandées:', 'yellow');
        log('   1. Identifier les tests lents avec npm test -- --verbose', 'yellow');
        log('   2. Optimiser les mocks et setup', 'yellow');
        log('   3. Paralléliser les tests si nécessaire', 'yellow');
        log('   4. Vérifier les fuites mémoire et handles ouverts', 'yellow');
    }
    
    // Exit code pour CI/CD
    process.exit(analysis.passed ? 0 : 1);
}

if (require.main === module) {
    main();
}

module.exports = { runTests, analyzeResults, generateReport };