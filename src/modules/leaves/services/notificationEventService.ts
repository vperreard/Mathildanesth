import { Leave, LeaveStatus } from '../types/leave';
import { logger } from "../../../lib/logger";
import { User } from '@/types/user';
import {
    LeaveNotificationType,
    LeaveNotificationEvent,
    NotificationConfig,
    NotificationPriority
} from '../types/notification';
import { leaveNotificationService } from './notificationService';

/**
 * Service de gestion des événements pour les notifications de congés
 * Ce service permet de réagir aux événements liés aux congés pour
 * déclencher automatiquement les notifications appropriées.
 */
export class NotificationEventService {
    private static instance: NotificationEventService;
    private config: NotificationConfig;

    /**
     * Obtenir l'instance du service (Singleton)
     */
    public static getInstance(): NotificationEventService {
        if (!NotificationEventService.instance) {
            NotificationEventService.instance = new NotificationEventService();
        }
        return NotificationEventService.instance;
    }

    private constructor() {
        // Charger la configuration initiale
        this.config = {
            reminderDays: [1, 3, 7],
            quotaThreshold: 20,
            approvalReminder: 2,
            enableEmailNotifications: true,
            enablePushNotifications: true
        };
    }

    /**
     * Met à jour la configuration des notifications
     */
    public updateConfig(config: Partial<NotificationConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Gère un événement de création de demande de congé
     */
    public async handleLeaveCreated(leave: Leave, creator: User): Promise<void> {
        // Notification à l'approbateur
        await leaveNotificationService.notifyLeaveRequest(leave, creator);
    }

    /**
     * Gère un événement de mise à jour de statut de congé
     */
    public async handleLeaveStatusChanged(leave: Leave, updatedBy?: User): Promise<void> {
        // Notification au demandeur
        await leaveNotificationService.notifyLeaveStatusUpdate(leave, updatedBy);
    }

    /**
     * Gère un événement de conflit de congés
     */
    public async handleLeaveConflict(leave: Leave, conflictingLeaves: Leave[]): Promise<void> {
        // Notification aux gestionnaires de planning
        await leaveNotificationService.notifyLeaveConflict(leave, conflictingLeaves);
    }

    /**
     * Gère un événement de mise à jour de quota
     */
    public async handleQuotaUpdated(userId: string, remainingDays: number, totalAllowance: number, year: number): Promise<void> {
        // Vérifier si le quota est faible
        const percentage = (remainingDays / totalAllowance) * 100;
        if (percentage <= this.config.quotaThreshold) {
            await leaveNotificationService.notifyQuotaLow(userId, remainingDays, totalAllowance, year);
        }
    }

    /**
     * Vérifie les congés à venir et envoie des rappels
     * Cette fonction est généralement appelée par un job récurrent (CRON)
     */
    public async checkUpcomingLeaves(leaves: Leave[]): Promise<void> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const leave of leaves) {
            if (leave.status !== LeaveStatus.APPROVED) continue;

            const startDate = new Date(leave.startDate);
            startDate.setHours(0, 0, 0, 0);

            const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            // Vérifier si on doit envoyer un rappel aujourd'hui
            if (this.config.reminderDays.includes(daysUntilStart)) {
                await leaveNotificationService.sendLeaveReminder(leave, daysUntilStart);
            }
        }
    }

    /**
     * Récupère les IDs des approbateurs pour un utilisateur donné
     * Méthode utilitaire
     */
    private async getApproverIds(userId: string): Promise<string[]> {
        try {
            const response = await fetch(`http://localhost:3000/api/utilisateurs/${userId}/approvers`);
            const data = await response.json();
            return data.map((user: User) => user.id);
        } catch (error: unknown) {
            logger.error('Erreur lors de la récupération des approbateurs:', error instanceof Error ? error : new Error(String(error)));
            return [];
        }
    }

    /**
     * Vérifie les demandes en attente et envoie des rappels d'approbation
     * Cette fonction est généralement appelée par un job récurrent (CRON)
     */
    public async checkPendingApprovals(leaves: Leave[]): Promise<void> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const leave of leaves) {
            if (leave.status !== LeaveStatus.PENDING) continue;

            const requestDate = new Date(leave.requestDate);
            const daysSinceRequest = Math.floor((today.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));

            // Envoyer un rappel tous les X jours (selon la configuration)
            if (daysSinceRequest > 0 && daysSinceRequest % this.config.approvalReminder === 0) {
                // Trouver les approbateurs (en utilisant notre méthode utilitaire)
                const approverIds = await this.getApproverIds(leave.userId);

                // Envoyer un rappel à chaque approbateur
                for (const approverId of approverIds) {
                    await leaveNotificationService.sendNotification({
                        type: LeaveNotificationType.LEAVE_APPROVAL_NEEDED,
                        title: 'Rappel: Demande de congé en attente',
                        message: `Une demande de congé attend votre approbation depuis ${daysSinceRequest} jour${daysSinceRequest > 1 ? 's' : ''}.`,
                        recipientId: approverId,
                        priority: daysSinceRequest > 5 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
                        referenceId: leave.id,
                        referenceType: 'leave',
                        requestorName: leave.user ? `${leave.user.prenom} ${leave.user.nom}` : 'Utilisateur inconnu',
                        actions: [
                            { label: 'Approuver', action: 'APPROVE', url: `/admin/conges/${leave.id}/approve` },
                            { label: 'Refuser', action: 'REJECT', url: `/admin/conges/${leave.id}/reject` }
                        ]
                    });
                }
            }
        }
    }

    /**
     * Traite un événement de notification
     * Point d'entrée principal pour tous les événements liés aux congés
     */
    public async processEvent(event: LeaveNotificationEvent): Promise<void> {
        switch (event.eventType) {
            case LeaveNotificationType.LEAVE_REQUEST:
                await this.handleLeaveCreated(event.leave, event.updatedBy!);
                break;

            case LeaveNotificationType.LEAVE_STATUS_UPDATE:
                await this.handleLeaveStatusChanged(event.leave, event.updatedBy);
                break;

            case LeaveNotificationType.LEAVE_CONFLICT:
                if (event.additionalData?.conflictingLeaves) {
                    await this.handleLeaveConflict(event.leave, event.additionalData.conflictingLeaves);
                }
                break;

            case LeaveNotificationType.QUOTA_LOW:
                if (event.additionalData?.quota) {
                    const { remainingDays, totalAllowance, year } = event.additionalData.quota;
                    await this.handleQuotaUpdated(
                        event.leave.userId,
                        remainingDays,
                        totalAllowance,
                        year
                    );
                }
                break;

            default:
                logger.warn(`Type d'événement non géré: ${event.eventType}`);
        }
    }
}

// Exporter l'instance singleton
export const notificationEventService = NotificationEventService.getInstance(); 