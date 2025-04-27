# Documentation du système de validation des dates

## Vue d'ensemble

Le hook `useDateValidation` est un système centralisé et robuste pour la validation des dates et des plages de dates dans l'application Mathildanesth. Il gère de nombreux scénarios de validation, notamment:

- Validation des dates passées/futures
- Vérification des plages (début/fin cohérentes)
- Gestion des jours fériés et week-ends
- Vérification des règles métier (délais minimums, durées, etc.)
- Détection des conflits entre plannings
- Périodes bloquées (blackout)
- Gestion des jours ouvrables
- Quotas de jours disponibles
- Validation des demandes de congés
- Validation des affectations de garde
- Détection des conflits d'emploi du temps

## Installation

Le hook est déjà intégré dans le projet. Il utilise les dépendances suivantes:
- `date-fns` pour la manipulation des dates
- `@testing-library/react` pour les tests

## Utilisation de base

### Importer le hook

```typescript
import { useDateValidation, DateValidationErrorType } from '../hooks/useDateValidation';
```

### Utiliser le hook dans un composant

```typescript
function MonFormulaire() {
  const { 
    validateDate, 
    validateDateRange, 
    validateOverlap, 
    getErrorMessage, 
    hasError 
  } = useDateValidation();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Valider une date simple
    const dateValide = validateDate(dateDebut, 'dateDebut', { 
      required: true,
      disallowWeekends: true 
    });
    
    // Valider une plage de dates
    const plageValide = validateDateRange(
      dateDebut,
      dateFin,
      'dateDebut',
      'dateFin',
      { 
        minDuration: 2,
        maxDuration: 30
      }
    );
    
    if (dateValide && plageValide) {
      // Soumettre le formulaire
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Date de début</label>
        <DatePicker value={dateDebut} onChange={setDateDebut} />
        {hasError('dateDebut') && (
          <p className="error">{getErrorMessage('dateDebut')}</p>
        )}
      </div>
      
      <div>
        <label>Date de fin</label>
        <DatePicker value={dateFin} onChange={setDateFin} />
        {hasError('dateFin') && (
          <p className="error">{getErrorMessage('dateFin')}</p>
        )}
      </div>
      
      <button type="submit">Valider</button>
    </form>
  );
}
```

## API

### Hook `useDateValidation`

#### Méthodes retournées

| Méthode | Description |
|---------|-------------|
| `validateDate(date, fieldName, options)` | Valide une date unique |
| `validateDateRange(startDate, endDate, startFieldName, endFieldName, options)` | Valide une plage de dates |
| `validateOverlap(newRange, existingRanges, fieldName)` | Vérifie si une plage chevauche d'autres plages existantes |
| `validateLeaveRequest(start, end, userId, options)` | Valide une demande de congés |
| `validateShiftAssignment(date, shift, userId, options)` | Valide une affectation de garde |
| `detectConflicts(userId, date, type, existingEvents)` | Détecte les conflits pour un utilisateur à une date donnée |
| `getErrorMessage(fieldName)` | Récupère le message d'erreur pour un champ |
| `getErrorDetails(fieldName)` | Récupère les détails supplémentaires de l'erreur |
| `getErrorType(fieldName)` | Récupère le type d'erreur pour un champ |
| `hasError(fieldName)` | Vérifie si un champ a une erreur |
| `resetErrors()` | Réinitialise toutes les erreurs |
| `setContext(context)` | Définit le contexte de validation (ex: jours utilisés) |
| `resetContext()` | Réinitialise le contexte de validation |
| `resetAll()` | Réinitialise à la fois les erreurs et le contexte |

#### Options de validation

L'objet `options` permet de personnaliser les règles de validation:

| Option | Type | Description |
|--------|------|-------------|
| `required` | boolean | Indique si la date est obligatoire |
| `allowPastDates` | boolean | Autorise les dates dans le passé |
| `allowFutureDates` | boolean | Autorise les dates dans le futur |
| `minDate` | Date | Date minimale autorisée |
| `maxDate` | Date | Date maximale autorisée |
| `disallowWeekends` | boolean | Interdit les dates de week-end |
| `onlyBusinessDays` | boolean | N'autorise que les jours ouvrables |
| `holidays` | Date[] | Liste des jours fériés à exclure |
| `minDuration` | number | Durée minimale (en jours) |
| `maxDuration` | number | Durée maximale (en jours) |
| `format` | string | Format d'affichage des dates dans les messages d'erreur |
| `minAdvanceNotice` | number | Nombre minimum de jours à l'avance pour la réservation |
| `maxAdvanceBooking` | number | Nombre maximum de jours à l'avance pour la réservation |
| `blackoutPeriods` | DateRange[] | Périodes bloquées |
| `availableDaysPerYear` | number | Nombre de jours disponibles par an |
| `businessDaysOnly` | boolean | Compter uniquement les jours ouvrables pour les durées |

### Types d'erreurs

L'enum `DateValidationErrorType` contient tous les types d'erreurs possibles:

```typescript
enum DateValidationErrorType {
    REQUIRED = 'required',
    PAST_DATE = 'past_date',
    FUTURE_DATE = 'future_date',
    INVALID_FORMAT = 'invalid_format',
    START_AFTER_END = 'start_after_end',
    OVERLAPPING = 'overlapping',
    WEEKEND = 'weekend',
    HOLIDAY = 'holiday',
    MAX_DURATION = 'max_duration',
    MIN_DURATION = 'min_duration',
    INVALID_RANGE = 'invalid_range',
    MIN_ADVANCE_NOTICE = 'min_advance_notice',
    MAX_ADVANCE_BOOKING = 'max_advance_booking',
    BLACKOUT_PERIOD = 'blackout_period',
    EXCEEDS_AVAILABLE_DAYS = 'exceeds_available_days',
    INVALID_BUSINESS_DAYS = 'invalid_business_days'
}
```

### Contexte de validation

Le hook maintient un contexte de validation accessible via `context`:

```typescript
const { context } = useDateValidation();

// Contexte disponible
console.log(context.usedDays); // Jours déjà utilisés
console.log(context.remainingDays); // Jours restants
console.log(context.conflicts); // Conflits détectés
console.log(context.businessDaysCount); // Nombre de jours ouvrables
console.log(context.totalDaysCount); // Nombre total de jours
```

## Fonctions utilitaires exportées

Le module exporte également plusieurs fonctions utilitaires:

| Fonction | Description |
|----------|-------------|
| `formatDate(date, format?)` | Formate une date selon le format spécifié |
| `isValidDateString(dateString)` | Vérifie si une chaîne est une date valide |
| `normalizeDate(date)` | Normalise une date ou une chaîne en objet Date |
| `isHoliday(date, holidays)` | Vérifie si une date est un jour férié |
| `isWeekend(date)` | Vérifie si une date est un week-end |
| `isBusinessDay(date, holidays)` | Vérifie si une date est un jour ouvrable |
| `calculateDurationInDays(startDate, endDate)` | Calcule la durée entre deux dates en jours |
| `calculateBusinessDays(startDate, endDate, holidays)` | Calcule la durée en jours ouvrables |
| `datesOverlap(range1, range2)` | Vérifie si deux plages se chevauchent |
| `findOverlaps(range, existingRanges)` | Trouve les chevauchements entre une plage et une liste de plages |
| `isInBlackoutPeriod(date, blackoutPeriods)` | Vérifie si une date est dans une période bloquée |
| `isRangeInBlackoutPeriod(range, blackoutPeriods)` | Vérifie si une plage chevauche des périodes bloquées |

## Exemples d'utilisation avancée

### Validation avec délai minimum d'avertissement

```typescript
const isValid = validateDate(date, 'dateReservation', { 
  minAdvanceNotice: 3 // Doit réserver au moins 3 jours à l'avance
});
```

### Validation de plage avec jours ouvrables uniquement

```typescript
const isValid = validateDateRange(
  dateDebut, 
  dateFin, 
  'dateDebut', 
  'dateFin', 
  {
    businessDaysOnly: true,
    holidays: joursFeries,
    minDuration: 5 // 5 jours ouvrables minimum
  }
);
```

### Vérification des conflits de planning

