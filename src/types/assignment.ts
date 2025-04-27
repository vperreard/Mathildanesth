// src/types/assignment.ts

// Type d'affectation
export enum AssignmentType {
    GARDE = 'GARDE',
    ASTREINTE = 'ASTREINTE',
    CONSULTATION = 'CONSULTATION',
    BLOC = 'BLOC'
}

// Niveau de gravité pour les violations de règles
export enum RuleSeverity {
    CRITICAL = 'CRITICAL',
    MAJOR = 'MAJOR',
    MINOR = 'MINOR'
}

/**
 * Représente une affectation de garde pour un médecin
 */
export interface Assignment {
    /** Identifiant unique de l'affectation */
    id: string;
    /** ID du médecin assigné */
    doctorId: string;
    /** Date de la garde */
    date: Date;
    /** Type de garde (jour, nuit, etc.) */
    shiftType: ShiftType;
    /** État de l'affectation */
    status: AssignmentStatus;
    /** Commentaires supplémentaires */
    notes?: string;
}

/**
 * Types de gardes possibles
 */
export enum ShiftType {
    /** Garde de jour */
    DAY = 'day',
    /** Garde de nuit */
    NIGHT = 'night',
    /** Garde de weekend */
    WEEKEND = 'weekend',
    /** Garde pendant un jour férié */
    HOLIDAY = 'holiday'
}

/**
 * États possibles d'une affectation
 */
export enum AssignmentStatus {
    /** Planifiée */
    SCHEDULED = 'scheduled',
    /** Confirmée par le médecin */
    CONFIRMED = 'confirmed',
    /** Complétée */
    COMPLETED = 'completed',
    /** Annulée */
    CANCELLED = 'cancelled'
}

/**
 * Représente un planning complet d'affectations
 */
export interface Schedule {
    /** Identifiant unique du planning */
    id: string;
    /** Période couverte par le planning */
    period: {
        /** Date de début */
        startDate: Date;
        /** Date de fin */
        endDate: Date;
    };
    /** Liste des affectations */
    assignments: Assignment[];
    /** Version du planning */
    version: number;
    /** Date de création du planning */
    createdAt: Date;
    /** Dernière mise à jour du planning */
    updatedAt: Date;
}

// Interface pour les violations de règles
export interface RuleViolation {
    id: string;
    type: string;
    severity: RuleSeverity;
    message: string;
    affectedAssignments: string[]; // IDs des affectations concernées
    possibleResolutions?: ResolutionOption[];
}

// Option de résolution de conflit
export interface ResolutionOption {
    description: string;
    impact: number; // Score d'impact négatif (0-100)
    action: () => void;
}

// Compteurs de fatigue et d'équité
export interface UserCounter {
    userId: number;
    gardes: {
        total: number;
        weekends: number;
        feries: number;
        noel: number;
    };
    consultations: {
        total: number;
        matin: number;
        apresmidi: number;
    };
    astreintes: number;
    fatigue: {
        score: number;
        lastUpdate: Date;
    };
}

// Paramètres pour la génération du planning
export interface GenerationParameters {
    dateDebut: Date;
    dateFin: Date;
    etapesActives: AssignmentType[];
    conserverAffectationsExistantes: boolean;
    niveauOptimisation: 'rapide' | 'standard' | 'approfondi';
    seed?: number; // Pour la reproductibilité des résultats
    appliquerPreferencesPersonnelles: boolean;
    poidsEquite: number;
    poidsPreference: number;
    poidsQualiteVie: number;
}

// Résultat de validation du planning
export interface ValidationResult {
    valid: boolean;
    violations: RuleViolation[];
    metrics: {
        equiteScore: number;
        fatigueScore: number;
        satisfactionScore: number;
    };
} 