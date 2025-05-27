# Module Bloc Opératoire - Structure Unifiée

## Vue d'ensemble

Le module bloc opératoire a été unifié le 27/05/25, fusionnant les interfaces planning et administration dans une structure unique avec navigation par tabs.

## Architecture

```
/src/app/bloc-operatoire/
├── layout.tsx              # Layout avec navigation par tabs et PermissionGuard
├── page.tsx               # Page planning (par défaut)
├── planning/              # Routes planning
│   ├── [date]/           # Vue détaillée par date
│   ├── create/[date]/    # Création de planning
│   └── edit/[date]/      # Édition de planning
├── salles/               # Gestion des salles (admin)
│   ├── page.tsx
│   └── components/
├── secteurs/             # Gestion des secteurs (admin)
│   ├── page.tsx
│   └── components/
├── modeles/              # Modèles de planning (admin)
│   ├── page.tsx
│   └── components/
├── trames/               # Trames d'affectation (admin)
│   ├── page.tsx
│   └── components/
└── _components/          # Composants partagés
    ├── LazyAdminComponents.tsx    # Lazy loading admin
    └── OptimizedProvider.tsx      # Provider avec cache
```

## Navigation par Tabs

La navigation utilise le composant `BlocOperatoireNavigation` qui :
- Affiche des tabs selon les permissions utilisateur
- Tab "Planning" toujours visible pour tous
- Tabs admin (Salles, Secteurs, etc.) visibles uniquement pour ADMIN/SUPER_ADMIN
- Gestion automatique de l'état actif selon l'URL

## Optimisations Performance

### 1. Lazy Loading
Les composants admin sont chargés uniquement quand nécessaire :
```tsx
const SallesAdmin = lazy(() => import('../salles/components/SallesAdmin'));
```

### 2. Caching Intelligent
Le `OptimizedProvider` applique différentes stratégies de cache :
- Données statiques (salles, secteurs) : 5 minutes
- Données dynamiques (planning) : 30 secondes
- Invalidation automatique après mutations

### 3. Prefetching
Préchargement des données critiques au montage :
```tsx
usePrefetch(['operatingRooms', 'blocSectors', 'surgeons']);
```

## Permissions

Chaque tab est protégé par `PermissionGuard` :
- **Planning** : Tous les utilisateurs authentifiés
- **Salles/Secteurs** : ADMIN, SUPER_ADMIN
- **Modèles/Trames** : ADMIN, SUPER_ADMIN

## Migration depuis l'ancienne structure

Les anciennes routes `/admin/bloc-operatoire/*` ont été supprimées et remplacées par :
- `/admin/bloc-operatoire/salles` → `/bloc-operatoire/salles`
- `/admin/bloc-operatoire/secteurs` → `/bloc-operatoire/secteurs`
- etc.

## Points d'attention

1. **SSR** : Certaines pages nécessitent `'use client'` pour éviter les erreurs SSR
2. **Imports** : Utiliser les imports depuis `_components/LazyAdminComponents` pour les composants admin
3. **Cache** : Le cache React Query est partagé entre tous les tabs

## API Endpoints

- `/api/operating-rooms` - CRUD salles
- `/api/bloc-sectors` - CRUD secteurs  
- `/api/bloc-planning` - CRUD planning
- `/api/supervision-rules` - Règles de supervision
- `/api/trame-modeles` - Modèles de trames

## Tests

Les tests E2E Cypress couvrent :
- Navigation entre tabs
- Création/édition de planning
- Gestion des salles et secteurs
- Permissions et accès restreints

Voir `/cypress/e2e/bloc-operatoire/` pour les tests détaillés.