#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Démarrage de l\'audit performance simplifié...\n');

// Configuration
const config = {
    outputDir: path.join(__dirname, '..', 'quality-reports'),
    timeout: 30000,

    // Seuils de performance
    thresholds: {
        bundleSize: 1000000, // 1MB max pour les bundles principaux
        chunkSize: 500000,   // 500KB max pour les chunks
        totalBundleSize: 5000000 // 5MB max total
    }
};

class PerformanceAuditor {
    constructor() {
        this.auditDir = config.outputDir;
        this.results = {
            bundles: {},
            performance: {},
            recommendations: [],
            timestamp: new Date().toISOString()
        };
    }

    async run() {
        console.log('📊 Analyse des bundles...');
        await this.analyzeBundles();

        console.log('⚡ Tests de performance...');
        await this.runPerformanceTests();

        console.log('📝 Génération du rapport...');
        await this.generateReport();

        console.log('✅ Audit terminé !');
    }

    async analyzeBundles() {
        try {
            // Créer le dossier d'audit s'il n'existe pas
            await fs.promises.mkdir(this.auditDir, { recursive: true });

            // Analyser les bundles Next.js
            const buildDir = path.join(__dirname, '..', '.next');
            const buildManifest = path.join(buildDir, 'build-manifest.json');

            if (await this.fileExists(buildManifest)) {
                const manifest = JSON.parse(await fs.promises.readFile(buildManifest, 'utf8'));

                this.results.bundles = {
                    pages: manifest.pages || {},
                    sortedPages: manifest.sortedPages || [],
                    analysis: await this.analyzeBundleSizes(buildDir)
                };
            }

            // Analyser la taille des fichiers statiques
            const staticDir = path.join(buildDir, 'static');
            if (await this.fileExists(staticDir)) {
                this.results.bundles.staticFiles = await this.analyzeStaticFiles(staticDir);
            }

        } catch (error) {
            console.warn('Warning: Bundle analysis failed:', error.message);
            this.results.bundles.error = error.message;
        }
    }

    async analyzeBundleSizes(buildDir) {
        const analysis = {
            totalSize: 0,
            largeFiles: [],
            recommendations: []
        };

        try {
            const files = await this.getFilesRecursively(buildDir);

            for (const file of files) {
                try {
                    const filePath = path.join(buildDir, file);
                    const stats = await fs.promises.stat(filePath);

                    if (stats.isFile()) {
                        const ext = path.extname(file).toLowerCase();
                        const size = stats.size;

                        analysis.totalSize += size;

                        // Identifier les gros fichiers
                        if (size > config.thresholds.chunkSize && ['.js', '.css'].includes(ext)) {
                            analysis.largeFiles.push({
                                file,
                                size,
                                sizeFormatted: this.formatBytes(size)
                            });
                        }
                    }
                } catch (err) {
                    // Ignorer les erreurs de fichiers individuels
                }
            }

            // Générer des recommandations
            if (analysis.totalSize > config.thresholds.totalBundleSize) {
                analysis.recommendations.push('Bundle total trop volumineux. Considérer le code splitting.');
            }

            if (analysis.largeFiles.length > 0) {
                analysis.recommendations.push(`${analysis.largeFiles.length} fichiers volumineux détectés. Optimiser ou diviser.`);
            }

        } catch (error) {
            analysis.error = error.message;
        }

        return analysis;
    }

