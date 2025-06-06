# Vue d'ensemble du Codebase

## Structure du Projet

### Types Communs
- `src/types/common.ts` : Types et interfaces partagés dans toute l'application
  - `ShiftType` : Énumération unifiée des types de gardes/vacations/astreintes
    ```typescript
    export enum ShiftType {
        // Consultations/Vacations (demi-journées)
        MATIN = 'MATIN',                    // Vacation 8h-13h (remplace MORNING)
        APRES_MIDI = 'APRES_MIDI',          // Vacation 13h30-18h30 (remplace AFTERNOON)

        // Gardes (journées complètes)
        JOUR = 'JOUR',                      // Garde de jour (période standard)
        NUIT = 'NUIT',                      // Garde de nuit (remplace NIGHT)
        GARDE_24H = 'GARDE_24H',            // Garde 8h-8h+1 (24h continues)
        GARDE_WEEKEND = 'GARDE_WEEKEND',    // Garde spécifique au weekend

        // Astreintes
        ASTREINTE = 'ASTREINTE',            // Astreinte générique (remplace ON_CALL)
        ASTREINTE_SEMAINE = 'ASTREINTE_SEMAINE', // Astreinte en semaine
        ASTREINTE_WEEKEND = 'ASTREINTE_WEEKEND', // Astreinte le weekend

        // Spécifiques
        URGENCE = 'URGENCE',                // Garde d'urgence
        CONSULTATION = 'CONSULTATION',      // Consultation spéciale
    }
    ```
  - `SHIFT_DURATION` : Mapping des types de shift vers leur durée en heures
    ```typescript
    export const SHIFT_DURATION: Record<ShiftType, number> = {
        [ShiftType.MATIN]: 5,               // 8h-13h
        [ShiftType.APRES_MIDI]: 5,          // 13h30-18h30
        [ShiftType.JOUR]: 12,               // Journée standard
        [ShiftType.NUIT]: 12,               // Nuit standard
        [ShiftType.GARDE_24H]: 24,          // 24h continues
        [ShiftType.GARDE_WEEKEND]: 24,      // 24h continues le weekend
        [ShiftType.ASTREINTE]: 24,          // 24h d'astreinte
        [ShiftType.ASTREINTE_SEMAINE]: 24,  // 24h d'astreinte en semaine
        [ShiftType.ASTREINTE_WEEKEND]: 24,  // 24h d'astreinte le weekend
        [ShiftType.URGENCE]: 12,            // Service d'urgence
        [ShiftType.CONSULTATION]: 4,        // Consultation spéciale
    }
    ```

### Composants UI
- `src/components/ui/` : Composants de base réutilisables
  - `button.tsx` : Composant Button
    ```typescript
    // Props
    interface ButtonProps {
      variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
      size?: 'default' | 'sm' | 'lg' | 'icon';
      children: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
    }
    ```
  - `card.tsx` : Composant Card
    ```typescript
    // Props
    interface CardProps {
      children: React.ReactNode;
      className?: string;
    }
    ```
  - `date-picker.tsx` : Composant DatePicker
    ```typescript
    // Props
    interface DatePickerProps {
      selected: Date | null;
      onSelect: (date: Date | null) => void;
      placeholder?: string;
      className?: string;
    }
    ```
  - `scroll-area.tsx` : Composant ScrollArea
    ```typescript
    // Props
    interface ScrollAreaProps {
      children: React.ReactNode;
      className?: string;
    }
    ```
  - `tabs.tsx` : Composant Tabs
    ```typescript
    // Props
    interface TabsProps {
      value: string;
      onValueChange: (value: string) => void;
      children: React.ReactNode;
    }
    ```
  - `dialog.tsx` : Composant Dialog
  - `input.tsx` : Composant Input
  - `select.tsx` : Composant Select
  - `switch.tsx` : Composant Switch
  - `table.tsx` : Composant Table
  - `textarea.tsx` : Composant Textarea
  - `badge.tsx` : Composant Badge
  - `notification.tsx` : Composant Notification
  - `RuleViolationIndicator.tsx` : Indicateur de violation de règles
  - `UnsavedChangesIndicator.tsx` : Indicateur de changements non sauvegardés

