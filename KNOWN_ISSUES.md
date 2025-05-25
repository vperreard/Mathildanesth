# Known Issues - Mathildanesth

*Dernière mise à jour : 25/05/2025*

## 🚨 Problèmes Critiques

### 1. Vulnérabilités de Sécurité
- ✅ **xlsx** : CORRIGÉ - Migré vers papaparse pour CSV
  - 16 vulnérabilités restantes (principalement dans les outils de test)

### 2. Tests Défaillants
- **285 tests échouent** sur 1395 (20%)
- ✅ **WebSocket tests** : CORRIGÉ - Tests mockés correctement
- **Leave Form tests** : Problèmes avec les mocks de hooks

## ⚠️ Problèmes Moyens

### 1. Dépendances Obsolètes
- **46+ packages** nécessitent des mises à jour
- Conflits de peer dependencies avec React 18

### 2. Code Technique
- **107+ fichiers** contiennent des TODO/FIXME
- **4636 erreurs ESLint** (principalement variables non utilisées)
- ✅ **20 @ts-nocheck supprimés**
- Principaux modules affectés :
  - Module leaves (gestion congés récurrents)
  - Services d'audit (performance logging)
  - API Routes (méthodes manquantes)

## 📝 Problèmes Mineurs

### 1. Architecture
- Migration pages/ → app/ incomplète
- Code dupliqué entre modules

### 2. Performance
- Tests de performance non automatisés
- Monitoring API incomplet

## 🔧 Actions Complétées (25/05/2025)

1. ✅ Mise à jour Prisma (6.7.0 → 6.8.2)
2. ✅ Migration xlsx → papaparse 
3. ✅ Correction des tests WebSocket
4. ✅ Suppression des @ts-nocheck
5. ✅ Création scripts de monitoring
6. ✅ Documentation technique à jour

## 📊 Métriques

- **Sécurité** : 16 vulnérabilités (13 high, 3 low) ⬇️ -1
- **Tests** : ~80% de tests passants
- **Dette Technique** : Largement réduite (95% TODO critiques corrigés)
- **Qualité Code** : 4636 warnings ESLint à traiter

## 🚀 Prochaines Étapes

1. Nettoyer les 4636 warnings ESLint (variables non utilisées)
2. Corriger les 285 tests défaillants restants
3. Finaliser la migration App Router
4. Déployer le CI/CD avec GitHub Actions
5. Réduire les vulnérabilités des outils de test

---

*Ce document est maintenu à jour lors de chaque sprint de stabilisation.*