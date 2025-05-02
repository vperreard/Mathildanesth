import React, { createContext, useContext, useReducer, ReactNode, useMemo, useCallback } from 'react';
import { AnyCalendarEvent, CalendarEventType, CalendarFilters, CalendarViewType } from '../types/event';
import { useCalendarNavigation as useCalendarNavigationHook } from '../hooks/useCalendarNavigation';
import { useCalendarEvents as useCalendarEventsHook } from '../hooks/useCalendarEvents';
import { useCalendarFilters as useCalendarFiltersHook } from '../hooks/useCalendarFilters';
import { useCalendarCache } from '../hooks/useCalendarCache';
import { produce } from 'immer';

// État initial du calendrier
interface CalendarState {
    events: AnyCalendarEvent[];
    filteredEvents: AnyCalendarEvent[];
    currentDate: Date;
    viewType: CalendarViewType;
    dateRange: { start: Date; end: Date };
    filters: CalendarFilters;
    loading: boolean;
    error: Error | null;
    selectedEvent: AnyCalendarEvent | null;
}

// Types d'actions pour le reducer
type CalendarAction =
    | { type: 'SET_EVENTS'; payload: AnyCalendarEvent[] }
    | { type: 'SET_FILTERED_EVENTS'; payload: AnyCalendarEvent[] }
    | { type: 'SET_DATE'; payload: Date }
    | { type: 'SET_VIEW_TYPE'; payload: CalendarViewType }
    | { type: 'SET_DATE_RANGE'; payload: { start: Date; end: Date } }
    | { type: 'SET_FILTERS'; payload: Partial<CalendarFilters> }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: Error | null }
    | { type: 'SELECT_EVENT'; payload: AnyCalendarEvent | null }
    | { type: 'ADD_EVENT'; payload: AnyCalendarEvent }
    | { type: 'UPDATE_EVENT'; payload: AnyCalendarEvent }
    | { type: 'REMOVE_EVENT'; payload: string };

// Reducer pour gérer l'état du calendrier
const calendarReducer = (state: CalendarState, action: CalendarAction): CalendarState => {
    return produce(state, draft => {
        switch (action.type) {
            case 'SET_EVENTS':
                draft.events = action.payload;
                break;
            case 'SET_FILTERED_EVENTS':
                draft.filteredEvents = action.payload;
                break;
            case 'SET_DATE':
                draft.currentDate = action.payload;
                break;
            case 'SET_VIEW_TYPE':
                draft.viewType = action.payload;
                break;
            case 'SET_DATE_RANGE':
                draft.dateRange = action.payload;
                break;
            case 'SET_FILTERS':
                draft.filters = { ...draft.filters, ...action.payload };
                break;
            case 'SET_LOADING':
                draft.loading = action.payload;
                break;
            case 'SET_ERROR':
                draft.error = action.payload;
                break;
            case 'SELECT_EVENT':
                draft.selectedEvent = action.payload;
                break;
            case 'ADD_EVENT':
                draft.events.push(action.payload);
                break;
            case 'UPDATE_EVENT': {
                const index = draft.events.findIndex(event => event.id === action.payload.id);
                if (index !== -1) {
                    draft.events[index] = action.payload;
                }
                break;
            }
            case 'REMOVE_EVENT':
                draft.events = draft.events.filter(event => event.id !== action.payload);
                break;
        }
    });
};

// Interface pour le contexte du calendrier
interface CalendarContextType {
    // État
    events: AnyCalendarEvent[];
    filteredEvents: AnyCalendarEvent[];
    currentDate: Date;
    viewType: CalendarViewType;
    dateRange: { start: Date; end: Date };
    filters: CalendarFilters;
    loading: boolean;
    error: Error | null;
    selectedEvent: AnyCalendarEvent | null;

    // Actions
    dispatch: React.Dispatch<CalendarAction>;

    // Navigation
    goToDate: (date: Date | string) => void;
    goToToday: () => void;
    goToNext: () => void;
    goToPrevious: () => void;
    changeViewType: (viewType: CalendarViewType) => void;

    // Filtres
    setFilter: (filter: Partial<CalendarFilters>) => void;
    resetFilters: () => void;
    toggleEventType: (eventType: CalendarEventType) => void;
    toggleLocation: (locationId: string) => void;

    // Événements
    refreshEvents: () => Promise<void>;
    addEvent: (event: AnyCalendarEvent) => void;
    updateEvent: (event: AnyCalendarEvent) => void;
    removeEvent: (eventId: string) => void;
    updateEventStatus: (eventId: string, status: CalendarEventType) => void;
    selectEvent: (event: AnyCalendarEvent | null) => void;
}

// Valeurs par défaut pour le contexte
const defaultCalendarContext: CalendarContextType = {
    events: [],
    filteredEvents: [],
    currentDate: new Date(),
    viewType: CalendarViewType.DAY,
    dateRange: {
        start: new Date(),
        end: new Date()
    },
    filters: {
        eventTypes: [],
        dateRange: {
            start: new Date(),
            end: new Date()
        }
    },
    loading: false,
    error: null,
    selectedEvent: null,

    // Fonctions vides qui seront remplacées
    dispatch: () => { },
    goToDate: () => { },
    goToToday: () => { },
    goToNext: () => { },
    goToPrevious: () => { },
    changeViewType: () => { },
    setFilter: () => { },
    resetFilters: () => { },
    toggleEventType: () => { },
    toggleLocation: () => { },
    refreshEvents: async () => { },
    addEvent: () => { },
    updateEvent: () => { },
    removeEvent: () => { },
    updateEventStatus: () => { },
    selectEvent: () => { }
};

