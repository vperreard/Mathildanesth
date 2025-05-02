import { User } from '../../../types/user';

/**
 * Types et interfaces pour la gestion des emplois du temps
 */

/**
 * Fréquence de travail
 */
export enum WorkFrequency {
    FULL_TIME = 'FULL_TIME',           // Temps plein
    ALTERNATE_WEEKS = 'ALTERNATE_WEEKS', // Alternance de semaines
    ALTERNATE_MONTHS = 'ALTERNATE_MONTHS', // Alternance de mois
    CUSTOM = 'CUSTOM'                  // Planning personnalisé
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
 * Type de semaine
 */
export enum WeekType {
    EVEN = 'EVEN',   // Semaines paires
    ODD = 'ODD',     // Semaines impaires
    BOTH = 'BOTH'    // Les deux types de semaines
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
 * Configuration de planning personnalisé
 */
export interface CustomSchedule {
    evenWeeks?: number[];  // Jours travaillés en semaines paires (1-7, 1=lundi)
    oddWeeks?: number[];   // Jours travaillés en semaines impaires
    specificDays?: string[]; // Jours spécifiques au format YYYY-MM-DD
}

/**
 * Emploi du temps d'un utilisateur
 */
export interface WorkSchedule {
    id: string | number;
    userId: number;
    frequency: WorkFrequency;
    weekType: WeekType;
    workingDays: number[];  // Jours travaillés (1-7, 1=lundi)
    workingTimePercentage: number;
    annualLeaveAllowance: number;
    isActive: boolean;
    validFrom: Date;
    validTo?: Date;
    customSchedule?: CustomSchedule;
    createdAt?: Date;
    updatedAt?: Date;
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