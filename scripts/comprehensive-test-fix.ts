#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Patterns pour trouver les fichiers
const FILE_PATTERNS = [
  'src/**/*.{ts,tsx,js,jsx}',
  'tests/**/*.{ts,tsx,js,jsx}',
  'cypress/**/*.{ts,tsx,js,jsx,cy.ts,spec.ts}',
];

// Fixes complets basés sur les erreurs observées
const COMPREHENSIVE_FIXES = [
  // Fix 1: URLs absolues pour fetch et axios
  {
    name: 'Fix absolute URLs',
    pattern: /fetch\((['"`])(\/[^'"`\s]+)/g,
    replacement: 'fetch($1http://localhost:3000$2'
  },
  {
    name: 'Fix absolute URLs axios',
    pattern: /axios\.(get|post|put|delete|patch)\((['"`])(\/[^'"`\s]+)/g,
    replacement: 'axios.$1($2http://localhost:3000$3'
  },
  
  // Fix 2: Mock imports manquants
  {
    name: 'Add prisma mock import',
    pattern: /^(?=.*prisma\.)(?!.*jest\.mock.*prisma)(?!.*from.*prisma)/m,
    replacement: (match, content) => {
      if (content.includes('prisma.') && !content.includes("jest.mock('@/lib/prisma')")) {
        const firstImportEnd = content.indexOf('\n\n');
        if (firstImportEnd > -1) {
          return content.slice(0, firstImportEnd) + "\n\njest.mock('@/lib/prisma');\n" + content.slice(firstImportEnd);
        }
      }
      return content;
    },
    isFunction: true
  },
  
  // Fix 3: TestFactory imports manquants
  {
    name: 'Add TestFactory import',
    pattern: /^(?=.*TestFactory\.)(?!.*import.*TestFactory)/m,
    replacement: (match, content) => {
      if (content.includes('TestFactory.') && !content.includes('import { TestFactory }')) {
        const firstImportEnd = content.indexOf('\n\n');
        if (firstImportEnd > -1) {
          return content.slice(0, firstImportEnd) + "\nimport { TestFactory } from '@/tests/factories/testFactorySimple';\n" + content.slice(firstImportEnd);
        }
      }
      return content;
    },
    isFunction: true
  },
  
  // Fix 4: Routes françaises dans les tests
  {
    name: 'Fix French routes - leaves to conges',
    pattern: /(['"`])\/leaves(['"`\/\?#])/g,
    replacement: '$1/conges$2'
  },
  {
    name: 'Fix French routes - calendar to calendrier', 
    pattern: /(['"`])\/calendar(['"`\/\?#])/g,
    replacement: '$1/calendrier$2'
  },
  {
    name: 'Fix French routes - users to utilisateurs',
    pattern: /(['"`])\/users(['"`\/\?#])/g,
    replacement: '$1/utilisateurs$2'
  },
  {
    name: 'Fix French routes - dashboard to tableau-de-bord',
    pattern: /(['"`])\/dashboard(['"`\/\?#])/g,
    replacement: '$1/tableau-de-bord$2'
  },
  {
    name: 'Fix French routes - auth/login to auth/connexion',
    pattern: /(['"`])\/auth\/login(['"`\/\?#])/g,
    replacement: '$1/auth/connexion$2'
  },
  
  // Fix 5: API routes françaises
  {
    name: 'Fix API routes - leaves to conges',
    pattern: /(['"`])\/api\/leaves/g,
    replacement: '$1/api/conges'
  },
  {
    name: 'Fix API routes - calendar to calendrier',
    pattern: /(['"`])\/api\/calendar/g,
    replacement: '$1/api/calendrier'
  },
  {
    name: 'Fix API routes - users to utilisateurs',
    pattern: /(['"`])\/api\/users/g,
    replacement: '$1/api/utilisateurs'
  },
  
  // Fix 6: Cypress specific fixes
  {
    name: 'Fix Cypress visits',
    pattern: /cy\.visit\((['"`])\/leaves/g,
    replacement: 'cy.visit($1/conges'
  },
  {
    name: 'Fix Cypress visits calendar',
    pattern: /cy\.visit\((['"`])\/calendar/g,
    replacement: 'cy.visit($1/calendrier'
  },
  {
    name: 'Fix Cypress visits dashboard',
    pattern: /cy\.visit\((['"`])\/dashboard/g,
    replacement: 'cy.visit($1/tableau-de-bord'
  },
  
  // Fix 7: Router navigation fixes
  {
    name: 'Fix router navigation',
    pattern: /router\.(push|replace)\((['"`])\/leaves/g,
    replacement: 'router.$1($2/conges'
  },
  {
    name: 'Fix router navigation calendar',
    pattern: /router\.(push|replace)\((['"`])\/calendar/g,
    replacement: 'router.$1($2/calendrier'
  },
  
  // Fix 8: Mock reset dans beforeEach
  {
    name: 'Add mock reset in beforeEach',
    pattern: /beforeEach\(\s*(?:async\s*)?\(\s*\)\s*=>\s*\{([^}]*)\}/g,
    replacement: (match, body) => {
      if (!body.includes('jest.clearAllMocks') && !body.includes('resetAllMocks')) {
        return match.replace('{', '{\n    jest.clearAllMocks();');
      }
      return match;
    }
  },
  
  // Fix 9: Replace PrismaClient direct imports
  {
    name: 'Fix PrismaClient imports',
    pattern: /import\s*{\s*PrismaClient\s*}\s*from\s*['"]@prisma\/client['"]/g,
    replacement: "import { prisma } from '@/lib/prisma'"
  },
  {
    name: 'Fix new PrismaClient()',
    pattern: /new\s+PrismaClient\(\)/g,
    replacement: 'prisma'
  }
];

// Fonction pour appliquer les fixes à un fichier
function applyFixes(filePath: string): { modified: boolean; appliedFixes: string[] } {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const appliedFixes: string[] = [];

  for (const fix of COMPREHENSIVE_FIXES) {
    try {
      if (fix.isFunction && typeof fix.replacement === 'function') {
        const newContent = fix.replacement('', content);
        if (newContent !== content) {
          content = newContent;
          appliedFixes.push(fix.name);
        }
      } else {
        const matches = content.match(fix.pattern);
        if (matches && matches.length > 0) {
          content = content.replace(fix.pattern, fix.replacement as string);
          appliedFixes.push(`${fix.name} (${matches.length} occurrences)`);
        }
      }
    } catch (error) {
      console.warn(`Error applying fix ${fix.name} to ${filePath}:`, error.message);
    }
  }

  // Écrire le fichier si modifié
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return {
    modified: content !== originalContent,
    appliedFixes,
  };
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  const targetPattern = args[0] || '**';
  
  console.log(`🔍 Recherche des fichiers avec pattern: ${targetPattern}\n`);

  let allFiles: string[] = [];
  for (const pattern of FILE_PATTERNS) {
    const files = await glob(pattern, { cwd: process.cwd() });
    allFiles = [...allFiles, ...files];
  }

  // Filtrer par pattern si spécifié
  if (targetPattern !== '**') {
    allFiles = allFiles.filter(f => f.includes(targetPattern));
  }

  // Dédupliquer et exclure node_modules
  allFiles = [...new Set(allFiles)].filter(f => !f.includes('node_modules'));

  console.log(`📁 ${allFiles.length} fichiers trouvés\n`);

  let totalModified = 0;
  const modifiedFiles: { file: string; fixes: string[] }[] = [];
  let errors = 0;

  // Traiter chaque fichier
  for (const file of allFiles) {
    const filePath = path.join(process.cwd(), file);
    
    try {
      const stats = fs.statSync(filePath);
      if (!stats.isFile()) continue;
      
      const { modified, appliedFixes } = applyFixes(filePath);
      
      if (modified) {
        totalModified++;
        modifiedFiles.push({ file, fixes: appliedFixes });
        console.log(`✅ ${file}`);
        if (appliedFixes.length <= 3) {
          appliedFixes.forEach(fix => console.log(`   - ${fix}`));
        } else {
          console.log(`   - ${appliedFixes.length} fixes appliqués`);
        }
      }
    } catch (error) {
      errors++;
      console.error(`❌ Erreur lors du traitement de ${file}:`, error.message);
    }
  }

  console.log('\n📊 Résumé:');
  console.log(`- Fichiers analysés: ${allFiles.length}`);
  console.log(`- Fichiers modifiés: ${totalModified}`);
  console.log(`- Fichiers inchangés: ${allFiles.length - totalModified - errors}`);
  console.log(`- Erreurs: ${errors}`);

  if (modifiedFiles.length > 0 && modifiedFiles.length <= 15) {
    console.log('\n📝 Détails des modifications:');
    modifiedFiles.forEach(({ file, fixes }) => {
      console.log(`\n${file}:`);
      fixes.forEach(fix => console.log(`  - ${fix}`));
    });
  }

  console.log('\n✨ Correction comprehensive terminée!');
  
  // Suggestion de commandes de test
  console.log('\n🧪 Commandes suggérées pour tester:');
  console.log('npm test -- --no-coverage --testPathPattern="auth"');
  console.log('npm test -- --no-coverage --testPathPattern="leaves"');
  console.log('npm test -- --no-coverage --testPathPattern="planning"');
}

// Exécution
main().catch(console.error);