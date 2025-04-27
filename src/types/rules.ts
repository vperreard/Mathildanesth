// src/types/rules.ts

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

// Configuration des règles pour la génération du planning
export interface RulesConfiguration {
    intervalle: {
        minJoursEntreGardes: number; // défaut 7
        minJoursRecommandes: number; // défaut 21
        maxGardesMois: number; // défaut 3
        maxGardesConsecutives: number; // défaut 1
    };
    supervision: {
        maxSallesParMAR: Record<string, number>; // Par secteur
        maxSallesExceptionnel: number; // défaut 3
        reglesSecteursCompatibles: Record<string, string[]>;
    };
    consultations: {
        maxParSemaine: number; // défaut 2
        equilibreMatinApresMidi: boolean; // défaut true
    };
    equite: {
        poidsGardesWeekend: number; // défaut 1.5
        poidsGardesFeries: number; // défaut 2
        equilibrageSpecialites: boolean; // défaut true
    };
    qualiteVie: {
        poidsPreferences: number; // défaut 0.5
        eviterConsecutifs: boolean; // défaut true
        recuperationApresGardeNuit: boolean; // défaut true
    };
}

// Configuration par défaut des règles
export const defaultRulesConfiguration: RulesConfiguration = {
    intervalle: {
        minJoursEntreGardes: 7,
        minJoursRecommandes: 21,
        maxGardesMois: 3,
        maxGardesConsecutives: 1
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