### Modules Fonctionnels
- `src/components/trames/` : Gestion des trames d'affectation
  - `TrameAffectation.tsx` : Composant principal
    ```typescript
    // Types
    type PeriodeType = 'HEBDOMADAIRE' | 'BI_HEBDOMADAIRE' | 'MENSUEL';
    
    interface Affectation {
      id: string;
      userId: number;
      periodeType: PeriodeType;
      dateDebut: Date;
      dateFin: Date;
      motif: string;
      isRecurrent: boolean;
    }
    
    // Props
    interface TrameAffectationProps {
      onSave: (trame: Affectation[]) => void;
      initialData?: Affectation[];
    }
    ```

- `src/components/planning/` : Gestion du planning
  - `PlanningView.tsx` : Affichage du planning
    ```typescript
    // Props
    interface PlanningViewProps {
      userId?: number;
    }
    ```

- `src/components/documentation/` : Documentation
  - `DocumentationViewer.tsx` : Visualiseur de documentation
    ```typescript
    // Props
    interface DocumentationViewerProps {
      technicalDoc: string;
      userGuide: string;
    }
    ```

- `src/components/absences/` : Gestion des absences
  - `AbsenceForm.tsx` : Formulaire d'absence
  - `AbsenceManager.tsx` : Gestionnaire d'absences

- `src/components/dashboard/` : Dashboard
  - `Dashboard.tsx` : Dashboard principal
  - `DashboardGrid.tsx` : Grille de widgets
  - `ResizableWidget.tsx` : Widget redimensionnable
  - `widgets/` : Widgets spécifiques
    - `CalendarWidget.tsx` : Widget calendrier
    - `ChartWidget.tsx` : Widget graphique
    - `ListWidget.tsx` : Widget liste
    - `StatWidget.tsx` : Widget statistique

