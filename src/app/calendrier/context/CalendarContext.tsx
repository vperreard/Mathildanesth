import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { CalendarEvent } from '../components/CalendarGrid';
import { EventType } from '../components/CalendarEvent';
import { CalendarViewType } from '../components/CalendarHeader';
import { useCalendarNavigation } from '../hooks/useCalendarNavigation';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { useCalendarFilters, CalendarFilters } from '../hooks/useCalendarFilters';
import { useCalendarCache } from '../hooks/useCalendarCache';

// Type des fonctions de service (ces fonctions seraient définies ailleurs)
type FetchEventsFunction = (
    start: Date,
    end: Date,
    filters?: Partial<CalendarFilters>
) => Promise<CalendarEvent[]>;

interface EventServices {
    fetchEvents?: FetchEventsFunction;
    createEvent?: (event: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent>;
    updateEvent?: (id: string, event: Partial<CalendarEvent>) => Promise<CalendarEvent>;
    deleteEvent?: (id: string) => Promise<boolean>;
}

// Props du provider
interface CalendarProviderProps {
    children: ReactNode;
    initialDate?: Date;
    initialView?: CalendarViewType;
    initialFilters?: Partial<CalendarFilters>;
    eventServices?: EventServices;
    cacheDuration?: number;
}

// Type du contexte
interface CalendarContextValue {
    // État de navigation
    currentDate: Date;
    view: CalendarViewType;
    currentRange: { start: Date; end: Date };
    goToDate: (date: Date) => void;
    goToToday: () => void;
    goToPrevious: () => void;
    goToNext: () => void;
    changeView: (newView: CalendarViewType) => void;
    calendarRef: React.MutableRefObject<any>;

    // État des événements
    events: CalendarEvent[];
    loading: boolean;
    error: Error | null;
    addEvent: (event: CalendarEvent) => void;
    updateEvent: (event: CalendarEvent) => void;
    deleteEvent: (eventId: string) => void;
    moveEvent: (eventId: string, start: Date, end: Date) => void;
    resizeEvent: (eventId: string, start: Date, end: Date) => void;
    refreshEvents: () => Promise<void>;

    // État des filtres
    filters: CalendarFilters;
    setEventTypes: (eventTypes: EventType[]) => void;
    toggleEventType: (eventType: EventType) => void;
    setSearchTerm: (searchTerm: string) => void;
    setDateRange: (dateRange: { start: Date; end: Date }) => void;
    resetFilters: () => void;
    setAllFilters: (filters: Partial<CalendarFilters>) => void;
    hasActiveFilters: boolean;

    // Services d'événements
    eventServices: EventServices;
}

// Création du contexte avec une valeur par défaut undefined
const CalendarContext = createContext<CalendarContextValue | undefined>(undefined);

// Provider qui fournit l'état et les fonctions du calendrier
export const CalendarProvider: React.FC<CalendarProviderProps> = ({
    children,
    initialDate = new Date(),
    initialView = CalendarViewType.MONTH,
    initialFilters = {},
    eventServices = {},
    cacheDuration = 5 * 60 * 1000 // 5 minutes par défaut
}) => {
    // Utilisation du hook de navigation
    const navigation = useCalendarNavigation(initialDate, initialView);

    // Utilisation du hook de cache
    const cache = useCalendarCache<CalendarEvent[]>({ cacheDuration });

    // Utilisation du hook de filtres
    const filters = useCalendarFilters({ initialFilters });

    // Wrapper pour fetchEvents qui utilise le cache
    const fetchEventsWithCache = async (start: Date, end: Date, filterOptions?: unknown) => {
        if (!eventServices.fetchEvents) {
            return [];
        }

        return cache.fetchWithCache(
            (dateRange, filters) => eventServices.fetchEvents!(dateRange.start, dateRange.end, filters),
            { start, end },
            filterOptions
        );
    };

    // Utilisation du hook d'événements
    const events = useCalendarEvents({
        fetchEvents: fetchEventsWithCache,
        dateRange: navigation.currentRange,
        filters: filters.filters,
        cacheTime: cacheDuration
    });

    // Création du contexte mémorisé
    const value = useMemo(() => ({
        // Navigation
        currentDate: navigation.currentDate,
        view: navigation.view,
        currentRange: navigation.currentRange,
        goToDate: navigation.goToDate,
        goToToday: navigation.goToToday,
        goToPrevious: navigation.goToPrevious,
        goToNext: navigation.goToNext,
        changeView: navigation.changeView,
        calendarRef: navigation.calendarRef,

        // Événements
        events: events.events,
        loading: events.loading,
        error: events.error,
        addEvent: events.addEvent,
        updateEvent: events.updateEvent,
        deleteEvent: events.deleteEvent,
        moveEvent: events.moveEvent,
        resizeEvent: events.resizeEvent,
        refreshEvents: events.refreshEvents,

        // Filtres
        filters: filters.filters,
        setEventTypes: filters.setEventTypes,
        toggleEventType: filters.toggleEventType,
        setSearchTerm: filters.setSearchTerm,
        setDateRange: filters.setDateRange,
        resetFilters: filters.resetFilters,
        setAllFilters: filters.setAllFilters,
        hasActiveFilters: filters.hasActiveFilters,

        // Services d'événements
        eventServices
    }), [
        navigation,
        events,
        filters,
        eventServices
    ]);

    return (
        <CalendarContext.Provider value={value}>
            {children}
        </CalendarContext.Provider>
    );
};

// Hook personnalisé pour accéder facilement au contexte
export const useCalendarContext = (): CalendarContextValue => {
    const context = useContext(CalendarContext);
    if (context === undefined) {
        throw new Error("useCalendarContext doit être utilisé à l'intérieur d'un CalendarProvider");
    }
    return context;
};

// Export d'un hook pour n'accéder qu'à la navigation
export const useCalendarContextNavigation = () => {
    const {
        currentDate,
        view,
        currentRange,
        goToDate,
        goToToday,
        goToPrevious,
        goToNext,
        changeView,
        calendarRef
    } = useCalendarContext();

    return {
        currentDate,
        view,
        currentRange,
        goToDate,
        goToToday,
        goToPrevious,
        goToNext,
        changeView,
        calendarRef
    };
};

// Export d'un hook pour n'accéder qu'aux événements
export const useCalendarContextEvents = () => {
    const {
        events,
        loading,
        error,
        addEvent,
        updateEvent,
        deleteEvent,
        moveEvent,
        resizeEvent,
        refreshEvents
    } = useCalendarContext();

    return {
        events,
        loading,
        error,
        addEvent,
        updateEvent,
        deleteEvent,
        moveEvent,
        resizeEvent,
        refreshEvents
    };
};

// Export d'un hook pour n'accéder qu'aux filtres
export const useCalendarContextFilters = () => {
    const {
        filters,
        setEventTypes,
        toggleEventType,
        setSearchTerm,
        setDateRange,
        resetFilters,
        setAllFilters,
        hasActiveFilters
    } = useCalendarContext();

    return {
        filters,
        setEventTypes,
        toggleEventType,
        setSearchTerm,
        setDateRange,
        resetFilters,
        setAllFilters,
        hasActiveFilters
    };
}; 