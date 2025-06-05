import { User } from '../../../types/user';

/**
 * Types pour la gestion des conflits de congés
 */

/**
 * Types de conflits possibles
 */
export enum ConflictType {
    // Conflits liés aux individus
    USER_LEAVE_OVERLAP = 'USER_LEAVE_OVERLAP',         // Chevauchement avec un autre congé du même utilisateur

    // Conflits liés à l'équipe
    TEAM_ABSENCE = 'TEAM_ABSENCE',                     // Trop de membres de l'équipe absents en même temps
    TEAM_CAPACITY = 'TEAM_CAPACITY',                   // Capacité de l'équipe réduite en dessous du seuil
    SPECIALTY_CAPACITY = 'SPECIALTY_CAPACITY',         // Capacité de la spécialité réduite en dessous du seuil
    CRITICAL_ROLE = 'CRITICAL_ROLE',                   // Personne avec rôle critique absent sans remplaçant

    // Conflits liés aux plannings et responsabilités
    DUTY_CONFLICT = 'DUTY_CONFLICT',                   // Conflit avec une garde
    ON_CALL_CONFLICT = 'ON_CALL_CONFLICT',             // Conflit avec une astreinte
    ASSIGNMENT_CONFLICT = 'ASSIGNMENT_CONFLICT',       // Conflit avec une affectation
    RECURRING_MEETING = 'RECURRING_MEETING',           // Conflit avec réunion importante récurrente

    // Conflits liés aux contraintes temporelles
    DEADLINE_PROXIMITY = 'DEADLINE_PROXIMITY',         // Congé proche d'une deadline importante
    HOLIDAY_PROXIMITY = 'HOLIDAY_PROXIMITY',           // Congé juste avant/après un jour férié (pont)
    SPECIAL_PERIOD = 'SPECIAL_PERIOD',                 // Période spéciale (ex: vacances scolaires)
    HIGH_WORKLOAD = 'HIGH_WORKLOAD',                   // Période de charge de travail élevée

    // Autre
    OTHER = 'OTHER'                                    // Autre type de conflit
}

/**
 * Niveaux de sévérité des conflits
 */
export enum ConflictSeverity {
    INFORMATION = 'INFORMATION',       // Information seulement, n'empêche pas l'approbation
    AVERTISSEMENT = 'AVERTISSEMENT',   // Avertissement, approbation possible mais déconseillée
    BLOQUANT = 'BLOQUANT'              // Bloquant, empêche l'approbation automatique
}

/**
 * Définition d'un conflit détecté
 */
export interface LeaveConflict {
    id: string;
    leaveId: string;

    // Type et sévérité du conflit
    type: ConflictType;
    severity: ConflictSeverity;

    // Description du conflit
    description: string;

    // Période du conflit
    startDate: string;
    endDate: string;

    // Utilisateurs et ressources affectés
    affectedUserIds?: string[];       // IDs des utilisateurs affectés
    affectedUsers?: User[];           // Utilisateurs affectés (pour la présentation)
    affectedResources?: string[];     // Ressources affectées (projets, réunions, etc.)

    // Gestion de la résolution
    canOverride: boolean;              // Le manager peut-il ignorer ce conflit?
    resolved?: boolean;                // Le conflit a-t-il été résolu?
    resolutionComment?: string;        // Commentaire sur la résolution
    resolvedBy?: string;               // ID de l'utilisateur qui a résolu
    resolvedAt?: string;               // Date de résolution

    // Métadonnées
    metadata?: Record<string, unknown>;    // Données supplémentaires spécifiques au type de conflit
    createdAt?: string;                // Date de création
    updatedAt?: string;                // Date de mise à jour
}

/**
 * Règles de détection des conflits
 */
export interface ConflictRules {
    // Règles liées à l'équipe
    maxTeamAbsencePercentage?: number;         // Pourcentage maximum d'absences dans l'équipe
    teamMinCapacity?: Record<string, number>;  // Capacité minimale par équipe (pourcentage)
    specialtyMinCapacity?: Record<string, number>; // Capacité minimale par spécialité (pourcentage)

    // Règles liées aux rôles
    criticalRolesRequireBackup?: boolean;      // Exiger un remplaçant pour les rôles critiques

    // Règles liées au planning
    minDaysBeforeDeadline?: number;            // Nb min de jours entre congé et deadline
    blockHolidayBridging?: boolean;            // Bloquer les ponts autour des jours fériés
    minDaysBetweenLeaves?: number;             // Nombre minimum de jours entre deux congés

    // Règles liées aux responsabilités
    allowLeavesDuringDuty?: boolean;           // Autoriser les congés pendant les gardes
    allowLeavesDuringOnCall?: boolean;         // Autoriser les congés pendant les astreintes

    // Périodes spéciales
    blockHighWorkloadPeriods?: boolean;        // Bloquer congés pendant périodes haute charge
    highWorkloadPeriods?: {                    // Définition des périodes de haute charge
        startDate: string;
        endDate: string;
        description: string;
    }[];
    specialPeriods?: {                         // Périodes spéciales (ex: vacances scolaires)
        id: string;
        name: string;
        startDate: string;
        endDate: string;
        restrictionLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    }[];

    // Règles spécifiques
    departmentSpecificRules?: Record<string, Partial<ConflictRules>>; // Règles spécifiques par département

    // Optimisations de performance
    stopCheckingAfterBlockingConflict?: boolean; // Arrêter la vérification dès qu'un conflit bloquant est trouvé
    enableCaching?: boolean;                    // Activer le cache pour les vérifications fréquentes
    cacheTTLMinutes?: number;                   // Durée de vie du cache en minutes
    parallelChecks?: boolean;                   // Effectuer les vérifications en parallèle
}

/**
 * Résultat de la vérification des conflits
 */
export interface ConflictCheckResult {
    hasConflicts: boolean;             // Présence de conflits
    conflicts: LeaveConflict[];        // Liste des conflits détectés
    hasBlockers: boolean;              // Présence de conflits bloquants
    canAutoApprove: boolean;           // Peut être approuvé automatiquement
    requiresManagerReview: boolean;    // Nécessite révision du manager
    performanceStats?: {               // Statistiques de performance (si activées)
        totalTimeMs: number;           // Temps total de vérification en ms
        checkCountsByType?: Record<ConflictType, number>; // Nombre de vérifications par type
        cacheHit?: boolean;            // Si le résultat vient du cache
    };
}

/**
 * Résolution d'un conflit
 */
export interface ConflictResolution {
    conflictId: string;
    resolvedBy: string;                // ID de l'utilisateur qui a résolu le conflit
    resolvedAt: string;                // Date de résolution
    resolution: 'APPROVED' | 'REJECTED' | 'MODIFIED'; // Type de résolution
    comment: string;                   // Commentaire expliquant la résolution
    alternativeDates?: {               // Dates alternatives proposées (si MODIFIED)
        startDate: string;
        endDate: string;
    };
} 