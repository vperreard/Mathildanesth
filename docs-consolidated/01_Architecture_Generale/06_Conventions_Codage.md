# Conventions de Codage pour Mathildanesth

## Introduction

L'établissement de conventions de codage claires et cohérentes est essentiel pour assurer la lisibilité, la maintenabilité et la collaboration efficace au sein du projet Mathildanesth. Ce document décrit les principales conventions à suivre.

## Principes Généraux

- **Lisibilité avant tout :** Le code doit être facile à comprendre par les autres développeurs (et par soi-même dans le futur).
- **Cohérence :** Suivre les conventions établies de manière uniforme dans tout le codebase.
- **Simplicité (KISS - Keep It Simple, Stupid) :** Préférer les solutions simples et directes lorsque possible.
- **DRY (Don't Repeat Yourself) :** Éviter la duplication de code en utilisant des fonctions, des composants et des hooks réutilisables.
- **Nommage Explicite :** Utiliser des noms de variables, fonctions, classes, et composants qui décrivent clairement leur rôle ou leur contenu.

## Formatage du Code

- **Outil :** [Prettier](https://prettier.io/) est utilisé pour le formatage automatique du code.
  - La configuration de Prettier se trouve dans `.prettierrc`.
  - Le formatage est appliqué automatiquement avant chaque commit grâce à Husky et lint-staged.
- **Règles Principales (gérées par Prettier) :**
  - Indentation : 2 espaces (configurable dans `.prettierrc`).
  - Points-virgules : Oui (configurable).
  - Guillemets : Simples pour JavaScript/TypeScript (configurable).
  - Longueur de ligne maximale : Autour de 100-120 caractères (configurable).

## Conventions de Nommage

- **Variables et Fonctions :** `camelCase` (ex: `userName`, `calculateTotalAmount`).
- **Composants React (Fichiers et Noms) :** `PascalCase` (ex: `UserProfile.tsx`, `function UserProfile() {}`).
- **Constantes :** `UPPER_CASE_SNAKE_CASE` (ex: `MAX_USERS`, `API_BASE_URL`).
- **Types et Interfaces TypeScript :** `PascalCase` (ex: `interface UserProfileData {}`, `type OrderStatus = ...`).
- **Fichiers CSS/SCSS Modules :** `camelCase.module.css` (ex: `userProfile.module.css`).
- **API Routes (fichiers) :** `kebab-case.ts` ou `route.ts` dans des dossiers nommés en `kebab-case` (convention Next.js App Router).
- **Tests :** `*.test.ts` ou `*.spec.ts` (ex: `UserProfile.test.tsx`).

## TypeScript

- **Typage Strict :** Utiliser TypeScript de manière rigoureuse. Éviter `any` autant que possible.
  - Activer les options strictes dans `tsconfig.json` (`strict: true`).
- **Types et Interfaces :**
  - Préférer les `interface` pour définir la forme des objets et pour l'implémentation par les classes.
  - Utiliser `type` pour les types primitifs, les unions, les tuples, ou des types plus complexes.
  - Suffixer les interfaces de props de composants par `Props` (ex: `UserProfileProps`).
- **Modularité :** Organiser les types dans des fichiers `types.ts` au sein des modules concernés ou dans un répertoire `src/types/` global pour les types très partagés.

## React

- **Composants Fonctionnels et Hooks :** Préférer les composants fonctionnels avec les Hooks React aux composants basés sur les classes.
- **Structure des Composants :**
  - Déclarer les `Props` en premier.
  - Utiliser les hooks (`useState`, `useEffect`, `useContext`, etc.).
  - Définir les fonctions utilitaires internes.
  - Retourner le JSX.
- **Props :**
  - Déstructurer les props.
  - Fournir des valeurs par défaut pour les props optionnelles si pertinent.
- **Gestion de l'État :**
  - Utiliser `useState` pour l'état local simple.
  - Utiliser `useReducer` pour une logique d'état plus complexe.
  - Utiliser `Context API` ou Zustand/Redux Toolkit pour l'état global partagé (avec parcimonie, privilégier la colocation de l'état).
  - Utiliser `SWR` ou `React Query (TanStack Query)` pour la gestion de l'état des données serveur.
- **Effets (`useEffect`) :**
  - Utiliser `useEffect` pour les effets de bord.
  - Spécifier correctement le tableau de dépendances pour éviter les exécutions inutiles ou les boucles infinies.
  - Nettoyer les effets (abonnements, timers) dans la fonction de retour de `useEffect`.
- **Keys dans les Listes :** Toujours fournir une `key` unique et stable lors du rendu de listes d'éléments.
- **Accessibilité (a11y) :** Écrire du JSX sémantiquement correct et utiliser les attributs ARIA lorsque nécessaire.

## Next.js

- **App Router :** Suivre les conventions de l'App Router pour la structure des pages, layouts, et composants serveur/client.
  - Utiliser les Server Components par défaut autant que possible.
  - Utiliser la directive `"use client"` uniquement lorsque nécessaire (interactions client, hooks spécifiques au client).
- **API Routes / Server Actions :**
  - Placer la logique métier complexe dans des services séparés, appelés par les API Routes ou Server Actions.
  - Valider les entrées et gérer les erreurs de manière robuste.
- **Récupération de Données :**
  - Dans les Server Components : `async/await` directement dans le composant.
  - Dans les Client Components : `SWR` / `React Query` ou `fetch` dans `useEffect` (ou Server Actions).

## Commentaires

- **Quand commenter :** Commenter le code qui n'est pas immédiatement évident (logique complexe, solutions de contournement, décisions d'architecture importantes).
- **Quoi commenter :** Le "pourquoi" plutôt que le "comment" (le code doit expliquer le comment).
- **Style :** Utiliser les commentaires JSDoc pour documenter les fonctions, les props des composants, etc.
  ```typescript
  /**
   * Calcule la somme de deux nombres.
   * @param a Le premier nombre.
   * @param b Le deuxième nombre.
   * @returns La somme de a et b.
   */
  function sum(a: number, b: number): number {
    return a + b;
  }
  ```