### Modules organisés
- `src/modules/` : Modules fonctionnels
  - `calendar/` : Gestion du calendrier
    - `components/` : Composants du calendrier
    - `hooks/` : Hooks spécifiques au calendrier
    - `services/` : Services liés au calendrier
    - `store/` : État global du calendrier
    - `types/` : Types et interfaces du calendrier
  - `leaves/` : Gestion des congés
    - `components/` : Composants de congés
      - `LeaveCard.tsx` : Carte affichant un résumé de congé.
      - `LeaveForm.tsx` : Formulaire générique pour éditer les détails d'un congé.
      - `LeavesList.tsx` : Tableau affichant la liste des congés, avec tri et filtres locaux.
        ```typescript
        // Props simplifiées après refactoring
        interface LeavesListProps {
          leaves: LeaveWithUser[]; // Liste brute des congés
          isLoading: boolean;
          error: string | null;
          onEditLeaveClick: (leave: LeaveWithUser) => void;
          onCancelLeaveClick: (leave: LeaveWithUser) => void;
        }
        ```
      - `LeaveRequestForm.tsx` : Formulaire spécifique pour la création/modification d'une *demande* de congé (utilise `useLeave`, `useConflictDetection`).
      - `LeaveConflictAlert.tsx` : Composant qui affiche les alertes pour les conflits de congés détectés avec styles appropriés selon la sévérité.
        ```typescript
        // Props
        interface LeaveConflictAlertProps {
          conflicts: LeaveConflict[];
          onResolve?: (conflictId: string) => void;
          onIgnore?: (conflictId: string) => void;
          showDetails?: boolean;
          showActions?: boolean;
          className?: string;
        }
        ```
      - `LeaveConflictDashboard.tsx` : Tableau de bord d'analyse des conflits de congés avec graphiques et statistiques.
        ```typescript
        // Props
        interface LeaveConflictDashboardProps {
          className?: string;
        }
        ```
    - `hooks/` : Hooks spécifiques aux congés
      - `useLeave.ts` : Hook principal pour gérer l'état et les actions sur un congé individuel ou une liste.
        ```typescript
        // Signature du hook après améliorations
        function useLeave({ 
          leaveId, 
          userId 
        }: UseLeaveProps): {
          leave: Leave | null;
          leaves: Leave[];
          loading: boolean;
          error: ErrorDetails | null;
          createLeave: (leaveData: LeaveCreateData) => Promise<Leave>;
          updateLeave: (leaveData: LeaveUpdateData) => Promise<Leave>;
          deleteLeave: (id: string) => Promise<void>;
          approveLeave: (id: string) => Promise<Leave>;
          rejectLeave: (id: string, reason?: string) => Promise<Leave>;
          cancelLeave: (id: string) => Promise<Leave>;
          getLeaveById: (id: string) => Promise<Leave>;
          getUserLeaves: (userId: string) => Promise<Leave[]>;
          getAllLeaves: () => Promise<Leave[]>;
        }
        ```
      - `useConflictDetection.ts` : Hook pour la détection des conflits dans les demandes de congés.
        ```typescript
        // Interface du hook
        export interface UseConflictDetectionReturn {
          conflicts: LeaveConflict[];
          hasBlockingConflicts: boolean;
          loading: boolean;
          error: Error | null;
          checkConflicts: (startDate: Date, endDate: Date, leaveId?: string) => Promise<ConflictCheckResult>;
          getConflictsByType: (type: ConflictType) => LeaveConflict[];
          getBlockingConflicts: () => LeaveConflict[];
          getWarningConflicts: () => LeaveConflict[];
          getInfoConflicts: () => LeaveConflict[];
          resolveConflict: (conflictId: string) => void;
          resetConflicts: () => void;
          validateDates: (startDate: Date | null, endDate: Date | null) => boolean;
        }
        ```
      - `useLeaveConflictNotification.ts` : Hook qui s'intègre avec useConflictDetection pour la gestion des notifications de conflits.
        ```typescript
        // Interface du hook
        export interface UseLeaveConflictNotificationReturn {
          // Méthodes de notification
          notifyConflict: (conflict: LeaveConflict, displayType?: NotificationDisplayType) => void;
          notifyConflicts: (conflicts: LeaveConflict[], displayType?: NotificationDisplayType) => void;
          notifyCurrentConflicts: (displayType?: NotificationDisplayType) => void;
          
          // Méthodes pour afficher des alertes spécifiques
          showBlockingAlert: (conflicts?: LeaveConflict[]) => JSX.Element | null;
          showWarningAlert: (conflicts?: LeaveConflict[]) => JSX.Element | null;
          showInfoAlert: (conflicts?: LeaveConflict[]) => JSX.Element | null;
          
          // Formatage des messages
          formatConflictMessage: (conflict: LeaveConflict) => string;
          formatConflictTitle: (conflict: LeaveConflict) => string;
          
          // État des notifications
          notificationsSent: boolean;
          resetNotifications: () => void;
          
          // Accès au hook de détection de conflits
          conflictDetection: UseConflictDetectionReturn;
        }
        ```
      - `useLeaveConflictAnalytics.ts` : Hook pour l'analyse statistique des conflits de congés.
        ```typescript
        // Interface du hook
        export interface UseLeaveConflictAnalyticsReturn {
          // Données et états
          report: ConflictAnalyticsReport | null;
          conflicts: LeaveConflict[];
          leaves: Leave[];
          users: User[];
          departments: Department[];
          loading: boolean;
          error: Error | null;
          
          // Filtrage et chargement
          filter: AnalyticsFilter;
          setFilter: (filter: AnalyticsFilter) => void;
          loadData: () => Promise<void>;
          refreshReport: () => void;
          
          // Analyse
          getConflictRatio: (departmentId?: string) => number;
          getConflictTrendForPeriod: (startDate: Date, endDate: Date) => any[];
          getTopConflictTypes: (limit?: number) => Array<{type: ConflictType, count: number}>;
          getMostCriticalPeriod: () => string | null;
          
          // Export
          exportReportAsCSV: () => string;
        }
        ```
    - `services/` : Services liés aux congés
      - `leaveService.ts` : Service principal pour les opérations CRUD sur les congés.
      - `conflictDetectionService.ts` : Service pour la détection des conflits dans les demandes de congés.
      - `leaveConflictNotificationService.ts` : Service qui gère les notifications pour les conflits de congés.
        ```typescript
        // Méthodes principales
        export class LeaveConflictNotificationService {
          // Génère une notification formatée pour un conflit
          public generateNotificationTemplate(conflict: LeaveConflict, locale?: string): NotificationTemplate;
          
          // Envoie une notification par email pour un conflit
          public async sendEmailNotification(conflict: LeaveConflict, userIds: string[], locale?: string): Promise<boolean>;
          
          // Envoie une notification dans l'interface pour un conflit
          public async sendUINotification(conflict: LeaveConflict, userIds: string[], locale?: string): Promise<boolean>;
          
          // Notifie tous les utilisateurs concernés par un conflit (UI et email)
          public async notifyConflict(conflict: LeaveConflict, additionalUserIds?: string[], locale?: string): Promise<boolean>;
          
          // Notifie les utilisateurs concernés par un ensemble de conflits
          public async notifyConflicts(conflicts: LeaveConflict[], additionalUserIds?: string[], locale?: string): Promise<boolean>;
        }
        ```
      - `leaveConflictAnalyticsService.ts` : Service d'analyse des conflits de congés.
        ```typescript
        // Méthodes principales
        export class LeaveConflictAnalyticsService {
          // Génère un rapport d'analyse complet des conflits
          public generateAnalyticsReport(
              conflicts: LeaveConflict[],
              leaves: Leave[],
              users: User[],
              departments: Department[],
              filter?: AnalyticsFilter
          ): ConflictAnalyticsReport;
          
          // Génère un rapport spécifique pour un département
          public generateDepartmentReport(
              conflicts: LeaveConflict[],
              leaves: Leave[],
              users: User[],
              departments: Department[],
              departmentId: string
          ): ConflictAnalyticsReport;
          
          // Génère un rapport pour une période spécifique
          public generatePeriodReport(
              conflicts: LeaveConflict[],
              leaves: Leave[],
              users: User[],
              departments: Department[],
              startDate: Date,
              endDate: Date
          ): ConflictAnalyticsReport;
          
          // Exporte les données au format CSV
          public exportReportAsCSV(report: ConflictAnalyticsReport): string;
        }
        ```
    - `store/` : État global des congés
    - `types/` : Types et interfaces des congés
      - `leave.ts`
      - `conflict.ts`
      - `request.ts`
  - `planning/` : Gestion du planning
    - `components/` : Composants de planning
    - `services/` : Services liés au planning
  - `rules/` : Moteur de règles
    - `components/` : Composants de règles
    - `engine/` : Logique du moteur de règles
    - `hooks/` : Hooks spécifiques aux règles
    - `services/` : Services liés aux règles
    - `types/` : Types et interfaces des règles
  - `profiles/` : Gestion des profils
  - `roles/` : Gestion des rôles
  - `profiler/` : Profilage des performances

