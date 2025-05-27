const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Mapping des anciens imports vers les nouveaux
const importMappings = {
  '@/services/blocPlanningService': '@/modules/planning/bloc-operatoire/services/blocPlanningService',
  '../services/blocPlanningService': '@/modules/planning/bloc-operatoire/services/blocPlanningService',
  '../../services/blocPlanningService': '@/modules/planning/bloc-operatoire/services/blocPlanningService',
  '@/services/blocPlanningDragDropService': '@/modules/planning/bloc-operatoire/services/blocPlanningDragDropService',
  '@/services/blocPlanningApi': '@/modules/planning/bloc-operatoire/services/blocPlanningService',
  '@/services/blocPlanningValidator': '@/modules/planning/bloc-operatoire/services/blocPlanningService',
};

// Trouver tous les fichiers TypeScript
const files = glob.sync('src/**/*.{ts,tsx}', { ignore: 'node_modules/**' });

let totalUpdates = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let updated = false;

  // Remplacer chaque import
  Object.entries(importMappings).forEach(([oldImport, newImport]) => {
    // Pattern pour capturer les différents formats d'import
    const patterns = [
      new RegExp(`from ['"]${oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g'),
      new RegExp(`from "${oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
      new RegExp(`from '${oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g'),
    ];

    patterns.forEach(pattern => {
      if (content.match(pattern)) {
        content = content.replace(pattern, `from '${newImport}'`);
        updated = true;
      }
    });
  });

  if (updated) {
    fs.writeFileSync(file, content);
    console.log(`✅ Updated: ${file}`);
    totalUpdates++;
  }
});

console.log(`\n📊 Total files updated: ${totalUpdates}`);

// Vérifier s'il reste des imports non migrés
console.log('\n🔍 Checking for remaining old imports...');
const remainingOldImports = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('from \'@/services/bloc') || 
      content.includes('from "@/services/bloc') ||
      content.includes('../services/bloc')) {
    remainingOldImports.push(file);
  }
});

if (remainingOldImports.length > 0) {
  console.log(`\n⚠️  Found ${remainingOldImports.length} files with old imports:`);
  remainingOldImports.forEach(file => console.log(`  - ${file}`));
} else {
  console.log('\n✅ All imports have been migrated successfully!');
}