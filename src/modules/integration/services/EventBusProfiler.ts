import { IntegrationEvent, IntegrationEventType } from './EventBusService';

import { logger } from "../../../lib/logger";
/**
 * Métriques sur un type d'événement spécifique
 */
export interface EventTypeMetrics {
    eventType: IntegrationEventType;
    count: number;
    totalHandlingTime: number;
    averageHandlingTime: number;
    minHandlingTime: number;
    maxHandlingTime: number;
    totalQueueTime: number;
    averageQueueTime: number;
    minQueueTime: number;
    maxQueueTime: number;
    lastOccurrence: number;
}

/**
 * Métriques détaillées sur les abonnés à un type d'événement
 */
export interface SubscriberMetrics {
    eventType: IntegrationEventType;
    subscriberId: string;
    count: number;
    totalHandlingTime: number;
    averageHandlingTime: number;
    minHandlingTime: number;
    maxHandlingTime: number;
    errors: number;
}

/**
 * Configuration du profileur
 */
export interface ProfilerConfig {
    enabled: boolean;
    detailedSubscriberMetrics: boolean;
    samplingRate: number; // Entre 0 et 1, pourcentage d'événements à profiler
    metricsRetentionPeriod: number; // Durée de conservation des métriques en ms
    logSlowEvents: boolean;
    slowEventThreshold: number; // Seuil en ms pour considérer un événement comme lent
}

/**
 * Service de profilage pour le bus d'événements
 */
export class EventBusProfiler {
    private static instance: EventBusProfiler;
    private isEnabled: boolean = false;
    private eventMetrics: Map<IntegrationEventType, EventTypeMetrics> = new Map();
    private subscriberMetrics: Map<string, SubscriberMetrics> = new Map();
    private config: ProfilerConfig = {
        enabled: false,
        detailedSubscriberMetrics: true,
        samplingRate: 1, // 100% par défaut
        metricsRetentionPeriod: 24 * 60 * 60 * 1000, // 24 heures par défaut
        logSlowEvents: true,
        slowEventThreshold: 500 // 500ms par défaut
    };

    /**
     * Obtenir l'instance unique du profileur
     */
    public static getInstance(): EventBusProfiler {
        if (!EventBusProfiler.instance) {
            EventBusProfiler.instance = new EventBusProfiler();
        }
        return EventBusProfiler.instance;
    }

    /**
     * Constructeur privé (Singleton)
     */
    private constructor() {
        logger.debug('[EventBusProfiler] Initialized');
    }

    /**
     * Configure le profileur
     */
    public configure(config: Partial<ProfilerConfig>): void {
        this.config = {
            ...this.config,
            ...config
        };
        this.isEnabled = this.config.enabled;

        logger.debug('[EventBusProfiler] Configuration updated:', this.config);
    }

