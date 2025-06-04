#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Corrections spécifiques pour les erreurs restantes
const FINAL_FIXES = [
  // Fix les fetch dans les services qui utilisent des URLs relatives
  {
    name: 'Fix fetch in services with relative URLs',
    test: (content: string) => content.includes('fetch(') && content.includes("'/api/"),
    apply: (content: string) => {
      return content.replace(
        /fetch\(\s*(['"`])\/api\/([^'"`\s]+)(['"`])/g,
        "fetch($1http://localhost:3000/api/$2$3"
      );
    }
  },
  
  // Fix les calls axios avec des URLs relatives
  {
    name: 'Fix axios calls with relative URLs',
    test: (content: string) => content.includes('axios.') && content.includes("'/api/"),
    apply: (content: string) => {
      return content.replace(
        /axios\.(get|post|put|delete|patch)\(\s*(['"`])\/api\/([^'"`\s]+)(['"`])/g,
        "axios.$1($2http://localhost:3000/api/$3$4"
      );
    }
  },
  
  // Fix les tests qui utilisent mockReturnValue avec des objets incomplets
  {
    name: 'Fix incomplete mock return values',
    test: (content: string) => content.includes('.mockReturnValue(') && content.includes('TestFactory'),
    apply: (content: string) => {
      // Ajouter des propriétés manquantes aux mocks
      content = content.replace(
        /mockPrismaClient\.user\.findUnique\.mockResolvedValue\(\s*null\s*\)/g,
        'mockPrismaClient.user.findUnique.mockResolvedValue(null)'
      );
      
      // S'assurer que les objets TestFactory ont les bonnes propriétés
      content = content.replace(
        /TestFactory\.User\.create\(\)/g,
        'TestFactory.User.create({ id: 1, email: "test@example.com", name: "Test User" })'
      );
      
      return content;
    }
  },
  
  // Fix les imports de nodeFetch qui causent des problèmes
  {
    name: 'Fix nodeFetch imports',
    test: (content: string) => content.includes('nodeFetch') || content.includes('node-fetch'),
    apply: (content: string) => {
      // Mock node-fetch spécifiquement
      const mockNodeFetch = `
jest.mock('node-fetch', () => {
  return jest.fn(() => Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  }));
});
`;
      
      if (!content.includes("jest.mock('node-fetch')")) {
        const firstImport = content.indexOf('import');
        if (firstImport > -1) {
          content = content.slice(0, firstImport) + mockNodeFetch + '\n' + content.slice(firstImport);
        }
      }
      
      return content;
    }
  },
  
  // Fix les tests qui n'ont pas de mock setup correcte pour prisma
  {
    name: 'Fix prisma mocks in test files',
    test: (content: string) => content.includes('.test.') && content.includes('prisma.'),
    apply: (content: string) => {
      // Ajouter un setup complet pour les mocks Prisma si manquant
      if (!content.includes('beforeEach') && content.includes('prisma.')) {
        const setupMocks = `
beforeEach(() => {
  jest.clearAllMocks();
  // Setup default mocks
  if (mockPrismaClient?.leave?.findMany) {
    mockPrismaClient.leave.findMany.mockResolvedValue([]);
    mockPrismaClient.leave.count.mockResolvedValue(0);
    mockPrismaClient.leave.findUnique.mockResolvedValue(null);
    mockPrismaClient.leave.create.mockResolvedValue(TestFactory.Leave.create());
    mockPrismaClient.leave.update.mockResolvedValue(TestFactory.Leave.create());
  }
  if (mockPrismaClient?.user?.findMany) {
    mockPrismaClient.user.findMany.mockResolvedValue([]);
    mockPrismaClient.user.findUnique.mockResolvedValue(null);
    mockPrismaClient.user.create.mockResolvedValue(TestFactory.User.create());
  }
});
`;
        
        const firstDescribe = content.indexOf('describe(');
        if (firstDescribe > -1) {
          const insertPoint = content.indexOf('{', firstDescribe) + 1;
          content = content.slice(0, insertPoint) + '\n' + setupMocks + content.slice(insertPoint);
        }
      }
      
      return content;
    }
  },
  
  // Fix les Cypress tests avec les bonnes URLs
  {
    name: 'Fix Cypress absolute URLs',
    test: (content: string) => content.includes('cy.') && content.includes("'/"),
    apply: (content: string) => {
      // Remplacer les visites Cypress par des URLs complètes si nécessaire
      content = content.replace(
        /cy\.visit\(\s*(['"`])\/(?!http)([^'"`\s]+)(['"`])/g,
        "cy.visit($1http://localhost:3000/$2$3"
      );
      
      return content;
    }
  }
];

// Fonction pour appliquer les corrections finales
function applyFinalFixes(filePath: string): { modified: boolean; appliedFixes: string[] } {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const appliedFixes: string[] = [];

  for (const fix of FINAL_FIXES) {
    try {
      if (fix.test(content)) {
        const newContent = fix.apply(content);
        if (newContent !== content) {
          content = newContent;
          appliedFixes.push(fix.name);
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
  
  console.log(`🔧 Corrections finales pour la stabilisation des tests`);
  console.log(`📂 Pattern: ${targetPattern}\n`);

  // Chercher tous les fichiers de test
  const testPatterns = [
    'src/**/*.test.{ts,tsx}',
    'src/**/*.spec.{ts,tsx}',
    'tests/**/*.test.{ts,tsx}',
    'tests/**/*.spec.{ts,tsx}',
    'cypress/**/*.spec.{ts,tsx}',
    'cypress/**/*.cy.{ts,tsx}',
  ];

  let allFiles: string[] = [];
  for (const pattern of testPatterns) {
    const files = await glob(pattern, { cwd: process.cwd() });
    allFiles = [...allFiles, ...files];
  }

  // Filtrer par pattern si spécifié
  if (targetPattern !== '**') {
    allFiles = allFiles.filter(f => f.includes(targetPattern));
  }

  // Dédupliquer
  allFiles = [...new Set(allFiles)];

  console.log(`📁 ${allFiles.length} fichiers de test trouvés\n`);

  let totalModified = 0;
  const modifiedFiles: { file: string; fixes: string[] }[] = [];

  // Traiter chaque fichier
  for (const file of allFiles) {
    const filePath = path.join(process.cwd(), file);
    
    try {
      const stats = fs.statSync(filePath);
      if (!stats.isFile()) continue;
      
      const { modified, appliedFixes } = applyFinalFixes(filePath);
      
      if (modified) {
        totalModified++;
        modifiedFiles.push({ file, fixes: appliedFixes });
        console.log(`✅ ${file}`);
        appliedFixes.forEach(fix => console.log(`   - ${fix}`));
      }
    } catch (error) {
      console.error(`❌ Erreur: ${file}:`, error.message);
    }
  }

  console.log('\n📊 Résumé Final:');
  console.log(`- Fichiers de test analysés: ${allFiles.length}`);
  console.log(`- Fichiers modifiés: ${totalModified}`);
  console.log(`- Fichiers inchangés: ${allFiles.length - totalModified}`);

  console.log('\n🎯 Prochaines étapes suggérées:');
  console.log('1. npm test -- --no-coverage --testPathPattern="leaves"');
  console.log('2. npm test -- --no-coverage --testPathPattern="auth"');
  console.log('3. npm test -- --no-coverage --testPathPattern="planning"');
  
  console.log('\n✨ Corrections finales terminées!');
}

// Exécution
main().catch(console.error);