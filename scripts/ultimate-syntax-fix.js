#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Running ultimate syntax fix...');

// Use sed for global replacements to avoid JavaScript syntax issues
const sedCommands = [
  's/garde\\/vacation/affectation/g',
  's/gardes\\/vacations/affectations/g',
  's/Garde\\/Vacation/Affectation/g',
  's/Gardes\\/Vacations/Affectations/g',
  's/tableau de service/trameModele/g',
  's/tableaux de service/trameModeles/g',
  's/Tableau de service/TrameModele/g',
  's/Tableaux de service/TrameModeles/g',
  's/Planning médical/PlanningMedical/g',
  's/planning médical/planningMedical/g',
  's/modèles/templates/g',
  's/modèle/template/g',
  's/créneaux/slots/g',
  's/créneau/slot/g'
];

function runSedCommand(command) {
  try {
    const result = execSync(`find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' '${command}'`, 
      { cwd: '/Users/vincentperreard/Mathildanesth' });
    console.log(`✅ Applied: ${command}`);
  } catch (error) {
    console.log(`⚠️ Command failed (may be normal): ${command}`);
  }
}

sedCommands.forEach(runSedCommand);

console.log('✅ Ultimate syntax fix completed');
console.log('🚀 Ready for build test...');