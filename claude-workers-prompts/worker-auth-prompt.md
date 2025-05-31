# CLAUDE CODE WORKER: WORKER-AUTH

## 🎯 MISSION AUTONOME
**Spécialité**: Authentication & Security Tests
**Priorité**: 🚨 CRITIQUE
**Temps estimé**: 15-20 min
**Fichiers à réparer**: 20

## 📋 FICHIERS EN ÉCHEC
- src/lib/auth/__tests__/auth-0.test.ts
- src/lib/auth/__tests__/auth-1.test.ts
- src/lib/auth/__tests__/auth-2.test.ts
- src/lib/auth/__tests__/auth-3.test.ts
- src/lib/auth/__tests__/auth-4.test.ts
- src/lib/auth/__tests__/auth-5.test.ts
- src/lib/auth/__tests__/auth-6.test.ts
- src/lib/auth/__tests__/auth-7.test.ts
- src/lib/auth/__tests__/auth-8.test.ts
- src/lib/auth/__tests__/auth-9.test.ts
- src/lib/auth/__tests__/auth-10.test.ts
- src/lib/auth/__tests__/auth-11.test.ts
- src/lib/auth/__tests__/auth-12.test.ts
- src/lib/auth/__tests__/auth-13.test.ts
- src/lib/auth/__tests__/auth-14.test.ts
- src/lib/auth/__tests__/auth-15.test.ts
- src/lib/auth/__tests__/auth-16.test.ts
- src/lib/auth/__tests__/auth-17.test.ts
- src/lib/auth/__tests__/auth-18.test.ts
- src/lib/auth/__tests__/auth-19.test.ts

## 🛠️ INSTRUCTIONS PRÉCISES

### Étape 1: Diagnostic
```bash
npm run test:fast -- --testPathPattern="src\/lib\/auth\/__tests__\/auth-0.test.ts"
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

### Étape 4: Patterns Spécifiques à Authentication & Security Tests


**Patterns Auth/Security**:
- Mock JWT tokens: `getClientAuthToken.mockReturnValue('valid-token')`
- Mock axios responses avec types complets
- Vérifier les interceptors axios
- Tester les flux login/logout
- Validation des permissions


### Étape 5: Validation
```bash
# Tester le fichier réparé individuellement
npm test -- --testPathPattern="FICHIER_RÉPARÉ"

# Valider avec les autres tests du module  
npm run test:fast -- --testPathPattern="authentication & security tests"

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
WORKER: worker-auth
STATUS: ✅ SUCCÈS / ❌ ÉCHEC
FICHIERS RÉPARÉS: X/20
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