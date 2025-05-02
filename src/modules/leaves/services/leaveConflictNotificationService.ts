import { LeaveConflict, ConflictType, ConflictSeverity } from '../types/conflict';
import { EmailService } from '../../notifications/services/emailService';
import { NotificationService } from '../../notifications/services/notificationService';
import { TranslationService } from '../../i18n/services/translationService';

interface NotificationTemplate {
    title: string;
    message: string;
    icon?: string;
    color?: string;
}

export class LeaveConflictNotificationService {
    private emailService: EmailService;
    private notificationService: NotificationService;
    private translationService: TranslationService;

    constructor(
        emailService: EmailService,
        notificationService: NotificationService,
        translationService: TranslationService
    ) {
        this.emailService = emailService;
        this.notificationService = notificationService;
        this.translationService = translationService;
    }

    /**
     * Génère une notification formatée pour un conflit spécifique
     * @param conflict Le conflit pour lequel générer la notification
     * @param locale La locale à utiliser pour la traduction
     * @returns Template de notification formaté
     */
    public generateNotificationTemplate(
        conflict: LeaveConflict,
        locale: string = 'fr'
    ): NotificationTemplate {
        // Utiliser le service de traduction pour les messages
        const t = (key: string, params?: Record<string, any>) =>
            this.translationService.translate(key, locale, params);

        // Informations de base pour tous les types de notifications
        let title = '';
        let message = '';
        let icon = '';
        let color = '';

        // Configurer l'apparence en fonction de la sévérité
        switch (conflict.severity) {
            case ConflictSeverity.BLOQUANT:
                icon = 'error';
                color = 'error';
                break;
            case ConflictSeverity.AVERTISSEMENT:
                icon = 'warning';
                color = 'warning';
                break;
            case ConflictSeverity.INFORMATION:
                icon = 'info';
                color = 'info';
                break;
        }

        // Personnaliser le message en fonction du type de conflit
        switch (conflict.type) {
            case ConflictType.USER_LEAVE_OVERLAP:
                title = t('leaves.conflicts.overlap.title');
                message = t('leaves.conflicts.overlap.message', {
                    startDate: conflict.startDate,
                    endDate: conflict.endDate
                });
                break;

            case ConflictType.TEAM_ABSENCE:
                title = t('leaves.conflicts.team_absence.title');
                message = t('leaves.conflicts.team_absence.message', {
                    description: conflict.description
                });
                break;

            case ConflictType.CRITICAL_ROLE:
                title = t('leaves.conflicts.critical_role.title');
                message = t('leaves.conflicts.critical_role.message', {
                    description: conflict.description
                });
                break;

            case ConflictType.DEADLINE_PROXIMITY:
                title = t('leaves.conflicts.deadline.title');
                message = t('leaves.conflicts.deadline.message', {
                    description: conflict.description
                });
                break;

            case ConflictType.HOLIDAY_PROXIMITY:
                title = t('leaves.conflicts.holiday.title');
                message = t('leaves.conflicts.holiday.message', {
                    description: conflict.description
                });
                break;

            case ConflictType.RECURRING_MEETING:
                title = t('leaves.conflicts.meeting.title');
                message = t('leaves.conflicts.meeting.message', {
                    description: conflict.description
                });
                break;

            case ConflictType.HIGH_WORKLOAD:
                title = t('leaves.conflicts.high_workload.title');
                message = t('leaves.conflicts.high_workload.message', {
                    description: conflict.description
                });
                break;

            default:
                title = t('leaves.conflicts.generic.title');
                message = conflict.description;
        }

        // Si les titres/messages ne sont pas traduits, utiliser la description brute
        if (!title || title.includes('leaves.conflicts')) {
            title = `Conflit de congés: ${conflict.type}`;
        }

        if (!message || message.includes('leaves.conflicts')) {
            message = conflict.description;
        }

        return { title, message, icon, color };
    }

