# Guide de Migration - API de Validation des Dates

Ce guide est destiné aux équipes qui ont développé des composants externes utilisant l'ancienne API de validation des dates. Il détaille les étapes nécessaires pour migrer vers le nouveau système centralisé.

## Pourquoi migrer?

Le nouveau système de validation des dates fournit une API unifiée et plus puissante via le hook `useDateValidation`. Cette migration améliorera la robustesse de vos composants et réduira la quantité de code à maintenir.

### Avantages clés:

- **Gestion d'erreurs standardisée** avec messages cohérents
- **Validation complète** couvrant de nombreux cas d'usage
- **Code plus concis** et plus facile à maintenir
- **Réduction des bugs** liés à la validation de dates
- **Meilleure expérience utilisateur** avec feedbacks précis

## Comparaison des APIs

| Ancienne API | Nouvelle API |
|--------------|--------------|
| `validateDateInput(date)` | `validateDate(date, fieldName, options)` |
| `isDateRangeValid(start, end)` | `validateDateRange(start, end, startFieldName, endFieldName, options)` |
| `checkConflicts(date, userId)` | `detectConflicts(userId, date, type, existingEvents)` |
| `isDateInBlackoutPeriod(date)` | Inclus dans `validateDate` via l'option `blackoutPeriods` |
| `calculateDuration(start, end)` | Inclus dans le contexte retourné par `validateDateRange` |

## Étapes de migration

### 1. Installer les dépendances

Si vous utilisez une version obsolète, mettez à jour vers la dernière version:

```bash
npm install @mathildanesth/core-hooks
```

### 2. Importer le nouveau hook

Remplacez vos anciennes importations:

```typescript
// Ancien code
import { validateDateInput, isDateRangeValid } from '../utils/dateUtils';

// Nouveau code
import { useDateValidation, DateValidationErrorType, DateValidationOptions } from '@mathildanesth/core-hooks';
```

### 3. Initialiser le hook dans vos composants

```typescript
// Ajouter dans votre composant fonctionnel
const {
  validateDate,
  validateDateRange,
  hasError,
  getErrorMessage,
  resetErrors
} = useDateValidation();
```

### 4. Adapter la validation de date unique

Ancien code:
```typescript
function validateDate(date) {
  if (!date) {
    return { valid: false, error: 'La date est requise' };
  }
  
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  if (date < currentDate) {
    return { valid: false, error: 'La date ne peut pas être dans le passé' };
  }
  
  // Vérifier si c'est un week-end
  const day = date.getDay();
  if (day === 0 || day === 6) {
    return { valid: false, error: 'Les week-ends ne sont pas autorisés' };
  }
  
  return { valid: true };
}
```

Nouveau code:
```typescript
const isValid = validateDate(selectedDate, 'dateField', {
  required: true,
  allowPastDates: false,
  disallowWeekends: true
});

if (!isValid) {
  // Utiliser getErrorMessage pour obtenir le message d'erreur
  const errorMessage = getErrorMessage('dateField');
  // ...
}
```

### 5. Adapter la validation de plages de dates

Ancien code:
```typescript
function validateDateRange(startDate, endDate) {
  const startValid = validateDate(startDate);
  if (!startValid.valid) {
    return startValid;
  }
  
  const endValid = validateDate(endDate);
  if (!endValid.valid) {
    return endValid;
  }
  
  if (startDate > endDate) {
    return { valid: false, error: 'La date de début doit être avant la date de fin' };
  }
  
  return { valid: true };
}
```

Nouveau code:
```typescript
const isValid = validateDateRange(
  startDate,
  endDate,
  'startDate',
  'endDate',
  {
    required: true,
    allowPastDates: false,
    disallowWeekends: true
  }
);

// Gestion des erreurs pour les dates de début et de fin
if (hasError('startDate')) {
  // Gérer l'erreur sur la date de début
}

if (hasError('endDate')) {
  // Gérer l'erreur sur la date de fin
}
```

### 6. Gérer l'affichage des erreurs

Ancien code:
```typescript
function handleDateChange(value) {
  const date = new Date(value);
  const validation = validateDate(date);
  
  if (!validation.valid) {
    setError(validation.error);
  } else {
    setError(null);
    setSelectedDate(date);
  }
}

// JSX
<p className="error">{error}</p>
```

Nouveau code:
```typescript
function handleDateChange(value) {
  const date = new Date(value);
  const isValid = validateDate(date, 'myDate', options);
  
  if (isValid) {
    setSelectedDate(date);
  }
}

// JSX
{hasError('myDate') && (
  <p className="error">{getErrorMessage('myDate')}</p>
)}
```

### 7. Adapter les validations spécifiques métier

Utilisez les fonctions spécialisées pour les validations métier spécifiques:

```typescript
// Pour les congés
const isLeaveValid = validateLeaveRequest(startDate, endDate, userId, {
  availableDaysPerYear: 25,
  minAdvanceNotice: 5
});

// Pour les gardes
const isShiftValid = validateShiftAssignment(date, 'NUIT', userId, {
  blackoutPeriods: restPeriods
});
```

## Cas particuliers

### Validation temporaire

Si vous avez besoin de maintenir temporairement l'ancienne API:

```typescript
const { validateDate } = useDateValidationTemp();

// Fonction de compatibilité
function validateDateInput(date, required = true) {
  const fieldName = 'tempField';
  const isValid = validateDate(date, fieldName, { required });
  return isValid;
}

// DÉPRÉCIÉ: À remplacer par le nouveau hook
/**
 * @deprecated Utilisez useDateValidation().validateDate() à la place
 */
export function isDateValid(date) {
  console.warn(
    'Utilisez useDateValidation().validateDate() à la place. ' +
    'Cette fonction sera supprimée dans une version future.'
  );
  return validateDateInput(date);
}
```

## Test de la migration

Après avoir effectué la migration, testez vos composants pour vous assurer que tout fonctionne correctement:

```typescript
// Test du nouveau hook
it('should validate dates correctly after migration', () => {
  const { result } = renderHook(() => useDateValidation());
  
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  
  const isValid = result.current.validateDate(pastDate, 'testField');
  
  expect(isValid).toBe(false);
  expect(result.current.getErrorType('testField')).toBe(DateValidationErrorType.PAST_DATE);
});
```

## FAQ

### Que faire si j'ai une logique de validation personnalisée?

Vous pouvez étendre le hook avec vos propres fonctions ou utiliser les options existantes pour couvrir vos besoins spécifiques.

### Comment centraliser mes options de validation?

Créez un fichier de configuration pour vos options de validation:

```typescript
// validationConfig.ts
export const leaveValidationOptions = {
  required: true,
  allowPastDates: false,
  minAdvanceNotice: 3,
  availableDaysPerYear: 25
};

export const shiftValidationOptions = {
  required: true,
  allowPastDates: false,
  disallowWeekends: false
};
```

### La migration est-elle obligatoire?

Oui, l'ancienne API sera dépréciée puis supprimée. Nous recommandons de migrer dès que possible pour bénéficier des améliorations et éviter les problèmes futurs.

## Support

Si vous rencontrez des difficultés lors de la migration, contactez l'équipe Core via:
- Slack: #team-core-hooks
- Email: dev-support@mathildanesth.fr 