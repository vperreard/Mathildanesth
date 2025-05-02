# Guide de Test du Système de Validation des Dates

Ce document présente les scénarios de test recommandés pour valider le bon fonctionnement du système de validation des dates. Chaque scénario couvre un aspect spécifique du système et doit être testé par les équipes internes avant toute mise en production.

## Configuration du test

Pour tester le hook `useDateValidation`, utilisez les outils standards de test React:

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useDateValidation, DateValidationErrorType } from '../../hooks/useDateValidation';

describe('useDateValidation', () => {
  it('should validate dates correctly', () => {
    const { result } = renderHook(() => useDateValidation());
    
    // Tests ici...
  });
});
```

## Scénarios de test essentiels

### 1. Validation de date unique

#### 1.1 Date requise

```typescript
it('should reject undefined dates when required', () => {
  const { result } = renderHook(() => useDateValidation());
  
  // Act
  const isValid = result.current.validateDate(undefined, 'testField', { required: true });
  
  // Assert
  expect(isValid).toBe(false);
  expect(result.current.getErrorType('testField')).toBe(DateValidationErrorType.REQUIRED);
});
```

#### 1.2 Date passée

```typescript
it('should reject past dates when not allowed', () => {
  const { result } = renderHook(() => useDateValidation());
  
  // Prepare
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Act
  const isValid = result.current.validateDate(yesterday, 'testField');
  
  // Assert
  expect(isValid).toBe(false);
  expect(result.current.getErrorType('testField')).toBe(DateValidationErrorType.PAST_DATE);
});
```

#### 1.3 Weekend

```typescript
it('should reject weekend dates when disallowed', () => {
  const { result } = renderHook(() => useDateValidation());
  
  // Trouver un samedi (index 6 dans getDay())
  const saturday = new Date();
  while (saturday.getDay() !== 6) {
    saturday.setDate(saturday.getDate() + 1);
  }
  
  // Act
  const isValid = result.current.validateDate(saturday, 'testField', { disallowWeekends: true });
  
  // Assert
  expect(isValid).toBe(false);
  expect(result.current.getErrorType('testField')).toBe(DateValidationErrorType.WEEKEND);
});
```

#### 1.4 Jours fériés

```typescript
it('should reject holiday dates when using onlyBusinessDays', () => {
  const { result } = renderHook(() => useDateValidation());
  
  // Préparer un jour férié
  const holiday = new Date('2023-01-01'); // Jour de l'An
  const holidays = [holiday];
  
  // Act
  const isValid = result.current.validateDate(holiday, 'testField', { 
    onlyBusinessDays: true,
    holidays
  });
  
  // Assert
  expect(isValid).toBe(false);
  expect(result.current.getErrorType('testField')).toBe(DateValidationErrorType.INVALID_BUSINESS_DAYS);
});
```

#### 1.5 Délai minimum d'avertissement

```typescript
it('should reject dates that do not meet minimum advance notice', () => {
  const { result } = renderHook(() => useDateValidation());
  
  // Date trop proche
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Act - exige 3 jours d'avance
  const isValid = result.current.validateDate(tomorrow, 'testField', { 
    minAdvanceNotice: 3
  });
  
  // Assert
  expect(isValid).toBe(false);
  expect(result.current.getErrorType('testField')).toBe(DateValidationErrorType.MIN_ADVANCE_NOTICE);
});
```

### 2. Validation de plage de dates

#### 2.1 Date de début après date de fin

```typescript
it('should reject date ranges where start date is after end date', () => {
  const { result } = renderHook(() => useDateValidation());
  
  // Préparer les dates
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const today = new Date();
  
  // Act - fin avant début
  const isValid = result.current.validateDateRange(
    tomorrow,
    today,
    'startDate',
    'endDate'
  );
  
  // Assert
  expect(isValid).toBe(false);
  expect(result.current.getErrorType('startDate')).toBe(DateValidationErrorType.START_AFTER_END);
  expect(result.current.getErrorType('endDate')).toBe(DateValidationErrorType.START_AFTER_END);
});
```

#### 2.2 Durée minimale

```typescript
it('should reject date ranges that do not meet minimum duration', () => {
  const { result } = renderHook(() => useDateValidation());
  
  // Même jour (durée = 1)
  const today = new Date();
  
  // Act - exige 2 jours minimum
  const isValid = result.current.validateDateRange(
    today,
    today,
    'startDate',
    'endDate',
    { minDuration: 2 }
  );
  
  // Assert
  expect(isValid).toBe(false);
  expect(result.current.getErrorType('endDate')).toBe(DateValidationErrorType.MIN_DURATION);
});
```

#### 2.3 Durée maximale

```typescript
it('should reject date ranges that exceed maximum duration', () => {
  const { result } = renderHook(() => useDateValidation());
  
  // Préparer une plage de 5 jours
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 4); // startDate + 4 jours = 5 jours de durée
  
  // Act - limite à 3 jours
  const isValid = result.current.validateDateRange(
    startDate,
    endDate,
    'startDate',
    'endDate',
    { maxDuration: 3 }
  );
  
  // Assert
  expect(isValid).toBe(false);
  expect(result.current.getErrorType('endDate')).toBe(DateValidationErrorType.MAX_DURATION);
});
```

### 3. Périodes blackout

#### 3.1 Date dans une période blackout

```typescript
it('should reject dates that fall within blackout periods', () => {
  const { result } = renderHook(() => useDateValidation());
  
  // Période blackout
  const blackoutStart = new Date('2023-07-15');
  const blackoutEnd = new Date('2023-07-30');
  const blackoutPeriods = [{ start: blackoutStart, end: blackoutEnd }];
  
  // Date dans la période blackout
  const dateInBlackout = new Date('2023-07-20');
  
  // Act
  const isValid = result.current.validateDate(dateInBlackout, 'testField', { 
    blackoutPeriods 
  });
  
  // Assert
  expect(isValid).toBe(false);
  expect(result.current.getErrorType('testField')).toBe(DateValidationErrorType.BLACKOUT_PERIOD);
});
```

#### 3.2 Plage chevauchant une période blackout

```typescript
it('should reject date ranges that overlap with blackout periods', () => {
  const { result } = renderHook(() => useDateValidation());
  
  // Période blackout
  const blackoutStart = new Date('2023-07-15');
  const blackoutEnd = new Date('2023-07-30');
  const blackoutPeriods = [{ start: blackoutStart, end: blackoutEnd }];
  
  // Plage chevauchant la période
  const rangeStart = new Date('2023-07-10');
  const rangeEnd = new Date('2023-07-20');
  
  // Act
  const isValid = result.current.validateDateRange(
    rangeStart,
    rangeEnd,
    'startDate',
    'endDate',
    { blackoutPeriods }
  );
  
  // Assert
  expect(isValid).toBe(false);
  expect(result.current.getErrorType('endDate')).toBe(DateValidationErrorType.BLACKOUT_PERIOD);
});
```

### 4. Détection de chevauchements

```typescript
it('should detect overlaps with existing ranges', () => {
  const { result } = renderHook(() => useDateValidation());
  
  // Plages existantes
  const existingRanges = [
    { 
      start: new Date('2023-08-01'),
      end: new Date('2023-08-05'),
      label: 'Congé existant'
    }
  ];
  
  // Nouvelle plage qui chevauche
  const newRange = {
    start: new Date('2023-08-03'),
    end: new Date('2023-08-10')
  };
  
  // Act
  const isValid = result.current.validateOverlap(newRange, existingRanges, 'overlapField');
  
  // Assert
  expect(isValid).toBe(false);
  expect(result.current.getErrorType('overlapField')).toBe(DateValidationErrorType.OVERLAPPING);
});
```

### 5. Validation avec cas limites

#### 5.1 Validation avec des dates nulles

```typescript
it('should handle null dates appropriately', () => {
  const { result } = renderHook(() => useDateValidation());
  
  // Act - null non requis
  const isValidOptional = result.current.validateDate(null, 'optionalField', { required: false });
  expect(isValidOptional).toBe(true);
  
  // Act - null requis
  const isValidRequired = result.current.validateDate(null, 'requiredField', { required: true });
  expect(isValidRequired).toBe(false);
  expect(result.current.getErrorType('requiredField')).toBe(DateValidationErrorType.REQUIRED);
});
```

#### 5.2 Validation avec des dates incohérentes

```typescript
it('should handle invalid date objects', () => {
  const { result } = renderHook(() => useDateValidation());
  
  // Act - date invalide
  const invalidDate = new Date('invalid-date');
  const isValid = result.current.validateDate(invalidDate, 'testField');
  
  // Assert
  expect(isValid).toBe(false);
  expect(result.current.getErrorType('testField')).toBe(DateValidationErrorType.INVALID_FORMAT);
});
```

## Scénarios de test complémentaires

### 6. Validation des quotas disponibles

```typescript
it('should validate against available days quota', () => {
  const { result } = renderHook(() => useDateValidation());
  
  // Configurer le contexte avec des jours déjà utilisés
  act(() => {
    result.current.setContext({ usedDays: 20 });
  });
  
  // Plage de 10 jours
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 9);
  
  // Act - avec un quota de 25 jours par an
  const isValid = result.current.validateDateRange(
    startDate,
    endDate,
    'startDate',
    'endDate',
    { availableDaysPerYear: 25 }
  );
  
  // Assert - 20 + 10 > 25, donc pas valide
  expect(isValid).toBe(false);
  expect(result.current.getErrorType('endDate')).toBe(DateValidationErrorType.EXCEEDS_AVAILABLE_DAYS);
});
```

### 7. Tests des fonctions spécifiques métier

#### 7.1 Validation de demande de congés

```typescript
it('should validate leave requests correctly', () => {
  const { result } = renderHook(() => useDateValidation());
  
  // Configurer le contexte avec des jours déjà utilisés
  act(() => {
    result.current.setContext({ usedDays: 15 });
  });
  
  // Dates pour la demande
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 10); // Dans 10 jours
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 15); // Dans 15 jours (6 jours de congés)
  
  // Act - quota de 20 jours
  const isValid = result.current.validateLeaveRequest(
    startDate,
    endDate,
    'user123',
    { 
      availableDaysPerYear: 20,
      minAdvanceNotice: 5
    }
  );
  
  // Assert - devrait être valide (15 + 6 = 21 mais 20 max)
  expect(isValid).toBe(false);
});
```

#### 7.2 Validation d'affectation de garde

```typescript
it('should validate shift assignments correctly', () => {
  const { result } = renderHook(() => useDateValidation());
  
  // Période de repos après une garde précédente
  const restStart = new Date();
  const restEnd = new Date();
  restEnd.setDate(restEnd.getDate() + 1);
  const blackoutPeriods = [
    { 
      start: restStart,
      end: restEnd,
      type: 'rest_period'
    }
  ];
  
  // Affectation pendant la période de repos
  const shiftDate = new Date();
  shiftDate.setHours(restStart.getHours() + 12); // 12 heures après le début du repos
  
  // Act
  const isValid = result.current.validateShiftAssignment(
    shiftDate,
    'NUIT',
    'user123',
    { blackoutPeriods }
  );
  
  // Assert
  expect(isValid).toBe(false);
});
```

## Tests de réinitialisation

```typescript
it('should reset errors correctly', () => {
  const { result } = renderHook(() => useDateValidation());
  
  // Créer une erreur
  act(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    result.current.validateDate(yesterday, 'testDate');
  });
  
  // Vérifier que l'erreur existe
  expect(result.current.hasError('testDate')).toBe(true);
  expect(result.current.getErrorType('testDate')).toBe(DateValidationErrorType.PAST_DATE);
  
  // Réinitialiser
  act(() => {
    result.current.resetErrors();
  });
  
  // Vérifier que l'erreur a été effacée
  expect(result.current.hasError('testDate')).toBe(false);
  expect(result.current.getErrorType('testDate')).toBeNull();
});
```

## Couverture de test

Assurez-vous que vos tests couvrent:

1. **Toutes les fonctions publiques** du hook
2. **Tous les types d'erreurs** possibles
3. **Tous les cas limites** et valeurs spéciales (null, undefined, dates invalides)
4. **Toutes les options de configuration** du hook

## Intégration avec les composants

Testez également l'intégration du hook dans vos composants:

```typescript
it('should integrate with form components', () => {
  const { result } = renderHook(() => {
    const validation = useDateValidation();
    return {
      validation,
      handleDateChange: (date) => {
        validation.validateDate(date, 'componentDate', { required: true });
      }
    };
  });
  
  // Act - changer la date
  act(() => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    result.current.handleDateChange(pastDate);
  });
  
  // Assert
  expect(result.current.validation.hasError('componentDate')).toBe(true);
});
```

## Conseils pour les tests

1. **Isolez les tests**: Chaque test doit être indépendant des autres
2. **Utilisez des dates relatives**: Évitez les dates codées en dur pour les tests qui dépendent de la date actuelle
3. **Testez des scénarios réels**: Créez des scénarios qui correspondent à l'utilisation réelle dans l'application
4. **Vérifiez les types d'erreurs**: Utilisez `getErrorType` pour vérifier précisément le type d'erreur
5. **Testez les cas limites**: Incluez toujours des tests pour les cas limites et les entrées problématiques

## Prérequis

- Accès à l'environnement de démonstration (`DateValidationDemo.tsx`)
- Compte utilisateur avec les droits appropriés
- Connaissance des règles métier concernant les congés et gardes

## Scénarios de Test

### 1. Demandes de Congés

#### 1.1 Validation des demandes de congés standard

**Objectif**: Vérifier que les demandes de congés respectant toutes les règles sont acceptées.

**Étapes**:
1. Sélectionner un utilisateur (ex: "user123")
2. Choisir une date de début à au moins 3 jours dans le futur
3. Choisir une date de fin (durée totale < quota disponible)
4. Cliquer sur "Valider congés"

**Résultat attendu**: La demande est validée sans erreurs.

#### 1.2 Rejet des demandes excédant le quota

**Objectif**: Vérifier que les demandes dépassant le quota disponible sont rejetées.

**Étapes**:
1. Sélectionner le scénario "Quota faible" (22 jours déjà utilisés sur 25 disponibles)
2. Choisir une date de début valide
3. Choisir une date de fin (durée totale > 3 jours)
4. Cliquer sur "Valider congés"

**Résultat attendu**: La demande est rejetée avec un message d'erreur indiquant que le quota est dépassé.

#### 1.3 Rejet des demandes sans préavis suffisant

**Objectif**: Vérifier que les demandes sans préavis minimum sont rejetées.

**Étapes**:
1. Choisir une date de début à moins de 3 jours dans le futur
2. Choisir une date de fin valide
3. Cliquer sur "Valider congés"

**Résultat attendu**: La demande est rejetée avec un message d'erreur indiquant que le préavis minimum n'est pas respecté.

#### 1.4 Rejet des demandes pendant les périodes bloquées

**Objectif**: Vérifier que les demandes pendant les périodes bloquées sont rejetées.

**Étapes**:
1. Sélectionner le scénario "Période bloquée"
2. Cliquer sur "Valider congés"

**Résultat attendu**: La demande est rejetée avec un message d'erreur indiquant que la période chevauche une période bloquée.

#### 1.5 Rejet des demandes avec conflit

**Objectif**: Vérifier que les demandes en conflit avec d'autres événements sont rejetées.

**Étapes**:
1. Sélectionner le scénario "Conflit"
2. Cliquer sur "Valider congés"

**Résultat attendu**: La demande est rejetée avec un message d'erreur indiquant un conflit avec un événement existant.

### 2. Affectations de Garde

#### 2.1 Validation des affectations de garde standard

**Objectif**: Vérifier que les affectations de garde respectant toutes les règles sont acceptées.

**Étapes**:
1. Sélectionner un utilisateur (ex: "user123")
2. Sélectionner un type de garde (ex: "jour")
3. Choisir une date qui n'est pas en conflit avec d'autres événements
4. Cliquer sur "Valider garde"

**Résultat attendu**: L'affectation est validée sans erreurs.

#### 2.2 Rejet des affectations pendant les périodes de repos

**Objectif**: Vérifier que les affectations pendant les périodes de repos obligatoire sont rejetées.

**Étapes**:
1. Sélectionner le scénario "Période de repos"
2. Cliquer sur "Valider garde"

**Résultat attendu**: L'affectation est rejetée avec un message d'erreur indiquant que la période de repos obligatoire doit être respectée.

#### 2.3 Rejet des affectations avec conflit

**Objectif**: Vérifier que les affectations en conflit avec d'autres événements sont rejetées.

**Étapes**:
1. Sélectionner un utilisateur (ex: "user123")
2. Choisir une date où l'utilisateur a déjà un événement (ex: le jour 5)
3. Cliquer sur "Détecter conflits" puis "Valider garde"

**Résultat attendu**: L'affectation est rejetée avec un message d'erreur indiquant un conflit.

### 3. Détection de Conflits

#### 3.1 Détection des conflits avec événements existants

**Objectif**: Vérifier que les conflits avec des événements existants sont correctement détectés.

**Étapes**:
1. Sélectionner un utilisateur (ex: "user123")
2. Choisir une date où l'utilisateur a déjà un événement (ex: le jour 5)
3. Cliquer sur "Détecter conflits"

**Résultat attendu**: Un conflit est détecté et affiché dans la section "Conflits détectés".

#### 3.2 Pas de conflit avec événements d'autres utilisateurs

**Objectif**: Vérifier que les événements d'autres utilisateurs ne génèrent pas de conflits.

**Étapes**:
1. Sélectionner un utilisateur (ex: "user123")
2. Choisir une date où seul un autre utilisateur a un événement (ex: le jour 9)
3. Cliquer sur "Détecter conflits"

**Résultat attendu**: Aucun conflit n'est détecté.

### 4. Calculs de Durée

#### 4.1 Calcul correct des jours ouvrables

**Objectif**: Vérifier que le calcul des jours ouvrables est correct.

**Étapes**:
1. Sélectionner une période incluant des weekends et jours fériés (ex: du lundi au lundi suivant)
2. Cliquer sur "Valider congés"

**Résultat attendu**: Le nombre de jours ouvrables affiché est correct (exclut les weekends et jours fériés).

#### 4.2 Calcul correct du solde de jours

**Objectif**: Vérifier que le calcul du solde de jours est correct.

**Étapes**:
1. Sélectionner le scénario "Par défaut" (10 jours utilisés sur 25)
2. Choisir une période de 5 jours
3. Cliquer sur "Valider congés"

**Résultat attendu**: Le solde de jours restants affiché est de 10 jours (25 - 10 - 5).

## Cas Limites et Tests de Robustesse

### 5.1 Validation avec des dates nulles

**Objectif**: Vérifier que le système gère correctement les dates nulles.

**Étapes**:
1. Laisser les champs de date vides
2. Cliquer sur "Valider congés" ou "Valider garde"

**Résultat attendu**: Une erreur indiquant que les dates sont requises est affichée.

### 5.2 Validation avec des dates incohérentes

**Objectif**: Vérifier que le système rejette les plages de dates incohérentes.

**Étapes**:
1. Choisir une date de fin antérieure à la date de début
2. Cliquer sur "Valider congés"

**Résultat attendu**: Une erreur indiquant que la date de début doit être antérieure à la date de fin est affichée.

### 5.3 Robustesse aux changements d'utilisateur

**Objectif**: Vérifier que le système réinitialise correctement les erreurs lors du changement d'utilisateur.

**Étapes**:
1. Générer une erreur de validation pour l'utilisateur actuel
2. Changer d'utilisateur
3. Observer si les erreurs sont réinitialisées

**Résultat attendu**: Les erreurs sont réinitialisées lors du changement d'utilisateur.

### 5.4 Transition entre différents types de validation

**Objectif**: Vérifier que le système gère correctement les transitions entre types de validation.

**Étapes**:
1. Valider une demande de congés
2. Sans réinitialiser, valider une affectation de garde avec les mêmes dates
3. Observer le comportement

**Résultat attendu**: Chaque validation est indépendante et affiche les erreurs appropriées.

## Rapport de Test

Pour chaque scénario testé, veuillez documenter:

- Numéro et nom du scénario
- Date du test
- Résultat (Succès/Échec)
- Description des problèmes rencontrés le cas échéant
- Captures d'écran si pertinent

Utilisez le modèle suivant:

```
Scénario: [Numéro et nom]
Date du test: [JJ/MM/AAAA]
Résultat: [Succès/Échec]
Problèmes: [Description ou "Aucun"]
Notes: [Observations supplémentaires]
```

Envoyez les rapports de test à l'équipe de développement à l'adresse: dev-team@mathildanesth.fr 