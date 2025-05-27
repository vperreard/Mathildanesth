# Plan de Fusion Bloc-Opératoire

## 📊 Tableau Comparatif des Fonctionnalités

| Fonctionnalité | Version User | Version Admin | Action |
|----------------|--------------|---------------|---------|
| **Planning interactif** | ✅ BlocPlanning, OptimizedBlocPlanning | ❌ | Conserver User |
| **Vue jour/semaine/mois** | ✅ Multiple vues | ❌ | Conserver User |
| **Création/édition planning** | ✅ BlocPlanningEditor | ❌ | Conserver User |
| **Gestion vacations** | ✅ BlocVacation | ❌ | Conserver User |
| **CRUD Salles** | ⚠️ Basique | ✅ Complet (forms, validation) | Conserver Admin |
| **CRUD Secteurs** | ❌ | ✅ Complet | Conserver Admin |
| **Règles supervision** | ✅ Vue simple | ✅ CRUD complet | Fusionner |
| **Optimisations performance** | ✅ Hooks optimisés | ❌ | Propager partout |
| **Autorisations** | ⚠️ Basique | ✅ Vérifications admin | Améliorer |

## 🔧 Composants Réutilisables

### Composants à conserver intégralement

**De la version User:**
```typescript
// Composants de planning (complexes, bien testés)
- BlocPlanning.tsx -> Composant principal
- OptimizedBlocPlanning.tsx -> Version optimisée  
- BlocPlanningEditor.tsx -> Éditeur complet
- BlocDayPlanningEditor.tsx -> Éditeur jour
- BlocDayPlanningView.tsx -> Vue jour
- BlocVacation.tsx -> Gestion vacations
```

**De la version Admin:**
```typescript
// Composants CRUD (complets avec validation)
- OperatingRoomForm.tsx -> Formulaire salles
- OperatingRoomList.tsx -> Liste salles  
- OperatingSectorForm.tsx -> Formulaire secteurs
- OperatingSectorList.tsx -> Liste secteurs
- ReglesSupervisionAdmin.tsx -> CRUD règles
```

### Composants à fusionner

```typescript
// Règles de supervision - garder fonctionnalités des deux
- /bloc-operatoire/regles-supervision/page.tsx (vue user)
- /admin/bloc-operatoire/regles-supervision/page.tsx (CRUD admin)
=> Créer SupervisionRulesManager.tsx avec modes vue/édition

// Gestion des salles - unifier
- /bloc-operatoire/salles/page.tsx (basique)
- /admin/bloc-operatoire/salles/page.tsx (complet)
=> Utiliser version admin avec permissions
```

## 🏗️ Architecture Cible Détaillée

```
/src/app/(app)/bloc-operatoire/
├── layout.tsx                    # Layout commun avec navigation
├── page.tsx                      # Dashboard/vue d'ensemble
├── planning/
│   ├── page.tsx                  # Planning principal (ex BlocPlanning)
│   ├── create/[date]/page.tsx   # Création planning
│   ├── edit/[id]/page.tsx       # Édition planning
│   └── components/
│       ├── BlocPlanning.tsx
│       ├── BlocPlanningEditor.tsx
│       ├── BlocDayView.tsx
│       └── BlocVacation.tsx
├── salles/
│   ├── page.tsx                  # Liste salles (admin-aware)
│   ├── [id]/page.tsx            # Détail/édition salle
│   └── components/
│       ├── OperatingRoomForm.tsx
│       └── OperatingRoomList.tsx
├── secteurs/
│   ├── page.tsx                  # Liste secteurs (admin only)
│   ├── [id]/page.tsx            # Détail/édition secteur
│   └── components/
│       ├── OperatingSectorForm.tsx
│       └── OperatingSectorList.tsx
├── regles/
│   ├── page.tsx                  # Règles supervision unifiées
│   └── components/
│       └── SupervisionRulesManager.tsx
├── trames/
│   └── page.tsx                  # Trames (conservé de user)
└── _components/
    ├── BlocOperatoireNav.tsx     # Navigation avec tabs
    ├── PermissionGuard.tsx       # Garde pour sections admin
    └── OptimizedProvider.tsx     # Provider avec hooks optimisés
```

## 📋 Plan de Migration Étape par Étape

