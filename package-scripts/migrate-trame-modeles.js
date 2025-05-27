#!/usr/bin/env node

/**
 * Script NPM pour la migration des trames
 * Usage: npm run migrate:trame-modeles [-- --dry-run] [-- --force] [-- --verbose]
 */

const { execSync } = require('child_process');
const path = require('path');

// Récupérer les arguments passés après --
const args = process.argv.slice(2);

// Construire la commande ts-node
const scriptPath = path.join(__dirname, '../scripts/migrate-bloc-trame-to-modele.ts');
const command = `npx ts-node "${scriptPath}" ${args.join(' ')}`;

console.log('🚀 Lancement de la migration des trames...');
console.log(`Commande: ${command}\n`);

try {
  execSync(command, { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
} catch (error) {
  console.error('💥 Erreur lors de l\'exécution du script de migration:', error.message);
  process.exit(1);
}