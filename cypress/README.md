# Cypress - Guide d'utilisation pour Mathildanesth

Ce dossier contient la configuration et les tests Cypress pour Mathildanesth. Cypress est utilisé pour les tests end-to-end (e2e) et les tests de composants.

## Structure du projet

```
cypress/
  ├── component/        # Tests de composants individuels
  ├── e2e/              # Tests end-to-end
  ├── fixtures/         # Données de test (JSON)
  ├── plugins/          # Plugins et configuration
  ├── screenshots/      # Captures d'écran des tests (générées automatiquement)
  ├── support/          # Commandes personnalisées et configuration
  │   ├── commands.ts   # Commandes Cypress personnalisées
  │   ├── component.ts  # Configuration pour les tests de composants
  │   └── e2e.ts        # Configuration pour les tests e2e
  ├── videos/           # Vidéos des tests (générées automatiquement)
  └── tsconfig.json     # Configuration TypeScript pour Cypress
```

## Commandes NPM

Les commandes suivantes sont disponibles pour exécuter les tests Cypress :

- `npm run cypress` ou `npm run cypress:open` - Ouvre l'interface Cypress
- `npm run cypress:run` - Exécute tous les tests en mode headless
- `npm run cypress:e2e` - Exécute uniquement les tests e2e en mode headless
- `npm run cypress:component` - Exécute uniquement les tests de composants en mode headless
- `npm run cypress:e2e:open` - Ouvre l'interface Cypress pour les tests e2e
- `npm run cypress:component:open` - Ouvre l'interface Cypress pour les tests de composants
- `npm run test:e2e` - Démarre le serveur de développement et exécute les tests e2e
- `npm run test:e2e:ci` - Pour l'intégration continue, utilise le serveur de production
- `npm run cypress:reset-db` - Réinitialise la base de données de test
- `npm run cypress:setup-test-db` - Configure la base de données de test

## Base de données de test

Pour isoler les tests des données de production, nous utilisons une base de données dédiée pour les tests.

1. Créez une base de données PostgreSQL pour les tests : `mathildanesth_test`
2. Configurez la variable d'environnement `TEST_DATABASE_URL` dans le fichier `.env.local` :
   ```
   TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mathildanesth_test
   ```
3. Exécutez les migrations : `npm run cypress:setup-test-db`

## Exemples d'écriture de tests

### Test e2e

```typescript
// cypress/e2e/login.spec.ts
describe('Page de connexion', () => {
  it('connecte l\'utilisateur avec des identifiants valides', () => {
    cy.visit('/auth/login');
    cy.get('[data-cy=email-input]').type('utilisateur.test@example.com');
    cy.get('[data-cy=password-input]').type('mot_de_passe_test');
    cy.get('[data-cy=login-button]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

### Test de composant

```typescript
// cypress/component/UserMenu.cy.tsx
import React from 'react';
import UserMenu from '../../src/components/user/UserMenu';

describe('Composant UserMenu', () => {
  it('affiche le nom de l\'utilisateur', () => {
    const user = { name: 'Utilisateur Test' };
    cy.mount(<UserMenu user={user} />);
    cy.get('[data-cy=user-name]').should('contain', user.name);
  });
});
```

## Bonnes pratiques

- Utilisez des attributs `data-cy` pour les sélecteurs, par exemple `[data-cy=login-button]`
- Réinitialisez la base de données avant chaque test avec `cy.task('resetTestDatabase')`
- Utilisez les fixtures pour les données de test
- Créez des commandes personnalisées dans `commands.ts` pour les opérations répétitives
- Pour les tests d'API, utilisez `cy.intercept()` pour intercepter les requêtes

## Intégration CI/CD

Les tests Cypress sont intégrés dans le pipeline CI/CD via GitHub Actions. La configuration se trouve dans `.github/workflows/`.

Pour les tests manuels, vous pouvez exécuter :

```bash
npm run test:e2e
```

## Résolution de problèmes

- **Erreur de connexion à la base de données** : Vérifiez que la variable `TEST_DATABASE_URL` est correctement configurée
- **Tests qui échouent aléatoirement** : Ajoutez des attentes explicites avec `cy.wait()`
- **Problèmes d'authentification** : Utilisez `cy.loginByApi()` pour contourner l'interface utilisateur

Pour plus d'informations, consultez la [documentation officielle de Cypress](https://docs.cypress.io). 