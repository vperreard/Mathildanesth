#!/usr/bin/env node

/**
 * Script de migration complète NextAuth → JWT Custom
 * Applique les remplacements à tous les fichiers du projet
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

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
    name: 'SessionProvider from next-auth/react',
    from: /import\s*{\s*SessionProvider\s*}\s*from\s*['"]next-auth\/react['"]/g,
    to: "import { SessionProvider } from '@/lib/auth/migration-shim'"
  },
  {
    name: 'signIn from next-auth/react',
    from: /import\s*{\s*signIn\s*}\s*from\s*['"]next-auth\/react['"]/g,
    to: "import { signIn } from '@/lib/auth/migration-shim'"
  },
  {
    name: 'signOut from next-auth/react',
    from: /import\s*{\s*signOut\s*}\s*from\s*['"]next-auth\/react['"]/g,
    to: "import { signOut } from '@/lib/auth/migration-shim'"
  },
  {
    name: 'authOptions import',
    from: /import\s*{\s*authOptions\s*}\s*from\s*['"]@\/lib\/auth(?:\/authOptions)?['"]/g,
    to: "import { authOptions } from '@/lib/auth/migration-shim'"
  },
  {
    name: 'NextAuth types',
    from: /import\s*(?:{[^}]+}|type\s*{[^}]+})\s*from\s*['"]next-auth['"]/g,
    to: (match) => {
      // Conserver l'import mais depuis notre shim
      return match.replace(/from\s*['"]next-auth['"]/, "from '@/lib/auth/migration-shim'");
    }
  },
  {
    name: 'JWT types from next-auth/jwt',
    from: /import\s*(?:{[^}]+}|type\s*{[^}]+})\s*from\s*['"]next-auth\/jwt['"]/g,
    to: (match) => {
      return match.replace(/from\s*['"]next-auth\/jwt['"]/, "from '@/lib/auth/migration-shim'");
    }
  },
  {
    name: 'getSession from next-auth/react',
    from: /import\s*{\s*getSession\s*}\s*from\s*['"]next-auth\/react['"]/g,
    to: "// getSession remplacé - utiliser getServerSession côté serveur ou useAuth côté client"
  },
  {
    name: 'Multiple imports from next-auth',
    from: /import\s*{\s*([^}]+)\s*}\s*from\s*['"]next-auth\/react['"]/g,
    to: (match, imports) => {
      // Gérer les imports multiples
      const importList = imports.split(',').map(i => i.trim());
      const shimImports = [];
      const comments = [];
      
      importList.forEach(imp => {
        if (['useSession', 'SessionProvider'].includes(imp)) {
          shimImports.push(imp);
        } else if (['signIn', 'signOut'].includes(imp)) {
          comments.push(`// ${imp} - utiliser les méthodes du hook useAuth`);
        } else {
          comments.push(`// ${imp} - non supporté dans la migration`);
        }
      });
      
      let result = '';
      if (shimImports.length > 0) {
        result += `import { ${shimImports.join(', ')} } from '@/lib/auth/migration-shim'`;
      }
      if (comments.length > 0) {
        result += '\n' + comments.join('\n');
      }
      return result;
    }
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

// Stats
let totalFiles = 0;
let migratedFiles = 0;
let skippedFiles = 0;
let errorFiles = 0;
let totalReplacements = 0;

function migrateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = content;
    let fileReplacements = 0;
    
    // Ignorer les fichiers déjà migrés
    if (content.includes('@/lib/auth/migration-shim')) {
      skippedFiles++;
      return;
    }
    
    // Ignorer les fichiers de test mock
    if (filePath.includes('__mocks__/next-auth')) {
      console.log(`${colors.yellow}⚠ Skipping mock file: ${filePath}${colors.reset}`);
      skippedFiles++;
      return;
    }
    
    // Appliquer les remplacements
    importReplacements.forEach(replacement => {
      const matches = modifiedContent.match(replacement.from);
      if (matches) {
        if (typeof replacement.to === 'function') {
          modifiedContent = modifiedContent.replace(replacement.from, replacement.to);
        } else {
          modifiedContent = modifiedContent.replace(replacement.from, replacement.to);
        }
        fileReplacements += matches.length;
      }
    });
    
    if (fileReplacements > 0) {
      // Créer un backup
      const backupPath = filePath + '.backup';
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, content);
      }
      
      // Écrire les modifications
      fs.writeFileSync(filePath, modifiedContent);
      
      console.log(`${colors.green}✓ ${filePath} (${fileReplacements} replacements)${colors.reset}`);
      migratedFiles++;
      totalReplacements += fileReplacements;
    }
  } catch (error) {
    console.error(`${colors.red}✗ Error in ${filePath}: ${error.message}${colors.reset}`);
    errorFiles++;
  }
  
  totalFiles++;
}

function main() {
  console.log(`${colors.blue}🔄 Starting full NextAuth → JWT Custom migration${colors.reset}`);
  console.log(`${colors.blue}================================================${colors.reset}\n`);

  // Trouver tous les fichiers TypeScript et JSX
  const files = glob.sync('src/**/*.{ts,tsx,js,jsx}', {
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/backup/**',
      '**/*.backup',
      '**/migration-shim.ts' // Ne pas migrer notre shim lui-même
    ]
  });

  console.log(`${colors.blue}📁 Found ${files.length} files to analyze${colors.reset}\n`);

  // Migrer chaque fichier
  files.forEach(file => {
    migrateFile(file);
  });

  // Résumé
  console.log(`\n${colors.blue}📊 Migration Summary:${colors.reset}`);
  console.log(`${colors.blue}═══════════════════${colors.reset}`);
  console.log(`Total files processed: ${totalFiles}`);
  console.log(`${colors.green}✓ Migrated: ${migratedFiles}${colors.reset}`);
  console.log(`${colors.yellow}⚠ Skipped: ${skippedFiles}${colors.reset}`);
  console.log(`${colors.red}✗ Errors: ${errorFiles}${colors.reset}`);
  console.log(`Total replacements: ${totalReplacements}`);

  if (migratedFiles > 0) {
    console.log(`\n${colors.green}✅ Migration completed!${colors.reset}`);
    console.log(`\n${colors.yellow}Next steps:${colors.reset}`);
    console.log(`1. Run 'npm run lint' to check for TypeScript errors`);
    console.log(`2. Test authentication flows manually`);
    console.log(`3. Run tests: 'npm test'`);
    console.log(`4. If everything works, remove NextAuth dependencies`);
  }
  
  if (errorFiles > 0) {
    console.log(`\n${colors.red}⚠️  Some files had errors. Please check them manually.${colors.reset}`);
  }
}

// Mode dry-run si --dry-run est passé
if (process.argv.includes('--dry-run')) {
  console.log(`${colors.yellow}🔍 DRY-RUN mode - no files will be modified${colors.reset}\n`);
  // TODO: Implémenter le mode dry-run
}

main();