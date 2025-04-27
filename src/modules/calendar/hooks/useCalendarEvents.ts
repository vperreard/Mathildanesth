import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { AnyCalendarEvent, CalendarEventType, CalendarFilters } from '../types/event';
import { fetchCalendarEvents } from '../services/calendarService';

interface UseCalendarEventsOptions {
    autoLoad?: boolean;
    initialLoading?: boolean;
    batchSize?: number;
}

interface UseCalendarEventsReturn {
    events: AnyCalendarEvent[];
    filteredEvents: AnyCalendarEvent[];
    loading: boolean;
    error: Error | null;
    fetchEvents: (filters: CalendarFilters) => Promise<AnyCalendarEvent[]>;
    updateEvent: (eventId: string, eventData: Partial<AnyCalendarEvent>) => void;
    removeEvent: (eventId: string) => void;
    addEvent: (event: AnyCalendarEvent) => void;
    applyFilters: (filters: CalendarFilters) => AnyCalendarEvent[];
    hasFilteredEvents: boolean;
}

const DEFAULT_OPTIONS: UseCalendarEventsOptions = {
    autoLoad: true,
    initialLoading: false,
    batchSize: 50
};

/**
 * Hook pour gérer les événements du calendrier
 * Gère le chargement, le filtrage et la manipulation des événements
 */
