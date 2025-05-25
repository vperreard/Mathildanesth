#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Démarrage de l\'audit performance complet...\n');

// Configuration
const config = {
    baseUrl: 'http://localhost:3000',
    outputDir: path.join(__dirname, '..', 'quality-reports'),
    timeout: 30000,

    // Pages critiques à tester
    pages: [
        { path: '/', name: 'home', description: 'Page d\'accueil' },
        { path: '/login', name: 'login', description: 'Page de connexion' },
        { path: '/dashboard', name: 'dashboard', description: 'Tableau de bord' },
        { path: '/leaves', name: 'leaves', description: 'Gestion des congés' },
        { path: '/planning', name: 'planning', description: 'Planning' }
    ],

    // APIs critiques à tester
    apis: [
        { path: '/api/auth/session', name: 'auth-session', description: 'Session utilisateur' },
        { path: '/api/leaves/balance', name: 'leaves-balance', description: 'Solde des congés' },
        { path: '/api/users/me', name: 'user-profile', description: 'Profil utilisateur' }
    ],

    // Seuils de performance
    thresholds: {
        pageLoadTime: 2000, // 2 secondes max
        apiResponseTime: 200, // 200ms max
        lighthouseScore: 90 // Score Lighthouse minimum
    }
};

/**
 * Script d'Audit de Performance - Mathildanesth
 * 
 * Analyse les performances de l'application :
 * - Taille des bundles JavaScript
 * - Temps de chargement des pages critiques
 * - Performance des APIs critiques
 * - Métriques Lighthouse
 */

