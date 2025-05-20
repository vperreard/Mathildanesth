import { useEffect, useCallback } from 'react';
import { notificationService, Notification } from '@/services/notificationService';
import { NotificationType } from '@prisma/client';

interface MarkAsReadParams {
    id?: string;
    relatedRequestId?: string;
    types?: NotificationType[];
}

export const useNotifications = (type?: string) => {
    const handleNotification = useCallback((notification: Notification) => {
        // Gérer la notification ici si nécessaire
        console.log('Nouvelle notification reçue:', notification);
    }, []);

    useEffect(() => {
        if (type) {
            const unsubscribe = notificationService.subscribe(type, handleNotification);
            return () => unsubscribe();
        }
    }, [type, handleNotification]);

    const sendNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
        notificationService.sendNotification(notification);
    }, []);

    // Nouvelle fonction pour marquer une notification comme lue
    const markNotificationAsRead = useCallback(async (params: MarkAsReadParams) => {
        try {
            const response = await fetch('/api/notifications/read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                throw new Error('Échec lors du marquage de la notification comme lue');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur lors du marquage de la notification comme lue:', error);
            return null;
        }
    }, []);

    return {
        sendNotification,
        markNotificationAsRead,
    };
}; 