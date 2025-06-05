/**
 * Service de bus d'événements pour gérer la communication entre modules
 * Ce service permet aux différents modules de l'application de communiquer
 * via un mécanisme de publication/abonnement, permettant un couplage faible
 * entre les modules.
 */

import { EventBusProfiler } from './EventBusProfiler';

import { logger } from "../../../lib/logger";
export enum IntegrationEventType {
    // Événements liés aux congés
    LEAVE_CREATED = 'LEAVE_CREATED',
    LEAVE_UPDATED = 'LEAVE_UPDATED',
    LEAVE_APPROVED = 'LEAVE_APPROVED',
    LEAVE_REJECTED = 'LEAVE_REJECTED',
    LEAVE_CANCELLED = 'LEAVE_CANCELLED',
    LEAVE_DELETED = 'LEAVE_DELETED',

    // Événements liés au planning
    PLANNING_EVENT_CREATED = 'PLANNING_EVENT_CREATED',
    PLANNING_EVENT_UPDATED = 'PLANNING_EVENT_UPDATED',
    PLANNING_EVENT_DELETED = 'PLANNING_EVENT_DELETED',

    // Événements liés aux quotas
    QUOTA_UPDATED = 'QUOTA_UPDATED',
    QUOTA_TRANSFERRED = 'QUOTA_TRANSFERRED',
    QUOTA_CARRIED_OVER = 'QUOTA_CARRIED_OVER',

    // Événements d'audit et journalisation
    AUDIT_ACTION = 'AUDIT_ACTION'
}

export interface IntegrationEvent<T = any> {
    type: IntegrationEventType;  // Type d'événement
    payload: T;                  // Données de l'événement
    timestamp: number;           // Horodatage de l'événement
    source: string;              // Module source de l'événement
    correlationId?: string;      // ID de corrélation pour le suivi
    userId?: string;             // ID de l'utilisateur concerné
    _metadata?: {                // Métadonnées pour le profilage (ajouté)
        enqueuedAt: number;      // Timestamp de mise en file d'attente
        deliveryAttempts: number; // Nombre de tentatives de livraison
    };
}

type EventHandler<T = any> = (event: IntegrationEvent<T>) => void;

/**
 * Configuration de la file d'attente d'événements
 */
export interface EventQueueConfig {
    batchSize: number;            // Nombre d'événements à traiter par lot
    processingInterval: number;   // Intervalle de traitement en ms
    maxQueueSize: number;         // Taille maximale de la file d'attente
    highFrequencyEventTypes: IntegrationEventType[]; // Types d'événements à traiter par lots
}

/**
 * Service de bus d'événements pour la communication inter-modules
 */
export class EventBusService {
    private static instance: EventBusService;
    private subscribers: Map<IntegrationEventType, Set<EventHandler>> = new Map();
    private wildCardSubscribers: Set<EventHandler> = new Set();
    private eventHistory: IntegrationEvent[] = [];
    private readonly maxHistorySize: number = 100;
    private readonly debug: boolean = process.env.NODE_ENV === 'development';

    // Profileur de performance
    private profiler: EventBusProfiler = EventBusProfiler.getInstance();

    // File d'attente pour les événements à haute fréquence
    private eventQueue: IntegrationEvent[] = [];
    private isProcessingQueue: boolean = false;
    private queueProcessorTimer: NodeJS.Timeout | null = null;
    private queueConfig: EventQueueConfig = {
        batchSize: 10,
        processingInterval: 100,
        maxQueueSize: 1000,
        highFrequencyEventTypes: []
    };
    private queueStats = {
        totalEnqueued: 0,
        totalProcessed: 0,
        maxQueueLength: 0,
        queueOverflows: 0,
        processingTime: {
            total: 0,
            count: 0,
            max: 0
        }
    };

    /**
     * Obtenir l'instance du service (Singleton)
     */
    public static getInstance(): EventBusService {
        if (!EventBusService.instance) {
            EventBusService.instance = new EventBusService();
        }
        return EventBusService.instance;
    }

    /**
     * Constructeur privé (Singleton)
     */
    private constructor() {
        if (this.debug) {
            logger.debug('[EventBus] Initialized');
        }

        // Configurer les événements à haute fréquence par défaut
        this.queueConfig.highFrequencyEventTypes = [
            IntegrationEventType.PLANNING_EVENT_UPDATED,
            IntegrationEventType.AUDIT_ACTION
        ];

        // Démarrer le processeur de file d'attente
        this.startQueueProcessor();

        // Activer le profileur en développement par défaut
        if (this.debug) {
            this.profiler.configure({
                enabled: true,
                samplingRate: 0.5, // 50% des événements seront profilés
                logSlowEvents: true,
                slowEventThreshold: 200 // Considérer les événements prenant plus de 200ms comme lents
            });
        }
    }

