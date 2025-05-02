// src/types/rules.ts

import { ShiftType } from './common';

/**
 * Niveaux de sévérité des règles
 */
export enum RuleSeverity {
    INFO = 0,
    WARNING = 1,
    ERROR = 2,
    CRITICAL = 3
}

/**
 * Configuration des règles pour la validation des affectations
 */
export interface RulesConfiguration {
    /** Nombre minimum de jours entre deux affectations pour un même médecin */
    minDaysBetweenAssignments?: number;

    /** Nombre maximum d'affectations par mois pour un médecin */
    maxAssignmentsPerMonth?: number;

    /** Nombre maximum d'affectations consécutives pour un médecin */
    maxConsecutiveAssignments?: number;

    /** Liste des jours spéciaux avec des règles particulières */
    specialDays?: SpecialDay[];

    // Types de shifts pour les jours de semaine et weekends
    weekdayShifts: ShiftType[];
    weekendShifts: ShiftType[];

    // Périodes de repos minimales
    minimumRestPeriod: number; // en heures

    // Heures de début et de fin pour chaque type de shift
    shiftStartTimes: Record<ShiftType, string>;
    shiftEndTimes: Record<ShiftType, string>;

    // Spécialités requises pour chaque type de shift
    shiftSpecialties: Record<ShiftType, string[]>;

    // Écart maximum autorisé pour l'équité des assignations
    maxAssignmentDeviation?: number;

    // Contraintes supplémentaires
    maxConsecutiveShifts?: number;
    maxWeeklyHours?: number;
    maxMonthlyHours?: number;
    minWeeklyHours?: number;
    minMonthlyHours?: number;

    // Préférences de planification
    preferWeekendRotation?: boolean;
    preferSpecialtyMatch?: boolean;
    preferExperienceLevel?: boolean;

    // Périodes de planification
    planningPeriodStart?: Date;
    planningPeriodEnd?: Date;

    // Exceptions et règles spéciales
    exceptions?: {
        date: Date;
        rules: Partial<RulesConfiguration>;
    }[];

    // Configuration spécifique pour les intervalles
    intervalle: {
        minJoursEntreGardes: number; // défaut 7
        minJoursRecommandes: number; // défaut 21
        maxGardesMois: number; // défaut 3
        maxGardesConsecutives: number; // défaut 1
        maxAstreintesMois: number; // défaut 5
    };

    // Configuration de la supervision
    supervision: {
        maxSallesParMAR: Record<string, number>; // Par secteur
        maxSallesExceptionnel: number; // défaut 3
        reglesSecteursCompatibles: Record<string, string[]>;
    };

    // Configuration des consultations
    consultations: {
        maxParSemaine: number; // défaut 2
        equilibreMatinApresMidi: boolean; // défaut true
    };

    // Configuration de l'équité
    equite: {
        poidsGardesWeekend: number; // défaut 1.5
        poidsGardesFeries: number; // défaut 2
        equilibrageSpecialites: boolean; // défaut true
    };

    // Configuration de la qualité de vie
    qualiteVie: {
        poidsPreferences: number; // défaut 0.5
        eviterConsecutifs: boolean; // défaut true
        recuperationApresGardeNuit: boolean; // défaut true
    };
}

/**
 * Configuration pour un jour spécial
 */
export interface SpecialDay {
    /** Date du jour spécial */
    date: Date | string;

    /** Nombre de médecins requis pour ce jour */
    requiredDoctors: number;

    /** Description du jour spécial */
    description?: string;
}

