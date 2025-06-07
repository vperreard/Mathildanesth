#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Chemins
const oldTaskmasterPath = path.join(__dirname, '../.taskmaster/tasks');
const newTaskmasterPath = path.join(__dirname, '../.task-master/tasks/tasks.json');

// Lire les tâches actuelles (nouveau taskmaster)
const currentTasks = JSON.parse(fs.readFileSync(newTaskmasterPath, 'utf8'));
const currentTitles = new Set(currentTasks.map(t => t.title));

console.log(`📋 ${currentTasks.length} tâches dans le nouveau task-master`);

// Lire toutes les tâches de l'ancien taskmaster
const oldTasks = [];

// Lire les fichiers task_XXX.txt
const taskFiles = fs.readdirSync(oldTaskmasterPath)
  .filter(f => f.startsWith('task_') && f.endsWith('.txt'))
  .sort();

console.log(`📂 ${taskFiles.length} fichiers de tâches trouvés dans l'ancien taskmaster`);

taskFiles.forEach(file => {
  const content = fs.readFileSync(path.join(oldTaskmasterPath, file), 'utf8');
  
  // Parser le fichier
  const titleMatch = content.match(/# Title: (.+)/);
  const statusMatch = content.match(/# Status: (.+)/);
  const priorityMatch = content.match(/# Priority: (.+)/);
  const descriptionMatch = content.match(/# Description: (.+)/);
  const taskIdMatch = content.match(/# Task ID: (\d+)/);
  
  if (titleMatch && statusMatch) {
    const task = {
      id: taskIdMatch ? taskIdMatch[1] : file.replace('task_', '').replace('.txt', ''),
      title: titleMatch[1].trim(),
      status: statusMatch[1].trim(),
      priority: priorityMatch ? priorityMatch[1].trim() : 'medium',
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      fromOldTaskmaster: true
    };
    
    // Ne pas importer les tâches déjà complétées ou existantes
    if (task.status !== 'completed' && !currentTitles.has(task.title)) {
      oldTasks.push(task);
    }
  }
});

console.log(`\n✅ ${oldTasks.length} tâches non complétées trouvées à migrer`);

// Lire aussi security-cleanup-tasks.json s'il existe
const securityTasksPath = path.join(oldTaskmasterPath, 'security-cleanup-tasks.json');
if (fs.existsSync(securityTasksPath)) {
  try {
    const securityTasks = JSON.parse(fs.readFileSync(securityTasksPath, 'utf8'));
    console.log(`\n🔒 ${securityTasks.length} tâches de sécurité trouvées`);
    
    securityTasks.forEach(task => {
      if (task.status !== 'completed' && !currentTitles.has(task.title)) {
        oldTasks.push({
          ...task,
          fromSecurityCleanup: true
        });
      }
    });
  } catch (e) {
    console.error('Erreur lecture security-cleanup-tasks.json:', e.message);
  }
}

// Trier par priorité et afficher
const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
oldTasks.sort((a, b) => {
  const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
  if (priorityDiff !== 0) return priorityDiff;
  return parseInt(a.id) - parseInt(b.id);
});

console.log('\n🎯 Tâches à migrer (top 20):');
oldTasks.slice(0, 20).forEach((task, i) => {
  console.log(`${i + 1}. [${task.priority}] ${task.title}`);
  if (task.description) {
    console.log(`   → ${task.description.substring(0, 80)}...`);
  }
});

// Demander confirmation
console.log(`\n⚠️  Ajouter ${oldTasks.length} tâches au nouveau task-master ?`);
console.log('(Cela va créer de nouvelles entrées avec de nouveaux IDs)');

// Pour automatiser, on ajoute directement
const newTasks = oldTasks.map(task => ({
  id: Date.now() + Math.random().toString(36).substr(2, 9),
  title: task.title,
  priority: task.priority,
  completed: false,
  created: new Date().toISOString(),
  description: task.description,
  migratedFrom: 'old-taskmaster'
}));

// Fusionner avec les tâches actuelles
const allTasks = [...currentTasks, ...newTasks];

// Sauvegarder
fs.writeFileSync(newTaskmasterPath, JSON.stringify(allTasks, null, 2));

console.log(`\n✨ Migration terminée !`);
console.log(`📊 Total: ${allTasks.length} tâches dans task-master`);
console.log('\nUtilisez "./scripts/tm list" pour voir toutes les tâches.');