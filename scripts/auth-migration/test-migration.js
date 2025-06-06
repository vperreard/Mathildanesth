#!/usr/bin/env node

/**
 * Script de test pour vérifier que les remplacements fonctionnent
 * Teste quelques fichiers avant de lancer la migration complète
 */

const fs = require('fs');
const path = require('path');

// Fichiers de test à migrer en premier
const testFiles = [
  'src/app/api/absences/route.ts',
  'src/components/ContextualMessagePanel.tsx',
  'src/app/api/admin/leaves/pending/route.ts',
];

// Patterns de remplacement pour les imports
const importReplacements = [
  {
    name: 'getServerSession from next-auth',
    from: /import\s*{\s*getServerSession\s*}\s*from\s*['"]next-auth(?:\/next)?['"]/g,
    to: "import { getServerSession } from '@/lib/auth/migration-shim'"
  },
  {
    name: 'useSession from next-auth/react',
    from: /import\s*{\s*useSession\s*}\s*from\s*['"]next-auth\/react['"]/g,
    to: "import { useSession } from '@/lib/auth/migration-shim'"
  },
  {
    name: 'authOptions import',
    from: /import\s*{\s*authOptions\s*}\s*from\s*['"]@\/lib\/auth(?:\/authOptions)?['"]/g,
    to: "import { authOptions } from '@/lib/auth/migration-shim'"
  },
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

function testFile(filePath) {
  console.log(`\n${colors.blue}Testing: ${filePath}${colors.reset}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`${colors.red}✗ File not found${colors.reset}`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let modifiedContent = content;
  let changes = [];

  // Appliquer les remplacements
  importReplacements.forEach(replacement => {
    const matches = content.match(replacement.from);
    if (matches) {
      modifiedContent = modifiedContent.replace(replacement.from, replacement.to);
      changes.push({
        type: replacement.name,
        count: matches.length,
        before: matches[0],
        after: replacement.to
      });
    }
  });

  if (changes.length > 0) {
    console.log(`${colors.green}✓ Found ${changes.length} pattern(s) to replace:${colors.reset}`);
    changes.forEach(change => {
      console.log(`  ${colors.yellow}→ ${change.type} (${change.count}x)${colors.reset}`);
      console.log(`    ${colors.red}Before: ${change.before}${colors.reset}`);
      console.log(`    ${colors.green}After:  ${change.after}${colors.reset}`);
    });

    // Créer un backup
    const backupPath = filePath + '.backup';
    fs.writeFileSync(backupPath, content);
    console.log(`${colors.cyan}  Backup created: ${backupPath}${colors.reset}`);

    // Écrire les modifications
    fs.writeFileSync(filePath, modifiedContent);
    console.log(`${colors.green}  ✓ File updated successfully${colors.reset}`);
    
    return true;
  } else {
    console.log(`${colors.yellow}⚠ No NextAuth imports found${colors.reset}`);
    return false;
  }
}

function main() {
  console.log(`${colors.blue}🧪 Testing NextAuth → JWT Custom migration${colors.reset}`);
  console.log(`${colors.blue}===========================================${colors.reset}`);

  let successCount = 0;
  let totalCount = testFiles.length;

  testFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (testFile(fullPath)) {
      successCount++;
    }
  });

  console.log(`\n${colors.blue}Summary:${colors.reset}`);
  console.log(`${colors.green}✓ Successfully migrated: ${successCount}/${totalCount} files${colors.reset}`);

  if (successCount === totalCount) {
    console.log(`\n${colors.green}✅ Test migration successful!${colors.reset}`);
    console.log(`${colors.yellow}Next steps:${colors.reset}`);
    console.log(`  1. Run 'npm run verify:quick' to check for TypeScript errors`);
    console.log(`  2. Test the migrated endpoints manually`);
    console.log(`  3. If all good, run the full migration script`);
  } else {
    console.log(`\n${colors.red}❌ Some files failed to migrate${colors.reset}`);
  }
}

main();