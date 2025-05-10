# Guide de Débogage et de Tests

## Introduction

Ce document fournit des instructions et des conseils pour tester et déboguer l'application Mathildanesth. Des tests robustes et un débogage efficace sont essentiels pour maintenir la qualité et la stabilité du code.

## Tests Unitaires et d'Intégration avec Jest

Mathildanesth utilise [Jest](https://jestjs.io/) comme framework de test pour les tests unitaires et d'intégration, en conjonction avec [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) pour les composants React.

### Structure des Fichiers de Test

- Les fichiers de test sont généralement colocalisés avec le code qu'ils testent, dans un dossier `__tests__` (ex: `src/components/ui/__tests__/Button.test.tsx`).
- Ils peuvent aussi se trouver dans un dossier `tests/` à la racine pour des tests plus globaux ou d'intégration spécifiques.
- Les fichiers de test suivent la convention de nommage `*.test.ts` ou `*.test.tsx`.

### Commandes pour Lancer les Tests Jest

Les scripts suivants sont disponibles dans `package.json` :

- **Lancer tous les tests Jest :**

  ```bash
  npm test
  # ou
  npm run test:all
  ```

- **Lancer les tests en mode "watch" (se relancent automatiquement lors de modifications) :**

  ```bash
  npm run test:watch
  ```

- **Générer un rapport de couverture de code :**

  ```bash
  npm run test:coverage
  ```

  Le rapport sera généré dans le dossier `coverage/`.

- **Lancer les tests pour l'intégration continue (CI) :**

  ```bash
  npm run test:ci
  ```

- **Lancer spécifiquement les tests unitaires (basé sur un pattern) :**

  ```bash
  npm run test:unit
  ```

- **Lancer spécifiquement les tests d'intégration (basé sur un pattern) :**

  ```bash
  npm run test:integration
  ```

- **Lancer les tests pour les règles (`jest.config.rules.js`) :**

  ```bash
  npm run test:rules
  npm run test:rules:watch
  npm run test:rules:coverage
  ```

- **Lancer les tests pour des modules spécifiques (ex: bloc opératoire, hooks, services) :**
  ```bash
  npm run test:bloc
  npm run test:bloc:coverage
  npm run test:hooks
  npm run test:services
  ```

### Bonnes Pratiques pour les Tests Jest

- Écrire des tests clairs, concis et focalisés sur un seul aspect.
- Utiliser `describe`, `it` (ou `test`), `expect` de manière sémantique.
- Privilégier les tests d'intégration pour les composants React pour tester le comportement tel que l'utilisateur le percevrait.
- Utiliser `@testing-library/user-event` pour simuler les interactions utilisateur.
- Mocker les dépendances externes (API, modules natifs) lorsque nécessaire, en utilisant `jest.mock()` ou MSW (Mock Service Worker) pour les appels API.
- Viser une bonne couverture de test, en particulier pour la logique métier critique et les composants complexes.
- Consulter `docs-consolidated/01_Architecture_Generale/06_Conventions_Codage.md` pour les conventions spécifiques aux tests.

## Tests End-to-End (E2E) avec Cypress

[Cypress](https://www.cypress.io/) est utilisé pour les tests End-to-End, simulant des parcours utilisateurs complets dans un navigateur.

### Structure des Fichiers de Test E2E

Les tests Cypress se trouvent dans le dossier `cypress/e2e/`.

### Commandes pour Lancer les Tests Cypress

- **Ouvrir l'interface graphique de Cypress :**

  ```bash
  npm run cypress:open
  # ou spécifiquement pour E2E ou Component tests
  npm run cypress:e2e:open
  npm run cypress:component:open
  ```

- **Lancer tous les tests E2E en mode headless (ligne de commande) :**

  ```bash
  npm run cypress:run
  # ou spécifiquement pour E2E
  npm run cypress:e2e
  ```

- **Lancer les tests E2E (démarre le serveur de dev puis lance Cypress) :**

  ```bash
  npm run test:e2e
  ```

  Ce script utilise `start-server-and-test` pour s'assurer que l'application est démarrée avant de lancer les tests.

- **Lancer les tests E2E pour la CI :**

  ```bash
  npm run test:e2e:ci
  ```

- **Lancer des suites de tests E2E spécifiques (accessibilité, performance, responsivité) :**

  ```bash
  npm run cypress:a11y
  npm run test:e2e:a11y # Avec serveur de dev
  npm run cypress:responsive
  npm run test:e2e:responsive # Avec serveur de dev
  npm run cypress:perf
  npm run test:e2e:perf # Avec serveur de dev
  ```

- **Gérer la base de données de test pour Cypress :**
  ```bash
  npm run cypress:setup-test-db # Configure une BD de test (variable d'env et migrations)
  npm run cypress:reset-db      # Réinitialise certaines tables de la BD de dev (à utiliser avec prudence)
  ```

### Bonnes Pratiques pour les Tests Cypress

- Écrire des tests qui reflètent les parcours utilisateurs réels.
- Utiliser des sélecteurs robustes et peu susceptibles de changer (ex: `data-cy` attributes).
- Éviter les `wait` arbitraires ; utiliser les mécanismes d'attente intégrés de Cypress.
- Organiser les tests en suites logiques.
- Utiliser les commandes personnalisées de Cypress pour factoriser le code répétitif.

## Débogage

### Débogage Côté Client (Navigateur)

- **Outils de Développement du Navigateur :**
  - Utiliser l'onglet "Console" pour les messages `console.log`, les erreurs JavaScript et les avertissements.
  - Utiliser l'onglet "Sources" pour placer des points d'arrêt (`debugger;`), inspecter les variables et parcourir le code pas à pas.
  - Utiliser l'onglet "Network" pour inspecter les requêtes API, leurs réponses et leurs en-têtes.
  - **React Developer Tools** (extension de navigateur) : Essentiel pour inspecter la hiérarchie des composants React, leurs props et leur état.
- **Points d'Arrêt dans VS Code :**
  VS Code peut être configuré pour déboguer directement le code JavaScript exécuté dans le navigateur (Chrome, Edge). Créez une configuration de lancement (`launch.json`).

### Débogage Côté Serveur (Node.js / Next.js API Routes & Server Components)

- **`console.log` :** Simple et efficace pour afficher des informations dans le terminal où s'exécute le serveur Next.js.
- **Débogueur Node.js intégré à VS Code :**
  1.  Ouvrez le fichier JavaScript/TypeScript que vous souhaitez déboguer.
  2.  Placez des points d'arrêt.
  3.  Modifiez votre script `dev` dans `package.json` pour inclure l'option `--inspect` de Node.js :
      ```json
      "scripts": {
        "dev": "NODE_OPTIONS='--inspect' next dev"
      }
      ```
  4.  Créez une configuration de lancement dans VS Code (`.vscode/launch.json`) de type "Node.js: Attach to Process" ou "Node.js: Attach".
      ```json
      {
        "version": "0.2.0",
        "configurations": [
          {
            "name": "Next.js: Attach to Server",
            "type": "node",
            "request": "attach",
            "skipFiles": ["<node_internals>/**"],
            "port": 9229, // Port par défaut de l'inspecteur Node.js
            "restart": true,
            "continueOnAttach": true
          }
        ]
      }
      ```
  5.  Lancez le script `npm run dev`.
  6.  Dans VS Code, lancez la configuration de débogage "Next.js: Attach to Server".
      Le débogueur devrait se connecter au processus Node.js, et vos points d'arrêt seront atteints lorsque le code correspondant sera exécuté.

### Conseils de Débogage Généraux

- **Isoler le Problème :** Essayez de reproduire le bug avec le minimum de code possible.
- **Comprendre le Flux de Données :** Suivez comment les données transitent à travers les composants, les hooks, les services et les API.
- **Vérifier les Erreurs de Typage :** TypeScript peut attraper de nombreuses erreurs au moment de la compilation. Faites attention aux avertissements et erreurs du compilateur.
- **Consulter les Logs :** Les logs côté serveur (terminal) et côté client (console du navigateur) sont vos meilleurs amis.
- **Utiliser les Outils de Profiling :** Pour les problèmes de performance, utilisez l'onglet "Performance" des outils de développement du navigateur ou React Profiler.

## Linting et Formatage

Le projet utilise ESLint pour le linting et Prettier pour le formatage du code. Ces outils sont configurés pour s'exécuter automatiquement avant chaque commit grâce à Husky et lint-staged.

- **Vérifier le linting manuellement :**
  ```bash
  npm run lint
  ```
- **Corriger automatiquement les problèmes de linting (si possible) :**
  ```bash
  npm run lint:fix
  ```
- **Formater tout le code :**
  ```bash
  npm run format
  ```

S'assurer que le code est correctement linté et formaté avant de commiter aide à maintenir une base de code propre et cohérente.
