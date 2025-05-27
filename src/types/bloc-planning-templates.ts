/**
 * Types pour les tableaux de service de planning du bloc opératoire
 */
import { BlocSupervisor } from './bloc-planning-types';

/**
 * Statut d'une tableau de service
 */
export type TemplateStatus = 'BROUILLON' | 'PUBLIE' | 'ARCHIVE';

/**
 * Type de tableau de service
 */
export type TemplateType = 'STANDARD' | 'VACANCES' | 'WEEKEND' | 'PERSONNALISE';

/**
 * Pattern d'application de la tableau de service
 */
export type TemplatePattern = 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'MENSUEL' | 'SPECIFIQUE';

/**
 * Garde/Vacation de superviseur dans une tableau de service
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
 * Garde/Vacation de salle dans une tableau de service
 */
export interface TemplateRoomAssignment {
    salleId: string;
    superviseurs: TemplateSupervisorAssignment[];
}

/**
 * Tableau de service de planning pour le bloc opératoire
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
    jours?: number[]; // Jours de la semaine (1-7) pour les tableaux de service hebdomadaires
    dates?: string[]; // Dates spécifiques pour les tableaux de service de type SPECIFIQUE
    estActif: boolean;
}

/**
 * Application d'une tableau de service à un planning
 */
export interface TemplateApplication {
    templateId: string;
    dateDebut: string;
    dateFin: string;
    joursInclus?: number[]; // Optionnel, pour filtrer certains jours
    sallesIncluses?: string[]; // Optionnel, pour filtrer certaines salles
}

/**
 * Résultat de l'application d'une tableau de service
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