### Services
- `src/services/` : Logique métier
  - `trameAffectationService.ts` : Gestion des trames
    ```typescript
    // Méthodes principales
    - create(trame: Omit<TrameAffectationAttributes, 'id' | 'createdAt' | 'updatedAt'>)
    - findAll()
    - findById(id: string)
    - update(id: string, trame: Partial<TrameAffectationAttributes>)
    - delete(id: string)
    - findByUserId(userId: number)
    ```
  - `planningService.ts` : Génération de planning
  - `userService.ts` : Gestion des utilisateurs
  - `absenceService.ts` : Gestion des absences
  - `notificationService.ts` : Gestion des notifications
  - `planningGenerator.ts` : Générateur de planning
  - `planningOptimizer.ts` : Optimisation de planning
  - `planningSimulator.ts` : Simulation de planning
  - `errorAlertService.ts` : Alertes d'erreur
  - `errorLoggingService.ts` : Logging d'erreurs
  - `loggerService.ts` : Logger
  - `preferencesService.ts` : Gestion des préférences
  - `reportService.ts` : Génération de rapports
  - `syncService.ts` : Synchronisation

### Modèles
- `src/models/` : Modèles de données
  - `TrameAffectation.ts` : Modèle des trames
    ```typescript
    // Types
    type PeriodeType = 'HEBDOMADAIRE' | 'BI_HEBDOMADAIRE' | 'MENSUEL';
    
    interface TrameAffectationAttributes {
      id: string;
      userId: number;
      periodeType: PeriodeType;
      dateDebut: Date;
      dateFin: Date;
      motif: string;
      isRecurrent: boolean;
      createdAt?: Date;
      updatedAt?: Date;
    }
    ```
  - `User.ts` : Modèle utilisateur
    ```typescript
    // Types
    type UserRole = 'ADMIN' | 'MANAGER' | 'USER';
    
    interface UserAttributes {
      id: number;
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      isActive: boolean;
      createdAt?: Date;
      updatedAt?: Date;
    }
    ```

