#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Terminologie médicale - mapping pour les remplacements
const medicalTerminology = {
  // Navigation et UI
  'Trames': 'Tableaux de service',
  'trames': 'tableaux de service', 
  'Trame': 'Tableau de service',
  'trame': 'tableau de service',
  
  'Affectations': 'Gardes/Vacations',
  'affectations': 'gardes/vacations',
  'Affectation': 'Garde/Vacation', 
  'affectation': 'garde/vacation',
  
  'Slots': 'Créneaux',
  'slots': 'créneaux',
  'Slot': 'Créneau',
  'slot': 'créneau',
  
  'Planning Generator': 'Organisateur de planning',
  'planning generator': 'organisateur de planning',
  'Generator': 'Organisateur',
  'generator': 'organisateur',
  
  'Templates': 'Modèles',
  'templates': 'modèles',
  'Template': 'Modèle', 
  'template': 'modèle',
  
  'Assignments': 'Attributions',
  'assignments': 'attributions',
  'Assignment': 'Attribution',
  'assignment': 'attribution',
  
  'Schedule': 'Planning médical',
  'schedule': 'planning médical',
  'Scheduling': 'Planification',
  'scheduling': 'planification',
  
  // Messages et notifications
  'user assigned': 'personnel affecté',
  'assignment created': 'garde/vacation créée',
  'assignment updated': 'garde/vacation modifiée',
  'template applied': 'modèle appliqué',
  'shift assigned': 'service attribué',
  'duty assigned': 'garde attribuée',
  
  // Tooltips et descriptions
  'Create assignment': 'Créer une garde/vacation',
  'Edit assignment': 'Modifier la garde/vacation',
  'View assignments': 'Voir les gardes/vacations',
  'Generate schedule': 'Générer le planning médical',
  'Apply template': 'Appliquer le modèle',
  'Manage templates': 'Gérer les modèles',
  
  // Formulaires
  'Assignment type': 'Type de garde/vacation',
  'Template name': 'Nom du modèle',
  'Schedule period': 'Période de planning',
  'Shift duration': 'Durée du service',
  
  // Status et états
  'assigned': 'en garde/vacation',
  'scheduled': 'planifié',
  'template active': 'modèle actif',
  'slot available': 'créneau disponible',
  'slot occupied': 'créneau occupé'
};

// Extensions de fichiers à traiter
const fileExtensions = ['.tsx', '.ts', '.jsx', '.js', '.json'];

// Dossiers à ignorer
const ignoredDirs = ['node_modules', '.git', '.next', 'dist', 'build'];

