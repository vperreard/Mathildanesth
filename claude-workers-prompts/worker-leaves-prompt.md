# CLAUDE CODE WORKER: WORKER-LEAVES

## 🎯 MISSION AUTONOME
**Spécialité**: Leaves Module Tests
**Priorité**: 🔥 HAUTE
**Temps estimé**: 20-25 min
**Fichiers à réparer**: 2

## 📋 FICHIERS EN ÉCHEC
- src/modules/leaves/services/__tests__/conflictDetectionService.comprehensive.test.ts
- src/modules/leaves/services/__tests__/conflictDetectionService.comprehensive.test.ts

## 🛠️ INSTRUCTIONS PRÉCISES

### Étape 1: Diagnostic
```bash
npm run test:fast -- --testPathPattern="src\/modules\/leaves\/services\/__tests__\/conflictDetectionService.comprehensive.test.ts"
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

### Étape 4: Patterns Spécifiques à Leaves Module Tests


**Patterns Leaves Module**:
- Mock Prisma avec leave records réalistes
- Utiliser LeaveType, LeaveStatus enums
- Mock leaveService functions
- Tester les calculs de quotas
- Vérifier les dates et périodes


### Étape 5: Validation
```bash
# Tester le fichier réparé individuellement
npm test -- --testPathPattern="FICHIER_RÉPARÉ"

# Valider avec les autres tests du module  
npm run test:fast -- --testPathPattern="leaves module tests"

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
WORKER: worker-leaves
STATUS: ✅ SUCCÈS / ❌ ÉCHEC
FICHIERS RÉPARÉS: X/2
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