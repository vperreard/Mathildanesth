import { logger } from "../lib/logger";

// Service de notifications temporairement désactivé pour éviter les erreurs WebSocket

export interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    data?: unknown;
    createdAt: Date;
}

class NotificationService {
    private static instance: NotificationService;

    private constructor() {
        logger.info('NotificationService: Complètement désactivé (version temp)');
    }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    public subscribe(type: string, callback: (notification: Notification) => void): () => void {
        logger.info('NotificationService.subscribe: Désactivé');
        return () => {}; // Fonction vide pour le unsubscribe
    }

    public unsubscribe(type: string, callback: (notification: Notification) => void): void {
        logger.info('NotificationService.unsubscribe: Désactivé');
    }

    public sendNotification(notification: Omit<Notification, 'id' | 'createdAt'>): void {
        logger.info('NotificationService.sendNotification: Désactivé -', notification.title);
    }

    public resetForTesting(): void {
        logger.info('NotificationService.resetForTesting: Désactivé');
    }
}

export const notificationService = NotificationService.getInstance();
export default NotificationService;