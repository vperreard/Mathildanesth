# Architecture Technique de Mathildanesth

## Introduction

Ce document décrit l'architecture technique globale de l'application Mathildanesth. Il couvre les principaux choix technologiques, la structure des composants et les interactions entre eux. L'objectif est de fournir une vue d'ensemble pour les développeurs et les architectes.

## Stack Technologique Principale

Mathildanesth est une application web full-stack moderne, s'appuyant sur les technologies suivantes :

- **Framework Frontend & Backend :** [Next.js](https://nextjs.org/) (React Framework)
  - Permet le Server-Side Rendering (SSR), Static Site Generation (SSG), et les API Routes pour le backend.
  - App Router de Next.js 13+ est utilisé pour la structure des routes et des composants serveur/client.
- **Langage de Programmation :** [TypeScript](https://www.typescriptlang.org/)
  - Pour le frontend et le backend, assurant un typage statique et une meilleure robustesse du code.
- **Base de Données :** [PostgreSQL](https://www.postgresql.org/)
  - Base de données relationnelle open-source robuste.
- **ORM (Object-Relational Mapper) :** [Prisma](https://www.prisma.io/)
  - Facilite les interactions avec la base de données (migrations, requêtes typées).
  - Le schéma Prisma (`prisma/schema.prisma`) est la source de vérité pour la structure de la base de données.
- **Styling & UI :**
  - [Tailwind CSS](https://tailwindcss.com/) : Framework CSS utility-first pour un développement rapide de l'interface.
  - [Shadcn/ui](https://ui.shadcn.com/) : Collection de composants UI réutilisables, accessibles, et personnalisables, basés sur Radix UI et Tailwind CSS.
  - `clsx` et `tailwind-merge` pour la gestion conditionnelle des classes CSS.
- **Authentification :** [NextAuth.js](https://next-auth.js.org/) (maintenant Auth.js)
  - Solution complète pour l'authentification (connexion par identifiants, potentiellement OAuth à l'avenir).
- **Gestion d'État (Frontend) :**
  - Context API de React pour la gestion d'état simple et localisée.
  - [Zustand](https://zustand-demo.pmnd.rs/) (ou similaire comme Redux Toolkit) pourrait être utilisé pour des états globaux plus complexes si nécessaire, bien que la tendance avec Next.js App Router soit de privilégier les Server Components et les actions serveur.
  - `SWR` ou `React Query (TanStack Query)` pour la récupération de données côté client, la mise en cache et la synchronisation.
- **Validation de Données :**
  - [Zod](https://zod.dev/) : Pour la validation de schémas de données, côté client et serveur.
- **Internationalisation (i18n) :**
  - `next-intl` est utilisé pour la gestion des traductions et la localisation de l'application.

## Structure Générale de l'Application

L'application suit une structure de monorepo (ou du moins un projet unique bien organisé) avec les principaux répertoires suivants dans `src/` :

- **`app/` :** Contient les routes, les layouts, les pages et les composants spécifiques aux routes (App Router de Next.js).
  - **`api/` :** Sous-répertoire pour les API Routes de Next.js, gérant la logique backend.
- **`components/` :** Composants UI réutilisables partagés à travers l'application.
  - **`ui/` :** Composants de base de Shadcn/ui ou composants personnalisés à faible niveau.
  - Autres sous-dossiers par fonctionnalité ou type de composant.
- **`lib/` :** Fonctions utilitaires, clients d'API, configuration de bibliothèques.
- **`hooks/` :** Hooks React personnalisés pour encapsuler la logique réutilisable.
- **`context/` :** Contextes React pour la gestion d'état partagé.
- **`services/` :** Logique métier plus complexe côté serveur, séparée des API routes pour une meilleure organisation (ex: `RuleEngineService`, `PlanningGeneratorService`, `NotificationService`).
- **`modules/` :** Regroupement de fonctionnalités métier complètes (frontend et backend) par domaine (ex: `leaves`, `planning`, `rules`, `calendar`, `profiles`). Chaque module peut contenir ses propres composants, services, types, hooks, et API routes spécifiques.
  - Cette approche modulaire favorise la séparation des préoccupations et la maintenabilité.
- **`prisma/` (à la racine du projet) :** Contient le schéma de base de données (`schema.prisma`), les migrations et le client Prisma généré.
- **`config/` :** Fichiers de configuration de l'application.
- **`styles/` :** Fichiers CSS globaux (ex: `globals.css` pour Tailwind).
- **`types/` :** Définitions de types TypeScript partagées.

## Flux de Données Typique

1.  **Requête Utilisateur (Frontend) :** L'utilisateur interagit avec l'interface (ex: soumettre un formulaire, naviguer vers une page).
2.  **Composant React (Client ou Serveur) :**
    - **Server Component :** Peut récupérer des données directement (ex: via Prisma dans une fonction `async`) ou appeler une action serveur.
    - **Client Component :** Peut appeler une API Route via `fetch` ou une bibliothèque de data-fetching (SWR, React Query), ou déclencher une action serveur.
3.  **Action Serveur / API Route (Backend - Next.js) :**
    - Reçoit la requête.
    - Valide les données d'entrée (ex: avec Zod).
    - Appelle les services métier appropriés si nécessaire.
    - Interagit avec la base de données via Prisma.
    - Retourne une réponse (JSON pour les API Routes, ou mise à jour de l'UI pour les Server Actions).
4.  **Services Métier (Backend) :**
    - Encapsulent la logique complexe (ex: génération de planning, application de règles, calcul de quotas).
    - Peuvent interagir avec Prisma et d'autres services.
5.  **Base de Données (PostgreSQL via Prisma) :**
    - Stocke et récupère les données persistantes.
    - Prisma gère les migrations de schéma.
6.  **Réponse au Frontend :**
    - Les données sont renvoyées au composant client, qui met à jour l'UI.
    - Pour les Server Components, l'UI est rendue sur le serveur et envoyée au client.

## Communication Asynchrone et Temps Réel

- **WebSockets :**
  - Utilisé pour des fonctionnalités en temps réel comme les notifications instantanées.
  - Un `WebsocketService` (`src/services/WebsocketService.ts`) et une API route `/api/ws` sont présents.
- **Bus d'Événements (`EventBusService`) :**
  - Permet une communication découplée entre différents modules/services côté serveur.
  - Ex: Un service de gestion des congés publie un événement `LeaveApprovedEvent`, et le service de notification s'y abonne pour envoyer une notification.
  - Mentionné dans la roadmap technique comme un composant clé pour la modularité.

## Tests

- **Tests Unitaires :**
  - [Jest](https://jestjs.io/) et [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) pour les composants React, les hooks, et les fonctions utilitaires.
- **Tests d'Intégration :**
  - Pour tester les interactions entre plusieurs composants ou entre le frontend et les API routes.
- **Tests End-to-End (E2E) :**
  - [Cypress](https://www.cypress.io/) est utilisé pour simuler les parcours utilisateurs complets dans le navigateur.
  - Le répertoire `cypress/` contient les tests E2E.

## Qualité du Code et Conventions

- **Linting :** [ESLint](https://eslint.org/) pour l'analyse statique du code et le respect des conventions.
- **Formatting :** [Prettier](https://prettier.io/) pour le formatage automatique du code.
- **Husky et lint-staged :** Utilisés pour exécuter les linters et formatters avant chaque commit, garantissant la qualité du code poussé.

## Version Mobile

- L'application doit être **responsive** et accessible via les navigateurs mobiles modernes.
- L'utilisation de Tailwind CSS et de Shadcn/ui facilite la création d'interfaces responsives.
- Pas d'application mobile native prévue en V1, mais l'architecture ne l'exclut pas pour le futur (les API routes pourraient servir de backend).

## Déploiement (Hypothèses)

- **Plateforme :** Vercel (idéal pour Next.js), ou une autre plateforme supportant Node.js (ex: AWS, Google Cloud, Azure avec conteneurisation Docker).
- **Base de Données :** Service PostgreSQL managé (ex: Supabase, Neon, AWS RDS, Google Cloud SQL).
- **Build Process :** `next build` génère une application optimisée pour la production.

Ce document d'architecture sera mis à jour au fur et à mesure de l'évolution du projet et des choix techniques.