    /**
     * Démarrer le processeur de file d'attente
     */
    private startQueueProcessor(): void {
        if (this.queueProcessorTimer) {
            clearInterval(this.queueProcessorTimer);
        }

        this.queueProcessorTimer = setInterval(
            () => this.processEventQueue(),
            this.queueConfig.processingInterval
        );

        if (this.debug) {
            logger.debug(`[EventBus] Queue processor started with interval ${this.queueConfig.processingInterval}ms`);
        }
    }

    /**
     * Traiter la file d'attente d'événements
     */
    private async processEventQueue(): Promise<void> {
        if (this.isProcessingQueue || this.eventQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;
        const startTime = performance.now();

        try {
            // Prendre un lot d'événements
            const batchSize = Math.min(this.queueConfig.batchSize, this.eventQueue.length);
            const eventBatch = this.eventQueue.splice(0, batchSize);

            // Traiter les événements par lot
            for (const event of eventBatch) {
                // Mesurer le temps passé en file d'attente
                if (event._metadata?.enqueuedAt) {
                    const queueTime = performance.now() - event._metadata.enqueuedAt;
                    this.profiler.recordQueueTime(event.type, queueTime);

                    if (queueTime > 1000 && this.debug) {
                        logger.warn(`[EventBus] Event ${event.type} spent ${queueTime.toFixed(2)}ms in queue.`);
                    }
                }

                await this.deliverEventToSubscribers(event);
                this.queueStats.totalProcessed++;
            }

            // Mettre à jour les statistiques de performance
            const processingTime = performance.now() - startTime;
            this.queueStats.processingTime.total += processingTime;
            this.queueStats.processingTime.count++;
            this.queueStats.processingTime.max = Math.max(this.queueStats.processingTime.max, processingTime);

            if (this.debug && processingTime > 50) {
                logger.debug(`[EventBus] Processed ${batchSize} events in ${processingTime.toFixed(2)}ms`);
            }
        } catch (error: unknown) {
            logger.error('[EventBus] Error processing event queue:', error instanceof Error ? error : new Error(String(error)));
        } finally {
            this.isProcessingQueue = false;
        }
    }

    /**
     * Livrer un événement aux abonnés
     */
    private async deliverEventToSubscribers(event: IntegrationEvent): Promise<void> {
        // Profiler l'événement
        const { eventId, startTime } = this.profiler.startProfiling(event);

        try {
            // Stocker l'événement dans l'historique
            this.eventHistory.push(event);
            if (this.eventHistory.length > this.maxHistorySize) {
                this.eventHistory.shift();
            }

            // Notifier les abonnés spécifiques
            const subscribers = this.subscribers.get(event.type);
            if (subscribers) {
                for (const handler of subscribers) {
                    try {
                        // Générer un identifiant unique pour l'abonné s'il n'en a pas
                        const subscriberId = (handler as any).name || `subscriber-${Math.random().toString(36).substring(2, 9)}`;

                        // Profiler ce traitement spécifique
                        const handlerStartTime = this.profiler.startSubscriberProfiling(event.type, subscriberId);

                        // Exécuter le gestionnaire
                        await Promise.resolve(handler(event));

                        // Terminer le profilage pour cet abonné (pas d'erreur)
                        this.profiler.endSubscriberProfiling(event.type, subscriberId, handlerStartTime, false);
                    } catch (error: unknown) {
                        // Terminer le profilage pour cet abonné (avec erreur)
                        const subscriberId = (handler as any).name || 'unknown-subscriber';
                        this.profiler.endSubscriberProfiling(event.type, subscriberId, 0, true);

                        logger.error(`[EventBus] Error in event handler for ${event.type}:`, error instanceof Error ? error : new Error(String(error)));
                    }
                }
            }

            // Notifier les abonnés généraux
            for (const handler of this.wildCardSubscribers) {
                try {
                    const subscriberId = `wildcard-${(handler as any).name || Math.random().toString(36).substring(2, 9)}`;
                    const handlerStartTime = this.profiler.startSubscriberProfiling(event.type, subscriberId);

                    await Promise.resolve(handler(event));

                    this.profiler.endSubscriberProfiling(event.type, subscriberId, handlerStartTime, false);
                } catch (error: unknown) {
                    const subscriberId = `wildcard-${(handler as any).name || 'unknown'}`;
                    this.profiler.endSubscriberProfiling(event.type, subscriberId, 0, true);

                    logger.error(`[EventBus] Error in wildcard event handler:`, error instanceof Error ? error : new Error(String(error)));
                }
            }

            if (this.debug) {
                logger.debug(`[EventBus] Event delivered: ${event.type}`);
            }
        } finally {
            // Terminer le profilage de l'événement global
            this.profiler.endProfiling(eventId, event.type, startTime);
        }
    }

    /**
     * Configurer la file d'attente d'événements
     */
    public configureQueue(config: Partial<EventQueueConfig>): void {
        // Mettre à jour la configuration
        this.queueConfig = {
            ...this.queueConfig,
            ...config
        };

        // Redémarrer le processeur avec la nouvelle configuration
        this.startQueueProcessor();

        if (this.debug) {
            logger.debug('[EventBus] Queue configuration updated', this.queueConfig);
        }
    }

    /**
     * S'abonner à un type d'événement spécifique
     * @param eventType Type d'événement
     * @param handler Fonction de traitement
     * @returns Fonction de désabonnement
     */
    public subscribe<T = any>(eventType: IntegrationEventType, handler: EventHandler<T>): () => void {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, new Set());
        }

