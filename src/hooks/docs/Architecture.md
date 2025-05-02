# Architecture du Système de Validation des Dates

Ce document présente l'architecture technique du système de validation des dates implémenté dans l'application Mathildanesth.

## Vue d'ensemble

Le système de validation des dates est conçu comme une architecture modulaire centralisée, fournissant une API cohérente pour les vérifications et validations de dates à travers l'application.

```
┌─────────────────────────────────────────────────────────┐
│                  useDateValidation Hook                 │
├─────────────┬─────────────┬──────────────┬─────────────┤
│ Validation  │ Gestion des │ Gestion du   │ Validation  │
│ de base     │ erreurs     │ contexte     │ métier      │
└─────────────┴─────────────┴──────────────┴─────────────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌─────────────┐
│ Fonctions   │ │ Types       │ │ Contexte de  │ │ Validations │
│ utilitaires │ │ d'erreurs   │ │ validation   │ │ spécifiques │
└─────────────┘ └─────────────┘ └──────────────┘ └─────────────┘
```

## Composants principaux

### 1. Hook principal `useDateValidation`

Le hook `useDateValidation` est le point d'entrée central du système. Il expose toutes les fonctions de validation et gère l'état des erreurs.

```typescript
export function useDateValidation() {
    const [errors, setErrors] = useState<Record<string, DateValidationError>>({});
    const [validationContext, setValidationContext] = useState<ValidationContext>({});
    
    // Fonctions exposées
    const validateDate = useCallback((date, fieldName, options) => { /* ... */ }, []);
    const validateDateRange = useCallback((startDate, endDate, startFieldName, endFieldName, options) => { /* ... */ }, []);
    // ...
    
    return {
        validateDate,
        validateDateRange,
        // ...autres fonctions
    };
}
```

### 2. Types et interfaces

Le système définit plusieurs types et interfaces pour assurer la cohérence:

```typescript
// Types d'erreurs
export enum DateValidationErrorType {
    REQUIRED = 'required',
    PAST_DATE = 'past_date',
    // ...
}

// Structure des erreurs
export interface DateValidationError {
    type: DateValidationErrorType;
    message: string;
    details?: any;
}

// Options de validation
export interface DateValidationOptions {
    required?: boolean;
    allowPastDates?: boolean;
    // ...
}

// Structure des plages de dates
export interface DateRange {
    start: Date;
    end: Date;
    label?: string;
    type?: string;
}

// Contexte partagé
export interface ValidationContext {
    usedDays?: number;
    remainingDays?: number;
    conflicts?: DateRange[];
    // ...
}
```

### 3. Fonctions utilitaires

Le système comprend de nombreuses fonctions utilitaires pures:

```typescript
// Normalisation des dates
export function normalizeDate(date: Date | string | null | undefined): Date | null {
    // ...
}

// Vérification de chevauchement
export function datesOverlap(range1: DateRange, range2: DateRange): boolean {
    // ...
}

// Calcul de durée
export function calculateDurationInDays(startDate: Date, endDate: Date): number {
    // ...
}

// Vérification des périodes blackout
export function isInBlackoutPeriod(date: Date, blackoutPeriods: DateRange[]): boolean {
    // ...
}
```

## Flux de données

Le système suit un flux de données unidirectionnel:

1. **Entrée**: Dates et options de validation
2. **Traitement**: Application des règles de validation
3. **État**: Mise à jour de l'état des erreurs et du contexte
4. **Sortie**: Résultat de validation (booléen) et informations d'erreur

```
┌────────┐     ┌─────────────┐     ┌───────────────┐
│ Entrée ├────►│ Traitement  ├────►│ Mise à jour   │
└────────┘     │ des règles  │     │ de l'état     │
                └─────────────┘     └───────┬───────┘
                                           │
┌────────┐                                 │
│ Sortie │◄────────────────────────────────┘
└────────┘
```

## Intégration avec le système d'erreurs global

Le hook `useDateValidation` s'intègre avec le système de gestion d'erreurs global via `useErrorHandler`:

```typescript
const { setError, clearError, clearAllErrors } = useErrorHandler();

// Lors de la validation
if (!isValid) {
    setError(fieldName, {
        severity: errorSeverity[errorType],
        message: errorMessage,
        code: `DATE_VALIDATION_${errorType.toUpperCase()}`
    });
}
```

## Extensibilité

Le système est conçu pour être extensible:

1. **Nouvelles règles**: Ajout facile de nouvelles règles via l'enum `DateValidationErrorType`
2. **Options personnalisées**: Configuration via l'interface `DateValidationOptions`
3. **Validations métier**: Fonctions spécifiques comme `validateLeaveRequest`

