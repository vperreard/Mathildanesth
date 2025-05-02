import { useEffect } from 'react';
import eventService, { EventHandler } from './EventService';
import { EventType, BaseEvent } from './EventTypes';

/**
 * Hook personnalisé pour faciliter l'utilisation du système d'événements dans les composants React
 * 
 * @param eventType Type d'événement auquel s'abonner
 * @param handler Fonction de gestion de l'événement
 * @param deps Tableau de dépendances (comme pour useEffect)
 */
export function useEventListener<T extends BaseEvent>(
    eventType: EventType,
    handler: EventHandler<T>,
    deps: React.DependencyList = []
): void {
    useEffect(() => {
        // S'abonner à l'événement
        const unsubscribe = eventService.subscribe<T>(eventType, handler);

        // Se désabonner lors du démontage du composant
        return () => {
            unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

/**
 * Hook pour s'abonner à plusieurs types d'événements à la fois
 * 
 * @param eventTypes Tableau des types d'événements
 * @param handler Fonction de gestion commune pour tous ces événements
 * @param deps Tableau de dépendances
 */
export function useMultipleEventListeners<T extends BaseEvent>(
    eventTypes: EventType[],
    handler: EventHandler<T>,
    deps: React.DependencyList = []
): void {
    useEffect(() => {
        // S'abonner à tous les événements spécifiés
        const unsubscribe = eventService.subscribeToMany<T>(eventTypes, handler);

        // Se désabonner lors du démontage
        return () => {
            unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

/**
 * Hook pour publier un événement
 * 
 * @returns Fonction pour publier un événement
 */
export function useEventPublisher() {
    return {
        publishEvent: <T extends BaseEvent>(event: T) => {
            eventService.publish<T>(event);
        }
    };
}

export default {
    useEventListener,
    useMultipleEventListeners,
    useEventPublisher
}; 