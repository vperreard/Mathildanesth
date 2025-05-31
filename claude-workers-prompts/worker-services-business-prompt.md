# CLAUDE CODE WORKER: WORKER-SERVICES-BUSINESS

## 🎯 MISSION AUTONOME
**Spécialité**: Business Services
**Priorité**: 🔥 HAUTE
**Temps estimé**: 15-20 min
**Fichiers à réparer**: 60

## 📋 FICHIERS EN ÉCHEC
- src/services/__tests__/planning-service-0.test.ts
- src/services/__tests__/planning-service-1.test.ts
- src/services/__tests__/planning-service-2.test.ts
- src/services/__tests__/planning-service-3.test.ts
- src/services/__tests__/planning-service-4.test.ts
- src/services/__tests__/planning-service-5.test.ts
- src/services/__tests__/planning-service-6.test.ts
- src/services/__tests__/planning-service-7.test.ts
- src/services/__tests__/planning-service-8.test.ts
- src/services/__tests__/planning-service-9.test.ts
- src/services/__tests__/planning-service-10.test.ts
- src/services/__tests__/planning-service-11.test.ts
- src/services/__tests__/planning-service-12.test.ts
- src/services/__tests__/planning-service-13.test.ts
- src/services/__tests__/planning-service-14.test.ts
- src/services/__tests__/planning-service-15.test.ts
- src/services/__tests__/planning-service-16.test.ts
- src/services/__tests__/planning-service-17.test.ts
- src/services/__tests__/planning-service-18.test.ts
- src/services/__tests__/planning-service-19.test.ts
- src/services/__tests__/planning-service-20.test.ts
- src/services/__tests__/planning-service-21.test.ts
- src/services/__tests__/planning-service-22.test.ts
- src/services/__tests__/planning-service-23.test.ts
- src/services/__tests__/planning-service-24.test.ts
- src/services/__tests__/planning-service-25.test.ts
- src/services/__tests__/planning-service-26.test.ts
- src/services/__tests__/planning-service-27.test.ts
- src/services/__tests__/planning-service-28.test.ts
- src/services/__tests__/planning-service-29.test.ts
- src/services/__tests__/validation-service-0.test.ts
- src/services/__tests__/validation-service-1.test.ts
- src/services/__tests__/validation-service-2.test.ts
- src/services/__tests__/validation-service-3.test.ts
- src/services/__tests__/validation-service-4.test.ts
- src/services/__tests__/validation-service-5.test.ts
- src/services/__tests__/validation-service-6.test.ts
- src/services/__tests__/validation-service-7.test.ts
- src/services/__tests__/validation-service-8.test.ts
- src/services/__tests__/validation-service-9.test.ts
- src/services/__tests__/validation-service-10.test.ts
- src/services/__tests__/validation-service-11.test.ts
- src/services/__tests__/validation-service-12.test.ts
- src/services/__tests__/validation-service-13.test.ts
- src/services/__tests__/validation-service-14.test.ts
- src/services/__tests__/validation-service-15.test.ts
- src/services/__tests__/validation-service-16.test.ts
- src/services/__tests__/validation-service-17.test.ts
- src/services/__tests__/validation-service-18.test.ts
- src/services/__tests__/validation-service-19.test.ts
- src/services/__tests__/validation-service-20.test.ts
- src/services/__tests__/validation-service-21.test.ts
- src/services/__tests__/validation-service-22.test.ts
- src/services/__tests__/validation-service-23.test.ts
- src/services/__tests__/validation-service-24.test.ts
- src/services/__tests__/validation-service-25.test.ts
- src/services/__tests__/validation-service-26.test.ts
- src/services/__tests__/validation-service-27.test.ts
- src/services/__tests__/validation-service-28.test.ts
- src/services/__tests__/validation-service-29.test.ts

## 🛠️ INSTRUCTIONS PRÉCISES

### Étape 1: Diagnostic
```bash
npm run test:fast -- --testPathPattern="src\/services\/__tests__\/planning-service-0.test.ts"
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

### Étape 4: Patterns Spécifiques à Business Services



### Étape 5: Validation
```bash
# Tester le fichier réparé individuellement
npm test -- --testPathPattern="FICHIER_RÉPARÉ"

# Valider avec les autres tests du module  
npm run test:fast -- --testPathPattern="business services"

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
WORKER: worker-services-business
STATUS: ✅ SUCCÈS / ❌ ÉCHEC
FICHIERS RÉPARÉS: X/60
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