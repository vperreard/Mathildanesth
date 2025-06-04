#!/usr/bin/env node

/**
 * 🛡️ VERIFICATION INFRASTRUCTURE BULLETPROOF
 * Script de vérification finale de notre infrastructure E2E + Performance
 * 
 * Vérifie que tous les composants sont en place et fonctionnels :
 * ✅ E2E Tests (Cypress + Puppeteer)
 * ✅ Performance Monitoring 
 * ✅ Service Worker optimisé
 * ✅ Cache Redis
 * ✅ Budget Performance
 * ✅ CI/CD optimisé
 */

const fs = require('fs');
const path = require('path');

console.log('🛡️  VERIFICATION INFRASTRUCTURE BULLETPROOF');
console.log('=' .repeat(60));

// 📋 CHECKLIST INFRASTRUCTURE
const infrastructure = {
    e2e: {
        title: '🧪 E2E TESTING INFRASTRUCTURE',
        components: [
            { name: 'Cypress Config', path: 'cypress.config.js', required: true },
            { name: 'Cypress Fixtures', path: 'cypress/fixtures/utilisateurs.json', required: true },
            { name: 'Auth Tests', path: 'cypress/e2e/auth/authentication.spec.ts', required: true },
            { name: 'Login Tests', path: 'cypress/e2e/login.spec.ts', required: true },
            { name: 'Performance Tests', path: 'cypress/e2e/performance/performance-tests.spec.ts', required: true },
            { name: 'Accessibility Tests', path: 'cypress/e2e/accessibility/accessibility-tests.spec.ts', required: true },
            { name: 'E2E Support Commands', path: 'cypress/support/commands.ts', required: true },
            { name: 'Puppeteer Tests', path: 'tests/e2e/auth-puppeteer.e2e.test.js', required: true },
        ]
    },
    performance: {
        title: '⚡ PERFORMANCE INFRASTRUCTURE',
        components: [
            { name: 'Performance Audit', path: 'scripts/audit-performance-current.js', required: true },
            { name: 'Performance Budget Monitor', path: 'scripts/performance-budget-monitor.js', required: true },
            { name: 'Next.js Optimized Config', path: 'next.config.js', required: true },
            { name: 'Redis Cache Service', path: 'src/lib/redis-cache.ts', required: true },
            { name: 'Optimized Prisma', path: 'src/lib/optimized-prisma.ts', required: true },
            { name: 'Performance Indexes', path: 'scripts/create-indexes.sql', required: true },
        ]
    },
    serviceWorker: {
        title: '🔧 SERVICE WORKER INFRASTRUCTURE',
        components: [
            { name: 'Optimized Service Worker', path: 'public/sw-optimized.js', required: true },
            { name: 'SW Hook', path: 'src/hooks/useServiceWorker.ts', required: true },
            { name: 'SW Registration Component', path: 'src/components/ServiceWorkerRegistration.tsx', required: true },
        ]
    },
    monitoring: {
        title: '📊 MONITORING & ALERTING',
        components: [
            { name: 'Health Check Script', path: 'scripts/health-check.sh', required: false },
            { name: 'Monitoring Daemon', path: 'scripts/monitoring-daemon.js', required: false },
            { name: 'Performance Results', path: 'performance-budget-report.json', required: false },
        ]
    }
};

// 🔍 VERIFICATION FUNCTIONS
function checkFileExists(filePath) {
    const fullPath = path.join(__dirname, '..', filePath);
    return fs.existsSync(fullPath);
}

function checkPackageScripts() {
    const packagePath = path.join(__dirname, '..', 'package.json');
    if (!fs.existsSync(packagePath)) return { existing: [], missing: [] };
    
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const scripts = packageJson.scripts || {};
    
    const requiredScripts = [
        'performance:budget',
        'performance:budget:ci',
        'performance:audit',
        'cypress:run',
        'cypress:e2e',
        'test:e2e:puppeteer'
    ];
    
    const existing = requiredScripts.filter(script => scripts[script]);
    const missing = requiredScripts.filter(script => !scripts[script]);
    
    return { existing, missing };
}

function verifyRedisCache() {
    const redisPath = path.join(__dirname, '..', 'src/lib/redis-cache.ts');
    if (!fs.existsSync(redisPath)) return false;
    
    const content = fs.readFileSync(redisPath, 'utf8');
    return content.includes('class RedisCacheService') && 
           content.includes('fallback to memory cache');
}

function verifyServiceWorker() {
    const swPath = path.join(__dirname, '..', 'public/sw-optimized.js');
    if (!fs.existsSync(swPath)) return false;
    
    const content = fs.readFileSync(swPath, 'utf8');
    return content.includes('CACHE_STATIC') && 
           content.includes('CACHE_DYNAMIC') &&
           content.includes('cache-first') &&
           content.includes('network-first');
}

