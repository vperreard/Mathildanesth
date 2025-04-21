import { Leave, LeaveStatus } from './leave';
import { LeaveConflict } from './conflict';
import { User } from '../../../types/user';

/**
 * Types d'actions de workflow
 */
export enum WorkflowActionType {
    SUBMIT = 'SUBMIT',               // Soumettre une demande
    APPROVE = 'APPROVE',             // Approuver une demande
    REJECT = 'REJECT',               // Rejeter une demande
    CANCEL = 'CANCEL',               // Annuler une demande
    REQUEST_CHANGES = 'REQUEST_CHANGES',  // Demander des modifications
    COMMENT = 'COMMENT'              // Ajouter un commentaire
}

/**
 * Action de workflow
 */
export interface WorkflowAction {
    id: string;
    leaveId: string;
    leave?: Leave;

    // Type d'action
    type: WorkflowActionType;

    // Utilisateur qui effectue l'action
    userId: string;
    user?: User;

    // Statut avant et après l'action
    fromStatus: LeaveStatus;
    toStatus: LeaveStatus;

    // Commentaire
    comment?: string;

    // Conflits résolus
    resolvedConflicts?: LeaveConflict[];

    // Métadonnées
    createdAt: Date;
}

/**
 * Historique complet d'une demande
 */
export interface LeaveHistory {
    leave: Leave;
    actions: WorkflowAction[];
    conflicts: LeaveConflict[];
}

/**
 * Notification de workflow
 */
export interface WorkflowNotification {
    id: string;
    leaveId: string;
    leave?: Leave;

    // Type de notification (basé sur l'action)
    actionType: WorkflowActionType;

    // Utilisateur destinataire
    recipientId: string;
    recipient?: User;

    // Utilisateur qui a effectué l'action
    actorId: string;
    actor?: User;

    // Contenu de la notification
    title: string;
    message: string;

    // Statut de la notification
    read: boolean;
    readAt?: Date;

    // Métadonnées
    createdAt: Date;
}

/**
 * Règles de workflow
 */
export interface WorkflowRules {
    // Délai minimum avant le début du congé (en jours)
    minRequestLeadTime: number;

    // Durée maximale d'un congé (en jours)
    maxLeaveDuration: number;

    // Nombre maximum de jours de congés consécutifs
    maxConsecutiveLeaves: number;

    // Rôles autorisés à approuver les congés
    approverRoles: string[];

    // Autorisations spéciales par type de congé
    leaveTypePermissions: {
        [leaveType: string]: {
            minRequestLeadTime?: number;
            maxDuration?: number;
            approverRoles?: string[];
            autoApprove?: boolean;
        };
    };
} 