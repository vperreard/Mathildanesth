/**
 * Type d'absence médicale
 */
export enum AbsenceType {
    CONGE_PAYE = "CONGE_PAYE",
    MALADIE = "MALADIE",
    CONGE_MATERNITE = "CONGE_MATERNITE",
    CONGE_PATERNITE = "CONGE_PATERNITE",
    FORMATION = "FORMATION",
    RTT = "RTT",
    ADMINISTRATIF = "ADMINISTRATIF",
    AUTRE = "AUTRE",
}

/**
 * Statut d'une demande d'absence
 */
export enum AbsenceRequestStatus {
    EN_ATTENTE = "EN_ATTENTE",
    APPROUVEE = "APPROUVEE",
    REFUSEE = "REFUSEE",
    ANNULEE = "ANNULEE",
}

/**
 * Représente une demande d'absence
 */
export interface AbsenceRequest {
    /** Identifiant unique de la demande */
    id: string;
    /** Médecin demandant l'absence */
    doctorId: string;
    /** Type d'absence */
    type: AbsenceType;
    /** Date et heure de début */
    startTime: Date;
    /** Date et heure de fin */
    endTime: Date;
    /** Raison de l'absence */
    reason?: string;
    /** Statut de la demande */
    status: AbsenceRequestStatus;
    /** Utilisateur ayant approuvé/refusé la demande */
    reviewedBy?: string;
    /** Commentaire sur la décision */
    reviewComment?: string;
    /** Date de la décision */
    reviewedAt?: Date;
    /** Pièces jointes (certificats, etc.) */
    attachments?: string[];
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
}

/**
 * Représente les disponibilités récurrentes d'un médecin
 */
export interface RecurringAvailability {
    /** Identifiant unique */
    id: string;
    /** Médecin concerné */
    doctorId: string;
    /** Jour de la semaine (0-6, 0 étant dimanche) */
    dayOfWeek: number;
    /** Heure de début (format 24h: 0-23) */
    startHour: number;
    /** Heure de fin (format 24h: 0-23) */
    endHour: number;
    /** Disponible pour les gardes d'urgence */
    availableForEmergency: boolean;
    /** Préférence (1-5, 5 étant le plus préféré) */
    preference: number;
    /** Notes ou commentaires */
    notes?: string;
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
}

/**
 * Représente une disponibilité exceptionnelle (non récurrente)
 */
export interface ExceptionalAvailability {
    /** Identifiant unique */
    id: string;
    /** Médecin concerné */
    doctorId: string;
    /** Date et heure de début */
    startTime: Date;
    /** Date et heure de fin */
    endTime: Date;
    /** Disponible pour les gardes d'urgence */
    availableForEmergency: boolean;
    /** Notes ou commentaires */
    notes?: string;
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
}

/**
 * Types de disponibilité
 */
export enum AvailabilityType {
    /** Totalement disponible */
    DISPONIBLE = "DISPONIBLE",
    /** Disponible sous conditions */
    DISPONIBLE_AVEC_CONDITIONS = "DISPONIBLE_AVEC_CONDITIONS",
    /** Disponible seulement en cas d'urgence */
    DISPONIBLE_URGENCE = "DISPONIBLE_URGENCE",
    /** Non disponible */
    NON_DISPONIBLE = "NON_DISPONIBLE",
}

/**
 * Récurrence de disponibilité
 */
export enum RecurrencePattern {
    /** Ponctuel (une seule date) */
    PONCTUEL = "PONCTUEL",
    /** Quotidien */
    QUOTIDIEN = "QUOTIDIEN",
    /** Hebdomadaire */
    HEBDOMADAIRE = "HEBDOMADAIRE",
    /** Bimensuel */
    BIMENSUEL = "BIMENSUEL",
    /** Mensuel */
    MENSUEL = "MENSUEL",
    /** Personnalisé */
    PERSONNALISE = "PERSONNALISE",
}

/**
 * Interface pour une disponibilité de médecin
 */
export interface Availability {
    /** Identifiant unique */
    id: string;
    /** Identifiant du médecin */
    doctorId: string;
    /** Type de disponibilité */
    type: AvailabilityType;
    /** Date et heure de début */
    startDate: Date;
    /** Date et heure de fin */
    endDate: Date;
    /** Récurrence */
    recurrencePattern?: RecurrencePattern;
    /** Détails de récurrence personnalisée */
    recurrenceDetails?: {
        /** Jours de la semaine (0-6, 0 étant dimanche) */
        daysOfWeek?: number[];
        /** Jours du mois */
        daysOfMonth?: number[];
        /** Mois de l'année (1-12) */
        months?: number[];
        /** Date de fin de la récurrence */
        endRecurrenceDate?: Date;
        /** Nombre d'occurrences */
        occurrences?: number;
    };
    /** Préférences pour types de gardes */
    preferredDutyTypes?: string[];
    /** Services préférés */
    preferredServices?: string[];
    /** Raison de non-disponibilité */
    reason?: string;
    /** Commentaires */
    comments?: string;
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
}

/**
 * Interface pour une période de congés
 */
export interface TimeOff {
    /** Identifiant unique */
    id: string;
    /** Identifiant du médecin */
    doctorId: string;
    /** Type de congé */
    type: "VACANCES" | "MALADIE" | "FORMATION" | "MATERNITE" | "PATERNITE" | "AUTRE";
    /** Date et heure de début */
    startDate: Date;
    /** Date et heure de fin */
    endDate: Date;
    /** Statut d'approbation */
    status: "DEMANDE" | "APPROUVE" | "REFUSE" | "ANNULE";
    /** Raison détaillée */
    reason?: string;
    /** Documents justificatifs */
    documents?: string[];
    /** Remplaçant proposé */
    proposedReplacementId?: string;
    /** Commentaires */
    comments?: string;
    /** Approuvé par */
    approvedBy?: string;
    /** Date d'approbation */
    approvedDate?: Date;
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
}

/**
 * Interface pour un modèle de disponibilité récurrente
 */
export interface AvailabilityTemplate {
    /** Identifiant unique */
    id: string;
    /** Nom du modèle */
    name: string;
    /** Identifiant du médecin */
    doctorId: string;
    /** Description */
    description?: string;
    /** Configuration des disponibilités par jour de semaine */
    weeklyPattern: {
        /** Lundi */
        monday?: { startTime?: string; endTime?: string; type: AvailabilityType }[];
        /** Mardi */
        tuesday?: { startTime?: string; endTime?: string; type: AvailabilityType }[];
        /** Mercredi */
        wednesday?: { startTime?: string; endTime?: string; type: AvailabilityType }[];
        /** Jeudi */
        thursday?: { startTime?: string; endTime?: string; type: AvailabilityType }[];
        /** Vendredi */
        friday?: { startTime?: string; endTime?: string; type: AvailabilityType }[];
        /** Samedi */
        saturday?: { startTime?: string; endTime?: string; type: AvailabilityType }[];
        /** Dimanche */
        sunday?: { startTime?: string; endTime?: string; type: AvailabilityType }[];
    };
    /** Préférences pour types de gardes */
    preferredDutyTypes?: string[];
    /** Services préférés */
    preferredServices?: string[];
    /** Actif ou non */
    isActive: boolean;
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
} 