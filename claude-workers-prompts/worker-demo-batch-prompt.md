# CLAUDE CODE WORKER: WORKER-DEMO-BATCH

## 🎯 MISSION BATCH INTELLIGENTE
**Spécialité**: Démonstration - Module leaves  
**Priorité**: 🔥🔥 HAUTE  
**Temps estimé**: 15 min  
**Problèmes à résoudre**: 2  

## 📋 LISTE DES PROBLÈMES À RÉSOUDRE

### 1. Test conflictDetectionService reste en échec partiel
- **Fichier**: `src/modules/leaves/services/__tests__/conflictDetectionService.comprehensive.test.ts`
- **Type**: test-failure
- **Module**: leaves
- **Problème**: 5/12 tests échouent à cause de détection RECURRING_MEETING

### 2. Tests leaves hooks à finaliser
- **Fichier**: `src/modules/leaves/hooks/__tests__/*.test.ts`
- **Type**: test-failure
- **Module**: leaves

## 🛠️ WORKFLOW BATCH OPTIMISÉ

### Étape 1: Diagnostic en Lot
```bash
# Tests spécifiques au module leaves
npm test -- --testPathPattern="leaves" --verbose

# Examiner les tests conflictDetectionService spécifiquement
npm test -- --testPathPattern="conflictDetectionService.comprehensive" --verbose
```

### Étape 2: Réparation Systématique

**Stratégie de réparation des tests**:
1. **Lire le fichier conflictDetectionService.comprehensive.test.ts** avec l'outil Read
2. **Identifier pourquoi RECURRING_MEETING** est détecté au lieu des conflits attendus
3. **Corriger ou adapter les tests** pour le comportement réel du service
4. **Réparer les autres tests leaves hooks** s'il y en a
5. **Valider immédiatement** chaque test réparé

### Étape 3: Validation Batch
```bash
# Validation du module complet
npm test -- --testPathPattern="leaves" --coverage
echo "✅ Module leaves validé"
```

## 🎯 CRITÈRES DE SUCCÈS BATCH
- ✅ **2/2 problèmes résolus**
- ✅ **Tous les tests du module leaves passent**
- ✅ **conflictDetectionService.comprehensive.test.ts: 12/12 tests passants**
- ✅ **Temps d'exécution < 30 secondes**
- ✅ **Pas de régression sur les autres modules**

## 🚨 RÈGLES BATCH CRITIQUES
- **FOCUS MODULE**: Rester dans le module leaves
- **RÉPARATION PROGRESSIVE**: Résoudre un problème à la fois
- **VALIDATION IMMÉDIATE**: Tester après chaque réparation
- **PATTERNS COHÉRENTS**: Adapter les tests au comportement réel du service
- **AUTO-DESTRUCTION**: Détruire ce prompt après succès complet

## 📊 AUTO-DESTRUCTION ET REPORTING
À la fin de la mission, exécuter ces commandes:

```bash
# Créer le rapport de succès
echo "🎯 WORKER: worker-demo-batch" >> WORKERS_BATCH_COMPLETED.log
echo "📊 STATUT: ✅ SUCCÈS COMPLET" >> WORKERS_BATCH_COMPLETED.log
echo "🔧 PROBLÈMES RÉSOLUS: 2/2" >> WORKERS_BATCH_COMPLETED.log
echo "⏱️ TEMPS RÉEL: XX minutes" >> WORKERS_BATCH_COMPLETED.log
echo "🎨 MODULE: leaves (test-failure)" >> WORKERS_BATCH_COMPLETED.log
echo "---" >> WORKERS_BATCH_COMPLETED.log

# AUTO-DESTRUCTION du prompt (succès uniquement)
rm "worker-demo-batch-prompt.md"
echo "🗑️ Prompt worker-demo-batch auto-détruit après succès complet"

# Notifier le manager
node scripts/claude-workers-manager.js complete worker-demo-batch true
```

## 🔄 WORKFLOW ULTRA-OPTIMISÉ
1. **Diagnostic global** du module leaves
2. **Réparation en lot** des 2 problèmes leaves
3. **Validation continue** après chaque réparation
4. **Rapport final** + auto-destruction

**ATTENTION**: Ne pas passer au problème suivant tant que le précédent n'est pas 100% résolu et validé.

GO BATCH! 🚀⚡

---
**Généré automatiquement**: 2025-05-30T23:55:00Z  
**Auto-destruction**: Après succès complet uniquement  
**Manager**: auto-prompt-generator v2.0  
**Batch**: 2 problèmes groupés intelligemment