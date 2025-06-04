# Composants UI Modernes pour le Bloc Opératoire

## Vue d'ensemble

Collection de composants React avancés pour la gestion du bloc opératoire avec drag & drop, animations fluides et interface moderne.

## Structure des composants

```
src/components/bloc-operatoire/
├── TrameEditor/              # Éditeur visuel de trames
│   ├── TrameEditor.tsx       # Composant principal
│   ├── WeeklyGrid.tsx        # Grille hebdomadaire interactive
│   ├── DragDropProvider.tsx  # Context pour drag & drop
│   └── hooks/
│       ├── useTrameEditor.ts
│       └── useDragDrop.ts
├── PlanningWeekView/         # Vue calendrier améliorée
│   ├── PlanningWeekView.tsx
│   ├── WeekNavigator.tsx
│   ├── ViewModeSelector.tsx
│   └── FilterPanel.tsx
├── RoomAssignmentPanel/      # Panel d'affectation intelligent
│   ├── RoomAssignmentPanel.tsx
│   ├── SupervisorSelector.tsx
│   ├── ConflictIndicator.tsx
│   └── ValidationPanel.tsx
├── UI/                       # Composants UI réutilisables
│   ├── TemplateApplicator.tsx
│   ├── DragDropArea.tsx
│   ├── LoadingStates.tsx
│   └── AnimatedCard.tsx
└── styles/                   # Styles et thèmes
    ├── bloc-operatoire.css
    └── animations.css
```

## Technologies utilisées

- **React 18** avec hooks avancés
- **TypeScript** pour la sécurité des types
- **Framer Motion** pour les animations
- **React Beautiful DnD** pour le drag & drop
- **Tailwind CSS** pour le styling
- **Radix UI** pour les composants de base
- **React Query** pour la gestion des données

## Fonctionnalités

### TrameEditor
- Grille hebdomadaire interactive
- Drag & drop pour créer/modifier les affectations
- Codes couleurs par type d'activité et secteur
- Preview temps réel des modifications
- Validation instantanée des conflits

### PlanningWeekView
- Vue calendrier responsive et moderne
- Navigation fluide entre semaines
- Filtres par salle, secteur, superviseur
- Zoom et modes d'affichage multiples
- Synchronisation en temps réel

### RoomAssignmentPanel
- Sélection superviseurs avec disponibilités temps réel
- Validation conflits instantanée
- Suggestions automatiques basées sur règles
- Interface tactile friendly

### Composants UI avancés
- SupervisorSelector avec search et filtres
- ConflictIndicator avec détails popup
- TemplateApplicator pour application trames
- ValidationPanel avec feedback visuel

## Usage

```tsx
import { TrameEditor } from '@/components/bloc-operatoire/TrameEditor';
import { PlanningWeekView } from '@/components/bloc-operatoire/PlanningWeekView';

function BlocOperatoirePage() {
  return (
    <div className="bloc-operatoire-container">
      <TrameEditor />
      <PlanningWeekView />
    </div>
  );
}
```

## Tests

Tous les composants incluent :
- Tests unitaires avec Jest et React Testing Library
- Tests d'interaction drag & drop
- Tests de validation temps réel
- Tests responsive design
- Tests accessibilité (WCAG)

## Accessibilité

- Support complet clavier
- ARIA labels appropriés
- Navigation focus optimisée
- Contrastes élevés
- Support lecteurs d'écran 