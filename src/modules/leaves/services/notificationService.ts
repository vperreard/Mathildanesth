import axios from 'axios';
import { Leave, LeaveStatus } from '../types/leave';
import { User } from '@/types/user';
import {
    LeaveNotificationType,
    NotificationPriority,
    LeaveRelatedNotification,
    NotificationAction,
    BaseNotification,
    LeaveNotification,
    LeaveConflictNotification,
    LeaveReminderNotification,
    NotificationConfig,
    NotificationLoadOptions
} from '../types/notification';

/**
 * Configuration par défaut des notifications
 */
const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
    reminderDays: [1, 3, 7], // Rappels à 1, 3 et 7 jours avant le congé
    quotaThreshold: 20,      // Alerte quand il reste 20% des congés
    approvalReminder: 2,     // Rappel d'approbation tous les 2 jours
    enableEmailNotifications: true,
    enablePushNotifications: true
};

/**
 * Configuration par défaut pour le chargement paginé
 */
const DEFAULT_PAGINATION = {
    limit: 20,
    offset: 0
};

/**
 * Résultat paginé des notifications
 */
export interface PaginatedNotificationsResult {
    notifications: LeaveRelatedNotification[];
    totalCount: number;
    unreadCount: number;
    hasMore: boolean;
    nextOffset?: number;
}

/**
 * Gestionnaire d'événements pour les notifications
 */
type NotificationEventHandler = (notification: LeaveRelatedNotification) => void;

/**
 * Service de notification pour les congés
 */
export class NotificationService {
    private static instance: NotificationService;
    private eventHandlers: Map<string, Set<NotificationEventHandler>> = new Map();
    private config: NotificationConfig = DEFAULT_NOTIFICATION_CONFIG;

    // Cache de notifications
    private notificationsCache: Map<string, {
        data: PaginatedNotificationsResult,
        timestamp: number
    }> = new Map();

    // Durée de validité du cache (5 minutes)
    private cacheTTL: number = 5 * 60 * 1000;

    /**
     * Obtenir l'instance du service (Singleton)
     */
    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    /**
     * Initialiser le service
     */
    private constructor() {
        // Chargement de la configuration depuis le serveur ou localStorage
        this.loadConfig();
    }

    /**
     * Charger la configuration
     */
    private async loadConfig(): Promise<void> {
        try {
            // Essayer de charger depuis le serveur
            const response = await axios.get('/api/notifications/config');
            this.config = { ...DEFAULT_NOTIFICATION_CONFIG, ...response.data };
        } catch (error) {
            // Fallback: utiliser localStorage
            const storedConfig = localStorage.getItem('notificationConfig');
            if (storedConfig) {
                try {
                    this.config = { ...DEFAULT_NOTIFICATION_CONFIG, ...JSON.parse(storedConfig) };
                } catch (e) {
                    console.error('Erreur lors du chargement de la configuration:', e);
                    this.config = DEFAULT_NOTIFICATION_CONFIG;
                }
            }
        }
    }

    /**
     * Mettre à jour la configuration
     */
    public async updateConfig(config: Partial<NotificationConfig>): Promise<void> {
        this.config = { ...this.config, ...config };

        try {
            // Enregistrer côté serveur
            await axios.post('/api/notifications/config', this.config);

            // Sauvegarder dans localStorage comme fallback
            localStorage.setItem('notificationConfig', JSON.stringify(this.config));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la configuration:', error);
        }
    }

    /**
     * S'abonner aux événements de notification
     */
    public subscribe(type: LeaveNotificationType | string, handler: NotificationEventHandler): () => void {
        if (!this.eventHandlers.has(type)) {
            this.eventHandlers.set(type, new Set());
        }

        this.eventHandlers.get(type)!.add(handler);

        return () => {
            const handlers = this.eventHandlers.get(type);
            if (handlers) {
                handlers.delete(handler);
            }
        };
    }

    /**
     * Émettre un événement de notification
     */
    private emitEvent(type: LeaveNotificationType | string, notification: LeaveRelatedNotification): void {
        // Notifier les handlers spécifiques au type
        const handlers = this.eventHandlers.get(type);
        if (handlers) {
            handlers.forEach(handler => handler(notification));
        }

        // Notifier les handlers génériques (abonnés à tous les types)
        const allHandlers = this.eventHandlers.get('all');
        if (allHandlers) {
            allHandlers.forEach(handler => handler(notification));
        }

        // Invalider le cache des notifications concernant l'utilisateur destinataire
        this.invalidateUserNotificationsCache(notification.recipientId);
    }

    /**
     * Invalider le cache des notifications d'un utilisateur
     */
    private invalidateUserNotificationsCache(userId: string): void {
        // Supprimer toutes les entrées du cache pour cet utilisateur
        for (const key of this.notificationsCache.keys()) {
            if (key.startsWith(`user_${userId}`)) {
                this.notificationsCache.delete(key);
            }
        }
    }

