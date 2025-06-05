/**
 * Types liés aux règles du système
 */

/**
 * Types de règles supportés par le système
 */
export enum RuleType {
    // Règles liées aux gardes
    MIN_REST_PERIOD = 'MIN_REST_PERIOD',               // Période de repos minimum après garde
    MAX_SHIFTS_PER_WEEK = 'MAX_SHIFTS_PER_WEEK',       // Maximum de gardes par semaine/mois

    // Règles liées aux congés
    MIN_ADVANCE_NOTICE = 'MIN_ADVANCE_NOTICE',         // Préavis minimum pour congés
    SEASON_QUOTA = 'SEASON_QUOTA',                     // Quota de congés par saison

    // Règles liées aux qualifications
    SHIFT_QUALIFICATION = 'SHIFT_QUALIFICATION',       // Qualifications requises pour une garde

    // Règles liées au planning
    PLANNING = 'PLANNING',                             // Règles spécifiques de planning

    // Autres types
    DUTY = 'DUTY',                                     // Règles de service de garde
    CONSULTATION = 'CONSULTATION',                     // Règles de consultation
    SUPERVISION = 'SUPERVISION',                       // Règles de supervision
    LOCATION = 'LOCATION',                             // Règles de localisation
    TEAM_CAPACITY = 'TEAM_CAPACITY',
    SPECIALTY_CAPACITY = 'SPECIALTY_CAPACITY',
    LEAVE_RESTRICTION = 'LEAVE_RESTRICTION',
    DUTY_REST = 'DUTY_REST',
    SCHEDULE_CONSTRAINT = 'SCHEDULE_CONSTRAINT'
}

/**
 * Portée des règles
 */
export enum RuleScope {
    GLOBAL = 'GLOBAL',        // Règle applicable à tous
    DEPARTMENT = 'DEPARTMENT', // Règle spécifique à un département
    SERVICE = 'SERVICE',      // Règle spécifique à un service
    DOCTOR = 'DOCTOR'         // Règle spécifique à un médecin
}

/**
 * Gravité des règles
 */
export enum RuleSeverity {
    INFO = 'INFO',           // Information, peut être ignorée
    WARNING = 'WARNING',     // Avertissement, peut être contourné avec justification
    ERROR = 'ERROR',          // Erreur, ne peut pas être contournée
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH'
}

/**
 * Structure de base d'une règle
 */
export interface Rule {
    id: string;                // Identifiant unique de la règle
    name: string;              // Nom de la règle
    description?: string;      // Description de la règle
    type: RuleType;            // Type de la règle
    severity: RuleSeverity;    // Gravité de la règle
    scope: RuleScope;          // Portée de la règle
    scopeValue?: string | string[];  // Valeur de la portée (ex: ID de département, service, etc.)
    enabled: boolean;          // Si la règle est active
    parameters: unknown;           // Paramètres spécifiques à la règle
    priority: number;          // Priorité de la règle (plus le nombre est élevé, plus la priorité est haute)
    configuration: unknown;         // Configuration spécifique à la règle
    isDefault?: boolean;       // Si la règle est la valeur par défaut
    createdAt: Date;           // Date de création (Date)
    updatedAt: Date;           // Date de dernière mise à jour (Date)
}

/**
 * Représentation d'une garde
 */
export interface Shift {
    id: string;                // Identifiant unique
    doctorId: string;          // ID du médecin assigné
    service: string;           // Service concerné
    type: string;              // Type de garde (jour, nuit, astreinte, etc.)
    startTime: string;         // Début de la garde (ISO string)
    endTime: string;           // Fin de la garde (ISO string)
}

/**
 * Représentation d'un congé
 */
export interface Leave {
    id: string;                // Identifiant unique
    doctorId: string;          // ID du médecin
    type: string;              // Type de congé (annuel, maladie, formation, etc.)
    startDate: string;         // Date de début (ISO string)
    endDate: string;           // Date de fin (ISO string)
    status: string;            // Statut (demandé, approuvé, refusé)
}

/**
 * Représentation d'un médecin (simplifié)
 */
export interface Doctor {
    id: string;                // Identifiant unique
    firstName: string;         // Prénom
    lastName: string;          // Nom
    department: string;        // Département
    speciality: string;        // Spécialité
    qualifications: string[];  // Qualifications particulières
}

/**
 * Contexte d'évaluation d'une règle
 */
export interface RuleEvaluationContext {
    // Contexte lié aux gardes
    proposedShift?: Shift;     // Garde proposée à évaluer
    previousShift?: Shift;     // Garde précédente
    existingShifts?: Shift[];  // Gardes existantes pour le médecin

    // Contexte lié aux congés
    proposedLeave?: Leave;     // Congé proposé à évaluer
    existingLeaves?: Leave[];  // Congés existants pour le médecin

    // Contexte général
    doctor?: Doctor;           // Médecin concerné
    currentDate?: string;      // Date courante (ISO string)

    // Données supplémentaires si nécessaire
    [key: string]: unknown;
}

/**
 * Résultat d'évaluation d'une règle
 */
export interface RuleEvaluationResult {
    ruleId: string;            // ID de la règle évaluée
    passed: boolean;           // Si la règle est respectée
    severity: RuleSeverity;    // Gravité de la règle
    message: string;           // Message explicatif
    details: any | null;       // Détails supplémentaires
}

/**
 * Interface pour les règles de planification
 */
export interface PlanningRule extends Rule {
    type: RuleType.PLANNING;
    planningConfig: {
        planningType: string;      // Type de planning (HEBDOMADAIRE, MENSUEL, JOURNALIER, etc.)
        maxLimit?: number;         // Limite maximale d'gardes/vacations
        periodType?: string;       // Type de période pour la limite maximale (DAY, WEEK, MONTH, etc.)
        minLimit?: number;         // Limite minimale d'gardes/vacations
        minPeriodType?: string;    // Type de période pour la limite minimale
        applyToAllUsers?: boolean; // Si la règle s'applique à tous les utilisateurs
        exceptions?: string;       // Exceptions (utilisateurs ou groupes)
        strictEnforcement?: boolean; // Si la règle doit être strictement appliquée
    };
}

/**
 * Interface pour les règles de service de garde
 */
export interface DutyRule extends Rule {
    type: RuleType.DUTY;
    dutyConfig: {
        minPersonnel: number;
        maxConsecutiveDays: number;
        minRestPeriodAfterDuty: number;
        dutyPeriods: {
            dayOfWeek: number;
            startTime: string;
            endTime: string;
        }[];
        specificRoles: string[];
        rotationStrategy: 'SEQUENTIAL' | 'BALANCED' | 'CUSTOM';
    };
}

/**
 * Interface pour les règles de consultation
 */
export interface ConsultationRule extends Rule {
    type: RuleType.CONSULTATION;
    consultationConfig: {
        // Configuration spécifique aux consultations
    };
}

/**
 * Interface pour les règles de supervision
 */
export interface SupervisionRule extends Rule {
    type: RuleType.SUPERVISION;
    supervisionConfig: {
        // Configuration spécifique à la supervision
    };
}

/**
 * Interface pour les règles de localisation
 */
export interface LocationRule extends Rule {
    type: RuleType.LOCATION;
    locationConfig: {
        // Configuration spécifique à la localisation
    };
}

/**
 * Type union pour toutes les règles
 */
export type AnyRule =
    | PlanningRule
    | DutyRule
    | ConsultationRule
    | SupervisionRule
    | LocationRule; 