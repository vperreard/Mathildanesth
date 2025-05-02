import { useState, useCallback, useRef, useEffect } from 'react';
import { addDays, addMonths, addWeeks, startOfDay, startOfMonth, startOfWeek, endOfMonth, endOfWeek, isSameDay } from 'date-fns';
import { CalendarViewType } from '../components/CalendarHeader';

interface CalendarNavigation {
    currentDate: Date;
    view: CalendarViewType;
    currentRange: {
        start: Date;
        end: Date;
    };
    goToDate: (date: Date) => void;
    goToToday: () => void;
    goToPrevious: () => void;
    goToNext: () => void;
    changeView: (newView: CalendarViewType) => void;
    calendarRef: React.MutableRefObject<any>;
}

/**
 * Hook personnalisé pour gérer la navigation dans le calendrier
 */
export const useCalendarNavigation = (
    initialDate: Date = new Date(),
    initialView: CalendarViewType = CalendarViewType.MONTH
): CalendarNavigation => {
    // Référence vers l'instance FullCalendar
    const calendarRef = useRef<any>(null);

    // États pour la date actuelle et la vue
    const [currentDate, setCurrentDate] = useState<Date>(startOfDay(initialDate));
    const [view, setView] = useState<CalendarViewType>(initialView);

    // État pour la plage de dates actuellement affichée
    const [currentRange, setCurrentRange] = useState(() => {
        return calculateDateRange(currentDate, view);
    });

    // Fonction pour calculer la plage de dates en fonction de la date et de la vue
    const calculateDateRange = useCallback((date: Date, calendarView: CalendarViewType) => {
        let start: Date;
        let end: Date;

        switch (calendarView) {
            case CalendarViewType.MONTH:
                start = startOfMonth(date);
                end = endOfMonth(date);
                // Étendre aux semaines complètes
                start = startOfWeek(start, { weekStartsOn: 1 }); // Commence le lundi
                end = endOfWeek(end, { weekStartsOn: 1 }); // Termine le dimanche
                break;
            case CalendarViewType.WEEK:
                start = startOfWeek(date, { weekStartsOn: 1 });
                end = endOfWeek(date, { weekStartsOn: 1 });
                break;
            case CalendarViewType.DAY:
                start = startOfDay(date);
                end = startOfDay(date);
                break;
            case CalendarViewType.LIST:
                start = startOfDay(date);
                end = addDays(start, 14); // Vue liste sur 2 semaines par défaut
                break;
            default:
                start = startOfWeek(date, { weekStartsOn: 1 });
                end = endOfWeek(date, { weekStartsOn: 1 });
        }

        return { start, end };
    }, []);

    // Mettre à jour la plage de dates lorsque la date ou la vue change
    useEffect(() => {
        setCurrentRange(calculateDateRange(currentDate, view));
    }, [currentDate, view, calculateDateRange]);

    // Aller à une date spécifique
    const goToDate = useCallback((date: Date) => {
        setCurrentDate(startOfDay(date));

        // Si l'API FullCalendar est disponible, synchroniser
        if (calendarRef.current) {
            const api = calendarRef.current.getApi();
            api.gotoDate(date);
        }
    }, []);

    // Aller à aujourd'hui
    const goToToday = useCallback(() => {
        const today = new Date();
        goToDate(today);
    }, [goToDate]);

    // Aller à la période précédente
    const goToPrevious = useCallback(() => {
        setCurrentDate(prevDate => {
            let newDate: Date;

            switch (view) {
                case CalendarViewType.MONTH:
                    newDate = addMonths(prevDate, -1);
                    break;
                case CalendarViewType.WEEK:
                    newDate = addWeeks(prevDate, -1);
                    break;
                case CalendarViewType.DAY:
                    newDate = addDays(prevDate, -1);
                    break;
                default:
                    newDate = addWeeks(prevDate, -1);
            }

            // Si l'API FullCalendar est disponible, synchroniser
            if (calendarRef.current) {
                const api = calendarRef.current.getApi();
                api.prev();
            }

            return newDate;
        });
    }, [view]);

    // Aller à la période suivante
    const goToNext = useCallback(() => {
        setCurrentDate(prevDate => {
            let newDate: Date;

            switch (view) {
                case CalendarViewType.MONTH:
                    newDate = addMonths(prevDate, 1);
                    break;
                case CalendarViewType.WEEK:
                    newDate = addWeeks(prevDate, 1);
                    break;
                case CalendarViewType.DAY:
                    newDate = addDays(prevDate, 1);
                    break;
                default:
                    newDate = addWeeks(prevDate, 1);
            }

            // Si l'API FullCalendar est disponible, synchroniser
            if (calendarRef.current) {
                const api = calendarRef.current.getApi();
                api.next();
            }

            return newDate;
        });
    }, [view]);

    // Changer de vue
    const changeView = useCallback((newView: CalendarViewType) => {
        setView(newView);

        // Si l'API FullCalendar est disponible, synchroniser
        if (calendarRef.current) {
            const api = calendarRef.current.getApi();
            api.changeView(newView);
        }
    }, []);

    // Retourner l'API de navigation
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