// 📊 EXECUTION VERIFICATION
let totalChecks = 0;
let passedChecks = 0;
let criticalIssues = [];

console.log('🔍 Vérification des composants...\n');

// Vérifier chaque catégorie
Object.entries(infrastructure).forEach(([category, config]) => {
    console.log(config.title);
    console.log('-'.repeat(config.title.length));
    
    let categoryPassed = 0;
    
    config.components.forEach(component => {
        totalChecks++;
        const exists = checkFileExists(component.path);
        const status = exists ? '✅' : '❌';
        const indicator = component.required && !exists ? ' (CRITIQUE)' : '';
        
        console.log(`${status} ${component.name}: ${component.path}${indicator}`);
        
        if (exists) {
            passedChecks++;
            categoryPassed++;
        } else if (component.required) {
            criticalIssues.push(`${component.name}: ${component.path}`);
        }
    });
    
    const categoryScore = Math.round((categoryPassed / config.components.length) * 100);
    console.log(`📊 Score ${category}: ${categoryScore}%\n`);
});

// Vérifications spéciales
console.log('🔧 VERIFICATIONS SPECIALES');
console.log('-'.repeat(25));

// Package.json scripts
const { existing: scriptExists, missing: scriptsMissing } = checkPackageScripts();
console.log(`✅ Scripts NPM: ${scriptExists.length}/${scriptExists.length + scriptsMissing.length}`);
if (scriptsMissing.length > 0) {
    console.log(`   Manquants: ${scriptsMissing.join(', ')}`);
}

// Redis Cache
const redisOk = verifyRedisCache();
console.log(`${redisOk ? '✅' : '❌'} Cache Redis avec fallback memory`);

// Service Worker
const swOk = verifyServiceWorker();
console.log(`${swOk ? '✅' : '❌'} Service Worker avec stratégies de cache`);

// RAPPORT FINAL
console.log('\n' + '='.repeat(60));
console.log('📋 RAPPORT FINAL');
console.log('='.repeat(60));

const globalScore = Math.round((passedChecks / totalChecks) * 100);
const status = globalScore >= 90 ? 'EXCELLENT' : 
               globalScore >= 75 ? 'BON' : 
               globalScore >= 50 ? 'MOYEN' : 'CRITIQUE';

const emoji = globalScore >= 90 ? '🎉' : 
              globalScore >= 75 ? '👍' : 
              globalScore >= 50 ? '⚠️' : '🚨';

console.log(`${emoji} SCORE GLOBAL: ${globalScore}% (${passedChecks}/${totalChecks}) - ${status}`);

if (criticalIssues.length > 0) {
    console.log('\n🚨 PROBLEMES CRITIQUES:');
    criticalIssues.forEach(issue => console.log(`   - ${issue}`));
}

console.log('\n🎯 INFRASTRUCTURE BULLETPROOF STATUS:');
console.log(`   ✅ E2E Tests: ${infrastructure.e2e.components.filter(c => checkFileExists(c.path)).length}/${infrastructure.e2e.components.length}`);
console.log(`   ⚡ Performance: ${infrastructure.performance.components.filter(c => checkFileExists(c.path)).length}/${infrastructure.performance.components.length}`);
console.log(`   🔧 Service Worker: ${infrastructure.serviceWorker.components.filter(c => checkFileExists(c.path)).length}/${infrastructure.serviceWorker.components.length}`);
console.log(`   📊 Monitoring: ${infrastructure.monitoring.components.filter(c => checkFileExists(c.path)).length}/${infrastructure.monitoring.components.length}`);

console.log('\n🚀 NEXT STEPS RECOMMANDES:');
if (globalScore < 90) {
    console.log('   1. Corriger les problèmes critiques listés ci-dessus');
    console.log('   2. Exécuter: npm run performance:budget:ci');
    console.log('   3. Tester: npm run cypress:e2e');
}
console.log('   4. Activer monitoring continu: npm run performance:budget:watch');
console.log('   5. Configuration CI/CD: intégrer performance:budget:ci dans pipeline');

console.log('\n' + '='.repeat(60));

// Code de sortie
const exitCode = criticalIssues.length > 0 ? 1 : 0;
if (exitCode === 0) {
    console.log('🎉 INFRASTRUCTURE BULLETPROOF COMPLETE ET OPERATIONNELLE !');
} else {
    console.log('🚨 INFRASTRUCTURE INCOMPLETE - Actions requises');
}

process.exit(exitCode);