#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Lire les tâches
const tasksPath = path.join(__dirname, '../.task-master/tasks/tasks.json');
const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));

console.log(`📋 ${tasks.length} tâches trouvées\n`);

// Nettoyer les doublons et les tâches mal formatées
const cleanedTasks = [];
const seenTitles = new Set();

// Tâches prioritaires à garder (les vraies tâches importantes)
const priorityTasks = [
  "Fix failing tests in auth module",
  "Update navigation to French routes",
  "Restauration Page Planning Hebdomadaire",
  "Corriger 285 tests défaillants",
  "Migration routes françaises pour tests",
  "Améliorer couverture tests 12% → 70%",
  "Implémenter API affectations trames",
  "Optimiser performance auth < 1s",
  "Build production sans warnings",
  "0 @ts-ignore dans modules critiques"
];

tasks.forEach(task => {
  // Nettoyer le titre (enlever " medium", " high", " critical" à la fin)
  let cleanTitle = task.title
    .replace(/ (medium|high|critical)$/, '')
    .trim();
  
  // Corriger la priorité si elle n'est pas dans le titre
  let priority = task.priority;
  
  // Détection de priorité basée sur le titre original
  if (task.title.includes('critical')) priority = 'critical';
  else if (task.title.includes('high')) priority = 'high';
  else if (task.title.includes('Restauration Page Planning')) priority = 'critical';
  else if (task.title.includes('Corriger 285 tests')) priority = 'critical';
  else if (task.title.includes('Améliorer couverture')) priority = 'high';
  else if (task.title.includes('API affectations')) priority = 'high';
  
  // Ignorer les tâches mal parsées ou trop courtes
  if (cleanTitle.length < 5 || 
      cleanTitle === 'Problème' || 
      cleanTitle === 'Impact' ||
      cleanTitle === 'Estimation' ||
      cleanTitle === 'Contexte' ||
      cleanTitle === 'Fichier sauvegardé' ||
      cleanTitle === 'Solution requise' ||
      cleanTitle === 'Problème résolu' ||
      cleanTitle === 'Solution appliquée' ||
      cleanTitle === 'Extension' ||
      cleanTitle === 'Nouveau type') {
    console.log(`❌ Ignorée: ${cleanTitle}`);
    return;
  }
  
  // Éviter les doublons
  if (!seenTitles.has(cleanTitle)) {
    seenTitles.add(cleanTitle);
    cleanedTasks.push({
      ...task,
      title: cleanTitle,
      priority: priority
    });
  }
});

// Trier par priorité
const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
cleanedTasks.sort((a, b) => {
  // D'abord par priorité
  const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
  if (priorityDiff !== 0) return priorityDiff;
  
  // Ensuite, mettre les tâches prioritaires en premier
  const aIsPriority = priorityTasks.some(p => a.title.includes(p));
  const bIsPriority = priorityTasks.some(p => b.title.includes(p));
  if (aIsPriority && !bIsPriority) return -1;
  if (!aIsPriority && bIsPriority) return 1;
  
  // Sinon par date de création
  return new Date(a.created) - new Date(b.created);
});

console.log(`\n✅ ${cleanedTasks.length} tâches nettoyées (${tasks.length - cleanedTasks.length} supprimées)\n`);

// Afficher le résumé
const summary = {
  critical: cleanedTasks.filter(t => t.priority === 'critical').length,
  high: cleanedTasks.filter(t => t.priority === 'high').length,
  medium: cleanedTasks.filter(t => t.priority === 'medium').length,
  low: cleanedTasks.filter(t => t.priority === 'low').length
};

console.log('📊 Résumé par priorité:');
console.log(`   🔴 Critical: ${summary.critical}`);
console.log(`   🟠 High: ${summary.high}`);
console.log(`   🟡 Medium: ${summary.medium}`);
console.log(`   🟢 Low: ${summary.low}`);

// Sauvegarder les tâches nettoyées
fs.writeFileSync(tasksPath, JSON.stringify(cleanedTasks, null, 2));

console.log('\n✨ Tâches nettoyées et sauvegardées !');
console.log('\n🎯 Top 10 tâches prioritaires:');
cleanedTasks.slice(0, 10).forEach((task, i) => {
  console.log(`${i + 1}. [${task.priority}] ${task.title}`);
});