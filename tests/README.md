# Tests

Ce dossier contient tous les tests pour l'application Mathildanesth.

## Structure

- `tests/unit/` : Contient les tests unitaires, organisés par type (services, components, hooks, utils) et par module si applicable (ex: `tests/unit/modules/rules/`).
- `tests/integration/` : Contient les tests d'intégration qui vérifient l'interaction entre plusieurs unités (ex: service + base de données mockée).
- `tests/e2e/` : (Futur) Contient les tests End-to-End utilisant Cypress.
- `tests/factories/` : Contient des fonctions utilitaires (factories) pour générer des données de test cohérentes (utilisateurs, affectations, etc.).

## Lancer les Tests

- **Tous les tests unitaires et d'intégration (configuration générale) :**
  ```bash
  npm run test
  ```

- **Tous les tests avec rapport de couverture globale :**
  ```bash
  npm run test:coverage
  ```

- **Tests spécifiques au module de règles :**
  ```bash
  npm run test:rules
  ```

- **Tests spécifiques au module de règles avec couverture (ciblée) :**
  ```bash
  npm run test:rules:coverage
  ```

- **Lancer un fichier de test spécifique en mode watch :**
  ```bash
  npm run test -- <chemin/vers/le/fichier.test.ts> --watch
  ```

## Mocks

- Les mocks spécifiques à un fichier de test doivent être définis directement dans ce fichier en utilisant `jest.mock()`.
- Les mocks globaux (si nécessaire à l'avenir) peuvent être configurés dans `jest.setup.js`.

## Factories

Utilisez les factories dans `tests/factories/` pour créer des objets de données standardisés pour vos tests.

Exemple :
```typescript
import { createUser } from './factories/userFactory';

it('should test something with a user', () => {
  const mockUser = createUser({ role: 'ADMIN' });
  // ... utiliser mockUser dans le test
});
``` 