# Guide de Migration - API de Validation des Dates

Ce guide est destiné aux équipes qui ont développé des composants externes utilisant l'ancienne API de validation des dates. Il détaille les étapes nécessaires pour migrer vers le nouveau système centralisé.

## Introduction

Le nouveau système de validation des dates fournit une API unifiée et plus puissante via le hook `useDateValidation`. Cette migration améliorera la robustesse de vos composants et réduira la quantité de code à maintenir.

## Pourquoi migrer ?

- **Code plus propre**: Réduisez la quantité de code de validation dans vos composants
- **Fonctionnalités avancées**: Accédez à des validations plus sophistiquées (jours ouvrables, quotas, etc.)
- **Meilleure gestion des erreurs**: Système unifié avec typages précis
- **Maintenance simplifiée**: Les mises à jour et corrections seront centralisées
- **Cohérence**: Expérience utilisateur harmonisée dans toute l'application

## Résumé des changements pour les intégrations externes

| Ancienne API | Nouvelle API |
|--------------|--------------|
| `validateDateInput(date)` | `validateDate(date, fieldName, options)` |
| `isDateRangeValid(start, end)` | `validateDateRange(start, end, startFieldName, endFieldName, options)` |
| `hasConflict(date, events)` | `detectConflicts(userId, date, type, existingEvents)` |
| `isDateInBlackoutPeriod(date)` | Inclus dans `validateDate` via l'option `blackoutPeriods` |
| `checkQuota(days, userId)` | Géré via le contexte et les options `availableDaysPerYear` |

## Étapes de migration pour les composants externes

### 1. Dépendances requises

Assurez-vous que votre projet dépend des bonnes versions:

```json
{
  "dependencies": {
    "date-fns": "^2.29.0",
    "react": "^18.2.0"
  }
}
```

### 2. Importer le hook useDateValidation

```typescript
import { useDateValidation, DateValidationErrorType, DateValidationOptions } from '@mathildanesth/core-hooks';
```

### 3. Utiliser le hook dans votre composant

```typescript
function MonComposantExterne() {
  // Initialiser le hook
  const {
    validateDate,
    validateDateRange,
    hasError,
    getErrorMessage,
    resetErrors
  } = useDateValidation();

  // Utiliser les fonctions du hook
  // ...
}
```

### 4. Adapter la validation de date unique

**Avant**:
```typescript
function isValidDate(date, required = true) {
  if (required && !date) {
    return { valid: false, error: 'La date est requise' };
  }
  
  if (date && date < new Date()) {
    return { valid: false, error: 'La date ne peut pas être dans le passé' };
  }
  
  return { valid: true, error: null };
}

// Utilisation
const result = isValidDate(selectedDate);
if (!result.valid) {
  setError(result.error);
}
```

**Maintenant**:
```typescript
// Dans votre composant qui utilise le hook
const isValid = validateDate(selectedDate, 'dateField', {
  required: true,
  allowPastDates: false
});

// Vérification des erreurs
if (!isValid) {
  // L'erreur est déjà stockée dans le hook
  // Vous pouvez y accéder avec hasError et getErrorMessage
}

// Affichage de l'erreur
{hasError('dateField') && (
  <div className="error">{getErrorMessage('dateField')}</div>
)}
```

### 5. Adapter la validation de plages de dates

**Avant**:
```typescript
function validateDateRange(startDate, endDate) {
  const errors = {};
  
  if (!startDate) {
    errors.startDate = 'La date de début est requise';
  }
  
  if (!endDate) {
    errors.endDate = 'La date de fin est requise';
  }
  
  if (startDate && endDate && startDate > endDate) {
    errors.startDate = 'La date de début doit être avant la date de fin';
    errors.endDate = 'La date de fin doit être après la date de début';
  }
  
  return { valid: Object.keys(errors).length === 0, errors };
}

// Utilisation
const validation = validateDateRange(startDate, endDate);
if (!validation.valid) {
  setErrors(validation.errors);
}
```

