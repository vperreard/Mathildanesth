/**
 * Types pour le module de planification du bloc opératoire
 */

/**
 * Statut de validation d'un planning
 */
export type ValidationStatus = 'BROUILLON' | 'PROPOSE' | 'VALIDE' | 'PUBLIE';

/**
 * Rôle d'un superviseur dans une salle
 */
export type SupervisorRole = 'PRINCIPAL' | 'SECONDAIRE' | 'SUPPORT';

/**
 * Type d'une règle de supervision
 */
export type SupervisionRuleType = 'BASIQUE' | 'SPECIFIQUE' | 'EXCEPTION';

/**
 * Type de la sévérité d'un problème de validation
 */
export type ValidationSeverity = 'ERREUR' | 'AVERTISSEMENT' | 'INFO';

/**
 * Type d'entité affectée par un problème de validation
 */
export type AffectedEntityType = 'SUPERVISEUR' | 'SALLE' | 'SECTEUR';

/**
 * Période de supervision
 */
export interface SupervisionPeriod {
    debut: string; // Format 'HH:MM'
    fin: string;   // Format 'HH:MM'
}

/**
 * Entité affectée par un problème de validation
 */
export interface AffectedEntity {
    type: AffectedEntityType;
    id: string;
}

/**
 * Problème de validation
 */
export interface ValidationIssue {
    id: string;
    type: string;
    code?: string;
    description: string;
    severite: ValidationSeverity;
    entitesAffectees: AffectedEntity[];
    estResolu: boolean;
}

/**
 * Résultat de validation d'un planning
 */
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
    infos: ValidationIssue[];
}

/**
 * Secteur du bloc opératoire
 */
export interface BlocSector {
    id: number;
    name: string;
    description?: string;
    colorCode: string;
    specialites?: string[];
    salles: string[];
    isActive: boolean;
    requiresSpecificSkills?: boolean;
    supervisionSpeciale?: boolean;
}

/**
 * Salle d'opération
 */
export interface OperatingRoom {
    id: number;
    number: string;
    name: string;
    operatingSectorId: number;
    isActive: boolean;
}

/**
 * Règle de supervision
 */
export interface SupervisionRule {
    id: string;
    nom: string;
    description?: string;
    type: SupervisionRuleType;
    secteurId?: string; // Secteur concerné (pour les règles spécifiques et exceptions)
    conditions: {
        maxSallesParMAR: number; // Nombre maximum de salles par MAR
        maxSallesExceptionnel?: number; // Nombre maximum de salles en situation exceptionnelle
        supervisionInterne?: boolean; // Supervision uniquement par le personnel du secteur
        supervisionContigues?: boolean; // Les salles supervisées doivent être contiguës
        competencesRequises?: string[]; // Compétences requises pour superviser
        supervisionDepuisAutreSecteur?: string[]; // Secteurs autorisés à superviser
        incompatibilites?: string[]; // Incompatibilités (secteurs, spécialités, etc.)
    };
    priorite: number; // Priorité de la règle (plus le chiffre est élevé, plus la règle est prioritaire)
    estActif: boolean;
}

/**
 * Superviseur assigné à une salle
 */
export interface BlocSupervisor {
    id: string;
    userId: string;
    role: SupervisorRole;
    periodes: SupervisionPeriod[];
}

/**
 * Attribution d'une salle pour une journée
 */
export interface BlocRoomAssignment {
    id: string;
    salleId: string;
    superviseurs: BlocSupervisor[];
    notes?: string;
}

// Affectation d'une salle pour une journée
export interface BlocRoomAssignment {
    id: string;
    salleId: string;
    superviseurs: BlocSupervisor[];
    interventions?: BlocIntervention[];
    notes?: string;
}

// Intervention chirurgicale
export interface BlocIntervention {
    id: string;
    titre: string;
    debut: string; // Format HH:mm
    fin: string; // Format HH:mm
    chirurgienId?: string;
    specialite?: string;
    priorite?: 'NORMALE' | 'URGENTE' | 'SEMI-URGENTE';
    statut?: 'PREVUE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
    notes?: string;
}

// Configuration des règles d'affichage du bloc
export interface BlocDisplayConfig {
    affichageSalles: 'NUMERIQUE' | 'SECTEUR' | 'MIXTE';
    couleursSecteurs: boolean;
    affichageInterventions: boolean;
    modeCompact: boolean;
    filtreSpecialites: string[];
    filtreChirurgiens: string[];
    plageHoraire: {
        debut: string; // Format HH:mm
        fin: string; // Format HH:mm
    };
}

// Type pour les conflits de planning bloc
export interface BlocPlanningConflict {
    id: string;
    type: 'REGLE_SUPERVISION' | 'CHEVAUCHEMENT' | 'INDISPONIBILITE' | 'COMPETENCE';
    description: string;
    severite: 'INFO' | 'AVERTISSEMENT' | 'ERREUR';
    entitesAffectees: {
        type: 'SALLE' | 'SUPERVISEUR' | 'SECTEUR';
        id: string;
    }[];
    date: string;
    regleId?: string;
    estResolu: boolean;
    resolutionProposee?: string;
}

/**
 * Planning journalier du bloc opératoire
 */
export interface BlocDayPlanning {
    id?: string;
    date: string;
    salles: BlocRoomAssignment[];
    validationStatus: ValidationStatus;
    createdAt?: Date;
    updatedAt?: Date;
    notes?: string;
} 