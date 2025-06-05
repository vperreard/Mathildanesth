/**
 * Types pour le système de notifications de congés
 * Ce fichier contient les définitions des types pour le système de notifications
 * spécifiques au module de congés.
 */

import { Leave, LeaveStatus } from './leave';
import { User } from '@/types/user';

/**
 * Types de priorités pour les notifications
 */
export enum NotificationPriority {
    LOW = 'LOW',       // Priorité basse
    MEDIUM = 'MEDIUM', // Priorité moyenne
    HIGH = 'HIGH',     // Priorité haute
    URGENT = 'URGENT'  // Priorité urgente
}

/**
 * Types de notifications liées aux congés
 */
export enum LeaveNotificationType {
    LEAVE_REQUEST = 'LEAVE_REQUEST',               // Nouvelle demande de congé
    LEAVE_STATUS_UPDATE = 'LEAVE_STATUS_UPDATE',   // Mise à jour du statut d'un congé
    LEAVE_REMINDER = 'LEAVE_REMINDER',             // Rappel de congé imminent
    LEAVE_APPROVAL_NEEDED = 'LEAVE_APPROVAL_NEEDED', // Approbation nécessaire
    LEAVE_CONFLICT = 'LEAVE_CONFLICT',             // Conflit détecté
    QUOTA_LOW = 'QUOTA_LOW',                       // Quota de congés presque épuisé
    QUOTA_UPDATE = 'QUOTA_UPDATE',                 // Mise à jour des quotas
}

/**
 * Interface pour les actions possibles sur une notification
 */
export interface NotificationAction {
    label: string;         // Libellé de l'action
    action: string;        // Identifiant de l'action
    url?: string;          // URL optionnelle pour l'action
    callback?: () => void; // Fonction callback optionnelle
}

/**
 * Interface de base pour toutes les notifications
 */
export interface BaseNotification {
    id: string;                           // Identifiant unique
    type: LeaveNotificationType;          // Type de notification
    title: string;                        // Titre
    message: string;                      // Message
    read: boolean;                        // État de lecture
    createdAt: Date;                      // Date de création
    priority: NotificationPriority;       // Priorité
    recipientId: string;                  // ID du destinataire
    actions?: NotificationAction[];       // Actions possibles
    imageUrl?: string;                    // URL d'image optionnelle
}

/**
 * Interface pour les notifications liées à une demande de congé
 */
export interface LeaveNotification extends BaseNotification {
    referenceId: string;                  // ID du congé référencé
    referenceType: 'leave';               // Type de référence
    leaveType?: string;                   // Type de congé (optionnel)
    leaveStatus?: LeaveStatus;            // Statut du congé (optionnel)
    senderName?: string;                  // Nom de l'expéditeur (optionnel)
}

/**
 * Interface pour la notification de conflit de congés
 */
export interface LeaveConflictNotification extends LeaveNotification {
    type: LeaveNotificationType.LEAVE_CONFLICT;
    conflictingLeaves: string[];          // IDs des congés en conflit
    conflictStartDate?: Date;             // Date de début du conflit
    conflictEndDate?: Date;               // Date de fin du conflit
}

/**
 * Interface pour la notification de rappel de congé
 */
export interface LeaveReminderNotification extends LeaveNotification {
    type: LeaveNotificationType.LEAVE_REMINDER;
    daysUntilStart: number;               // Jours avant le début du congé
}

/**
 * Interface pour la notification d'approbation nécessaire
 */
export interface LeaveApprovalNeededNotification extends LeaveNotification {
    type: LeaveNotificationType.LEAVE_APPROVAL_NEEDED;
    requestorName: string;                // Nom du demandeur
    deadline?: Date;                      // Date limite pour l'approbation
}

/**
 * Interface pour la notification de quota bas
 */
export interface QuotaLowNotification extends BaseNotification {
    type: LeaveNotificationType.QUOTA_LOW;
    remainingDays: number;                // Jours restants
    totalAllowance: number;               // Quota total
    year: number;                         // Année concernée
}

/**
 * Type union pour les différents types de notifications
 */
export type LeaveRelatedNotification =
    | LeaveNotification
    | LeaveConflictNotification
    | LeaveReminderNotification
    | LeaveApprovalNeededNotification
    | QuotaLowNotification;

/**
 * Interface pour l'événement de congé qui déclenche une notification
 */
export interface LeaveNotificationEvent {
    leave: Leave;
    updatedBy?: User;
    eventType: LeaveNotificationType;
    additionalData?: unknown;
}

/**
 * Configuration des notifications
 */
export interface NotificationConfig {
    reminderDays: number[];             // Jours avant le congé pour envoyer un rappel
    quotaThreshold: number;             // Seuil en pourcentage pour l'alerte de quota bas
    approvalReminder: number;           // Jours avant de renvoyer un rappel d'approbation
    enableEmailNotifications: boolean;  // Activer les notifications par email
    enablePushNotifications: boolean;   // Activer les notifications push
}

/**
 * État du système de notifications
 */
export interface NotificationState {
    notifications: LeaveRelatedNotification[];
    unreadCount: number;
    config: NotificationConfig;
    loading: boolean;
    error: string | null;
}

/**
 * Options de chargement des notifications
 */
export interface NotificationLoadOptions {
    unreadOnly?: boolean;   // Uniquement les notifications non lues
    limit?: number;         // Nombre maximum de notifications à récupérer
    offset?: number;        // Index de départ pour la pagination
    types?: LeaveNotificationType[]; // Types de notifications à récupérer
} 