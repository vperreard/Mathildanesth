#!/usr/bin/env node

/**
 * Moniteur de stabilité Cypress - Exécute les tests en boucle et détecte les instabilités
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class CypressStabilityMonitor {
    constructor() {
        this.maxRuns = parseInt(process.env.STABILITY_RUNS) || 10;
        this.targetSuccessRate = parseFloat(process.env.TARGET_SUCCESS_RATE) || 95.0;
        this.runDelay = parseInt(process.env.RUN_DELAY) || 5000; // 5 secondes entre les runs
        this.runs = [];
        this.flakyTests = new Map();
    }

    async runCypressOnce(runNumber) {
        return new Promise((resolve) => {
            console.log(`\n🔄 Run ${runNumber}/${this.maxRuns} - ${new Date().toISOString()}`);
            
            const startTime = Date.now();
            const cypressProcess = spawn('npx', [
                'cypress', 'run',
                '--browser', 'chrome',
                '--headless',
                '--reporter', 'json',
                '--reporter-options', `output=cypress/reports/stability/run-${runNumber}.json`
            ], {
                stdio: 'pipe'
            });

            let output = '';
            let errorOutput = '';

            cypressProcess.stdout.on('data', (data) => {
                output += data.toString();
                // Afficher les progrès en temps réel
                const lines = data.toString().split('\n');
                lines.forEach(line => {
                    if (line.includes('Running:') || line.includes('passing') || line.includes('failing')) {
                        console.log(`   ${line.trim()}`);
                    }
                });
            });

            cypressProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            cypressProcess.on('close', (code) => {
                const duration = Date.now() - startTime;
                const result = {
                    runNumber,
                    exitCode: code,
                    duration,
                    timestamp: new Date().toISOString(),
                    success: code === 0
                };

                if (code === 0) {
                    console.log(`   ✅ Run ${runNumber} réussi (${(duration/1000).toFixed(2)}s)`);
                } else {
                    console.log(`   ❌ Run ${runNumber} échoué (code ${code}, ${(duration/1000).toFixed(2)}s)`);
                }

                // Parse results if available
                try {
                    const reportPath = `cypress/reports/stability/run-${runNumber}.json`;
                    if (fs.existsSync(reportPath)) {
                        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
                        result.stats = report.stats;
                        result.tests = report.tests;
                        this.analyzeFlakiness(report.tests, runNumber);
                    }
                } catch (error) {
                    console.log(`   ⚠️  Erreur lors du parsing du rapport: ${error.message}`);
                }

                resolve(result);
            });
        });
    }

    analyzeFlakiness(tests, runNumber) {
        tests.forEach(test => {
            const testKey = `${test.title}|${test.fullTitle}`;
            
            if (!this.flakyTests.has(testKey)) {
                this.flakyTests.set(testKey, {
                    title: test.title,
                    fullTitle: test.fullTitle,
                    runs: [],
                    failures: 0,
                    successes: 0
                });
            }

            const testData = this.flakyTests.get(testKey);
            const isFailure = test.state === 'failed';
            
            testData.runs.push({
                runNumber,
                state: test.state,
                duration: test.duration,
                error: isFailure ? test.err?.message : null
            });

            if (isFailure) {
                testData.failures++;
            } else {
                testData.successes++;
            }
        });
    }

    calculateStabilityMetrics() {
        const totalRuns = this.runs.length;
        const successfulRuns = this.runs.filter(run => run.success).length;
        const successRate = (successfulRuns / totalRuns) * 100;
        
        const avgDuration = this.runs.reduce((sum, run) => sum + run.duration, 0) / totalRuns;
        
        // Analyser les tests flaky
        const flakyTestsData = [];
        this.flakyTests.forEach((testData, testKey) => {
            const totalTestRuns = testData.runs.length;
            const failureRate = (testData.failures / totalTestRuns) * 100;
            
            if (failureRate > 0 && failureRate < 100) {
                flakyTestsData.push({
                    ...testData,
                    failureRate,
                    flakiness: failureRate
                });
            }
        });

        // Trier par taux de flakiness
        flakyTestsData.sort((a, b) => b.flakiness - a.flakiness);

        return {
            totalRuns,
            successfulRuns,
            successRate,
            avgDuration: avgDuration / 1000,
            flakyTests: flakyTestsData,
            isStable: successRate >= this.targetSuccessRate && flakyTestsData.length === 0
        };
    }

    generateStabilityReport(metrics) {
        const reportDir = 'cypress/reports/stability';
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        const report = {
            timestamp: new Date().toISOString(),
            configuration: {
                maxRuns: this.maxRuns,
                targetSuccessRate: this.targetSuccessRate,
                runDelay: this.runDelay
            },
            metrics,
            runs: this.runs,
            recommendations: this.generateRecommendations(metrics)
        };

        const reportPath = path.join(reportDir, 'stability-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log(`📊 Rapport de stabilité généré: ${reportPath}`);
        return reportPath;
    }

    generateRecommendations(metrics) {
        const recommendations = [];

        if (metrics.successRate < this.targetSuccessRate) {
            recommendations.push({
                type: 'critical',
                title: 'Taux de succès insuffisant',
                description: `Le taux de succès (${metrics.successRate.toFixed(2)}%) est en dessous du seuil requis (${this.targetSuccessRate}%)`,
                actions: [
                    'Analyser les logs d\'erreurs des runs échoués',
                    'Identifier les causes racines des échecs',
                    'Augmenter les timeouts si nécessaire',
                    'Améliorer la stabilité des sélecteurs'
                ]
            });
        }

        if (metrics.flakyTests.length > 0) {
            recommendations.push({
                type: 'warning',
                title: 'Tests instables détectés',
                description: `${metrics.flakyTests.length} tests présentent une instabilité`,
                actions: [
                    'Refactorer les tests instables identifiés',
                    'Ajouter des attentes explicites',
                    'Améliorer la gestion des états asynchrones',
                    'Considérer l\'ajout de retry automatique'
                ]
            });
        }

        if (metrics.avgDuration > 60) {
            recommendations.push({
                type: 'optimization',
                title: 'Performance des tests',
                description: `Durée moyenne élevée: ${metrics.avgDuration.toFixed(2)}s`,
                actions: [
                    'Optimiser les fixtures et le setup des tests',
                    'Paralléliser l\'exécution des tests',
                    'Réduire les attentes inutiles',
                    'Utiliser des mocks pour les appels API lents'
                ]
            });
        }

        return recommendations;
    }

    printDetailedReport(metrics) {
        console.log('\n' + '='.repeat(80));
        console.log('📈 RAPPORT DE STABILITÉ E2E');
        console.log('='.repeat(80));
        console.log(`🔢 Runs effectués: ${metrics.totalRuns}`);
        console.log(`✅ Runs réussis: ${metrics.successfulRuns}`);
        console.log(`📊 Taux de succès: ${metrics.successRate.toFixed(2)}% (cible: ${this.targetSuccessRate}%)`);
        console.log(`⏱️  Durée moyenne: ${metrics.avgDuration.toFixed(2)}s`);
        console.log(`🎯 Stabilité: ${metrics.isStable ? '✅ STABLE' : '❌ INSTABLE'}`);

        if (metrics.flakyTests.length > 0) {
            console.log('\n🔥 TESTS INSTABLES DÉTECTÉS:');
            metrics.flakyTests.slice(0, 10).forEach((test, index) => {
                console.log(`\n${index + 1}. ${test.fullTitle}`);
                console.log(`   📊 Taux d'échec: ${test.flakiness.toFixed(2)}%`);
                console.log(`   📈 Échecs/Succès: ${test.failures}/${test.successes}`);
                
                const lastFailure = test.runs.filter(r => r.state === 'failed').pop();
                if (lastFailure && lastFailure.error) {
                    console.log(`   ❗ Dernière erreur: ${lastFailure.error.substring(0, 100)}...`);
                }
            });
        }

        console.log('\n' + '='.repeat(80));
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async run() {
        console.log('🔍 Démarrage du moniteur de stabilité Cypress');
        console.log(`⚙️  Configuration: ${this.maxRuns} runs, seuil ${this.targetSuccessRate}%`);

        // Créer le dossier de rapports
        const reportDir = 'cypress/reports/stability';
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        try {
            for (let i = 1; i <= this.maxRuns; i++) {
                const result = await this.runCypressOnce(i);
                this.runs.push(result);

                // Attendre entre les runs sauf pour le dernier
                if (i < this.maxRuns) {
                    console.log(`   ⏳ Attente ${this.runDelay / 1000}s avant le prochain run...`);
                    await this.wait(this.runDelay);
                }
            }

            // Calculer les métriques et générer le rapport
            const metrics = this.calculateStabilityMetrics();
            this.generateStabilityReport(metrics);
            this.printDetailedReport(metrics);

            // Exit code basé sur la stabilité
            process.exit(metrics.isStable ? 0 : 1);

        } catch (error) {
            console.error('💥 Erreur lors du monitoring de stabilité:', error);
            process.exit(1);
        }
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const monitor = new CypressStabilityMonitor();
    monitor.run();
}

module.exports = CypressStabilityMonitor;