#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Mappings des routes pour les tests
const ROUTE_MAPPINGS = [
  { from: '/leaves', to: '/conges' },
  { from: '/calendar', to: '/calendrier' },
  { from: '/users', to: '/utilisateurs' },
  { from: '/auth/login', to: '/auth/connexion' },
  { from: '/auth/register', to: '/auth/inscription' },
  { from: '/notifications', to: '/notifications' }, // Reste identique
  { from: '/planning', to: '/planning' }, // Reste identique
  { from: '/settings', to: '/parametres' },
  { from: '/dashboard', to: '/tableau-de-bord' },
  { from: '/requests', to: '/requetes' },
  { from: '/statistics', to: '/statistiques' },
  { from: '/profile', to: '/profil' },
  { from: '/quota-management', to: '/gestion-quotas' },
  { from: '/bloc-operatoire', to: '/bloc-operatoire' }, // Reste identique
  { from: '/consultations', to: '/consultations' }, // Reste identique
  { from: '/admin', to: '/admin' }, // Reste identique
  { from: '/api/leaves', to: '/api/conges' },
  { from: '/api/calendar', to: '/api/calendrier' },
  { from: '/api/users', to: '/api/utilisateurs' },
  { from: '/api/auth/login', to: '/api/auth/connexion' },
  { from: '/api/auth/register', to: '/api/auth/inscription' },
  { from: '/api/notifications', to: '/api/notifications' },
  { from: '/api/planning', to: '/api/planning' },
  { from: '/api/dashboard', to: '/api/tableau-de-bord' },
  { from: '/api/requests', to: '/api/requetes' },
  { from: '/api/statistics', to: '/api/statistiques' },
  { from: '/api/profile', to: '/api/profil' },
];

// Patterns pour trouver les fichiers de test
const TEST_PATTERNS = [
  'src/**/*.test.{ts,tsx,js,jsx}',
  'src/**/*.spec.{ts,tsx,js,jsx}',
  'tests/**/*.test.{ts,tsx,js,jsx}',
  'tests/**/*.spec.{ts,tsx,js,jsx}',
  'cypress/**/*.spec.{ts,tsx,js,jsx}',
  'cypress/**/*.cy.{ts,tsx,js,jsx}',
  '__tests__/**/*.{ts,tsx,js,jsx}',
];

// Fonction pour remplacer les routes dans un fichier
function replaceRoutesInFile(filePath: string): { modified: boolean; changes: string[] } {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const changes: string[] = [];

  // Appliquer chaque mapping
  for (const mapping of ROUTE_MAPPINGS) {
    // Patterns pour capturer différents contextes où les routes apparaissent
    const patterns = [
      // Routes dans les strings
      new RegExp(`(['"\`])${mapping.from}(['"\`])`, 'g'),
      new RegExp(`(['"\`])${mapping.from}/`, 'g'),
      new RegExp(`(['"\`])${mapping.from}\\?`, 'g'),
      new RegExp(`(['"\`])${mapping.from}#`, 'g'),
      // Routes dans les fetch/axios calls
      new RegExp(`fetch\\((['"\`])${mapping.from}`, 'g'),
      new RegExp(`axios\\.\\w+\\((['"\`])${mapping.from}`, 'g'),
      // Routes dans les cy.visit() de Cypress
      new RegExp(`cy\\.visit\\((['"\`])${mapping.from}`, 'g'),
      // Routes dans les router.push/replace
      new RegExp(`router\\.(push|replace)\\((['"\`])${mapping.from}`, 'g'),
      // Routes dans les Link components
      new RegExp(`href=(['"\`])${mapping.from}(['"\`])`, 'g'),
      // Routes dans les assertions de test
      new RegExp(`expect\\(.*\\)\\.toBe\\((['"\`])${mapping.from}`, 'g'),
      new RegExp(`toHaveBeenCalledWith\\((['"\`])${mapping.from}`, 'g'),
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        changes.push(`${mapping.from} → ${mapping.to} (${matches.length} occurrences)`);
        
        // Remplacement approprié selon le pattern
        if (pattern.source.includes('fetch\\(') || pattern.source.includes('axios')) {
          content = content.replace(pattern, `$&`.replace(mapping.from, mapping.to));
        } else if (pattern.source.includes('cy\\.visit')) {
          content = content.replace(pattern, `cy.visit($1${mapping.to}`);
        } else if (pattern.source.includes('router\\.')) {
          content = content.replace(pattern, `router.$1($2${mapping.to}`);
        } else if (pattern.source.includes('href=')) {
          content = content.replace(pattern, `href=$1${mapping.to}$2`);
        } else {
          // Remplacement générique pour les strings
          content = content.replace(pattern, `$1${mapping.to}$2`);
        }
      }
    }
  }

  // Corrections spécifiques pour certains patterns complexes
  content = content.replace(/\/conges\//g, (match, offset) => {
    // Ne pas remplacer si c'est déjà /conges/
    const before = content.substring(Math.max(0, offset - 10), offset);
    if (before.includes("'") || before.includes('"') || before.includes('`')) {
      return match;
    }
    return match;
  });

  return {
    modified: content !== originalContent,
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

  // Dédupliquer
  allTestFiles = [...new Set(allTestFiles)];

  console.log(`📁 ${allTestFiles.length} fichiers de test trouvés\n`);

  let totalModified = 0;
  const modifiedFiles: { file: string; changes: string[] }[] = [];

  // Traiter chaque fichier
  for (const file of allTestFiles) {
    const filePath = path.join(process.cwd(), file);
    
    // Vérifier que c'est bien un fichier et pas un dossier
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      continue;
    }
    
    try {
      const { modified, changes } = replaceRoutesInFile(filePath);

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

  if (modifiedFiles.length > 0) {
    console.log('\n📝 Détails des modifications:');
    modifiedFiles.forEach(({ file, changes }) => {
      console.log(`\n${file}:`);
      changes.forEach(change => console.log(`  - ${change}`));
    });
  }

  console.log('\n✨ Correction des routes dans les tests terminée!');
}

// Exécution
main().catch(console.error);