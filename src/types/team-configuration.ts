// Types pour la configuration d'équipe

export interface TeamConfigBase {
    id?: string;
    name: string;
    description?: string;
    isDefault: boolean;
    isActive: boolean;
}

// Configuration des gardes
export interface GardesConfig {
    structure: {
        parJour: {
            garde: number;
            astreinte: number;
        };
    };
    regles: {
        espacementMinimum: number;
        espacementIdeal: number;
        maxParMois: number;
        maxExceptionnel: number;
        reposApresGarde: {
            obligatoire: boolean;
            duree: number;
        };
        incompatibilites: string[];
    };
    distribution: {
        weekends: {
            poids: number;
            rotationAnnuelle: boolean;
        };
        joursFeries: {
            poids: number;
            compteSepare: boolean;
        };
        feteFinAnnee: {
            gestionManuelle: boolean;
            suivi: boolean;
        };
    };
}

// Configuration des consultations
export interface ConsultationsConfig {
    volume: {
        tempsPlein: number;
        proportionnelTempsPartiel: boolean;
    };
    limites: {
        maxParSemaine: number;
        repartitionMaximale: string;
    };
    flexibilite: {
        fermeturePeriodes: boolean;
        generationPartielle: boolean;
    };
}

// Configuration du bloc opératoire
export interface BlocConfig {
    salles: {
        [key: string]: {
            nombre: number;
            numeros: string[];
        };
    };
    supervision: {
        reglesBase: {
            maxSallesParMAR: number;
            maxExceptionnel: number;
        };
        reglesParSecteur: {
            [key: string]: {
                salles?: string[];
                supervisionInterne?: boolean;
                exceptions?: string[];
                supervisionCroisee?: string[];
                supervisionContigues?: boolean;
                maxParPersonnel?: number;
                supervisionDepuis?: string[];
            };
        };
    };
}

// Configuration des congés
export interface CongesConfig {
    quotas: {
        tempsPlein: number;
        proportionnelTempsPartiel: boolean;
    };
    decompte: {
        joursOuvrables: boolean;
        exclusFeries: boolean;
    };
    validation: {
        workflow: "SIMPLE" | "MULTI_NIVEAUX";
        delaiMinimum: number;
    };
    restrictions: {
        periodePic: {
            ete: {
                maxSimultane: number;
                priorite: "ANCIENNETE" | "ROTATION";
            };
            noel: {
                maxSimultane: number;
                priorite: "ANCIENNETE" | "ROTATION";
            };
        };
    };
}

// Configuration du système de fatigue
export interface FatigueConfig {
    actif: boolean;
    points: {
        // Points de fatigue par type d'affectation
        garde: number;
        astreinte: number;
        supervisionMultiple: number;
        pediatrie: number;
        specialiteLourde: number;
        [key: string]: number;
    };
    recovery: {
        // Points de récupération par type de repos
        jourOff: number;
        demiJourneeOff: number;
        weekend: number;
        [key: string]: number;
    };
    seuils: {
        // Seuils de fatigue
        alerte: number;
        critique: number;
        [key: string]: number;
    };
    equilibrage: {
        poidsEquite: number;
        poidsFatigue: number;
    };
}

// Configuration des temps partiels
export interface TempsPartielConfig {
    proportionnalite: {
        gardes: boolean;
        astreintes: boolean;
        consultations: boolean;
        conges: boolean;
    };
    arrondi: "INFERIEUR" | "SUPERIEUR" | "PROCHE";
}

// Configuration des IADEs
export interface IadesConfig {
    regleBase: {
        toujoursAffecte: boolean;
        absenceExceptionnelle: boolean;
    };
    volant: {
        nombre: number;
        regles: {
            flexibiliteJours: boolean;
            eviterApresmidiUnique: boolean;
            propositionModifications: boolean;
        };
    };
}

// Intégration de toutes les configurations
export interface TeamConfiguration extends TeamConfigBase {
    gardes: GardesConfig;
    consultations: ConsultationsConfig;
    bloc: BlocConfig;
    conges: CongesConfig;
    fatigue?: FatigueConfig;
    tempsPartiel?: TempsPartielConfig;
    iades?: IadesConfig;
    remplacants?: unknown;
    preferences?: unknown;
    statistiques?: unknown;
    horaires?: unknown;
    affectations: unknown;
    transitions?: unknown;
    equite?: unknown;
    alertes?: unknown;
    algorithme?: unknown;
    rapports?: unknown;
    audit?: unknown;
    createdAt?: Date;
    updatedAt?: Date;
} 