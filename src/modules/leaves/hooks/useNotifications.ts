import { useState, useEffect, useCallback } from 'react';
import { logger } from "../../../lib/logger";
import { useSession } from '@/lib/auth/migration-shim';
import { leaveNotificationService } from '../services/notificationService';
import {
    LeaveNotificationType,
    LeaveRelatedNotification,
    NotificationState,
    NotificationConfig
} from '../types/notification';

const DEFAULT_CONFIG: NotificationConfig = {
    reminderDays: [1, 3, 7],
    quotaThreshold: 20,
    approvalReminder: 2,
    enableEmailNotifications: true,
    enablePushNotifications: true
};

/**
 * Hook personnalisé pour la gestion des notifications de congés
 * @param options Options du hook
 * @returns État et fonctions pour gérer les notifications
 */
export const useLeaveNotifications = (options: {
    autoFetch?: boolean;
    limit?: number;
    unreadOnly?: boolean;
    type?: LeaveNotificationType | LeaveNotificationType[];
    onNotificationReceived?: (notification: LeaveRelatedNotification) => void;
} = {}) => {
    const { data: session } = useSession();
    const userId = session?.user?.id;

    const [state, setState] = useState<NotificationState>({
        notifications: [],
        unreadCount: 0,
        config: DEFAULT_CONFIG,
        loading: false,
        error: null
    });

    // Charger les notifications
    const fetchNotifications = useCallback(async () => {
        if (!userId) return;

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const { notifications, unreadCount } = await leaveNotificationService.getNotifications(
                userId,
                {
                    limit: options.limit,
                    unreadOnly: options.unreadOnly,
                }
            );

            // Filtrer par type si nécessaire
            const filteredNotifications = options.type
                ? notifications.filter(n =>
                    Array.isArray(options.type)
                        ? options.type.includes(n.type)
                        : n.type === options.type
                )
                : notifications;

            setState(prev => ({
                ...prev,
                notifications: filteredNotifications,
                unreadCount,
                loading: false
            }));
        } catch (error: unknown) {
            logger.error('Erreur lors du chargement des notifications:', error instanceof Error ? error : new Error(String(error)));
            setState(prev => ({
                ...prev,
                error: 'Impossible de charger les notifications',
                loading: false
            }));
        }
    }, [userId, options.limit, options.unreadOnly, options.type]);

    // Charger les notifications automatiquement au montage du composant
    useEffect(() => {
        if (options.autoFetch !== false && userId) {
            fetchNotifications();
        }
    }, [fetchNotifications, options.autoFetch, userId]);

    // S'abonner aux nouvelles notifications
    useEffect(() => {
        if (!userId) return;

        const type = options.type
            ? (Array.isArray(options.type) ? options.type[0] : options.type)
            : 'all';

        const handleNotification = (notification: LeaveRelatedNotification) => {
            // Mettre à jour l'état local
            setState(prev => ({
                ...prev,
                notifications: [notification, ...prev.notifications],
                unreadCount: prev.unreadCount + 1
            }));

            // Appeler le callback externe si fourni
            if (options.onNotificationReceived) {
                options.onNotificationReceived(notification);
            }
        };

        // S'abonner au service de notifications
        const unsubscribe = leaveNotificationService.subscribe(type, handleNotification);

        return () => {
            unsubscribe();
        };
    }, [userId, options.type, options.onNotificationReceived]);

    // Marquer une notification comme lue
    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            await leaveNotificationService.markAsRead(notificationId);

            setState(prev => {
                const updatedNotifications = prev.notifications.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                );

                return {
                    ...prev,
                    notifications: updatedNotifications,
                    unreadCount: Math.max(0, prev.unreadCount - 1)
                };
            });
        } catch (error: unknown) {
            logger.error('Erreur lors du marquage de la notification:', error instanceof Error ? error : new Error(String(error)));
        }
    }, []);

    // Marquer toutes les notifications comme lues
    const markAllAsRead = useCallback(async () => {
        if (!userId) return;

        try {
            await leaveNotificationService.markAllAsRead(userId);

            setState(prev => ({
                ...prev,
                notifications: prev.notifications.map(n => ({ ...n, read: true })),
                unreadCount: 0
            }));
        } catch (error: unknown) {
            logger.error('Erreur lors du marquage de toutes les notifications:', error instanceof Error ? error : new Error(String(error)));
        }
    }, [userId]);

    // Supprimer une notification
    const deleteNotification = useCallback(async (notificationId: string) => {
        try {
            await leaveNotificationService.deleteNotification(notificationId);

            setState(prev => {
                const wasUnread = prev.notifications.find(n => n.id === notificationId)?.read === false;
                const updatedNotifications = prev.notifications.filter(n => n.id !== notificationId);

                return {
                    ...prev,
                    notifications: updatedNotifications,
                    unreadCount: wasUnread ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount
                };
            });
        } catch (error: unknown) {
            logger.error('Erreur lors de la suppression de la notification:', error instanceof Error ? error : new Error(String(error)));
        }
    }, []);

    // Supprimer toutes les notifications
    const deleteAllNotifications = useCallback(async () => {
        if (!userId) return;

        try {
            await leaveNotificationService.deleteAllNotifications(userId);

            setState(prev => ({
                ...prev,
                notifications: [],
                unreadCount: 0
            }));
        } catch (error: unknown) {
            logger.error('Erreur lors de la suppression de toutes les notifications:', error instanceof Error ? error : new Error(String(error)));
        }
    }, [userId]);

    // Mettre à jour la configuration des notifications
    const updateConfig = useCallback(async (config: Partial<NotificationConfig>) => {
        try {
            await leaveNotificationService.updateConfig(config);

            setState(prev => ({
                ...prev,
                config: { ...prev.config, ...config }
            }));
        } catch (error: unknown) {
            logger.error('Erreur lors de la mise à jour de la configuration:', error instanceof Error ? error : new Error(String(error)));
        }
    }, []);

    return {
        ...state,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
        updateConfig
    };
}; 