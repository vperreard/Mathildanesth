# Documentation technique : Système de gestion des congés récurrents

Cette documentation présente l'implémentation du système de congés récurrents, qui permet aux utilisateurs de définir des demandes de congés répétitives selon différents modèles de récurrence.

## Table des matières

1. [Architecture du système](#architecture-du-système)
2. [Types et modèles de données](#types-et-modèles-de-données)
3. [Utilitaire de génération des dates](#utilitaire-de-génération-des-dates)
4. [Validation des demandes récurrentes](#validation-des-demandes-récurrentes)
5. [Interface utilisateur](#interface-utilisateur)
6. [Règles métier et contraintes](#règles-métier-et-contraintes)
7. [Exemples d'utilisation](#exemples-dutilisation)
8. [Considérations techniques](#considérations-techniques)

## Architecture du système

Le système de gestion des congés récurrents est composé de plusieurs modules interdépendants :

1. **Modèles de données** : Définition des types spécifiques aux congés récurrents.
2. **Utilitaires de génération** : Algorithmes pour calculer les occurrences de congés basées sur un modèle de récurrence.
3. **Système de validation** : Extension du hook `useLeaveValidation` pour valider les demandes récurrentes.
4. **Composants d'interface utilisateur** : Formulaires et contrôles pour configurer et visualiser les récurrences.

Le système est intégré dans l'architecture existante du module de congés, en s'appuyant sur les hooks et services déjà en place pour la détection de conflits et la validation des dates.

## Types et modèles de données

### RecurrenceFrequency

Définit les différentes fréquences de récurrence possibles :

```typescript
export enum RecurrenceFrequency {
  DAILY = 'DAILY',           // Tous les jours
  WEEKLY = 'WEEKLY',         // Toutes les semaines
  MONTHLY = 'MONTHLY',       // Tous les mois
  YEARLY = 'YEARLY'          // Tous les ans
}
```

### RecurrenceEndType

Définit les différentes façons de spécifier la fin d'une récurrence :

```typescript
export enum RecurrenceEndType {
  NEVER = 'NEVER',           // Pas de fin
  UNTIL_DATE = 'UNTIL_DATE', // Jusqu'à une date spécifique
  COUNT = 'COUNT'            // Nombre d'occurrences
}
```

### RecurrencePattern

Décrit un modèle de récurrence complet :

```typescript
export interface RecurrencePattern {
  frequency: RecurrenceFrequency;      // Fréquence (quotidien, hebdomadaire, etc.)
  interval: number;                    // Intervalle (tous les X jours, semaines, etc.)
  
  // Jours spécifiques de la semaine (pour récurrence hebdomadaire)
  weekdays?: number[];                 // 0 = dimanche, 1 = lundi, etc.
  
  // Pour récurrence mensuelle
  dayOfMonth?: number;                 // Jour du mois (1-31)
  weekOfMonth?: number;                // Semaine du mois (1-5)
  
  // Conditions de fin
  endType: RecurrenceEndType;          // Type de fin
  endDate?: Date;                      // Date de fin (si endType = UNTIL_DATE)
  endCount?: number;                   // Nombre d'occurrences (si endType = COUNT)
  
  // Configuration supplémentaire
  skipHolidays?: boolean;              // Ignorer les jours fériés
  skipWeekends?: boolean;              // Ignorer les weekends
}
```

### RecurringLeaveRequest

Étend le type `Leave` pour représenter une demande de congés récurrente :

```typescript
export interface RecurringLeaveRequest extends Omit<Leave, 'startDate' | 'endDate'> {
  isRecurring: true;                   // Indicateur de récurrence
  patternStartDate: Date;              // Date de début du modèle
  patternEndDate: Date;                // Date de fin du modèle (durée de chaque occurrence)
  recurrencePattern: RecurrencePattern; // Modèle de récurrence
  generatedOccurrences?: Leave[];      // Occurrences générées
}
```

## Utilitaire de génération des dates

L'utilitaire `generateRecurringDates` est au cœur du système. Il prend une demande récurrente et calcule toutes les occurrences selon le modèle de récurrence défini.

### Principales fonctionnalités

- Calcul des occurrences selon la fréquence (quotidienne, hebdomadaire, mensuelle, annuelle)
- Prise en compte des intervalles (tous les X jours, semaines, etc.)
- Gestion des conditions de fin (date spécifique, nombre d'occurrences, sans fin)
- Exclusion des weekends et jours fériés si demandé
- Statistiques sur le nombre total de jours demandés

### Algorithme

L'algorithme utilise une approche itérative pour générer les occurrences :

1. Déterminer la date de départ et calculer la durée de chaque occurrence
2. Créer une boucle qui s'arrête selon la condition de fin
3. Pour chaque itération, créer une nouvelle occurrence en appliquant le modèle
4. Appliquer les règles d'exclusion (weekends, jours fériés)
5. Calculer les statistiques (jours totaux, jours ouvrables)

```typescript
// Extrait simplifié de l'algorithme
while (conditionDeFinNonAtteinte) {
  // Vérifier les règles d'exclusion spécifiques à la fréquence
  if (doitExclureCetteDate(currentDate, recurrencePattern)) {
    currentDate = ajouterUnJour(currentDate);
    continue;
  }
  
  // Créer l'occurrence
  const occurrenceEndDate = addDays(currentDate, durationDays - 1);
  const occurrence = créerOccurrence(currentDate, occurrenceEndDate);
  occurrences.push(occurrence);
  
  // Passer à la prochaine date selon la fréquence et l'intervalle
  currentDate = incrementDate(currentDate, recurrencePattern);
}
```

## Validation des demandes récurrentes

Le hook `useRecurringLeaveValidation` étend le hook standard `useLeaveValidation` pour ajouter des validations spécifiques aux demandes récurrentes.

### Validations implémentées

1. **Validité du modèle de récurrence** :
   - Vérification de la fréquence, intervalle, type de fin
   - Cohérence des champs selon la fréquence
   - Limites sur le nombre d'occurrences

2. **Dates du modèle** :
   - Validation des dates de début et fin du modèle
   - Respect des délais de préavis

3. **Génération et vérification des occurrences** :
   - Calcul et validation des occurrences
   - Vérification qu'au moins une occurrence est générée

4. **Vérification des quotas** :
   - Calcul du total des jours demandés
   - Vérification par rapport aux quotas disponibles

5. **Détection des conflits** :
   - Vérification des conflits pour chaque occurrence
   - Rapport des occurrences problématiques

### Gestion des erreurs

Le système utilise une approche structurée pour la gestion des erreurs :

```typescript
export enum RecurringValidationErrorType {
  INVALID_PATTERN = 'invalid_pattern',
  QUOTA_EXCEEDED = 'quota_exceeded',
  TOO_MANY_OCCURRENCES = 'too_many_occurrences',
  RECURRING_CONFLICT = 'recurring_conflict',
  INVALID_END_DATE = 'invalid_end_date',
  NO_OCCURRENCES = 'no_occurrences',
  PATTERN_TOO_SHORT = 'pattern_too_short',
  PATTERN_TOO_LONG = 'pattern_too_long'
}
```

Ces types d'erreur permettent d'identifier précisément la nature du problème et de fournir des messages d'erreur contextuels.

## Interface utilisateur

L'interface utilisateur pour les congés récurrents est composée de deux parties principales :

1. **Option de récurrence dans le formulaire principal** - Permet d'activer/désactiver la récurrence
2. **Formulaire de configuration de récurrence** - Interface pour définir le modèle de récurrence

### RecurrenceForm

Le composant `RecurrenceForm` permet de configurer tous les aspects du modèle de récurrence :

- Fréquence (quotidienne, hebdomadaire, mensuelle, annuelle)
- Intervalle (tous les X jours, semaines, etc.)
- Jours de la semaine (pour récurrence hebdomadaire)
- Jour du mois (pour récurrence mensuelle)
- Type de fin (jamais, après X occurrences, à une date spécifique)
- Options d'exclusion (weekends, jours fériés)

Le formulaire est réactif et ajuste dynamiquement les champs affichés selon la fréquence sélectionnée.

### Prévisualisation

Une fonctionnalité importante de l'interface est la prévisualisation des occurrences générées :

```tsx
{isRecurring && generationResult && generationResult.occurrences.length > 0 && (
  <div className="occurrences-preview">
    <h3>Aperçu des occurrences ({generationResult.occurrences.length})</h3>
    <p>Total: {generationResult.totalDays} jours demandés</p>
    <ul className="occurrences-list">
      {generationResult.occurrences.slice(0, 5).map((occurrence, index) => (
        <li key={index}>
          {format(occurrence.startDate, 'dd/MM/yyyy')} - {format(occurrence.endDate, 'dd/MM/yyyy')}
        </li>
      ))}
      {generationResult.occurrences.length > 5 && (
        <li>... et {generationResult.occurrences.length - 5} autres occurrences</li>
      )}
    </ul>
  </div>
)}
```

Cette prévisualisation permet à l'utilisateur de comprendre l'impact de sa configuration en visualisant les dates réelles qui seront demandées.

## Règles métier et contraintes

Le système implémente diverses règles métier pour encadrer les demandes récurrentes :

1. **Limites sur les occurrences** :
   - Maximum de 50 occurrences par défaut
   - Génération limitée à 2 ans dans le futur

2. **Quotas et disponibilité** :
   - Vérification que le total des jours demandés ne dépasse pas le quota disponible
   - Prise en compte des jours ouvrables vs. jours calendaires

3. **Conflits** :
   - Validation individuelle de chaque occurrence
   - Détection des conflits avec d'autres congés ou événements

4. **Règles de validation spécifiques** :
   - Pour récurrence hebdomadaire : au moins un jour de la semaine sélectionné
   - Pour récurrence mensuelle : jour du mois entre 1 et 31
   - Pour fin par date : date dans la limite temporelle autorisée
   - Pour fin par nombre : limite sur le nombre d'occurrences

## Exemples d'utilisation

### Congé tous les vendredis pendant 10 semaines

```typescript
const recurrencePattern = {
  frequency: RecurrenceFrequency.WEEKLY,
  interval: 1,
  weekdays: [5], // Vendredi
  endType: RecurrenceEndType.COUNT,
  endCount: 10,
  skipHolidays: true
};
```

### Congé le premier jour de chaque mois pendant un an

```typescript
const recurrencePattern = {
  frequency: RecurrenceFrequency.MONTHLY,
  interval: 1,
  dayOfMonth: 1,
  endType: RecurrenceEndType.UNTIL_DATE,
  endDate: new Date('2024-12-31'),
  skipWeekends: true
};
```

### Congé de deux jours tous les trimestres

```typescript
const recurrencePattern = {
  frequency: RecurrenceFrequency.MONTHLY,
  interval: 3, // Tous les 3 mois
  dayOfMonth: 15, // À partir du 15 du mois
  endType: RecurrenceEndType.COUNT,
  endCount: 4 // 4 occurrences (1 an)
};
```

## Considérations techniques

### Performance

La génération et la validation des occurrences peuvent être intensives en calcul, surtout pour les modèles qui génèrent un grand nombre d'occurrences. Pour améliorer les performances :

- Limites sur le nombre d'occurrences et l'horizon temporel
- Traitement asynchrone pour ne pas bloquer l'interface utilisateur
- Validation progressive (d'abord le modèle, puis les occurrences)

### Stockage

Le stockage des demandes récurrentes nécessite une réflexion particulière :

1. **Option 1 - Stockage du modèle uniquement** :
   - Avantage : Économie d'espace de stockage
   - Inconvénient : Recalcul nécessaire à chaque utilisation

2. **Option 2 - Stockage du modèle et des occurrences** :
   - Avantage : Accès rapide aux occurrences
   - Inconvénient : Redondance des données

3. **Option 3 - Stockage du modèle et génération des occurrences à la demande** :
   - Approche hybride
   - Pré-génération des occurrences proches temporellement

Le système implémenté utilise l'option 3, en stockant le modèle et en générant les occurrences selon les besoins.

### Extensibilité

Le système a été conçu pour être facilement extensible :

- **Nouvelles fréquences** : La structure permet d'ajouter d'autres types de fréquences (bimensuel, trimestriel, etc.)
- **Règles supplémentaires** : Le processus de validation peut être enrichi avec de nouvelles règles
- **Personnalisation par type de congé** : Les règles peuvent être spécifiques selon le type de congé

### Intégration avec les systèmes existants

Le système s'intègre harmonieusement avec les composants existants :

- Utilisation du hook `useConflictDetection` pour la vérification des conflits
- Extension du hook `useLeaveValidation` pour la validation
- Enrichissement du formulaire `LeaveRequestForm` pour l'interface utilisateur

## Conclusion

Le système de gestion des congés récurrents offre une solution complète et flexible pour la définition de demandes répétitives. Son architecture modulaire et ses validations robustes en font un outil puissant pour optimiser le processus de demande de congés.

L'implémentation prend en compte les contraintes métier tout en offrant une expérience utilisateur intuitive grâce à la prévisualisation des occurrences et aux messages d'erreur contextuels. 