// src/types/assignment.ts

import { RuleSeverity } from './rules';
import { ShiftType } from './common';
import { ActivityType, ActivityCategory, Period } from './activityTypes';

// Type d'affectation - Compatible avec ActivityCategory
export enum AssignmentType {
    GARDE = 'GARDE',
    ASTREINTE = 'ASTREINTE',
    CONSULTATION = 'CONSULTATION',
    BLOC = 'BLOC_OPERATOIRE'
}

/**
 * Représente une affectation de garde pour un médecin
 */
export interface Attribution {
    /** Identifiant unique de l'affectation */
    id: string;
    /** ID du médecin assigné */
    userId: string;
    /** Type de garde (jour, nuit, etc.) */
    shiftType: ShiftType;
    /** Date de début de la garde */
    startDate: Date;
    /** Date de fin de la garde */
    endDate: Date;
    /** État de l'affectation */
    status: AssignmentStatus;
    /** Date de création de l'affectation */
    createdAt: Date;
    /** Date de dernière mise à jour de l'affectation */
    updatedAt: Date;
    /** Commentaires supplémentaires */
    notes?: string;
    /** ID de l'utilisateur qui a validé l'affectation */
    validatedBy?: string;
    /** Date de validation de l'affectation */
    validatedAt?: Date;
    /** Raison de rejet de l'affectation */
    rejectionReason?: string;
    /** Raison de annulation de l'affectation */
    cancellationReason?: string;
}

/**
 * Interface moderne pour les affectations avec séparation ActivityType/Sector
 * Remplace progressivement l'interface Attribution legacy
 */
export interface Assignment {
    /** Identifiant unique de l'affectation */
    id: string;
    /** Date de l'affectation */
    date: Date;
    /** ID de l'utilisateur assigné */
    userId?: number;
    /** Nom du chirurgien (legacy field) */
    chirurgien?: string;
    /** Nom de la salle (legacy field) */
    salle?: string;
    /** Référence au type d'activité */
    activityTypeId?: string;
    /** Type de l'affectation (legacy field) */
    type?: string;
    /** Statut de l'affectation */
    statut?: string;
    /** Heure de début */
    heureDebut?: string;
    /** Heure de fin */
    heureFin?: string;
    /** Notes supplémentaires */
    notes?: string;
    /** ID de la spécialité */
    specialtyId?: number;
    /** ID du site */
    siteId?: string;
    /** ID de la salle d'opération */
    operatingRoomId?: number;
    /** ID du chirurgien */
    surgeonId?: number;
    /** ID de l'affectation régulière source */
    regularAssignmentId?: number;
    /** ID du lieu */
    locationId?: number;
    /** Période (matin, après-midi, journée) */
    period?: Period;
    /** Date de création */
    createdAt: Date;
    /** Date de mise à jour */
    updatedAt: Date;
    
    // Relations
    /** Type d'activité (garde, consultation, etc.) */
    activityType?: ActivityType;
    /** Utilisateur assigné */
    user?: unknown; // Type User à définir selon le contexte
    /** Chirurgien assigné */
    surgeon?: unknown; // Type Surgeon à définir selon le contexte
    /** Spécialité */
    specialty?: unknown; // Type Specialty à définir selon le contexte
    /** Site */
    site?: unknown; // Type Site à définir selon le contexte
    /** Salle d'opération */
    operatingRoom?: unknown; // Type OperatingRoom à définir selon le contexte
}

/**
 * États possibles d'une affectation
 */
export enum AssignmentStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED'
}

/**
 * Représente un planning complet d'affectations
 */
export interface PlanningMedical {
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
    attributions: Attribution[];
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
    resolutionOptions?: ResolutionOption[];
}

// Option de résolution de conflit
export interface ResolutionOption {
    description: string;
    impact: number; // Score d'impact négatif (0-100)
    action: () => void;
}

// Compteurs de fatigue et d'équité
export interface UserCounter {
    userId: string;
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
    astreintes: {
        total: number;         // Nouveau: Total astreintes
        semaine: number;       // Nouveau: Astreintes en semaine
        weekendFeries: number; // Nouveau: Astreintes weekend/férié
    };
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