import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

// Interface pour les notifications retournées par l'API
export interface Notification {
    id: string;
    userId: number;
    type: string;
    message: string;
    link?: string | null;
    isRead: boolean;
    createdAt: string;
    triggeredByUserId?: number | null;
    relatedAssignmentId?: string | null;
    relatedRequestId?: string | null;
    relatedContextualMessageId?: string | null;
    triggeredByUser?: {
        id: number;
        login: string;
    } | null;
}

// Types d'événements WebSocket pour les notifications
interface NotificationEvents {
    new_notification: (notification: Notification) => void;
    notifications_read_update: (data: { count: number; all: boolean }) => void;
}

// Options du hook
interface UseNotificationsOptions {
    autoConnect?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
}

/**
 * Hook pour gérer les WebSockets de notifications en temps réel
 */
export function useNotificationsWebSocket(options: UseNotificationsOptions = {}) {
    const { data: session } = useSession();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Options avec valeurs par défaut
    const {
        autoConnect = true,
        reconnectionAttempts = 5,
        reconnectionDelay = 5000,
    } = options;

    // Chargement initial des notifications
    const fetchNotifications = useCallback(async (limit = 10) => {
        if (!session?.user?.id) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/notifications?limit=${limit}&filter=all`);
            if (!response.ok) throw new Error('Erreur lors du chargement des notifications');

            const data = await response.json();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur inconnue'));
            console.error('Erreur lors du chargement des notifications:', err);
        } finally {
            setIsLoading(false);
        }
    }, [session?.user?.id]);

    // Marquer une notification comme lue
    const markAsRead = useCallback(async (notificationId: string) => {
        if (!session?.user?.id) return;

        try {
            const response = await fetch('/api/notifications/mark-as-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationIds: [notificationId] }),
            });

            if (!response.ok) throw new Error('Erreur lors du marquage de la notification');

            // Mise à jour locale avant la réponse du serveur
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

            const data = await response.json();
            // Si le retour serveur diffère de notre prédiction, on corrige
            if (data.unreadCount !== undefined) {
                setUnreadCount(data.unreadCount);
            }
        } catch (err) {
            console.error('Erreur lors du marquage de la notification:', err);
        }
    }, [session?.user?.id]);

    // Marquer toutes les notifications comme lues
    const markAllAsRead = useCallback(async () => {
        if (!session?.user?.id) return;

        try {
            const response = await fetch('/api/notifications/mark-as-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ all: true }),
            });

            if (!response.ok) throw new Error('Erreur lors du marquage des notifications');

            // Mise à jour locale
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);

            await response.json(); // Consomme la réponse
        } catch (err) {
            console.error('Erreur lors du marquage de toutes les notifications:', err);
        }
    }, [session?.user?.id]);

    // Configuration de la connexion WebSocket
    useEffect(() => {
        if (!session?.user?.id || !autoConnect) return;

        // Initialiser la connexion socket
        const socketInstance = io({
            path: '/api/ws',
            autoConnect: true,
            reconnectionAttempts,
            reconnectionDelay,
            auth: {
                userId: session.user.id,
                token: session.user.accessToken || '',
            },
        });

        // Événements de connexion
        socketInstance.on('connect', () => {
            console.log('WebSocket connected for notifications');
            setIsConnected(true);

            // Rejoindre la room spécifique à l'utilisateur
            socketInstance.emit('join_room', `user_${session.user.id}`);
        });

        socketInstance.on('disconnect', () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (err) => {
            console.error('WebSocket connection error:', err);
            setError(new Error(`Erreur de connexion: ${err.message}`));
        });

        // Événement de nouvelle notification
        socketInstance.on('new_notification', (notification: Notification) => {
            console.log('New notification received:', notification);
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        // Événement de mise à jour des notifications lues
        socketInstance.on('notifications_read_update', (data: { count: number; all: boolean }) => {
            console.log('Notifications read update:', data);

            if (data.all) {
                // Toutes marquées comme lues
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
            } else if (data.count > 0) {
                // Mise à jour du compteur non lues
                fetchNotifications(); // Re-charger pour être sûr
            }
        });

        // Charger les notifications initiales
        fetchNotifications();

        setSocket(socketInstance);

        // Nettoyage à la déconnexion
        return () => {
            socketInstance.off('connect');
            socketInstance.off('disconnect');
            socketInstance.off('connect_error');
            socketInstance.off('new_notification');
            socketInstance.off('notifications_read_update');
            socketInstance.disconnect();
        };
    }, [session?.user?.id, autoConnect, reconnectionAttempts, reconnectionDelay, fetchNotifications]);

    // Méthode pour se connecter manuellement
    const connect = useCallback(() => {
        if (socket && !socket.connected) {
            socket.connect();
        }
    }, [socket]);

    // Méthode pour se déconnecter manuellement
    const disconnect = useCallback(() => {
        if (socket && socket.connected) {
            socket.disconnect();
        }
    }, [socket]);

    return {
        socket,
        isConnected,
        notifications,
        unreadCount,
        isLoading,
        error,
        markAsRead,
        markAllAsRead,
        connect,
        disconnect,
        refresh: fetchNotifications,
    };
} 