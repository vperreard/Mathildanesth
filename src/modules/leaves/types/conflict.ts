import { Leave } from './leave';
import { User } from '../../../types/user';

/**
 * Types de conflit
 */
export enum ConflictType {
    USER_LEAVE_OVERLAP = 'USER_LEAVE_OVERLAP',         // Chevauchement avec un autre congé du même utilisateur
    TEAM_CAPACITY = 'TEAM_CAPACITY',                   // Capacité de l'équipe réduite en dessous du seuil
    SPECIALTY_CAPACITY = 'SPECIALTY_CAPACITY',         // Capacité de la spécialité réduite en dessous du seuil
    DUTY_CONFLICT = 'DUTY_CONFLICT',                   // Conflit avec une garde
    ON_CALL_CONFLICT = 'ON_CALL_CONFLICT',             // Conflit avec une astreinte
    ASSIGNMENT_CONFLICT = 'ASSIGNMENT_CONFLICT',       // Conflit avec une affectation
    SPECIAL_PERIOD = 'SPECIAL_PERIOD'                  // Période spéciale (ex: vacances scolaires)
}

/**
 * Sévérité des conflits
 */
export enum ConflictSeverity {
    INFO = 'INFO',               // Information (pas bloquant)
    WARNING = 'WARNING',         // Avertissement (pas bloquant mais à vérifier)
    ERROR = 'ERROR'              // Erreur (bloquant)
}

/**
 * Conflit détecté
 */
export interface LeaveConflict {
    id: string;
    leaveId: string;
    leave?: Leave;

    // Type et sévérité du conflit
    type: ConflictType;
    severity: ConflictSeverity;

    // Description du conflit
    description: string;

    // Période du conflit
    startDate: Date;
    endDate: Date;

    // Utilisateurs concernés
    affectedUserIds?: string[];
    affectedUsers?: User[];

    // Données spécifiques au type de conflit
    conflictData?: any;

    // Statut de résolution
    resolved: boolean;
    resolutionComment?: string;
    resolvedBy?: string;
    resolvedAt?: Date;

    // Métadonnées
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Résultat de la vérification des conflits
 */
export interface ConflictCheckResult {
    hasBlockingConflicts: boolean;
    conflicts: LeaveConflict[];
}

/**
 * Configuration des règles de détection des conflits
 */
export interface ConflictRules {
    // Capacité minimale par équipe (pourcentage)
    teamMinCapacity: {
        [teamId: string]: number;
    };

    // Capacité minimale par spécialité (pourcentage)
    specialtyMinCapacity: {
        [specialtyId: string]: number;
    };

    // Périodes spéciales (ex: vacances scolaires)
    specialPeriods: {
        id: string;
        name: string;
        startDate: Date;
        endDate: Date;
        restrictionLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    }[];

    // Nombre minimum de jours entre deux congés
    minDaysBetweenLeaves: number;

    // Autoriser les congés pendant les gardes/astreintes
    allowLeavesDuringDuty: boolean;
    allowLeavesDuringOnCall: boolean;
} 