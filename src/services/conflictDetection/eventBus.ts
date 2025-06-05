import { ConflictType, ConflictSeverity, LeaveConflict } from '@/modules/leaves/types/conflict';

import { logger } from "../../lib/logger";
// Types d'événements
export enum ConflictEventType {
    CONFLICT_DETECTED = 'conflict_detected',
    CONFLICT_RESOLVED = 'conflict_resolved',
    CONFLICT_RULES_UPDATED = 'conflict_rules_updated',
    CONFLICT_CHECK_REQUESTED = 'conflict_check_requested',
    CONFLICT_CHECK_COMPLETED = 'conflict_check_completed'
}

// Interface de base pour tous les événements de conflit
export interface ConflictEvent {
    type: ConflictEventType;
    timestamp: Date;
    source: string;
}

// Événement émis lorsqu'un conflit est détecté
export interface ConflictDetectedEvent extends ConflictEvent {
    type: ConflictEventType.CONFLICT_DETECTED;
    conflict: LeaveConflict;
    userId: string;
    conflictType: ConflictType;
    severity: ConflictSeverity;
    metadata?: Record<string, any>;
}

// Événement émis lorsqu'un conflit est résolu
export interface ConflictResolvedEvent extends ConflictEvent {
    type: ConflictEventType.CONFLICT_RESOLVED;
    conflictId: string;
    userId: string;
    resolvedBy: string;
    resolution: 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'AUTO';
    comment?: string;
    metadata?: Record<string, any>;
}

// Événement émis lorsque les règles de conflit sont mises à jour
export interface ConflictRulesUpdatedEvent extends ConflictEvent {
    type: ConflictEventType.CONFLICT_RULES_UPDATED;
    updatedBy: string;
    changedRules: string[];
    metadata?: Record<string, any>;
}

// Événement émis lorsqu'une vérification de conflit est demandée
export interface ConflictCheckRequestedEvent extends ConflictEvent {
    type: ConflictEventType.CONFLICT_CHECK_REQUESTED;
    userId: string;
    startDate: Date;
    endDate: Date;
    requestedBy: string;
    context?: Record<string, any>;
}

// Événement émis lorsqu'une vérification de conflit est terminée
export interface ConflictCheckCompletedEvent extends ConflictEvent {
    type: ConflictEventType.CONFLICT_CHECK_COMPLETED;
    userId: string;
    startDate: Date;
    endDate: Date;
    hasConflicts: boolean;
    conflictCount: number;
    hasBlockers: boolean;
    executionTimeMs: number;
    sources: string[];
}

// Type d'union pour tous les événements possibles
export type AnyConflictEvent =
    | ConflictDetectedEvent
    | ConflictResolvedEvent
    | ConflictRulesUpdatedEvent
    | ConflictCheckRequestedEvent
    | ConflictCheckCompletedEvent;

// Type pour les gestionnaires d'événements
export type ConflictEventHandler<T extends AnyConflictEvent = AnyConflictEvent> = (event: T) => void;

/**
 * Bus d'événements pour la communication entre les différents modules
 * lors de la détection et résolution des conflits
 */
class ConflictEventBus {
    private handlers: Map<ConflictEventType, Set<ConflictEventHandler>> = new Map();
    private history: AnyConflictEvent[] = [];
    private readonly MAX_HISTORY_SIZE = 100;

    /**
     * S'abonne à un type d'événement spécifique
     * @param eventType Type d'événement à écouter
     * @param handler Fonction à exécuter lorsque l'événement est émis
     * @returns Fonction pour se désabonner
     */
    subscribe<T extends AnyConflictEvent>(
        eventType: ConflictEventType,
        handler: ConflictEventHandler<T>
    ): () => void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
        }

        this.handlers.get(eventType)!.add(handler as ConflictEventHandler);

        // Retourner une fonction pour se désabonner
        return () => {
            const handlers = this.handlers.get(eventType);
            if (handlers) {
                handlers.delete(handler as ConflictEventHandler);
                if (handlers.size === 0) {
                    this.handlers.delete(eventType);
                }
            }
        };
    }

    /**
     * S'abonne à tous les types d'événements
     * @param handler Fonction à exécuter pour tous les événements
     * @returns Fonction pour se désabonner
     */
    subscribeToAll(handler: ConflictEventHandler): () => void {
        const unsubscribers = Object.values(ConflictEventType).map(eventType =>
            this.subscribe(eventType as ConflictEventType, handler)
        );

        // Retourner une fonction pour se désabonner de tous les événements
        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }

    /**
     * Émet un événement
     * @param event Événement à émettre
     */
    emit<T extends AnyConflictEvent>(event: T): void {
        // Compléter l'événement avec un timestamp s'il n'en a pas
        const completeEvent = {
            ...event,
            timestamp: event.timestamp || new Date()
        };

        // Ajouter l'événement à l'historique
        this.addToHistory(completeEvent);

        // Récupérer les gestionnaires pour ce type d'événement
        const handlers = this.handlers.get(event.type);
        if (handlers) {
            // Exécuter tous les gestionnaires
            handlers.forEach(handler => {
                try {
                    handler(completeEvent);
                } catch (error) {
                    logger.error(`Erreur dans le gestionnaire d'événement pour ${event.type}:`, error);
                }
            });
        }
    }

    /**
     * Ajoute un événement à l'historique
     * @param event Événement à ajouter
     * @private
     */
    private addToHistory(event: AnyConflictEvent): void {
        this.history.push(event);

        // Limiter la taille de l'historique
        if (this.history.length > this.MAX_HISTORY_SIZE) {
            this.history = this.history.slice(-this.MAX_HISTORY_SIZE);
        }
    }

    /**
     * Récupère l'historique des événements
     * @param eventType Type d'événement à filtrer (optionnel)
     * @param limit Nombre maximum d'événements à récupérer (optionnel)
     * @returns Liste des événements
     */
    getHistory(eventType?: ConflictEventType, limit?: number): AnyConflictEvent[] {
        let filteredHistory = this.history;

        // Filtrer par type d'événement si spécifié
        if (eventType) {
            filteredHistory = filteredHistory.filter(event => event.type === eventType);
        }

        // Limiter le nombre d'événements si spécifié
        if (limit && limit > 0) {
            filteredHistory = filteredHistory.slice(-limit);
        }

        return filteredHistory;
    }

    /**
     * Efface l'historique des événements
     */
    clearHistory(): void {
        this.history = [];
    }
}

// Exporter une instance singleton
export const conflictEventBus = new ConflictEventBus(); 