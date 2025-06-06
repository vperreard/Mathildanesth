import { AppEvent, EventType, BaseEvent } from './EventTypes';

import { logger } from "../../lib/logger";
// Type de fonction pour les gestionnaires d'événements
export type EventHandler<T extends BaseEvent = AppEvent> = (event: T) => void;

/**
 * Service d'événements centralisé utilisant le pattern Singleton et Pub/Sub
 * pour faciliter la communication entre les différents modules de l'application
 */
class EventService {
    private static instance: EventService;
    private handlers: Map<EventType, EventHandler[]>;
    private debugMode: boolean;

    private constructor() {
        this.handlers = new Map<EventType, EventHandler[]>();
        this.debugMode = process.env.NODE_ENV === 'development';
    }

    /**
     * Obtenir l'instance unique du service d'événements
     */
    public static getInstance(): EventService {
        if (!EventService.instance) {
            EventService.instance = new EventService();
        }
        return EventService.instance;
    }

    /**
     * S'abonner à un type d'événement spécifique
     * @param eventType Type d'événement auquel s'abonner
     * @param handler Fonction à exécuter lors de la réception de l'événement
     * @returns Fonction pour se désabonner
     */
    public subscribe<T extends BaseEvent>(eventType: EventType, handler: EventHandler<T>): () => void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }

        const eventHandlers = this.handlers.get(eventType) as EventHandler<T>[];
        eventHandlers.push(handler as EventHandler);

        this.logDebug(`Abonné à l'événement: ${eventType}`);

        // Retourner une fonction pour se désabonner
        return () => {
            const handlers = this.handlers.get(eventType);
            if (handlers) {
                const index = handlers.indexOf(handler as EventHandler);
                if (index > -1) {
                    handlers.splice(index, 1);
                    this.logDebug(`Désabonné de l'événement: ${eventType}`);
                }
            }
        };
    }

    /**
     * Publier un événement pour notifier tous les abonnés
     * @param event Événement à publier
     */
    public publish<T extends BaseEvent>(event: T): void {
        if (!event.timestamp) {
            event.timestamp = new Date();
        }

        const handlers = this.handlers.get(event.type) || [];

        this.logDebug(`Publication de l'événement: ${event.type}`, event);

        // Appeler tous les gestionnaires enregistrés pour ce type d'événement
        handlers.forEach(handler => {
            try {
                handler(event);
            } catch (error: unknown) {
                logger.error(`Erreur lors du traitement de l'événement ${event.type}:`, { error: error });
            }
        });
    }

    /**
     * S'abonner à plusieurs types d'événements à la fois
     * @param eventTypes Tableau de types d'événements
     * @param handler Fonction à exécuter pour tous ces événements
     * @returns Fonction pour se désabonner de tous les événements
     */
    public subscribeToMany<T extends BaseEvent>(eventTypes: EventType[], handler: EventHandler<T>): () => void {
        const unsubscribers = eventTypes.map(eventType =>
            this.subscribe(eventType, handler)
        );

        // Retourner une fonction qui désabonne de tous les événements
        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }

    /**
     * Activer ou désactiver le mode debug
     */
    public setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
    }

    /**
     * Utilitaire pour logger les messages de debug
     */
    private logDebug(message: string, data?: unknown): void {
        if (this.debugMode) {
            if (data) {
                logger.debug(`[EventService] ${message}`, data);
            } else {
                logger.debug(`[EventService] ${message}`);
            }
        }
    }
}

// Exporter l'instance singleton
export const eventService = EventService.getInstance();

export default eventService; 