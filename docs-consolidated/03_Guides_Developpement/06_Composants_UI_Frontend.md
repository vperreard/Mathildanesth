# Guide de Développement Frontend et Composants UI

## Introduction

Ce guide s'adresse aux développeurs travaillant sur l'interface utilisateur (frontend) de Mathildanesth. Il couvre les aspects clés tels que la bibliothèque de composants UI, les conventions pour la création de composants React, la gestion de l'état, et les bonnes pratiques spécifiques au développement frontend avec Next.js.

## Technologies et Bibliothèques Clés

- **React** : Bibliothèque principale pour la construction de l'interface utilisateur.
- **Next.js** : Framework React pour la production, utilisé avec l'**App Router**.
- **TypeScript** : Pour le typage statique et une meilleure maintenabilité.
- **Tailwind CSS** : Framework CSS utilitaire pour le styling.
- **Shadcn/ui** (basé sur Radix UI) : Bibliothèque de composants UI de base, accessibles et personnalisables. Les composants se trouvent dans `src/components/ui/`.
- **TanStack Query (React Query) / SWR** : Pour la gestion de l'état des données serveur (data fetching, caching, synchronization).
- **Zustand / Context API** : Pour la gestion de l'état global ou partagé côté client (à utiliser judicieusement).
- **React Hook Form** : Pour la gestion des formulaires.

## Composants UI (`src/components/`)

### Bibliothèque de Base : `src/components/ui/`

- Contient des composants fondamentaux et réutilisables comme `Button`, `Card`, `Input`, `Dialog`, `Select`, `DatePicker`, `Table`, etc.
- Ces composants sont généralement construits en s'appuyant sur **Shadcn/ui**, ce qui signifie qu'ils sont basés sur les primitives accessibles de **Radix UI** et stylisés avec **Tailwind CSS**.
- **Utilisation :** Importez et utilisez ces composants comme blocs de construction pour des interfaces plus complexes.
- **Personnalisation :** Bien que Shadcn/ui fournisse des composants prêts à l'emploi, ils sont conçus pour être facilement personnalisables au niveau du style (via Tailwind) et de la logique si nécessaire.

### Composants Spécifiques et de Mise en Page

- `src/components/layout/`: Composants pour la structure générale des pages (ex: `Header`, `Sidebar`).
- `src/components/navigation/`: Composants pour la navigation (menus, etc.).
- Dossiers spécifiques à des fonctionnalités (ex: `src/components/planning/`, `src/components/absences/`) : Contiennent des composants plus spécialisés mais toujours conçus dans un esprit de réutilisabilité potentielle.

### Conventions pour la Création de Composants React

(Voir aussi `../01_Architecture_Generale/06_Conventions_Codage.md#react`)

- **Composants Fonctionnels et Hooks :** Toujours utiliser des composants fonctionnels avec des Hooks.
- **Nommage :** `PascalCase` pour les noms de fichiers et les noms de composants (ex: `UserProfile.tsx`, `function UserProfile() {}`).
- **Props :**
  - Définir des interfaces TypeScript claires pour les props (ex: `UserProfileProps`).
  - Déstructurer les props dans la signature du composant.
  - Utiliser des valeurs par défaut pour les props optionnelles si pertinent.
