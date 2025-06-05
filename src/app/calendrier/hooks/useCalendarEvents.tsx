import { useState, useCallback, useEffect, useReducer } from 'react';
import { logger } from "../../../lib/logger";
import { produce } from 'immer';
import { CalendarEvent } from '../components/CalendarGrid';

// Types d'action pour le reducer
type EventAction =
    | { type: 'FETCH_START' }
    | { type: 'FETCH_SUCCESS'; payload: CalendarEvent[] }
    | { type: 'FETCH_ERROR'; error: Error }
    | { type: 'ADD_EVENT'; event: CalendarEvent }
    | { type: 'UPDATE_EVENT'; event: CalendarEvent }
    | { type: 'DELETE_EVENT'; eventId: string }
    | { type: 'MOVE_EVENT'; eventId: string; start: Date; end: Date }
    | { type: 'RESIZE_EVENT'; eventId: string; start: Date; end: Date }
    | { type: 'CLEAR_EVENTS' };

// État du hook
interface EventsState {
    events: CalendarEvent[];
    loading: boolean;
    error: Error | null;
    lastFetched: Date | null;
}

// Initialisation de l'état
const initialState: EventsState = {
    events: [],
    loading: false,
    error: null,
    lastFetched: null
};

// Reducer utilisant immer pour les mises à jour immuables
const eventsReducer = (state: EventsState, action: EventAction): EventsState => {
    return produce(state, draft => {
        switch (action.type) {
            case 'FETCH_START':
                draft.loading = true;
                draft.error = null;
                break;

            case 'FETCH_SUCCESS':
                draft.events = action.payload;
                draft.loading = false;
                draft.lastFetched = new Date();
                break;

            case 'FETCH_ERROR':
                draft.loading = false;
                draft.error = action.error;
                break;

            case 'ADD_EVENT':
                draft.events.push(action.event);
                break;

            case 'UPDATE_EVENT': {
                const index = draft.events.findIndex(e => e.id === action.event.id);
                if (index !== -1) {
                    draft.events[index] = action.event;
                }
                break;
            }

            case 'DELETE_EVENT': {
                const index = draft.events.findIndex(e => e.id === action.eventId);
                if (index !== -1) {
                    draft.events.splice(index, 1);
                }
                break;
            }

            case 'MOVE_EVENT': {
                const event = draft.events.find(e => e.id === action.eventId);
                if (event) {
                    event.start = action.start;
                    event.end = action.end;
                }
                break;
            }

            case 'RESIZE_EVENT': {
                const event = draft.events.find(e => e.id === action.eventId);
                if (event) {
                    event.start = action.start;
                    event.end = action.end;
                }
                break;
            }

            case 'CLEAR_EVENTS':
                draft.events = [];
                break;

            default:
                break;
        }
    });
};

// Interface du hook
interface CalendarEventsProps {
    fetchEvents?: (
        start: Date,
        end: Date,
        filters?: any
    ) => Promise<CalendarEvent[]>;
    dateRange: { start: Date; end: Date };
    cacheTime?: number; // Temps de mise en cache en millisecondes
    filters?: any;
}

interface CalendarEventsReturn {
    events: CalendarEvent[];
    loading: boolean;
    error: Error | null;
    addEvent: (event: CalendarEvent) => void;
    updateEvent: (event: CalendarEvent) => void;
    deleteEvent: (eventId: string) => void;
    moveEvent: (eventId: string, start: Date, end: Date) => void;
    resizeEvent: (eventId: string, start: Date, end: Date) => void;
    refreshEvents: () => Promise<void>;
    clearEvents: () => void;
}

/**
 * Hook personnalisé pour gérer les événements du calendrier
 */
export const useCalendarEvents = ({
    fetchEvents,
    dateRange,
    cacheTime = 5 * 60 * 1000, // 5 minutes par défaut
    filters
}: CalendarEventsProps): CalendarEventsReturn => {
    const [state, dispatch] = useReducer(eventsReducer, initialState);

    // Fonction pour déterminer si une mise à jour des données est nécessaire
    const shouldRefetch = useCallback((lastFetched: Date | null): boolean => {
        if (!lastFetched) return true;

        const now = new Date();
        const elapsed = now.getTime() - lastFetched.getTime();
        return elapsed > cacheTime;
    }, [cacheTime]);

    // Fonction pour charger les événements
    const fetchEventsData = useCallback(async () => {
        if (!fetchEvents) return;

        try {
            dispatch({ type: 'FETCH_START' });
            const events = await fetchEvents(dateRange.start, dateRange.end, filters);
            dispatch({ type: 'FETCH_SUCCESS', payload: events });
        } catch (error) {
            dispatch({ type: 'FETCH_ERROR', error: error as Error });
            logger.error('Erreur lors du chargement des événements:', error);
        }
    }, [fetchEvents, dateRange, filters]);

    // Charger les événements lorsque la plage de dates change
    useEffect(() => {
        if (shouldRefetch(state.lastFetched)) {
            fetchEventsData();
        }
    }, [dateRange, filters, fetchEventsData, shouldRefetch, state.lastFetched]);

    // Fonction pour rafraîchir manuellement les événements
    const refreshEvents = useCallback(async () => {
        await fetchEventsData();
    }, [fetchEventsData]);

    // Fonctions pour manipuler les événements
    const addEvent = useCallback((event: CalendarEvent) => {
        dispatch({ type: 'ADD_EVENT', event });
    }, []);

    const updateEvent = useCallback((event: CalendarEvent) => {
        dispatch({ type: 'UPDATE_EVENT', event });
    }, []);

    const deleteEvent = useCallback((eventId: string) => {
        dispatch({ type: 'DELETE_EVENT', eventId });
    }, []);

    const moveEvent = useCallback((eventId: string, start: Date, end: Date) => {
        dispatch({ type: 'MOVE_EVENT', eventId, start, end });
    }, []);

    const resizeEvent = useCallback((eventId: string, start: Date, end: Date) => {
        dispatch({ type: 'RESIZE_EVENT', eventId, start, end });
    }, []);

    const clearEvents = useCallback(() => {
        dispatch({ type: 'CLEAR_EVENTS' });
    }, []);

    // Retourner l'API de gestion des événements
    return {
        events: state.events,
        loading: state.loading,
        error: state.error,
        addEvent,
        updateEvent,
        deleteEvent,
        moveEvent,
        resizeEvent,
        refreshEvents,
        clearEvents
    };
}; 