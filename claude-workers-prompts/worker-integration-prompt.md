# CLAUDE CODE WORKER: WORKER-INTEGRATION

## 🎯 MISSION AUTONOME
**Spécialité**: Integration & E2E Tests
**Priorité**: 📝 BASSE
**Temps estimé**: 25-30 min
**Fichiers à réparer**: 10

## 📋 FICHIERS EN ÉCHEC
- src/integration/__tests__/integration-0.test.ts
- src/integration/__tests__/integration-1.test.ts
- src/integration/__tests__/integration-2.test.ts
- src/integration/__tests__/integration-3.test.ts
- src/integration/__tests__/integration-4.test.ts
- src/integration/__tests__/integration-5.test.ts
- src/integration/__tests__/integration-6.test.ts
- src/integration/__tests__/integration-7.test.ts
- src/integration/__tests__/integration-8.test.ts
- src/integration/__tests__/integration-9.test.ts

## 🛠️ INSTRUCTIONS PRÉCISES

### Étape 1: Diagnostic
```bash
npm run test:fast -- --testPathPattern="src\/integration\/__tests__\/integration-0.test.ts"
```

### Étape 2: Analyse des Erreurs
1. **Lire chaque fichier de test en échec**
2. **Identifier les patterns d'erreur**:
   - Import/Export errors
   - Mock configuration issues  
   - Async/await problems
   - TypeScript type errors
   - Test setup/teardown issues

### Étape 3: Réparation Systématique
Pour chaque fichier:
1. **Fixer les imports** (utiliser @/ aliases corrects)
2. **Corriger les mocks** (suivre les patterns dans jest.setup.js)
3. **Réparer les types TypeScript** 
4. **Ajuster les timeouts** si nécessaire
5. **Valider avec test isolation**

### Étape 4: Patterns Spécifiques à Integration & E2E Tests


**Patterns Integration**:
- Setup/teardown complets
- Mock des services externes
- Tests de bout en bout
- Vérifier les workflows complets
- Performance et timeouts


### Étape 5: Validation
```bash
# Tester le fichier réparé individuellement
npm test -- --testPathPattern="FICHIER_RÉPARÉ"

# Valider avec les autres tests du module  
npm run test:fast -- --testPathPattern="integration & e2e tests"

# Validation finale bulletproof
npm run test:bulletproof
```

## 🎯 CRITÈRES DE SUCCÈS
- ✅ Tous les tests passent individuellement
- ✅ Pas de régression sur les autres tests
- ✅ Temps d'exécution < 30 secondes
- ✅ Coverage maintenue
- ✅ TypeScript compile sans erreur

## 🚨 RÈGLES CRITIQUES
- **JAMAIS ignorer un test avec .skip()** sans justification
- **TOUJOURS préserver la logique métier** 
- **UTILISER les mocks existants** dans jest.setup.js
- **RESPECTER les patterns** du projet
- **DOCUMENTER les changements** importants

## 📊 REPORTING
À la fin, créer un rapport:
```
WORKER: worker-integration
STATUS: ✅ SUCCÈS / ❌ ÉCHEC
FICHIERS RÉPARÉS: X/10
TEMPS RÉEL: XX minutes
PROBLÈMES RÉSOLUS:
- Problem 1: Description + Solution
- Problem 2: Description + Solution
PROCHAINES ÉTAPES: [si applicable]
```

## 🔄 WORKFLOW AUTONOME
1. Lancer le diagnostic
2. Réparer un fichier à la fois
3. Valider immédiatement
4. Passer au suivant
5. Rapport final

GO! 🚀