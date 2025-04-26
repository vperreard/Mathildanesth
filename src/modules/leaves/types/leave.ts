import { User } from '../../../types/user';

/**
 * Types de congés
 */
export enum LeaveType {
    ANNUAL = 'ANNUAL',           // Congé annuel
    RECOVERY = 'RECOVERY',       // Récupération (ex: IADE)
    TRAINING = 'TRAINING',       // Formation
    SICK = 'SICK',               // Maladie
    MATERNITY = 'MATERNITY',     // Maternité
    SPECIAL = 'SPECIAL',         // Congés spéciaux (à définir)
    UNPAID = 'UNPAID',           // Sans solde
    OTHER = 'OTHER'              // Autre
}

/**
 * Statut des demandes de congés
 */
export enum LeaveStatus {
    DRAFT = 'DRAFT',             // Brouillon
    PENDING = 'PENDING',         // En attente
    APPROVED = 'APPROVED',       // Approuvé
    REJECTED = 'REJECTED',       // Refusé
    CANCELLED = 'CANCELLED'      // Annulé
}

/**
 * Demande de congés
 */
export interface Leave {
    id: string;
    userId: string;
    user?: User;

    // Dates de début et fin
    startDate: Date;
    endDate: Date;

    // Type de congé
    type: LeaveType;

    // Statut de la demande
    status: LeaveStatus;

    // Nombre de jours décomptés (calculé en fonction du planning de l'utilisateur)
    countedDays: number;

    // Informations supplémentaires
    reason?: string;
    comment?: string;

    // Dates importantes
    requestDate: Date;
    approvalDate?: Date;
    approvedBy?: string;

    // Données de calcul
    calculationDetails?: LeaveCalculationDetails;

    // Métadonnées
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Détails de calcul des jours de congés
 * (important pour la logique de décompte spécifique aux MARs et aux temps partiels)
 */
export interface LeaveCalculationDetails {
    // Nombre de jours naturels (y compris weekends et jours fériés)
    naturalDays: number;

    // Nombre de jours ouvrés (hors weekends et jours fériés)
    workDays: number;

    // Décompte par semaine (important pour l'alternance semaines paires/impaires)
    weeklyBreakdown: WeeklyLeaveBreakdown[];

    // Jours fériés inclus dans la période
    publicHolidays: Date[];

    // Pourcentage de temps de travail au moment de la demande
    workingTimePercentage: number;
}

/**
 * Décompte des jours de congés par semaine
 */
export interface WeeklyLeaveBreakdown {
    weekNumber: number;
    weekType: 'EVEN' | 'ODD';
    startDate: Date;
    endDate: Date;
    naturalDays: number;
    countedDays: number;
    isWorkingWeek: boolean; // Si l'utilisateur travaille habituellement cette semaine
}

/**
 * Interface Leave étendue pour inclure l'objet User complet (optionnel)
 */
export interface LeaveWithUser extends Leave {
    user?: User; // Rendre l'utilisateur optionnel si nécessaire
}

/**
 * Solde de congés
 */
export interface LeaveBalance {
    userId: string;
    year: number; // Année civile ou année glissante

    // Droits initiaux
    initialAllowance: number;

    // Droits supplémentaires (ex: récupération)
    additionalAllowance: number;

    // Jours pris
    used: number;

    // Jours posés mais pas encore approuvés
    pending: number;

    // Jours restants
    remaining: number;

    // Détail par type de congé
    detailsByType: {
        [key in LeaveType]?: {
            used: number;
            pending: number;
        };
    };

    // Dates de mise à jour
    lastUpdated: Date;
}

/**
 * Filtres pour recherche de congés
 */
export interface LeaveFilters {
    userId?: string;
    userIds?: string[];
    status?: LeaveStatus | LeaveStatus[];
    type?: LeaveType | LeaveType[];
    startDateFrom?: Date;
    startDateTo?: Date;
    endDateFrom?: Date;
    endDateTo?: Date;
    requestDateFrom?: Date;
    requestDateTo?: Date;
}

/**
 * Résultat du contrôle des droits à congés
 */
export interface LeaveAllowanceCheckResult {
    isAllowed: boolean;
    remainingDays: number;
    requestedDays: number;
    exceededDays: number;
    message?: string;
}

/**
 * Type pour la modification d'un congé
 */
export interface LeaveToModify {
    id: string;
    startDate: Date;
    endDate: Date;
    type: LeaveType;
    status: LeaveStatus;
    comment?: string;
    userId: string;
} 