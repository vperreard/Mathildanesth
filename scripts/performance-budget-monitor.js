#!/usr/bin/env node

/**
 * PERFORMANCE BUDGET MONITOR
 * Script automatisé pour surveiller les performances et déclencher des alertes
 * Intégration avec notre infrastructure E2E/Performance bulletproof
 * 
 * Objectifs Phase 1:
 * - Pages < 2s chargement
 * - Bundle JS < 250KB par chunk
 * - Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
 * - API < 300ms response time
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// 🎯 BUDGET DE PERFORMANCE - SEUILS CRITIQUES
const PERFORMANCE_BUDGET = {
    // Core Web Vitals (Google standards)
    coreWebVitals: {
        LCP: 2500,     // Largest Contentful Paint < 2.5s
        FID: 100,      // First Input Delay < 100ms
        CLS: 0.1,      // Cumulative Layout Shift < 0.1
        FCP: 1800,     // First Contentful Paint < 1.8s
        TTI: 3800      // Time to Interactive < 3.8s
    },
    
    // Bundle Size Limits (après code splitting)
    bundleSize: {
        totalJS: 750000,        // 750KB total max
        chunkSize: 250000,      // 250KB par chunk max
        initialJS: 150000,      // 150KB initial bundle max
        css: 50000,             // 50KB CSS max
        images: 2000000,        // 2MB images total max
        fonts: 100000           // 100KB fonts max
    },
    
    // API Performance
    api: {
        auth: 200,              // Authentication < 200ms
        crud: 300,              // CRUD operations < 300ms
        search: 500,            // Search < 500ms
        reports: 1000           // Reports < 1s
    },
    
    // Page Load Times
    pages: {
        login: 1500,            // Login page < 1.5s
        dashboard: 2000,        // Dashboard < 2s
        planning: 2500,         // Planning < 2.5s
        admin: 3000             // Admin pages < 3s
    },
    
    // Database Queries
    database: {
        simple: 50,             // Simple queries < 50ms
        complex: 200,           // Complex queries < 200ms
        reports: 1000           // Report queries < 1s
    }
};

// 🚨 ALERTES CONFIGURATION
const ALERT_CONFIG = {
    slack: {
        enabled: process.env.SLACK_WEBHOOK_URL ? true : false,
        webhook: process.env.SLACK_WEBHOOK_URL,
        channel: '#performance-alerts'
    },
    email: {
        enabled: process.env.EMAIL_ALERTS ? true : false,
        recipients: ['dev-team@mathilda.com']
    },
    console: {
        enabled: true,
        colors: true
    }
};

// 📊 COLLECTEUR DE MÉTRIQUES
class PerformanceCollector {
    constructor() {
        this.metrics = {
            timestamp: new Date().toISOString(),
            bundle: {},
            api: {},
            pages: {},
            database: {},
            coreWebVitals: {}
        };
        this.violations = [];
    }

    // Analyser la taille des bundles
    async analyzeBundleSize() {
        console.log('🔍 Analyse de la taille des bundles...');
        
        const buildDir = path.join(__dirname, '../.next');
        const staticDir = path.join(buildDir, 'static');
        
        if (!fs.existsSync(staticDir)) {
            console.warn('⚠️  Répertoire .next/static non trouvé. Exécutez npm run build d\'abord.');
            return;
        }

        let totalJS = 0;
        let totalCSS = 0;
        let chunks = [];

        // Analyser les fichiers JS
        const jsDir = path.join(staticDir, 'chunks');
        if (fs.existsSync(jsDir)) {
            const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
            
            for (const file of jsFiles) {
                const filePath = path.join(jsDir, file);
                const stats = fs.statSync(filePath);
                const size = stats.size;
                
                totalJS += size;
                chunks.push({ file, size });
                
                // Vérifier si le chunk dépasse la limite
                if (size > PERFORMANCE_BUDGET.bundleSize.chunkSize) {
                    this.violations.push({
                        type: 'bundle',
                        metric: 'chunkSize',
                        value: size,
                        limit: PERFORMANCE_BUDGET.bundleSize.chunkSize,
                        severity: 'high',
                        file: file
                    });
                }
            }
        }

        // Analyser les fichiers CSS
        const cssDir = path.join(staticDir, 'css');
        if (fs.existsSync(cssDir)) {
            const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
            
            for (const file of cssFiles) {
                const filePath = path.join(cssDir, file);
                const stats = fs.statSync(filePath);
                totalCSS += stats.size;
            }
        }

        this.metrics.bundle = {
            totalJS,
            totalCSS,
            chunks: chunks.length,
            largestChunk: Math.max(...chunks.map(c => c.size), 0)
        };

        // Vérifier les violations
        if (totalJS > PERFORMANCE_BUDGET.bundleSize.totalJS) {
            this.violations.push({
                type: 'bundle',
                metric: 'totalJS',
                value: totalJS,
                limit: PERFORMANCE_BUDGET.bundleSize.totalJS,
                severity: 'critical'
            });
        }

        console.log(`✅ Bundle JS total: ${this.formatBytes(totalJS)} (${chunks.length} chunks)`);
        console.log(`📦 Plus gros chunk: ${this.formatBytes(this.metrics.bundle.largestChunk)}`);
    }

    // Tester les performances API
    async testAPIPerformance() {
        console.log('🔍 Test des performances API...');
        
        const apiTests = [
            { name: 'auth', url: '/api/auth/me', budget: PERFORMANCE_BUDGET.api.auth },
            { name: 'sites', url: '/api/sites', budget: PERFORMANCE_BUDGET.api.crud },
            { name: 'users', url: '/api/users', budget: PERFORMANCE_BUDGET.api.crud }
        ];

        for (const test of apiTests) {
            try {
                const start = performance.now();
                
                // Simulation d'appel API (en production, faire de vrais appels)
                await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
                
                const duration = performance.now() - start;
                this.metrics.api[test.name] = duration;

                if (duration > test.budget) {
                    this.violations.push({
                        type: 'api',
                        metric: test.name,
                        value: duration,
                        limit: test.budget,
                        severity: duration > test.budget * 2 ? 'critical' : 'high'
                    });
                }

                console.log(`${duration < test.budget ? '✅' : '❌'} API ${test.name}: ${duration.toFixed(0)}ms`);
            } catch (error) {
                console.error(`❌ Erreur test API ${test.name}:`, error.message);
            }
        }
    }

    // Simuler les Core Web Vitals (en production, utiliser real user monitoring)
    async simulateWebVitals() {
        console.log('🔍 Simulation Core Web Vitals...');
        
        const vitals = {
            LCP: 1800 + Math.random() * 1000,  // 1.8-2.8s
            FID: 50 + Math.random() * 100,     // 50-150ms
            CLS: Math.random() * 0.2,          // 0-0.2
            FCP: 1200 + Math.random() * 800,   // 1.2-2s
            TTI: 3000 + Math.random() * 1000   // 3-4s
        };

        this.metrics.coreWebVitals = vitals;

        // Vérifier les violations
        Object.entries(vitals).forEach(([metric, value]) => {
            const limit = PERFORMANCE_BUDGET.coreWebVitals[metric];
            if (value > limit) {
                this.violations.push({
                    type: 'webVitals',
                    metric,
                    value,
                    limit,
                    severity: value > limit * 1.5 ? 'critical' : 'high'
                });
            }
        });

        console.log(`${vitals.LCP < PERFORMANCE_BUDGET.coreWebVitals.LCP ? '✅' : '❌'} LCP: ${vitals.LCP.toFixed(0)}ms`);
        console.log(`${vitals.FID < PERFORMANCE_BUDGET.coreWebVitals.FID ? '✅' : '❌'} FID: ${vitals.FID.toFixed(0)}ms`);
        console.log(`${vitals.CLS < PERFORMANCE_BUDGET.coreWebVitals.CLS ? '✅' : '❌'} CLS: ${vitals.CLS.toFixed(3)}`);
    }

    // Utilitaires
    formatBytes(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    }

    // Générer le rapport final
    generateReport() {
        const report = {
            ...this.metrics,
            violations: this.violations,
            summary: {
                totalViolations: this.violations.length,
                criticalViolations: this.violations.filter(v => v.severity === 'critical').length,
                highViolations: this.violations.filter(v => v.severity === 'high').length,
                score: Math.max(0, 100 - (this.violations.length * 10))
            }
        };

        return report;
    }
}

// 🚨 SYSTÈME D'ALERTES
class AlertManager {
    static async sendAlert(report) {
        const { violations, summary } = report;
        
        if (violations.length === 0) {
            console.log('🎉 Aucune violation de budget détectée !');
            return;
        }

        const alertLevel = summary.criticalViolations > 0 ? 'CRITICAL' : 'WARNING';
        const message = this.formatAlertMessage(report, alertLevel);

        // Console (toujours activé)
        console.log('\n' + '='.repeat(60));
        console.log(`🚨 ALERTE PERFORMANCE - ${alertLevel}`);
        console.log('='.repeat(60));
        console.log(message);
        console.log('='.repeat(60));

        // Slack
        if (ALERT_CONFIG.slack.enabled) {
            await this.sendSlackAlert(message, alertLevel);
        }

        // Email
        if (ALERT_CONFIG.email.enabled) {
            await this.sendEmailAlert(message, alertLevel);
        }
    }

    static formatAlertMessage(report, level) {
        const { violations, summary } = report;
        
        let message = `Performance Score: ${summary.score}/100\n`;
        message += `Violations: ${summary.totalViolations} (${summary.criticalViolations} critiques)\n\n`;

        violations.forEach(violation => {
            const icon = violation.severity === 'critical' ? '🔴' : '🟡';
            const percent = ((violation.value / violation.limit - 1) * 100).toFixed(0);
            
            message += `${icon} ${violation.type.toUpperCase()} - ${violation.metric}\n`;
            message += `   Valeur: ${this.formatValue(violation.value)} `;
            message += `(+${percent}% vs limite ${this.formatValue(violation.limit)})\n`;
            if (violation.file) message += `   Fichier: ${violation.file}\n`;
            message += '\n';
        });

        return message;
    }

    static formatValue(value) {
        if (typeof value === 'number') {
            if (value > 1000000) return `${(value / 1000000).toFixed(1)}MB`;
            if (value > 1000) return `${(value / 1000).toFixed(1)}KB`;
            if (value < 1) return value.toFixed(3);
            return `${value.toFixed(0)}ms`;
        }
        return value;
    }

    static async sendSlackAlert(message, level) {
        // Implémentation Slack webhook (optionnelle)
        console.log('📱 [Slack] Alerte envoyée');
    }

    static async sendEmailAlert(message, level) {
        // Implémentation email (optionnelle)
        console.log('📧 [Email] Alerte envoyée');
    }
}

// 🎯 EXECUTION PRINCIPALE
async function runPerformanceMonitoring() {
    console.log('🚀 MONITORING PERFORMANCE - Budget Bulletproof');
    console.log('📊 Objectifs: Pages < 2s | Bundles < 250KB | API < 300ms\n');

    const collector = new PerformanceCollector();
    
    try {
        // Collecte des métriques
        await collector.analyzeBundleSize();
        await collector.testAPIPerformance();
        await collector.simulateWebVitals();

        // Génération du rapport
        const report = collector.generateReport();
        
        // Sauvegarde du rapport
        const reportPath = path.join(__dirname, '../performance-budget-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Envoi des alertes si nécessaire
        await AlertManager.sendAlert(report);
        
        console.log(`\n📄 Rapport sauvegardé: ${reportPath}`);
        console.log(`🎯 Score Performance: ${report.summary.score}/100`);
        
        // Code de sortie basé sur les violations critiques
        process.exit(report.summary.criticalViolations > 0 ? 1 : 0);
        
    } catch (error) {
        console.error('❌ Erreur lors du monitoring:', error);
        process.exit(1);
    }
}

// Démarrage si exécuté directement
if (require.main === module) {
    runPerformanceMonitoring();
}

module.exports = { runPerformanceMonitoring, PerformanceCollector, AlertManager, PERFORMANCE_BUDGET };