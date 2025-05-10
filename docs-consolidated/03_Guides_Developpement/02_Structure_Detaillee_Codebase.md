# Structure Détaillée du Codebase pour les Développeurs

## Introduction

Ce document offre une vue d'ensemble détaillée de la structure du code source de Mathildanesth, destinée à aider les développeurs à naviguer dans le projet, comprendre l'organisation des modules et contribuer efficacement. Il complète le document `01_Architecture_Generale/01_Structure_Projet.md` en se concentrant sur les aspects pertinents pour le développement quotidien.

## Philosophie d'Organisation

Le codebase est structuré autour des principes de modularité et de séparation des préoccupations. L'objectif est d'avoir :

- Des **modules fonctionnels** bien définis et faiblement couplés.
- Des **composants UI réutilisables** et bien testés.
- Des **services et hooks** clairs pour la logique métier et l'accès aux données.
- Une distinction nette entre le code **côté serveur** (API, logique métier principale) et **côté client** (UI, interactions).

## Répertoire `src/` : Le Cœur de l'Application

Le répertoire `src/` contient la majorité du code source de l'application Next.js.

### `src/app/` (App Router Next.js)

Organisation basée sur l'App Router de Next.js. Chaque sous-dossier représente un segment de route.

- **`page.tsx` ou `page.ts`**: Fichier principal pour le rendu d'une route (Server Component par défaut).
- **`layout.tsx`**: Pour les mises en page partagées par plusieurs routes enfants.
- **`loading.tsx`**: Pour afficher un état de chargement pendant la navigation.
- **`error.tsx`**: Pour gérer les erreurs spécifiques à un segment de route.
- **`route.ts`**: Pour définir les handlers d'API (endpoints backend).

  **Sous-dossiers notables dans `src/app/` :**

  - `admin/`: Interfaces d'administration pour la configuration du système, la gestion des règles, etc.
    - `bloc-operatoire/`, `schedule-rules/`, `team-configurations/`, etc.
  - `api/`: Contient tous les `route.ts` définissant les endpoints de l'API backend.
    - `auth/`, `leaves/`, `planning/`, `users/`, `admin/`, etc.
    - **Convention** : La logique métier complexe n'est généralement pas directement dans `route.ts` mais déléguée à des services dans `src/services/` ou `src/modules/*/services/`.
  - `auth/`: Pages liées à l'authentification (login, etc.).
  - `bloc-operatoire/`: Fonctionnalités spécifiques au planning et à la gestion du bloc opératoire.
  - `calendar/`: Vue calendrier principale.
  - `leaves/`: Gestion des congés et absences.
  - `planning/`: Pages de visualisation et de génération des plannings.
    - `hebdomadaire/`, `dashboard/`, `generator/`
  - `profil/`: Gestion du profil utilisateur.
  - `parametres/`: Paramètres spécifiques à l'utilisateur ou à l'application.

### `src/components/`

Composants React réutilisables à travers l'application. Ils sont généralement "dumb" (se concentrent sur la présentation) et reçoivent leurs données via des props.

- **`ui/`**: Composants UI de base, souvent basés sur la bibliothèque Shadcn/ui (ex: `Button.tsx`, `Card.tsx`, `Input.tsx`, `Dialog.tsx`, `DatePicker.tsx`). Ces composants sont fondamentaux pour construire l'interface.
- **`layout/`**: Composants structuraux pour la mise en page générale (ex: `Header.tsx`, `Sidebar.tsx`, `PageWrapper.tsx`).
- **`navigation/`**: Composants liés à la navigation (ex: menus, breadcrumbs).
- **`dashboard/widgets/`**: Widgets réutilisables pour les tableaux de bord.
- **Dossiers spécifiques à des fonctionnalités** (ex: `planning/`, `absences/`, `trames/`) : Composants plus spécifiques mais toujours conçus pour être potentiellement réutilisables.

### `src/modules/`

C'est ici que réside la logique métier principale, organisée par domaine fonctionnel. Chaque module vise à être autonome autant que possible.

**Structure typique d'un module (ex: `src/modules/leaves/`) :**

- **`components/`**: Composants React spécifiques à ce module (ex: `LeaveForm.tsx`, `LeavesList.tsx`).
- **`hooks/`**: Hooks React personnalisés contenant la logique d'état et les interactions spécifiques au module (ex: `useLeaveManagement.ts`, `useConflictDetection.ts`).
- **`services/`**: Logique métier pure, non liée à React, souvent des classes ou des fonctions qui interagissent avec les API ou effectuent des calculs complexes (ex: `LeaveCalculatorService.ts`, `LeaveValidationService.ts`). Peut aussi contenir les fonctions d'appel aux API backend (`api.ts` ou `leavesApi.ts`).
- **`types/`**: Définitions TypeScript (interfaces, types, enums) spécifiques à ce module.
- **`utils/`**: Fonctions utilitaires spécifiques à ce module.
- **`store/` (optionnel)**: Si une gestion d'état plus complexe est nécessaire pour le module (ex: avec Zustand ou Redux Toolkit), elle peut se trouver ici.
- **`api/` (optionnel, ou dans services)**: Contient la logique d'appel aux endpoints API backend relatifs à ce module.

  **Modules principaux identifiés :**

  - `analytics/`, `calendar/`, `dashboard/`, `dynamicRules/` (règles dynamiques), `integration/`, `leaves/` (congés), `notifications/`, `planning/`, `profiles/`, `rules/` (moteur de règles), `templates/` (trames).

