#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

/**
 * Script pour identifier les fichiers critiques sans tests
 */

interface FileTestStatus {
  file: string;
  testFile?: string;
  hasTest: boolean;
  isCritical: boolean;
}

class UntestedFilesIdentifier {
  private criticalPaths = [
    'src/lib/auth',
    'src/modules/leaves',
    'src/modules/planning',
    'src/services',
    'src/hooks',
  ];

  async identifyUntestedFiles() {
    console.log('🔍 Identification des fichiers sans tests...\n');

    const results: FileTestStatus[] = [];

    for (const criticalPath of this.criticalPaths) {
      const sourceFiles = globSync(`${criticalPath}/**/*.{ts,tsx}`, {
        cwd: process.cwd(),
        ignore: [
          '**/node_modules/**',
          '**/*.test.{ts,tsx}',
          '**/*.spec.{ts,tsx}',
          '**/*.d.ts',
          '**/types/**',
          '**/mocks/**',
          '**/__tests__/**',
        ],
      });

      for (const sourceFile of sourceFiles) {
        const testFile = this.findTestFile(sourceFile);
        const hasTest = !!testFile;
        const isCritical = this.isFileCritical(sourceFile);

        results.push({
          file: sourceFile,
          testFile,
          hasTest,
          isCritical,
        });
      }
    }

    this.generateReport(results);
  }

  private findTestFile(sourceFile: string): string | undefined {
    const baseName = path.basename(sourceFile, path.extname(sourceFile));
    const dirName = path.dirname(sourceFile);

    // Patterns de recherche pour les fichiers de test
    const testPatterns = [
      `${dirName}/${baseName}.test.ts`,
      `${dirName}/${baseName}.test.tsx`,
      `${dirName}/${baseName}.spec.ts`,
      `${dirName}/${baseName}.spec.tsx`,
      `${dirName}/__tests__/${baseName}.test.ts`,
      `${dirName}/__tests__/${baseName}.test.tsx`,
      `${dirName}/__tests__/${baseName}.spec.ts`,
      `${dirName}/__tests__/${baseName}.spec.tsx`,
    ];

    for (const pattern of testPatterns) {
      if (fs.existsSync(pattern)) {
        return pattern;
      }
    }

    return undefined;
  }

  private isFileCritical(file: string): boolean {
    // Services critiques
    if (file.includes('Service.ts') || file.includes('service.ts')) return true;

    // Hooks critiques
    if (file.includes('/hooks/') && file.includes('use')) return true;

    // Auth files
    if (file.includes('/auth/') || file.includes('auth.ts')) return true;

    // API routes
    if (file.includes('/api/') && file.includes('route.ts')) return true;

    // Core business logic
    if (file.includes('Calculator') || file.includes('Validator') || file.includes('Generator'))
      return true;

    return false;
  }

  private generateReport(results: FileTestStatus[]) {
    const untestedCritical = results.filter(r => !r.hasTest && r.isCritical);
    const untestedNonCritical = results.filter(r => !r.hasTest && !r.isCritical);
    const testedFiles = results.filter(r => r.hasTest);

    console.log('='.repeat(80));
    console.log('📊 RAPPORT DES FICHIERS NON TESTÉS');
    console.log('='.repeat(80) + '\n');

    console.log(`Total des fichiers analysés: ${results.length}`);
    console.log(
      `Fichiers avec tests: ${testedFiles.length} (${((testedFiles.length / results.length) * 100).toFixed(1)}%)`
    );
    console.log(
      `Fichiers sans tests: ${results.length - testedFiles.length} (${(((results.length - testedFiles.length) / results.length) * 100).toFixed(1)}%)`
    );

    if (untestedCritical.length > 0) {
      console.log('\n🚨 FICHIERS CRITIQUES SANS TESTS (Priorité haute):');
      console.log('='.repeat(50));
      untestedCritical.forEach(f => {
        console.log(`  ❌ ${f.file}`);
      });
    }

    if (untestedNonCritical.length > 0) {
      console.log('\n⚠️  AUTRES FICHIERS SANS TESTS:');
      console.log('='.repeat(50));
      untestedNonCritical.slice(0, 20).forEach(f => {
        console.log(`  - ${f.file}`);
      });
      if (untestedNonCritical.length > 20) {
        console.log(`  ... et ${untestedNonCritical.length - 20} autres fichiers`);
      }
    }

    // Sauvegarder le rapport
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        tested: testedFiles.length,
        untested: results.length - testedFiles.length,
        untestedCritical: untestedCritical.length,
        coverage: ((testedFiles.length / results.length) * 100).toFixed(1) + '%',
      },
      untestedCritical: untestedCritical.map(f => f.file),
      untestedNonCritical: untestedNonCritical.map(f => f.file),
    };

    fs.writeFileSync('untested-files-report.json', JSON.stringify(report, null, 2));
    console.log('\n✅ Rapport sauvegardé dans untested-files-report.json');
  }
}

// Exécution
const identifier = new UntestedFilesIdentifier();
identifier.identifyUntestedFiles().catch(console.error);
