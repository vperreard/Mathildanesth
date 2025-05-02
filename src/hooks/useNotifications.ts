import { useEffect, useCallback } from 'react';
import { notificationService, Notification } from '@/services/notificationService';

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

    return {
        sendNotification,
    };
}; 