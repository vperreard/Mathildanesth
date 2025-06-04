#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

/**
 * Script d'Audit Qualité Complet - Mathildanesth
 * 
 * Combine :
 * - Tests de couverture des modules critiques
 * - Audit de performance
 * - Vérification de la qualité du code
 * - Génération de rapport consolidé
 */

class QualityAuditor {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            coverage: {},
            performance: {},
            linting: {},
            security: {},
            recommendations: [],
            score: 0
        };
    }

    async runFullAudit() {
        console.log('🔥 AUDIT QUALITÉ COMPLET - MATHILDANESTH\n');
        console.log('='.repeat(50));

        try {
            // 1. Tests de couverture
            await this.runCoverageTests();

            // 2. Audit de performance
            await this.runPerformanceAudit();

            // 3. Linting et qualité du code
            await this.runCodeQualityChecks();

            // 4. Audit de sécurité
            await this.runSecurityAudit();

            // 5. Calcul du score global
            this.calculateQualityScore();

            // 6. Génération du rapport
            await this.generateConsolidatedReport();

            console.log('\n🎉 Audit qualité terminé avec succès !');
            console.log(`📊 Score global : ${this.results.score}/100`);

        } catch (error) {
            console.error('\n❌ Erreur lors de l\'audit:', error.message);
            process.exit(1);
        }
    }

    async runCoverageTests() {
        console.log('\n📋 1. TESTS DE COUVERTURE');
        console.log('-'.repeat(30));

        try {
            // Tests modules critiques
            console.log('Tests modules critiques...');
            const criticalOutput = execSync('npm run test:critical', {
                encoding: 'utf8',
                stdio: 'pipe'
            });

            // Extraction des métriques de couverture
            const coverageMatch = criticalOutput.match(/All files\s+\|\s+([\d.]+)/);
            const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;

            this.results.coverage = {
                overall: coverage,
                critical_modules: coverage,
                target: 80,
                status: coverage >= 80 ? 'excellent' : coverage >= 60 ? 'good' : coverage >= 40 ? 'fair' : 'poor'
            };

            console.log(`✅ Couverture globale : ${coverage}%`);

        } catch (error) {
            console.log('⚠️  Tests de couverture échoués');
            this.results.coverage = {
                overall: 0,
                status: 'failed',
                error: error.message
            };
        }
    }

    async runPerformanceAudit() {
        console.log('\n⚡ 2. AUDIT DE PERFORMANCE');
        console.log('-'.repeat(30));

        try {
            // Lancement de l'audit de performance
            console.log('Analyse des performances...');
            const PerformanceAuditor = require('./performance-audit.js');
            const auditor = new PerformanceAuditor();

            await auditor.init();
            await auditor.analyzeBundles();

            const exportData = auditor.exportData();

            this.results.performance = {
                bundles_analyzed: !!exportData.summary,
                recommendations: exportData.summary ? Object.keys(exportData.summary).length : 0,
                status: 'completed'
            };

            console.log('✅ Audit de performance terminé');

        } catch (error) {
            console.log('⚠️  Audit de performance échoué');
            this.results.performance = {
                status: 'failed',
                error: error.message
            };
        }
    }

    async runCodeQualityChecks() {
        console.log('\n🔍 3. QUALITÉ DU CODE');
        console.log('-'.repeat(30));

        try {
            // ESLint
            console.log('Vérification ESLint...');
            const lintOutput = execSync('npm run lint', {
                encoding: 'utf8',
                stdio: 'pipe'
            });

            // TypeScript check
            console.log('Vérification TypeScript...');
            const typeOutput = execSync('npm run type-check', {
                encoding: 'utf8',
                stdio: 'pipe'
            });

            this.results.linting = {
                eslint: 'passed',
                typescript: 'passed',
                status: 'excellent'
            };

            console.log('✅ Qualité du code : excellente');

        } catch (error) {
            console.log('⚠️  Problèmes de qualité détectés');
            this.results.linting = {
                status: 'issues_found',
                error: error.message
            };
        }
    }

    async runSecurityAudit() {
        console.log('\n🔒 4. AUDIT DE SÉCURITÉ');
        console.log('-'.repeat(30));

        try {
            console.log('Vérification des vulnérabilités...');
            const auditOutput = execSync('npm audit --audit-level=moderate', {
                encoding: 'utf8',
                stdio: 'pipe'
            });

            this.results.security = {
                vulnerabilities: 0,
                status: 'secure'
            };

            console.log('✅ Aucune vulnérabilité critique détectée');

        } catch (error) {
            // npm audit retourne un code d'erreur s'il y a des vulnérabilités
            const vulnerabilityMatch = error.message.match(/(\d+) vulnerabilities/);
            const vulnCount = vulnerabilityMatch ? parseInt(vulnerabilityMatch[1]) : 0;

            this.results.security = {
                vulnerabilities: vulnCount,
                status: vulnCount > 10 ? 'critical' : vulnCount > 5 ? 'moderate' : 'low'
            };

            console.log(`⚠️  ${vulnCount} vulnérabilités détectées`);
        }
    }

    calculateQualityScore() {
        let score = 0;

        // Couverture de tests (40 points)
        if (this.results.coverage.overall >= 80) score += 40;
        else if (this.results.coverage.overall >= 60) score += 30;
        else if (this.results.coverage.overall >= 40) score += 20;
        else score += 10;

        // Performance (25 points)
        if (this.results.performance.status === 'completed') score += 25;
        else score += 10;

        // Qualité du code (20 points)
        if (this.results.linting.status === 'excellent') score += 20;
        else if (this.results.linting.status === 'good') score += 15;
        else score += 5;

        // Sécurité (15 points)
        if (this.results.security.status === 'secure') score += 15;
        else if (this.results.security.status === 'low') score += 10;
        else if (this.results.security.status === 'moderate') score += 5;
        else score += 0;

        this.results.score = score;

        // Recommandations basées sur le score
        if (score < 60) {
            this.results.recommendations.push('🔴 Score critique : amélioration urgente requise');
        } else if (score < 80) {
            this.results.recommendations.push('🟡 Score moyen : plusieurs améliorations nécessaires');
        } else {
            this.results.recommendations.push('🟢 Excellent score : maintenir la qualité');
        }
    }

    async generateConsolidatedReport() {
        console.log('\n📊 5. GÉNÉRATION DU RAPPORT');
        console.log('-'.repeat(30));

        const reportDir = path.join(process.cwd(), 'quality-reports');
        await fs.mkdir(reportDir, { recursive: true });

        // Rapport JSON
        const jsonReport = path.join(reportDir, `quality-audit-${Date.now()}.json`);
        await fs.writeFile(jsonReport, JSON.stringify(this.results, null, 2));

        // Rapport Markdown
        const mdReport = await this.generateMarkdownReport();
        const mdReportPath = path.join(reportDir, `quality-audit-${Date.now()}.md`);
        await fs.writeFile(mdReportPath, mdReport);

        console.log(`✅ Rapports générés :`);
        console.log(`   JSON: ${jsonReport}`);
        console.log(`   MD: ${mdReportPath}`);

        // Affichage du résumé
        this.displaySummary();
    }

    async generateMarkdownReport() {
        return `# Rapport d'Audit Qualité - ${new Date(this.results.timestamp).toLocaleDateString('fr-FR')}

## 📊 Score Global : ${this.results.score}/100

### 🎯 Résumé des Résultats

| Catégorie | Score | Statut |
|-----------|-------|--------|
| Tests de Couverture | ${this.results.coverage.overall || 0}% | ${this.results.coverage.status || 'unknown'} |
| Performance | - | ${this.results.performance.status || 'unknown'} |
| Qualité du Code | - | ${this.results.linting.status || 'unknown'} |
| Sécurité | ${this.results.security.vulnerabilities || 0} vulnérabilités | ${this.results.security.status || 'unknown'} |

### 📋 Recommandations

${this.results.recommendations.map(rec => `- ${rec}`).join('\n')}

### 📈 Détails

#### Tests de Couverture
- **Couverture actuelle :** ${this.results.coverage.overall || 0}%
- **Objectif :** ${this.results.coverage.target || 80}%
- **Statut :** ${this.results.coverage.status || 'unknown'}

#### Performance
- **Bundles analysés :** ${this.results.performance.bundles_analyzed ? 'Oui' : 'Non'}
- **Statut :** ${this.results.performance.status || 'unknown'}

#### Sécurité
- **Vulnérabilités :** ${this.results.security.vulnerabilities || 0}
- **Niveau de risque :** ${this.results.security.status || 'unknown'}

---
*Rapport généré automatiquement le ${new Date(this.results.timestamp).toLocaleString('fr-FR')}*
`;
    }

    displaySummary() {
        console.log('\n📋 RÉSUMÉ DE L\'AUDIT QUALITÉ\n');
        console.log('='.repeat(50));
        console.log(`🎯 Score Global : ${this.results.score}/100`);
        console.log(`📊 Couverture : ${this.results.coverage.overall || 0}%`);
        console.log(`⚡ Performance : ${this.results.performance.status || 'unknown'}`);
        console.log(`🔍 Code : ${this.results.linting.status || 'unknown'}`);
        console.log(`🔒 Sécurité : ${this.results.security.vulnerabilities || 0} vulnérabilités`);

        console.log('\n📋 Recommandations :');
        this.results.recommendations.forEach(rec => {
            console.log(`   ${rec}`);
        });

        console.log('\n' + '='.repeat(50));
    }
}

// Exécution principale
async function main() {
    const auditor = new QualityAuditor();
    await auditor.runFullAudit();
}

// Exécution si le script est appelé directement
if (require.main === module) {
    main().catch(console.error);
}

module.exports = QualityAuditor; 