// État initial pour le reducer
const initialState: CalendarState = {
    events: [],
    filteredEvents: [],
    currentDate: new Date(),
    viewType: CalendarViewType.DAY,
    dateRange: {
        start: new Date(),
        end: new Date()
    },
    filters: {
        eventTypes: [],
        dateRange: {
            start: new Date(),
            end: new Date()
        }
    },
    loading: false,
    error: null,
    selectedEvent: null
};

// Création du contexte
const CalendarContext = createContext<CalendarContextType>(defaultCalendarContext);

// Props pour le provider
interface CalendarProviderProps {
    children: ReactNode;
    initialDate?: Date;
    initialView?: CalendarViewType;
    initialFilters?: Partial<CalendarFilters>;
}

// Provider du contexte
export const CalendarProvider: React.FC<CalendarProviderProps> = ({
    children,
    initialDate,
    initialView,
    initialFilters
}) => {
    // Créer un état initial personnalisé
    const customInitialState: CalendarState = useMemo(() => ({
        ...initialState,
        currentDate: initialDate || initialState.currentDate,
        viewType: initialView || initialState.viewType,
        filters: { ...initialState.filters, ...initialFilters }
    }), [initialDate, initialView, initialFilters]);

    // Utiliser le reducer pour gérer l'état
    const [state, dispatch] = useReducer(calendarReducer, customInitialState);

    // Utiliser les hooks personnalisés
    const navigation = useCalendarNavigationHook(initialDate || state.currentDate, initialView || state.viewType);
    const filters = useCalendarFiltersHook({ initialFilters: state.filters });
    const cache = useCalendarCache();

    // Synchroniser la plage de dates avec la navigation
    React.useEffect(() => {
        if (navigation.dateRange) {
            dispatch({ type: 'SET_DATE_RANGE', payload: navigation.dateRange });
        }
    }, [navigation.dateRange]);

    // Configurer le hook d'événements avec les filtres et la plage de dates
    const eventsOptions = useMemo(() => ({
        initialFilters: {
            ...state.filters,
            dateRange: state.dateRange
        },
        autoLoad: true
    }), [state.filters, state.dateRange]);

    const events = useCalendarEventsHook(eventsOptions);

    // Synchroniser l'état avec les hooks
    React.useEffect(() => {
        dispatch({ type: 'SET_EVENTS', payload: events.events });
        dispatch({ type: 'SET_FILTERED_EVENTS', payload: events.filteredEvents });
        dispatch({ type: 'SET_LOADING', payload: events.loading });
        if (events.error) {
            dispatch({ type: 'SET_ERROR', payload: events.error });
        }
    }, [events.events, events.filteredEvents, events.loading, events.error]);

    // Adapter setFilter pour correspondre à notre signature
    const setFilter = useCallback((filter: Partial<CalendarFilters>) => {
        dispatch({ type: 'SET_FILTERS', payload: filter });
        events.setFilter(filter);
    }, [events]);

    // Sélectionner un événement
    const selectEvent = useCallback((event: AnyCalendarEvent | null) => {
        dispatch({ type: 'SELECT_EVENT', payload: event });
    }, []);

    // Construire le contexte complet
    const contextValue: CalendarContextType = useMemo(() => ({
        // État
        ...state,
        dispatch,

        // Navigation
        goToDate: navigation.goToDate,
        goToToday: navigation.goToToday,
        goToNext: navigation.goToNext,
        goToPrevious: navigation.goToPrevious,
        changeViewType: navigation.changeViewType,

        // Filtres
        setFilter,
        resetFilters: filters.resetFilters,
        toggleEventType: filters.toggleEventType,
        toggleLocation: filters.toggleLocation,

        // Événements
        refreshEvents: events.refresh,
        addEvent: events.addEvent,
        updateEvent: events.updateEvent,
        removeEvent: events.removeEvent,
        updateEventStatus: events.updateEventStatus,
        selectEvent
    }), [
        state,
        dispatch,
        navigation,
        filters,
        events,
        selectEvent,
        setFilter
    ]);

    return (
        <CalendarContext.Provider value={contextValue}>
            {children}
        </CalendarContext.Provider>
    );
};

// Hook pour utiliser le contexte
export const useCalendarContext = () => {
    const context = useContext(CalendarContext);

    if (!context) {
        throw new Error("useCalendarContext doit être utilisé à l'intérieur d'un CalendarProvider");
    }

    return context;
};

// Hooks spécialisés pour accéder à des parties spécifiques du contexte
export const useCalendarNavigation = () => {
    const {
        currentDate,
        viewType,
        dateRange,
        goToDate,
        goToToday,
        goToNext,
        goToPrevious,
        changeViewType
    } = useCalendarContext();

    return {
        currentDate,
        viewType,
        dateRange,
        goToDate,
        goToToday,
        goToNext,
        goToPrevious,
        changeViewType
    };
};

export const useCalendarEvents = () => {
    const {
        events,
        filteredEvents,
        loading,
        error,
        selectedEvent,
        refreshEvents,
        addEvent,
        updateEvent,
        removeEvent,
        updateEventStatus,
        selectEvent
    } = useCalendarContext();

    return {
        events,
        filteredEvents,
        loading,
        error,
        selectedEvent,
        refreshEvents,
        addEvent,
        updateEvent,
        removeEvent,
        updateEventStatus,
        selectEvent
    };
};

export const useCalendarFilters = () => {
    const {
        filters,
        setFilter,
        resetFilters,
        toggleEventType,
        toggleLocation
    } = useCalendarContext();

    return {
        filters,
        setFilter,
        resetFilters,
        toggleEventType,
        toggleLocation,
        hasActiveFilters: filters.eventTypes.length > 0 ||
            (filters.locationIds?.length || 0) > 0 ||
            (filters.userIds?.length || 0) > 0
    };
}; 