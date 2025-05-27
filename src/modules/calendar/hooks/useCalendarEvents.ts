import { useState, useCallback, useEffect, useMemo } from 'react';
import { produce } from 'immer';
import { AnyCalendarEvent, CalendarEventType, CalendarFilters } from '../types/event';
import { calendarService } from '../services/calendrierService';

// Valeur par défaut pour les filtres
const DEFAULT_FILTERS: CalendarFilters = {
    eventTypes: [],
    dateRange: { start: new Date(), end: new Date() },
};

interface UseCalendarEventsOptions {
    initialFilters?: Partial<CalendarFilters>;
    autoLoad?: boolean;
    fetchEvents?: (filters: CalendarFilters) => Promise<AnyCalendarEvent[]>;
}

/**
 * Hook pour gérer les événements du calendrier
 */
export const useCalendarEvents = (options: UseCalendarEventsOptions = {}): {
    events: AnyCalendarEvent[];
    loading: boolean;
    error: Error | null;
    filters: CalendarFilters;
    updateFilters: (newFilters: Partial<CalendarFilters>) => Promise<void>;
    addEvent: (event: Omit<AnyCalendarEvent, 'id'>) => Promise<AnyCalendarEvent>;
    updateEvent: (eventId: string, updates: Partial<AnyCalendarEvent>) => Promise<AnyCalendarEvent>;
    deleteEvent: (eventId: string, eventType?: CalendarEventType) => Promise<void>;
    refreshEvents: () => Promise<void>;
    updateEventStatus: (eventId: string, status: string) => Promise<void>;
    getEventsByDay: () => { date: string; events: AnyCalendarEvent[] }[];
} => {
    const {
        initialFilters,
        autoLoad = true,
        fetchEvents = calendarService.getEvents,
    } = options;

    const [events, setEvents] = useState<AnyCalendarEvent[]>([]);
    const [filters, setFilters] = useState<CalendarFilters>({
        ...DEFAULT_FILTERS,
        ...initialFilters
    });
    const [loading, setLoading] = useState<boolean>(autoLoad);
    const [error, setError] = useState<Error | null>(null);

    // Fonction pour mettre à jour les filtres et recharger les événements
    const updateFilters = useCallback(async (newFilters: Partial<CalendarFilters>) => {
        const updatedFilters = { ...filters, ...newFilters };
        setFilters(updatedFilters);

        try {
            setLoading(true);
            const newEvents = await fetchEvents(updatedFilters);
            setEvents(newEvents);
            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Erreur lors du chargement des événements"));
            setLoading(false);
        }
    }, [fetchEvents, filters]);

    // Fonction pour rafraîchir les événements
    const refreshEvents = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedEvents = await fetchEvents(filters);
            setEvents(fetchedEvents);
            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Erreur lors du chargement des événements"));
            setLoading(false);
        }
    }, [fetchEvents, filters]);

    // Charger les événements initialement si autoLoad est activé
    useEffect(() => {
        if (autoLoad) {
            refreshEvents();
        }
    }, [autoLoad, refreshEvents]);

    // Ajouter un événement
    const addEvent = useCallback(async (event: Omit<AnyCalendarEvent, 'id'>): Promise<AnyCalendarEvent> => {
        try {
            const newEvent = await calendarService.createEvent(event);
            setEvents(prevEvents => [...prevEvents, newEvent]);
            return newEvent;
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Erreur lors de l'ajout de l'événement");
            setError(error);
            throw error;
        }
    }, []);

    // Mettre à jour un événement
    const updateEvent = useCallback(async (eventId: string, updates: Partial<AnyCalendarEvent>): Promise<AnyCalendarEvent> => {
        try {
            const eventToUpdate = events.find(e => e.id === eventId);
            if (!eventToUpdate) {
                throw new Error(`Événement avec l'ID ${eventId} non trouvé`);
            }

            const updatedEvent = await calendarService.updateEvent({
                ...eventToUpdate,
                ...updates
            } as AnyCalendarEvent);

            setEvents(prevEvents =>
                prevEvents.map(event => {
                    if (event.id === eventId) {
                        return updatedEvent;
                    }
                    return event;
                })
            );

            return updatedEvent;
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Erreur lors de la mise à jour de l'événement");
            setError(error);
            throw error;
        }
    }, [events]);

    // Supprimer un événement
    const deleteEvent = useCallback(async (eventId: string, eventType?: CalendarEventType): Promise<void> => {
        try {
            // On utilise le type de l'événement trouvé si non spécifié
            const event = events.find(e => e.id === eventId);
            const typeToUse = eventType || (event ? event.type : undefined);

            if (!typeToUse) {
                throw new Error(`Type d'événement non spécifié et événement avec l'ID ${eventId} non trouvé`);
            }

            await calendarService.deleteEvent(eventId, typeToUse);
            setEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Erreur lors de la suppression de l'événement");
            setError(error);
            throw error;
        }
    }, [events]);

    // Mettre à jour le statut d'un événement
    const updateEventStatus = useCallback(async (eventId: string, status: string): Promise<void> => {
        try {
            // Vérifier que le statut est valide selon les attentes de l'API
            const validStatus = ['PENDING', 'APPROVED', 'REJECTED'].includes(status)
                ? status as 'PENDING' | 'APPROVED' | 'REJECTED'
                : 'PENDING';

            setEvents(prevEvents =>
                prevEvents.map(event => {
                    if (event.id === eventId && 'status' in event && event.status !== undefined) {
                        return { ...event, status: validStatus } as AnyCalendarEvent;
                    }
                    return event;
                })
            );
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Erreur lors de la mise à jour du statut de l'événement");
            setError(error);
            throw error;
        }
    }, []);

    // Grouper les événements par jour
    const getEventsByDay = useCallback(() => {
        const eventsByDay = new Map<string, AnyCalendarEvent[]>();

        events.forEach(event => {
            const dateKey = new Date(event.start).toISOString().split('T')[0];
            if (!eventsByDay.has(dateKey)) {
                eventsByDay.set(dateKey, []);
            }
            eventsByDay.get(dateKey)?.push(event);
        });

        // Trier les événements de chaque jour
        eventsByDay.forEach(dayEvents => {
            dayEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        });

        // Convertir la Map en tableau formaté pour le retour
        return Array.from(eventsByDay.entries())
            .map(([date, events]) => ({ date, events }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [events]);

    return {
        events,
        loading,
        error,
        filters,
        updateFilters,
        addEvent,
        updateEvent,
        deleteEvent,
        refreshEvents,
        updateEventStatus,
        getEventsByDay
    };
}; 