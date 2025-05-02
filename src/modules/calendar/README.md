# Module Calendar - Documentation

## Aperçu

Le module Calendar fournit un ensemble complet de composants pour gérer la planification du bloc opératoire, incluant des fonctionnalités de calendrier avancées, une visualisation intuitive des opérations et un retour visuel immédiat pour améliorer l'expérience utilisateur.

## Structure du module

```
src/modules/calendar/
├── components/          # Composants React du module
│   ├── feedback/        # Composants de feedback visuel
│   │   ├── SkeletonLoader.tsx    # Placeholders de chargement
│   │   ├── Spinner.tsx           # Indicateurs de chargement rotatifs
│   │   ├── ProgressBar.tsx       # Barres de progression
│   │   ├── Toast.tsx             # Notifications temporaires
│   │   ├── Tooltip.tsx           # Infobulles contextuelles
│   │   └── index.ts              # Export centralisé
│   ├── OperationRoomSchedule.tsx # Planification du bloc opératoire
│   ├── OperationForm.tsx         # Formulaire d'opération
│   └── ...                       # Autres composants
├── context/             # Context API pour la gestion d'état
├── hooks/               # Hooks personnalisés
├── services/            # Services et appels API
├── types/               # Définitions TypeScript
└── utils/               # Fonctions utilitaires
```

## Composants de feedback visuel

Le module implémente un système cohérent de feedback visuel pour améliorer l'expérience utilisateur:

### SkeletonLoader

Affiche des placeholders animés pendant le chargement initial des données.

```tsx
import { SkeletonLoader } from '@/modules/calendar/components/feedback';

// Usage simple
<SkeletonLoader width="100%" height="20px" count={3} />

// Utilisation des squelettes spécialisés
<SkeletonCalendarDay />
<SkeletonCalendarHeader />
<SkeletonOperationRoomSchedule />
```

### Spinner

Affiche un indicateur de chargement rotatif pour les opérations asynchrones.

```tsx
import { Spinner, CalendarLoadingSpinner, FormSubmitSpinner } from '@/modules/calendar/components/feedback';

// Spinner standard
<Spinner size="md" color="primary" />

// Spinner plein écran avec overlay
<Spinner fullScreen label="Chargement des données..." />

// Spinners spécialisés
<CalendarLoadingSpinner />
<FormSubmitSpinner label="Enregistrement en cours..." />
```

### ProgressBar

Affiche la progression des opérations longues.

```tsx
import { ProgressBar, ImportProgress, OperationSaveProgress } from '@/modules/calendar/components/feedback';

// Barre de progression standard
<ProgressBar 
  progress={75} 
  color="primary" 
  height={8} 
  showPercentage 
  label="Chargement" 
/>

// Composants spécialisés
<ImportProgress progress={45} total={100} />
<OperationSaveProgress step={2} totalSteps={5} currentTask="Validation des données" />
```

### Toast

Affiche des notifications temporaires pour les confirmations et erreurs.

```tsx
import { Toast, useToast } from '@/modules/calendar/components/feedback';

// Utilisation du hook
const { showSuccess, showError, showWarning, showInfo, ToastContainer } = useToast();

// Afficher un toast
showSuccess('Opération enregistrée avec succès');
showError('Erreur lors de l'enregistrement');

// N'oubliez pas d'ajouter le conteneur dans votre composant
return (
  <div>
    {/* Votre contenu */}
    <ToastContainer />
  </div>
);
```

### Tooltip

Affiche des infobulles contextuelles pour l'aide utilisateur.

```tsx
import { Tooltip, TooltipIcon, HelpTooltip } from '@/modules/calendar/components/feedback';

// Tooltip standard
<Tooltip content="Information supplémentaire" position="top">
  <button>Hover me</button>
</Tooltip>

// Composants spécialisés
<TooltipIcon content="Cette opération nécessite une validation" />
<HelpTooltip content="Cliquez pour ajouter une nouvelle opération" />
```

## Composants principaux

### OperationRoomSchedule

Visualisation et planification des opérations dans les différentes salles du bloc opératoire.

```tsx
import { OperationRoomSchedule } from '@/modules/calendar/components';

<OperationRoomSchedule 
  sectors={sectors}
  onOperationClick={handleOperationClick}
  onTimeSlotClick={handleTimeSlotClick}
  isReadOnly={false}
/>
```

### OperationForm

Formulaire pour créer ou modifier une opération chirurgicale.

```tsx
import { OperationForm } from '@/modules/calendar/components';

<OperationForm
  initialValues={initialValues}
  sectors={sectors}
  staff={staff}
  patients={patients}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isEditing={false}
/>
```

## Utilisation avec Animation

Le module utilise Framer Motion pour des animations fluides:

```tsx
import { motion, AnimatePresence } from 'framer-motion';

// Exemple d'animation de transition entre dates
<AnimatePresence mode="wait" custom={direction}>
  <motion.div
    key={currentDate.toString()}
    custom={direction}
    variants={variants}
    initial="enter"
    animate="center"
    exit="exit"
  >
    {/* Contenu */}
  </motion.div>
</AnimatePresence>
```

## Dépendances

- react-hook-form: Gestion des formulaires
- framer-motion: Animations fluides
- date-fns: Manipulation des dates
- tailwindcss: Styling
- react-window: Virtualisation pour les grands ensembles de données

## Bonnes pratiques

- Utilisez les composants de feedback visuel de manière cohérente
- Fournissez toujours un retour visuel pour les opérations asynchrones
- Utilisez les transitions animées pour les changements d'état importants
- Validez les données côté client avant soumission
- Gérez les erreurs avec des messages clairs et des options de récupération 