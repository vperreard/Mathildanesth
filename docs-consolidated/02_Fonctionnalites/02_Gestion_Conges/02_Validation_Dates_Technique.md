# Validation des Dates

## Vue d'ensemble

Le système de validation des dates est un composant central de Mathildanesth, permettant de garantir la cohérence et la validité des entrées temporelles dans toute l'application. Ce système robuste et centralisé est utilisé par de nombreux modules, notamment la gestion des congés, le planning et les indisponibilités.

## Principes du système

- **Centralisation** : Logique de validation uniforme via un hook personnalisé
- **Flexibilité** : Règles de validation configurables selon le contexte
- **Robustesse** : Gestion complète des cas particuliers et exceptions
- **Feedback utilisateur** : Messages d'erreur clairs et contextuels
- **Internationalisation** : Support multilingue des messages d'erreur

## Implémentation

### Hook principal : `useDateValidation`

```typescript
// Signature du hook
function useDateValidation(options?: DateValidationOptions) {
  // Fonctions de validation principales
  const validateDate: (date: Date | string | null, context?: string) => boolean;
  const validateDateRange: (
    startDate: Date | string | null,
    endDate: Date | string | null,
    context?: string
  ) => boolean;

  // État des validations
  const dateErrors: Record<string, string>;
  const rangeErrors: Record<string, string>;

  // Utilitaires
  const formatDate: (date: Date | null) => string;
  const parseDateString: (dateStr: string) => Date | null;

  // Gestion d'état
  const clearErrors: () => void;

  return {
    validateDate,
    validateDateRange,
    dateErrors,
    rangeErrors,
    formatDate,
    parseDateString,
    clearErrors,
  };
}
```

### Options de configuration

```typescript
interface DateValidationOptions {
  // Plages de dates valides
  minDate?: Date;
  maxDate?: Date;

  // Règles spécifiques
  allowWeekends?: boolean;
  allowHolidays?: boolean;

  // Périodes bloquées
  blackoutPeriods?: Array<{
    start: Date;
    end: Date;
    reason?: string;
  }>;

  // Validation personnalisée
  customValidator?: (date: Date) => {
    isValid: boolean;
    errorMessage?: string;
  };

  // Formatage et i18n
  dateFormat?: string;
  locale?: string;

  // Callbacks
  onError?: (error: string, context: string) => void;
}
```

## Intégration avec d'autres modules

### Module de congés (`leaves`)

Intégration via le hook `useLeave` et `LeaveForm` qui utilise `useDateValidation` pour valider les dates de début et fin des congés, en tenant compte des jours fériés, weekends et périodes bloquées.

### Module de planification (`planning`)

Le générateur de planning utilise le système pour valider les dates lors de la création et modification d'affectations, garantissant le respect des contraintes temporelles.

### Détection de conflits

Le hook `useConflictDetection` est intégré avec `useDateValidation` pour valider d'abord les dates avant de procéder aux vérifications de conflits, optimisant ainsi les performances.

## Exemples d'utilisation

```typescript
// Dans un composant de formulaire
const LeaveRequestForm = () => {
  const { validateDate, validateDateRange, dateErrors, rangeErrors } = useDateValidation({
    minDate: new Date(),
    allowWeekends: false,
    allowHolidays: false,
  });

  const handleSubmit = () => {
    // Valider les dates avant soumission
    const startIsValid = validateDate(startDate, 'startDate');
    const rangeIsValid = validateDateRange(startDate, endDate, 'leaveRange');

    if (startIsValid && rangeIsValid) {
      // Procéder à la soumission
    }
  };

  return (
    <form>
      <DatePicker value={startDate} onChange={setStartDate} />
      {dateErrors.startDate && <ErrorMessage>{dateErrors.startDate}</ErrorMessage>}

      <DatePicker value={endDate} onChange={setEndDate} />
      {rangeErrors.leaveRange && <ErrorMessage>{rangeErrors.leaveRange}</ErrorMessage>}

      <Button onClick={handleSubmit}>Soumettre</Button>
    </form>
  );
};
```

## Tests et qualité

Le système de validation de dates est couvert par des tests unitaires et d'intégration exhaustifs, garantissant sa fiabilité :

- Tests unitaires pour `useDateValidation` (58 tests passant)
- Tests d'intégration avec `useLeaveForm` et `useConflictDetection`
- Tests de cas limites (changements d'heure, années bissextiles, etc.)

## Prochaines améliorations

1. Extension du support pour les fuseaux horaires multiples
2. Amélioration de la performance pour les validations massives
3. Intégration avec le système de règles dynamiques
4. Ajout de visualisations des périodes valides/invalides