        // Capturer des informations sur l'abonné si possible
        if (typeof handler === 'function' && handler.name) {
            (handler as any)._eventBusId = handler.name;
        } else if (!((handler as any)._eventBusId)) {
            // Attribuer un ID unique à cette fonction pour le suivi
            (handler as any)._eventBusId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        }

        this.subscribers.get(eventType)!.add(handler as EventHandler);

        if (this.debug) {
            logger.debug(`[EventBus] Subscribed to ${eventType}`);
        }

        return () => {
            this.unsubscribe(eventType, handler as EventHandler);
        };
    }

    /**
     * S'abonner à tous les événements
     * @param handler Fonction de traitement
     * @returns Fonction de désabonnement
     */
    public subscribeToAll(handler: EventHandler): () => void {
        this.wildCardSubscribers.add(handler);

        if (this.debug) {
            logger.debug('[EventBus] Subscribed to all events');
        }

        return () => {
            this.wildCardSubscribers.delete(handler);
        };
    }

    /**
     * Se désabonner d'un type d'événement
     * @param eventType Type d'événement
     * @param handler Fonction de traitement
     */
    public unsubscribe(eventType: IntegrationEventType, handler: EventHandler): void {
        const subscribers = this.subscribers.get(eventType);
        if (subscribers) {
            subscribers.delete(handler);
            if (subscribers.size === 0) {
                this.subscribers.delete(eventType);
            }
        }

        if (this.debug) {
            logger.debug(`[EventBus] Unsubscribed from ${eventType}`);
        }
    }

    /**
     * Publier un événement
     * @param event Événement à publier
     */
    public publish<T = any>(event: Omit<IntegrationEvent<T>, 'timestamp'>): void {
        const completeEvent: IntegrationEvent<T> = {
            ...event,
            timestamp: Date.now()
        };

        // Vérifier si c'est un événement à haute fréquence qui doit être mis en file d'attente
        if (this.queueConfig.highFrequencyEventTypes.includes(event.type)) {
            // Ajouter à la file d'attente
            this.enqueueEvent(completeEvent);
        } else {
            // Livrer immédiatement
            this.deliverEventToSubscribers(completeEvent);
        }

        if (this.debug) {
            logger.debug(`[EventBus] Event published: ${event.type}`);
        }
    }

    /**
     * Ajouter un événement à la file d'attente
     */
    private enqueueEvent(event: IntegrationEvent): void {
        // Enregistrer l'heure à laquelle l'événement est mis en file d'attente
        const enqueuedAt = performance.now();
        const enhancedEvent = {
            ...event,
            // Ajouter des métadonnées pour le profilage
            _metadata: {
                enqueuedAt,
                deliveryAttempts: 0
            }
        };

        // Mettre à jour les statistiques
        this.queueStats.totalEnqueued++;

        // Vérifier si la file d'attente est pleine
        if (this.eventQueue.length >= this.queueConfig.maxQueueSize) {
            // File d'attente pleine, journaliser un avertissement
            this.queueStats.queueOverflows++;
            logger.warn(`[EventBus] Queue overflow detected. Event ${event.type} dropped. Consider increasing queue size or processing rate.`);

            // On pourrait implémenter une stratégie de rejet ici (p.ex. rejeter les événements moins prioritaires ou plus anciens)
            return;
        }

        // Ajouter l'événement à la file d'attente
        this.eventQueue.push(enhancedEvent);
        this.queueStats.maxQueueLength = Math.max(this.queueStats.maxQueueLength, this.eventQueue.length);

        if (this.debug) {
            logger.debug(`[EventBus] Event ${event.type} enqueued. Queue length: ${this.eventQueue.length}`);
        }
    }

    /**
     * Récupérer l'historique des événements
     * @param limit Limite du nombre d'événements à récupérer
     * @param eventTypes Types d'événements à filtrer
     */
    public getEventHistory(limit?: number, eventTypes?: IntegrationEventType[]): IntegrationEvent[] {
        let history = [...this.eventHistory];

        // Filtrer par types si nécessaire
        if (eventTypes && eventTypes.length > 0) {
            history = history.filter(event => eventTypes.includes(event.type));
        }

        // Limiter le nombre d'événements
        if (limit && limit > 0 && limit < history.length) {
            history = history.slice(history.length - limit);
        }

        return history;
    }

    /**
     * Vider l'historique des événements
     */
    public clearEventHistory(): void {
        this.eventHistory = [];
    }

    /**
     * Obtenir les statistiques du bus d'événements
     */
    public getStats(): {
        subscriberCount: number,
        eventCount: number,
        eventTypes: Record<string, number>,
        queueStats: {
            currentQueueLength: number,
            totalEnqueued: number,
            totalProcessed: number,
            maxQueueLength: number,
            queueOverflows: number,
            averageProcessingTime: number,
            maxProcessingTime: number
        }
    } {
        // Calculer le nombre d'abonnés
        let subscriberCount = this.wildCardSubscribers.size;
        for (const subscribers of this.subscribers.values()) {
            subscriberCount += subscribers.size;
        }

        // Compter les occurrences de chaque type d'événement
        const eventTypes: Record<string, number> = {};
        for (const event of this.eventHistory) {
            eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
        }

        // Calculer le temps de traitement moyen
        const averageProcessingTime = this.queueStats.processingTime.count > 0
            ? this.queueStats.processingTime.total / this.queueStats.processingTime.count
            : 0;

        return {
            subscriberCount,
            eventCount: this.eventHistory.length,
            eventTypes,
            queueStats: {
                currentQueueLength: this.eventQueue.length,
                totalEnqueued: this.queueStats.totalEnqueued,
                totalProcessed: this.queueStats.totalProcessed,
                maxQueueLength: this.queueStats.maxQueueLength,
                queueOverflows: this.queueStats.queueOverflows,
                averageProcessingTime,
                maxProcessingTime: this.queueStats.processingTime.max
            }
        };
    }

    /**
     * Vider la file d'attente (pour les tests ou en cas d'urgence)
     */
    public flushQueue(): void {
        const queueLength = this.eventQueue.length;
        this.eventQueue = [];

        if (this.debug) {
            logger.debug(`[EventBus] Queue flushed, ${queueLength} events dropped`);
        }
    }

    /**
     * Arrêter le processeur de file d'attente
     */
    public stopQueueProcessor(): void {
        if (this.queueProcessorTimer) {
            clearInterval(this.queueProcessorTimer);
            this.queueProcessorTimer = null;

            if (this.debug) {
                logger.debug('[EventBus] Queue processor stopped');
            }
        }
    }

    /**
     * Méthode de nettoyage des ressources (utilisée pour les tests ou à la destruction)
     */
    public dispose(): void {
        this.stopQueueProcessor();
        this.subscribers.clear();
        this.wildCardSubscribers.clear();
        this.eventQueue = [];
        this.eventHistory = [];

        if (this.debug) {
            logger.debug('[EventBus] Resources disposed');
        }
    }

    /**
     * Obtient les métriques de performance du bus d'événements
     */
    public getPerformanceMetrics() {
        // Obtenir les métriques de base du bus d'événements
        const basicStats = this.getStats();

        // Obtenir les métriques détaillées du profileur
        const performanceReport = this.profiler.generatePerformanceReport();

        return {
            ...basicStats,
            performance: performanceReport
        };
    }

    /**
     * Activer ou désactiver le profilage
     */
    public setProfilingEnabled(enabled: boolean, config?: Partial<any>): void {
        this.profiler.setEnabled(enabled);

        if (config) {
            this.profiler.configure(config);
        }

        if (this.debug) {
            logger.debug(`[EventBus] Profiling ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    /**
     * Réinitialise toutes les métriques de performance
     */
    public resetPerformanceMetrics(): void {
        // Réinitialiser les métriques du profileur
        this.profiler.resetMetrics();

        // Réinitialiser les statistiques de la file d'attente
        this.queueStats = {
            totalEnqueued: 0,
            totalProcessed: 0,
            maxQueueLength: 0,
            queueOverflows: 0,
            processingTime: {
                total: 0,
                count: 0,
                max: 0
            }
        };

        if (this.debug) {
            logger.debug('[EventBus] Performance metrics reset');
        }
    }
}

// Exporter l'instance singleton
export const eventBus = EventBusService.getInstance(); 