export const useCalendarEvents = (
    initialFilters: CalendarFilters,
    options: UseCalendarEventsOptions = DEFAULT_OPTIONS
): UseCalendarEventsReturn => {
    const { autoLoad, initialLoading, batchSize } = { ...DEFAULT_OPTIONS, ...options };

    const [events, setEvents] = useState<AnyCalendarEvent[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<AnyCalendarEvent[]>([]);
    const [loading, setLoading] = useState<boolean>(initialLoading || false);
    const [error, setError] = useState<Error | null>(null);

    // Utiliser une ref pour stocker les filtres actuels afin d'éviter les re-rendus
    const filtersRef = useRef<CalendarFilters>(initialFilters);

    // Fonction interne pour appliquer les filtres
    const applyFiltersInternal = useCallback((allEvents: AnyCalendarEvent[], filters: CalendarFilters): AnyCalendarEvent[] => {
        return allEvents.filter(event => {
            // Filtrer par type d'événement
            if (filters.eventTypes.length > 0 && !filters.eventTypes.includes(event.type)) {
                return false;
            }

            // Filtrer par utilisateur
            if (filters.userIds && filters.userIds.length > 0 && !filters.userIds.includes(event.userId)) {
                return false;
            }

            // Filtrer par rôle utilisateur (si applicable)
            if (filters.userRoles && filters.userRoles.length > 0 && event.user &&
                !filters.userRoles.some(role => event.user?.role === role)) {
                return false;
            }

            // Filtrer par type de congé
            if (filters.leaveTypes && filters.leaveTypes.length > 0 &&
                event.type === CalendarEventType.LEAVE &&
                'leaveType' in event &&
                !filters.leaveTypes.includes(event.leaveType)) {
                return false;
            }

            // Filtrer par statut de congé
            if (filters.leaveStatuses && filters.leaveStatuses.length > 0 &&
                event.type === CalendarEventType.LEAVE &&
                'status' in event &&
                !filters.leaveStatuses.includes(event.status)) {
                return false;
            }

            // Filtrer par lieu
            if (filters.locationIds && filters.locationIds.length > 0 &&
                'locationId' in event &&
                event.locationId &&
                !filters.locationIds.includes(event.locationId)) {
                return false;
            }

            // Filtrer par équipe
            if (filters.teamIds && filters.teamIds.length > 0 &&
                'teamId' in event &&
                event.teamId &&
                !filters.teamIds.includes(event.teamId)) {
                return false;
            }

            // Filtrer par spécialité
            if (filters.specialtyIds && filters.specialtyIds.length > 0 &&
                'specialtyId' in event &&
                event.specialtyId &&
                !filters.specialtyIds.includes(event.specialtyId)) {
                return false;
            }

            // Filtrer par terme de recherche
            if (filters.searchTerm && filters.searchTerm.trim() !== '') {
                const searchTerm = filters.searchTerm.toLowerCase();
                const hasMatch = event.title.toLowerCase().includes(searchTerm) ||
                    (event.description && event.description.toLowerCase().includes(searchTerm)) ||
                    (event.user &&
                        (`${event.user.prenom} ${event.user.nom}`).toLowerCase().includes(searchTerm));
                if (!hasMatch) return false;
            }

            // Filtrer par plage de dates
            if (filters.dateRange) {
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);

                // Vérifier si l'événement est en dehors de la plage de dates
                if (eventEnd < filters.dateRange.start || eventStart > filters.dateRange.end) {
                    return false;
                }
            }

            // Si l'événement a passé tous les filtres, le conserver
            return true;
        });
    }, []);

    // Charger les événements depuis l'API
    const fetchEvents = useCallback(async (filters: CalendarFilters): Promise<AnyCalendarEvent[]> => {
        setLoading(true);
        setError(null);

        try {
            // Mise à jour de la référence des filtres
            filtersRef.current = filters;

            // Appel API pour récupérer les événements
            const fetchedEvents = await fetchCalendarEvents(filters);

            // Mise à jour des états
            setEvents(fetchedEvents);

            // Appliquer les filtres aux événements chargés
            const filtered = applyFiltersInternal(fetchedEvents, filters);
            setFilteredEvents(filtered);

            return fetchedEvents;
        } catch (err) {
            const errorObject = err instanceof Error ? err : new Error('Erreur inconnue');
            setError(errorObject);
            console.error('Erreur dans useCalendarEvents:', err);
            return [];
        } finally {
            setLoading(false);
        }
    }, [applyFiltersInternal]);

    // Fonction publique pour appliquer les filtres sans recharger les données
    const applyFilters = useCallback((filters: CalendarFilters): AnyCalendarEvent[] => {
        // Mise à jour de la référence des filtres
        filtersRef.current = filters;

        // Appliquer les filtres aux événements existants
        const filtered = applyFiltersInternal(events, filters);
        setFilteredEvents(filtered);

        return filtered;
    }, [events, applyFiltersInternal]);

    // Mettre à jour un événement existant
    const updateEvent = useCallback((eventId: string, eventData: Partial<AnyCalendarEvent>) => {
        setEvents(prevEvents => {
            // Créer une nouvelle liste avec l'événement mis à jour
            const updatedEvents = prevEvents.map(event =>
                event.id === eventId ? { ...event, ...eventData } as AnyCalendarEvent : event
            );

            // Réappliquer les filtres après la mise à jour
            const filtered = applyFiltersInternal(updatedEvents, filtersRef.current);
            setFilteredEvents(filtered);

            return updatedEvents;
        });
    }, [applyFiltersInternal]);

    // Supprimer un événement
    const removeEvent = useCallback((eventId: string) => {
        setEvents(prevEvents => {
            // Filtrer pour supprimer l'événement
            const updatedEvents = prevEvents.filter(event => event.id !== eventId);

            // Réappliquer les filtres après la suppression
            const filtered = applyFiltersInternal(updatedEvents, filtersRef.current);
            setFilteredEvents(filtered);

            return updatedEvents;
        });
    }, [applyFiltersInternal]);

    // Ajouter un nouvel événement
    const addEvent = useCallback((event: AnyCalendarEvent) => {
        setEvents(prevEvents => {
            // Ajouter le nouvel événement à la liste
            const updatedEvents = [...prevEvents, event];

            // Réappliquer les filtres après l'ajout
            const filtered = applyFiltersInternal(updatedEvents, filtersRef.current);
            setFilteredEvents(filtered);

            return updatedEvents;
        });
    }, [applyFiltersInternal]);

    // Vérifier s'il y a des événements filtrés
    const hasFilteredEvents = useMemo(() => {
        return filteredEvents.length > 0;
    }, [filteredEvents]);

    // Charger les événements au montage du composant si autoLoad est activé
    useEffect(() => {
        if (autoLoad) {
            fetchEvents(initialFilters);
        }
    }, [autoLoad, fetchEvents, initialFilters]);

    return {
        events,
        filteredEvents,
        loading,
        error,
        fetchEvents,
        updateEvent,
        removeEvent,
        addEvent,
        applyFilters,
        hasFilteredEvents
    };
}; 