    async analyzeStaticFiles(staticDir) {
        const analysis = {
            totalSize: 0,
            fileTypes: {},
            largeFiles: []
        };

        try {
            const files = await this.getFilesRecursively(staticDir);

            for (const file of files) {
                try {
                    const filePath = path.join(staticDir, file);
                    const stats = await fs.promises.stat(filePath);

                    if (stats.isFile()) {
                        const ext = path.extname(file).toLowerCase();
                        const size = stats.size;

                        analysis.totalSize += size;

                        // Grouper par type de fichier
                        if (!analysis.fileTypes[ext]) {
                            analysis.fileTypes[ext] = { count: 0, totalSize: 0 };
                        }
                        analysis.fileTypes[ext].count++;
                        analysis.fileTypes[ext].totalSize += size;

                        // Identifier les gros fichiers statiques
                        if (size > 100000) { // 100KB
                            analysis.largeFiles.push({
                                file,
                                size,
                                sizeFormatted: this.formatBytes(size)
                            });
                        }
                    }
                } catch (err) {
                    // Ignorer les erreurs de fichiers individuels
                }
            }

        } catch (error) {
            analysis.error = error.message;
        }

        return analysis;
    }

    async runPerformanceTests() {
        const tests = [
            { name: 'Build Time', test: () => this.measureBuildTime() },
            { name: 'TypeScript Check', test: () => this.measureTypeScriptCheck() },
            { name: 'Test Suite', test: () => this.measureTestSuite() }
        ];

        for (const test of tests) {
            try {
                console.log(`  ⏱️  ${test.name}...`);
                const result = await test.test();
                this.results.performance[test.name] = result;
            } catch (error) {
                this.results.performance[test.name] = {
                    error: error.message,
                    duration: null
                };
            }
        }
    }

    async measureBuildTime() {
        const start = Date.now();
        try {
            execSync('npm run build', {
                stdio: 'pipe',
                timeout: 120000 // 2 minutes max
            });
            const duration = Date.now() - start;
            return {
                duration,
                status: duration < 60000 ? 'good' : duration < 120000 ? 'warning' : 'poor',
                recommendation: duration > 60000 ? 'Build time élevé. Optimiser les imports et dépendances.' : null
            };
        } catch (error) {
            return {
                duration: Date.now() - start,
                status: 'error',
                error: error.message
            };
        }
    }

    async measureTypeScriptCheck() {
        const start = Date.now();
        try {
            execSync('npx tsc --noEmit', {
                stdio: 'pipe',
                timeout: 30000
            });
            const duration = Date.now() - start;
            return {
                duration,
                status: duration < 10000 ? 'good' : duration < 20000 ? 'warning' : 'poor',
                recommendation: duration > 10000 ? 'Vérification TypeScript lente. Optimiser les types.' : null
            };
        } catch (error) {
            return {
                duration: Date.now() - start,
                status: 'error',
                error: error.message
            };
        }
    }

    async measureTestSuite() {
        const start = Date.now();
        try {
            execSync('npm run test:critical', {
                stdio: 'pipe',
                timeout: 60000
            });
            const duration = Date.now() - start;
            return {
                duration,
                status: duration < 30000 ? 'good' : duration < 60000 ? 'warning' : 'poor',
                recommendation: duration > 30000 ? 'Tests lents. Optimiser les mocks et setup.' : null
            };
        } catch (error) {
            return {
                duration: Date.now() - start,
                status: 'error',
                error: error.message
            };
        }
    }

    async generateReport() {
        const reportData = {
            ...this.results,
            summary: this.generateSummary()
        };

        // Rapport JSON détaillé
        const jsonReport = path.join(this.auditDir, `performance-audit-${Date.now()}.json`);
        await fs.promises.writeFile(jsonReport, JSON.stringify(reportData, null, 2));

        // Rapport HTML lisible
        const htmlReport = await this.generateHtmlReport(reportData);
        const htmlReportPath = path.join(this.auditDir, `performance-audit-${Date.now()}.html`);
        await fs.promises.writeFile(htmlReportPath, htmlReport);

        console.log('✅ Rapport généré :');
        console.log(`   📄 JSON: ${jsonReport}`);
        console.log(`   🌐 HTML: ${htmlReportPath}`);
    }

