# Structure du Projet Mathildanesth

Ce document décrit l'organisation des dossiers et fichiers du projet Mathildanesth.

## Structure Globale

```
Mathildanesth/
├── .cursor/              # Configuration spécifique à l'éditeur Cursor
│   └── rules/            # Règles personnalisées pour l'IA
├── docs-consolidated/    # Documentation consolidée du projet (ce dossier)
├── prisma/               # Schéma et migrations de la base de données
│   ├── migrations/       # Historique des migrations Prisma
│   ├── schema.prisma     # Définition du schéma de la base de données
│   └── seed_data/        # Données d'initialisation
├── public/               # Ressources statiques
├── src/                  # Code source de l'application
│   ├── app/              # Pages de l'application (architecture Next.js App Router)
│   ├── components/       # Composants React réutilisables
│   ├── config/           # Fichiers de configuration
│   ├── core/             # Fonctionnalités essentielles
│   ├── hooks/            # Hooks React personnalisés
│   ├── lib/              # Bibliothèques et utilitaires
│   ├── middleware/       # Middlewares Next.js
│   ├── modules/          # Modules métier organisés par fonctionnalité
│   ├── services/         # Services partagés
│   ├── types/            # Types et interfaces TypeScript
│   └── utils/            # Fonctions utilitaires
├── tests/                # Tests automatisés
│   ├── integration/      # Tests d'intégration
│   ├── unit/             # Tests unitaires
│   └── e2e/              # Tests end-to-end (Cypress)
├── .env                  # Variables d'environnement locales
├── .env.example          # Modèle pour .env
├── next.config.js        # Configuration Next.js
├── package.json          # Dépendances et scripts
└── tsconfig.json         # Configuration TypeScript
```

## Description des Dossiers Principaux

### `src/app/`
Contient les pages de l'application organisées selon le système de routage de Next.js App Router. Chaque dossier représente une route, avec un fichier `page.tsx` pour le rendu.

Principales sections :
- `admin/` : Pages d'administration (configurations, règles)
- `api/` : Routes API (endpoints REST)
- `auth/` : Système d'authentification
- `bloc-operatoire/` : Gestion du bloc opératoire
- `leaves/` : Gestion des congés
- `planning/` : Visualisation et gestion des plannings
- `parametres/` : Paramètres et configurations

### `src/components/`
Composants React réutilisables, organisés par catégories :
- `ui/` : Composants UI de base (boutons, cartes, inputs...)
- `layout/` : Composants de mise en page
- `navigation/` : Menus et navigation
- `planning/` : Composants spécifiques au planning
- `absences/` : Composants pour la gestion des absences
- `trames/` : Composants pour les trames d'affectation

### `src/modules/`
Modules fonctionnels organisés autour des domaines métier, avec une structure cohérente pour chaque module :
- `leaves/` : Module de gestion des congés
- `calendar/` : Module calendrier
- `rules/` : Moteur de règles
- `planning/` : Logique de planning
- `profiles/` : Gestion des profils utilisateurs

Structure type d'un module :
```
module/
├── components/     # Composants React spécifiques au module
├── hooks/          # Hooks React personnalisés
├── services/       # Services liés au module
├── types/          # Types et interfaces
├── utils/          # Utilitaires
└── store/          # État global du module (optionnel)
```

### `src/services/`
Services partagés entre plusieurs modules :
- `planningGenerator.ts` : Générateur de planning
- `errorLoggingService.ts` : Gestion centralisée des erreurs
- `notificationService.ts` : Gestion des notifications
- `userService.ts` : Opérations sur les utilisateurs

### `prisma/`
Configuration ORM Prisma pour l'accès aux données :
- `schema.prisma` : Définition du modèle de données
- `migrations/` : Historique des migrations de schéma
- `seed_data/` : Données d'initialisation pour environnement de développement

## Conventions de Code

- **Nommage** :
  - Composants : PascalCase (ex: `UserProfile.tsx`)
  - Fichiers utilitaires/services : camelCase (ex: `dateUtils.ts`)
  - Hooks : commence par `use` (ex: `useLeave.ts`)
  - Types/Interfaces : PascalCase avec préfixe I pour interfaces optionnel

- **Structure des composants** :
  - Un composant par fichier
  - Props typées explicitement
  - Utilisation des hooks pour la logique réutilisable
  - Commentaires JSDoc pour les fonctions publiques

- **Imports** :
  - Groupés par catégorie (React, composants, hooks, types, etc.)
  - Préférence pour les imports nommés
  - Pas d'imports circulaires 