import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    CalendarViewType,
    CalendarFilters,
    CalendarSettings,
    AnyCalendarEvent
} from '../types/event';
import {
    fetchEvents,
    selectCalendarEvents,
    selectFilteredEvents,
    selectCalendarLoading,
    selectCalendarError,
    selectSelectedEventId,
    selectCalendarView,
    selectCurrentRange,
    selectCalendarFilters,
    selectCalendarSettings,
    selectLastUpdated,
    selectEventById,
    setView,
    setDateRange,
    updateFilters,
    resetFilters,
    updateSettings,
    selectEvent,
    applyFilters,
    addEvent,
    updateEvent as updateStoreEvent,
    removeEvent
} from '../store/calendrierSlice';

interface UseCalendarStoreOptions {
    autoLoad?: boolean;
    cacheTimeout?: number; // Durée de cache en millisecondes
}

const DEFAULT_OPTIONS: UseCalendarStoreOptions = {
    autoLoad: true,
    cacheTimeout: 5 * 60 * 1000 // 5 minutes
};

/**
 * Hook pour interagir avec le store du calendrier
 * Combine Redux et les hooks React pour fournir une API simple et fonctionnelle
 */
export const useCalendarStore = (
    initialFilters?: Partial<CalendarFilters>,
    options: UseCalendarStoreOptions = DEFAULT_OPTIONS
) => {
    const dispatch = useDispatch();

    // Sélecteurs Redux
    const events = useSelector(selectCalendarEvents);
    const filteredEvents = useSelector(selectFilteredEvents);
    const loading = useSelector(selectCalendarLoading);
    const error = useSelector(selectCalendarError);
    const selectedEventId = useSelector(selectSelectedEventId);
    const view = useSelector(selectCalendarView);
    const currentRange = useSelector(selectCurrentRange);
    const filters = useSelector(selectCalendarFilters);
    const settings = useSelector(selectCalendarSettings);
    const lastUpdated = useSelector(selectLastUpdated);

    // Fonction pour déterminer si les données doivent être rechargées
    const shouldRefresh = useCallback((): boolean => {
        if (!lastUpdated) return true;
        if (!options.cacheTimeout) return false;

        return Date.now() - lastUpdated > options.cacheTimeout;
    }, [lastUpdated, options.cacheTimeout]);

    // Charger les données initiales si autoLoad est activé
    useEffect(() => {
        if (options.autoLoad && shouldRefresh()) {
            if (initialFilters) {
                dispatch(updateFilters(initialFilters));
            }

            dispatch(fetchEvents(filters));
        }
    }, [dispatch, options.autoLoad, filters, initialFilters, shouldRefresh]);

    // Trouver un événement par ID (version sans hook)
    const getEventById = (id: string): AnyCalendarEvent | undefined => {
        // Utiliser la liste des événements déjà présente dans le store
        return events.find(event => event.id === id);
    };

    // Changer la vue du calendrier
    const handleViewChange = (newView: CalendarViewType) => {
        dispatch(setView(newView));
    };

    // Changer la plage de dates
    const handleDateRangeChange = (start: Date, end: Date) => {
        dispatch(setDateRange({ start, end }));
        dispatch(fetchEvents({
            ...filters,
            dateRange: { start, end }
        }));
    };

    // Mettre à jour les filtres
    const handleUpdateFilters = (newFilters: Partial<CalendarFilters>) => {
        dispatch(updateFilters(newFilters));

        // Si les filtres de date changent, recharger les données
        if (newFilters.dateRange || newFilters.eventTypes) {
            dispatch(fetchEvents({
                ...filters,
                ...newFilters
            }));
        } else {
            // Sinon, appliquer les filtres aux données existantes
            dispatch(applyFilters());
        }
    };

    // Réinitialiser les filtres
    const handleResetFilters = () => {
        dispatch(resetFilters());
        dispatch(applyFilters());
    };

    // Mettre à jour les paramètres
    const handleUpdateSettings = (newSettings: Partial<CalendarSettings>) => {
        dispatch(updateSettings(newSettings));
    };

    // Sélectionner un événement
    const handleSelectEvent = (eventId: string | null) => {
        dispatch(selectEvent(eventId));
    };

    // Ajouter un événement
    const handleAddEvent = (event: AnyCalendarEvent) => {
        dispatch(addEvent(event));
    };

    // Mettre à jour un événement
    const handleUpdateEvent = (id: string, event: Partial<AnyCalendarEvent>) => {
        dispatch(updateStoreEvent({ id, event }));
    };

    // Supprimer un événement
    const handleRemoveEvent = (id: string) => {
        dispatch(removeEvent(id));
    };

    // Rafraîchir les événements
    const handleRefreshEvents = () => {
        dispatch(fetchEvents(filters));
    };

    return {
        // État
        events,
        filteredEvents,
        loading,
        error,
        selectedEventId,
        view,
        currentRange,
        filters,
        settings,
        lastUpdated,

        // Actions
        getEventById,
        setView: handleViewChange,
        setDateRange: handleDateRangeChange,
        updateFilters: handleUpdateFilters,
        resetFilters: handleResetFilters,
        updateSettings: handleUpdateSettings,
        selectEvent: handleSelectEvent,
        addEvent: handleAddEvent,
        updateEvent: handleUpdateEvent,
        removeEvent: handleRemoveEvent,
        refreshEvents: handleRefreshEvents,

        // Utilitaires
        shouldRefresh
    };
}; 