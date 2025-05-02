# Documentation Technique du Module de Congés

## Vue d'ensemble

Le module de congés permet la gestion complète des demandes de congés, incluant la création, l'approbation, le suivi des quotas et la notification. Il s'intègre avec les autres modules de l'application via un bus d'événements et offre une expérience utilisateur fluide et intuitive.

## Architecture du système

### Structure modulaire

Le module est organisé selon une architecture modulaire dans `src/modules/leaves/` avec les sous-dossiers suivants :

```
src/modules/leaves/
├── components/     # Composants UI
├── hooks/          # Hooks personnalisés
├── services/       # Services et logique métier
├── permissions/    # Gestion des autorisations
├── types/          # Types et interfaces
└── utils/          # Fonctions utilitaires
```

### Modèle de données

#### Types de congés
```typescript
export enum LeaveType {
    ANNUAL = 'ANNUAL',           // Congé annuel
    RECOVERY = 'RECOVERY',       // Récupération
    TRAINING = 'TRAINING',       // Formation
    SICK = 'SICK',               // Maladie
    FAMILY = 'FAMILY',           // Événement familial
    MATERNITY = 'MATERNITY',     // Maternité
    PATERNITY = 'PATERNITY',     // Paternité
    UNPAID = 'UNPAID',           // Sans solde
    OTHER = 'OTHER'              // Autre
}
```

#### Statuts des demandes
```typescript
export enum LeaveStatus {
    DRAFT = 'DRAFT',             // Brouillon
    PENDING = 'PENDING',         // En attente d'approbation
    APPROVED = 'APPROVED',       // Approuvé
    REJECTED = 'REJECTED',       // Rejeté
    CANCELLED = 'CANCELLED',     // Annulé
    COMPLETED = 'COMPLETED'      // Terminé
}
```

#### Schéma principal
Le modèle `Leave` dans Prisma contient :
- Identifiants (id, userId)
- Période (startDate, endDate)
- Métadonnées (type, status, reason)
- Données de validation (approvalDate, approvedById)
- Données de calcul (countedDays, calculationDetails)
- Support pour les congés récurrents (isRecurring, recurrencePattern, parentId)

## Fonctionnalités principales

### 1. Gestion des demandes de congés

#### Composants UI
- `LeaveForm.tsx` : Formulaire de création/édition des demandes
- `LeaveRequestForm.tsx` : Version avancée avec validation intégrée
- `LeaveCard.tsx` : Affichage compact d'une demande
- `LeavesList.tsx` : Liste des demandes avec filtrage et tri

#### Hooks
- `useLeave.ts` : Gestion complète d'une demande de congés
  ```typescript
  const { 
    leave, leaves, loading, error,
    updateLeaveField, saveLeaveAsDraft, submitLeave,
    approveLeaveRequest, rejectLeaveRequest, cancelLeaveRequest,
    checkConflicts, checkAllowance, fetchUserLeaves
  } = useLeave({ userId, initialLeave });
  ```

#### Validation
- Utilise `useLeaveValidation` qui étend `useDateValidation`
- Vérifie les dates, quotas, délais de préavis et règles métier
- Génère des messages d'erreur contextuels

#### Workflow
1. Création d'une demande (brouillon ou soumission directe)
2. Validation des règles métier et des contraintes
3. Approbation ou rejet par les personnes autorisées
4. Notification des résultats aux parties concernées

### 2. Système de quotas avancé

#### Hooks
- `useLeaveQuota.ts` : Gestion des quotas de congés
  ```typescript
  const {
    balance, quotasByType, loading, error,
    getQuotaForType, calculateRemainingDays,
    checkAllowance, transferQuota
  } = useLeaveQuota({ userId, year });
  ```

