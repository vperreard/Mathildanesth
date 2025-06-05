import { NotificationType } from '@prisma/client';
import { logger } from "./logger";
import { createNotification } from '@/lib/notifications';

/**
 * Types d'événements pour les échanges d'affectations
 */
export enum AssignmentSwapEventType {
    SWAP_REQUESTED = 'SWAP_REQUESTED',        // Demande d'échange initiée
    SWAP_ACCEPTED = 'SWAP_ACCEPTED',          // Demande d'échange acceptée
    SWAP_REJECTED = 'SWAP_REJECTED',          // Demande d'échange refusée
    SWAP_CANCELLED = 'SWAP_CANCELLED',        // Demande d'échange annulée
    SWAP_COMPLETED = 'SWAP_COMPLETED',        // Échange finalisé
    SWAP_ADMIN_APPROVED = 'SWAP_ADMIN_APPROVED', // Approuvé par un administrateur
    SWAP_ADMIN_REJECTED = 'SWAP_ADMIN_REJECTED'  // Rejeté par un administrateur
}

/**
 * Configuration des messages et types pour chaque événement d'échange
 */
interface SwapNotificationConfig {
    message: string;
    type: NotificationType;
}

const swapNotificationConfigs: Record<AssignmentSwapEventType, SwapNotificationConfig> = {
    [AssignmentSwapEventType.SWAP_REQUESTED]: {
        message: 'Nouvelle demande d\'échange d\'affectation reçue',
        type: NotificationType.ASSIGNMENT_SWAP_REQUEST_RECEIVED
    },
    [AssignmentSwapEventType.SWAP_ACCEPTED]: {
        message: 'Votre demande d\'échange d\'affectation a été acceptée',
        type: NotificationType.ASSIGNMENT_SWAP_REQUEST_ACCEPTED
    },
    [AssignmentSwapEventType.SWAP_REJECTED]: {
        message: 'Votre demande d\'échange d\'affectation a été refusée',
        type: NotificationType.ASSIGNMENT_SWAP_REQUEST_REJECTED
    },
    [AssignmentSwapEventType.SWAP_CANCELLED]: {
        message: 'Une demande d\'échange d\'affectation a été annulée',
        type: NotificationType.ASSIGNMENT_SWAP_REQUEST_CANCELLED
    },
    [AssignmentSwapEventType.SWAP_COMPLETED]: {
        message: 'L\'échange d\'affectation a été finalisé avec succès',
        type: NotificationType.ASSIGNMENT_SWAP_REQUEST_ACCEPTED
    },
    [AssignmentSwapEventType.SWAP_ADMIN_APPROVED]: {
        message: 'Votre demande d\'échange a été approuvée par un administrateur',
        type: NotificationType.ASSIGNMENT_SWAP_REQUEST_APPROVED_ADMIN
    },
    [AssignmentSwapEventType.SWAP_ADMIN_REJECTED]: {
        message: 'Votre demande d\'échange a été rejetée par un administrateur',
        type: NotificationType.GENERAL_INFO
    }
};

/**
 * Envoie une notification liée à un échange d'affectation
 * 
 * @param userId ID de l'utilisateur destinataire
 * @param eventType Type d'événement d'échange
 * @param swapRequestId ID de la demande d'échange
 * @param triggeredByUserId ID de l'utilisateur à l'origine de l'action
 * @param customMessage Message personnalisé (optionnel)
 * @returns L'objet notification créé ou null en cas d'erreur
 */
export async function sendAssignmentSwapNotification(
    userId: number,
    eventType: AssignmentSwapEventType,
    swapRequestId: string,
    triggeredByUserId?: number,
    customMessage?: string
) {
    try {
        const config = swapNotificationConfigs[eventType];

        // Si le type d'événement n'est pas configuré, utiliser GENERAL_INFO par défaut
        if (!config) {
            logger.warn(`Type d'événement non configuré: ${eventType}`);
            return null;
        }

        // Génération du lien vers la demande d'échange
        const link = `/affectations/echanges/${swapRequestId}`;

        // Création et envoi de la notification
        return await createNotification({
            userId,
            type: config.type,
            message: customMessage || config.message,
            link,
            triggeredByUserId,
            relatedRequestId: swapRequestId
        });

    } catch (error) {
        logger.error('Erreur lors de l\'envoi de la notification d\'échange d\'affectation:', error);
        return null;
    }
}

/**
 * Envoie des notifications à plusieurs utilisateurs pour un même événement
 * 
 * @param userIds Liste des IDs des utilisateurs destinataires
 * @param eventType Type d'événement d'échange
 * @param swapRequestId ID de la demande d'échange
 * @param triggeredByUserId ID de l'utilisateur à l'origine de l'action
 * @param customMessage Message personnalisé (optionnel)
 * @returns Un tableau des notifications créées
 */
export async function sendAssignmentSwapNotificationToMany(
    userIds: number[],
    eventType: AssignmentSwapEventType,
    swapRequestId: string,
    triggeredByUserId?: number,
    customMessage?: string
) {
    const notifications = [];

    for (const userId of userIds) {
        const notification = await sendAssignmentSwapNotification(
            userId,
            eventType,
            swapRequestId,
            triggeredByUserId,
            customMessage
        );

        if (notification) {
            notifications.push(notification);
        }
    }

    return notifications;
} 