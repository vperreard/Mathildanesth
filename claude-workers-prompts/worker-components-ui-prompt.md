# CLAUDE CODE WORKER: WORKER-COMPONENTS-UI

## 🎯 MISSION AUTONOME
**Spécialité**: UI Components Core
**Priorité**: 🔥 HAUTE
**Temps estimé**: 10-15 min
**Fichiers à réparer**: 18

## 📋 FICHIERS EN ÉCHEC
- src/components/requests/__tests__/UnifiedRequestForm.test.tsx
- src/components/__tests__/HospitalForm.test.tsx
- src/components/ui/__tests__/calendar.comprehensive.test.tsx
- src/components/navigation/__tests__/Navigation.test.tsx
- src/modules/planning/bloc-operatoire/components/__tests__/BlocPlanningCalendar.comprehensive.test.tsx
- src/components/__tests__/ThemeSwitcher.test.tsx
- src/app/bloc-operatoire/planning/components/__tests__/BlocPlanningEditor.test.tsx
- src/modules/planning/components/__tests__/PlanningView.test.tsx
- src/modules/notifications/components/__tests__/NotificationSettingsForm.test.tsx
- src/modules/calendar/components/__tests__/LeaveCalendarView.test.tsx
- src/modules/calendar/components/__tests__/BaseCalendar.test.tsx
- src/modules/calendar/components/__tests__/CalendarFilters.test.tsx
- src/app/calendrier/components/__tests__/ErrorBoundary.test.tsx
- src/app/calendrier/components/__tests__/CalendarHeader.test.tsx
- src/app/calendrier/components/__tests__/CalendarLoading.test.tsx
- src/app/calendrier/components/__tests__/CalendarError.test.tsx
- src/app/calendrier/components/__tests__/CalendarDay.test.tsx
- src/app/calendrier/components/__tests__/Calendar.test.tsx

## 🛠️ INSTRUCTIONS PRÉCISES

### Étape 1: Diagnostic
```bash
npm run test:fast -- --testPathPattern="src\/components\/requests\/__tests__\/UnifiedRequestForm.test.tsx"
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

### Étape 4: Patterns Spécifiques à UI Components Core



### Étape 5: Validation
```bash
# Tester le fichier réparé individuellement
npm test -- --testPathPattern="FICHIER_RÉPARÉ"

# Valider avec les autres tests du module  
npm run test:fast -- --testPathPattern="ui components core"

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
WORKER: worker-components-ui
STATUS: ✅ SUCCÈS / ❌ ÉCHEC
FICHIERS RÉPARÉS: X/18
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