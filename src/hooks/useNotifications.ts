import { useCallback, useEffect } from 'react';
import { notificationService, Notification } from '../services/notificationService';
import { useAuth } from './useAuth';
import { getClientAuthToken } from '../lib/auth-client-utils';

interface MarkAsReadParams {
    notificationIds?: string[];
    all?: boolean;
}

export const useNotifications = (type?: string) => {
    const { user } = useAuth();

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

    // Fonction pour marquer une notification comme lue
    const markNotificationAsRead = useCallback(async (params: MarkAsReadParams) => {
        if (!user) {
            console.warn('Tentative de marquer une notification comme lue sans être connecté');
            return null;
        }

        try {
            const token = getClientAuthToken();
            if (!token) {
                console.warn('Token d\'authentification manquant');
                return null;
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };
            
            const response = await fetch('/api/notifications/mark-as-read', {
                method: 'POST',
                headers,
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.warn('Non autorisé : Veuillez vous connecter pour gérer vos notifications');
                    return null;
                }
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur lors du marquage de la notification comme lue:', error);
            return null;
        }
    }, [user]);

    // Fonction pour récupérer les notifications de l'utilisateur
    const fetchNotifications = useCallback(async (options = { unreadOnly: false, limit: 10, page: 1 }) => {
        if (!user) {
            console.warn('Tentative de récupérer des notifications sans être connecté');
            return { notifications: [], unreadCount: 0 };
        }

        try {
            const token = getClientAuthToken();
            if (!token) {
                console.warn('Token d\'authentification manquant');
                return { notifications: [], unreadCount: 0 };
            }

            const { unreadOnly, limit, page } = options;
            const queryParams = new URLSearchParams();
            if (unreadOnly) queryParams.append('unreadOnly', 'true');
            if (limit) queryParams.append('limit', limit.toString());
            if (page) queryParams.append('page', page.toString());

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };
            
            const response = await fetch(`/api/notifications?${queryParams.toString()}`, {
                headers
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.warn('Non autorisé : Veuillez vous connecter pour accéder à vos notifications');
                    return { notifications: [], unreadCount: 0 };
                }
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération des notifications:', error);
            return { notifications: [], unreadCount: 0 };
        }
    }, [user]);

    return {
        sendNotification,
        markNotificationAsRead,
        fetchNotifications
    };
}; 