#### Fonctionnalités
- Calcul des quotas en fonction du temps de travail
- Visualisation détaillée des jours utilisés et disponibles
- Vérification des quotas lors des demandes
- Alertes sur les quotas faibles
- Structure de données :
  ```typescript
  interface LeaveBalance {
    userId: string;
    year: number;
    initialAllowance: number;
    additionalAllowance: number;
    used: number;
    pending: number;
    remaining: number;
    detailsByType: Record<LeaveType, LeaveTypeQuota>;
    lastUpdated: Date;
  }
  ```

### 3. Congés récurrents

#### Types
```typescript
export enum RecurrenceFrequency {
    DAILY = 'DAILY',           // Tous les jours
    WEEKLY = 'WEEKLY',         // Toutes les semaines
    MONTHLY = 'MONTHLY',       // Tous les mois
    YEARLY = 'YEARLY'          // Tous les ans
}

export interface RecurrencePattern {
    frequency: RecurrenceFrequency;
    interval: number;
    weekdays?: number[];       // Pour récurrence hebdomadaire
    dayOfMonth?: number;       // Pour récurrence mensuelle
    weekOfMonth?: number;      // Pour récurrence mensuelle
    endType: RecurrenceEndType;
    endDate?: Date;            // Jusqu'à une date
    endCount?: number;         // Nombre d'occurrences
    skipHolidays?: boolean;    // Ignorer les jours fériés
    skipWeekends?: boolean;    // Ignorer les weekends
}
```

#### Fonctionnalités
- Création de demandes récurrentes selon différentes fréquences
- Génération automatique des occurrences
- Gestion des exceptions dans une série
- Exclusion automatique des jours fériés et weekends si configuré

#### Utilitaires
- `generateRecurringDates` : Génère les dates des occurrences
- API dédiée : `/api/leaves/recurring`

### 4. Système de notifications

#### Services
- `NotificationService` : Gestion centralisée des notifications
- `NotificationEventService` : Déclenchement automatique des notifications

#### Types de notifications
```typescript
export enum LeaveNotificationType {
    LEAVE_REQUESTED = 'LEAVE_REQUESTED',         // Nouvelle demande
    LEAVE_APPROVED = 'LEAVE_APPROVED',           // Demande approuvée
    LEAVE_REJECTED = 'LEAVE_REJECTED',           // Demande rejetée
    LEAVE_CANCELLED = 'LEAVE_CANCELLED',         // Demande annulée
    LEAVE_REMINDER = 'LEAVE_REMINDER',           // Rappel de congé à venir
    LEAVE_QUOTA_LOW = 'LEAVE_QUOTA_LOW',         // Alerte de quota faible
    APPROVAL_REMINDER = 'APPROVAL_REMINDER',     // Rappel d'approbation en attente
    CONFLICT_DETECTED = 'CONFLICT_DETECTED'      // Conflit détecté
}
```

#### Hooks
- `useLeaveNotifications` : Gestion des notifications côté client
  ```typescript
  const {
    notifications, unreadCount, loading,
    markAsRead, markAllAsRead, fetchNotifications
  } = useLeaveNotifications({
    autoFetch: true,
    unreadOnly: true
  });
  ```

#### Personnalisation
- Interface utilisateur pour configurer les préférences
- Canaux de notification configurables (app, email, SMS)
- Seuils et délais personnalisables

### 5. Intégration avec d'autres modules

#### Bus d'événements
Service `EventBusService` permettant la communication entre modules :
```typescript
eventBus.publish(IntegrationEventType.LEAVE_APPROVED, {
  leaveId: leave.id,
  userId: leave.userId,
  dates: { start: leave.startDate, end: leave.endDate }
});

eventBus.subscribe(IntegrationEventType.CALENDAR_EVENT_CREATED, handleCalendarEvent);
```

#### Services d'intégration
- `LeaveToPlanningService` : Synchronisation avec le planning
- `LeaveReportApi` : Données pour le module de statistiques
- `AuditService` : Journalisation des actions sensibles

