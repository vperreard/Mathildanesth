#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface CoverageReport {
  module: string;
  statements: { covered: number; total: number; pct: number };
  branches: { covered: number; total: number; pct: number };
  functions: { covered: number; total: number; pct: number };
  lines: { covered: number; total: number; pct: number };
}

class TestCoverageAnalyzer {
  private results: CoverageReport[] = [];

  async analyzeCoverage() {
    console.log('🔍 Analyse de la couverture des tests\n');

    // Modules critiques à analyser
    const criticalModules = [
      { name: 'auth', pattern: 'auth' },
      { name: 'leaves', pattern: 'leaves' },
      { name: 'planning', pattern: 'planning' },
      { name: 'calendar', pattern: 'calendar' },
      { name: 'notifications', pattern: 'notification' }
    ];

    for (const module of criticalModules) {
      console.log(`📊 Analyse du module ${module.name}...`);
      try {
        // Exécuter les tests avec couverture pour ce module
        const coverageDir = `coverage-${module.name}`;
        execSync(
          `npm test -- --coverage --testPathPattern="${module.pattern}" --coverageDirectory="${coverageDir}" --coverageReporters="json-summary" --silent`,
          { 
            stdio: 'pipe',
            timeout: 60000
          }
        );

        // Lire le rapport de couverture
        const summaryPath = path.join(process.cwd(), coverageDir, 'coverage-summary.json');
        if (fs.existsSync(summaryPath)) {
          const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
          const total = summary.total;
          
          this.results.push({
            module: module.name,
            statements: {
              covered: total.statements.covered,
              total: total.statements.total,
              pct: parseFloat(total.statements.pct) || 0
            },
            branches: {
              covered: total.branches.covered,
              total: total.branches.total,
              pct: parseFloat(total.branches.pct) || 0
            },
            functions: {
              covered: total.functions.covered,
              total: total.functions.total,
              pct: parseFloat(total.functions.pct) || 0
            },
            lines: {
              covered: total.lines.covered,
              total: total.lines.total,
              pct: parseFloat(total.lines.pct) || 0
            }
          });
        }
      } catch (error) {
        console.log(`  ⚠️  Erreur lors de l'analyse du module ${module.name}`);
      }
    }

    this.generateReport();
  }

  private generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📈 RAPPORT DE COUVERTURE DES TESTS');
    console.log('='.repeat(80) + '\n');

    // Tableau récapitulatif
    console.log('Module        | Statements | Branches | Functions | Lines    | Status');
    console.log('--------------|------------|----------|-----------|----------|--------');

    for (const result of this.results) {
      const status = this.getStatus(result.lines.pct);
      console.log(
        `${result.module.padEnd(13)} | ` +
        `${this.formatPct(result.statements.pct).padEnd(10)} | ` +
        `${this.formatPct(result.branches.pct).padEnd(8)} | ` +
        `${this.formatPct(result.functions.pct).padEnd(9)} | ` +
        `${this.formatPct(result.lines.pct).padEnd(8)} | ` +
        status
      );
    }

    // Calcul de la moyenne globale
    if (this.results.length > 0) {
      const avgLines = this.results.reduce((sum, r) => sum + r.lines.pct, 0) / this.results.length;
      const avgStatements = this.results.reduce((sum, r) => sum + r.statements.pct, 0) / this.results.length;
      const avgBranches = this.results.reduce((sum, r) => sum + r.branches.pct, 0) / this.results.length;
      const avgFunctions = this.results.reduce((sum, r) => sum + r.functions.pct, 0) / this.results.length;

      console.log('--------------|------------|----------|-----------|----------|--------');
      console.log(
        `MOYENNE       | ` +
        `${this.formatPct(avgStatements).padEnd(10)} | ` +
        `${this.formatPct(avgBranches).padEnd(8)} | ` +
        `${this.formatPct(avgFunctions).padEnd(9)} | ` +
        `${this.formatPct(avgLines).padEnd(8)} | ` +
        this.getStatus(avgLines)
      );
    }

    // Détails par module
    console.log('\n📋 DÉTAILS PAR MODULE\n');
    for (const result of this.results) {
      console.log(`\n${result.module.toUpperCase()}`);
      console.log('-'.repeat(30));
      console.log(`Statements: ${result.statements.covered}/${result.statements.total} (${result.statements.pct}%)`);
      console.log(`Branches:   ${result.branches.covered}/${result.branches.total} (${result.branches.pct}%)`);
      console.log(`Functions:  ${result.functions.covered}/${result.functions.total} (${result.functions.pct}%)`);
      console.log(`Lines:      ${result.lines.covered}/${result.lines.total} (${result.lines.pct}%)`);
    }

    // Recommandations
    console.log('\n💡 RECOMMANDATIONS\n');
    for (const result of this.results) {
      if (result.lines.pct < 80) {
        console.log(`⚠️  ${result.module}: Couverture insuffisante (${result.lines.pct}% < 80%)`);
      }
    }

    // Sauvegarder le rapport
    const report = {
      timestamp: new Date().toISOString(),
      modules: this.results,
      summary: {
        avgLines: this.results.reduce((sum, r) => sum + r.lines.pct, 0) / this.results.length,
        avgStatements: this.results.reduce((sum, r) => sum + r.statements.pct, 0) / this.results.length,
        avgBranches: this.results.reduce((sum, r) => sum + r.branches.pct, 0) / this.results.length,
        avgFunctions: this.results.reduce((sum, r) => sum + r.functions.pct, 0) / this.results.length
      }
    };

    fs.writeFileSync('test-coverage-report.json', JSON.stringify(report, null, 2));
    console.log('\n✅ Rapport sauvegardé dans test-coverage-report.json');
  }

  private formatPct(pct: number): string {
    return `${pct.toFixed(1)}%`;
  }

  private getStatus(pct: number): string {
    if (pct >= 80) return '✅ OK';
    if (pct >= 60) return '⚠️  WARN';
    return '❌ FAIL';
  }
}

// Exécution
const analyzer = new TestCoverageAnalyzer();
analyzer.analyzeCoverage().catch(console.error);