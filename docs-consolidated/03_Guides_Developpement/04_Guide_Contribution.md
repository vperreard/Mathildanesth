# Guide de Contribution à Mathildanesth

## Introduction

Merci de votre intérêt pour contribuer à Mathildanesth ! Ce guide décrit le processus de contribution, depuis la configuration de votre environnement jusqu'à la soumission de vos modifications. Suivre ces directives nous aidera à maintenir la qualité du code et à faciliter la collaboration.

## Avant de Commencer

- Assurez-vous d'avoir configuré votre [environnement de développement local](01_Configuration_Environnement_Developpement.md).
- Prenez connaissance de la [structure détaillée du codebase](02_Structure_Detaillee_Codebase.md).
- Familiarisez-vous avec nos [conventions de codage](../01_Architecture_Generale/06_Conventions_Codage.md) et notre [processus de développement et CI/CD](../01_Architecture_Generale/07_Processus_Developpement_CI_CD.md).
- Si vous prévoyez d'ajouter une nouvelle fonctionnalité majeure ou de faire des changements architecturaux importants, veuillez d'abord en discuter avec l'équipe (par exemple, via une issue GitHub).

## Processus de Contribution

### 1. Cloner le Dépôt (si ce n'est pas déjà fait)

Forkez le dépôt principal sur votre compte GitHub, puis clonez votre fork localement :

```bash
git clone git@github.com:VOTRE_NOM_UTILISATEUR/mathildanesth.git
cd mathildanesth
git remote add upstream git@github.com:DEPOT_ORIGINAL/mathildanesth.git # Ajoutez le dépôt original comme remote
```

### 2. Créer une Nouvelle Branche

Travaillez toujours sur une branche dédiée pour chaque fonctionnalité ou correction de bug. Ne committez jamais directement sur `main` ou `develop`.

- Assurez-vous que votre branche `develop` locale est à jour avec le dépôt `upstream` :
  ```bash
  git checkout develop
  git pull upstream develop
  ```
