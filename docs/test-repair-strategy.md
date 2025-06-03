# 🚀 STRATÉGIE DE RÉPARATION DES TESTS - CASCADE FIX APPROACH

## Vue d'ensemble
Cette stratégie utilise une approche en cascade pour maximiser l'impact de chaque correction.

## 📊 DIAGNOSTIC INITIAL (30 min)

### 1. Analyse des dépendances
```bash
# Identifier les fichiers les plus importés
find src -name "*.test.ts" -o -name "*.test.tsx" | xargs grep -h "import.*from" | sort | uniq -c | sort -nr | head -20
```

### 2. Catégorisation des erreurs
- **Niveau 1 - Bloquants** : Erreurs qui empêchent la compilation (TypeScript, imports)
- **Niveau 2 - Fonctionnels** : Mocks manquants, API changes
- **Niveau 3 - Logiques** : Assertions incorrectes, logique de test obsolète

## 🔧 PHASES DE RÉPARATION

### PHASE 0 : PRÉPARATION (1h)
1. **Créer une base de mocks réutilisables**
   - `/src/test-utils/mocks/prisma.ts`
   - `/src/test-utils/mocks/services.ts`
   - `/src/test-utils/mocks/components.ts`

2. **Mettre à jour les configurations**
   - `jest.config.js` : Vérifier tous les paths
   - `tsconfig.json` : Aligner avec jest
   - `jest.setup.js` : Centraliser tous les mocks globaux

### PHASE 1 : CORRECTIONS SYSTÉMIQUES (2h)
**Objectif** : Fixer les problèmes qui affectent plusieurs tests

1. **Fix automatique des imports**
```bash
# Script pour corriger tous les imports Prisma
find src -name "*.test.ts*" -exec sed -i '' \
  -e 's/from "@prisma\/client"/from "@\/test-utils\/globalMocks"/' \
  -e 's/import { \(.*\) } from "@\/test-utils\/globalMocks"/import { MockedPrismaEnums } from "@\/test-utils\/globalMocks"; const { \1 } = MockedPrismaEnums/' {} \;
```

2. **Fix des erreurs de syntaxe récurrentes**
```bash
# Corriger les apostrophes dans les chaînes
find src -name "*.test.ts*" -exec sed -i '' \
  -e "s/\([\"']\)\([^\"']*\)'\([^\"']*\)\([\"']\)/\1\2\\\\'\3\4/g" {} \;
```

3. **Mise à jour des mocks de services**
   - Créer des factories de mocks
   - Standardiser les réponses

### PHASE 2 : RÉPARATION PAR IMPACT (4h)
**Stratégie** : Commencer par les tests qui, une fois réparés, débloqueront d'autres tests

#### Ordre de priorité :
1. **Types & Interfaces** (30 min)
   - `/src/types/__tests__/*`
   - Impact : Débloque tous les tests utilisant ces types

2. **Services utilitaires** (1h)
   - `/src/utils/__tests__/*`
   - `/src/lib/__tests__/*`
   - Impact : Utilisés partout

3. **Services métier** (1h30)
   - `/src/services/__tests__/*`
   - Impact : Débloque les tests de composants

4. **Hooks** (1h)
   - `/src/hooks/__tests__/*`
   - `/src/modules/*/hooks/__tests__/*`
   - Impact : Débloque les tests de composants React

5. **Composants** (1h)
   - Commencer par les plus simples
   - Puis les composants composites

### PHASE 3 : TESTS D'INTÉGRATION (2h)
1. **API Routes**
   - Créer des handlers mock réutilisables
   - Standardiser les réponses

2. **Workflows complets**
   - Vérifier les scénarios E2E

## 📈 MÉTRIQUES DE SUIVI

### Tableau de bord
| Métrique | Début | Objectif J1 | Objectif J2 | Objectif J3 |
|----------|-------|-------------|-------------|-------------|
| Test Suites Pass | 32% | 60% | 85% | 95% |
| Tests Pass | 66% | 80% | 90% | 98% |
| Temps moyen/test | 100ms | 80ms | 60ms | 50ms |

### Indicateurs de progression
- **Quick Wins** : Tests réparés en < 5 min
- **High Impact** : Tests qui débloquent > 5 autres tests
- **Critical Path** : Tests bloquant des features importantes

## 🛠️ OUTILS & SCRIPTS

### 1. Script de diagnostic intelligent
```javascript
// analyze-test-dependencies.js
const analyzeDependencies = () => {
  // Identifier les tests avec le plus de dépendants
  // Prioriser leur réparation
};
```

### 2. Fix automatique par pattern
```javascript
// auto-fix-patterns.js
const patterns = [
  { find: /UserRole\./g, replace: 'MockedPrismaEnums.UserRole.' },
  { find: /LeaveStatus\./g, replace: 'MockedPrismaEnums.LeaveStatus.' },
  // ... autres patterns
];
```

### 3. Test runner intelligent
```bash
# run-tests-smart.sh
#!/bin/bash
# Exécute les tests dans l'ordre optimal
npm test -- src/types/__tests__ && \
npm test -- src/utils/__tests__ && \
npm test -- src/services/__tests__ && \
npm test -- src/hooks/__tests__ && \
npm test -- src/components/__tests__
```

## 📋 CHECKLIST QUOTIDIENNE

### Jour 1
- [ ] Setup complet des mocks globaux
- [ ] Fix automatique des imports (100% des fichiers)
- [ ] Réparer tous les tests de types
- [ ] Réparer 50% des services
- [ ] Documenter les patterns trouvés

### Jour 2
- [ ] Terminer les services
- [ ] Réparer tous les hooks
- [ ] Commencer les composants simples
- [ ] Optimiser les performances

### Jour 3
- [ ] Terminer les composants
- [ ] Réparer les tests d'intégration
- [ ] Faire une passe de nettoyage
- [ ] Documenter les bonnes pratiques

## 🎯 CRITÈRES DE SUCCÈS

1. **Coverage** : Maintenir > 80%
2. **Performance** : Tests < 30s au total
3. **Stabilité** : 0 tests flaky
4. **Maintenabilité** : Patterns documentés

## 🚨 PIÈGES À ÉVITER

1. **Over-mocking** : Ne pas mocker ce qui peut être testé réellement
2. **Test fragiles** : Éviter les assertions trop spécifiques
3. **Dépendances circulaires** : Attention aux imports
4. **Tests trop longs** : Découper si > 100 lignes

## 📚 RESSOURCES

- [Jest Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Testing Library Docs](https://testing-library.com/docs/)
- Pattern de mocks du projet : `/src/test-utils/`