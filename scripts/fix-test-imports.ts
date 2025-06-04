#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Patterns pour trouver les fichiers de test et les fichiers source
const FILE_PATTERNS = [
  'src/**/*.{ts,tsx,js,jsx}',
  'tests/**/*.{ts,tsx,js,jsx}',
  'cypress/**/*.{ts,tsx,js,jsx,cy.ts,spec.ts}',
  '__tests__/**/*.{ts,tsx,js,jsx}',
];

// Mappings complets incluant imports et routes
const REPLACEMENTS = [
  // Routes API
  { pattern: /(['"`])\/api\/leaves/g, replacement: '$1/api/conges' },
  { pattern: /(['"`])\/api\/calendar/g, replacement: '$1/api/calendrier' },
  { pattern: /(['"`])\/api\/users/g, replacement: '$1/api/utilisateurs' },
  { pattern: /(['"`])\/api\/auth\/login/g, replacement: '$1/api/auth/connexion' },
  { pattern: /(['"`])\/api\/auth\/register/g, replacement: '$1/api/auth/inscription' },
  { pattern: /(['"`])\/api\/dashboard/g, replacement: '$1/api/tableau-de-bord' },
  { pattern: /(['"`])\/api\/requests/g, replacement: '$1/api/requetes' },
  { pattern: /(['"`])\/api\/statistics/g, replacement: '$1/api/statistiques' },
  { pattern: /(['"`])\/api\/profile/g, replacement: '$1/api/profil' },
  
  // Routes frontend (avec gestion des slashes finaux)
  { pattern: /(['"`])\/leaves(['"`\/\?#])/g, replacement: '$1/conges$2' },
  { pattern: /(['"`])\/calendar(['"`\/\?#])/g, replacement: '$1/calendrier$2' },
  { pattern: /(['"`])\/users(['"`\/\?#])/g, replacement: '$1/utilisateurs$2' },
  { pattern: /(['"`])\/auth\/login(['"`\/\?#])/g, replacement: '$1/auth/connexion$2' },
  { pattern: /(['"`])\/auth\/register(['"`\/\?#])/g, replacement: '$1/auth/inscription$2' },
  { pattern: /(['"`])\/dashboard(['"`\/\?#])/g, replacement: '$1/tableau-de-bord$2' },
  { pattern: /(['"`])\/settings(['"`\/\?#])/g, replacement: '$1/parametres$2' },
  { pattern: /(['"`])\/requests(['"`\/\?#])/g, replacement: '$1/requetes$2' },
  { pattern: /(['"`])\/statistics(['"`\/\?#])/g, replacement: '$1/statistiques$2' },
  { pattern: /(['"`])\/profile(['"`\/\?#])/g, replacement: '$1/profil$2' },
  { pattern: /(['"`])\/quota-management(['"`\/\?#])/g, replacement: '$1/gestion-quotas$2' },
  
  // Imports de modules - NE PAS CHANGER car les modules restent en anglais
  // Mais changer les références aux pages dans les imports
  { pattern: /from ['"](.*)\/app\/leaves\//g, replacement: 'from \'$1/app/conges/' },
  { pattern: /from ['"](.*)\/app\/calendar\//g, replacement: 'from \'$1/app/calendrier/' },
  { pattern: /from ['"](.*)\/app\/users\//g, replacement: 'from \'$1/app/utilisateurs/' },
  { pattern: /from ['"](.*)\/app\/dashboard\//g, replacement: 'from \'$1/app/tableau-de-bord/' },
  { pattern: /from ['"](.*)\/app\/settings\//g, replacement: 'from \'$1/app/parametres/' },
  { pattern: /from ['"](.*)\/app\/requests\//g, replacement: 'from \'$1/app/requetes/' },
  { pattern: /from ['"](.*)\/app\/statistics\//g, replacement: 'from \'$1/app/statistiques/' },
  { pattern: /from ['"](.*)\/app\/profile\//g, replacement: 'from \'$1/app/profil/' },
  
  // Références dans les tests Cypress
  { pattern: /cy\.visit\((['"`])\/leaves/g, replacement: 'cy.visit($1/conges' },
  { pattern: /cy\.visit\((['"`])\/calendar/g, replacement: 'cy.visit($1/calendrier' },
  { pattern: /cy\.visit\((['"`])\/users/g, replacement: 'cy.visit($1/utilisateurs' },
  { pattern: /cy\.visit\((['"`])\/dashboard/g, replacement: 'cy.visit($1/tableau-de-bord' },
  { pattern: /cy\.visit\((['"`])\/settings/g, replacement: 'cy.visit($1/parametres' },
  { pattern: /cy\.visit\((['"`])\/auth\/login/g, replacement: 'cy.visit($1/auth/connexion' },
  
  // Router push/replace
  { pattern: /router\.(push|replace)\((['"`])\/leaves/g, replacement: 'router.$1($2/conges' },
  { pattern: /router\.(push|replace)\((['"`])\/calendar/g, replacement: 'router.$1($2/calendrier' },
  { pattern: /router\.(push|replace)\((['"`])\/users/g, replacement: 'router.$1($2/utilisateurs' },
  { pattern: /router\.(push|replace)\((['"`])\/dashboard/g, replacement: 'router.$1($2/tableau-de-bord' },
  { pattern: /router\.(push|replace)\((['"`])\/settings/g, replacement: 'router.$1($2/parametres' },
  { pattern: /router\.(push|replace)\((['"`])\/auth\/login/g, replacement: 'router.$1($2/auth/connexion' },
  
  // Navigation configs
  { pattern: /href:\s*(['"`])\/leaves/g, replacement: 'href: $1/conges' },
  { pattern: /href:\s*(['"`])\/calendar/g, replacement: 'href: $1/calendrier' },
  { pattern: /href:\s*(['"`])\/users/g, replacement: 'href: $1/utilisateurs' },
  { pattern: /href:\s*(['"`])\/dashboard/g, replacement: 'href: $1/tableau-de-bord' },
  { pattern: /href:\s*(['"`])\/settings/g, replacement: 'href: $1/parametres' },
  
  // Fetch/axios calls
  { pattern: /fetch\((['"`])\/api\/leaves/g, replacement: 'fetch($1/api/conges' },
  { pattern: /axios\.\w+\((['"`])\/api\/leaves/g, replacement: (match, quote) => match.replace('/api/leaves', '/api/conges') },
  { pattern: /fetch\((['"`])\/api\/calendar/g, replacement: 'fetch($1/api/calendrier' },
  { pattern: /axios\.\w+\((['"`])\/api\/calendar/g, replacement: (match, quote) => match.replace('/api/calendar', '/api/calendrier') },
  { pattern: /fetch\((['"`])\/api\/users/g, replacement: 'fetch($1/api/utilisateurs' },
  { pattern: /axios\.\w+\((['"`])\/api\/users/g, replacement: (match, quote) => match.replace('/api/users', '/api/utilisateurs') },
];

// Fonction pour remplacer dans un fichier
function replaceInFile(filePath: string): { modified: boolean; changes: string[] } {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const changes: string[] = [];

  // Appliquer chaque remplacement
  for (const { pattern, replacement } of REPLACEMENTS) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      const uniqueMatches = [...new Set(matches)];
      changes.push(`${pattern.source} → ${replacement} (${matches.length} occurrences)`);
      content = content.replace(pattern, replacement);
    }
  }

  // Écrire le fichier si modifié
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return {
    modified: content !== originalContent,
    changes,
  };
}

// Fonction principale
async function main() {
  console.log('🔍 Recherche des fichiers...\n');

  let allFiles: string[] = [];
  for (const pattern of FILE_PATTERNS) {
    const files = await glob(pattern, { cwd: process.cwd() });
    allFiles = [...allFiles, ...files];
  }

  // Dédupliquer et exclure node_modules
  allFiles = [...new Set(allFiles)].filter(f => !f.includes('node_modules'));

  console.log(`📁 ${allFiles.length} fichiers trouvés\n`);

  let totalModified = 0;
  const modifiedFiles: { file: string; changes: string[] }[] = [];
  let errors = 0;

  // Traiter chaque fichier
  for (const file of allFiles) {
    const filePath = path.join(process.cwd(), file);
    
    // Vérifier que c'est bien un fichier
    try {
      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        continue;
      }
    } catch (error) {
      continue;
    }
    
    try {
      const { modified, changes } = replaceInFile(filePath);

      if (modified) {
        totalModified++;
        modifiedFiles.push({ file, changes });
        console.log(`✅ ${file}`);
        if (changes.length <= 3) {
          changes.forEach(change => console.log(`   - ${change}`));
        } else {
          console.log(`   - ${changes.length} remplacements effectués`);
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

  if (modifiedFiles.length > 0 && modifiedFiles.length <= 20) {
    console.log('\n📝 Détails des modifications:');
    modifiedFiles.forEach(({ file, changes }) => {
      console.log(`\n${file}:`);
      changes.forEach(change => console.log(`  - ${change}`));
    });
  }

  console.log('\n✨ Correction des imports et routes terminée!');
  console.log('\n⚠️  Note: Les modules internes (/src/modules/leaves, etc.) restent en anglais.');
  console.log('Seules les routes URL et les dossiers /app/ ont été migrés en français.');
}

// Exécution
main().catch(console.error);