- Créez votre branche à partir de `develop` en respectant les conventions de nommage (voir ci-dessous) :

  ```bash
  # Pour une nouvelle fonctionnalité
  git checkout -b feature/nom-court-de-la-fonctionnalite

  # Pour une correction de bug
  git checkout -b fix/description-courte-du-bug

  # Pour des améliorations de documentation
  git checkout -b docs/sujet-de-la-documentation

  # Pour du refactoring
  git checkout -b refactor/zone-refactoree
  ```

  (Les conventions de nommage exactes sont détaillées dans [Conventions de Codage](../01_Architecture_Generale/06_Conventions_Codage.md#gestion-des-branches-et-commits-git).)

### 3. Développer Votre Fonctionnalité ou Correction

- Écrivez votre code en respectant les [conventions de codage](../01_Architecture_Generale/06_Conventions_Codage.md).
- **Ajoutez des tests unitaires et/ou d'intégration** pour couvrir vos modifications. Consultez le [Guide de Débogage et Tests](03_Debogage_Tests.md) pour savoir comment lancer les tests.
- Assurez-vous que tous les tests passent localement (`npm test` ou des commandes plus spécifiques).
- Vérifiez que le code est correctement linté et formaté (`npm run lint` et `npm run format`). Husky et lint-staged devraient s'en charger automatiquement avant chaque commit.

### 4. Commiter Vos Modifications

- Faites des commits atomiques et bien décrits.
- Suivez impérativement le format [**Conventional Commits**](https://www.conventionalcommits.org/) pour vos messages de commit. Ceci est crucial pour la génération automatique des notes de version et la lisibilité de l'historique.
  **Format :** `<type>(<scope>): <description courte>`

  - **Types courants :**
    - `feat` : Nouvelle fonctionnalité pour l'utilisateur.
    - `fix` : Correction de bug pour l'utilisateur.
    - `docs` : Modifications de la documentation.
    - `style` : Changements de formatage, points-virgules manquants, etc. (n'affectant pas la logique du code).
    - `refactor` : Refactoring du code de production, ex: renommage de variable.
    - `test` : Ajout ou modification de tests, pas de changement du code de production.
    - `chore` : Mise à jour de tâches de build, configuration, etc. (n'affectant pas le code de production).
    - `perf` : Amélioration des performances.
    - `ci` : Changements liés à l'intégration continue.
  - **Scope (optionnel) :** Le module ou la partie du code affectée (ex: `leaves`, `planning`, `auth`).

  **Exemples de messages de commit :**

  ```
  feat(planning): ajouter la fonctionnalité de drag-and-drop pour les affectations
  fix(auth): corriger la redirection après la connexion avec un rôle spécifique
  docs(api): mettre à jour la documentation de l'endpoint GET /users
  refactor(LeaveService): simplifier la logique de calcul des quotas
  test(UserProfile): ajouter des tests unitaires pour le composant UserProfileHeader
  chore: mettre à jour la version de Next.js
  ```

- Utilisez `git add <fichiers>` pour indexer vos modifications, puis `git commit`.

### 5. Pousser Votre Branche sur Votre Fork

```bash
git push origin feature/nom-court-de-la-fonctionnalite
```

### 6. Ouvrir une Pull Request (PR)

- Rendez-vous sur la page GitHub du dépôt _original_ de Mathildanesth.
- GitHub devrait détecter que vous avez poussé une nouvelle branche sur votre fork et vous proposer de créer une Pull Request.
- Ouvrez la PR en ciblant la branche `develop` du dépôt original.
- **Remplissez soigneusement la description de la PR :**
  - Décrivez clairement les changements que vous avez apportés.
  - Expliquez le "pourquoi" de ces changements.
  - Liez l'issue GitHub correspondante si applicable (ex: `Closes #123`).
  - Ajoutez des captures d'écran ou des GIFs si cela aide à visualiser les changements UI.

### 7. Revue de Code et CI

- Une fois la PR ouverte, le pipeline d'**Intégration Continue (CI)** sera automatiquement déclenché (tests, linting, build). Assurez-vous que tous les checks de la CI passent au vert.
- Au moins un autre développeur de l'équipe devra **revoir votre code**. Soyez réceptif aux commentaires et suggestions.
- Des discussions et des ajustements pourront être nécessaires. Poussez les modifications supplémentaires sur votre branche de fonctionnalité ; la PR sera mise à jour automatiquement.

### 8. Fusion de la PR

- Une fois la PR approuvée et la CI validée, un mainteneur du projet fusionnera votre branche dans `develop`.
- Félicitations, votre contribution fait maintenant partie de Mathildanesth !
- Vous pouvez supprimer votre branche locale et sur votre fork après la fusion (si vous le souhaitez).

## Maintenir Votre Fork à Jour

Pour garder votre branche `develop` locale et votre fork à jour avec le dépôt `upstream` (original) :

```bash
git checkout develop
git pull upstream develop
git push origin develop # Met à jour la branche develop de votre fork
```

Lorsque vous démarrez une nouvelle branche de fonctionnalité, assurez-vous de la créer à partir d'une branche `develop` à jour.

## Qualité du Code

- **Lisibilité :** Écrivez du code clair, bien structuré et facile à comprendre.
- **Simplicité :** Préférez les solutions simples (KISS).
- **DRY (Don't Repeat Yourself) :** Évitez la duplication de code.
- **Tests :** Toute nouvelle fonctionnalité ou correction de bug doit être accompagnée de tests pertinents.
- **Documentation :** Mettez à jour la documentation si vos changements l'impactent (code comments, JSDoc, fichiers Markdown dans `docs-consolidated/`).

## Signaler des Bugs ou Proposer des Fonctionnalités

Utilisez les **Issues GitHub** du dépôt principal pour :

- Signaler des bugs (avec des étapes claires pour les reproduire).
- Proposer de nouvelles fonctionnalités ou des améliorations.

Merci encore pour votre contribution ! Votre aide est précieuse pour faire de Mathildanesth un outil encore meilleur.