### Types
- `src/types/` : Types globaux
  - `user.ts` : Types d'utilisateur
    ```typescript
    export enum UserRole {
      ADMIN = 'ADMIN',
      DOCTOR = 'DOCTOR',
      NURSE = 'NURSE',
      ASSISTANT = 'ASSISTANT'
    }
    ```
  - `assignment.ts` : Types d'affectation
    ```typescript
    export enum AssignmentType {
      GARDE = 'GARDE',
      ASTREINTE = 'ASTREINTE',
      CONSULTATION = 'CONSULTATION',
      BLOC = 'BLOC'
    }
    ```
  - `absence.ts` : Types d'absence
  - `leave.ts` : Types de congé
  - `rules.ts` : Types de règles
  - `validation.ts` : Types de validation
  - `preference.ts` : Types de préférence
  - `shift.ts` : Types de shift
  - `duty.ts` : Types de garde
  - `team-configuration.ts` : Types de configuration d'équipe

### Pages
- `src/app/` : Pages de l'application
  - `admin/` : Pages d'administration
    - `trames/page.tsx` : Administration des trames
    - `leaves/page.tsx` : Administration des congés
    - `requetes/page.tsx` : Administration des requêtes
    - `team-configurations/` : Administration des configurations d'équipe
  - `planning/` : Pages de planning
    - `page.tsx` : Visualisation du planning
    - `hebdomadaire/page.tsx` : Planning hebdomadaire
    - `generator/page.tsx` : Générateur de planning
  - `calendar/page.tsx` : Calendrier
  - `leaves/` : Pages de congés
  - `parametres/` : Pages de paramètres
  - `documentation/page.tsx` : Documentation
  - `profil/page.tsx` : Profil utilisateur
  - `utilisateurs/page.tsx` : Gestion des utilisateurs
  - `statistiques/page.tsx` : Statistiques

### API
- `src/app/api/` : Routes API
  - `admin/` : API d'administration
  - `auth/` : API d'authentification
  - `leaves/` : API de congés
  - `notifications/` : API de notifications
  - `planning/` : API de planning
  - `utilisateurs/` : API d'utilisateurs

## Fonctionnalités Implémentées

### Système de Trames d'Affectation
- Création de trames récurrentes
- Gestion des périodes (hebdo, bi-hebdo, mensuel)
- Validation des conflits
- Intégration avec le planning

### Gestion des Utilisateurs
- Authentification JWT
- Gestion des rôles (ADMIN, MANAGER, USER)
- Profils utilisateurs

### Génération de Planning
- Application des trames
- Détection des conflits
- Filtrage par utilisateur/date
- Optimisation du planning
- Simulation de planning
- Validation des règles métier

### Gestion des Congés
- Demande de congés
- Validation des congés
- Calcul automatique des jours
- Gestion des soldes

### Tableau de Bord
- Widgets personnalisables
- Statistiques
- Visualisation des données

### Documentation
- Guide utilisateur
- Documentation technique
- Interface de consultation

### Gestion des Règles
- Moteur de règles métier
- Validation des contraintes
- Résolution de conflits

## Types Principaux

### User
```typescript
interface User {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  role: UserRole;
  specialties: string[];
  experienceLevel: ExperienceLevel;
  leaves?: Leave[];
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}
```

### Assignment
```typescript
interface Assignment {
  id: string;
  userId: string;
  shiftType: ShiftType;
  startDate: Date;
  endDate: Date;
  status: AssignmentStatus;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  validatedBy?: string;
  validatedAt?: Date;
}
```

