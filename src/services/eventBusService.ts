/**
 * Service de bus d'événements pour la communication entre composants
 * Implémente un pattern Pub/Sub (Publication/Souscription)
 */
export class EventBusService {
    private static instance: EventBusService;
    private listeners: Map<string, Function[]>;

    private constructor() {
        this.listeners = new Map();
    }

    /**
     * Obtient l'instance singleton du service d'événements
     */
    public static getInstance(): EventBusService {
        if (!EventBusService.instance) {
            EventBusService.instance = new EventBusService();
        }
        return EventBusService.instance;
    }

    /**
     * S'abonne à un type d'événement
     * @param eventType Type d'événement à écouter
     * @param callback Fonction à appeler quand l'événement est émis
     * @returns Fonction pour se désabonner
     */
    public subscribe(eventType: string, callback: Function): () => void {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }

        const eventListeners = this.listeners.get(eventType)!;
        eventListeners.push(callback);

        return () => {
            const index = eventListeners.indexOf(callback);
            if (index > -1) {
                eventListeners.splice(index, 1);
            }
        };
    }

    /**
     * Émet un événement aux abonnés
     * @param event Objet événement contenant au minimum un type
     */
    public emit(event: { type: string; data?: any }): void {
        const eventType = event.type;
        if (this.listeners.has(eventType)) {
            const eventListeners = this.listeners.get(eventType)!;
            eventListeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    console.error(`Erreur lors de l'exécution d'un listener pour l'événement ${eventType}:`, error);
                }
            });
        }
    }

    /**
     * Supprime tous les abonnements pour un type d'événement donné
     * @param eventType Type d'événement à nettoyer
     */
    public clearEventListeners(eventType: string): void {
        this.listeners.delete(eventType);
    }

    /**
     * Supprime tous les abonnements
     */
    public clearAllListeners(): void {
        this.listeners.clear();
    }
}

export default EventBusService; 