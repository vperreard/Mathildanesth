# 🚀 Commandes Rapides - Points d'Étape et Audit

## 📊 Points d'Étape

### Commandes Principales

```bash
# Point d'étape complet (recommandé)
npm run etape                 # ou ./scripts/etape

# Point d'étape rapide (quotidien)
npm run etape:quick          # ou ./scripts/etape --quick

# Focus roadmap/TODO (planification)
npm run etape:roadmap        # ou ./scripts/etape --roadmap
```

### Utilisation Quotidienne

```bash
# Début de journée ☀️
npm run etape:quick

# Fin de semaine 📋
npm run etape

# Planification/priorisation 🗺️
npm run etape:roadmap
```

## 🔍 Audits Spécialisés

```bash
# Audit global du projet
npm run audit:global         # ou ./scripts/audit-global.sh

# Audit dette technique (@ts-ignore, TODO, etc.)
npm run audit:debt           # ou ./scripts/audit-technical-debt.sh

# Métriques quotidiennes
./scripts/daily-metrics.sh

# Validation migration App Router
./scripts/validate-migration.sh
```

## 🧪 Tests et Qualité

```bash
# Tests critiques (auth + congés)
npm run test:critical

# Tests avec couverture
npm run test:coverage

# Validation complète
npm run validate             # lint + type-check + tests

# Build et vérification
npm run build
```

## ⚡ Workflows Recommandés

### Routine Quotidienne
```bash
npm run etape:quick          # 10 secondes
```

### Routine Hebdomadaire
```bash
npm run etape               # 2-3 minutes
npm run audit:debt          # Si TODO > 80
```

### Avant Commit Important
```bash
npm run etape:quick
npm run validate            # lint + tests
```

### Avant Release
```bash
npm run etape              # Analyse complète
npm run test:coverage      # Vérifier couverture
npm run build              # Test de compilation
```

### Planification/Sprint
```bash
npm run etape:roadmap      # Voir TODO critiques
npm run audit:global       # Vue d'ensemble
```

## 📈 Interprétation des Métriques

### Point d'Étape Rapide
- **📦 Routes API :** Nombre de routes App Router (cible: > 100)
- **📝 TODO/FIXME :** Éléments en attente (cible: < 50)
- **🧪 Tests :** Fichiers de test (cible: > 100)
- **⚠️ @ts-ignore :** À réduire (cible: < 15)

### Score Global (/100)
- **🏆 80+ :** Excellent - projet en très bonne santé
- **👍 60-79 :** Bon - quelques améliorations possibles
- **⚠️ 40-59 :** Correct - attention aux métriques en baisse
- **❌ < 40 :** À améliorer - action requise

### Seuils d'Alerte
- **@ts-ignore > 20 :** Problème de typage
- **TODO > 100 :** Trop d'éléments en attente
- **Couverture < 40% :** Tests insuffisants
- **Build échoue :** Erreurs de compilation

## 🚨 Actions d'Urgence

### Si Score < 60
```bash
npm run audit:debt         # Identifier les problèmes
npm run audit:global       # Vue d'ensemble
```

### Si TODO Sécurité Détectés
```bash
# Consulter le plan d'action
cat docs/04_roadmap/URGENT_TODO_ACTION_PLAN.md
# Traiter en priorité les API routes critiques
```

### Si Build Échoue
```bash
npm run type-check         # Vérifier erreurs TypeScript
npm run lint              # Vérifier erreurs ESLint
```

## 📝 Logs et Rapports

### Localisation des Rapports
```
logs/point-etape/          # Rapports détaillés
logs/technical-debt-audit-* # Audits dette technique
daily-metrics.json         # Métriques quotidiennes JSON
```

### Historique
```bash
# Voir les derniers rapports
ls -la logs/point-etape/

# Consulter un rapport spécifique
cat logs/point-etape/point-etape-20250128_143025.md
```

## 💡 Conseils

### Pour Claude/IA
1. Lancez `npm run etape` avant de demander une analyse
2. Partagez le rapport si nécessaire
3. Demandez l'analyse des recommandations
4. Validez les actions proposées

### Pour l'Équipe
1. **Quotidien :** `npm run etape:quick` avant de commencer
2. **Hebdomadaire :** `npm run etape` en réunion d'équipe
3. **Mensuellement :** Analyser l'évolution des métriques
4. **Avant release :** Point d'étape complet obligatoire

---

**Mémo :** Intégrez ces commandes dans votre routine pour maintenir la qualité du projet de façon objective et mesurable. 