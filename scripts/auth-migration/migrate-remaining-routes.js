#!/usr/bin/env node

/**
 * Script pour migrer les routes restantes qui n'utilisent pas le shim
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns de remplacement spécifiques aux routes API
const routeReplacements = [
  // Import verifyAuthToken
  {
    name: 'verifyAuthToken import',
    from: /import\s*{\s*verifyAuthToken\s*}\s*from\s*['"]@\/lib\/auth-(?:utils|server-utils)['"]/g,
    to: "import { getServerSession } from '@/lib/auth/migration-shim';\nimport { authOptions } from '@/lib/auth/migration-shim'"
  },
  // Pattern pour les routes qui vérifient le token manuellement
  {
    name: 'manual token verification',
    from: /const\s+authResult\s*=\s*await\s+verifyAuthToken\([^)]*\);[\s\S]*?if\s*\(!authResult\.authenticated\)\s*{[\s\S]*?return[\s\S]*?401[\s\S]*?}/g,
    to: `const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }`
  },
  // Pattern pour récupérer l'userId depuis authResult
  {
    name: 'authResult.userId usage',
    from: /authResult\.userId/g,
    to: 'session.user.id'
  },
  // Pattern pour les headers x-user-id
  {
    name: 'x-user-id header usage',
    from: /const\s+userId\s*=\s*(?:request|req)\.headers\.get\(['"]x-user-id['"]\)/g,
    to: `const session = await getServerSession(authOptions);
    const userId = session?.user?.id`
  },
  // Import auth from lib/auth
  {
    name: 'auth import',
    from: /import\s*{\s*auth\s*}\s*from\s*['"]@\/lib\/auth['"]/g,
    to: "// auth import remplacé par migration-shim"
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

let totalFiles = 0;
let migratedFiles = 0;
let errorFiles = 0;

function migrateRoute(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = content;
    let fileModified = false;
    
    // Ignorer les fichiers déjà migrés
    if (content.includes('@/lib/auth/migration-shim')) {
      console.log(`${colors.yellow}⚠ Déjà migré: ${filePath}${colors.reset}`);
      return;
    }
    
    // Appliquer les remplacements
    routeReplacements.forEach(replacement => {
      const matches = modifiedContent.match(replacement.from);
      if (matches) {
        modifiedContent = modifiedContent.replace(replacement.from, replacement.to);
        fileModified = true;
        console.log(`${colors.cyan}  → ${replacement.name}${colors.reset}`);
      }
    });
    
    // Si modifié, sauvegarder
    if (fileModified) {
      // Créer un backup
      const backupPath = filePath + '.backup';
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, content);
      }
      
      // Écrire les modifications
      fs.writeFileSync(filePath, modifiedContent);
      
      console.log(`${colors.green}✓ Migré: ${filePath}${colors.reset}`);
      migratedFiles++;
    }
    
  } catch (error) {
    console.error(`${colors.red}✗ Erreur dans ${filePath}: ${error.message}${colors.reset}`);
    errorFiles++;
  }
  
  totalFiles++;
}

function main() {
  console.log(`${colors.blue}🔄 Migration des routes API restantes${colors.reset}`);
  console.log(`${colors.blue}=====================================${colors.reset}\n`);

  // Routes identifiées qui utilisent l'ancien système
  const routesToMigrate = [
    'src/app/api/trames/[id]/route.ts',
    'src/app/api/sectors/reorder/route.ts',
    'src/app/api/assignments/swap/route.ts',
    'src/app/api/assignments/swap/[id]/admin/route.ts',
    'src/app/api/auth/change-password/route.ts',
    'src/app/api/sectors/route.ts',
    'src/app/api/sectors/[id]/route.ts',
  ];

  console.log(`${colors.blue}📁 ${routesToMigrate.length} routes à migrer${colors.reset}\n`);

  // Migrer chaque route
  routesToMigrate.forEach(route => {
    const fullPath = path.join(process.cwd(), route);
    if (fs.existsSync(fullPath)) {
      console.log(`\n${colors.cyan}→ Migration de ${route}${colors.reset}`);
      migrateRoute(fullPath);
    } else {
      console.log(`${colors.yellow}⚠ Route non trouvée: ${route}${colors.reset}`);
    }
  });

  // Résumé
  console.log(`\n${colors.blue}📊 Résumé de migration:${colors.reset}`);
  console.log(`${colors.blue}======================${colors.reset}`);
  console.log(`Total de routes analysées: ${totalFiles}`);
  console.log(`${colors.green}✓ Migrées: ${migratedFiles}${colors.reset}`);
  console.log(`${colors.red}✗ Erreurs: ${errorFiles}${colors.reset}`);

  if (migratedFiles > 0) {
    console.log(`\n${colors.green}✅ Migration terminée !${colors.reset}`);
    console.log(`\n${colors.yellow}Prochaines étapes:${colors.reset}`);
    console.log(`1. Vérifier que les routes fonctionnent`);
    console.log(`2. Tester l'authentification`);
    console.log(`3. Supprimer les backups si tout fonctionne`);
  }
}

main();