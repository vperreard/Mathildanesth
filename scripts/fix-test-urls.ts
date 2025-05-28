#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

/**
 * Script pour corriger toutes les URLs relatives en URLs absolues dans les tests
 */

class TestUrlFixer {
  private fixedCount = 0;
  private filesFixed = 0;

  async fixAllUrls() {
    console.log('🔧 Correction des URLs dans les tests...\n');

    const testFiles = globSync('**/*.{test,spec}.{ts,tsx,js,jsx}', {
      cwd: process.cwd(),
      ignore: ['node_modules/**', 'dist/**', '.next/**', 'coverage/**'],
    });

    for (const file of testFiles) {
      const filePath = path.join(process.cwd(), file);

      try {
        if (fs.statSync(filePath).isDirectory()) continue;

        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        let localFixes = 0;

        // Pattern pour détecter fetch avec URL relative
        content = content.replace(
          /fetch\(\s*(['"`])(\/[^'"`]+)(['"`])/g,
          (match, quote1, url, quote2) => {
            // Ne pas modifier si déjà absolu
            if (url.startsWith('http://') || url.startsWith('https://')) {
              return match;
            }
            localFixes++;
            return `fetch(${quote1}http://localhost:3000${url}${quote2}`;
          }
        );

        // Pattern pour axios avec URL relative
        content = content.replace(
          /axios\.(get|post|put|delete|patch)\(\s*(['"`])(\/[^'"`]+)(['"`])/g,
          (match, method, quote1, url, quote2) => {
            // Ne pas modifier si déjà absolu
            if (url.startsWith('http://') || url.startsWith('https://')) {
              return match;
            }
            localFixes++;
            return `axios.${method}(${quote1}http://localhost:3000${url}${quote2}`;
          }
        );

        // Pattern pour request/supertest avec URL relative
        content = content.replace(
          /request\(app\)\.(get|post|put|delete|patch)\(\s*(['"`])(\/[^'"`]+)(['"`])\)/g,
          (match, method, quote1, url, quote2) => {
            // Pour supertest, on garde les URLs relatives
            return match;
          }
        );

        // Pattern pour MockedAxios avec URL relative
        content = content.replace(
          /mockAxios\.(get|post|put|delete|patch)\.mockResolvedValue[^;]+;[^}]*expect\(mockAxios\.(get|post|put|delete|patch)\)\.toHaveBeenCalledWith\(\s*(['"`])(\/[^'"`]+)(['"`])/g,
          (match, method1, method2, quote1, url, quote2) => {
            localFixes++;
            return match.replace(
              `toHaveBeenCalledWith(${quote1}${url}${quote2}`,
              `toHaveBeenCalledWith(${quote1}http://localhost:3000${url}${quote2}`
            );
          }
        );

        // Pattern pour les expectations fetch
        content = content.replace(
          /expect\(fetch\)\.toHaveBeenCalledWith\(\s*(['"`])(\/[^'"`]+)(['"`])/g,
          (match, quote1, url, quote2) => {
            localFixes++;
            return `expect(fetch).toHaveBeenCalledWith(${quote1}http://localhost:3000${url}${quote2}`;
          }
        );

        // Pattern pour global.fetch mock
        content = content.replace(
          /global\.fetch\s*=\s*jest\.fn\(\)\.mockResolvedValue[^;]+;[^}]*expect\(global\.fetch\)\.toHaveBeenCalledWith\(\s*(['"`])(\/[^'"`]+)(['"`])/g,
          (match, quote1, url, quote2) => {
            localFixes++;
            return match.replace(
              `toHaveBeenCalledWith(${quote1}${url}${quote2}`,
              `toHaveBeenCalledWith(${quote1}http://localhost:3000${url}${quote2}`
            );
          }
        );

        if (content !== originalContent) {
          fs.writeFileSync(filePath, content);
          this.filesFixed++;
          this.fixedCount += localFixes;
          console.log(`✅ ${file} - ${localFixes} URLs corrigées`);
        }
      } catch (error) {
        console.error(`❌ Erreur avec ${file}:`, error);
      }
    }

    this.generateReport();
  }

  private generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 Rapport de correction des URLs');
    console.log('='.repeat(50));
    console.log(`✅ Fichiers corrigés: ${this.filesFixed}`);
    console.log(`🔧 URLs corrigées: ${this.fixedCount}`);
    console.log('\n✨ Correction terminée!');
  }
}

// Exécution
const fixer = new TestUrlFixer();
fixer.fixAllUrls().catch(console.error);
