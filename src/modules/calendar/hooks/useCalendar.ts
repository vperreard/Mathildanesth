import { useState, useCallback, useMemo } from 'react';
import {
    AnyCalendarEvent,
    CalendarFilters,
    CalendarSettings,
    CalendarViewType
} from '../types/event';
import { useCalendarCache } from './useCalendarCache';
import { useCalendarNavigation } from './useCalendarNavigation';
import { startOfMonth, endOfMonth } from 'date-fns';

// Options pour le hook useCalendar
interface UseCalendarOptions {
    cacheEnabled?: boolean;
    cacheTtl?: number;
    defaultView?: CalendarViewType;
    defaultSettings?: Partial<CalendarSettings>;
}

// Paramètres par défaut du calendrier
const DEFAULT_SETTINGS: CalendarSettings = {
    locale: 'fr',
    firstDay: 1, // Lundi
    businessHours: {
        startTime: '08:00',
        endTime: '18:00',
        daysOfWeek: [1, 2, 3, 4, 5] // Lundi à vendredi
    },
    nowIndicator: true,
    snapDuration: '00:15:00',
    slotDuration: '00:30:00',
    slotLabelInterval: '01:00:00',
    slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    },
    slotMinTime: '08:00:00',
    slotMaxTime: '20:00:00'
};

const DEFAULT_OPTIONS: UseCalendarOptions = {
    cacheEnabled: true,
    cacheTtl: 5 * 60 * 1000, // 5 minutes
    defaultView: CalendarViewType.MONTH
};

/**
 * Hook principal pour la gestion du calendrier
 * Combine les hooks spécialisés pour offrir une API unifiée
 */
export const useCalendar = (
    initialFilters: Partial<CalendarFilters> = {},
    options: UseCalendarOptions = DEFAULT_OPTIONS
) => {
    // Fusionner les options avec les valeurs par défaut
    const { cacheEnabled, cacheTtl, defaultView, defaultSettings } = { ...DEFAULT_OPTIONS, ...options };

    // Initialiser les filtres avec des valeurs par défaut
    const defaultFilters: CalendarFilters = {
        eventTypes: initialFilters.eventTypes || [],
        userIds: initialFilters.userIds || [],
        userRoles: initialFilters.userRoles || [],
        leaveTypes: initialFilters.leaveTypes || [],
        leaveStatuses: initialFilters.leaveStatuses || [],
        locationIds: initialFilters.locationIds || [],
        teamIds: initialFilters.teamIds || [],
        specialtyIds: initialFilters.specialtyIds || [],
        searchTerm: initialFilters.searchTerm || '',
        dateRange: initialFilters.dateRange || {
            start: startOfMonth(new Date()),
            end: endOfMonth(new Date())
        }
    };

    // État des filtres
    const [filters, setFilters] = useState<CalendarFilters>(defaultFilters);

    // Paramètres du calendrier
    const [settings, setSettings] = useState<CalendarSettings>({
        ...DEFAULT_SETTINGS,
        ...defaultSettings
    });

    // Utiliser le hook de navigation
    const navigation = useCalendarNavigation(
        defaultView,
        (range) => updateFilters({ dateRange: range })
    );

    // Utiliser le hook de cache pour les événements
    const cache = useCalendarCache(
        filters,
        { enabled: cacheEnabled, ttl: cacheTtl }
    );

    // Mettre à jour les filtres
    const updateFilters = useCallback((newFilters: Partial<CalendarFilters>) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            ...newFilters
        }));
    }, []);

    // Mettre à jour les paramètres
    const updateSettings = useCallback((newSettings: Partial<CalendarSettings>) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            ...newSettings
        }));
    }, []);

    // Rafraîchir les données
    const refreshEvents = useCallback(() => {
        return cache.fetchEvents(filters);
    }, [cache, filters]);

    // Combiner tous les états et fonctions pour l'API publique
    return useMemo(() => ({
        // Données et état
        events: cache.events,
        loading: cache.loading,
        error: cache.error,
        filters,
        settings,

        // Navigation et vue
        view: navigation.view,
        currentRange: navigation.currentRange,

        // Gestion des filtres et paramètres
        updateFilters,
        updateSettings,

        // Navigation
        handleViewChange: navigation.handleViewChange,
        handleDateRangeChange: navigation.handleDateRangeChange,
        navigateToPrevious: navigation.navigateToPrevious,
        navigateToNext: navigation.navigateToNext,
        navigateToToday: navigation.navigateToToday,

        // Cache et rafraîchissement
        refreshEvents,
        invalidateCache: cache.invalidateCache,
        isCacheHit: cache.isCacheHit
    }), [
        cache.events,
        cache.loading,
        cache.error,
        filters,
        settings,
        navigation.view,
        navigation.currentRange,
        updateFilters,
        updateSettings,
        navigation.handleViewChange,
        navigation.handleDateRangeChange,
        navigation.navigateToPrevious,
        navigation.navigateToNext,
        navigation.navigateToToday,
        refreshEvents,
        cache.invalidateCache,
        cache.isCacheHit
    ]);
}; 