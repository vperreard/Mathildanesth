# Architecture du Système de Validation des Dates

Ce document présente l'architecture technique du système de validation des dates implémenté dans l'application Mathildanesth.

## Vue d'Ensemble

Le système de validation des dates est construit autour d'un hook React central (`useDateValidation`) qui encapsule toute la logique de validation, assurant une séparation des préoccupations et facilitant la réutilisation du code.

```
┌────────────────────────────────────────────────────────────────┐
│                  Application Mathildanesth                      │
└───────────────────────────────┬────────────────────────────────┘
                                │
┌───────────────────────────────▼────────────────────────────────┐
│                 Hook useDateValidation                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │ Validation  │    │ Validation  │    │ Validation          │ │
│  │ de base des │    │ des congés  │    │ des gardes          │ │
│  │ dates       │    │             │    │                     │ │
│  └──────┬──────┘    └──────┬──────┘    └──────────┬──────────┘ │
│         │                  │                      │            │
│         └──────────────────┼──────────────────────┘            │
│                            │                                   │
│  ┌─────────────┐    ┌──────▼──────┐    ┌─────────────────────┐ │
│  │ Utilitaires │    │ Gestion du  │    │ Détection des       │ │
│  │ de dates    │◄───┤ contexte    │───►│ conflits            │ │
│  │             │    │             │    │                     │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
           │                  │                   │
           ▼                  ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│   Composants    │  │ Formulaires de  │  │  Calendriers et     │
│   d'interface   │  │   demandes      │  │  plannings          │
└─────────────────┘  └─────────────────┘  └─────────────────────┘
```

## Architecture Détaillée

### 1. Structure du Hook useDateValidation

Le hook `useDateValidation` est structuré selon le principe de responsabilité unique, avec des fonctions dédiées à des aspects spécifiques de la validation:

```
┌────────────────────────────────────────────────────────────────┐
│                       useDateValidation                         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ État (State) ─────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  • errors: Stockage des erreurs par champ              │    │
│  │  • validationContext: Contexte de validation           │    │
│  │    (jours utilisés, restants, conflits, etc.)          │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─ Fonctions principales ─────────────────────────────────┐    │
│  │                                                         │    │
│  │  • validateDate(): Validation d'une date unique         │    │
│  │  • validateDateRange(): Validation d'une plage          │    │
│  │  • validateLeaveRequest(): Validation des congés        │    │
│  │  • validateShiftAssignment(): Validation des gardes     │    │
│  │  • detectConflicts(): Détection des conflits            │    │
│  │  • validateOverlap(): Vérification des chevauchements   │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─ Fonctions utilitaires ────────────────────────────────┐    │
│  │                                                         │    │
│  │  • getErrorMessage(): Récupération des messages        │    │
│  │  • getErrorType(): Récupération des types d'erreur     │    │
│  │  • hasError(): Vérification de présence d'erreur       │    │
│  │  • resetErrors(): Réinitialisation des erreurs         │    │
│  │  • setContext(): Définition du contexte                │    │
│  │  • resetContext(): Réinitialisation du contexte        │    │
│  │  • resetAll(): Réinitialisation complète               │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 2. Flux de Validation

Le processus de validation suit un flux bien défini:

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│Composant  │     │   Hook    │     │Validation │     │ Gestion   │
│utilisateur│     │useDateVal.│     │ spécifique│     │des erreurs│
└─────┬─────┘     └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
      │                 │                 │                 │
      │ Appel fonction  │                 │                 │
      │────────────────>│                 │                 │
      │                 │ Validation de   │                 │
      │                 │ premier niveau  │                 │
      │                 │────────────────>│                 │
      │                 │                 │ Validation      │
      │                 │                 │ données         │
      │                 │                 │─────────────────>
      │                 │                 │                 │ Stockage
      │                 │                 │                 │ erreurs
      │                 │                 │<─────────────────
      │                 │<────────────────│                 │
      │<────────────────│                 │                 │
      │                 │                 │                 │
      │ Lecture erreurs │                 │                 │
      │────────────────>│                 │                 │
      │                 │ Récupération    │                 │
      │                 │ erreurs         │                 │
      │                 │─────────────────────────────────>│
      │                 │                 │                 │
      │                 │<─────────────────────────────────│
      │<────────────────│                 │                 │
      │                 │                 │                 │
      │ Affichage       │                 │                 │
      │ erreurs UI      │                 │                 │
      │                 │                 │                 │
      │                 │                 │                 │
```

### 3. Modèle de Données

Le système utilise plusieurs interfaces TypeScript pour assurer la cohérence des données:

```
┌─────────────────────────┐
│   DateValidationOptions │
├─────────────────────────┤
│ • required              │
│ • allowPastDates        │
│ • allowFutureDates      │
│ • minDate               │
│ • maxDate               │
│ • disallowWeekends      │
│ • onlyBusinessDays      │
│ • holidays              │
│ • maxDuration           │
│ • minDuration           │
│ • format                │
│ • minAdvanceNotice      │
│ • maxAdvanceBooking     │
│ • blackoutPeriods       │
│ • availableDaysPerYear  │
│ • businessDaysOnly      │
└─────────────────────────┘
          ▲
          │
          │
┌─────────────────────────┐
│   DateValidationError   │
├─────────────────────────┤
│ • type                  │
│ • message               │
│ • details               │
└─────────────────────────┘
          ▲
          │
          │
┌─────────────────────────┐      ┌─────────────────────────┐
│      DateRange          │      │   ValidationContext     │
├─────────────────────────┤      ├─────────────────────────┤
│ • start                 │      │ • usedDays              │
│ • end                   │      │ • remainingDays         │
│ • label                 │      │ • conflicts             │
│ • type                  │      │ • businessDaysCount     │
└─────────────────────────┘      │ • totalDaysCount        │
                                 └─────────────────────────┘
```

