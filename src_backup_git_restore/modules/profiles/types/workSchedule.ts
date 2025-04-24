import { User } from '../../../types/user';

/**
 * Types de fréquence de travail
 */
export enum WorkFrequency {
    FULL_TIME = 'FULL_TIME',           // Temps plein
    PART_TIME = 'PART_TIME',           // Temps partiel
    ALTERNATE_WEEKS = 'ALTERNATE_WEEKS', // Alternance semaines paires/impaires
    ALTERNATE_MONTHS = 'ALTERNATE_MONTHS', // Alternance mensuelle
    CUSTOM = 'CUSTOM'                  // Configuration personnalisée
}

/**
 * Jours de la semaine
 */
export enum Weekday {
    MONDAY = 1,
    TUESDAY = 2,
    WEDNESDAY = 3,
    THURSDAY = 4,
    FRIDAY = 5,
    SATURDAY = 6,
    SUNDAY = 0
}

/**
 * Type de semaine pour alternance
 */
export enum WeekType {
    EVEN = 'EVEN',    // Semaine paire
    ODD = 'ODD',      // Semaine impaire
    BOTH = 'BOTH'     // Les deux types de semaine
}

/**
 * Type de mois pour alternance
 */
export enum MonthType {
    EVEN = 'EVEN',    // Mois pairs
    ODD = 'ODD',      // Mois impairs
    BOTH = 'BOTH'     // Tous les mois
}

/**
 * Configuration de planning de travail
 */
export interface WorkSchedule {
    id: string;
    userId: string;
    user?: User;
    frequency: WorkFrequency;

    // Pour temps partiel
    workingTimePercentage?: number; // ex: 50 pour mi-temps

    // Jours travaillés spécifiques
    workingDays?: Weekday[];

    // Pour alternance de semaines
    weekType?: WeekType;

    // Pour alternance de mois
    monthType?: MonthType;

    // Configurations personnalisées (jours spécifiques)
    customSchedule?: {
        evenWeeks?: Weekday[];
        oddWeeks?: Weekday[];
    };

    // Congés annuels (proportionnels au temps de travail)
    annualLeaveAllowance: number; // Nombre de jours de congés annuels

    // Date de début et de fin de validité du planning
    validFrom: Date;
    validTo?: Date; // Optionnel si planning toujours valide

    // Statut du planning
    isActive: boolean;

    // Dates de création et modification
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Configuration spécifique pour les MARs (Médecins Anesthésistes Réanimateurs)
 */
export interface MARWorkSchedule extends WorkSchedule {
    specialtyId?: string;
    specificHospitals?: string[]; // Liste des hôpitaux où le MAR peut travailler
}

/**
 * Configuration spécifique pour les IADEs (Infirmiers Anesthésistes Diplômés d'État)
 */
export interface IADEWorkSchedule extends WorkSchedule {
    teamId?: string;
    canWorkWithSpecificMARs?: string[]; // IDs des MARs avec lesquels l'IADE peut travailler
}

/**
 * Type union pour tous les types de planning
 */
export type AnyWorkSchedule = WorkSchedule | MARWorkSchedule | IADEWorkSchedule;

/**
 * Calcul du nombre de jours travaillés dans une semaine
 */
export interface WeeklyWorkingDays {
    totalDays: number;
    evenWeekDays: number;
    oddWeekDays: number;
} 