#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Patterns pour trouver les fichiers de test
const TEST_PATTERNS = [
  'src/**/*.test.{ts,tsx}',
  'src/**/*.spec.{ts,tsx}',
  'tests/**/*.test.{ts,tsx}',
  'tests/**/*.spec.{ts,tsx}',
];

// Fonction pour ajouter les imports de mocks manquants
function fixMockImports(content: string): string {
  let modified = content;
  
  // Si le fichier utilise prisma mais n'importe pas le mock
  if (content.includes('prisma.') && !content.includes("from '@/lib/prisma'") && !content.includes('jest.mock')) {
    // Ajouter l'import du mock après les autres imports
    const importMatch = modified.match(/^(import[\s\S]*?)\n\n/m);
    if (importMatch) {
      const imports = importMatch[1];
      if (!imports.includes('@/lib/prisma')) {
        modified = modified.replace(
          importMatch[0],
          `${imports}\nimport { prisma } from '@/lib/prisma';\n\n`
        );
      }
    }
  }
  
  // Ajouter jest.mock pour prisma si nécessaire
  if (content.includes('prisma.') && !content.includes("jest.mock('@/lib/prisma')")) {
    const firstDescribe = modified.indexOf('describe(');
    if (firstDescribe > -1) {
      modified = modified.slice(0, firstDescribe) + 
        "jest.mock('@/lib/prisma');\n\n" + 
        modified.slice(firstDescribe);
    }
  }
  
  return modified;
}

// Fonction pour corriger les problèmes de mocks Prisma
function fixPrismaMocks(content: string): string {
  let modified = content;
  
  // Remplacer les imports directs de PrismaClient
  modified = modified.replace(
    /import\s*{\s*PrismaClient\s*}\s*from\s*['"]@prisma\/client['"]/g,
    "import { prisma } from '@/lib/prisma'"
  );
  
  // Remplacer new PrismaClient() par prisma
  modified = modified.replace(
    /new\s+PrismaClient\(\)/g,
    'prisma'
  );
  
  // S'assurer que les méthodes Prisma sont mockées correctement
  if (modified.includes('prisma.') && modified.includes('beforeEach')) {
    // Chercher le beforeEach et ajouter les mocks si nécessaire
    const beforeEachMatch = modified.match(/beforeEach\(\s*(?:async\s*)?\(\)\s*=>\s*{([^}]+)}/);
    if (beforeEachMatch && !beforeEachMatch[1].includes('mockReset')) {
      const newBeforeEach = beforeEachMatch[0].replace(
        '{',
        `{
    jest.clearAllMocks();
    `
      );
      modified = modified.replace(beforeEachMatch[0], newBeforeEach);
    }
  }
  
  return modified;
}

// Fonction pour corriger les problèmes d'URL absolues
function fixAbsoluteURLs(content: string): string {
  let modified = content;
  
  // Remplacer les fetch avec des URLs relatives par des URLs absolues dans les tests
  modified = modified.replace(
    /fetch\((['"`])(\/[^'"`]+)(['"`])/g,
    "fetch($1http://localhost:3000$2$3"
  );
  
  // Même chose pour axios
  modified = modified.replace(
    /axios\.\w+\((['"`])(\/[^'"`]+)(['"`])/g,
    (match, q1, path, q2) => match.replace(`${q1}${path}`, `${q1}http://localhost:3000${path}`)
  );
  
  return modified;
}

// Fonction principale pour traiter un fichier
function processFile(filePath: string): { modified: boolean; changes: string[] } {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = content;
  const changes: string[] = [];
  
  // Appliquer les corrections
  const afterMockImports = fixMockImports(modified);
  if (afterMockImports !== modified) {
    changes.push('Added missing mock imports');
    modified = afterMockImports;
  }
  
  const afterPrismaMocks = fixPrismaMocks(modified);
  if (afterPrismaMocks !== modified) {
    changes.push('Fixed Prisma mocks');
    modified = afterPrismaMocks;
  }
  
  const afterURLs = fixAbsoluteURLs(modified);
  if (afterURLs !== modified) {
    changes.push('Fixed absolute URLs');
    modified = afterURLs;
  }
  
  // Écrire le fichier si modifié
  if (modified !== content) {
    fs.writeFileSync(filePath, modified, 'utf8');
  }
  
  return {
    modified: modified !== content,
    changes,
  };
}

// Fonction principale
async function main() {
  console.log('🔍 Recherche des fichiers de test...\n');

  let allTestFiles: string[] = [];
  for (const pattern of TEST_PATTERNS) {
    const files = await glob(pattern, { cwd: process.cwd() });
    allTestFiles = [...allTestFiles, ...files];
  }

  allTestFiles = [...new Set(allTestFiles)];
  console.log(`📁 ${allTestFiles.length} fichiers de test trouvés\n`);

  let totalModified = 0;
  const modifiedFiles: { file: string; changes: string[] }[] = [];

  // Traiter chaque fichier
  for (const file of allTestFiles) {
    const filePath = path.join(process.cwd(), file);
    
    try {
      const stats = fs.statSync(filePath);
      if (!stats.isFile()) continue;
      
      const { modified, changes } = processFile(filePath);
      
      if (modified) {
        totalModified++;
        modifiedFiles.push({ file, changes });
        console.log(`✅ ${file}`);
        changes.forEach(change => console.log(`   - ${change}`));
      }
    } catch (error) {
      console.error(`❌ Erreur lors du traitement de ${file}:`, error.message);
    }
  }

  console.log('\n📊 Résumé:');
  console.log(`- Fichiers analysés: ${allTestFiles.length}`);
  console.log(`- Fichiers modifiés: ${totalModified}`);
  console.log(`- Fichiers inchangés: ${allTestFiles.length - totalModified}`);

  console.log('\n✨ Correction des mocks terminée!');
}

// Exécution
main().catch(console.error);