// Configuration par défaut des règles
export const defaultRulesConfiguration: RulesConfiguration = {
    weekdayShifts: [ShiftType.MATIN, ShiftType.APRES_MIDI, ShiftType.GARDE_24H, ShiftType.ASTREINTE],
    weekendShifts: [ShiftType.GARDE_24H, ShiftType.ASTREINTE],
    minimumRestPeriod: 12,
    shiftStartTimes: {
        [ShiftType.MATIN]: '08:00',
        [ShiftType.APRES_MIDI]: '14:00',
        [ShiftType.GARDE_24H]: '08:00',
        [ShiftType.ASTREINTE]: '08:00',
        [ShiftType.JOUR]: '08:00',
        [ShiftType.NUIT]: '20:00',
        [ShiftType.GARDE_WEEKEND]: '08:00',
        [ShiftType.ASTREINTE_SEMAINE]: '08:00',
        [ShiftType.ASTREINTE_WEEKEND]: '08:00',
        [ShiftType.URGENCE]: '08:00',
        [ShiftType.CONSULTATION]: '09:00'
    },
    shiftEndTimes: {
        [ShiftType.MATIN]: '13:00',
        [ShiftType.APRES_MIDI]: '18:30',
        [ShiftType.GARDE_24H]: '08:00',
        [ShiftType.ASTREINTE]: '08:00',
        [ShiftType.JOUR]: '20:00',
        [ShiftType.NUIT]: '08:00',
        [ShiftType.GARDE_WEEKEND]: '08:00',
        [ShiftType.ASTREINTE_SEMAINE]: '08:00',
        [ShiftType.ASTREINTE_WEEKEND]: '08:00',
        [ShiftType.URGENCE]: '20:00',
        [ShiftType.CONSULTATION]: '13:00'
    },
    shiftSpecialties: {
        [ShiftType.MATIN]: ['standard'],
        [ShiftType.APRES_MIDI]: ['standard'],
        [ShiftType.GARDE_24H]: ['standard'],
        [ShiftType.ASTREINTE]: ['standard'],
        [ShiftType.JOUR]: ['standard'],
        [ShiftType.NUIT]: ['standard'],
        [ShiftType.GARDE_WEEKEND]: ['standard'],
        [ShiftType.ASTREINTE_SEMAINE]: ['standard'],
        [ShiftType.ASTREINTE_WEEKEND]: ['standard'],
        [ShiftType.URGENCE]: ['urgence'],
        [ShiftType.CONSULTATION]: ['consultation']
    },
    intervalle: {
        minJoursEntreGardes: 7,
        minJoursRecommandes: 21,
        maxGardesMois: 3,
        maxGardesConsecutives: 1,
        maxAstreintesMois: 5
    },
    supervision: {
        maxSallesParMAR: {
            'standard': 2,
            'ophtalmologie': 3,
            'endoscopie': 2
        },
        maxSallesExceptionnel: 3,
        reglesSecteursCompatibles: {
            'standard': ['standard'],
            'ophtalmologie': ['ophtalmologie', 'standard'],
            'endoscopie': ['endoscopie']
        }
    },
    consultations: {
        maxParSemaine: 2,
        equilibreMatinApresMidi: true
    },
    equite: {
        poidsGardesWeekend: 1.5,
        poidsGardesFeries: 2,
        equilibrageSpecialites: true
    },
    qualiteVie: {
        poidsPreferences: 0.5,
        eviterConsecutifs: true,
        recuperationApresGardeNuit: true
    }
};

// Système de points de fatigue
export interface FatigueConfig {
    points: {
        // Points de fatigue par type d'affectation
        garde: number;  // défaut +30
        astreinte: number;  // défaut +10
        supervisionMultiple: number;  // défaut +15
        pediatrie: number;  // défaut +10
        specialiteLourde: number;  // défaut +20
        [key: string]: number;
    };
    recovery: {
        // Points de récupération par type de repos
        jourOff: number;  // défaut -15
        demiJourneeOff: number;  // défaut -8
        weekend: number;  // défaut -30
        [key: string]: number;
    };
    seuils: {
        alerte: number;  // défaut 50
        critique: number;  // défaut 80
        [key: string]: number;
    };
}

// Configuration par défaut du système de fatigue
export const defaultFatigueConfig: FatigueConfig = {
    points: {
        garde: 30,
        astreinte: 10,
        supervisionMultiple: 15,
        pediatrie: 10,
        specialiteLourde: 20
    },
    recovery: {
        jourOff: 15,
        demiJourneeOff: 8,
        weekend: 30
    },
    seuils: {
        alerte: 50,
        critique: 80
    }
}; 