    generateSummary() {
        const summary = {
            bundleSize: this.results.bundles.analysis?.totalSize || 0,
            largeFilesCount: this.results.bundles.analysis?.largeFiles?.length || 0,
            performanceIssues: 0,
            recommendations: []
        };

        // Compter les problèmes de performance
        Object.values(this.results.performance).forEach(test => {
            if (test.status === 'poor' || test.status === 'error') {
                summary.performanceIssues++;
            }
            if (test.recommendation) {
                summary.recommendations.push(test.recommendation);
            }
        });

        // Ajouter les recommandations de bundles
        if (this.results.bundles.analysis?.recommendations) {
            summary.recommendations.push(...this.results.bundles.analysis.recommendations);
        }

        return summary;
    }

    async generateHtmlReport(data) {
        return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport d'Audit Performance - Mathildanesth</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2, h3 { color: #333; }
        .summary { background: #e8f4fd; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px; min-width: 150px; text-align: center; }
        .good { border-left: 4px solid #28a745; }
        .warning { border-left: 4px solid #ffc107; }
        .poor { border-left: 4px solid #dc3545; }
        .error { border-left: 4px solid #dc3545; background: #f8d7da; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Rapport d'Audit Performance</h1>
        <p class="timestamp">Généré le : ${new Date(data.timestamp).toLocaleString('fr-FR')}</p>
        
        <div class="summary">
            <h2>📊 Résumé</h2>
            <div class="metric">
                <strong>Taille Bundle</strong><br>
                ${this.formatBytes(data.summary.bundleSize)}
            </div>
            <div class="metric">
                <strong>Gros Fichiers</strong><br>
                ${data.summary.largeFilesCount}
            </div>
            <div class="metric">
                <strong>Problèmes Perf</strong><br>
                ${data.summary.performanceIssues}
            </div>
        </div>

        <h2>📦 Analyse des Bundles</h2>
        ${this.generateBundleSection(data.bundles)}

        <h2>⚡ Tests de Performance</h2>
        ${this.generatePerformanceSection(data.performance)}

        ${data.summary.recommendations.length > 0 ? `
        <div class="recommendations">
            <h2>💡 Recommandations</h2>
            <ul>
                ${data.summary.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
    </div>
</body>
</html>`;
    }

    generateBundleSection(bundles) {
        if (!bundles.analysis) return '<p>Aucune analyse de bundle disponible.</p>';

        const analysis = bundles.analysis;
        return `
            <p><strong>Taille totale :</strong> ${this.formatBytes(analysis.totalSize)}</p>
            ${analysis.largeFiles.length > 0 ? `
                <h3>Fichiers volumineux :</h3>
                <table>
                    <tr><th>Fichier</th><th>Taille</th></tr>
                    ${analysis.largeFiles.map(file => `
                        <tr><td>${file.file}</td><td>${file.sizeFormatted}</td></tr>
                    `).join('')}
                </table>
            ` : '<p>✅ Aucun fichier volumineux détecté.</p>'}
        `;
    }

    generatePerformanceSection(performance) {
        return Object.entries(performance).map(([name, result]) => `
            <div class="metric ${result.status}">
                <strong>${name}</strong><br>
                ${result.duration ? `${(result.duration / 1000).toFixed(2)}s` : 'N/A'}<br>
                <small>${result.status}</small>
                ${result.error ? `<br><small style="color: red;">${result.error}</small>` : ''}
            </div>
        `).join('');
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

    async getFilesRecursively(dir) {
        const files = [];
        try {
            const items = await fs.promises.readdir(dir, { recursive: true });
            for (const item of items) {
                try {
                    const itemPath = path.join(dir, item);
                    const stats = await fs.promises.stat(itemPath);
                    if (stats.isFile()) {
                        files.push(item);
                    }
                } catch (err) {
                    // Ignorer les erreurs de fichiers individuels
                }
            }
        } catch (error) {
            console.warn(`Warning: Could not read directory ${dir}:`, error.message);
        }
        return files;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Exécution
const auditor = new PerformanceAuditor();
auditor.run().catch(console.error); 