    /**
     * Générer une clé de cache pour les notifications
     */
    private generateCacheKey(userId: string, options: NotificationLoadOptions = {}): string {
        const { unreadOnly, limit, offset, types } = options;
        return `user_${userId}_unread_${unreadOnly || false}_limit_${limit || DEFAULT_PAGINATION.limit}_offset_${offset || DEFAULT_PAGINATION.offset}_types_${types ? types.join(',') : 'all'}`;
    }

    /**
     * Envoyer une notification
     */
    public async sendNotification(notification: Omit<LeaveRelatedNotification, 'id' | 'createdAt' | 'read'>): Promise<LeaveRelatedNotification> {
        const completeNotification = {
            ...notification,
            id: notification.id || Math.random().toString(36).substring(2, 15),
            createdAt: new Date(),
            read: false
        } as LeaveRelatedNotification;

        try {
            // Envoyer à l'API
            const response = await axios.post('/api/notifications', completeNotification);
            const savedNotification = response.data;

            // Émettre l'événement
            this.emitEvent(notification.type, savedNotification);

            return savedNotification;
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification:', error);

            // En cas d'erreur, on émet quand même l'événement localement
            this.emitEvent(notification.type, completeNotification);

            return completeNotification;
        }
    }

    /**
     * Récupérer les notifications avec pagination et mise en cache
     */
    public async getNotifications(userId: string, options: NotificationLoadOptions = {}): Promise<PaginatedNotificationsResult> {
        const { limit = DEFAULT_PAGINATION.limit, offset = DEFAULT_PAGINATION.offset, unreadOnly = false, types } = options;

        // Vérifier si la requête est déjà en cache et toujours valide
        const cacheKey = this.generateCacheKey(userId, options);
        const now = Date.now();
        const cachedResult = this.notificationsCache.get(cacheKey);

        if (cachedResult && (now - cachedResult.timestamp) < this.cacheTTL) {
            console.debug('Notifications chargées depuis le cache');
            return cachedResult.data;
        }

        try {
            const params = new URLSearchParams();

            if (unreadOnly) {
                params.append('unreadOnly', 'true');
            }

            if (limit) {
                params.append('limit', limit.toString());
            }

            if (offset) {
                params.append('offset', offset.toString());
            }

            if (types && types.length > 0) {
                params.append('types', types.join(','));
            }

            console.debug(`Chargement des notifications avec params: ${params.toString()}`);
            const response = await axios.get(`/api/utilisateurs/${userId}/notifications?${params.toString()}`);

            const { notifications, totalCount, unreadCount } = response.data;

            // Créer un résultat paginé
            const paginatedResult: PaginatedNotificationsResult = {
                notifications,
                totalCount,
                unreadCount,
                hasMore: offset + notifications.length < totalCount,
                nextOffset: offset + notifications.length < totalCount ? offset + notifications.length : undefined
            };

            // Mettre en cache le résultat
            this.notificationsCache.set(cacheKey, {
                data: paginatedResult,
                timestamp: now
            });

            return paginatedResult;
        } catch (error) {
            console.error('Erreur lors de la récupération des notifications:', error);
            return {
                notifications: [],
                totalCount: 0,
                unreadCount: 0,
                hasMore: false
            };
        }
    }

    /**
     * Charger la page suivante de notifications
     * Cette méthode facilite le chargement incrémental (infinite scrolling)
     */
    public async loadMoreNotifications(userId: string, currentOptions: NotificationLoadOptions = {}): Promise<PaginatedNotificationsResult> {
        const currentResult = await this.getNotifications(userId, currentOptions);

        if (!currentResult.hasMore) {
            return currentResult;
        }

        // Charger la page suivante en utilisant nextOffset
        return this.getNotifications(userId, {
            ...currentOptions,
            offset: currentResult.nextOffset
        });
    }

    /**
     * Récupérer les notifications non lues
     */
    public async getUnreadNotifications(userId: string, options: Omit<NotificationLoadOptions, 'unreadOnly'> = {}): Promise<PaginatedNotificationsResult> {
        return this.getNotifications(userId, { ...options, unreadOnly: true });
    }

