/**
 * Types de contraintes de planning pour les médecins
 */
export enum ConstraintType {
    /** Ne peut pas travailler certains jours */
    NE_PEUT_PAS_TRAVAILLER = "NE_PEUT_PAS_TRAVAILLER",
    /** Préfère ne pas travailler certains jours */
    PREFERE_NE_PAS_TRAVAILLER = "PREFERE_NE_PAS_TRAVAILLER",
    /** Souhaite travailler certains jours */
    SOUHAITE_TRAVAILLER = "SOUHAITE_TRAVAILLER",
    /** Ne peut pas effectuer certains types de garde */
    NE_PEUT_PAS_FAIRE_TYPE = "NE_PEUT_PAS_FAIRE_TYPE",
    /** Préfère ne pas effectuer certains types de garde */
    PREFERE_NE_PAS_FAIRE_TYPE = "PREFERE_NE_PAS_FAIRE_TYPE",
    /** Souhaite effectuer certains types de garde */
    SOUHAITE_FAIRE_TYPE = "SOUHAITE_FAIRE_TYPE",
    /** Maximum de gardes par semaine */
    MAX_GARDES_SEMAINE = "MAX_GARDES_SEMAINE",
    /** Maximum de gardes par mois */
    MAX_GARDES_MOIS = "MAX_GARDES_MOIS",
    /** Maximum de gardes consécutives */
    MAX_GARDES_CONSECUTIVES = "MAX_GARDES_CONSECUTIVES",
    /** Jours de repos minimum entre gardes */
    JOURS_REPOS_MINIMUM = "JOURS_REPOS_MINIMUM",
    /** Autre contrainte personnalisée */
    AUTRE = "AUTRE",
}

/**
 * Niveau de priorité d'une contrainte
 */
export enum ConstraintPriority {
    /** Contrainte critique (médicale, légale) */
    CRITIQUE = "CRITIQUE",
    /** Contrainte importante */
    IMPORTANTE = "IMPORTANTE",
    /** Contrainte modérée */
    MODEREE = "MODEREE",
    /** Simple préférence */
    PREFERENCE = "PREFERENCE",
}

/**
 * Interface pour une contrainte de planning
 */
export interface Constraint {
    /** Identifiant unique */
    id: string;
    /** Médecin concerné */
    doctorId: string;
    /** Type de contrainte */
    type: ConstraintType;
    /** Priorité de la contrainte */
    priority: ConstraintPriority;
    /** Date de début d'application (si temporaire) */
    startDate?: Date;
    /** Date de fin d'application (si temporaire) */
    endDate?: Date;
    /** Récurrence (jours spécifiques, hebdomadaire, mensuel) */
    recurrence?: string;
    /** Valeur de la contrainte (ex: nombre max de gardes) */
    value?: number | string;
    /** Raison de la contrainte */
    reason?: string;
    /** Validation médicale (pour raisons médicales) */
    medicalValidation?: boolean;
    /** Validation administrative */
    administrativeValidation?: boolean;
    /** Notes ou commentaires */
    notes?: string;
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
}

/**
 * Interface pour les préférences de travail en équipe
 */
export interface TeamPreference {
    /** Identifiant unique */
    id: string;
    /** Médecin concerné */
    doctorId: string;
    /** Médecin avec qui travailler */
    preferredDoctorId: string;
    /** Type de préférence (préfère/évite) */
    preferenceType: "PREFERE" | "EVITE";
    /** Force de la préférence (1-5) */
    strength: number;
    /** Raison de la préférence */
    reason?: string;
    /** Notes ou commentaires */
    notes?: string;
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
}

/**
 * Interface pour les compétences spéciales d'un médecin
 */
export interface SpecialSkill {
    /** Identifiant unique */
    id: string;
    /** Médecin concerné */
    doctorId: string;
    /** Nom de la compétence */
    skillName: string;
    /** Niveau de la compétence (1-5) */
    level: number;
    /** Certification ou validation externe */
    certification?: string;
    /** Date d'obtention */
    dateObtained?: Date;
    /** Date d'expiration (si applicable) */
    expirationDate?: Date;
    /** Notes ou commentaires */
    notes?: string;
    /** Date de création */
    createdAt: Date;
    /** Dernière mise à jour */
    updatedAt: Date;
} 