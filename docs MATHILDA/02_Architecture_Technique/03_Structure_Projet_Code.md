# Structure des Dossiers du Code de l'Application

Ce document décrit l'arborescence des dossiers pour le code source de l'application MATHILDA, développée avec Next.js et TypeScript. L'application résidera dans un dossier principal (par exemple, `mathilda-app/`).

## Arborescence Cible

```
mathilda-app/
├── prisma/                     # Fichiers Prisma (schema, migrations)
│   ├── migrations/
│   └── schema.prisma
├── public/                     # Fichiers statiques (images, polices, etc.)
│   ├── images/
│   └── ...
├── src/
│   ├── app/                    # Routes de l'App Router (pages et API)
│   │   ├── (auth)/             # Groupe de routes pour l'authentification (layout spécifique)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── ...
│   │   ├── (main)/             # Groupe de routes pour l'application principale (layout principal)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── planning/
│   │   │   │   └── page.tsx
│   │   │   ├── admin/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx      # Layout spécifique pour les pages principales
│   │   ├── api/                # Routes API
│   │   │   ├── users/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── planning/
│   │   │   │   └── ...
│   │   │   └── ...
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   └── layout.tsx          # Layout racine de l'application
│   │   └── page.tsx            # Page d'accueil principale
│   ├── components/             # Composants React réutilisables
│   │   ├── Auth/               # Composants spécifiques à l'authentification
│   │   ├── Common/             # Composants génériques (boutons, modales, inputs)
│   │   │   ├── Button.tsx
│   │   │   └── Modal.tsx
│   │   ├── Icons/              # Composants SVG pour les icônes
│   │   ├── Layout/             # Composants du layout principal (Header, Sidebar)
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   └── Planning/           # Composants spécifiques au module de planning
│   │       ├── CalendarView.tsx
│   │       └── EventCard.tsx
│   ├── config/                 # Fichiers de configuration (ex: variables d'environnement spécifiques)
│   │   └── site.ts             # Configuration du site (nom, description, etc.)
│   ├── hooks/                  # Hooks React personnalisés
│   │   └── useAuth.ts
│   ├── lib/                    # Fonctions utilitaires, clients d'API, helpers
│   │   ├── auth.ts             # Logique d'authentification (NextAuth.js)
│   │   ├── prisma.ts           # Instance client Prisma global
│   │   └── utils.ts            # Fonctions utilitaires diverses
│   ├── services/               # Logique métier, interaction avec l'API (alternative à `lib/api-client.ts`)
│   │   └── userService.ts
│   ├── store/                  # Gestion d'état global (Zustand, Redux, Context API)
│   │   └── uiStore.ts
│   ├── styles/                 # Styles globaux additionnels (si globals.css ne suffit pas)
│   └── types/                  # Définitions TypeScript (interfaces, types)
│       ├── api.ts
│       ├── prisma.ts           # Types générés par Prisma (peuvent être importés directement)
│       └── user.ts
├── .env                        # Variables d'environnement (généré par `prisma init`)
├── .eslintrc.json
├── .gitignore
├── next-env.d.ts
├── next.config.mjs
├── package.json
├── postcss.config.js
├── README.md
└── tailwind.config.ts
└── tsconfig.json
```

## Description des Dossiers Clés

### Racine du Projet (`mathilda-app/`)
-   `prisma/`: Contient le schéma de la base de données (`schema.prisma`) et les migrations générées par Prisma.
-   `public/`: Pour les assets statiques accessibles publiquement via le navigateur (images, polices, etc.).
-   `src/`: Contient la majorité du code source de l'application.
-   Fichiers de configuration du projet : `.env`, `.eslintrc.json`, `next.config.mjs`, `tailwind.config.ts`, `tsconfig.json`, etc.

### `src/`
-   `app/`: Cœur de l'application utilisant l'App Router de Next.js.
    -   **Layouts et Pages :** Les fichiers `layout.tsx` définissent la structure UI partagée, et les fichiers `page.tsx` définissent le contenu unique d'une route.
    -   **Groupes de Routes `(dossier)` :** Utilisés pour organiser les routes ou appliquer des layouts spécifiques à un ensemble de pages sans affecter le chemin de l'URL. Par exemple, `(auth)` pour les pages d'authentification et `(main)` pour les pages principales de l'application après connexion.
    -   `api/`: Contient toutes les définitions de routes backend (API handlers). Chaque sous-dossier correspond généralement à une ressource (ex: `/api/users`, `/api/planning`).
-   `components/`: Stocke les composants React réutilisables.
    -   Il est recommandé de les organiser en sous-dossiers par fonctionnalité (ex: `Planning/`, `Admin/`) ou par type de composant (ex: `Common/` pour les boutons, modales, `Layout/` pour les éléments de structure de page).
-   `config/`: Pour les fichiers de configuration de l'application qui ne sont pas des variables d'environnement (ex: configuration du site, constantes).
-   `hooks/`: Contient les hooks React personnalisés (fonctions commençant par `use`) pour encapsuler et réutiliser la logique avec état entre les composants.
-   `lib/`: Un emplacement général pour les fonctions utilitaires, la configuration de bibliothèques tierces (ex: initialisation du client Prisma, configuration de NextAuth.js), et d'autres modules de support.
-   `services/` (Optionnel) : Peut être utilisé pour séparer la logique métier complexe ou les fonctions d'accès aux données qui interagissent avec les API ou la base de données.
-   `store/`: Si une gestion d'état globale est nécessaire (ex: avec Zustand, Redux, ou Context API), ce dossier contiendra les définitions des stores et des actions.
-   `styles/`: Pour les fichiers de styles globaux additionnels ou les modules CSS si `globals.css` et Tailwind CSS ne suffisent pas.
-   `types/`: Contient toutes les définitions d'interfaces et de types TypeScript partagées à travers l'application, garantissant la sécurité de type.

## Conventions
-   **Nommage :** Utiliser PascalCase pour les noms de fichiers et dossiers des composants React (ex: `Button.tsx`, `UserProfile/`). Utiliser camelCase ou kebab-case pour les autres fichiers et dossiers.
-   **Modularité :** Viser des composants et modules petits et ciblés pour faciliter la maintenabilité et la testabilité.

Cette structure est une base solide et pourra évoluer en fonction des besoins spécifiques du projet. 