### Phase 1: Préparation (2 jours)
- [ ] Créer la nouvelle structure `/src/app/(app)/bloc-operatoire/`
- [ ] Mettre en place le layout avec navigation par tabs
- [ ] Créer `PermissionGuard` pour protéger les sections admin
- [ ] Configurer les redirections depuis les anciennes URLs

### Phase 2: Migration Planning (3 jours)
- [ ] Migrer `BlocPlanning` et `OptimizedBlocPlanning`
- [ ] Migrer tous les composants d'édition (Editor, DayEditor, etc.)
- [ ] Adapter les imports vers le module unifié
- [ ] Tester le planning complet

### Phase 3: Migration Admin (2 jours)
- [ ] Migrer les composants CRUD salles
- [ ] Migrer les composants CRUD secteurs
- [ ] Fusionner les règles de supervision
- [ ] Implémenter les vérifications de permissions

### Phase 4: Unification Services (2 jours)
- [ ] Pointer tous les imports vers `/modules/planning/bloc-operatoire/services/`
- [ ] Supprimer les services dupliqués
- [ ] Mettre à jour tous les hooks
- [ ] Valider les appels API

### Phase 5: Optimisations (1 jour)
- [ ] Implémenter lazy loading pour les vues admin
- [ ] Propager `useOptimizedBlocOperatoire` partout
- [ ] Ajouter cache React Query sur les listes
- [ ] Optimiser les re-renders

### Phase 6: Tests & Nettoyage (2 jours)
- [ ] Migrer et adapter les tests existants
- [ ] Ajouter tests pour les nouvelles fonctionnalités
- [ ] Supprimer `/src/app/bloc-operatoire/` (ancienne version)
- [ ] Supprimer `/src/app/admin/bloc-operatoire/` (ancienne version)
- [ ] Mettre à jour la documentation

## ⏱️ Estimations de Temps

| Phase | Durée | Complexité | Risques |
|-------|-------|------------|---------|
| Préparation | 2 jours | Faible | Aucun |
| Migration Planning | 3 jours | Élevée | Régression fonctionnelle |
| Migration Admin | 2 jours | Moyenne | Permissions incorrectes |
| Unification Services | 2 jours | Moyenne | Breaking changes API |
| Optimisations | 1 jour | Faible | Performance dégradée |
| Tests & Nettoyage | 2 jours | Faible | Tests manquants |
| **TOTAL** | **12 jours** | **Moyenne** | - |

## 🚀 Optimisations Recommandées

### Lazy Loading Admin
```typescript
// Dans layout.tsx
const AdminSections = dynamic(() => import('./_components/AdminSections'), {
  loading: () => <Skeleton />,
  ssr: false
});

// Charger uniquement si admin
{isAdmin && <AdminSections />}
```

### Cache Unifié
```typescript
// Hook unifié avec cache
export function useBlocOperatoire() {
  const { data: rooms } = useQuery({
    queryKey: ['operating-rooms'],
    staleTime: 5 * 60 * 1000, // 5 min
  });
  
  const { data: sectors } = useQuery({
    queryKey: ['operating-sectors'],
    staleTime: 5 * 60 * 1000,
  });
  
  return { rooms, sectors };
}
```

### Navigation Intelligente
```typescript
// Navigation avec préchargement
const BlocOperatoireNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  
  // Précharger la prochaine vue probable
  useEffect(() => {
    if (pathname.includes('planning')) {
      router.prefetch('/bloc-operatoire/salles');
    }
  }, [pathname]);
  
  return <NavigationTabs />;
};
```

## 📝 Notes de Migration

1. **URLs à maintenir** pour éviter les 404:
   - Rediriger `/admin/bloc-operatoire/*` vers `/bloc-operatoire/*`
   - Maintenir les mêmes slugs pour l'API

2. **Permissions granulaires**:
   - Vue planning: tous les utilisateurs connectés
   - CRUD salles: admin ou responsable bloc
   - CRUD secteurs: admin uniquement

3. **État global** à considérer:
   - Utiliser Zustand pour l'état du planning
   - React Query pour toutes les données serveur

4. **Tests E2E** critiques:
   - Création de planning complet
   - CRUD salle avec vérification permissions
   - Navigation entre vues