/**
 * Règles d'affectation pour le bloc opératoire
 * Basé sur le document REGLES_AFFECTATION.md
 */

export const REGLES_AFFECTATION = {
    supervision: {
        maxSallesParDefaut: 2,
        maxSallesExceptionnel: 3,
        preferenceSupervisionPure: 3, // À partir de 3 salles, supervision pure recommandée
        
        // Messages pour l'utilisateur
        messages: {
            limite2Salles: "Maximum 2 salles par superviseur recommandé",
            limite3Salles: "3ème salle possible mais déconseillée",
            supervisionPure: "Pour 3 salles, privilégier la supervision sans anesthésie"
        }
    },

    compatibiliteSecteurs: {
        'GENERAL': ['GENERAL'],
        'CARDIAC': ['CARDIAC'],
        'NEURO': ['NEURO'],
        'PEDIATRIC': ['PEDIATRIC', 'GENERAL'],
        'OBSTETRIC': ['OBSTETRIC'],
        'OPHTHALMOLOGY': ['GENERAL', 'OPHTHALMOLOGY'],
        'ENDOSCOPY': ['ENDOSCOPY']
    } as Record<string, string[]>,

    contiguité: {
        secteurs: {
            'GENERAL': true,
            'CARDIAC': true,
            'NEURO': true,
            'PEDIATRIC': false, // Pas obligatoire en pédiatrie
            'OBSTETRIC': true,
            'OPHTHALMOLOGY': false, // Pas obligatoire en ophtalmo
            'ENDOSCOPY': false
        }
    },

    // Incompatibilités strictes
    incompatibilites: {
        garde: ['CONSULTATION', 'BLOC', 'ASTREINTE'],
        reposApresGarde: ['CONSULTATION', 'BLOC', 'GARDE', 'ASTREINTE'],
        consultation: {
            matin: ['BLOC_MATIN'],
            aprèsMidi: ['BLOC_APRES_MIDI']
        }
    },

    // Temps minimum entre affectations
    tempsRepos: {
        entreGardes: 7 * 24 * 60 * 60 * 1000, // 7 jours en millisecondes
        apresGarde: 24 * 60 * 60 * 1000, // 24h minimum
        entreAstreintes: 2 * 24 * 60 * 60 * 1000 // 2 jours minimum
    },

    // Priorités pour l'algorithme
    priorites: {
        garde: 1,
        astreinte: 2,
        bloc: 3,
        consultation: 4
    },

    // Équité
    equite: {
        poidsGardeWeekend: 1.5,
        poidsGardeJourFerie: 2,
        poidsAstreinteWeekend: 1.2,
        toleranceEcart: 0.2 // 20% d'écart maximum entre médecins
    }
} as const;

// Types dérivés
export type SectorType = keyof typeof REGLES_AFFECTATION.compatibiliteSecteurs;
export type IncompatibilityType = keyof typeof REGLES_AFFECTATION.incompatibilites;

// Fonctions utilitaires
export const canSuperviseMultipleSectors = (
    sectorType1: SectorType, 
    sectorType2: SectorType
): boolean => {
    const compatibleSectors = REGLES_AFFECTATION.compatibiliteSecteurs[sectorType1] || [];
    return sectorType1 === sectorType2 || compatibleSectors.includes(sectorType2);
};

export const requiresContiguousRooms = (sectorType: SectorType): boolean => {
    return REGLES_AFFECTATION.contiguité.secteurs[sectorType] ?? true;
};

export const getMaxRoomsForSector = (sectorType: SectorType, isExceptional: boolean = false): number => {
    // Règles spécifiques par secteur
    const sectorLimits: Record<string, { normal: number; exceptional: number }> = {
        'OPHTHALMOLOGY': { normal: 3, exceptional: 3 },
        'ENDOSCOPY': { normal: 2, exceptional: 2 },
        'CARDIAC': { normal: 1, exceptional: 2 },
        'NEURO': { normal: 1, exceptional: 2 }
    };

    const limit = sectorLimits[sectorType];
    if (limit) {
        return isExceptional ? limit.exceptional : limit.normal;
    }

    return isExceptional 
        ? REGLES_AFFECTATION.supervision.maxSallesExceptionnel 
        : REGLES_AFFECTATION.supervision.maxSallesParDefaut;
};

export const isActivityCompatible = (
    activity1: IncompatibilityType,
    activity2: IncompatibilityType,
    period?: 'matin' | 'aprèsMidi'
): boolean => {
    const incompatibilities = REGLES_AFFECTATION.incompatibilites[activity1];
    
    if (Array.isArray(incompatibilities)) {
        return !incompatibilities.includes(activity2);
    }
    
    if (period && typeof incompatibilities === 'object' && incompatibilities[period]) {
        return !incompatibilities[period].includes(activity2);
    }
    
    return true;
};

export const getRestTimeRequired = (afterActivity: 'garde' | 'astreinte'): number => {
    if (afterActivity === 'garde') {
        return REGLES_AFFECTATION.tempsRepos.apresGarde;
    }
    return 0; // Pas de repos obligatoire après astreinte
};

export const getMinTimeBetweenActivities = (activityType: 'garde' | 'astreinte'): number => {
    return activityType === 'garde' 
        ? REGLES_AFFECTATION.tempsRepos.entreGardes
        : REGLES_AFFECTATION.tempsRepos.entreAstreintes;
};