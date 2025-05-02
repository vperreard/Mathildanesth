# Documentation du système de validation des dates

## Introduction

Le hook `useDateValidation` est un système centralisé et robuste pour la validation des dates et des plages de dates dans l'application Mathildanesth. Il gère de nombreux scénarios de validation, notamment:

- Validation des dates passées/futures
- Vérification de cohérence des plages de dates
- Validation des jours spécifiques (week-ends, jours fériés)
- Gestion des périodes non disponibles (blackout)
- Vérification des quotas disponibles
- Messages d'erreurs standardisés

Ce système a été conçu pour être utilisé dans tous les composants nécessitant une validation de dates, afin de centraliser la logique et d'assurer une expérience utilisateur cohérente.

## Utilisation du hook

### Importation

```tsx
import { useDateValidation, DateValidationErrorType } from '../hooks/useDateValidation';
```

### Initialisation

```tsx
const {
  validateDate,
  validateDateRange,
  getErrorMessage,
  hasError,
  resetErrors
} = useDateValidation();
```

### Validation d'une date unique

```tsx
const dateValide = validateDate(dateDebut, 'dateDebut', {
  required: true,
  allowPastDates: false,
  minAdvanceNotice: 3 // 3 jours minimum à l'avance
});
```

### Validation d'une plage de dates

```tsx
const plageValide = validateDateRange(
  dateDebut,
  dateFin,
  'dateDebut',
  'dateFin',
  {
    required: true,
    minDuration: 1,
    maxDuration: 30
  }
);
```

### Vérification et affichage des erreurs

```tsx
if (hasError('dateDebut')) {
  // Obtenir le message d'erreur personnalisé
  const message = getErrorMessage('dateDebut');
  
  // Afficher l'erreur
  <p className="text-red-500">{message}</p>
}
```

## Options de validation

Le hook accepte de nombreuses options pour personnaliser la validation:

| Option | Type | Description |
|--------|------|-------------|
| `required` | boolean | Indique si le champ est obligatoire |
| `allowPastDates` | boolean | Autorise ou non les dates dans le passé |
| `allowFutureDates` | boolean | Autorise ou non les dates dans le futur |
| `disallowWeekends` | boolean | Interdit les week-ends |
| `onlyBusinessDays` | boolean | Accepte uniquement les jours ouvrables |
| `holidays` | Date[] | Liste des jours fériés à exclure |
| `minDuration` | number | Durée minimale en jours (pour les plages) |
| `maxDuration` | number | Durée maximale en jours (pour les plages) |
| `minAdvanceNotice` | number | Nombre de jours minimal avant la date actuelle |
| `maxAdvanceBooking` | number | Nombre maximum de jours dans le futur |
| `blackoutPeriods` | DateRange[] | Périodes bloquées/indisponibles |
| `availableDaysPerYear` | number | Quota annuel disponible (congés, etc.) |
| `businessDaysOnly` | boolean | Compte uniquement les jours ouvrables |

## Fonctions principales

| Fonction | Description |
|----------|-------------|
| `validateDate(date, fieldName, options)` | Valide une date unique |
| `validateDateRange(startDate, endDate, startFieldName, endFieldName, options)` | Valide une plage de dates |
| `validateLeaveRequest(start, end, userId, options)` | Valide une demande de congés |
| `validateShiftAssignment(date, shift, userId, options)` | Valide une affectation de garde |
| `validateOverlap(newRange, existingRanges, fieldName)` | Vérifie les chevauchements avec des plages existantes |
| `detectConflicts(userId, date, type, existingEvents)` | Détecte les conflits avec des événements existants |

## Gestion des erreurs