    /**
     * Active ou désactive le profilage
     */
    public setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        this.config.enabled = enabled;
        logger.debug(`[EventBusProfiler] Profiling ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Détermine si un événement doit être profilé selon le taux d'échantillonnage
     */
    private shouldProfileEvent(): boolean {
        return this.isEnabled && Math.random() <= this.config.samplingRate;
    }

    /**
     * Commence le profilage d'un événement
     */
    public startProfiling(event: IntegrationEvent): { eventId: string, startTime: number } {
        if (!this.shouldProfileEvent()) {
            return { eventId: '', startTime: 0 };
        }

        const eventId = `${event.type}-${event.timestamp}-${Math.random().toString(36).substr(2, 9)}`;
        const startTime = performance.now();

        // Initialiser les métriques du type d'événement si nécessaire
        if (!this.eventMetrics.has(event.type)) {
            this.eventMetrics.set(event.type, {
                eventType: event.type,
                count: 0,
                totalHandlingTime: 0,
                averageHandlingTime: 0,
                minHandlingTime: Infinity,
                maxHandlingTime: 0,
                totalQueueTime: 0,
                averageQueueTime: 0,
                minQueueTime: Infinity,
                maxQueueTime: 0,
                lastOccurrence: Date.now()
            });
        }

        return { eventId, startTime };
    }

    /**
     * Enregistre le temps passé en file d'attente
     */
    public recordQueueTime(eventType: IntegrationEventType, queueTime: number): void {
        if (!this.isEnabled) return;

        const metrics = this.eventMetrics.get(eventType);
        if (metrics) {
            metrics.totalQueueTime += queueTime;
            metrics.minQueueTime = Math.min(metrics.minQueueTime, queueTime);
            metrics.maxQueueTime = Math.max(metrics.maxQueueTime, queueTime);
            metrics.averageQueueTime = metrics.totalQueueTime / metrics.count;
        }
    }

    /**
     * Termine le profilage d'un événement
     */
    public endProfiling(eventId: string, eventType: IntegrationEventType, startTime: number): void {
        if (!this.isEnabled || !startTime) return;

        const endTime = performance.now();
        const handlingTime = endTime - startTime;

        // Mettre à jour les métriques du type d'événement
        const metrics = this.eventMetrics.get(eventType);
        if (metrics) {
            metrics.count++;
            metrics.totalHandlingTime += handlingTime;
            metrics.minHandlingTime = Math.min(metrics.minHandlingTime, handlingTime);
            metrics.maxHandlingTime = Math.max(metrics.maxHandlingTime, handlingTime);
            metrics.averageHandlingTime = metrics.totalHandlingTime / metrics.count;
            metrics.lastOccurrence = Date.now();

            // Journaliser les événements lents
            if (this.config.logSlowEvents && handlingTime > this.config.slowEventThreshold) {
                logger.warn(`[EventBusProfiler] Slow event detected: ${eventType} took ${handlingTime.toFixed(2)}ms to process`);
            }
        }
    }

    /**
     * Enregistre le début du traitement par un abonné
     */
    public startSubscriberProfiling(
        eventType: IntegrationEventType,
        subscriberId: string
    ): number {
        if (!this.isEnabled || !this.config.detailedSubscriberMetrics) return 0;

        const metricKey = `${eventType}-${subscriberId}`;
        if (!this.subscriberMetrics.has(metricKey)) {
            this.subscriberMetrics.set(metricKey, {
                eventType,
                subscriberId,
                count: 0,
                totalHandlingTime: 0,
                averageHandlingTime: 0,
                minHandlingTime: Infinity,
                maxHandlingTime: 0,
                errors: 0
            });
        }

        return performance.now();
    }

    /**
     * Enregistre la fin du traitement par un abonné
     */
    public endSubscriberProfiling(
        eventType: IntegrationEventType,
        subscriberId: string,
        startTime: number,
        hasError: boolean = false
    ): void {
        if (!this.isEnabled || !this.config.detailedSubscriberMetrics || !startTime) return;

        const endTime = performance.now();
        const handlingTime = endTime - startTime;
        const metricKey = `${eventType}-${subscriberId}`;
        const metrics = this.subscriberMetrics.get(metricKey);

        if (metrics) {
            metrics.count++;
            metrics.totalHandlingTime += handlingTime;
            metrics.minHandlingTime = Math.min(metrics.minHandlingTime, handlingTime);
            metrics.maxHandlingTime = Math.max(metrics.maxHandlingTime, handlingTime);
            metrics.averageHandlingTime = metrics.totalHandlingTime / metrics.count;

            if (hasError) {
                metrics.errors++;
            }
        }
    }

    /**
     * Obtient les métriques de tous les types d'événements
     */
    public getAllEventMetrics(): EventTypeMetrics[] {
        // Filtrer les métriques obsolètes
        const now = Date.now();
        const retentionLimit = now - this.config.metricsRetentionPeriod;

        // Ne conserver que les métriques récentes
        for (const [eventType, metrics] of this.eventMetrics.entries()) {
            if (metrics.lastOccurrence < retentionLimit) {
                this.eventMetrics.delete(eventType);
            }
        }

        return Array.from(this.eventMetrics.values());
    }

    /**
     * Obtient les métriques pour un type d'événement spécifique
     */
    public getEventMetrics(eventType: IntegrationEventType): EventTypeMetrics | undefined {
        return this.eventMetrics.get(eventType);
    }

    /**
     * Obtient les métriques de tous les abonnés
     */
    public getAllSubscriberMetrics(): SubscriberMetrics[] {
        return Array.from(this.subscriberMetrics.values());
    }

    /**
     * Obtient les métriques des abonnés pour un type d'événement spécifique
     */
    public getSubscriberMetricsByEventType(eventType: IntegrationEventType): SubscriberMetrics[] {
        return Array.from(this.subscriberMetrics.values())
            .filter(metric => metric.eventType === eventType);
    }

    /**
     * Réinitialise toutes les métriques
     */
    public resetMetrics(): void {
        this.eventMetrics.clear();
        this.subscriberMetrics.clear();
        logger.debug('[EventBusProfiler] Metrics reset');
    }

    /**
     * Génère un rapport de performance complet
     */
    public generatePerformanceReport(): {
        eventMetrics: EventTypeMetrics[],
        subscriberMetrics: SubscriberMetrics[],
        summary: {
            totalEvents: number,
            topSlowEvents: { eventType: IntegrationEventType, avgTime: number }[],
            topErrorProneSubscribers: { subscriberId: string, eventType: IntegrationEventType, errorCount: number }[]
        }
    } {
        const eventMetrics = this.getAllEventMetrics();
        const subscriberMetrics = this.getAllSubscriberMetrics();

        // Calculer le nombre total d'événements
        const totalEvents = eventMetrics.reduce((sum, metric) => sum + metric.count, 0);

        // Trouver les événements les plus lents
        const topSlowEvents = [...eventMetrics]
            .sort((a, b) => b.averageHandlingTime - a.averageHandlingTime)
            .slice(0, 5)
            .map(metric => ({
                eventType: metric.eventType,
                avgTime: metric.averageHandlingTime
            }));

        // Trouver les abonnés avec le plus d'erreurs
        const topErrorProneSubscribers = [...subscriberMetrics]
            .sort((a, b) => b.errors - a.errors)
            .filter(metric => metric.errors > 0)
            .slice(0, 5)
            .map(metric => ({
                subscriberId: metric.subscriberId,
                eventType: metric.eventType,
                errorCount: metric.errors
            }));

        return {
            eventMetrics,
            subscriberMetrics,
            summary: {
                totalEvents,
                topSlowEvents,
                topErrorProneSubscribers
            }
        };
    }
} 