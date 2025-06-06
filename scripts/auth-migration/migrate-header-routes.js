#!/usr/bin/env node

/**
 * Script pour migrer les routes qui utilisent les headers x-user-id directement
 */

const fs = require('fs');
const path = require('path');

// Patterns de remplacement pour les routes utilisant les headers
const headerReplacements = [
  // Pattern pour les headers x-user-id et x-user-role
  {
    name: 'header auth pattern',
    from: /const\s+requestHeaders\s*=\s*await\s+headers\(\);[\s\S]*?const\s+userId\s*=\s*requestHeaders\.get\(['"]x-user-id['"]\);[\s\S]*?const\s+userRole\s*=\s*requestHeaders\.get\(['"]x-user-role['"]\);[\s\S]*?if\s*\(!userId\s*\|\|\s*!userRole\)\s*{[\s\S]*?return[\s\S]*?401[\s\S]*?}/g,
    to: `const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            logger.error('GET /api/sectors: Unauthorized');
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }
        const userId = session.user.id;
        const userRole = session.user.role;`
  },
  // Pattern simple pour x-user-id seul
  {
    name: 'simple x-user-id',
    from: /const\s+userId\s*=\s*(?:request|req)\.headers\.get\(['"]x-user-id['"]\);/g,
    to: `const session = await getServerSession(authOptions);
    const userId = session?.user?.id;`
  },
  // Ajouter les imports nécessaires si pas présents
  {
    name: 'add imports',
    check: (content) => !content.includes('@/lib/auth/migration-shim'),
    add: `import { getServerSession } from '@/lib/auth/migration-shim';
import { authOptions } from '@/lib/auth/migration-shim';`
  }
];

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function migrateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = content;
    let fileModified = false;
    
    // Ignorer les fichiers déjà migrés
    if (content.includes('@/lib/auth/migration-shim')) {
      console.log(`${colors.yellow}  ⚠ Déjà migré${colors.reset}`);
      return false;
    }
    
    // Ajouter les imports si nécessaire
    const importReplacement = headerReplacements.find(r => r.check);
    if (importReplacement && importReplacement.check(content)) {
      // Ajouter après les autres imports
      const lastImportMatch = content.match(/import\s+.*from\s+['"][^'"]+['"];/g);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        modifiedContent = content.slice(0, lastImportIndex + lastImport.length) + 
                         '\n' + importReplacement.add + 
                         content.slice(lastImportIndex + lastImport.length);
        fileModified = true;
        console.log(`${colors.cyan}  → Ajout des imports${colors.reset}`);
      }
    }
    
    // Appliquer les remplacements
    headerReplacements.filter(r => r.from).forEach(replacement => {
      const matches = modifiedContent.match(replacement.from);
      if (matches) {
        modifiedContent = modifiedContent.replace(replacement.from, replacement.to);
        fileModified = true;
        console.log(`${colors.cyan}  → ${replacement.name}${colors.reset}`);
      }
    });
    
    if (fileModified) {
      // Créer un backup
      const backupPath = filePath + '.backup';
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, content);
      }
      
      // Écrire les modifications
      fs.writeFileSync(filePath, modifiedContent);
      console.log(`${colors.green}  ✓ Migré avec succès${colors.reset}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`${colors.red}  ✗ Erreur: ${error.message}${colors.reset}`);
    return false;
  }
}

function main() {
  console.log(`${colors.blue}🔄 Migration des routes utilisant les headers x-user-id${colors.reset}`);
  console.log(`${colors.blue}======================================================${colors.reset}\n`);

  // Routes identifiées
  const routesToMigrate = [
    'src/app/api/sectors/route.ts',
    'src/app/api/sectors/[id]/route.ts',
    'src/app/api/sectors/reorder-by-site/route.ts',
    'src/app/api/sectors/debug-auth/route.ts',
    'src/app/api/auth/change-password/route.ts',
    'src/app/api/assignments/route.ts',
    'src/app/api/assignments/swap/[id]/route.ts',
    'src/app/api/calendar/export/route.ts',
    'src/app/api/mon-planning/semaine/route.ts',
  ];

  let migratedCount = 0;
  let totalCount = routesToMigrate.length;

  routesToMigrate.forEach(route => {
    const fullPath = path.join(process.cwd(), route);
    if (fs.existsSync(fullPath)) {
      console.log(`${colors.cyan}→ ${route}${colors.reset}`);
      if (migrateFile(fullPath)) {
        migratedCount++;
      }
    } else {
      console.log(`${colors.yellow}⚠ Non trouvé: ${route}${colors.reset}`);
    }
  });

  console.log(`\n${colors.blue}📊 Résumé:${colors.reset}`);
  console.log(`${colors.green}✓ Migrées: ${migratedCount}/${totalCount}${colors.reset}`);
  
  if (migratedCount > 0) {
    console.log(`\n${colors.green}✅ Migration terminée !${colors.reset}`);
  }
}

main();