### Leave
```typescript
interface Leave {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  type: LeaveType;
  status: LeaveStatus;
  countedDays: number;
  reason?: string;
  comment?: string;
  requestDate: Date;
  approvalDate?: Date;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Rule
```typescript
interface Rule {
  id: string;
  name: string;
  description: string;
  type: string;
  parameters: any;
  severity: RuleSeverity;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Conventions de Code

### Nommage
- Composants : PascalCase
- Fichiers : kebab-case
- Variables : camelCase
- Types/Interfaces : PascalCase

### Structure des Composants
```typescript
interface Props {
  // Props du composant
}

export const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  // Logique du composant
  return (
    // JSX
  );
};
```

### Gestion des Erreurs
- Utilisation de try/catch
- Messages d'erreur explicites
- Logging des erreurs

## Dépendances Principales
- React
- Next.js
- Sequelize
- date-fns
- react-markdown
- Prisma (ORM)
- @radix-ui/react-*

## Points d'Attention
- Vérifier les conflits avant d'implémenter de nouvelles fonctionnalités
- Réutiliser les composants UI existants
- Suivre les conventions de code établies
- Maintenir la documentation à jour
- Utiliser les modules existants plutôt que de créer des fonctionnalités dupliquées

## TODO
- [ ] Implémenter la gestion des exceptions
- [ ] Ajouter des tests unitaires
- [ ] Optimiser les performances
- [ ] Améliorer la gestion des erreurs 

### Générateur de Planning

Le système de génération de planning est centré autour de la classe `PlanningGenerator` qui utilise plusieurs types clés pour orchestrer la création des plannings d'anesthésie :

- `src/services/planningGenerator.ts` : Le service principal de génération de planning
  ```typescript
  // Structure principale
  export class PlanningGenerator {
    // Propriétés privées
    private parameters: GenerationParameters;
    private personnel: User[];
    private rulesConfig: RulesConfiguration;
    private fatigueConfig: FatigueConfig;
    private existingAssignments: Assignment[];
    private userCounters: Map<string, UserCounter>;
    private results: {
      gardes: Assignment[];
      astreintes: Assignment[];
      consultations: Assignment[];
      blocs: Assignment[];
    };

    // Méthodes clés
    async initialize(personnel: User[], existingAssignments: Assignment[]): Promise<void>
    private initializeUserCounters(): void
    private loadExistingAssignmentsIntoCounters(): void
    private updateCounterForAssignment(counter: UserCounter, assignment: Assignment): void
    private findEligibleUsersForGarde(date: Date): User[]
    private selectBestCandidateForGarde(eligibleUsers: User[], date: Date): User
    async generateFullPlanning(): Promise<ValidationResult>
    validatePlanning(): ValidationResult
  }
  ```

#### Types clés pour le planning

L'application utilise l'énumération `ShiftType` centralisée dans `src/types/common.ts` pour définir tous les types de gardes médicales de manière cohérente :

```typescript
export enum ShiftType {
    // Consultations/Vacations (demi-journées)
    MATIN = 'MATIN',                    // Vacation 8h-13h (remplace MORNING)
    APRES_MIDI = 'APRES_MIDI',          // Vacation 13h30-18h30 (remplace AFTERNOON)

    // Gardes (journées complètes)
    JOUR = 'JOUR',                      // Garde de jour (période standard)
    NUIT = 'NUIT',                      // Garde de nuit (remplace NIGHT)
    GARDE_24H = 'GARDE_24H',            // Garde 8h-8h+1 (24h continues)
    GARDE_WEEKEND = 'GARDE_WEEKEND',    // Garde spécifique au weekend

    // Astreintes
    ASTREINTE = 'ASTREINTE',            // Astreinte générique (remplace ON_CALL)
    ASTREINTE_SEMAINE = 'ASTREINTE_SEMAINE', // Astreinte en semaine
    ASTREINTE_WEEKEND = 'ASTREINTE_WEEKEND', // Astreinte le weekend

    // Spécifiques
    URGENCE = 'URGENCE',                // Garde d'urgence
    CONSULTATION = 'CONSULTATION',      // Consultation spéciale
}
```

Cette énumération remplace les définitions précédemment dupliquées dans:
- `src/types/assignment.ts`
- `src/types/shift.ts`

La centralisation de l'énumération permet d'éviter les incohérences et de maintenir une définition unique à l'échelle du projet, facilitant ainsi la maintenance et les évolutions futures.

### Hooks Fonctionnels

L'application utilise des hooks personnalisés pour encapsuler des logiques complexes et réutilisables.

#### Validation des Dates

Le système centralisé de validation des dates est implémenté via le hook `useDateValidation` :

```typescript
// src/hooks/useDateValidation.ts
export function useDateValidation(options?: DateValidationOptions) {
  const {
    // Fonctions de validation principales
    validateDate,
    validateDateRange,
    
    // État des validations
    dateErrors,
    rangeErrors,
    
    // Utilitaires
    formatDate,
    parseDateString,
    
    // Gestion d'état
    clearErrors
  } = useDateValidationState(options);
  
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

Ce hook est utilisé dans divers composants pour:
- Valider les dates individuelles et les périodes
- Garantir une validation cohérente (format, plage autorisée, jours ouvrables, etc.)
- Centraliser la logique de validation et d'affichage des erreurs

#### Gestion des Conflits

Le hook `useConflictDetection` est intégré avec le système de validation de dates pour assurer que les validations de dates sont effectuées avant les vérifications de conflits :

```typescript
// src/modules/conges/hooks/useConflictDetection.ts
export function useConflictDetection({ userId }: UseConflictDetectionProps) {
  // ...
  
  const checkConflicts = async (startDate: Date, endDate: Date, existingLeaveId?: string) => {
    // Valider d'abord les dates avant de vérifier les conflits
    const datesAreValid = validateDates(startDate, endDate);
    
    if (!datesAreValid) {
      return { conflicts: [], hasBlockingConflicts: false };
    }
    
    // Procéder à la vérification des conflits uniquement si les dates sont valides
    try {
      const result = await checkLeaveConflicts(userId, startDate, endDate, existingLeaveId);
      // ...
    } catch (error) {
      // ...
    }
  };
  
  // ...
}
```

Cette intégration garantit un flux de validation robuste et permet d'éviter des vérifications inutiles lorsque les données de base ne sont pas valides.

### Interfaces Principales

##### Service de détection de conflits
Le service `conflictDetectionService.ts` est responsable de l'identification et de la gestion des conflits potentiels dans les demandes de congés :

- **Détection multi-critères** : Analyse les demandes selon différentes règles (minimum d'effectif, compétences critiques, etc.)
- **Sévérité configurable** : Catégorisation des conflits en niveaux d'importance (information, avertissement, bloquant)
- **Règles paramétrables** : Configuration flexible permettant d'adapter les règles aux besoins de l'organisation
- **Intégration contextuelle** : Utilisation des données d'équipe et d'utilisateur pour des vérifications complètes
- **Gestion des règles** : Sauvegarde et chargement des configurations de règles depuis le service de configuration

Les principaux types de conflits détectés incluent :
- Chevauchements avec des congés existants
- Taux d'absence trop élevé dans l'équipe
- Absence de remplaçant pour un rôle critique
- Proximité de deadlines importantes
- Ponts autour des jours fériés
- Conflits avec les réunions récurrentes importantes
- Périodes de charge de travail élevée

```typescript
// Exemple d'utilisation
const conflictService = new ConflictDetectionService(
  userService,
  teamService,
  configService,
  initialRules
);

// Configuration dynamique des règles
conflictService.setRules({
  maxTeamAbsencePercentage: 30,
  minDaysBeforeDeadline: 5,
  criticalRolesRequireBackup: true
});

// Vérification des conflits
const result = await conflictService.checkConflicts(leaveRequest);

if (result.hasBlockers) {
  // Traitement des conflits bloquants
} else if (result.hasConflicts) {
  // Présentation des avertissements
} else {
  // Validation automatique possible
}
```

Le service est complété par le hook `useConflictDetection` qui intègre la validation de dates avec le hook `useDateValidation` pour un système complet de vérification des demandes de congés.

Voir `src/modules/conges/types/conflict.ts` pour les définitions des types associés et `src/modules/conges/services/conflictDetectionService.ts` pour l'implémentation complète.

// ... existing code ... 