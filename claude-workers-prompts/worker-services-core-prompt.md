# CLAUDE CODE WORKER: WORKER-SERVICES-CORE

## 🎯 MISSION AUTONOME
**Spécialité**: Core Services (Primary)
**Priorité**: 🚨 CRITIQUE
**Temps estimé**: 15-20 min
**Fichiers à réparer**: 40

## 📋 FICHIERS EN ÉCHEC
- src/services/__tests__/auditService-0.test.ts
- src/services/__tests__/auditService-1.test.ts
- src/services/__tests__/auditService-2.test.ts
- src/services/__tests__/auditService-3.test.ts
- src/services/__tests__/auditService-4.test.ts
- src/services/__tests__/auditService-5.test.ts
- src/services/__tests__/auditService-6.test.ts
- src/services/__tests__/auditService-7.test.ts
- src/services/__tests__/auditService-8.test.ts
- src/services/__tests__/auditService-9.test.ts
- src/services/__tests__/auditService-10.test.ts
- src/services/__tests__/auditService-11.test.ts
- src/services/__tests__/auditService-12.test.ts
- src/services/__tests__/auditService-13.test.ts
- src/services/__tests__/auditService-14.test.ts
- src/services/__tests__/auditService-15.test.ts
- src/services/__tests__/auditService-16.test.ts
- src/services/__tests__/auditService-17.test.ts
- src/services/__tests__/auditService-18.test.ts
- src/services/__tests__/auditService-19.test.ts
- src/services/__tests__/loggerService-0.test.ts
- src/services/__tests__/loggerService-1.test.ts
- src/services/__tests__/loggerService-2.test.ts
- src/services/__tests__/loggerService-3.test.ts
- src/services/__tests__/loggerService-4.test.ts
- src/services/__tests__/loggerService-5.test.ts
- src/services/__tests__/loggerService-6.test.ts
- src/services/__tests__/loggerService-7.test.ts
- src/services/__tests__/loggerService-8.test.ts
- src/services/__tests__/loggerService-9.test.ts
- src/services/__tests__/loggerService-10.test.ts
- src/services/__tests__/loggerService-11.test.ts
- src/services/__tests__/loggerService-12.test.ts
- src/services/__tests__/loggerService-13.test.ts
- src/services/__tests__/loggerService-14.test.ts
- src/services/__tests__/loggerService-15.test.ts
- src/services/__tests__/loggerService-16.test.ts
- src/services/__tests__/loggerService-17.test.ts
- src/services/__tests__/loggerService-18.test.ts
- src/services/__tests__/loggerService-19.test.ts

## 🛠️ INSTRUCTIONS PRÉCISES

### Étape 1: Diagnostic
```bash
npm run test:fast -- --testPathPattern="src\/services\/__tests__\/auditService-0.test.ts"
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

### Étape 4: Patterns Spécifiques à Core Services (Primary)



### Étape 5: Validation
```bash
# Tester le fichier réparé individuellement
npm test -- --testPathPattern="FICHIER_RÉPARÉ"

# Valider avec les autres tests du module  
npm run test:fast -- --testPathPattern="core services (primary)"

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
WORKER: worker-services-core
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