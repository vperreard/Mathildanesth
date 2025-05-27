/**
 * Types pour le glisser-déposer dans le planning du bloc opératoire
 */
import { BlocSupervisor } from './bloc-planning-types';

/**
 * Type de l'élément glissé
 */
export type DragItemType = 'SUPERVISEUR' | 'PERIODE' | 'PLANNING_TEMPLATE';

/**
 * Interface pour un élément glissable de type superviseur
 */
export interface SupervisorDragItem {
    type: 'SUPERVISEUR';
    id: string;
    userId: string;
    nom: string;
    prenom: string;
    role: string;
    couleur?: string;
    estDisponible: boolean;
}

/**
 * Interface pour un élément glissable de type période
 */
export interface PeriodDragItem {
    type: 'PERIODE';
    id: string;
    superviseurId: string;
    debut: string;
    fin: string;
    salleId?: string;
}

/**
 * Interface pour un élément glissable de type template de planning
 */
export interface PlanningTemplateDragItem {
    type: 'PLANNING_TEMPLATE';
    id: string;
    nom: string;
    affectations: {
        salleId: string;
        superviseurs: Omit<BlocSupervisor, 'id'>[];
    }[];
}

/**
 * Union type pour tous les types d'éléments glissables
 */
export type DragItem = SupervisorDragItem | PeriodDragItem | PlanningTemplateDragItem;

/**
 * Interface pour la cible du drop
 */
export interface DropTarget {
    type: 'SALLE' | 'PERIODE' | 'PLANNING';
    id: string;
    salleId?: string;
    date?: string;
    debut?: string;
    fin?: string;
}

/**
 * Résultat d'une opération de glisser-déposer
 */
export interface DragDropResult {
    success: boolean;
    item: DragItem;
    target: DropTarget;
    newAssignment?: {
        salleId: string;
        superviseurId: string;
        debut: string;
        fin: string;
    };
    error?: string;
} 