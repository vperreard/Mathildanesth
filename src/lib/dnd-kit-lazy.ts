// Lazy loading pour @dnd-kit afin d'améliorer les performances
import { lazy } from 'react';

// Import lazy des composants @dnd-kit les plus lourds
export const DndContext = lazy(() => 
  import('@dnd-kit/core').then(module => ({ default: module.DndContext }))
);

export const SortableContext = lazy(() => 
  import('@dnd-kit/sortable').then(module => ({ default: module.SortableContext }))
);

export const DragOverlay = lazy(() => 
  import('@dnd-kit/core').then(module => ({ default: module.DragOverlay }))
);

// Export des fonctions utilitaires (plus légères)
export {
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
} from '@dnd-kit/core';

export {
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';

export { CSS } from '@dnd-kit/utilities';

// Types
export type {
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';