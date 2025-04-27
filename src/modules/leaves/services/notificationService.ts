import axios from 'axios';
import { Leave, LeaveStatus } from '../types/leave';
import { User } from '@/types/user';

/**
 * Service de notification pour les congés
 */
export class LeaveNotificationService {
    /**
     * Envoie une notification de demande de congé créée
     */
    static async notifyLeaveRequest(leave: Leave, requestor: User): Promise<void> {
        try {
            const recipientIds = await this.getApproverIds(requestor.id);

            if (!recipientIds.length) {
                console.warn(`Aucun approbateur trouvé pour la demande de congé de ${requestor.prenom} ${requestor.nom}`);
                return;
            }

            await axios.post('/api/notifications', {
                type: 'LEAVE_REQUEST',
                title: 'Nouvelle demande de congé',
                message: `${requestor.prenom} ${requestor.nom} a soumis une nouvelle demande de congé.`,
                referenceId: leave.id,
                referenceType: 'leave',
                recipientIds,
                priority: 'MEDIUM',
                actions: [
                    { label: 'Approuver', action: 'APPROVE', url: `/admin/leaves/${leave.id}/approve` },
                    { label: 'Refuser', action: 'REJECT', url: `/admin/leaves/${leave.id}/reject` },
                ]
            });
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification de demande de congé:', error);
        }
    }

    /**
     * Envoie une notification de statut de congé
     */
    static async notifyLeaveStatusUpdate(leave: Leave, updatedBy?: User): Promise<void> {
        try {
            const statusMessage = this.getStatusMessage(leave.status);
            const updatedByInfo = updatedBy ? ` par ${updatedBy.prenom} ${updatedBy.nom}` : '';

            await axios.post('/api/notifications', {
                type: 'LEAVE_STATUS_UPDATE',
                title: `Demande de congé ${statusMessage}`,
                message: `Votre demande de congé a été ${statusMessage}${updatedByInfo}.`,
                referenceId: leave.id,
                referenceType: 'leave',
                recipientIds: [leave.userId],
                priority: 'HIGH',
                actions: [
                    { label: 'Voir les détails', action: 'VIEW', url: `/leaves?id=${leave.id}` }
                ]
            });
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification de mise à jour de congé:', error);
        }
    }

    /**
     * Notifie d'un conflit potentiel de congés
     */
    static async notifyLeaveConflict(leave: Leave, conflictingLeaves: Leave[]): Promise<void> {
        try {
            const conflictingUsers = conflictingLeaves.map(l => l.user ? `${l.user.prenom} ${l.user.nom}` : 'Anonyme');

            // Récupérer les responsables du planning
            const schedulerIds = await this.getSchedulerManagerIds();

            if (!schedulerIds.length) {
                console.warn('Aucun gestionnaire de planning trouvé pour la notification de conflit');
                return;
            }

            await axios.post('/api/notifications', {
                type: 'LEAVE_CONFLICT',
                title: 'Conflit potentiel de congés',
                message: `Un conflit potentiel a été détecté avec une demande de congé. Personnes concernées: ${conflictingUsers.join(', ')}`,
                referenceId: leave.id,
                referenceType: 'leave_conflict',
                recipientIds: schedulerIds,
                priority: 'HIGH',
                actions: [
                    { label: 'Gérer le conflit', action: 'MANAGE', url: `/admin/leaves/conflicts?id=${leave.id}` }
                ]
            });
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification de conflit de congés:', error);
        }
    }

    /**
     * Envoie un rappel pour les congés à venir
     */
    static async sendLeaveReminder(leave: Leave, daysUntilStart: number): Promise<void> {
        try {
            await axios.post('/api/notifications', {
                type: 'LEAVE_REMINDER',
                title: 'Rappel de congé à venir',
                message: `Votre congé commence dans ${daysUntilStart} jour${daysUntilStart > 1 ? 's' : ''}.`,
                referenceId: leave.id,
                referenceType: 'leave',
                recipientIds: [leave.userId],
                priority: 'LOW',
                actions: [
                    { label: 'Voir les détails', action: 'VIEW', url: `/leaves?id=${leave.id}` }
                ]
            });
        } catch (error) {
            console.error('Erreur lors de l\'envoi du rappel de congé:', error);
        }
    }

    /**
     * Méthodes utilitaires
     */
    private static async getApproverIds(userId: string): Promise<string[]> {
        try {
            const response = await axios.get(`/api/users/${userId}/approvers`);
            return response.data.map((user: User) => user.id);
        } catch (error) {
            console.error('Erreur lors de la récupération des approbateurs:', error);
            return [];
        }
    }

    private static async getSchedulerManagerIds(): Promise<string[]> {
        try {
            const response = await axios.get('/api/users/roles/SCHEDULER_MANAGER');
            return response.data.map((user: User) => user.id);
        } catch (error) {
            console.error('Erreur lors de la récupération des gestionnaires de planning:', error);
            return [];
        }
    }

    private static getStatusMessage(status: LeaveStatus): string {
        switch (status) {
            case LeaveStatus.APPROVED:
                return 'approuvée';
            case LeaveStatus.REJECTED:
                return 'refusée';
            case LeaveStatus.CANCELLED:
                return 'annulée';
            case LeaveStatus.PENDING:
                return 'en attente';
            default:
                return status.toLowerCase();
        }
    }
} 