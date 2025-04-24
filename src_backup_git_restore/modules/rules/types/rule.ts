/**
 * Types de règles pour la gestion du planning
 */
export enum RuleType {
    LEAVE = 'leave',
    DUTY = 'duty',
    SUPERVISION = 'supervision',
    ASSIGNMENT = 'assignment',
    ON_CALL = 'onCall'
}

/**
 * Priorité des règles
 */
export enum RulePriority {
    LOW = 'LOW',           // Priorité basse (peut être ignorée dans certains cas)
    MEDIUM = 'MEDIUM',     // Priorité moyenne
    HIGH = 'HIGH',         // Priorité haute
    CRITICAL = 'CRITICAL'  // Règle critique (ne peut jamais être ignorée)
}

/**
 * Interface de base pour toutes les règles
 */
export interface Rule {
    id: string;
    name: string;
    description: string;
    type: RuleType;
    priority: RulePriority;
    isActive: boolean;

    // Période de validité
    validFrom: Date;
    validTo?: Date;

    // Métadonnées
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy?: string;
}

/**
 * Interface pour les règles de garde
 */
export interface DutyRule extends Rule {
    // Type spécifique pour assurer que c'est une règle de garde
    type: RuleType.DUTY;

    // Configuration spécifique aux gardes
    dutyConfig: {
        minPersonnel: number;                     // Nombre minimum de personnes requises
        maxConsecutiveDays: number;               // Maximum de jours consécutifs de garde
        minRestPeriodAfterDuty: number;           // Période minimale de repos après une garde (heures)
        specificRoles?: string[];                 // Rôles spécifiques requis
        dutyPeriods: {                           // Périodes de garde
            dayOfWeek: number;                    // Jour de la semaine (0-6, 0 = dimanche)
            startTime: string;                    // Heure de début (format HH:MM)
            endTime: string;                      // Heure de fin (format HH:MM)
        }[];
        rotationStrategy?: 'SEQUENTIAL' | 'BALANCED' | 'CUSTOM'; // Stratégie de rotation
        customRotationConfig?: any;              // Configuration personnalisée si stratégie = CUSTOM
    };
}

/**
 * Interface pour les règles de consultation
 */
export interface ConsultationRule extends Rule {
    // Type spécifique pour assurer que c'est une règle de consultation
    type: RuleType.CONSULTATION;

    // Configuration spécifique aux consultations
    consultationConfig: {
        locations: string[];                       // Lieux de consultation
        specialties: string[];                     // Spécialités concernées
        durationMinutes: number;                   // Durée standard d'une consultation
        maxPatientsPerDay: number;                 // Nombre maximum de patients par jour
        availablePeriods: {                       // Créneaux disponibles
            dayOfWeek: number;                    // Jour de la semaine (0-6, 0 = dimanche)
            startTime: string;                    // Heure de début (format HH:MM)
            endTime: string;                      // Heure de fin (format HH:MM)
        }[];
        customPatientLimits?: {                   // Limites personnalisées par spécialité
            specialtyId: string;
            maxPatientsPerDay: number;
        }[];
    };
}

/**
 * Interface pour les règles de rédaction du planning
 */
export interface PlanningRule extends Rule {
    // Type spécifique pour assurer que c'est une règle de planning
    type: RuleType.PLANNING;

    // Configuration spécifique à la rédaction du planning
    planningConfig: {
        planningCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY'; // Cycle de planification
        advanceNoticeDays: number;                     // Jours de préavis avant publication
        freezePeriodDays: number;                      // Période de gel (jours) avant la date effective
        minPersonnelPerShift: number;                  // Personnel minimum par shift
        personnelDistributionRules: {                 // Règles de distribution du personnel
            specialtyId?: string;                      // Spécialité concernée (optionnel)
            teamId?: string;                           // Équipe concernée (optionnel)
            minCount: number;                          // Nombre minimum requis
            maxCount?: number;                         // Nombre maximum autorisé (optionnel)
            requiredRoles?: string[];                  // Rôles requis
        }[];
        autoRebalance: boolean;                        // Rééquilibrer automatiquement le planning
    };
}

/**
 * Interface pour les règles de supervision
 */
export interface SupervisionRule extends Rule {
    // Type spécifique pour assurer que c'est une règle de supervision
    type: RuleType.SUPERVISION;

    // Configuration spécifique à la supervision
    supervisionConfig: {
        supervisorRoles: string[];                      // Rôles pouvant superviser
        superviseeRoles: string[];                      // Rôles pouvant être supervisés
        maxSuperviseesPerSupervisor: number;            // Nombre maximum de supervisés par superviseur
        minExperienceYearsToSupervise: number;          // Années d'expérience minimales pour superviser
        supervisionPeriods?: {                         // Périodes de supervision spécifiques
            dayOfWeek: number;                         // Jour de la semaine
            startTime: string;                         // Heure de début
            endTime: string;                           // Heure de fin
        }[];
        specialtyRestrictions?: string[];               // Restrictions par spécialité
        locationRestrictions?: string[];                // Restrictions par lieu
    };
}

/**
 * Interface pour les règles de localisation et architecture
 */
export interface LocationRule extends Rule {
    // Type spécifique pour assurer que c'est une règle de localisation
    type: RuleType.LOCATION;

