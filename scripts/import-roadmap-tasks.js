#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Lire la ROADMAP
const roadmapPath = path.join(__dirname, '../docs/04_roadmap/ROADMAP.md');
const roadmapContent = fs.readFileSync(roadmapPath, 'utf8');

// Parser les tâches en cours et à faire
const tasks = [];

// Pattern pour trouver les tâches avec [ ] (non complétées)
const taskPattern = /- \[ \] \*\*(.+?)\*\*(?:\s*:\s*(.+?))?(?:\s*[✅⚠️🔴🐌])?$/gm;
let match;

while ((match = taskPattern.exec(roadmapContent)) !== null) {
  const title = match[1].trim();
  const description = match[2] ? match[2].trim() : '';
  
  // Déterminer la priorité basée sur les indicateurs
  let priority = 'medium';
  if (match[0].includes('🔴') || match[0].includes('URGENT') || match[0].includes('CRITIQUE')) {
    priority = 'critical';
  } else if (match[0].includes('⚠️') || match[0].includes('PRIORITÉ')) {
    priority = 'high';
  }
  
  tasks.push({ title, description, priority });
}

// Ajouter aussi les tâches de la section "Prochaines Priorités"
const prioritiesSection = roadmapContent.match(/\*\*🚧 Prochaines Priorités[\s\S]*?\*\*🚧 En Cours/);
if (prioritiesSection) {
  const sectionTaskPattern = /- \*\*(.+?)\*\*(?:\s*:\s*(.+?))?/g;
  while ((match = sectionTaskPattern.exec(prioritiesSection[0])) !== null) {
    const title = match[1].trim();
    const description = match[2] ? match[2].trim() : '';
    
    // Éviter les doublons
    if (!tasks.find(t => t.title === title)) {
      tasks.push({ title, description, priority: 'high' });
    }
  }
}

// Tâches spécifiques importantes de la ROADMAP
const specificTasks = [
  { title: "Restauration Page Planning Hebdomadaire", priority: "critical" },
  { title: "Corriger 285 tests défaillants", priority: "critical" },
  { title: "Migration routes françaises pour tests", priority: "high" },
  { title: "Améliorer couverture tests 12% → 70%", priority: "high" },
  { title: "Implémenter API affectations trames", priority: "high" },
  { title: "Optimiser performance auth < 1s", priority: "medium" },
  { title: "Refactoring Architecture - doublons", priority: "medium" },
  { title: "Planning Unifié - consolidation", priority: "medium" },
  { title: "Templates - simplification système", priority: "medium" },
  { title: "Build production sans warnings", priority: "high" },
  { title: "0 @ts-ignore dans modules critiques", priority: "high" },
  { title: "Finaliser Sprint 2 - UX Médecin", priority: "medium" },
];

// Ajouter les tâches spécifiques sans doublons
specificTasks.forEach(task => {
  if (!tasks.find(t => t.title === task.title)) {
    tasks.push(task);
  }
});

console.log(`\n📋 ${tasks.length} tâches trouvées dans la ROADMAP\n`);

// Afficher les tâches trouvées
tasks.forEach((task, index) => {
  console.log(`${index + 1}. [${task.priority}] ${task.title}`);
  if (task.description) {
    console.log(`   → ${task.description}`);
  }
});

console.log('\n🚀 Import des tâches dans task-master...\n');

// Importer dans task-master
tasks.forEach((task, index) => {
  try {
    const cmd = `./scripts/tm add "${task.title}" ${task.priority}`;
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✅ Tâche ${index + 1}/${tasks.length} importée`);
  } catch (error) {
    console.error(`❌ Erreur pour la tâche: ${task.title}`);
  }
});

console.log('\n✨ Import terminé !');
console.log('Utilisez "./scripts/tm list" pour voir toutes les tâches.');