### 4. Intégration dans l'Application

Le hook `useDateValidation` s'intègre aux différents modules de l'application Mathildanesth:

```
┌────────────────────────────────────────────────────────────┐
│                   Application Mathildanesth                 │
└───┬──────────────┬───────────────────────┬─────────────────┘
    │              │                       │
┌───▼───┐     ┌────▼────┐            ┌─────▼─────┐
│Module │     │ Module  │            │  Module   │
│Congés │     │ Gardes  │            │ Planning  │
└───┬───┘     └────┬────┘            └─────┬─────┘
    │              │                       │
    │              │                       │
┌───▼──────────────▼───────────────────────▼─────┐
│             useDateValidation                   │
└────────────────────────────────────────────────┘
```

## Dépendances Externes

Le système s'appuie sur les bibliothèques externes suivantes:

- **date-fns**: Pour la manipulation et les calculs sur les dates
- **React Hooks**: Pour la gestion de l'état et du cycle de vie des composants

```
┌────────────────────────────────────────────────────────────┐
│                    useDateValidation                        │
└─────────────────────────┬──────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
    ┌─────────▼──────────┐   ┌────────▼─────────┐
    │      date-fns      │   │   React Hooks    │
    └────────────────────┘   └──────────────────┘
```

## Communication entre Composants

Le système facilite la communication entre les différents composants qui l'utilisent:

```
┌─────────────────┐     ┌──────────────────┐      ┌─────────────────────┐
│   Formulaire    │     │  useDateValidation│      │  Affichage des      │
│   de demande    │     │                  │      │  erreurs de         │
│                 │     │                  │      │  validation          │
└────────┬────────┘     └────────┬─────────┘      └──────────┬──────────┘
         │                       │                           │
         │ 1. Appel validateDate │                           │
         │─────────────────────► │                           │
         │                       │                           │
         │                       │ 2. Stockage des erreurs   │
         │                       │ dans l'état               │
         │                       │                           │
         │                       │                           │
         │ 3. Appel hasError     │                           │
         │─────────────────────► │                           │
         │                       │                           │
         │ 4. Résultat true/false│                           │
         │◄──────────────────────│                           │
         │                       │                           │
         │                       │                           │
         │                       │ 5. Appel getErrorMessage  │
         │                       │◄──────────────────────────│
         │                       │                           │
         │                       │ 6. Message d'erreur       │
         │                       │───────────────────────────►
         │                       │                           │
         │                       │                           │
```

## Évolutivité et Maintenance

L'architecture est conçue pour être facilement extensible:

```
┌─ Évolutions futures possibles ──────────────────────────────┐
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │ Support des │    │ Règles de   │    │ Support des     │ │
│  │ fuseaux     │    │ validation  │    │ événements      │ │
│  │ horaires    │    │ personnalisées│   │ récurrents     │ │
│  └─────────────┘    └─────────────┘    └─────────────────┘ │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │ Intégration │    │ Validation  │    │ Optimisation    │ │
│  │ calendriers │    │ côté        │    │ des             │ │
│  │ externes    │    │ serveur     │    │ performances    │ │
│  └─────────────┘    └─────────────┘    └─────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Sécurité et Validation côté Serveur

Bien que le hook fournisse une validation côté client robuste, il est complété par une validation côté serveur:

```
┌────────────────┐                              ┌─────────────────┐
│    Client      │                              │     Serveur     │
│                │                              │                 │
│ ┌────────────┐ │      1. Demande validée     │ ┌─────────────┐ │
│ │Formulaire  │ │       côté client           │ │  API de     │ │
│ │utilisateur │ │ ─────────────────────────► │ │ validation  │ │
│ └────────────┘ │                              │ └─────┬───────┘ │
│                │                              │       │         │
│                │                              │       │         │
│                │                              │       ▼         │
│                │                              │ ┌─────────────┐ │
│                │                              │ │ Validation  │ │
│                │                              │ │ serveur     │ │
│                │                              │ └─────┬───────┘ │
│                │                              │       │         │
│                │                              │       │         │
│                │                              │       ▼         │
│                │                              │ ┌─────────────┐ │
│                │                              │ │ Base de     │ │
│                │                              │ │ données     │ │
│                │      2. Réponse serveur      │ └─────────────┘ │
│                │ ◄─────────────────────────── │                 │
│                │                              │                 │
└────────────────┘                              └─────────────────┘
```

## Conclusion

L'architecture du système de validation des dates est conçue pour être:

- **Modulaire**: Chaque fonction a une responsabilité unique
- **Réutilisable**: Le hook peut être intégré dans n'importe quel composant
- **Maintenable**: La séparation des préoccupations facilite les modifications
- **Évolutive**: La structure permet d'ajouter facilement de nouvelles fonctionnalités
- **Robuste**: La validation côté client est complétée par une validation côté serveur

Cette architecture garantit que le système peut évoluer avec les besoins changeants de l'application Mathildanesth tout en maintenant une haute qualité et une facilité d'utilisation. 