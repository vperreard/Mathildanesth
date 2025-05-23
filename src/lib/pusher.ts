import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Configuration du serveur Pusher (côté backend)
export const pusherServer = new Pusher({
    appId: process.env.PUSHER_APP_ID || '',
    key: process.env.PUSHER_KEY || '',
    secret: process.env.PUSHER_SECRET || '',
    cluster: process.env.PUSHER_CLUSTER || 'eu',
    useTLS: true,
});

// Client Pusher (côté frontend)
export const pusherClient = new PusherClient(
    process.env.NEXT_PUBLIC_PUSHER_KEY || '',
    {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
        forceTLS: true,
    }
);

// Canaux de notification
export const CHANNELS = {
    // Canal général pour toutes les notifications systèmes
    SYSTEM: 'system-notifications',
    // Canal pour les notifications d'un utilisateur spécifique
    USER: (userId: string) => `private-user-${userId}`,
    // Canal pour une simulation spécifique
    SIMULATION: (scenarioId: string) => `simulation-${scenarioId}`,
};

// Événements de notification
export const EVENTS = {
    // Événements généraux
    NOTIFICATION: 'notification',
    // Événements de simulation
    SIMULATION_STARTED: 'simulation-started',
    SIMULATION_PROGRESS: 'simulation-progress',
    SIMULATION_COMPLETED: 'simulation-completed',
    SIMULATION_ERROR: 'simulation-error',
};

/**
 * S'abonne à un canal et à ses événements
 * @param channelName Nom du canal
 * @param events Événements et leurs gestionnaires
 * @returns Une fonction pour se désabonner
 */
export const subscribeToChannel = (channelName: string, events: Record<string, (data: any) => void>) => {
    if (!channelName) {
        console.error('Nom de canal requis pour s\'abonner');
        return () => { };
    }

    try {
        const channel = pusherClient.subscribe(channelName);

        // S'abonner à chaque événement
        Object.entries(events).forEach(([eventName, handler]) => {
            channel.bind(eventName, handler);
        });

        // Retourner une fonction pour se désabonner
        return () => {
            Object.keys(events).forEach((eventName) => {
                channel.unbind(eventName);
            });
            pusherClient.unsubscribe(channelName);
        };
    } catch (error) {
        console.error('Erreur lors de l\'abonnement au canal Pusher:', error);
        return () => { };
    }
};

/**
 * Déclenche un événement sur un canal
 * @param channelName Nom du canal
 * @param eventName Nom de l'événement
 * @param data Données à envoyer
 */
export const triggerEvent = async (
    channelName: string,
    eventName: string,
    data: any
) => {
    if (!channelName || !eventName) {
        console.error('Nom de canal et d\'événement requis pour déclencher un événement');
        return;
    }

    try {
        await pusherServer.trigger(channelName, eventName, data);
    } catch (error) {
        console.error('Erreur lors du déclenchement de l\'événement Pusher:', error);
    }
};

/**
 * Authentifie un utilisateur pour les canaux privés
 * @param socketId ID de socket
 * @param channel Nom du canal
 * @param userData Données utilisateur pour l'authentification
 * @returns Données d'authentification
 */
export const authorizeChannel = (socketId: string, channel: string, userData: any) => {
    return pusherServer.authorizeChannel(socketId, channel, userData);
}; 