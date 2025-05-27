/**
 * Importe les types depuis le fichier commun
 */
import { ShiftType } from './common';

// Export pour la compatibilité avec le code existant
export { ShiftType };

/**
 * Statut possible d'une garde
 */
export enum ShiftStatus {
    PLANIFIEE = "PLANIFIEE",
    CONFIRMEE = "CONFIRMEE",
    EN_COURS = "EN_COURS",
    TERMINEE = "TERMINEE",
    ANNULEE = "ANNULEE",
}

/**
 * Représente une garde médicale
 */
export interface Shift {
    /** Identifiant unique de la garde */
    id: string;
    /** Type de garde */
    type: ShiftType;
    /** Département concerné */
    departmentId: string;
    /** Médecin assigné à cette garde */
    doctorId: string;
    /** Date et heure de début */
    startTime: Date;
    /** Date et heure de fin */
    endTime: Date;
    /** Statut actuel de la garde */
    status: ShiftStatus;
    /** Priorité de la garde (1-5, 5 étant la plus haute) */
    priority: number;
    /** Indique si cette garde est échangeable */
    exchangeable: boolean;
    /** Notes ou commentaires concernant cette garde */
    notes?: string;
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
}

/**
 * Représente un planning de gardes
 */
export interface PlanningMedical {
    /** Identifiant unique du planning */
    id: string;
    /** Période couverte par ce planning */
    period: {
        startDate: Date;
        endDate: Date;
    };
    /** Liste des gardes planifiées */
    shifts: Shift[];
    /** Identifiant de l'utilisateur ayant créé ce planning */
    createdBy: string;
    /** Statut du planning */
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
}

/**
 * Représente une demande d'échange de garde
 */
export interface ShiftExchangeRequest {
    /** Identifiant unique de la demande */
    id: string;
    /** Identifiant de la garde à échanger */
    shiftToExchangeId: string;
    /** Identifiant du médecin demandant l'échange */
    requestingDoctorId: string;
    /** Identifiants des gardes proposées en échange */
    proposedShiftIds?: string[];
    /** Raison de la demande d'échange */
    reason?: string;
    /** Statut de la demande d'échange */
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
    /** Identifiant du médecin acceptant l'échange */
    acceptingDoctorId?: string;
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
} 