    /**
     * Marquer une notification comme lue
     */
    public async markAsRead(notificationId: string): Promise<void> {
        try {
            await axios.post(`/api/notifications/${notificationId}/read`);

            // Trouver et mettre à jour la notification dans le cache
            for (const [cacheKey, cachedValue] of this.notificationsCache.entries()) {
                const updatedNotifications = cachedValue.data.notifications.map(notification => {
                    if (notification.id === notificationId) {
                        return { ...notification, read: true };
                    }
                    return notification;
                });

                if (JSON.stringify(updatedNotifications) !== JSON.stringify(cachedValue.data.notifications)) {
                    // Mettre à jour le cache
                    const updatedData = {
                        ...cachedValue.data,
                        notifications: updatedNotifications,
                        unreadCount: Math.max(0, cachedValue.data.unreadCount - 1)
                    };

                    this.notificationsCache.set(cacheKey, {
                        data: updatedData,
                        timestamp: cachedValue.timestamp // Garder le même timestamp
                    });
                }
            }
        } catch (error) {
            console.error('Erreur lors du marquage de la notification:', error);
        }
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    public async markAllAsRead(userId: string): Promise<void> {
        try {
            await axios.post(`/api/utilisateurs/${userId}/notifications/read-all`);

            // Invalider le cache pour cet utilisateur
            this.invalidateUserNotificationsCache(userId);
        } catch (error) {
            console.error('Erreur lors du marquage de toutes les notifications:', error);
        }
    }

    /**
     * Supprimer une notification
     */
    public async deleteNotification(notificationId: string): Promise<void> {
        try {
            await axios.delete(`/api/notifications/${notificationId}`);

            // Trouver et mettre à jour le cache
            for (const [cacheKey, cachedValue] of this.notificationsCache.entries()) {
                const notificationToDelete = cachedValue.data.notifications.find(n => n.id === notificationId);
                const updatedNotifications = cachedValue.data.notifications.filter(n => n.id !== notificationId);

                if (updatedNotifications.length !== cachedValue.data.notifications.length) {
                    // Mettre à jour le cache
                    const updatedData = {
                        ...cachedValue.data,
                        notifications: updatedNotifications,
                        totalCount: cachedValue.data.totalCount - 1,
                        unreadCount: notificationToDelete && !notificationToDelete.read
                            ? Math.max(0, cachedValue.data.unreadCount - 1)
                            : cachedValue.data.unreadCount
                    };

                    this.notificationsCache.set(cacheKey, {
                        data: updatedData,
                        timestamp: cachedValue.timestamp
                    });
                }
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de la notification:', error);
        }
    }

    /**
     * Supprimer toutes les notifications
     */
    public async deleteAllNotifications(userId: string): Promise<void> {
        try {
            await axios.delete(`/api/utilisateurs/${userId}/notifications`);

            // Invalider le cache pour cet utilisateur
            this.invalidateUserNotificationsCache(userId);
        } catch (error) {
            console.error('Erreur lors de la suppression de toutes les notifications:', error);
        }
    }

    /**
     * Créer une notification pour une demande de congé
     */
    public async notifyLeaveRequest(leave: Leave, requestor: User): Promise<void> {
        try {
            const recipientIds = await this.getApproverIds(requestor.id);

            if (!recipientIds.length) {
                console.warn(`Aucun approbateur trouvé pour la demande de congé de ${requestor.prenom} ${requestor.nom}`);
                return;
            }

            for (const recipientId of recipientIds) {
                await this.sendNotification({
                    type: LeaveNotificationType.LEAVE_APPROVAL_NEEDED,
                    title: 'Nouvelle demande de congé',
                    message: `${requestor.prenom} ${requestor.nom} a soumis une nouvelle demande de congé.`,
                    referenceId: leave.id,
                    referenceType: 'leave',
                    recipientId,
                    priority: NotificationPriority.MEDIUM,
                    requestorName: `${requestor.prenom} ${requestor.nom}`,
                    leaveType: leave.type,
                    leaveStatus: leave.status,
                    actions: [
                        { label: 'Approuver', action: 'APPROVE', url: `/admin/conges/${leave.id}/approve` },
                        { label: 'Refuser', action: 'REJECT', url: `/admin/conges/${leave.id}/reject` },
                    ]
                });
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification de demande de congé:', error);
        }
    }

    /**
     * Notifier le changement de statut d'une demande de congé
     */
    public async notifyLeaveStatusUpdate(leave: Leave, updatedBy?: User): Promise<void> {
        try {
            const statusMessage = this.getStatusMessage(leave.status);
            const updatedByInfo = updatedBy ? ` par ${updatedBy.prenom} ${updatedBy.nom}` : '';

            await this.sendNotification({
                type: LeaveNotificationType.LEAVE_STATUS_UPDATE,
                title: `Demande de congé ${statusMessage}`,
                message: `Votre demande de congé a été ${statusMessage}${updatedByInfo}.`,
                referenceId: leave.id,
                referenceType: 'leave',
                recipientId: leave.userId,
                priority: NotificationPriority.HIGH,
                leaveStatus: leave.status,
                leaveType: leave.type,
                actions: [
                    { label: 'Voir les détails', action: 'VIEW', url: `/conges?id=${leave.id}` }
                ]
            });
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification de mise à jour de congé:', error);
        }
    }

    /**
     * Notifier d'un conflit potentiel de congés
     */
    public async notifyLeaveConflict(leave: Leave, conflictingLeaves: Leave[]): Promise<void> {
        try {
            const conflictingUserNames = conflictingLeaves.map(l =>
                l.user ? `${l.user.prenom} ${l.user.nom}` : 'Anonyme'
            );
            const conflictingLeaveIds = conflictingLeaves.map(l => l.id);

            // Récupérer les responsables du planning
            const schedulerIds = await this.getSchedulerManagerIds();

            if (!schedulerIds.length) {
                console.warn('Aucun gestionnaire de planning trouvé pour la notification de conflit');
                return;
            }

            for (const recipientId of schedulerIds) {
                await this.sendNotification({
                    type: LeaveNotificationType.LEAVE_CONFLICT,
                    title: 'Conflit potentiel de congés',
                    message: `Un conflit potentiel a été détecté avec une demande de congé. Personnes concernées: ${conflictingUserNames.join(', ')}`,
                    referenceId: leave.id,
                    referenceType: 'leave',
                    recipientId,
                    priority: NotificationPriority.HIGH,
                    conflictingLeaves: conflictingLeaveIds,
                    conflictStartDate: leave.startDate,
                    conflictEndDate: leave.endDate,
                    actions: [
                        { label: 'Gérer le conflit', action: 'MANAGE', url: `/admin/conges/conflicts?id=${leave.id}` }
                    ]
                });
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification de conflit de congés:', error);
        }
    }

    /**
     * Envoyer un rappel pour les congés à venir
     */
    public async sendLeaveReminder(leave: Leave, daysUntilStart: number): Promise<void> {
        try {
            await this.sendNotification({
                type: LeaveNotificationType.LEAVE_REMINDER,
                title: 'Rappel de congé à venir',
                message: `Votre congé commence dans ${daysUntilStart} jour${daysUntilStart > 1 ? 's' : ''}.`,
                referenceId: leave.id,
                referenceType: 'leave',
                recipientId: leave.userId,
                priority: NotificationPriority.LOW,
                daysUntilStart,
                leaveType: leave.type,
                leaveStatus: leave.status,
                actions: [
                    { label: 'Voir les détails', action: 'VIEW', url: `/conges?id=${leave.id}` }
                ]
            });
        } catch (error) {
            console.error('Erreur lors de l\'envoi du rappel de congé:', error);
        }
    }

    /**
     * Notifier un utilisateur que son quota de congés est presque épuisé
     */
    public async notifyQuotaLow(userId: string, remainingDays: number, totalAllowance: number, year: number): Promise<void> {
        try {
            const percentage = (remainingDays / totalAllowance) * 100;

            // Vérifier si le pourcentage est en-dessous du seuil configuré
            if (percentage > this.config.quotaThreshold) {
                return;
            }

            await this.sendNotification({
                type: LeaveNotificationType.QUOTA_LOW,
                title: 'Quota de congés presque épuisé',
                message: `Attention, il ne vous reste que ${remainingDays} jour${remainingDays > 1 ? 's' : ''} de congés pour l'année ${year}.`,
                recipientId: userId,
                priority: NotificationPriority.MEDIUM,
                remainingDays,
                totalAllowance,
                year,
                actions: [
                    { label: 'Voir mes quotas', action: 'VIEW_QUOTAS', url: '/conges/quotas' }
                ]
            });
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification de quota bas:', error);
        }
    }

    /**
     * Méthodes utilitaires
     */
    private async getApproverIds(userId: string): Promise<string[]> {
        try {
            const response = await axios.get(`/api/utilisateurs/${userId}/approvers`);
            return response.data.map((user: User) => user.id);
        } catch (error) {
            console.error('Erreur lors de la récupération des approbateurs:', error);
            return [];
        }
    }

    private async getSchedulerManagerIds(): Promise<string[]> {
        try {
            const response = await axios.get('/api/utilisateurs/roles/SCHEDULER_MANAGER');
            return response.data.map((user: User) => user.id);
        } catch (error) {
            console.error('Erreur lors de la récupération des gestionnaires de planning:', error);
            return [];
        }
    }

    private getStatusMessage(status: LeaveStatus): string {
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

    /**
     * Nettoyer le cache
     */
    public clearCache(): void {
        this.notificationsCache.clear();
    }

    /**
     * Obtenir les statistiques du cache
     */
    public getCacheStats(): { size: number, keys: string[] } {
        return {
            size: this.notificationsCache.size,
            keys: Array.from(this.notificationsCache.keys())
        };
    }
}

// Exporter l'instance singleton
export const leaveNotificationService = NotificationService.getInstance(); 