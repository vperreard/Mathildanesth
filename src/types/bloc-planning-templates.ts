/**
 * Types pour les trames de planning du bloc opératoire
 */
import { BlocSupervisor } from './bloc-planning-types';

/**
 * Statut d'une trame
 */
export type TemplateStatus = 'BROUILLON' | 'PUBLIE' | 'ARCHIVE';

/**
 * Type de trame
 */
export type TemplateType = 'STANDARD' | 'VACANCES' | 'WEEKEND' | 'PERSONNALISE';

/**
 * Pattern d'application de la trame
 */
export type TemplatePattern = 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'MENSUEL' | 'SPECIFIQUE';

/**
 * Affectation de superviseur dans une trame
 */
export interface TemplateSupervisorAssignment {
    role: string;
    userId?: string; // Optionnel car peut être un rôle sans utilisateur spécifique
    periodes: {
        debut: string;
        fin: string;
    }[];
}

/**
 * Affectation de salle dans une trame
 */
export interface TemplateRoomAssignment {
    salleId: string;
    superviseurs: TemplateSupervisorAssignment[];
}

/**
 * Trame de planning pour le bloc opératoire
 */
export interface BlocPlanningTemplate {
    id: string;
    nom: string;
    description?: string;
    type: TemplateType;
    pattern: TemplatePattern;
    status: TemplateStatus;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    salles: TemplateRoomAssignment[];
    jours?: number[]; // Jours de la semaine (1-7) pour les trames hebdomadaires
    dates?: string[]; // Dates spécifiques pour les trames de type SPECIFIQUE
    estActif: boolean;
}

/**
 * Application d'une trame à un planning
 */
export interface TemplateApplication {
    templateId: string;
    dateDebut: string;
    dateFin: string;
    joursInclus?: number[]; // Optionnel, pour filtrer certains jours
    sallesIncluses?: string[]; // Optionnel, pour filtrer certaines salles
}

/**
 * Résultat de l'application d'une trame
 */
export interface TemplateApplicationResult {
    success: boolean;
    planningsAffectes: string[]; // Dates des plannings affectés
    conflicts?: {
        date: string;
        salleId: string;
        description: string;
    }[];
    error?: string;
} 