**Maintenant**:
```typescript
// Dans votre composant qui utilise le hook
const isValid = validateDateRange(
  startDate,
  endDate,
  'startDate',
  'endDate',
  {
    required: true,
    minDuration: 1 // durée minimale d'un jour
  }
);

// Vérification et affichage des erreurs
{hasError('startDate') && (
  <div className="error">{getErrorMessage('startDate')}</div>
)}
{hasError('endDate') && (
  <div className="error">{getErrorMessage('endDate')}</div>
)}
```

### 6. Adapter la détection de conflits

**Avant**:
```typescript
function checkConflicts(newEvent, existingEvents) {
  const overlapping = existingEvents.filter(event => {
    return (
      (newEvent.start >= event.start && newEvent.start <= event.end) ||
      (newEvent.end >= event.start && newEvent.end <= event.end) ||
      (newEvent.start <= event.start && newEvent.end >= event.end)
    );
  });
  
  return { 
    hasConflicts: overlapping.length > 0, 
    conflicts: overlapping 
  };
}

// Utilisation
const result = checkConflicts(newEvent, calendarEvents);
if (result.hasConflicts) {
  setConflictError(`Conflit avec ${result.conflicts.length} événement(s)`);
}
```

**Maintenant**:
```typescript
// Dans votre composant qui utilise le hook
const { detectConflicts, context } = useDateValidation();

// Création de la plage de dates à vérifier
const isValid = detectConflicts(
  'user123',
  selectedDate,
  'event',
  calendarEvents
);

// Vérification des conflits
if (!isValid) {
  // Les conflits sont stockés dans le contexte
  console.log('Conflits détectés:', context.conflicts);
}

// Affichage de l'erreur
{hasError('conflict_event_user123') && (
  <div className="error">{getErrorMessage('conflict_event_user123')}</div>
)}
```

### 7. Migrer la gestion des quotas

**Avant**:
```typescript
function checkQuota(requestedDays, userId) {
  // Appel à une API pour récupérer les jours utilisés
  return fetchUserQuota(userId).then(quota => {
    const remaining = quota.total - quota.used;
    return {
      valid: requestedDays <= remaining,
      remaining,
      message: requestedDays > remaining 
        ? `Quota dépassé: ${remaining} jours restants`
        : null
    };
  });
}

// Utilisation
useEffect(() => {
  if (startDate && endDate) {
    const days = calculateDaysBetween(startDate, endDate);
    checkQuota(days, userId).then(result => {
      if (!result.valid) {
        setQuotaError(result.message);
      }
    });
  }
}, [startDate, endDate]);
```

**Maintenant**:
```typescript
// Dans votre composant qui utilise le hook
const { validateLeaveRequest, setContext, context } = useDateValidation();

// Initialiser le contexte avec les jours utilisés
useEffect(() => {
  // Vous pouvez toujours faire un appel API pour récupérer les jours utilisés
  fetchUserQuota(userId).then(quota => {
    setContext({ usedDays: quota.used });
  });
}, [userId, setContext]);

// Validation avec la vérification du quota incluse
const handleValidate = () => {
  const isValid = validateLeaveRequest(
    startDate,
    endDate,
    userId,
    {
      availableDaysPerYear: 25, // quota total
      businessDaysOnly: true // ne compter que les jours ouvrables
    }
  );
  
  if (isValid) {
    // Accéder aux informations de quota dans le contexte
    console.log('Jours restants:', context.remainingDays);
  }
};
```

## Transition pour les bibliothèques de composants

Si vous maintenez une bibliothèque de composants utilisée par d'autres équipes, considérez ces approches pour une transition en douceur:

### Option 1: Wrapper l'ancienne API

Créez une version de compatibilité qui utilise en interne le nouveau hook:

```typescript
// Compatibilité pour l'ancienne API
export function isValidDate(date, required = true) {
  // Créer une instance temporaire du hook
  const { validateDate } = useDateValidationTemp();
  
  // Utiliser le nouveau hook et convertir le résultat au format ancien
  const fieldName = 'temp_field';
  const isValid = validateDate(date, fieldName, { required });
  
  if (!isValid) {
    const { getErrorMessage } = useDateValidationTemp();
    return { valid: false, error: getErrorMessage(fieldName) };
  }
  
  return { valid: true, error: null };
}

// Fonction utilitaire pour créer une instance temporaire du hook
function useDateValidationTemp() {
  const [errors, setErrors] = useState({});
  // Version simplifiée du hook pour la compatibilité
  // ...
}
```

### Option 2: Adaptation progressive

1. Marquez les anciennes fonctions comme dépréciées
2. Ajoutez des avertissements dans la console
3. Fournissez des exemples de migration
4. Définissez une date limite de suppression

```typescript
/**
 * @deprecated Utilisez useDateValidation().validateDate() à la place
 */
export function isValidDate(date, required = true) {
  console.warn(
    'isValidDate est déprécié et sera supprimé dans la version 2.0.0. ' +
    'Utilisez useDateValidation().validateDate() à la place. ' +
    'Voir la documentation: https://wiki.mathildanesth.fr/migration/date-validation'
  );
  
  // Ancienne implémentation...
}
```

## Tests

### Adaptation des tests unitaires

**Avant**:
```typescript
test('rejette les dates dans le passé', () => {
  const pastDate = new Date(2020, 0, 1);
  const result = isValidDate(pastDate);
  expect(result.valid).toBe(false);
  expect(result.error).toContain('dans le passé');
});
```

**Maintenant**:
```typescript
test('rejette les dates dans le passé', () => {
  const { result } = renderHook(() => useDateValidation());
  const pastDate = new Date(2020, 0, 1);
  
  act(() => {
    const isValid = result.current.validateDate(pastDate, 'testField');
    expect(isValid).toBe(false);
    expect(result.current.hasError('testField')).toBe(true);
    expect(result.current.getErrorType('testField')).toBe(DateValidationErrorType.PAST_DATE);
  });
});
```

### Adaptation des tests d'intégration

```typescript
test('affiche les erreurs de validation', async () => {
  render(<MonComposant />);
  
  // Sélectionner une date dans le passé
  fireEvent.change(screen.getByLabelText('Date'), {
    target: { value: '2020-01-01' }
  });
  
  // Soumettre le formulaire
  fireEvent.click(screen.getByText('Valider'));
  
  // Vérifier que l'erreur est affichée
  expect(await screen.findByText(/ne peut pas être dans le passé/i)).toBeInTheDocument();
});
```

## Liste de contrôle pour la migration

- [ ] Identifier tous les composants qui utilisent l'ancienne API
- [ ] Importer le hook `useDateValidation` dans chaque composant
- [ ] Remplacer les appels aux anciennes fonctions
- [ ] Adapter l'affichage des erreurs
- [ ] Mettre à jour la gestion du contexte et des quotas
- [ ] Adapter les tests unitaires et d'intégration
- [ ] Tester les cas limites (dates nulles, périodes inversées, etc.)
- [ ] Vérifier les performances (notamment pour les composants avec beaucoup de validations)

## Ressources supplémentaires

- [Démonstration interactive](https://mathildanesth.fr/demos/date-validation)
- [Documentation complète de l'API](https://wiki.mathildanesth.fr/hooks/useDateValidation)
- [Exemples de code](https://github.com/mathildanesth/examples/tree/main/date-validation)
- [FAQ Migration](https://wiki.mathildanesth.fr/migration/date-validation/faq)

## Aide et support

Si vous rencontrez des difficultés lors de la migration, plusieurs options s'offrent à vous:

- **Assistance technique**: Contactez l'équipe de développement à dev-team@mathildanesth.fr
- **Sessions de pair programming**: Réservez une session sur [Calendly](https://calendly.com/mathildanesth/migration)
- **Révision de code**: Soumettez votre code migré pour révision via le canal Slack #date-validation-migration

Nous sommes là pour vous aider à réussir cette transition! 