class PerformanceAuditor {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            bundles: {},
            pageLoads: {},
            apiPerformance: {},
            lighthouse: {},
            recommendations: []
        };
        this.auditDir = path.join(process.cwd(), 'performance-audits');
    }

    async init() {
        // Créer le dossier d'audit s'il n'existe pas
        try {
            await fs.promises.mkdir(this.auditDir, { recursive: true });
        } catch (error) {
            console.warn('Warning: Could not create audit directory:', error.message);
        }
    }

    /**
     * Analyse des bundles JavaScript avec webpack-bundle-analyzer
     */
    async analyzeBundles() {
        console.log('🔍 Analyse des bundles JavaScript...');

        try {
            // Build de production avec analyse des bundles
            console.log('Building production version...');
            execSync('npm run build', {
                stdio: 'pipe',
                env: { ...process.env, ANALYZE: 'true', WEBPACK_ANALYZE: 'true' }
            });

            // Lecture des stats webpack si disponibles
            const nextDir = path.join(process.cwd(), '.next');
            const buildManifest = path.join(nextDir, 'build-manifest.json');

            if (await this.fileExists(buildManifest)) {
                const manifest = JSON.parse(await fs.promises.readFile(buildManifest, 'utf8'));

                this.results.bundles = {
                    pages: Object.keys(manifest.pages).length,
                    totalChunks: Object.keys(manifest.sortedPages || []).length,
                    criticalModules: {
                        leaves: this.findModuleChunks(manifest, 'leaves'),
                        auth: this.findModuleChunks(manifest, 'auth'),
                        main: manifest.pages['/'] || []
                    }
                };
            }

            // Analyse de la taille des fichiers de build
            const staticDir = path.join(nextDir, 'static');
            if (await this.fileExists(staticDir)) {
                const sizes = await this.getDirectorySizes(staticDir);
                this.results.bundles.sizes = sizes;
            }

            console.log('✅ Analyse des bundles terminée');
        } catch (error) {
            console.error('❌ Erreur lors de l\'analyse des bundles:', error.message);
            this.results.bundles.error = error.message;
        }
    }

    /**
     * Test de performance des pages critiques
     */
    async testPagePerformance() {
        console.log('⚡ Test de performance des pages...');

        const criticalPages = [
            { name: 'Accueil', url: '/' },
            { name: 'Login', url: '/login' },
            { name: 'Dashboard', url: '/dashboard' },
            { name: 'Congés', url: '/leaves' },
            { name: 'Planning', url: '/planning' }
        ];

        for (const page of criticalPages) {
            try {
                const url = `http://localhost:3000${page.url}`;
                const startTime = Date.now();

                // Simulation d'une requête (nécessite que l'app soit démarrée)
                try {
                    const response = await fetch(url, {
                        timeout: 5000,
                        headers: { 'User-Agent': 'Performance-Audit-Bot' }
                    });

                    const loadTime = Date.now() - startTime;

                    this.results.pageLoads[page.name] = {
                        url: page.url,
                        loadTime,
                        status: response.status,
                        contentLength: response.headers.get('content-length'),
                        cacheControl: response.headers.get('cache-control')
                    };

                    // Alerte si temps de chargement > 2 secondes
                    if (loadTime > 2000) {
                        this.results.recommendations.push({
                            type: 'performance',
                            severity: 'high',
                            page: page.name,
                            message: `Page ${page.name} charge en ${loadTime}ms (> 2s recommandé)`
                        });
                    }
                } catch (fetchError) {
                    this.results.pageLoads[page.name] = {
                        url: page.url,
                        error: 'Server not running or page inaccessible',
                        message: 'Start the dev server with `npm run dev` for page performance testing'
                    };
                }
            } catch (error) {
                console.warn(`⚠️  Could not test page ${page.name}:`, error.message);
            }
        }

        console.log('✅ Test de performance des pages terminé');
    }

    /**
     * Test de performance des APIs critiques
     */
    async testApiPerformance() {
        console.log('🚀 Test de performance des APIs...');

        const criticalApis = [
            { name: 'Auth', endpoint: '/api/auth/me', method: 'GET' },
            { name: 'Leaves Balance', endpoint: '/api/leaves/balance', method: 'GET' },
            { name: 'Users List', endpoint: '/api/users', method: 'GET' },
            { name: 'Leave Creation', endpoint: '/api/leaves/batch', method: 'POST' }
        ];

        for (const api of criticalApis) {
            try {
                const url = `http://localhost:3000${api.endpoint}`;
                const startTime = Date.now();

                try {
                    const response = await fetch(url, {
                        method: api.method,
                        timeout: 3000,
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': 'Performance-Audit-Bot'
                        },
                        // Mock data pour POST requests
                        body: api.method === 'POST' ? JSON.stringify({
                            test: true,
                            userId: 1,
                            typeCode: 'ANNUAL',
                            startDate: '2024-08-01',
                            endDate: '2024-08-02'
                        }) : undefined
                    });

                    const responseTime = Date.now() - startTime;

                    this.results.apiPerformance[api.name] = {
                        endpoint: api.endpoint,
                        method: api.method,
                        responseTime,
                        status: response.status,
                        contentType: response.headers.get('content-type')
                    };

                    // Alerte si temps de réponse > 200ms
                    if (responseTime > 200) {
                        this.results.recommendations.push({
                            type: 'api',
                            severity: responseTime > 500 ? 'high' : 'medium',
                            api: api.name,
                            message: `API ${api.name} répond en ${responseTime}ms (< 200ms recommandé)`
                        });
                    }
                } catch (fetchError) {
                    this.results.apiPerformance[api.name] = {
                        endpoint: api.endpoint,
                        error: 'Server not running or API inaccessible',
                        message: 'Start the dev server with `npm run dev` for API performance testing'
                    };
                }
            } catch (error) {
                console.warn(`⚠️  Could not test API ${api.name}:`, error.message);
            }
        }

        console.log('✅ Test de performance des APIs terminé');
    }

    /**
     * Audit Lighthouse (optionnel, nécessite Chrome)
     */
    async runLighthouseAudit() {
        console.log('🏮 Audit Lighthouse...');

        try {
            const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
            const options = {
                logLevel: 'info',
                output: 'json',
                onlyCategories: ['performance', 'accessibility', 'best-practices'],
                port: chrome.port,
            };

            const runnerResult = await lighthouse('http://localhost:3000', options);
            await chrome.kill();

            if (runnerResult && runnerResult.lhr) {
                this.results.lighthouse = {
                    performance: runnerResult.lhr.categories.performance.score * 100,
                    accessibility: runnerResult.lhr.categories.accessibility.score * 100,
                    bestPractices: runnerResult.lhr.categories['best-practices'].score * 100,
                    metrics: {
                        fcp: runnerResult.lhr.audits['first-contentful-paint'].numericValue,
                        lcp: runnerResult.lhr.audits['largest-contentful-paint'].numericValue,
                        cls: runnerResult.lhr.audits['cumulative-layout-shift'].numericValue,
                        tti: runnerResult.lhr.audits['interactive'].numericValue
                    }
                };

                // Recommandations basées sur Lighthouse
                if (this.results.lighthouse.performance < 90) {
                    this.results.recommendations.push({
                        type: 'lighthouse',
                        severity: 'high',
                        message: `Score Performance Lighthouse: ${this.results.lighthouse.performance}/100 (< 90 recommandé)`
                    });
                }
            }

            console.log('✅ Audit Lighthouse terminé');
        } catch (error) {
            console.warn('⚠️  Lighthouse audit failed:', error.message);
            this.results.lighthouse.error = 'Chrome or server not available for Lighthouse audit';
        }
    }

    /**
     * Génération du rapport final
     */
    async generateReport() {
        console.log('📊 Génération du rapport...');

        const reportData = {
            ...this.results,
            summary: {
                totalRecommendations: this.results.recommendations.length,
                criticalIssues: this.results.recommendations.filter(r => r.severity === 'high').length,
                bundleAnalyzed: !!this.results.bundles.sizes,
                apisTested: Object.keys(this.results.apiPerformance).length,
                pagesTested: Object.keys(this.results.pageLoads).length
            }
        };

        // Rapport JSON détaillé
        const jsonReport = path.join(this.auditDir, `performance-audit-${Date.now()}.json`);
        await fs.promises.writeFile(jsonReport, JSON.stringify(reportData, null, 2));

        // Rapport HTML lisible
        const htmlReport = await this.generateHtmlReport(reportData);
        const htmlReportPath = path.join(this.auditDir, `performance-audit-${Date.now()}.html`);
        await fs.promises.writeFile(htmlReportPath, htmlReport);

        console.log('✅ Rapport généré :');
        console.log(`   JSON: ${jsonReport}`);
        console.log(`   HTML: ${htmlReportPath}`);

        // Affichage du résumé dans la console
        this.displaySummary(reportData);
    }

    /**
     * Affichage du résumé dans la console
     */
    displaySummary(data) {
        console.log('\n📋 RÉSUMÉ DE L\'AUDIT DE PERFORMANCE\n');
        console.log('='.repeat(50));

        // Bundles
        if (data.bundles.sizes) {
            console.log('\n🎯 BUNDLES:');
            console.log(`   JavaScript total: ${this.formatSize(data.bundles.sizes.js || 0)}`);
            console.log(`   CSS total: ${this.formatSize(data.bundles.sizes.css || 0)}`);
        }

        // APIs
        const apis = Object.entries(data.apiPerformance).filter(([_, api]) => !api.error);
        if (apis.length > 0) {
            console.log('\n⚡ APIS (temps de réponse):');
            apis.forEach(([name, api]) => {
                const status = api.responseTime <= 200 ? '✅' : api.responseTime <= 500 ? '⚠️' : '❌';
                console.log(`   ${status} ${name}: ${api.responseTime}ms`);
            });
        }

        // Lighthouse
        if (data.lighthouse.performance) {
            console.log('\n🏮 LIGHTHOUSE:');
            console.log(`   Performance: ${data.lighthouse.performance}/100`);
            console.log(`   Accessibilité: ${data.lighthouse.accessibility}/100`);
            console.log(`   Bonnes pratiques: ${data.lighthouse.bestPractices}/100`);
        }

        // Recommandations
        if (data.recommendations.length > 0) {
            console.log('\n⚠️  RECOMMANDATIONS:');
            data.recommendations.forEach(rec => {
                const icon = rec.severity === 'high' ? '🔴' : '🟡';
                console.log(`   ${icon} ${rec.message}`);
            });
        } else {
            console.log('\n✅ Aucun problème de performance détecté !');
        }

        console.log('\n' + '='.repeat(50));
    }

    /**
     * Génération du rapport HTML
     */
    async generateHtmlReport(data) {
        return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audit de Performance - Mathildanesth</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .section { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metric { display: inline-block; background: white; padding: 10px; margin: 5px; border-radius: 4px; border-left: 4px solid #3b82f6; }
        .warning { border-left-color: #f59e0b; }
        .error { border-left-color: #ef4444; }
        .success { border-left-color: #10b981; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f3f4f6; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Audit de Performance - Mathildanesth</h1>
        <p>Généré le ${new Date(data.timestamp).toLocaleString('fr-FR')}</p>
    </div>

    <div class="section">
        <h2>📊 Résumé</h2>
        <div class="metric success">✅ ${data.summary.bundleAnalyzed ? 'Bundles analysés' : 'Bundles non analysés'}</div>
        <div class="metric ${data.summary.apisTested > 0 ? 'success' : 'warning'}">⚡ ${data.summary.apisTested} APIs testées</div>
        <div class="metric ${data.summary.pagesTested > 0 ? 'success' : 'warning'}">📄 ${data.summary.pagesTested} pages testées</div>
        <div class="metric ${data.summary.criticalIssues === 0 ? 'success' : 'error'}">⚠️ ${data.summary.criticalIssues} problèmes critiques</div>
    </div>

    ${data.bundles.sizes ? `
    <div class="section">
        <h2>🎯 Analyse des Bundles</h2>
        <table>
            <tr><th>Type</th><th>Taille</th></tr>
            <tr><td>JavaScript</td><td>${this.formatSize(data.bundles.sizes.js || 0)}</td></tr>
            <tr><td>CSS</td><td>${this.formatSize(data.bundles.sizes.css || 0)}</td></tr>
            <tr><td>Images</td><td>${this.formatSize(data.bundles.sizes.images || 0)}</td></tr>
        </table>
    </div>
    ` : ''}

    ${Object.keys(data.apiPerformance).length > 0 ? `
    <div class="section">
        <h2>⚡ Performance des APIs</h2>
        <table>
            <tr><th>API</th><th>Endpoint</th><th>Temps (ms)</th><th>Status</th></tr>
            ${Object.entries(data.apiPerformance).map(([name, api]) =>
            api.error ? `<tr><td>${name}</td><td>${api.endpoint}</td><td colspan="2">${api.error}</td></tr>` :
                `<tr><td>${name}</td><td>${api.endpoint}</td><td>${api.responseTime}ms</td><td>${api.status}</td></tr>`
        ).join('')}
        </table>
    </div>
    ` : ''}

    ${data.recommendations.length > 0 ? `
    <div class="section">
        <h2>⚠️ Recommandations</h2>
        ${data.recommendations.map(rec =>
            `<div class="metric ${rec.severity === 'high' ? 'error' : 'warning'}">
            ${rec.severity === 'high' ? '🔴' : '🟡'} ${rec.message}
          </div>`
        ).join('')}
    </div>
    ` : ''}

    <div class="section">
        <h2>📝 Données complètes</h2>
        <pre style="background: white; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px;">
${JSON.stringify(data, null, 2)}
        </pre>
    </div>
</body>
</html>`;
    }

    // Utilitaires
    async fileExists(path) {
        try {
            await fs.promises.access(path);
            return true;
        } catch {
            return false;
        }
    }

    findModuleChunks(manifest, moduleName) {
        const chunks = [];
        for (const [page, files] of Object.entries(manifest.pages)) {
            files.forEach(file => {
                if (file.includes(moduleName)) {
                    chunks.push({ page, file });
                }
            });
        }
        return chunks;
    }

    async getDirectorySizes(dir) {
        const sizes = { js: 0, css: 0, images: 0, other: 0 };

        try {
            const files = await fs.promises.readdir(dir, { recursive: true });
            for (const file of files) {
                try {
                    const filePath = path.join(dir, file);
                    const stats = await fs.promises.stat(filePath);
                    if (stats.isFile()) {
                        const ext = path.extname(file).toLowerCase();
                        if (['.js', '.mjs'].includes(ext)) sizes.js += stats.size;
                        else if (ext === '.css') sizes.css += stats.size;
                        else if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) sizes.images += stats.size;
                        else sizes.other += stats.size;
                    }
                } catch (error) {
                    // Skip files we can't stat
                }
            }
        } catch (error) {
            console.warn('Could not read directory sizes:', error.message);
        }

        return sizes;
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Exécution principale
async function main() {
    console.log('🔥 AUDIT DE PERFORMANCE - MATHILDANESTH\n');

    const auditor = new PerformanceAuditor();
    await auditor.init();

    try {
        await auditor.analyzeBundles();
        await auditor.testPagePerformance();
        await auditor.testApiPerformance();
        await auditor.runLighthouseAudit();
        await auditor.generateReport();

        console.log('\n🎉 Audit de performance terminé avec succès !');
    } catch (error) {
        console.error('\n❌ Erreur lors de l\'audit:', error.message);
        process.exit(1);
    }
}

// Exécution si le script est appelé directement
if (require.main === module) {
    main().catch(console.error);
}

module.exports = PerformanceAuditor; 