Les erreurs sont identifiées par des types standardisés:

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
  // ... et plus
}
```

### Fonctions utilitaires pour les erreurs

| Fonction | Description |
|----------|-------------|
| `getErrorMessage(fieldName)` | Récupère le message d'erreur pour un champ |
| `getErrorType(fieldName)` | Récupère le type d'erreur pour un champ |
| `getErrorDetails(fieldName)` | Récupère les détails additionnels de l'erreur |
| `hasError(fieldName)` | Vérifie si un champ a une erreur |
| `resetErrors()` | Réinitialise toutes les erreurs |

## Exemples d'intégration

### Formulaire de réservation

```tsx
// Dans un formulaire
const { validateDate, validateDateRange, hasError, getErrorMessage } = useDateValidation();

const handleDateChange = (e) => {
  const date = new Date(e.target.value);
  
  const isValid = validateDate(date, 'dateReservation', {
    required: true,
    allowPastDates: false,
    minAdvanceNotice: 2
  });
  
  if (isValid) {
    // Mettre à jour le state ou autre logique
  }
};

// Dans le rendu
<input 
  type="date" 
  onChange={handleDateChange}
  className={hasError('dateReservation') ? 'border-red-500' : 'border-gray-300'}
/>
{hasError('dateReservation') && (
  <p className="text-red-500">{getErrorMessage('dateReservation')}</p>
)}
```

### Validation de plage de dates pour congés

```tsx
const handleSubmit = (e) => {
  e.preventDefault();
  
  const isValid = validateDateRange(
    startDate,
    endDate,
    'dateDebut', 
    'dateFin',
    {
      required: true,
      allowPastDates: false,
      minDuration: 1,
      maxDuration: 30,
      minAdvanceNotice: 3,
      blackoutPeriods: periodesIndisponibles
    }
  );
  
  if (isValid) {
    // Soumission du formulaire
    submitForm();
  }
};
```

### Validation de plage de dates pour export de calendrier

```tsx
const handleExport = () => {
  const isValid = validateDateRange(
    startDate,
    endDate,
    'exportStartDate',
    'exportEndDate',
    {
      required: true,
      allowPastDates: true, // Permettre l'export de données historiques
      maxDuration: 365 // Limiter à un an
    }
  );
  
  if (isValid) {
    // Procéder à l'export
    exportCalendar();
  }
};
```

## Bonnes pratiques

1. **Validation en temps réel**: Utilisez le hook pour valider les dates dès qu'elles sont modifiées.
2. **Réutilisation du contexte**: Utilisez `setContext` pour partager des informations entre plusieurs validations.
3. **Gestion des erreurs**: Affichez toujours les erreurs au bon endroit dans l'interface.
4. **Validation à la soumission**: Vérifiez toujours la validité avant de soumettre un formulaire.
5. **Nommage cohérent**: Utilisez des noms de champs cohérents dans toute l'application.

## Architecture technique

Le système de validation de dates est construit autour de plusieurs éléments clés:

- Validation des dates individuelles
- Validation des plages de dates
- Gestion d'un contexte partagé
- Détection de chevauchements
- Calcul de durées (totales et jours ouvrés)
- Messages d'erreur standardisés
- Intégration avec le système global de gestion d'erreurs

## Conseils de débogage

Si vous rencontrez des problèmes avec la validation:

1. Vérifiez que vous passez le bon format de date (objet Date ou chaîne)
2. Inspectez les erreurs avec `console.log(getErrorType('fieldName'))`
3. Assurez-vous que les noms de champs sont uniques
4. Utilisez `resetErrors()` avant de démarrer une nouvelle validation

## Conseils pour les développeurs

1. **Nommez clairement vos champs**: Utilisez des noms explicites pour les champs dans les appels à `validateDate` et `validateDateRange`.
2. **Centralisez la logique métier**: Utilisez les fonctions spécialisées comme `validateLeaveRequest` pour centraliser la logique métier.
3. **Évitez la duplication**: Ne réimplémentez pas la logique de validation, utilisez ce hook.
4. **Testez les cas limites**: Couvrez tous les cas limites dans vos tests unitaires.
5. **Personnalisez les options**: Adaptez les options à chaque cas d'utilisation spécifique. 