    /**
     * Envoie une notification par email pour un conflit
     * @param conflict Le conflit à notifier
     * @param userIds IDs des utilisateurs à notifier
     * @param locale Locale à utiliser pour la notification
     * @returns Promise<boolean> Succès de l'envoi
     */
    public async sendEmailNotification(
        conflict: LeaveConflict,
        userIds: string[],
        locale: string = 'fr'
    ): Promise<boolean> {
        try {
            const template = this.generateNotificationTemplate(conflict, locale);

            // Pour chaque utilisateur concerné
            for (const userId of userIds) {
                await this.emailService.sendEmail({
                    to: userId,
                    subject: template.title,
                    body: template.message,
                    templateId: 'leave-conflict-notification',
                    data: {
                        conflictType: conflict.type,
                        severity: conflict.severity,
                        startDate: conflict.startDate,
                        endDate: conflict.endDate,
                        description: conflict.description,
                        canOverride: conflict.canOverride
                    }
                });
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email de notification de conflit:', error);
            return false;
        }
    }

    /**
     * Envoie une notification dans l'interface pour un conflit
     * @param conflict Le conflit à notifier
     * @param userIds IDs des utilisateurs à notifier 
     * @param locale Locale à utiliser pour la notification
     * @returns Promise<boolean> Succès de l'envoi
     */
    public async sendUINotification(
        conflict: LeaveConflict,
        userIds: string[],
        locale: string = 'fr'
    ): Promise<boolean> {
        try {
            const template = this.generateNotificationTemplate(conflict, locale);

            // Pour chaque utilisateur concerné
            for (const userId of userIds) {
                await this.notificationService.createNotification({
                    userId,
                    title: template.title,
                    message: template.message,
                    type: 'leave-conflict',
                    severity: this.mapSeverityToNotificationType(conflict.severity),
                    data: {
                        conflictId: conflict.id,
                        leaveId: conflict.leaveId,
                        conflictType: conflict.type,
                        startDate: conflict.startDate,
                        endDate: conflict.endDate,
                        canOverride: conflict.canOverride
                    },
                    actions: this.getNotificationActions(conflict)
                });
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification UI pour un conflit:', error);
            return false;
        }
    }

    /**
     * Mappe la sévérité du conflit vers un type de notification
     * @param severity Sévérité du conflit
     * @returns Type de notification correspondant
     */
    private mapSeverityToNotificationType(severity: ConflictSeverity): string {
        switch (severity) {
            case ConflictSeverity.BLOQUANT:
                return 'error';
            case ConflictSeverity.AVERTISSEMENT:
                return 'warning';
            case ConflictSeverity.INFORMATION:
                return 'info';
            default:
                return 'info';
        }
    }

    /**
     * Génère les actions disponibles pour une notification de conflit
     * @param conflict Le conflit concerné
     * @returns Actions disponibles pour la notification
     */
    private getNotificationActions(conflict: LeaveConflict): any[] {
        const actions = [
            {
                label: 'Voir les détails',
                action: 'VIEW_CONFLICT',
                url: `/leaves/conflicts/${conflict.leaveId}`
            }
        ];

        // Ajouter l'action d'ignorance si le conflit peut être ignoré
        if (conflict.canOverride) {
            actions.push({
                label: 'Ignorer',
                action: 'OVERRIDE_CONFLICT',
                payload: { conflictId: conflict.id }
            });
        }

        return actions;
    }

    /**
     * Notifie tous les utilisateurs concernés par un conflit (UI et email)
     * @param conflict Le conflit à notifier
     * @param additionalUserIds Utilisateurs supplémentaires à notifier
     * @param locale Locale à utiliser
     * @returns Promise<boolean> Succès de l'opération
     */
    public async notifyConflict(
        conflict: LeaveConflict,
        additionalUserIds: string[] = [],
        locale: string = 'fr'
    ): Promise<boolean> {
        // Déterminer tous les utilisateurs à notifier
        const affectedUserIds = conflict.affectedUserIds || [];
        const allUserIds = [...new Set([...affectedUserIds, ...additionalUserIds])];

        if (allUserIds.length === 0) {
            console.warn('Aucun utilisateur à notifier pour le conflit:', conflict.id);
            return false;
        }

        try {
            // Envoyer les notifications UI et email
            await Promise.all([
                this.sendUINotification(conflict, allUserIds, locale),
                this.sendEmailNotification(conflict, allUserIds, locale)
            ]);

            return true;
        } catch (error) {
            console.error('Erreur lors de la notification du conflit:', error);
            return false;
        }
    }

    /**
     * Notifie tous les utilisateurs concernés par un ensemble de conflits
     * @param conflicts Liste des conflits à notifier
     * @param additionalUserIds Utilisateurs supplémentaires à notifier pour tous les conflits
     * @param locale Locale à utiliser
     * @returns Promise<boolean> Succès de l'opération
     */
    public async notifyConflicts(
        conflicts: LeaveConflict[],
        additionalUserIds: string[] = [],
        locale: string = 'fr'
    ): Promise<boolean> {
        try {
            const results = await Promise.all(
                conflicts.map(conflict =>
                    this.notifyConflict(conflict, additionalUserIds, locale)
                )
            );

            return results.every(result => result);
        } catch (error) {
            console.error('Erreur lors de la notification des conflits:', error);
            return false;
        }
    }
} 