## Stratégie d'erreurs

Le système utilise une approche à deux niveaux pour la gestion des erreurs:

1. **Erreurs locales**: Stockées dans l'état `errors` du hook
2. **Erreurs globales**: Propagées via `useErrorHandler` pour les erreurs critiques

Les erreurs sont identifiées par le nom du champ, permettant une gestion précise:

```typescript
{
    "startDate": { 
        type: DateValidationErrorType.PAST_DATE,
        message: "Les dates passées ne sont pas autorisées"
    },
    "endDate": {
        type: DateValidationErrorType.WEEKEND,
        message: "Les week-ends ne sont pas autorisés"
    }
}
```

## Performance

Le système intègre plusieurs optimisations de performance:

1. **Mémoïsation**: Utilisation de `useCallback` pour les fonctions
2. **Normalisation**: Traitement uniforme des formats de date
3. **Validation sélective**: Validation uniquement des champs nécessaires
4. **Mise en cache du contexte**: Partage des informations entre validations

## Scénarios de validation complexes

### Validation de congés

```typescript
validateLeaveRequest(startDate, endDate, userId, {
    availableDaysPerYear: 25,
    minAdvanceNotice: 3,
    businessDaysOnly: true
})
```

1. Vérifie que les dates sont valides et cohérentes
2. Calcule la durée en jours ouvrables
3. Vérifie le quota disponible
4. Détecte les conflits avec d'autres événements

### Validation d'affectation de garde

```typescript
validateShiftAssignment(date, shift, userId, {
    blackoutPeriods: restPeriods
})
```

1. Vérifie que la date est valide
2. Vérifie que l'utilisateur a le repos requis
3. Détecte les conflits avec d'autres gardes

## Dépendances

Le système dépend principalement de:

1. **date-fns**: Manipulation et calculs de dates
2. **React**: Hooks (`useState`, `useCallback`, `useEffect`)
3. **useErrorHandler**: Gestion globale des erreurs

## Exemple d'implémentation

Voici un exemple simplifié de l'implémentation du système:

```typescript
export function useDateValidation() {
    const [errors, setErrors] = useState<Record<string, DateValidationError>>({});
    const [context, setContext] = useState<ValidationContext>({});
    const { setError, clearError } = useErrorHandler();

    const validateDate = useCallback((date, fieldName, options = {}) => {
        // 1. Vérification des paramètres
        if (!date && !options.required) return true;
        if (!date && options.required) {
            // Gérer erreur REQUIRED
            return false;
        }

        // 2. Normalisation
        const dateObj = normalizeDate(date);
        if (!dateObj) {
            // Gérer erreur INVALID_FORMAT
            return false;
        }

        // 3. Validation des règles
        if (!options.allowPastDates && isPastDate(dateObj)) {
            // Gérer erreur PAST_DATE
            return false;
        }

        // 4. Autres validations...

        // 5. Si tout est valide
        clearError(fieldName);
        return true;
    }, [errors, clearError]);

    // Autres fonctions...

    return {
        validateDate,
        validateDateRange,
        // ...autres fonctions et états
    };
}
```

## Schéma du flux de validation

```
┌──────────────┐       ┌───────────────┐
│ Composant UI │◄──────┤ Valider date  │
└───────┬──────┘       └───────┬───────┘
        │                      │
        ▼                      ▼
┌──────────────┐       ┌───────────────┐
│ Appeler hook │       │ Normalisation │
└───────┬──────┘       │ règles        │
        │              └───────┬───────┘
        │                      │
        ▼                      ▼
┌──────────────┐       ┌───────────────┐
│ validateDate │       │ Appliquer     │
└───────┬──────┘       │ règles        │
        │              └───────┬───────┘
        │                      │
        ▼                      ▼
┌────────────────────────────────────┐
│         Mise à jour état           │
└────────────────┬───────────────────┘
                 │
                 ▼
┌────────────────────────────────────┐
│         Afficher erreurs           │
└────────────────────────────────────┘
```

## Recommandations d'implémentation

1. **Nommage cohérent**: Utiliser des noms de champs cohérents dans tous les composants
2. **Validation précoce**: Valider dès que l'utilisateur modifie une valeur
3. **Feedback immédiat**: Afficher les erreurs dès qu'elles sont détectées
4. **Validation finale**: Vérifier à nouveau avant la soumission du formulaire

## Considérations pour le futur

1. **Internationalisation**: Support pour les formats de date internationaux
2. **Règles personnalisées**: Mécanisme pour ajouter des règles spécifiques
3. **Validation asynchrone**: Support pour la validation côté serveur
4. **Intégration avec les schémas**: Support pour Zod ou d'autres validateurs de schémas 