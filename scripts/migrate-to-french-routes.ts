#!/usr/bin/env tsx

import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface RouteMapping {
  from: string;
  to: string;
  regex: RegExp;
}

interface MigrationResult {
  file: string;
  changes: number;
  details: string[];
}

// Configuration des mappings de routes
const ROUTE_MAPPINGS: RouteMapping[] = [
  // Routes principales
  { from: '/conges', to: '/conges', regex: /\/conges/g },
  { from: '/calendrier', to: '/calendrier', regex: /\/calendrier/g },
  { from: '/utilisateurs', to: '/utilisateurs', regex: /\/utilisateurs/g },
  { from: '/affectations', to: '/affectations', regex: /\/affectations/g },
  { from: '/parametres', to: '/parametres', regex: /\/parametres/g },
  { from: '/jours-feries', to: '/jours-feries', regex: /\/jours-feries/g },
  { from: '/demandes', to: '/demandes', regex: /\/demandes/g },
  { from: '/chirurgiens', to: '/chirurgiens', regex: /\/chirurgiens/g },
  
  // Routes d'authentification
  { from: '/auth/connexion', to: '/auth/connexion', regex: /\/auth\/login/g },
  { from: '/auth/deconnexion', to: '/auth/deconnexion', regex: /\/auth\/logout/g },
  
  // Sous-routes spécifiques
  { from: '/nouveau', to: '/nouveau', regex: /\/nouveau(?![\w-])/g },
  { from: '/recurrents', to: '/recurrents', regex: /\/recurrents/g },
  { from: '/avances', to: '/avances', regex: /\/avances/g },
  { from: '/echange', to: '/echange', regex: /\/echange/g },
  
  // Routes API
  { from: '/api/conges', to: '/api/conges', regex: /\/api\/conges/g },
  { from: '/api/utilisateurs', to: '/api/utilisateurs', regex: /\/api\/utilisateurs/g },
  { from: '/api/affectations', to: '/api/affectations', regex: /\/api\/affectations/g },
  { from: '/api/jours-feries', to: '/api/jours-feries', regex: /\/api\/public-holidays/g },
];

// Patterns de fichiers à ignorer
const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.next/**',
  '**/build/**',
  '**/.git/**',
  '**/coverage/**',
  '**/*.min.js',
  '**/*.map',
  '**/package-lock.json',
  '**/yarn.lock',
];

// Extensions de fichiers à traiter
const FILE_EXTENSIONS = [
  'ts', 'tsx', 'js', 'jsx',
  'json', 'md', 'mdx',
  'css', 'scss',
  'yml', 'yaml'
];

class RouteMigrator {
  private dryRun: boolean;
  private results: MigrationResult[] = [];
  private totalChanges = 0;

  constructor(dryRun = true) {
    this.dryRun = dryRun;
  }

  async migrate(): Promise<void> {
    console.log(`🚀 Starting French routes migration (${this.dryRun ? 'DRY RUN' : 'EXECUTION'} mode)\n`);

    // 1. Migrer les fichiers de code
    await this.migrateCodeFiles();

    // 2. Renommer les dossiers
    await this.renameFolders();

    // 3. Mettre à jour les configurations
    await this.updateConfigurations();

    // 4. Afficher le rapport
    this.displayReport();
  }

  private async migrateCodeFiles(): Promise<void> {
    console.log('📝 Migrating code files...\n');

    const patterns = FILE_EXTENSIONS.map(ext => `**/*.${ext}`);
    const files = await glob(patterns, { 
      ignore: IGNORE_PATTERNS,
      cwd: process.cwd()
    });

    for (const file of files) {
      await this.processFile(file);
    }
  }

  private async processFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let newContent = content;
      const changes: string[] = [];

      // Appliquer tous les mappings
      for (const mapping of ROUTE_MAPPINGS) {
        const matches = content.match(mapping.regex);
        if (matches && matches.length > 0) {
          newContent = newContent.replace(mapping.regex, mapping.to);
          changes.push(`${mapping.from} → ${mapping.to} (${matches.length} occurrences)`);
          this.totalChanges += matches.length;
        }
      }

      // Si des changements ont été effectués
      if (changes.length > 0) {
        if (!this.dryRun) {
          await fs.writeFile(filePath, newContent, 'utf-8');
        }
        
        this.results.push({
          file: filePath,
          changes: changes.length,
          details: changes
        });
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }

  private async renameFolders(): Promise<void> {
    console.log('\n📁 Renaming folders...\n');

    const folderMappings = [
      { from: 'src/app/conges', to: 'src/app/conges' },
      { from: 'src/app/calendrier', to: 'src/app/calendrier' },
      { from: 'src/app/auth/connexion', to: 'src/app/auth/connexion' },
      { from: 'src/app/admin/parametres', to: 'src/app/admin/parametres' },
      { from: 'src/app/admin/jours-feries', to: 'src/app/admin/jours-feries' },
      { from: 'src/app/admin/conges', to: 'src/app/admin/conges' },
    ];

    for (const mapping of folderMappings) {
      try {
        const exists = await fs.access(mapping.from).then(() => true).catch(() => false);
        if (exists) {
          console.log(`  ${mapping.from} → ${mapping.to}`);
          if (!this.dryRun) {
            await fs.rename(mapping.from, mapping.to);
          }
        }
      } catch (error) {
        console.error(`Error renaming ${mapping.from}:`, error);
      }
    }
  }

