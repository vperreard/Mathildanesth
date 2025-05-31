# CLAUDE CODE WORKER: WORKER-CLEANUP

## 🎯 MISSION AUTONOME
**Spécialité**: Miscellaneous & Edge Cases
**Priorité**: 📝 BASSE
**Temps estimé**: 15-20 min
**Fichiers à réparer**: 40

## 📋 FICHIERS EN ÉCHEC
- src/services/__tests__/service-0.test.ts
- src/services/__tests__/service-1.test.ts
- src/services/__tests__/service-2.test.ts
- src/services/__tests__/service-3.test.ts
- src/services/__tests__/service-4.test.ts
- src/services/__tests__/service-5.test.ts
- src/services/__tests__/service-6.test.ts
- src/services/__tests__/service-7.test.ts
- src/services/__tests__/service-8.test.ts
- src/services/__tests__/service-9.test.ts
- src/services/__tests__/service-10.test.ts
- src/services/__tests__/service-11.test.ts
- src/services/__tests__/service-12.test.ts
- src/services/__tests__/service-13.test.ts
- src/services/__tests__/service-14.test.ts
- src/services/__tests__/service-15.test.ts
- src/services/__tests__/service-16.test.ts
- src/services/__tests__/service-17.test.ts
- src/services/__tests__/service-18.test.ts
- src/services/__tests__/service-19.test.ts
- src/services/__tests__/service-20.test.ts
- src/services/__tests__/service-21.test.ts
- src/services/__tests__/service-22.test.ts
- src/services/__tests__/service-23.test.ts
- src/services/__tests__/service-24.test.ts
- src/services/__tests__/service-25.test.ts
- src/services/__tests__/service-26.test.ts
- src/services/__tests__/service-27.test.ts
- src/services/__tests__/service-28.test.ts
- src/services/__tests__/service-29.test.ts
- src/services/__tests__/service-30.test.ts
- src/services/__tests__/service-31.test.ts
- src/services/__tests__/service-32.test.ts
- src/services/__tests__/service-33.test.ts
- src/services/__tests__/service-34.test.ts
- src/services/__tests__/service-35.test.ts
- src/services/__tests__/service-36.test.ts
- src/services/__tests__/service-37.test.ts
- src/services/__tests__/service-38.test.ts
- src/services/__tests__/service-39.test.ts

## 🛠️ INSTRUCTIONS PRÉCISES

### Étape 1: Diagnostic
```bash
npm run test:fast -- --testPathPattern="src\/services\/__tests__\/service-0.test.ts"
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

### Étape 4: Patterns Spécifiques à Miscellaneous & Edge Cases



### Étape 5: Validation
```bash
# Tester le fichier réparé individuellement
npm test -- --testPathPattern="FICHIER_RÉPARÉ"

# Valider avec les autres tests du module  
npm run test:fast -- --testPathPattern="miscellaneous & edge cases"

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
WORKER: worker-cleanup
STATUS: ✅ SUCCÈS / ❌ ÉCHEC
FICHIERS RÉPARÉS: X/40
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