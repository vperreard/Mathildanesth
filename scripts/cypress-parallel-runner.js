#!/usr/bin/env node

/**
 * Script pour exécuter les tests Cypress en parallèle avec optimisations
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

class CypressParallelRunner {
    constructor() {
        this.maxWorkers = process.env.CYPRESS_WORKERS || 4;
        this.retryAttempts = 3;
        this.browser = process.env.CYPRESS_BROWSER || 'chrome';
        this.headless = process.env.CI === 'true' || process.argv.includes('--headless');
        this.specPattern = 'cypress/e2e/**/*.spec.{js,jsx,ts,tsx}';
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0,
            failures: []
        };
    }

    async getAllSpecs() {
        return new Promise((resolve, reject) => {
            glob(this.specPattern, (err, files) => {
                if (err) reject(err);
                else resolve(files);
            });
        });
    }

    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    async runSpecChunk(specs, workerId) {
        return new Promise((resolve) => {
            const specList = specs.join(',');
            const args = [
                'run',
                '--spec', specList,
                '--browser', this.browser,
                '--reporter', 'mochawesome',
                '--reporter-options', `reportDir=cypress/reports/mocha,overwrite=false,html=false,json=true,reportFilename=worker-${workerId}`
            ];

            if (this.headless) {
                args.push('--headless');
            }

            console.log(`🚀 Worker ${workerId}: Démarrage des tests ${specs.length} specs`);
            console.log(`📋 Specs: ${specs.map(s => path.basename(s)).join(', ')}`);

            const startTime = Date.now();
            const cypressProcess = spawn('npx', ['cypress', ...args], {
                stdio: 'pipe',
                env: { 
                    ...process.env, 
                    CYPRESS_WORKER_ID: workerId,
                    CYPRESS_RETRIES: this.retryAttempts
                }
            });

            let output = '';
            let errorOutput = '';

            cypressProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            cypressProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            cypressProcess.on('close', (code) => {
                const duration = Date.now() - startTime;
                const result = {
                    workerId,
                    specs,
                    exitCode: code,
                    duration,
                    output,
                    errorOutput
                };

                if (code === 0) {
                    console.log(`✅ Worker ${workerId}: Tests réussis (${duration}ms)`);
                } else {
                    console.log(`❌ Worker ${workerId}: Tests échoués (code ${code}, ${duration}ms)`);
                }

                resolve(result);
            });
        });
    }

    async parseResults() {
        const reportDir = 'cypress/reports/mocha';
        if (!fs.existsSync(reportDir)) {
            console.log('⚠️  Aucun rapport trouvé');
            return;
        }

        const reportFiles = fs.readdirSync(reportDir)
            .filter(file => file.startsWith('worker-') && file.endsWith('.json'));

        let totalTests = 0;
        let totalPassed = 0;
        let totalFailed = 0;
        let totalSkipped = 0;
        let totalDuration = 0;
        const failures = [];

        for (const file of reportFiles) {
            try {
                const reportPath = path.join(reportDir, file);
                const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

                totalTests += report.stats.tests;
                totalPassed += report.stats.passes;
                totalFailed += report.stats.failures;
                totalSkipped += report.stats.pending;
                totalDuration += report.stats.duration;

                if (report.failures && report.failures.length > 0) {
                    failures.push(...report.failures.map(f => ({
                        title: f.title,
                        fullTitle: f.fullTitle,
                        error: f.err.message,
                        file: f.file
                    })));
                }
            } catch (error) {
                console.log(`⚠️  Erreur lors de la lecture du rapport ${file}:`, error.message);
            }
        }

        this.results = {
            total: totalTests,
            passed: totalPassed,
            failed: totalFailed,
            skipped: totalSkipped,
            duration: totalDuration,
            failures
        };
    }

    generateConsolidatedReport() {
        const reportPath = 'cypress/reports/consolidated-report.json';
        fs.writeFileSync(reportPath, JSON.stringify({
            ...this.results,
            timestamp: new Date().toISOString(),
            environment: {
                browser: this.browser,
                workers: this.maxWorkers,
                headless: this.headless,
                retries: this.retryAttempts
            }
        }, null, 2));

        console.log(`📊 Rapport consolidé généré: ${reportPath}`);
    }

    printSummary() {
        const { total, passed, failed, skipped, duration, failures } = this.results;
        const successRate = total > 0 ? ((passed / total) * 100).toFixed(2) : 0;

        console.log('\n' + '='.repeat(80));
        console.log('📈 RÉSUMÉ DES TESTS E2E PARALLÈLES');
        console.log('='.repeat(80));
        console.log(`🔢 Total des tests: ${total}`);
        console.log(`✅ Réussis: ${passed}`);
        console.log(`❌ Échoués: ${failed}`);
        console.log(`⏭️  Ignorés: ${skipped}`);
        console.log(`⏱️  Durée totale: ${(duration / 1000).toFixed(2)}s`);
        console.log(`📊 Taux de réussite: ${successRate}%`);
        console.log(`👥 Workers utilisés: ${this.maxWorkers}`);

        if (failures.length > 0) {
            console.log('\n❌ ÉCHECS DÉTAILLÉS:');
            failures.forEach((failure, index) => {
                console.log(`\n${index + 1}. ${failure.fullTitle}`);
                console.log(`   📁 Fichier: ${failure.file}`);
                console.log(`   ❗ Erreur: ${failure.error.substring(0, 200)}...`);
            });
        }

        console.log('\n' + '='.repeat(80));
        
        // Exit code basé sur les résultats
        process.exit(failed > 0 ? 1 : 0);
    }

    async run() {
        console.log('🚀 Démarrage des tests Cypress en parallèle...');
        console.log(`⚙️  Configuration: ${this.maxWorkers} workers, ${this.browser}, ${this.headless ? 'headless' : 'headed'}`);

        try {
            // Nettoyer les anciens rapports
            const reportDir = 'cypress/reports/mocha';
            if (fs.existsSync(reportDir)) {
                const oldReports = fs.readdirSync(reportDir)
                    .filter(file => file.startsWith('worker-'));
                oldReports.forEach(file => {
                    fs.unlinkSync(path.join(reportDir, file));
                });
            }

            // Obtenir tous les specs
            const allSpecs = await this.getAllSpecs();
            console.log(`📁 ${allSpecs.length} specs trouvés`);

            if (allSpecs.length === 0) {
                console.log('⚠️  Aucun spec trouvé!');
                return;
            }

            // Diviser en chunks pour les workers
            const specChunks = this.chunkArray(allSpecs, Math.ceil(allSpecs.length / this.maxWorkers));
            console.log(`📦 Répartition en ${specChunks.length} chunks`);

            // Lancer les workers en parallèle
            const workerPromises = specChunks.map((chunk, index) => 
                this.runSpecChunk(chunk, index + 1)
            );

            const startTime = Date.now();
            const results = await Promise.all(workerPromises);
            const totalDuration = Date.now() - startTime;

            console.log(`\n⏱️  Temps total d'exécution: ${(totalDuration / 1000).toFixed(2)}s`);

            // Analyser les résultats
            await this.parseResults();
            this.generateConsolidatedReport();
            this.printSummary();

        } catch (error) {
            console.error('💥 Erreur lors de l\'exécution des tests:', error);
            process.exit(1);
        }
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const runner = new CypressParallelRunner();
    runner.run();
}

module.exports = CypressParallelRunner;