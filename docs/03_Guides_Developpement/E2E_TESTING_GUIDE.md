# Guide des Tests E2E - Cypress & Puppeteer

> **Dernière mise à jour** : 27 Mai 2025 - 23h00  
> **Statut** : Infrastructure opérationnelle ✅

## 🎯 Vue d'ensemble

Ce guide documente l'infrastructure de tests E2E mise en place avec Cypress et Puppeteer.

## 🛠️ Commandes disponibles

```bash
# Tests Cypress
npm run cypress:open      # Ouvrir l'interface Cypress
npm run cypress:run       # Lancer les tests en mode headless

# Tests Puppeteer
npm run test:e2e         # Lancer les tests Puppeteer

# Tests spécifiques
npx cypress run --spec "cypress/e2e/auth/authentication.spec.ts"
```

## 📁 Structure des fichiers

```
cypress/
├── fixtures/              # Données de test
│   └── utilisateurs.json  # Utilisateurs de test
├── e2e/                   # Tests E2E
│   ├── auth/             # Tests authentification
│   ├── calendar/         # Tests calendrier
│   └── ...
├── support/              # Commandes et helpers
│   ├── commands.ts       # Commandes personnalisées
│   └── e2e.ts           # Configuration globale
└── cypress.config.js     # Configuration Cypress
```

## 🔧 Fixtures et données de test

### Structure utilisateur (utilisateurs.json)
```json
{
  "users": [
    {
      "id": "user-1",
      "email": "admin@example.com",
      "password": "Test123!",
      "name": "Admin Test",
      "nom": "Admin Test",        // Requis par Prisma
      "prenom": "Test",           // Requis par Prisma
      "role": "ADMIN_TOTAL",
      "isActive": true
    }
  ]
}
```

## 🎨 Convention des sélecteurs

Nous utilisons `data-cy` pour tous les sélecteurs de tests :

```tsx
// ✅ Bon
<input data-cy="email-input" />
<button data-cy="submit-button" />

// ❌ Éviter
<input data-testid="login-email-input" />
```

### Sélecteurs standard

| Élément | Sélecteur |
|---------|-----------|
| Email input | `data-cy="email-input"` |
| Password input | `data-cy="password-input"` |
| Submit button | `data-cy="submit-button"` |
| Error message | `data-cy="error-message"` |
| User name display | `data-cy="user-name"` |
| Forgot password link | `data-cy="forgot-password-link"` |

## 🔐 Tests d'authentification

### Test de connexion basique
```typescript
it('permet la connexion avec des identifiants valides', () => {
    cy.visit('/auth/connexion');
    cy.get('[data-cy=email-input]').type('admin@example.com');
    cy.get('[data-cy=password-input]').type('Test123!');
    cy.get('[data-cy=submit-button]').click();
    
    // Vérifier la redirection
    cy.url().should('include', '/tableau-de-bord');
    cy.get('[data-cy=user-name]').should('contain', 'Admin Test');
});
```

## 🐛 Problèmes résolus

### 1. Erreur "jest is not defined"
**Problème** : `jest.clearAllMocks()` dans les tests Cypress  
**Solution** : Supprimé toutes les références Jest des tests Cypress

### 2. Fixtures manquantes
**Problème** : Fichier `utilisateurs.json` introuvable  
**Solution** : Créé avec la structure requise incluant `nom` et `prenom`

### 3. Sélecteurs incorrects
**Problème** : Mix de `data-testid` et `data-cy`  
**Solution** : Standardisé sur `data-cy` partout

### 4. Routes API incorrectes
**Problème** : `/api/auth/connexion` vs `/api/auth/login`  
**Solution** : Unifié sur `/api/auth/login`

### 5. Page manquante
**Problème** : `/auth/reset-password` n'existe pas  
**Solution** : Page créée avec les éléments requis

## 📝 Checklist pour nouveaux tests

- [ ] Créer les fixtures nécessaires dans `/cypress/fixtures/`
- [ ] Ajouter les `data-cy` attributes dans les composants
- [ ] Utiliser les commandes personnalisées (`cy.login()`, etc.)
- [ ] Intercepter les appels API avec `cy.intercept()`
- [ ] Vérifier les redirections et messages d'erreur
- [ ] Nettoyer les données de test après exécution

## 🚀 Prochaines étapes

1. **Augmenter la couverture** : Ajouter tests pour les modules critiques
2. **Tests de performance** : Intégrer Lighthouse dans Cypress
3. **Tests visuels** : Ajouter Percy ou Chromatic
4. **CI/CD** : Configurer GitHub Actions pour tests automatiques
5. **Parallélisation** : Utiliser Cypress Dashboard pour tests parallèles

## 🔗 Ressources

- [Documentation Cypress](https://docs.cypress.io)
- [Best Practices Cypress](https://docs.cypress.io/guides/references/best-practices)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)