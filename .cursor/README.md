# Configuration Cursor - Mathildanesth

## Organisation des Règles

Le système de règles Cursor a été adapté pour refléter la nouvelle organisation de la documentation.

### 📁 Règles Actives

#### 1. **documentation-essentielles-lite.json**
- **Déclencheur** : `plan|roadmap|aperçu|vision|stratégie|global`
- **Chargement** : Documentation stratégique et roadmap
- **Fichiers** :
  - `docs/04_roadmap/ROADMAP.md`
  - `docs/02_implementation/NEXT_STEPS.md`
  - `docs/04_roadmap/URGENT_TODO_ACTION_PLAN.md`
  - `docs/README.md`

#### 2. **standards-developpement.json** ✨ *Nouveau*
- **Déclencheur** : `typescript|test|standard|guideline|architecture|pattern|convention|règle|norme`
- **Chargement** : Standards techniques et guides de développement
- **Fichiers** :
  - `docs/01_architecture/TYPESCRIPT_GUIDELINES.md`
  - `docs/01_architecture/TESTING_GUIDELINES.md`
  - `docs/01_architecture/TECHNICAL_DEBT_REDUCTION_REPORT.md`
  - `docs/01_architecture/INTEGRATION.md`

#### 3. **performance-optimisation.json** ✨ *Nouveau*
- **Déclencheur** : `performance|optimisation|lent|lenteur|cache|speed|bundle|lighthouse|audit`
- **Chargement** : Documentation de performance et optimisations
- **Fichiers** :
  - `docs/03_performance/PERFORMANCE_AUDIT_REPORT.md`
  - `docs/03_performance/OPTIMISATIONS_REALISEES.md`
  - `docs/03_performance/SIMULATION_OPTIMIZATIONS.md`
  - `docs/technique/performance-optimization.md`

#### 4. **interactive-feedback.json**
- **Déclencheur** : Questions de validation
- **Action** : Déclenche le feedback interactif

#### 5. **test-runner.json**
- **Déclencheur** : Commandes de test
- **Action** : Exécution automatisée des tests

#### 6. **debugging-guide.json**
- **Déclencheur** : Questions de débogage
- **Chargement** : Guides de débogage

## 🔄 Changements Apportés

### Mis à Jour
- ✅ **Chemins de documentation** : Tous les chemins pointent vers la nouvelle structure `docs/`
- ✅ **Règles enrichies** : Ajout de règles spécialisées pour les standards et la performance
- ✅ **Patterns améliorés** : Détection plus précise des intentions utilisateur

### Supprimé
- ❌ **Règles cassées** : Suppression des règles pointant vers des fichiers inexistants
- ❌ **Doublons** : Nettoyage des règles redondantes

## 🎯 Usage Optimal

### Pour obtenir la documentation stratégique :
- Utiliser des mots-clés : "roadmap", "plan", "vision", "stratégie"

### Pour obtenir les standards techniques :
- Utiliser des mots-clés : "TypeScript", "tests", "standards", "architecture"

### Pour obtenir les infos de performance :
- Utiliser des mots-clés : "performance", "optimisation", "cache", "lenteur"

## 📋 Structure des Fichiers de Règles

```json
{
  "name": "nom-de-la-regle",
  "description": "Description de ce que fait la règle",
  "pattern": "(?i)(mots|clés|de|déclenchement)",
  "actions": [
    {
      "type": "readFiles",
      "files": [
        "chemin/vers/fichier1.md",
        "chemin/vers/fichier2.md"
      ]
    }
  ]
}
```

## 🔧 Maintenance

Pour ajouter une nouvelle règle :
1. Créer le fichier JSON dans `.cursor/rules/`
2. L'ajouter à `.cursor-config.json`
3. Mettre à jour ce README

---
*Dernière mise à jour : Mai 2025 - Adaptation à la nouvelle organisation documentaire* 