### `src/lib/`

Bibliothèques utilitaires générales, non spécifiques à un module métier. Peut inclure :

- `prisma.ts`: Instance du client Prisma pour l'accès à la base de données.
- `auth.ts` ou `authOptions.ts`: Configuration de NextAuth.js.
- Utilitaires de dates (`dateUtils.ts`).
- Clients pour des services externes.
- Fonctions de validation génériques.
- Configuration de `axios` ou de `fetch`.

### `src/hooks/` (à la racine de `src/`)

Hooks React globaux, réutilisables à travers plusieurs modules et non spécifiques à un seul domaine métier (ex: `useUserPreferences.ts`, `useErrorHandler.ts`, `useOptimizedQuery.ts`).

### `src/services/` (à la racine de `src/`)

Services transverses qui ne sont pas spécifiques à un seul module métier ou qui sont utilisés par de nombreux modules. Exemples :

- `errorLoggingService.ts`: Service centralisé pour le logging des erreurs.
- `notificationService.ts`: Gestion de l'envoi de notifications (email, in-app).
- `CacheService.ts`: Service pour la gestion du cache applicatif.
- Logique d'appel à des API externes ou des services tiers très génériques.

### `src/context/`

Pour les Contextes React qui doivent être partagés globalement dans l'application (ex: `ThemeContext.tsx`, `AuthContext.tsx`). À utiliser avec parcimonie pour éviter le prop-drilling excessif ou la complexité inutile ; souvent, l'état local ou les solutions de gestion d'état par module (Zustand) sont préférables.

### `src/types/` (à la racine de `src/`)

Définitions TypeScript globales, types et interfaces partagés à travers toute l'application (ex: `common.ts` pour des types comme `ShiftType`, `UserRole`, etc.). Les types spécifiques à un module doivent résider dans le dossier `types/` de ce module.

### `src/utils/` (à la racine de `src/`)

Fonctions utilitaires très génériques et réutilisables partout dans l'application (ex: formateurs de chaînes, manipulateurs d'objets simples, etc.).

### `src/styles/`

Fichiers de style globaux, configuration de Tailwind CSS (`globals.css`).

### `src/middleware.ts` (ou `src/middlewares/`)

Middlewares Next.js pour intercepter les requêtes et exécuter du code avant le rendu de la page ou l'exécution d'une API route (ex: pour l'authentification, la redirection, l'internationalisation).

### `src/config/`

Fichiers de configuration pour divers aspects de l'application (ex: constantes, paramètres d'initialisation, configuration de bibliothèques tierces).

### `src/generated/`

Code généré automatiquement, comme le client Prisma (`src/generated/prisma/`). Ce dossier ne doit généralement pas être modifié manuellement.

## `prisma/`

Contient tout ce qui est lié à l'ORM Prisma :

- **`schema.prisma`**: Fichier principal définissant le schéma de la base de données (modèles, relations, enums).
- **`migrations/`**: Dossier généré par Prisma contenant l'historique des migrations SQL appliquées à la base de données.
- **`seed.ts` ou `seed.cjs`**: Script pour peupler la base de données avec des données initiales (seeding), utile pour le développement et les tests.
- **`seed_data/` (optionnel)**: Peut contenir des fichiers JSON ou autres formats de données utilisés par le script de seed.

## `public/`

Dossier pour les assets statiques accessibles publiquement (images, polices, favicons, etc.).

## `tests/` ou `src/**/__tests__/`

Contient les fichiers de test. La structure peut varier :

- Un dossier `tests/` à la racine avec des sous-dossiers pour les tests unitaires, d'intégration, et end-to-end (E2E avec Cypress par exemple).
- Ou, des dossiers `__tests__/` colocalisés avec le code qu'ils testent (ex: `src/components/ui/__tests__/Button.test.tsx`).
- `jest.config.js`, `cypress.config.js` : Fichiers de configuration pour les frameworks de test.

## Fichiers de Configuration à la Racine

- `.eslintrc.json`: Configuration d'ESLint pour le linting du code.
- `.prettierrc`: Configuration de Prettier pour le formatage du code.
- `next.config.js` (ou `.cjs`, `.mjs`): Configuration de Next.js.
- `tsconfig.json`: Configuration de TypeScript.
- `tailwind.config.js`: Configuration de Tailwind CSS.
- `package.json`: Dépendances du projet et scripts npm.
- `docker-compose.yml`: Configuration des services Docker pour l'environnement de développement.

## Navigation et Compréhension

- **Commencer par `src/app/`**: Pour comprendre les routes disponibles et les pages principales.
- **Explorer `src/modules/`**: Pour plonger dans la logique métier d'une fonctionnalité spécifique.
- **Consulter `src/components/ui/`**: Pour voir les briques de base de l'interface.
- **Utiliser la recherche globale de l'éditeur**: Pour trouver rapidement des composants, hooks, services ou types par leur nom.

Ce guide devrait vous aider à mieux vous orienter dans le codebase de Mathildanesth. N'hésitez pas à le compléter au fur et à mesure que le projet évolue.