    // Configuration spécifique à l'architecture géographique
    locationConfig: {
        location: {
            id: string;                                 // Identifiant du lieu
            name: string;                               // Nom du lieu
            type: 'OPERATING_ROOM' | 'WARD' | 'ICU' | 'CONSULTATION_ROOM' | 'OTHER'; // Type de lieu
            capacity: number;                           // Capacité du lieu
            specialtyRestrictions?: string[];           // Restrictions par spécialité
            equipmentRequirements?: string[];           // Équipements requis
        };
        constraints: {
            minStaffing: {                              // Staffing minimum
                doctors: number;                        // Nombre de médecins
                nurses: number;                         // Nombre d'infirmières
                technicians?: number;                   // Nombre de techniciens
                otherStaff?: number;                    // Autre personnel
            };
            operatingHours: {                           // Heures d'opération
                dayOfWeek: number;                      // Jour de la semaine
                startTime: string;                      // Heure d'ouverture
                endTime: string;                        // Heure de fermeture
            }[];
            adjacentLocations?: string[];               // Emplacements adjacents (IDs)
            travelTimeToLocations?: {                   // Temps de déplacement vers d'autres lieux
                locationId: string;                     // ID du lieu de destination
                timeMinutes: number;                    // Temps en minutes
            }[];
        };
    };
}

/**
 * Type union pour toutes les règles
 */
export type AnyRule = DutyRule | ConsultationRule | PlanningRule | SupervisionRule | LocationRule;

/**
 * Résultat d'évaluation d'une règle
 */
export interface RuleEvaluationResult {
    ruleId: string;
    ruleName: string;
    type: RuleType;
    priority: RulePriority;
    isValid: boolean;
    violationDetails?: string;
    conflictingRules?: string[];
    suggestedAction?: string;
}

/**
 * Configuration globale des règles
 */
export interface RulesConfig {
    enforcementLevel: 'STRICT' | 'FLEXIBLE' | 'ADVISORY';
    automaticResolutionEnabled: boolean;
    notifyOnConflict: boolean;
    logRuleEvaluations: boolean;
    priorityOverrides?: {
        ruleId: string;
        newPriority: RulePriority;
    }[];
}

export enum RuleSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}

export enum RotationStrategy {
    ROUND_ROBIN = 'roundRobin',
    LEAST_RECENTLY_ASSIGNED = 'leastRecentlyAssigned',
    BALANCED_LOAD = 'balancedLoad'
}

export interface BaseRule {
    id: string;
    name: string;
    description: string;
    type: RuleType;
    priority: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}

export interface LeaveRule extends BaseRule {
    type: RuleType.LEAVE;
    configuration: {
        maxConcurrentLeaves: number;
        maxLeaveDuration: number;
        minNoticePeriod: number;
        restrictedPeriods: {
            startDate: Date;
            endDate: Date;
            reason: string;
        }[];
        allowedLeaveTypes: string[];
        roleRestrictions: string[];
        specialtyRestrictions: string[];
        locationRestrictions: string[];
    };
}

export interface DutyRule extends BaseRule {
    type: RuleType.DUTY;
    configuration: {
        minPersonnel: number;
        maxConsecutiveDays: number;
        restPeriodHours: number;
        rotationStrategy: RotationStrategy;
        specificRoles: string[];
        dutyPeriods: {
            dayOfWeek: number; // 0-6, dimanche à samedi
            startTime: string; // format "HH:MM"
            endTime: string; // format "HH:MM"
            minPersonnel: number;
            specificRoles?: string[];
        }[];
    };
}

export interface SupervisionRule extends BaseRule {
    type: RuleType.SUPERVISION;
    configuration: {
        supervisorRoles: string[];
        superviseeRoles: string[];
        maxSuperviseesPerSupervisor: number;
        minExperienceYearsToSupervise: number;
        specialtyRestrictions: string[];
        locationRestrictions: string[];
        supervisionPeriods: {
            dayOfWeek: number; // 0-6, dimanche à samedi
            startTime: string; // format "HH:MM"
            endTime: string; // format "HH:MM"
        }[];
    };
}

export interface AssignmentRule extends BaseRule {
    type: RuleType.ASSIGNMENT;
    configuration: {
        minTimeBetweenAssignments: number; // en heures
        maxAssignmentsPerDay: number;
        maxAssignmentsPerWeek: number;
        preferredRoles: string[];
        restrictedRoles: string[];
        balancingStrategy: RotationStrategy;
        specialAssignmentRules: {
            role: string;
            maxAssignmentsPerWeek: number;
            minRestPeriod: number; // en heures
        }[];
    };
}

export interface OnCallRule extends BaseRule {
    type: RuleType.ON_CALL;
    configuration: {
        minPersonnelOnCall: number;
        maxConsecutiveOnCallDays: number;
        minRestAfterOnCall: number; // en heures
        rotationStrategy: RotationStrategy;
        onCallRoles: string[];
        onCallPeriods: {
            dayOfWeek: number; // 0-6, dimanche à samedi
            startTime: string; // format "HH:MM"
            endTime: string; // format "HH:MM"
            minPersonnel: number;
        }[];
        compensationRules: {
            hoursOffset: number; // après combien d'heures de garde
            compensationType: string; // 'time' ou 'financial'
            compensationAmount: number;
        }[];
    };
}

export type AnyRule = LeaveRule | DutyRule | SupervisionRule | AssignmentRule | OnCallRule;

export interface RuleConflict {
    id: string;
    ruleIds: string[];
    description: string;
    severity: RuleSeverity;
    detectedAt: Date;
    resolvedAt?: Date;
}

export interface RuleValidationResult {
    isValid: boolean;
    conflicts: RuleConflict[];
} 