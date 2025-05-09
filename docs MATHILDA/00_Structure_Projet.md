# Structure du Projet MATHILDA

Ce document décrit l'organisation des dossiers et fichiers du projet MATHILDA.

```
MATHILDA/
├── .cursor/              # Configuration spécifique à l'éditeur Cursor
│   └── rules/            # Règles personnalisées pour l'IA
│       ├── global.cursorrules
│       ├── frontend.cursorrules
│       ├── backend.cursorrules
│       ├── database.cursorrules
│       └── tests.cursorrules
├── backend/              # Code source Node.js/Express (API)
│   ├── prisma/           # Schéma et migrations BDD
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── config/       # Configuration (variables d'env, etc.)
│   │   ├── modules/      # Logique métier par fonctionnalité (auth, users, planning, etc.)
│   │   │   └── [module_name]/
│   │   │       ├── *.controller.ts
│   │   │       ├── *.service.ts
│   │   │       ├── *.repository.ts
│   │   │       ├── *.routes.ts
│   │   │       └── *.dto.ts / *.types.ts
│   │   ├── middleware/   # Middlewares Express (auth, validation, error handling)
│   │   ├── types/        # Types globaux du backend
│   │   ├── utils/        # Fonctions utilitaires
│   │   └── server.ts     # Point d'entrée API, configuration Express
│   ├── tests/            # Tests unitaires et d'intégration backend
│   ├── tsconfig.json     # Configuration TypeScript backend
│   └── package.json      # Dépendances et scripts backend
├── docs/                 # Documentation projet
│   ├── 00_Structure_Projet.md      # Ce fichier
│   ├── 01_Specifications_Fonctionnelles/
│   ├── 02_Architecture_Technique/
│   ├── 03_Modele_Donnees/
│   ├── 04_Interfaces_Utilisateur/
│   ├── 05_Regles_Metier/
│   ├── 06_Plan_Implementation/
│   └── 07_Deployment_Production/
├── frontend/             # Code source React/Vite (UI)
│   ├── public/           # Fichiers statiques (favicon, etc.)
│   ├── src/
│   │   ├── assets/       # Images, polices, etc.
│   │   ├── components/   # Composants React réutilisables (UI)
│   │   │   └── shared/     # Composants génériques
│   │   │   └── [feature]/  # Composants spécifiques à une fonctionnalité
│   │   ├── contexts/     # React Contexts pour état partagé
│   │   ├── hooks/        # Hooks React personnalisés
│   │   ├── layouts/      # Structure des pages (ex: MainLayout)
│   │   ├── pages/        # Composants de page (associés aux routes)
│   │   ├── services/     # Logique d'appel API
│   │   ├── styles/       # CSS global, thème Chakra UI
│   │   ├── types/        # Types globaux du frontend
│   │   ├── utils/        # Fonctions utilitaires frontend
│   │   └── main.tsx      # Point d'entrée UI React
│   ├── tests/            # Tests composants frontend
│   ├── index.html        # Fichier HTML principal (Vite)
│   ├── vite.config.ts    # Configuration Vite
│   ├── tsconfig.json     # Configuration TypeScript frontend
│   └── package.json      # Dépendances et scripts frontend
├── scripts/              # Scripts utiles (déploiement, maintenance, etc.)
├── tests/                # Tests End-to-End (Cypress)
├── .env                  # Variables d'environnement locales (ignoré par Git)
├── .env.example          # Modèle pour .env
├── .eslintignore         # Fichiers ignorés par ESLint
├── .eslintrc.js          # Configuration ESLint
├── .gitignore            # Fichiers et dossiers ignorés par Git
├── .prettierignore       # Fichiers ignorés par Prettier
├── .prettierrc.js        # Configuration Prettier
├── CONTRIBUTING.md       # Guide de contribution
├── docker-compose.yml    # Configuration Docker Compose pour l'environnement local
├── LICENSE               # Licence du projet (à choisir)
├── package.json          # Package.json racine (pour gérer le monorepo via workspaces)
└── README.md             # Présentation générale et guide de démarrage rapide
```

## Description des Dossiers Principaux

- **`.cursor/`** : Contient les configurations spécifiques à l'environnement de développement Cursor, notamment les instructions pour l'IA.
- **`docs/`** : Centralise toute la documentation du projet, organisée par thèmes (fonctionnel, technique, données, UI, règles métier, plan). Chaque sous-dossier contient des fichiers Markdown détaillant un aspect spécifique.
- **`src/`** : Contient le code source de l'application, séparé en `client` (interface utilisateur), `server` (logique métier et API) et `shared` (éléments communs).

## Objectif de ce Fichier

Ce fichier a pour but de fournir une vue d'ensemble rapide de l'organisation du projet. Il sera mis à jour au fur et à mesure de l'évolution de la structure, notamment lors de la phase de codage. 