- **TODOs et FIXMEs :** Utiliser `// TODO:` pour les fonctionnalités à implémenter et `// FIXME:` pour les problèmes connus à corriger, avec une brève description.

## Tests

- Écrire des tests unitaires (Jest, React Testing Library) pour les fonctions utilitaires, les hooks, et les composants.
- Écrire des tests d'intégration pour vérifier les interactions entre composants.
- Écrire des tests E2E (Cypress) pour les parcours utilisateurs critiques.
- Nommer les fichiers de test de manière cohérente (ex: `componentName.test.tsx`).
- Viser une bonne couverture de tests, en particulier pour la logique métier critique.

## Gestion des Branches et Commits (Git)

- **Branches :**
  - `main` (ou `master`) : Branche principale, reflète l'état de production.
  - `develop` : Branche d'intégration pour les fonctionnalités terminées.
  - Branches de fonctionnalités : `feature/nom-de-la-fonctionnalite` (créées à partir de `develop`).
  - Branches de correction de bugs : `fix/nom-du-bug` (créées à partir de `develop` ou `main` pour les hotfixes).
- **Messages de Commit :** Suivre le format [Conventional Commits](https://www.conventionalcommits.org/).
  - Ex: `feat: ajouter la fonctionnalité de connexion utilisateur`
  - Ex: `fix: corriger le bug d'affichage du calendrier en mode mobile`
  - Ex: `docs: mettre à jour la documentation de l'API de congés`
  - Ex: `refactor: simplifier la logique du service de notification`
  - Ex: `test: ajouter des tests unitaires pour le hook useLeaveQuota`
- **Pull Requests (PRs) / Merge Requests (MRs) :**
  - Utiliser les PRs pour fusionner les branches de fonctionnalités/bugs dans `develop`.
  - Les PRs doivent être revues par au moins un autre développeur.
  - S'assurer que les tests passent avant de fusionner.

## Linting

- **Outil :** [ESLint](https://eslint.org/) est utilisé pour l'analyse statique du code et le respect des conventions.
  - La configuration ESLint se trouve dans `.eslintrc.json`.
  - ESLint est exécuté automatiquement avant chaque commit via Husky et lint-staged.

## Conclusion

Le respect de ces conventions contribuera à un codebase de haute qualité, plus facile à comprendre, à maintenir et à faire évoluer. Ces conventions pourront être adaptées au fur et à mesure des besoins du projet.
