# Composant CalendarEventForm

Ce composant est un formulaire pour la création et la modification d'événements de calendrier dans l'application Mathildanesth. Il utilise le hook `useDateValidation` pour assurer la validation robuste des dates selon les règles métier spécifiques.

## Caractéristiques principales

- Création et modification d'événements de calendrier
- Validation des dates et des plages de dates
- Gestion des différents types d'événements (gardes, astreintes, consultations, etc.)
- Détection des conflits avec les événements existants
- Support pour les périodes d'interdiction et les jours fériés
- Gestion des heures et des événements sur toute la journée
- Interface adaptative avec formulaire bien structuré

## Utilisation

### Importation

```tsx
import CalendarEventForm, { CalendarEvent, CalendarEventType } from '@/components/calendrier/CalendarEventForm';
```

### Exemple d'utilisation basique

```tsx
import React, { useState } from 'react';
import CalendarEventForm, { CalendarEvent } from '@/components/calendrier/CalendarEventForm';

const CalendarPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const handleSubmit = async (event: CalendarEvent) => {
    // Sauvegarder l'événement avec votre service
    try {
      await calendarService.createEvent(event);
      setIsFormOpen(false);
      // Afficher une notification de succès
    } catch (error) {
      // Gérer l'erreur
    }
  };
  
  return (
    <div>
      <h1>Calendrier</h1>
      
      {isFormOpen ? (
        <CalendarEventForm
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      ) : (
        <button onClick={() => setIsFormOpen(true)}>
          Nouvel événement
        </button>
      )}
    </div>
  );
};
```

### Exemple avec données existantes

```tsx
// Pour la modification d'un événement existant
<CalendarEventForm
  event={existingEvent}
  existingEvents={allCalendarEvents}
  holidays={holidaysList}
  departments={departmentsList}
  users={usersList}
  minAdvanceNotice={3}
  onSubmit={handleUpdateEvent}
  onCancel={handleCancel}
/>
```

## Props

| Propriété | Type | Description | Défaut |
|-----------|------|-------------|--------|
| `event` | `Partial<CalendarEvent>` | Événement existant à modifier | `undefined` |
| `existingEvents` | `Array<{ id: string; start: Date; end: Date; title?: string }>` | Liste des événements existants pour la détection de conflits | `[]` |
| `holidays` | `Date[]` | Liste des jours fériés | `[]` |
| `blackoutPeriods` | `Array<{ start: Date; end: Date; label?: string }>` | Périodes d'interdiction | `[]` |
| `departments` | `Array<{ id: string; name: string }>` | Liste des services disponibles | `[]` |
| `users` | `Array<{ id: string; name: string }>` | Liste des utilisateurs disponibles | `[]` |
| `minAdvanceNotice` | `number` | Préavis minimum en jours | `0` |
| `onSubmit` | `(event: CalendarEvent) => Promise<void> \| void` | Fonction appelée lors de la soumission du formulaire | *Requis* |
| `onCancel` | `() => void` | Fonction appelée lors de l'annulation | *Requis* |

## Types

```typescript
export enum CalendarEventType {
  GARDE = 'garde',
  ASTREINTE = 'astreinte',
  REUNION = 'reunion',
  CONSULTATION = 'consultation',
  BLOC = 'bloc',
  AUTRE = 'autre'
}

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  type: CalendarEventType;
  startDateTime: Date;
  endDateTime: Date;
  allDay: boolean;
  departmentId?: string;
  location?: string;
  userId?: string;
  attendees?: string[];
  color?: string;
}
```

## Règles de validation spécifiques

- Les événements de type GARDE et ASTREINTE sont automatiquement définis comme "toute la journée"
- Les durées minimales et maximales varient selon le type d'événement :
  - GARDE/ASTREINTE : 24h min, 48h max
  - BLOC : 2h min, 12h max
  - CONSULTATION : 1h min, 8h max
  - REUNION : 30min min, 4h max
  - AUTRE : 15min min, 24h max
- Les weekends sont autorisés uniquement pour les gardes et astreintes
- La validation tient compte des conflits avec les événements existants
- Le préavis minimum s'applique uniquement à la création (pas à la modification)

## Intégration avec useDateValidation

Le composant utilise le hook `useDateValidation` pour gérer toutes les validations de dates :

```typescript
const {
  validateDate,
  validateDateRange,
  hasError,
  getErrorMessage,
  resetErrors,
  setContext
} = useDateValidation();
```

Le hook est utilisé à plusieurs endroits :
- À chaque changement de date/heure de début ou de fin
- Lors de la soumission du formulaire
- Pour afficher des messages d'erreur appropriés

## Personnalisation

Le composant est conçu pour être facilement personnalisable. Vous pouvez :

1. Ajouter des types d'événements dans l'enum `CalendarEventType`
2. Modifier les durées minimales et maximales dans les fonctions `getMinDurationForType` et `getMaxDurationForType`
3. Ajouter des validations spécifiques supplémentaires dans les gestionnaires d'événements
4. Personnaliser les messages d'erreur en modifiant les options de validation

## Exemples de cas d'utilisation

1. **Planification de garde** : Utiliser le type GARDE avec une durée de 24h, permettant les weekends
2. **Réunion d'équipe** : Utiliser le type REUNION avec une durée de 1-2h pendant les jours ouvrables
3. **Session de bloc opératoire** : Utiliser le type BLOC avec la durée appropriée
4. **Consultations** : Programmer des plages de consultations avec le type CONSULTATION

## Notes techniques

- Assurez-vous que les composants DatePicker, TimePicker, Select et Button sont disponibles dans votre application
- Le composant utilise date-fns pour les manipulations de dates
- Les validations sont effectuées à chaque modification importante pour fournir un feedback immédiat 