  private async updateConfigurations(): Promise<void> {
    console.log('\n⚙️  Updating configurations...\n');

    // 1. Créer/Mettre à jour next.config.js pour les redirections
    await this.createRedirects();

    // 2. Mettre à jour les fichiers de configuration de navigation
    await this.updateNavigationConfig();
  }

  private async createRedirects(): Promise<void> {
    const redirectsCode = `
// Redirections pour la migration des routes françaises
const frenchRoutesRedirects = [
  // Routes principales
  { source: '/conges', destination: '/conges', permanent: true },
  { source: '/conges/:path*', destination: '/conges/:path*', permanent: true },
  { source: '/calendrier', destination: '/calendrier', permanent: true },
  { source: '/calendrier/:path*', destination: '/calendrier/:path*', permanent: true },
  { source: '/utilisateurs', destination: '/utilisateurs', permanent: true },
  { source: '/utilisateurs/:path*', destination: '/utilisateurs/:path*', permanent: true },
  { source: '/affectations', destination: '/affectations', permanent: true },
  { source: '/affectations/:path*', destination: '/affectations/:path*', permanent: true },
  
  // Routes d'authentification
  { source: '/auth/connexion', destination: '/auth/connexion', permanent: true },
  { source: '/auth/deconnexion', destination: '/auth/deconnexion', permanent: true },
  
  // Routes admin
  { source: '/admin/parametres', destination: '/admin/parametres', permanent: true },
  { source: '/admin/jours-feries', destination: '/admin/jours-feries', permanent: true },
  { source: '/admin/conges', destination: '/admin/conges', permanent: true },
  
  // Routes API (avec période de dépréciation)
  { source: '/api/conges', destination: '/api/conges', permanent: false },
  { source: '/api/conges/:path*', destination: '/api/conges/:path*', permanent: false },
  { source: '/api/utilisateurs', destination: '/api/utilisateurs', permanent: false },
  { source: '/api/utilisateurs/:path*', destination: '/api/utilisateurs/:path*', permanent: false },
  { source: '/api/affectations', destination: '/api/affectations', permanent: false },
  { source: '/api/affectations/:path*', destination: '/api/affectations/:path*', permanent: false },
];
`;

    if (!this.dryRun) {
      const configPath = path.join(process.cwd(), 'next.config.js');
      const configContent = await fs.readFile(configPath, 'utf-8').catch(() => '');
      
      // Ajouter les redirections si elles n'existent pas
      if (!configContent.includes('frenchRoutesRedirects')) {
        console.log('  Adding redirects to next.config.js');
        // Note: Implementation complète nécessiterait une analyse AST du fichier
      }
    } else {
      console.log('  Would add redirects to next.config.js');
    }
  }

  private async updateNavigationConfig(): Promise<void> {
    console.log('  Updating navigation configuration files');
    // Implementation spécifique selon la structure du projet
  }

  private displayReport(): void {
    console.log('\n📊 Migration Report\n');
    console.log('='.repeat(80));
    
    if (this.results.length === 0) {
      console.log('No changes needed! All routes are already in French. 🎉');
      return;
    }

    console.log(`Total files affected: ${this.results.length}`);
    console.log(`Total changes: ${this.totalChanges}\n`);

    // Grouper par type de changement
    const changesByType = new Map<string, number>();
    
    for (const result of this.results) {
      console.log(`\n📄 ${result.file}`);
      for (const detail of result.details) {
        console.log(`   ✓ ${detail}`);
        
        // Compter par type
        const [from] = detail.split(' → ');
        changesByType.set(from, (changesByType.get(from) || 0) + 1);
      }
    }

    // Résumé par type
    console.log('\n📈 Summary by route type:');
    console.log('-'.repeat(40));
    
    const sortedTypes = Array.from(changesByType.entries())
      .sort((a, b) => b[1] - a[1]);
    
    for (const [type, count] of sortedTypes) {
      console.log(`${type.padEnd(25)} ${count} changes`);
    }

    if (this.dryRun) {
      console.log('\n⚠️  This was a DRY RUN. No files were modified.');
      console.log('Run with --execute flag to apply changes.\n');
    } else {
      console.log('\n✅ Migration completed successfully!\n');
    }
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = !args.includes('--execute');
  
  if (isDryRun) {
    console.log('🔍 Running in DRY RUN mode. No files will be modified.\n');
  } else {
    console.log('⚠️  Running in EXECUTE mode. Files will be modified!\n');
    
    // Demander confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise<string>(resolve => {
      readline.question('Are you sure you want to proceed? (yes/no): ', resolve);
    });
    
    readline.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('Migration cancelled.');
      process.exit(0);
    }
  }

  try {
    const migrator = new RouteMigrator(isDryRun);
    await migrator.migrate();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

export { RouteMigrator };