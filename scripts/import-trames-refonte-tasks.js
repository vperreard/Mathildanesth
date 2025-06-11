#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚨 IMPORT DES TÂCHES PRIORITAIRES - REFONTE MODULE TRAMES/AFFECTATIONS\n');

// Définition des tâches prioritaires de refonte
const tasks = [
  // PHASE 1 : STABILISATION URGENTE (1-2 jours) - PRIORITÉ MAXIMALE
  {
    title: "TRAMES - Phase 1.1: Éliminer rechargements intempestifs (30min)",
    priority: "critical",
    description: "Supprimer refresh auto 30s, conserver refresh manuel uniquement"
  },
  {
    title: "TRAMES - Phase 1.2: Corriger URLs hardcodées (1h)",
    priority: "critical",
    description: "Remplacer localhost:3000, créer config/api-endpoints.ts centralisé"
  },
  {
    title: "TRAMES - Phase 1.3: Fix toasts multiples (1h)",
    priority: "critical",
    description: "ToastManager singleton, limite 3 toasts, auto-dismiss 3s"
  },
  {
    title: "TRAMES - Phase 1.4: Bug semaines paires/impaires (2-3h)",
    priority: "critical",
    description: "Hériter weekType trame, adapter filtrage, limiter sélecteur"
  },
  
  // PHASE 2 : OPTIMISATION PERFORMANCE (3-4 jours)
  {
    title: "TRAMES - Phase 2.1: React Query cache intelligent (1j)",
    priority: "high",
    description: "Hooks useTrameModeles, cache 5min, pas de refetch window focus"
  },
  {
    title: "TRAMES - Phase 2.2: Unifier routes API (1j)",
    priority: "high",
    description: "Structure cohérente, batch operations, pagination"
  },
  {
    title: "TRAMES - Phase 2.3: Optimistic Updates (1j)",
    priority: "high",
    description: "Updates locales immédiates, rollback auto, queue sync offline"
  },
  {
    title: "TRAMES - Phase 2.4: WebSockets temps réel (1j)",
    priority: "high",
    description: "Canal par trame, events affectations, indicateur utilisateurs"
  },
  
  // PHASE 3 : RÉVOLUTION ERGONOMIQUE (4-5 jours)
  {
    title: "TRAMES - Phase 3.1: Menu contextuel clic-droit (1.5j)",
    priority: "medium",
    description: "Ajouter affectation, affecter chirurgien par spécialité, appliquer ligne"
  },
  {
    title: "TRAMES - Phase 3.2: Actions rapides et drag-drop (1.5j)",
    priority: "medium",
    description: "Double-clic édition, drag entre salles/jours, multi-sélection"
  },
  {
    title: "TRAMES - Phase 3.3: Vue unifiée ultra-rapide (1.5j)",
    priority: "medium",
    description: "Pré-charger vues, bascule instantanée, virtual scrolling"
  },
  {
    title: "TRAMES - Phase 3.4: Détection conflits visuels (0.5j)",
    priority: "medium",
    description: "Fond orange conflits, panneau latéral conflits"
  },
  
  // PHASE 4 : FEATURES ESSENTIELLES (2-3 jours)
  {
    title: "TRAMES - Phase 4.1: Drag & drop avancé (1.5j)",
    priority: "medium",
    description: "Multi-drag, Shift=copier, Alt=swap, déplacer salles ET jours"
  },
  {
    title: "TRAMES - Phase 4.2: Export PDF/Excel (1j)",
    priority: "medium",
    description: "Excel multi-feuilles, PDF A4/A3 paysage"
  },
  {
    title: "TRAMES - Phase 4.3: Semaines paires/impaires avancé (0.5j)",
    priority: "medium",
    description: "Architecture simplifiée, badges visuels"
  }
];

console.log(`📋 ${tasks.length} tâches de refonte à importer\n`);

// Afficher les tâches
tasks.forEach((task, index) => {
  const phase = Math.floor(index / 4) + 1;
  console.log(`Phase ${phase} - [${task.priority}] ${task.title}`);
  console.log(`   → ${task.description}\n`);
});

console.log('🚀 Import dans le système de tasks...\n');

// Vérifier si le script tm existe
try {
  execSync('./scripts/tm --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Le script tm n\'est pas disponible');
  console.log('💡 Essayez d\'abord: ./scripts/setup-task-master.sh');
  process.exit(1);
}

// Importer les tâches
let imported = 0;
let failed = 0;

tasks.forEach((task, index) => {
  try {
    const cmd = `./scripts/tm add "${task.title}" ${task.priority}`;
    execSync(cmd, { stdio: 'pipe' });
    imported++;
    console.log(`✅ [${index + 1}/${tasks.length}] ${task.title}`);
  } catch (error) {
    failed++;
    console.error(`❌ [${index + 1}/${tasks.length}] Échec: ${task.title}`);
  }
});

console.log('\n📊 RÉSUMÉ DE L\'IMPORT');
console.log(`✅ Importées: ${imported}`);
console.log(`❌ Échecs: ${failed}`);
console.log(`📋 Total: ${tasks.length}`);

if (imported > 0) {
  console.log('\n✨ Import terminé avec succès !');
  console.log('🔍 Utilisez "./scripts/tm list" pour voir toutes les tâches');
  console.log('📌 Utilisez "./scripts/tm priority" pour voir les tâches critiques');
  console.log('🚀 Commencez par les tâches Phase 1 (STABILISATION URGENTE)');
}

// Afficher les prochaines étapes
console.log('\n📅 PLANNING RECOMMANDÉ:');
console.log('Aujourd\'hui : Phase 1.1 + 1.2 (1h30)');
console.log('Demain : Phase 1.3 + 1.4 (3-4h)');
console.log('Semaine 1 : Phase 2 complète (4j)');
console.log('Semaine 2 : Phase 3 (5j)');
console.log('Semaine 3 : Phase 4 (3j)');