```typescript
const nouvelleReservation = {
  start: new Date(2023, 5, 1),
  end: new Date(2023, 5, 5)
};

const reservationsExistantes = [
  { start: new Date(2023, 5, 3), end: new Date(2023, 5, 8), label: "Réunion équipe" },
  { start: new Date(2023, 5, 10), end: new Date(2023, 5, 15), label: "Formation" }
];

const isValid = validateOverlap(nouvelleReservation, reservationsExistantes, 'reservation');

if (!isValid) {
  // On peut accéder aux conflits via le contexte
  console.log(context.conflicts);
}
```

### Validation avec quota de jours disponibles

```typescript
// Définir le contexte avec les jours déjà utilisés
setContext({ usedDays: 10 });

const isValid = validateDateRange(
  dateDebut, 
  dateFin, 
  'dateDebut', 
  'dateFin', 
  {
    availableDaysPerYear: 25 // 25 jours de congés par an
  }
);

// Si valide, on peut accéder aux jours restants
console.log(context.remainingDays);
```

### Validation des demandes de congés

```typescript
// Définir le contexte avec les jours déjà utilisés
setContext({ usedDays: 15 });

const isValid = validateLeaveRequest(
  dateDebut,
  dateFin,
  'user123',
  {
    availableDaysPerYear: 25, // 25 jours de congés par an
    minAdvanceNotice: 3, // 3 jours minimum d'avance pour la demande
    businessDaysOnly: true, // Ne compter que les jours ouvrables
    holidays: joursFeries
  }
);

// Si valide, on peut accéder aux jours restants
console.log(context.remainingDays);
```

### Validation des affectations de garde

```typescript
// Périodes de repos obligatoire après des gardes précédentes
const periodesRepos = [
  { 
    start: new Date(2023, 5, 1), 
    end: new Date(2023, 5, 2), 
    type: 'rest_period',
    label: 'Repos après garde user123' 
  }
];

const isValid = validateShiftAssignment(
  new Date(2023, 5, 2), // Date de la nouvelle garde
  'nuit',
  'user123',
  {
    blackoutPeriods: periodesRepos
  }
);

if (!isValid) {
  // La garde ne peut pas être assignée pendant une période de repos
  console.log(getErrorMessage(`shift_nuit_user123`));
}
```

### Détection des conflits d'emploi du temps

```typescript
// Événements existants dans le planning
const evenementsExistants = [
  { 
    start: new Date(2023, 5, 1), 
    end: new Date(2023, 5, 5),
    type: 'leave_user123',
    label: 'Congés user123' 
  },
  { 
    start: new Date(2023, 5, 10), 
    end: new Date(2023, 5, 10),
    type: 'shift_user123',
    label: 'Garde jour user123' 
  }
];

// Vérifier si l'utilisateur peut être assigné à une date spécifique
const isValid = detectConflicts(
  'user123',
  new Date(2023, 5, 3),
  'meeting',
  evenementsExistants
);

if (!isValid) {
  // Il y a un conflit avec un événement existant
  console.log(context.conflicts);
}
```

## Tests

Le système est entièrement testé. Pour exécuter les tests:

```bash
npm test
```

Les tests couvrent tous les scénarios de validation:
- Validation des dates individuelles
- Validation des plages de dates
- Vérification des chevauchements
- Gestion des périodes bloquées
- Calcul des jours ouvrables
- Validation des quotas de jours disponibles
- Validation des demandes de congés
- Validation des affectations de garde
- Détection des conflits d'emploi du temps
- Etc.

## Bonnes pratiques

1. **Nommez clairement vos champs**: Utilisez des noms explicites pour les champs dans les appels à `validateDate` et `validateDateRange`.
2. **Personnalisez les messages**: Les messages d'erreur sont générés automatiquement mais peuvent être personnalisés via l'interface.
3. **Utilisez le contexte**: Le contexte de validation permet de partager des informations entre les différentes validations.
4. **Réinitialisez quand nécessaire**: Utilisez `resetErrors()` lors du chargement initial ou après des soumissions réussies.
5. **Vérifiez les détails**: Utilisez `getErrorDetails()` pour accéder aux détails supplémentaires des erreurs.

## Évolutions futures

- Support des fuseaux horaires
- Règles de validation personnalisées
- Support des répétitions (événements récurrents)
- Intégration avec des calendriers externes 