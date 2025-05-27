# Rapport de Test Cypress
Date: 2025-05-27 07:13:11

## 🔍 Vérification de l'environnement

### Application Status
✅ Application en cours d'exécution sur le port 3000

### Page de Login
Status HTTP: 200

### Sélecteurs trouvés sur la page de login:

## 🧪 Test de Login (login.spec.ts)

Lancement du test...

### Résultats du test:
❌ TESTS ÉCHOUÉS

### Erreurs principales:
```
        "name": "AssertionError",
        "stack": "AssertionError: Timed out retrying after 4000ms: expected '<div.mb-4.rounded-md.bg-red-50.p-4>' to contain text 'Identifiants invalides', but the text was 'Erreur de connexion'\n    at Context.eval (webpack://mathildanesth/./cypress/e2e/login.spec.ts:24:13)",
        "parsedStack": [
          {
            "message": "AssertionError: Timed out retrying after 4000ms: expected '<div.mb-4.rounded-md.bg-red-50.p-4>' to contain text 'Identifiants invalides', but the text was 'Erreur de connexion'",
            "whitespace": ""
          },
--
        "name": "AssertionError",
        "stack": "AssertionError: Timed out retrying after 4000ms: expected 500 to equal 200\n    at Context.eval (webpack://mathildanesth/./cypress/e2e/login.spec.ts:37:60)",
        "parsedStack": [
          {
            "message": "AssertionError: Timed out retrying after 4000ms: expected 500 to equal 200",
            "whitespace": ""
          },
--
        "name": "AssertionError",
        "stack": "AssertionError: Timed out retrying after 4000ms: Expected to find element: `[data-cy=forgot-password-link]`, but never found it.\n    at Context.eval (webpack://mathildanesth/./cypress/e2e/login.spec.ts:50:11)",
        "parsedStack": [
          {
```

### Sélecteurs manquants:
```
`[data-cy=forgot-password-link]`, but never found it.",
`[data-cy=forgot-password-link]`, but never found it.\n    at Context.eval (webpack://mathildanesth/./cypress/e2e/login.spec.ts:50:11)",
```

### Screenshots générés:
3 captures d'écran

## 🔧 Actions nécessaires pour réparer les tests

1. **Ajouter les data-testid manquants** dans OptimizedLoginPage.tsx:
   - data-testid="login-email-input"
   - data-testid="login-password-input"
   - data-testid="login-submit-button"

---
Rapport généré dans: cypress-test-report.md