#### Composants d'intégration
- `LeaveCalendarView` : Visualisation des congés dans le calendrier

### 6. Contrôle d'accès granulaire

#### Permissions
```typescript
export enum LeavePermission {
    VIEW_OWN_LEAVES = 'leaves.view.own',
    REQUEST_LEAVE = 'leaves.request',
    CANCEL_OWN_LEAVE = 'leaves.cancel.own',
    VIEW_TEAM_LEAVES = 'leaves.view.team',
    APPROVE_TEAM_LEAVES = 'leaves.approve.team',
    VIEW_ALL_LEAVES = 'leaves.view.all',
    APPROVE_ALL_LEAVES = 'leaves.approve.all',
    MANAGE_QUOTAS = 'leaves.quotas.manage',
    // etc.
}
```

#### Service de permissions
`LeavePermissionService` : Gestion des autorisations
```typescript
const canApprove = await permissionService.hasPermission(
  userId,
  LeavePermission.APPROVE_TEAM_LEAVES,
  { departmentId }
);
```

### 7. Système de détection et gestion des conflits

#### Types de conflits
```typescript
export enum ConflictType {
    USER_LEAVE_OVERLAP = 'USER_LEAVE_OVERLAP',       // Chevauchement avec un autre congé
    TEAM_ABSENCE = 'TEAM_ABSENCE',                   // Trop de membres d'équipe absents
    TEAM_CAPACITY = 'TEAM_CAPACITY',                 // Capacité d'équipe insuffisante
    SPECIALTY_CAPACITY = 'SPECIALTY_CAPACITY',       // Capacité de spécialité insuffisante
    CRITICAL_ROLE = 'CRITICAL_ROLE',                 // Rôle critique non couvert
    SPECIAL_PERIOD = 'SPECIAL_PERIOD',               // Période spéciale
    HOLIDAY_PROXIMITY = 'HOLIDAY_PROXIMITY',         // Proximité avec un jour férié
    HIGH_WORKLOAD = 'HIGH_WORKLOAD',                 // Période de charge élevée
    RECURRING_MEETING = 'RECURRING_MEETING',         // Conflit avec réunion récurrente
    DEADLINE_PROXIMITY = 'DEADLINE_PROXIMITY'        // Proximité avec une échéance
}

export enum ConflictSeverity {
    INFORMATION = 'INFORMATION',      // Informatif
    AVERTISSEMENT = 'AVERTISSEMENT',  // Avertissement
    BLOQUANT = 'BLOQUANT'             // Bloquant
}
```

#### Structure d'un conflit
```typescript
export interface LeaveConflict {
    id: string;
    leaveId: string;
    type: ConflictType;
    severity: ConflictSeverity;
    description: string;
    startDate: string;
    endDate: string;
    affectedUserIds?: string[];
    canOverride: boolean;
    metadata?: Record<string, any>;
}
```

#### Hooks
- `useConflictDetection` : Détection et gestion des conflits
  ```typescript
  const {
    conflicts, hasBlockingConflicts, loading, error,
    checkConflicts, getConflictsByType, 
    getBlockingConflicts, getWarningConflicts, getInfoConflicts,
    resolveConflict, resetConflicts, validateDates
  } = useConflictDetection({ userId });
  ```

#### Composants UI
- `LeaveConflictAlert` : Affichage des alertes de conflit avec actions
- `LeaveConflictDashboard` : Tableau de bord d'analyse des conflits

#### Service de détection
Le service `ConflictDetectionService` vérifie plusieurs types de conflits :
- Chevauchement avec d'autres congés de l'utilisateur
- Taux d'absence trop élevé dans l'équipe
- Rôles critiques non couverts
- Périodes de charge élevée
- Proximité avec des jours fériés ou des échéances

#### Workflow de résolution
1. Détection automatique lors de la création/modification d'une demande
2. Affichage des conflits détectés à l'utilisateur
3. Possibilité de résoudre ou d'ignorer les conflits selon leur sévérité
4. Vérification finale avant approbation

