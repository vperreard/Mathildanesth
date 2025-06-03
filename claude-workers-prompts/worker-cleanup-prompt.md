# CLAUDE CODE WORKER: WORKER-CLEANUP

## 🎯 MISSION AUTONOME
**Spécialité**: Miscellaneous & Edge Cases
**Priorité**: 📝 BASSE
**Temps estimé**: 15-20 min
**Fichiers à réparer**: 24

## 📋 FICHIERS EN ÉCHEC
- src/tests/performance/leaveAnalyticsPerformance.test.ts
- src/services/__tests__/userService.comprehensive.test.ts
- tests/unit/services/planningGenerator.test.ts
- tests/unit/modules/leaves/services/notificationService.test.ts
- tests/unit/services/trameAffectationService.test.ts
- src/app/api/planning/__tests__/planningApiIntegration.test.ts
- src/services/__tests__/performanceMonitoring.test.ts
- src/tests/infrastructure/test-infrastructure-stabilization.test.ts
- src/modules/dynamicRules/v2/__tests__/RuleEngineV2.test.ts
- src/tests/regression/critical-workflows.test.ts
- src/__tests__/infrastructure-test.test.tsx
- tests/unit/modules/rules/ruleCache.test.ts
- src/config/__tests__/themes.test.ts
- src/config/__tests__/api.test.ts
- src/modules/dynamicRules/v2/__tests__/api/RuleAPI.test.ts
- src/modules/leaves/quotas/transfer/__tests__/useQuotaTransfer.test.tsx
- src/app/admin/simulations/advanced-visualizations/__tests__/page.test.tsx
- src/app/api/simulations/apply/__tests__/route.test.ts
- src/modules/leaves/permissions/__tests__/LeavePermissionService.test.ts
- src/modules/leaves/api/__tests__/LeaveReportApi.test.ts
- src/modules/leaves/permissions/__tests__/LeavePermissionService.extended.test.ts
- src/modules/leaves/__tests__/performance/riskDetectionPerformance.test.ts
- src/modules/dynamicRules/v2/__tests__/RuleValidator.test.ts
- src/modules/dynamicRules/v2/__tests__/ConflictDetector.test.ts

## 🛠️ INSTRUCTIONS PRÉCISES

### Étape 1: Diagnostic
```bash
npm run test:fast -- --testPathPattern="src\/tests\/performance\/leaveAnalyticsPerformance.test.ts"
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
FICHIERS RÉPARÉS: X/24
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