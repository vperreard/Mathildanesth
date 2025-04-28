# Système de validation des dates dans Mathildanesth

## Introduction

Ce document décrit l'implémentation et l'utilisation du système centralisé de validation des dates dans Mathildanesth. Cette approche standardisée garantit la cohérence de la validation des dates à travers toute l'application et facilite la maintenance du code.

## Architecture

Le système de validation de dates est implémenté via le hook `useDateValidation`, situé dans `src/hooks/useDateValidation.ts`. Ce hook expose des fonctions de validation ainsi que des utilitaires pour simplifier la manipulation et la validation des dates.

### Composants du système

1. **Hook central de validation** : `useDateValidation`
2. **Types d'erreurs standardisés** : `DateValidationErrorType`
3. **Options de validation configurables** : `DateValidationOptions`
4. **Fonctions utilitaires de manipulation de dates**
5. **Intégration avec le système global de gestion d'erreurs**

## Utilisation

### Importer le hook de validation

```typescript
import { useDateValidation, DateValidationErrorType } from '../hooks/useDateValidation';
```

### Récupérer les fonctions de validation

```typescript
const {
  validateDate,
  validateDateRange,
  getErrorMessage,
  hasError,
  resetErrors
} = useDateValidation();
```

### Valider une date individuelle

```typescript
// Validation d'une date
validateDate(dateValue, 'startDate', {
  required: true,
  allowPastDates: false,
  disallowWeekends: false,
  minAdvanceNotice: 1 // Au moins 1 jour à l'avance
});

// Vérifier s'il y a une erreur
if (hasError('startDate')) {
  console.log(getErrorMessage('startDate'));
}
```

### Valider une plage de dates

```typescript
validateDateRange(
  startDate,
  endDate,
  'startDate',
  'endDate',
  {
    required: true,
    minDuration: 1,
    maxDuration: 30
  }
);
```

## Options de validation

Le système supporte les options de validation suivantes:

| Option | Type | Description |
|--------|------|-------------|
| `required` | boolean | Si la date est obligatoire |
| `allowPastDates` | boolean | Si les dates dans le passé sont autorisées |
| `allowFutureDates` | boolean | Si les dates dans le futur sont autorisées |
| `minDate` | Date | Date minimale autorisée |
| `maxDate` | Date | Date maximale autorisée |
| `disallowWeekends` | boolean | Interdire les week-ends |
| `onlyBusinessDays` | boolean | Autoriser uniquement les jours ouvrables |
| `holidays` | Date[] | Liste des jours fériés à exclure |
| `maxDuration` | number | Durée maximale en jours pour une plage |
| `minDuration` | number | Durée minimale en jours pour une plage |
| `minAdvanceNotice` | number | Délai minimum avant la date (en jours) |
| `maxAdvanceBooking` | number | Délai maximum de réservation à l'avance |
| `blackoutPeriods` | DateRange[] | Périodes bloquées |
| `businessDaysOnly` | boolean | Compter uniquement les jours ouvrables |

## Types d'erreurs

Le système définit plusieurs types d'erreurs pour couvrir différents cas de validation:

```typescript
export enum DateValidationErrorType {
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

## Intégration dans les composants

### 1. Formulaire de congés

Le hook `useDateValidation` est intégré dans le composant `LeaveRequestForm` pour valider les dates de début et de fin des demandes de congés:

```typescript
// Dans LeaveRequestForm.tsx
const {
  validateDate,
  validateDateRange,
  getErrorMessage,
  hasError,
  resetErrors: resetDateErrors
} = useDateValidation();

// Gérer le changement de dates avec validation
const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
  const dateValue = new Date(value);
  
  // Valider la date individuelle
  validateDate(dateValue, field, {
    required: true,
    allowPastDates: false,
    disallowWeekends: false
  });
  
  // Mettre à jour le champ
  updateLeaveField(field, dateValue);

  // Valider la plage si les deux dates sont définies
  if (field === 'startDate' && leave?.endDate) {
    validateDateRange(
      dateValue, 
      new Date(leave.endDate), 
      'startDate', 
      'endDate',
      { minDuration: 1 }
    );
  }
  // ...
};
```

## Tests

Des tests unitaires ont été ajoutés pour vérifier l'intégration du système de validation dans les composants:

```typescript
// Dans LeaveRequestForm.test.tsx
it('should call validateDate when date fields change', async () => {
  // ...
  fireEvent.change(startDateInput, { target: { value: formattedDate } });
  
  await waitFor(() => {
    expect(mockValidateDate).toHaveBeenCalled();
  });
});
```

## Bonnes pratiques

1. **Utiliser systématiquement le hook** pour toute validation de date dans l'application
2. **Configurer précisément les options** selon le contexte d'utilisation
3. **Vérifier les erreurs** avant de soumettre un formulaire
4. **Afficher les messages d'erreur** à proximité des champs concernés
5. **Réinitialiser les erreurs** au début de chaque nouvelle validation

## Évolutions futures

- Ajouter la prise en charge des fuseaux horaires
- Intégrer la validation en temps réel (debounced)
- Étendre le support pour les formats de date internationaux
- Optimiser les performances pour les validations complexes

## Conclusion

Le système de validation centralisé des dates améliore considérablement la qualité du code et l'expérience utilisateur en:
- Standardisant la validation des dates dans toute l'application
- Réduisant la duplication de code
- Facilitant la maintenance et l'évolution des règles de validation
- Assurant une expérience utilisateur cohérente

---

*Dernière mise à jour: juin 2023* 