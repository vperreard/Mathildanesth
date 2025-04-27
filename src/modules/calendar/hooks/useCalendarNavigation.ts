import { useState, useCallback } from 'react';
import {
    addMonths,
    addWeeks,
    addDays,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    startOfDay,
    endOfDay
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarViewType } from '../types/event';

interface DateRange {
    start: Date;
    end: Date;
}

interface UseCalendarNavigationReturn {
    view: CalendarViewType;
    currentRange: DateRange;
    setView: (view: CalendarViewType) => void;
    navigateToPrevious: () => void;
    navigateToNext: () => void;
    navigateToToday: () => void;
    handleViewChange: (view: CalendarViewType) => void;
    handleDateRangeChange: (start: Date, end: Date) => void;
}

/**
 * Hook pour gérer la navigation dans le calendrier
 * Gère les vues, les plages de dates et la navigation entre les périodes
 */
export const useCalendarNavigation = (
    initialView: CalendarViewType = CalendarViewType.MONTH,
    onDateRangeChange?: (range: DateRange) => void
): UseCalendarNavigationReturn => {
    // État pour la vue et la plage de dates
    const [view, setView] = useState<CalendarViewType>(initialView);
    const [currentRange, setCurrentRange] = useState<DateRange>({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    });

    // Mise à jour de la plage de dates en fonction de la vue
    const updateDateRangeForView = useCallback((date: Date, newView: CalendarViewType): DateRange => {
        let start: Date;
        let end: Date;

        switch (newView) {
            case CalendarViewType.MONTH:
                start = startOfMonth(date);
                end = endOfMonth(date);
                break;
            case CalendarViewType.WEEK:
                start = startOfWeek(date, { locale: fr });
                end = endOfWeek(date, { locale: fr });
                break;
            case CalendarViewType.DAY:
                start = startOfDay(date);
                end = endOfDay(date);
                break;
            case CalendarViewType.LIST:
                start = startOfWeek(date, { locale: fr });
                end = endOfWeek(addWeeks(date, 1), { locale: fr });
                break;
            case CalendarViewType.TIMELINE:
                start = startOfWeek(date, { locale: fr });
                end = endOfWeek(addWeeks(date, 1), { locale: fr });
                break;
            default:
                start = startOfMonth(date);
                end = endOfMonth(date);
        }

        return { start, end };
    }, []);

    // Gestionnaire de changement de vue
    const handleViewChange = useCallback((newView: CalendarViewType) => {
        setView(newView);

        // Mettre à jour la plage de dates en fonction de la nouvelle vue
        const middleDate = new Date(
            currentRange.start.getTime() +
            (currentRange.end.getTime() - currentRange.start.getTime()) / 2
        );

        const newRange = updateDateRangeForView(middleDate, newView);
        setCurrentRange(newRange);

        if (onDateRangeChange) {
            onDateRangeChange(newRange);
        }
    }, [currentRange, updateDateRangeForView, onDateRangeChange]);

    // Gestionnaire de changement de plage de dates
    const handleDateRangeChange = useCallback((start: Date, end: Date) => {
        const newRange = { start, end };
        setCurrentRange(newRange);

        if (onDateRangeChange) {
            onDateRangeChange(newRange);
        }
    }, [onDateRangeChange]);

    // Navigation vers la période précédente
    const navigateToPrevious = useCallback(() => {
        const { start } = currentRange;
        let newStart: Date;
        let newRange: DateRange;

        switch (view) {
            case CalendarViewType.MONTH:
                newStart = addMonths(start, -1);
                break;
            case CalendarViewType.WEEK:
                newStart = addWeeks(start, -1);
                break;
            case CalendarViewType.DAY:
                newStart = addDays(start, -1);
                break;
            case CalendarViewType.LIST:
                newStart = addWeeks(start, -1);
                break;
            case CalendarViewType.TIMELINE:
                newStart = addWeeks(start, -1);
                break;
            default:
                newStart = addMonths(start, -1);
        }

        newRange = updateDateRangeForView(newStart, view);
        setCurrentRange(newRange);

        if (onDateRangeChange) {
            onDateRangeChange(newRange);
        }
    }, [currentRange, view, updateDateRangeForView, onDateRangeChange]);

    // Navigation vers la période suivante
    const navigateToNext = useCallback(() => {
        const { start } = currentRange;
        let newStart: Date;
        let newRange: DateRange;

        switch (view) {
            case CalendarViewType.MONTH:
                newStart = addMonths(start, 1);
                break;
            case CalendarViewType.WEEK:
                newStart = addWeeks(start, 1);
                break;
            case CalendarViewType.DAY:
                newStart = addDays(start, 1);
                break;
            case CalendarViewType.LIST:
                newStart = addWeeks(start, 1);
                break;
            case CalendarViewType.TIMELINE:
                newStart = addWeeks(start, 1);
                break;
            default:
                newStart = addMonths(start, 1);
        }

        newRange = updateDateRangeForView(newStart, view);
        setCurrentRange(newRange);

        if (onDateRangeChange) {
            onDateRangeChange(newRange);
        }
    }, [currentRange, view, updateDateRangeForView, onDateRangeChange]);

    // Navigation vers aujourd'hui
    const navigateToToday = useCallback(() => {
        const today = new Date();
        const newRange = updateDateRangeForView(today, view);
        setCurrentRange(newRange);

        if (onDateRangeChange) {
            onDateRangeChange(newRange);
        }
    }, [view, updateDateRangeForView, onDateRangeChange]);

    return {
        view,
        currentRange,
        setView,
        navigateToPrevious,
        navigateToNext,
        navigateToToday,
        handleViewChange,
        handleDateRangeChange
    };
}; 