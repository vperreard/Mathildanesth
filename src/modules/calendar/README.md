# Plan de refactorisation du module Calendar

## Nouvelle architecture (pattern module)

```
src/modules/calendar/
├── components/
│   ├── base/                  # Composants de base réutilisables
│   │   ├── BaseCalendar.tsx   # Wrapper autour de FullCalendar
│   │   ├── CalendarToolbar.tsx # Barre d'outils indépendante
│   │   ├── CalendarLegend.tsx # Légende du calendrier
│   │   └── CalendarEvent.tsx  # Rendu standardisé d'événement
│   ├── views/                 # Vues spécifiques
│   │   ├── PersonalCalendar.tsx
│   │   ├── CollectiveCalendar.tsx
│   │   └── AllocationCalendar.tsx
│   └── modals/                # Composants de modaux
│       ├── EventDetailsModal.tsx
│       └── ...
├── hooks/
│   ├── useCalendar.ts         # Hook principal refactorisé
│   ├── useCalendarEvents.ts   # Hook pour la gestion des événements
│   ├── useCalendarNavigation.ts # Hook pour la navigation entre dates
│   ├── useCalendarSettings.ts # Hook pour les paramètres utilisateur
│   └── useCalendarCache.ts    # Nouveau hook pour la mise en cache
├── services/
│   ├── calendarService.ts     # Services pour l'API
│   ├── calendarCache.ts       # Service de cache
│   └── eventFormatter.ts      # Formatage des événements
├── store/
│   ├── calendarSlice.ts       # Store global pour les données partagées
│   └── calendarSelectors.ts   # Sélecteurs pour le store
└── types/
    ├── event.ts               # Types d'événements
    ├── settings.ts            # Types de paramètres
    └── cache.ts               # Types pour le cache
```

## Séparation logique métier / interface utilisateur

1. **Niveau données** : `services/` et `store/`
   - Gestion des appels API, formatage des données, cache
   - État global du calendrier via un store centralisé

2. **Niveau logique** : `hooks/`
   - Séparation des responsabilités en hooks spécialisés
   - Abstraction des comportements complexes

3. **Niveau interface** : `components/`
   - Composants purement UI qui utilisent les hooks pour leur logique
   - Structure hiérarchique avec composants de base et composants spécifiques

## Optimisations de performance

1. **Réduction des rendus inutiles**
   - Utilisation de `React.memo` pour les composants purs
   - Utilisation de `useCallback` et `useMemo` pour la mémorisation
   - Extraction des états qui changent fréquemment dans des composants isolés

2. **Système de cache**
   - Cache côté client pour les événements récurrents
   - Stratégie de mise en cache basée sur la plage de dates et les filtres
   - Invalidation intelligente du cache

3. **Chargement paresseux**
   - Chargement des événements uniquement pour la plage de dates visible
   - Chargement progressif des données supplémentaires

## Système de cache

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl: number; // Durée de vie en millisecondes
  key: string; // Clé de cache unique
}

interface CalendarCache {
  events: Map<string, CacheEntry<AnyCalendarEvent[]>>;
  settings: Map<string, CacheEntry<CalendarSettings>>;
}
```

## Plan de tests unitaires

1. **Tests de composants**
   - Tests de rendu pour les composants de base
   - Tests d'interaction utilisateur (clics, navigation)
   - Tests de rendu conditionnel

2. **Tests de hooks**
   - Tests des comportements des hooks avec différents paramètres
   - Tests des cas d'erreur et de chargement

3. **Tests de services**
   - Tests des appels API (avec mock)
   - Tests du système de cache
   - Tests des formateurs de données

4. **Tests d'intégration**
   - Tests de flux complets (navigation, filtrage, etc.)
   - Tests de performance

## Implémentation progressive

1. Créer la nouvelle structure de dossiers
2. Refactoriser les services et le système de cache
3. Refactoriser les hooks en séparant les responsabilités
4. Refactoriser les composants en commençant par les composants de base
5. Mettre en place les tests unitaires
6. Optimiser les performances et vérifier la couverture des tests

## Résumé des améliorations réalisées

### Composants implémentés
- **CalendarToolbar** : Composant de barre d'outils réutilisable pour la navigation

### Hooks implémentés
- **useCalendarCache** : Hook de gestion du cache avec invalidation intelligente
- **useCalendarNavigation** : Hook de navigation entre les périodes du calendrier
- **useCalendar** : Hook principal refactorisé qui combine les hooks spécialisés

### Services implémentés
- **calendarCache** : Service de cache singleton pour les événements du calendrier

### Tests implémentés
- **useCalendarCache.test.tsx** : Tests unitaires pour le hook de cache

## Prochaines étapes

1. **Finaliser la structure des dossiers**
   - Créer les dossiers manquants
   - Déplacer et adapter les fichiers existants

2. **Refactoriser les composants restants**
   - Séparer BaseCalendar en composants plus petits
   - Créer un composant CalendarEvent standardisé
   - Adapter les vues spécifiques pour utiliser nos nouveaux hooks

3. **Compléter les tests**
   - Ajouter des tests pour useCalendarNavigation
   - Tester les composants de base
   - Mettre en place des tests d'intégration

4. **Documentation**
   - Documenter l'utilisation de chaque hook
   - Créer des exemples d'utilisation
   - Mettre à jour la documentation générale

5. **Mesurer les performances**
   - Utiliser React DevTools pour évaluer le nombre de rendus
   - Mesurer les performances du cache
   - Identifier et corriger les points faibles 