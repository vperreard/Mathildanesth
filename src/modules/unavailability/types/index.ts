import { User } from '@prisma/client';

/**
 * Types de récurrence pour les indisponibilités
 */
export enum RecurrenceType {
    NONE = 'NONE',           // Pas de récurrence (ponctuelle)
    DAILY = 'DAILY',         // Tous les jours
    WEEKLY = 'WEEKLY',       // Toutes les semaines
    BIWEEKLY = 'BIWEEKLY',   // Toutes les deux semaines
    MONTHLY = 'MONTHLY'      // Tous les mois
}

/**
 * Statut de validation des indisponibilités
 */
export enum UnavailabilityStatus {
    PENDING = 'PENDING',     // En attente de validation
    APPROVED = 'APPROVED',   // Approuvée
    REJECTED = 'REJECTED'    // Rejetée
}

/**
 * Types d'indisponibilités
 */
export enum UnavailabilityType {
    PERSONAL = 'PERSONAL',   // Raison personnelle
    MEDICAL = 'MEDICAL',     // Raison médicale
    TRAINING = 'TRAINING',   // Formation
    MEETING = 'MEETING',     // Réunion
    OTHER = 'OTHER'          // Autre
}

/**
 * Priorité des indisponibilités
 */
export enum UnavailabilityPriority {
    LOW = 'LOW',             // Faible (peut être ignorée si nécessaire)
    MEDIUM = 'MEDIUM',       // Moyenne (devrait être respectée)
    HIGH = 'HIGH'            // Haute (doit être respectée)
}

/**
 * Interface pour une indisponibilité
 */
export interface Unavailability {
    id: string;
    userId: number;            // ID de l'utilisateur concerné
    title: string;             // Titre/raison de l'indisponibilité
    description?: string;      // Description détaillée (optionnelle)
    startDate: Date;           // Date de début
    endDate: Date;             // Date de fin
    startTime?: string;        // Heure de début (optionnelle, format "HH:MM")
    endTime?: string;          // Heure de fin (optionnelle, format "HH:MM")
    isAllDay: boolean;         // Indique si l'indisponibilité dure toute la journée
    type: UnavailabilityType;  // Type d'indisponibilité
    status: UnavailabilityStatus; // Statut de validation
    priority: UnavailabilityPriority; // Priorité
    recurrence: RecurrenceType; // Type de récurrence
    recurrenceEndDate?: Date;   // Date de fin de récurrence (si applicable)
    validatedBy?: number;       // ID de l'utilisateur qui a validé
    rejectionReason?: string;   // Raison du rejet (si rejetée)
    createdAt: Date;           // Date de création
    updatedAt: Date;           // Date de dernière mise à jour
}

/**
 * Interface pour la création d'une indisponibilité
 */
export type UnavailabilityCreateData = Omit<Unavailability, 'id' | 'status' | 'validatedBy' | 'rejectionReason' | 'createdAt' | 'updatedAt'>;

/**
 * Interface pour la mise à jour d'une indisponibilité
 */
export type UnavailabilityUpdateData = Partial<Omit<Unavailability, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

/**
 * Interface pour le traitement (approbation/rejet) d'une indisponibilité
 */
export interface UnavailabilityProcessData {
    status: UnavailabilityStatus.APPROVED | UnavailabilityStatus.REJECTED;
    rejectionReason?: string;
}

/**
 * Interface pour une indisponibilité avec les informations de l'utilisateur
 */
export interface UnavailabilityWithUser extends Unavailability {
    user: User;
}

/**
 * Interface pour les filtres de recherche d'indisponibilités
 */
export interface UnavailabilityFilter {
    userId?: number;
    status?: UnavailabilityStatus;
    type?: UnavailabilityType;
    startDate?: Date;
    endDate?: Date;
    priority?: UnavailabilityPriority;
}

/**
 * Interface pour la configuration des règles de validation automatique
 */
export interface UnavailabilityValidationRules {
    autoApproveForRoles?: string[];  // Rôles autorisés à avoir une approbation automatique
    maxDaysInAdvance?: number;       // Nombre maximum de jours à l'avance pour créer une indisponibilité
    maxConsecutiveDays?: number;     // Nombre maximum de jours consécutifs d'indisponibilité
    requireJustification?: boolean;  // Exige une justification pour certains types
    typesRequiringJustification?: UnavailabilityType[]; // Types nécessitant justification
}

/**
 * Interface pour les conflits avec d'autres éléments de planification
 */
export interface UnavailabilityConflict {
    id: string;
    unavailabilityId: string;
    conflictType: 'LEAVE' | 'ASSIGNMENT' | 'OTHER_UNAVAILABILITY';
    conflictItemId: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    canBeResolved: boolean;
    createdAt: Date;
}

/**
 * Interface pour les statistiques d'indisponibilité
 */
export interface UnavailabilityStats {
    totalCount: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    byType: Record<UnavailabilityType, number>;
    byMonth: Record<string, number>; // Format "YYYY-MM"
} 