#### Optimisations
- Mise en cache des résultats de détection
- Détection parallèle des différents types de conflits
- Arrêt anticipé si un conflit bloquant est détecté

#### Configuration
Les règles de détection des conflits sont configurables :
```typescript
export interface ConflictRules {
    maxTeamAbsencePercentage: number;    // Pourcentage maximum d'absence dans l'équipe
    criticalRoles: string[];             // Liste des rôles considérés comme critiques
    blockHighWorkloadPeriods: boolean;   // Bloquer pendant les périodes de charge élevée
    highWorkloadPeriods: {               // Définition des périodes de charge élevée
        startDate: string;
        endDate: string;
        description: string;
    }[];
    // Autres règles...
}
```

### 8. Analytics et rapports des conflits

#### Dashboard d'analyse
`LeaveConflictDashboard` permet de visualiser :
- Distribution des types de conflits
- Évolution des conflits par période
- Analyse par département et type de congé
- Impact sur les délais d'approbation

#### Métriques principales
- Taux de conflits par demande
- Pourcentage de conflits bloquants
- Temps moyen de résolution
- Types de conflits les plus fréquents

#### Exports
Possibilité d'exporter les données d'analyse au format CSV pour traitement externe.

## API REST

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|------------|
| GET | `/api/leaves` | Liste des congés | VIEW_OWN_LEAVES, VIEW_TEAM_LEAVES, VIEW_ALL_LEAVES |
| POST | `/api/leaves` | Créer une demande | REQUEST_LEAVE |
| GET | `/api/leaves/:id` | Détails d'un congé | VIEW_OWN_LEAVES, VIEW_TEAM_LEAVES, VIEW_ALL_LEAVES |
| PUT | `/api/leaves/:id` | Modifier une demande | REQUEST_LEAVE |
| DELETE | `/api/leaves/:id` | Supprimer une demande | DELETE_LEAVE |
| POST | `/api/leaves/:id/approve` | Approuver un congé | APPROVE_TEAM_LEAVES, APPROVE_ALL_LEAVES |
| POST | `/api/leaves/:id/reject` | Rejeter un congé | APPROVE_TEAM_LEAVES, APPROVE_ALL_LEAVES |
| POST | `/api/leaves/:id/cancel` | Annuler un congé | CANCEL_OWN_LEAVE, CANCEL_ANY_LEAVE |
| GET | `/api/leaves/balance` | Consulter le solde de congés | VIEW_OWN_LEAVES |
| POST | `/api/leaves/recurring` | Créer une demande récurrente | REQUEST_LEAVE |

## Évolutions en cours

### Transfert et report de quotas
- Développement en cours d'un système pour transférer des quotas entre différents types de congés
- Implémentation de règles de report d'une année sur l'autre
- Interface utilisateur pour les transferts et reports

### Améliorations techniques
- Optimisation des performances de validation
- Mise en cache des vérifications fréquentes
- Extension de la couverture de tests

## Bonnes pratiques

### Patterns recommandés
- Utiliser les hooks spécialisés (`useLeave`, `useLeaveQuota`) plutôt que de réimplémenter la logique
- Toujours valider une demande avec `checkConflicts` avant soumission
- Utiliser le bus d'événements pour la communication entre modules
- Vérifier les permissions avec `LeavePermissionService`

### Anti-patterns à éviter
- Ne pas contourner le workflow d'approbation
- Éviter les mises à jour directes du statut sans passer par les services dédiés
- Ne pas dupliquer la logique de calcul des jours décomptés

## Conclusion

Le module de congés offre une solution complète et flexible pour la gestion des demandes, adaptée aux besoins spécifiques d'un environnement médical avec différents types de personnels et d'horaires de travail. Son architecture modulaire facilite l'évolution et l'intégration avec le reste de l'application. 