- **Structure d'un Composant :**
  1.  Imports.
  2.  Définition de l'interface des Props.
  3.  Déclaration du composant.
  4.  Hooks (`useState`, `useEffect`, `useContext`, hooks personnalisés).
  5.  Fonctions utilitaires internes (handlers d'événements, etc.).
  6.  JSX retourné.
- **Lisibilité :** Découper les composants complexes en sous-composants plus petits et plus gérables.
- **Accessibilité (a11y) :**
  - Utiliser du HTML sémantique.
  - S'assurer que les composants sont accessibles au clavier.
  - Utiliser les attributs ARIA lorsque la sémantique HTML native n'est pas suffisante (les composants Shadcn/Radix aident grandement ici).
  - Vérifier les contrastes de couleurs.
  - Référez-vous à `../01_Architecture_Generale/09_Accessibilite.md`.
- **Performance :**
  - Utiliser `React.memo` pour les composants qui ne doivent se re-rendre que si leurs props changent.
  - Utiliser `useMemo` et `useCallback` judicieusement pour éviter des calculs ou des re-créations de fonctions inutiles.
  - Pour les longues listes, envisager la virtualisation.
  - Référez-vous à `../01_Architecture_Generale/10_Performance.md`.

## Gestion de l'État Côté Client

(Voir aussi `../01_Architecture_Generale/06_Conventions_Codage.md#gestion-de-ltat`)

- **État Local des Composants (`useState`, `useReducer`) :**
  - Utiliser `useState` pour les états simples (chaînes, booléens, petits objets).
  - Utiliser `useReducer` pour une logique d'état plus complexe au sein d'un composant ou d'un hook personnalisé.
- **État des Données Serveur (Data Fetching & Caching) :**
  - **TanStack Query (React Query) ou SWR** sont les outils recommandés pour gérer les données provenant du backend.
  - Ils simplifient la récupération, la mise en cache, la synchronisation et la mise à jour des données serveur, tout en gérant les états de chargement et d'erreur.
  - Le hook `useOptimizedQuery.ts` mentionné dans `docs/technique/NEXT_STEPS.md` est probablement une abstraction au-dessus de l'un de ces outils.
- **État Global / Partagé entre Modules :**
  - **Zustand :** Solution légère et simple pour la gestion d'état global, préférée si une solution plus complexe comme Redux n'est pas nécessaire.
  - **React Context API :** Pour partager des données simples ou des fonctions à travers une partie de l'arbre des composants. À utiliser avec parcimonie pour éviter le "prop drilling" excessif et les re-rendus inutiles. Combiner avec `useReducer` pour une logique plus structurée.
  - Privilégier la colocation de l'état : garder l'état aussi proche que possible des composants qui l'utilisent.

## Next.js App Router : Server Components vs. Client Components

(Voir aussi `../01_Architecture_Generale/06_Conventions_Codage.md#nextjs`)

- **Server Components (par défaut) :**
  - Exécutés côté serveur. Peuvent accéder directement aux sources de données (ex: base de données via Prisma, services backend) en utilisant `async/await`.
  - Ne peuvent pas utiliser les hooks React qui dépendent de l'interactivité du navigateur (`useState`, `useEffect`).
  - Réduisent la quantité de JavaScript envoyée au client, améliorant la performance.
  - Idéal pour afficher des données, des mises en page statiques.
- **Client Components (`"use client"`) :**
  - Nécessitent la directive `"use client"` au début du fichier.
  - Exécutés côté client (dans le navigateur). Peuvent utiliser `useState`, `useEffect`, les gestionnaires d'événements, et interagir avec les API du navigateur.
  - Utiliser pour toute interactivité UI.
- **Stratégie :**
  - Utiliser les Server Components autant que possible.
  - Ne passer aux Client Components que lorsque c'est strictement nécessaire (interactivité, hooks spécifiques au client).
  - Il est possible d'importer des Server Components dans des Client Components (ils seront rendus côté serveur), mais pas l'inverse directement (on peut passer des Server Components en props `children` à des Client Components).

## Styling avec Tailwind CSS

- Utiliser les classes utilitaires de Tailwind CSS directement dans le JSX.
- Pour des styles plus complexes ou réutilisables, créer des composants stylisés ou utiliser la directive `@apply` dans des fichiers CSS globaux ou des modules CSS (avec parcimonie).
- La configuration se trouve dans `tailwind.config.js`.
- Le thème sombre est géré via des classes `dark:` de Tailwind (voir `../01_Architecture_Generale/06_Conventions_Codage.md` et `documentation/roadmap-dev-updated.md` sur l'implémentation du thème sombre).

## Internationalisation (i18n)

- La bibliothèque `next-intl` est utilisée pour l'internationalisation.
- Les traductions sont stockées dans des fichiers JSON (ex: `messages/fr.json`).
- Utiliser le hook `useTranslations` dans les Client Components et `getTranslator` dans les Server Components.
- Référez-vous à `../01_Architecture_Generale/08_Internationalisation_i18n.md` pour plus de détails.

## Tests des Composants Frontend

- Utiliser Jest et React Testing Library pour tester les composants.
- Se concentrer sur le test du comportement du composant du point de vue de l'utilisateur.
- Vérifier que les éléments sont rendus correctement, que les interactions déclenchent les bons comportements, et que l'accessibilité est respectée.
- Référez-vous à `03_Debogage_Tests.md`.

Ce guide devrait vous aider à développer des interfaces utilisateur cohérentes, performantes et maintenables pour Mathildanesth.
