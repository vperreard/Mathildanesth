import { useState, useEffect, useCallback } from 'react';
import {
    AnyCalendarEvent,
    CalendarFilters,
    CalendarSettings,
    CalendarViewType
} from '../types/event';
import { fetchCalendarEvents } from '../services/calendarService';
import { fr } from 'date-fns/locale';
import { addMonths, addWeeks, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

// Hook pour gérer les événements du calendrier
export const useCalendar = (initialFilters: Partial<CalendarFilters> = {}) => {
    // État des événements
    const [events, setEvents] = useState<AnyCalendarEvent[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    // Filtres
    const [filters, setFilters] = useState<CalendarFilters>({
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
    });

    // Vue du calendrier
    const [view, setView] = useState<CalendarViewType>(CalendarViewType.MONTH);
    const [currentRange, setCurrentRange] = useState<{ start: Date, end: Date }>(filters.dateRange || {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    });

    // Paramètres par défaut du calendrier
    const defaultSettings: CalendarSettings = {
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

    const [settings, setSettings] = useState<CalendarSettings>(defaultSettings);

    // Fonction pour récupérer les événements
    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await fetchCalendarEvents(filters);
            setEvents(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur inconnue'));
            console.error('Erreur dans useCalendar:', err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Récupérer les événements au chargement et quand les filtres changent
    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Mettre à jour les filtres
    const updateFilters = useCallback((newFilters: Partial<CalendarFilters>) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            ...newFilters
        }));
    }, []);

    // Gérer le changement de vue
    const handleViewChange = useCallback((newView: CalendarViewType) => {
        setView(newView);

        // Mettre à jour la plage de dates en fonction de la nouvelle vue
        setCurrentRange(prevRange => {
            const currentDate = new Date();

            switch (newView) {
                case CalendarViewType.MONTH:
                    return {
                        start: startOfMonth(currentDate),
                        end: endOfMonth(currentDate)
                    };
                case CalendarViewType.WEEK:
                    return {
                        start: startOfWeek(currentDate, { locale: fr }),
                        end: endOfWeek(currentDate, { locale: fr })
                    };
                case CalendarViewType.DAY:
                    return {
                        start: startOfDay(currentDate),
                        end: endOfDay(currentDate)
                    };
                default:
                    return prevRange;
            }
        });
    }, []);

    // Gérer le changement de plage de dates
    const handleDateRangeChange = useCallback((start: Date, end: Date) => {
        setCurrentRange({ start, end });
        updateFilters({ dateRange: { start, end } });
    }, [updateFilters]);

    // Navigation: précédent
    const navigateToPrevious = useCallback(() => {
        setCurrentRange(prevRange => {
            let newStart: Date;
            let newEnd: Date;

            switch (view) {
                case CalendarViewType.MONTH:
                    newStart = addMonths(prevRange.start, -1);
                    newEnd = endOfMonth(newStart);
                    break;
                case CalendarViewType.WEEK:
                    newStart = addWeeks(prevRange.start, -1);
                    newEnd = endOfWeek(newStart, { locale: fr });
                    break;
                case CalendarViewType.DAY:
                    newStart = addDays(prevRange.start, -1);
                    newEnd = endOfDay(newStart);
                    break;
                default:
                    newStart = addMonths(prevRange.start, -1);
                    newEnd = endOfMonth(newStart);
            }

            // Mettre à jour les filtres avec la nouvelle plage
            updateFilters({ dateRange: { start: newStart, end: newEnd } });

            return { start: newStart, end: newEnd };
        });
    }, [view, updateFilters]);

    // Navigation: suivant
    const navigateToNext = useCallback(() => {
        setCurrentRange(prevRange => {
            let newStart: Date;
            let newEnd: Date;

            switch (view) {
                case CalendarViewType.MONTH:
                    newStart = addMonths(prevRange.start, 1);
                    newEnd = endOfMonth(newStart);
                    break;
                case CalendarViewType.WEEK:
                    newStart = addWeeks(prevRange.start, 1);
                    newEnd = endOfWeek(newStart, { locale: fr });
                    break;
                case CalendarViewType.DAY:
                    newStart = addDays(prevRange.start, 1);
                    newEnd = endOfDay(newStart);
                    break;
                default:
                    newStart = addMonths(prevRange.start, 1);
                    newEnd = endOfMonth(newStart);
            }

            // Mettre à jour les filtres avec la nouvelle plage
            updateFilters({ dateRange: { start: newStart, end: newEnd } });

            return { start: newStart, end: newEnd };
        });
    }, [view, updateFilters]);

    // Navigation: aujourd'hui
    const navigateToToday = useCallback(() => {
        const today = new Date();
        let start: Date;
        let end: Date;

        switch (view) {
            case CalendarViewType.MONTH:
                start = startOfMonth(today);
                end = endOfMonth(today);
                break;
            case CalendarViewType.WEEK:
                start = startOfWeek(today, { locale: fr });
                end = endOfWeek(today, { locale: fr });
                break;
            case CalendarViewType.DAY:
                start = startOfDay(today);
                end = endOfDay(today);
                break;
            default:
                start = startOfMonth(today);
                end = endOfMonth(today);
        }

        setCurrentRange({ start, end });
        updateFilters({ dateRange: { start, end } });
    }, [view, updateFilters]);

    // Mettre à jour les paramètres du calendrier
    const updateSettings = useCallback((newSettings: Partial<CalendarSettings>) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            ...newSettings
        }));
    }, []);

    return {
        events,
        loading,
        error,
        filters,
        view,
        currentRange,
        settings,
        updateFilters,
        handleViewChange,
        handleDateRangeChange,
        navigateToPrevious,
        navigateToNext,
        navigateToToday,
        updateSettings,
        refreshEvents: fetchEvents
    };
}; 