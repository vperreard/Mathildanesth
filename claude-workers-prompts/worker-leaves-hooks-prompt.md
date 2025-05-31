# CLAUDE CODE WORKER: WORKER-LEAVES-HOOKS

## 🎯 MISSION AUTONOME
**Spécialité**: Leaves Hooks & Components
**Priorité**: 🚨 CRITIQUE
**Temps estimé**: 15-20 min
**Fichiers à réparer**: 20

## 📋 FICHIERS EN ÉCHEC
- src/modules/leaves/hooks/__tests__/use-leave-0.test.tsx
- src/modules/leaves/hooks/__tests__/use-leave-1.test.tsx
- src/modules/leaves/hooks/__tests__/use-leave-2.test.tsx
- src/modules/leaves/hooks/__tests__/use-leave-3.test.tsx
- src/modules/leaves/hooks/__tests__/use-leave-4.test.tsx
- src/modules/leaves/hooks/__tests__/use-leave-5.test.tsx
- src/modules/leaves/hooks/__tests__/use-leave-6.test.tsx
- src/modules/leaves/hooks/__tests__/use-leave-7.test.tsx
- src/modules/leaves/hooks/__tests__/use-leave-8.test.tsx
- src/modules/leaves/hooks/__tests__/use-leave-9.test.tsx
- src/modules/leaves/hooks/__tests__/use-leave-10.test.tsx
- src/modules/leaves/hooks/__tests__/use-leave-11.test.tsx
- src/modules/leaves/hooks/__tests__/use-leave-12.test.tsx
- src/modules/leaves/hooks/__tests__/use-leave-13.test.tsx
- src/modules/leaves/hooks/__tests__/use-leave-14.test.tsx
- src/modules/leaves/hooks/__tests__/use-leave-15.test.tsx
- src/modules/leaves/hooks/__tests__/use-leave-16.test.tsx
- src/modules/leaves/hooks/__tests__/use-leave-17.test.tsx
- src/modules/leaves/hooks/__tests__/use-leave-18.test.tsx
- src/modules/leaves/hooks/__tests__/use-leave-19.test.tsx

## 🛠️ INSTRUCTIONS PRÉCISES

### Étape 1: Diagnostic
```bash
npm run test:fast -- --testPathPattern="src\/modules\/leaves\/hooks\/__tests__\/use-leave-0.test.tsx"
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

### Étape 4: Patterns Spécifiques à Leaves Hooks & Components



### Étape 5: Validation
```bash
# Tester le fichier réparé individuellement
npm test -- --testPathPattern="FICHIER_RÉPARÉ"

# Valider avec les autres tests du module  
npm run test:fast -- --testPathPattern="leaves hooks & components"

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
WORKER: worker-leaves-hooks
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