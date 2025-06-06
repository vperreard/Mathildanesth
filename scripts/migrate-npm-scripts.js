#!/usr/bin/env node

/**
 * Script de migration des scripts NPM
 * Sauvegarde l'ancien package.json et applique la nouvelle structure optimisée
 */

const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '..', 'package.json');
const backupPath = path.join(__dirname, '..', 'package.json.backup');
const optimizedPath = path.join(__dirname, '..', 'package-optimized.json');

// Mapping des anciens scripts vers les nouveaux
const scriptMapping = {
  'dev:open': 'dev',
  'cypress': 'e2e',
  'cypress:open': 'e2e',
  'cypress:run': 'e2e:run',
  'cypress:run:headless': 'e2e:run',
  'test:bulletproof': 'test',
  'test:validate': 'validate',
  'claude:analyze': null, // Supprimé
  'claude:workers': null, // Supprimé
  'test:e2e': 'e2e:ci',
  'test:e2e:puppeteer': 'e2e:ci',
  'performance:audit': 'perf:audit',
  'audit:performance': 'perf:audit',
  'monitoring:start': 'perf:monitor',
  'monitor:start': 'perf:monitor',
  'prisma:seed': 'db:seed',
  'prisma:migrate': 'db:migrate',
  'health-check': 'health:check',
  'test:leaves': 'test:critical',
  'test:auth': 'test:critical',
  'analyze': 'perf:analyze',
  'performance:analyze': 'perf:analyze'
};

console.log('🚀 Migration des scripts NPM...\n');

// 1. Lire le package.json actuel
const currentPackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
console.log(`📊 Scripts actuels: ${Object.keys(currentPackage.scripts).length}`);

// 2. Créer une sauvegarde
fs.writeFileSync(backupPath, JSON.stringify(currentPackage, null, 2));
console.log(`✅ Sauvegarde créée: package.json.backup`);

// 3. Lire le package optimisé
const optimizedPackage = JSON.parse(fs.readFileSync(optimizedPath, 'utf8'));
console.log(`📊 Scripts optimisés: ${Object.keys(optimizedPackage.scripts).length}`);

// 4. Créer le nouveau package.json
const newPackage = {
  ...currentPackage,
  scripts: optimizedPackage.scripts
};

// 5. Écrire le nouveau package.json
fs.writeFileSync(packagePath, JSON.stringify(newPackage, null, 2));
console.log(`✅ Package.json mis à jour avec ${Object.keys(newPackage.scripts).length} scripts`);

// 6. Afficher les changements importants
console.log('\n📝 Changements importants:');
console.log('- Scripts réduits de 179 à 58');
console.log('- Structure simplifiée avec préfixes cohérents');
console.log('- Scripts Claude temporairement désactivés');
console.log('- Tests E2E unifiés sous Cypress');
console.log('- Performance scripts consolidés');

// 7. Afficher les mappings pour les scripts couramment utilisés
console.log('\n🔄 Mapping des scripts fréquents:');
const commonScripts = [
  'cypress:open → e2e',
  'test:e2e → e2e:ci',
  'prisma:migrate → db:migrate',
  'test:leaves → test:critical',
  'performance:audit → perf:audit'
];
commonScripts.forEach(mapping => console.log(`  - ${mapping}`));

// 8. Nettoyer le fichier temporaire
fs.unlinkSync(optimizedPath);
console.log('\n✅ Migration terminée!');
console.log('💡 Pour restaurer: mv package.json.backup package.json');