// Fonction pour lire récursivement tous les fichiers
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    
    if (fs.statSync(fullPath).isDirectory()) {
      if (!ignoredDirs.includes(file)) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      const ext = path.extname(file);
      if (fileExtensions.includes(ext)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

// Fonction pour remplacer le contenu d'un fichier
function replaceInFile(filePath, replacements) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const [oldTerm, newTerm] of Object.entries(replacements)) {
      // Échapper les caractères spéciaux pour regex
      const escapedOld = oldTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Créer regex avec boundaries pour éviter les remplacements partiels
      const regex = new RegExp(`\\b${escapedOld}\\b`, 'g');
      
      if (regex.test(content)) {
        content = content.replace(regex, newTerm);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Erreur lors du traitement de ${filePath}:`, error.message);
    return false;
  }
}

// Fonction principale
function updateMedicalTerminology() {
  console.log('🏥 Mise à jour de la terminologie médicale...\n');
  
  const srcPath = path.join(process.cwd(), 'src');
  const allFiles = getAllFiles(srcPath);
  
  let totalFiles = 0;
  let modifiedFiles = 0;
  let totalReplacements = 0;
  
  console.log(`📁 Traitement de ${allFiles.length} fichiers...\n`);
  
  allFiles.forEach(filePath => {
    totalFiles++;
    
    const wasModified = replaceInFile(filePath, medicalTerminology);
    
    if (wasModified) {
      modifiedFiles++;
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`✅ ${relativePath}`);
      
      // Compter les remplacements dans ce fichier
      const content = fs.readFileSync(filePath, 'utf8');
      let fileReplacements = 0;
      
      for (const oldTerm of Object.keys(medicalTerminology)) {
        const escapedOld = oldTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedOld}\\b`, 'g');
        const matches = content.match(regex);
        if (matches) {
          fileReplacements += matches.length;
        }
      }
      
      totalReplacements += fileReplacements;
    }
  });
  
  console.log('\n📊 Résumé de la mise à jour:');
  console.log(`   • Fichiers traités: ${totalFiles}`);
  console.log(`   • Fichiers modifiés: ${modifiedFiles}`);
  console.log(`   • Total des remplacements: ${totalReplacements}`);
  
  // Traitement spécial pour les fichiers de configuration
  console.log('\n🔧 Mise à jour des fichiers de configuration...');
  
  // Mettre à jour package.json si nécessaire
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    replaceInFile(packageJsonPath, {
      '"name": "planning-generator"': '"name": "organisateur-planning"',
      '"description": "Planning generator"': '"description": "Organisateur de planning médical"'
    });
  }
  
  // Mettre à jour les fichiers README
  const readmePath = path.join(process.cwd(), 'README.md');
  if (fs.existsSync(readmePath)) {
    replaceInFile(readmePath, medicalTerminology);
    console.log('✅ README.md');
  }
  
  console.log('\n🎯 Terminologie médicale mise à jour avec succès!');
  console.log('\n📋 Changements principaux:');
  console.log('   • "Trames" → "Tableaux de service"');
  console.log('   • "Affectations" → "Gardes/Vacations"'); 
  console.log('   • "Slots" → "Créneaux"');
  console.log('   • "Planning Generator" → "Organisateur de planning"');
  console.log('   • "Templates" → "Modèles"');
  
  console.log('\n⚠️  Recommandations:');
  console.log('   1. Vérifiez les changements avec git diff');
  console.log('   2. Testez l\'application après les modifications');
  console.log('   3. Mettez à jour la documentation si nécessaire');
  
  return {
    totalFiles,
    modifiedFiles,
    totalReplacements
  };
}

// Script de validation pour vérifier que tous les termes ont été remplacés
function validateTerminology() {
  console.log('\n🔍 Validation de la terminologie...');
  
  const srcPath = path.join(process.cwd(), 'src');
  const allFiles = getAllFiles(srcPath);
  
  const oldTerms = Object.keys(medicalTerminology);
  const foundTerms = new Map();
  
  allFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    oldTerms.forEach(term => {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedTerm}\\b`, 'g');
      const matches = content.match(regex);
      
      if (matches) {
        if (!foundTerms.has(term)) {
          foundTerms.set(term, []);
        }
        foundTerms.get(term).push({
          file: path.relative(process.cwd(), filePath),
          count: matches.length
        });
      }
    });
  });
  
  if (foundTerms.size === 0) {
    console.log('✅ Aucun ancien terme trouvé - terminologie mise à jour avec succès!');
  } else {
    console.log('⚠️  Anciens termes encore présents:');
    foundTerms.forEach((occurrences, term) => {
      console.log(`\n   "${term}":`);
      occurrences.forEach(occ => {
        console.log(`     - ${occ.file} (${occ.count}x)`);
      });
    });
  }
  
  return foundTerms.size === 0;
}

// Exécution du script
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--validate')) {
    validateTerminology();
  } else if (args.includes('--help')) {
    console.log('Usage: node update-medical-terminology.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --validate    Vérifie que tous les termes ont été remplacés');
    console.log('  --help        Affiche cette aide');
    console.log('');
    console.log('Par défaut: met à jour la terminologie médicale dans tous les fichiers');
  } else {
    const result = updateMedicalTerminology();
    
    if (args.includes('--validate-after')) {
      setTimeout(() => validateTerminology(), 1000);
    }
  }
}

module.exports = {
  updateMedicalTerminology,
  validateTerminology,
  medicalTerminology
};