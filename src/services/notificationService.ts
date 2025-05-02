import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';

export interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    data?: any;
    createdAt: Date;
}

class NotificationService {
    private socket: Socket | null = null;
    private static instance: NotificationService;
    private listeners: Map<string, Set<(notification: Notification) => void>> = new Map();

    private constructor() {
        this.initializeSocket();
    }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    private initializeSocket() {
        if (typeof window !== 'undefined') {
            this.socket = io(window.location.origin, {
                path: '/api/ws',
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            this.socket.on('connect', () => {
                console.log('Connecté au serveur de notifications');
            });

            this.socket.on('disconnect', () => {
                console.log('Déconnecté du serveur de notifications');
            });

            this.socket.on('notification', (notification: Notification) => {
                this.handleNotification(notification);
            });
        }
    }

    private handleNotification(notification: Notification) {
        // Afficher la notification avec toast
        toast[notification.type](notification.message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
        });

        // Notifier les écouteurs
        const listeners = this.listeners.get(notification.type) || new Set();
        listeners.forEach(listener => listener(notification));
    }

    public subscribe(type: string, callback: (notification: Notification) => void): () => void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type)!.add(callback);

        return () => {
            const listeners = this.listeners.get(type);
            if (listeners) {
                listeners.delete(callback);
            }
        };
    }

    public unsubscribe(type: string, callback: (notification: Notification) => void): void {
        const listeners = this.listeners.get(type);
        if (listeners) {
            listeners.delete(callback);
        }
    }

    public sendNotification(notification: Omit<Notification, 'id' | 'createdAt'>): void {
        if (this.socket?.connected) {
            this.socket.emit('sendNotification', {
                ...notification,
                id: Math.random().toString(36).substring(2, 9),
                createdAt: new Date(),
            });
        }
    }

    /**
     * Méthode pour réinitialiser le service pour les tests
     * @private Utilisé uniquement pour les tests
     */
    public resetForTesting(): void {
        if (process.env.NODE_ENV === 'test') {
            this.listeners.clear();

            // Réinitialiser les listeners du socket
            if (this.socket) {
                this.socket.on('notification', (notification: Notification) => {
                    this.handleNotification(notification);
                });
            }
        }
    }
}

export const notificationService = NotificationService.getInstance(); 