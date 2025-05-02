import React, { useState, useCallback, useEffect, useMemo, RefObject, forwardRef } from 'react';
import { CalendarHeader, CalendarViewType } from './CalendarHeader';
import { CalendarGrid, CalendarEvent as CalendarEventType } from './CalendarGrid';
import { CalendarEvent, EventType } from './CalendarEvent';
import { CalendarProvider, useCalendarContext } from '../context/CalendarContext';
import { CalendarLoading } from './CalendarLoading';
import { CalendarError } from './CalendarError';
import { ErrorBoundary } from './ErrorBoundary';
import '../styles/calendar-responsive.css';

export interface CalendarProps {
    events?: CalendarEventType[];
    initialView?: CalendarViewType;
    loading?: boolean;
    editable?: boolean;
    selectable?: boolean;
    onEventClick?: (event: CalendarEventType) => void;
    onEventDrop?: (eventId: string, newStart: Date, newEnd: Date) => void;
    onEventResize?: (eventId: string, newStart: Date, newEnd: Date) => void;
    onDateSelect?: (start: Date, end: Date) => void;
    title?: string;
    description?: string;
    extraHeaderActions?: React.ReactNode;
    settings?: {
        businessHours?: boolean | object;
        nowIndicator?: boolean;
        snapDuration?: string;
        slotDuration?: string;
        slotLabelInterval?: string;
        slotLabelFormat?: any;
        slotMinTime?: string;
        slotMaxTime?: string;
    };
    fetchEvents?: (start: Date, end: Date, filters?: any) => Promise<CalendarEventType[]>;
    initialDate?: Date;
    onViewChange?: (view: CalendarViewType) => void;
    onDateRangeChange?: (start: Date, end: Date) => void;
}

// Interface pour les props du composant CalendarHeaderSection
interface CalendarHeaderSectionProps {
    view: CalendarViewType;
    currentRange: { start: Date; end: Date };
    onViewChange: (view: CalendarViewType) => void;
    onPrevious: () => void;
    onNext: () => void;
    onToday: () => void;
}

// Composant pour l'en-tête du calendrier - optimisé avec React.memo
const CalendarHeaderSection = React.memo<CalendarHeaderSectionProps>(({
    view,
    currentRange,
    onViewChange,
    onPrevious,
    onNext,
    onToday
}) => {
    return (
        <CalendarHeader
            view={view}
            currentRange={currentRange}
            onViewChange={onViewChange}
            onPrevious={onPrevious}
            onNext={onNext}
            onToday={onToday}
        />
    );
});
CalendarHeaderSection.displayName = 'CalendarHeaderSection';

// Interface pour les props du composant CalendarGridSection
interface CalendarGridSectionProps {
    calendarRef: RefObject<any>;
    events: CalendarEventType[];
    view: CalendarViewType;
    loading: boolean;
    editable: boolean;
    selectable: boolean;
    onEventDrop: (eventId: string, start: Date, end: Date) => void;
    onEventResize: (eventId: string, start: Date, end: Date) => void;
    onDateSelect: (start: Date, end: Date) => void;
    onEventClick?: (event: CalendarEventType) => void;
    headerToolbar: {
        left: string;
        center: string;
        right: string;
    };
}

// Composant pour la grille du calendrier - optimisé avec React.memo
const CalendarGridSection = React.memo<CalendarGridSectionProps>(({
    calendarRef,
    events,
    view,
    loading,
    editable,
    selectable,
    onEventDrop,
    onEventResize,
    onDateSelect,
    onEventClick,
    headerToolbar
}) => {
    return (
        <div className="calendar-body bg-white rounded-lg shadow overflow-hidden">
            <CalendarGrid
                events={events}
                view={view}
                loading={loading}
                editable={editable}
                selectable={selectable}
                onEventDrop={onEventDrop}
                onEventResize={onEventResize}
                onDateSelect={onDateSelect}
                onEventClick={onEventClick}
                headerToolbar={headerToolbar}
                ref={calendarRef}
            />
        </div>
    );
});
CalendarGridSection.displayName = 'CalendarGridSection';

// Composant Calendar interne qui utilise le contexte
const CalendarInner: React.FC = () => {
    // Accéder au contexte
    const {
        events,
        loading,
        error,
        view,
        currentRange,
        goToPrevious,
        goToNext,
        goToToday,
        changeView,
        calendarRef,
        moveEvent,
        resizeEvent,
        addEvent,
        filters,
        updateEvent
    } = useCalendarContext();

    // Callbacks optimisés pour éviter des rendus inutiles
    const handleEventDrop = useCallback((eventId: string, start: Date, end: Date) => {
        moveEvent(eventId, start, end);
    }, [moveEvent]);

    const handleEventResize = useCallback((eventId: string, start: Date, end: Date) => {
        resizeEvent(eventId, start, end);
    }, [resizeEvent]);

    const handleDateSelect = useCallback((start: Date, end: Date) => {
        const newEvent: CalendarEventType = {
            id: `temp-${Date.now()}`,
            title: 'Nouvel événement',
            start,
            end,
            extendedProps: {
                type: EventType.OTHER
            }
        };
        addEvent(newEvent);
    }, [addEvent]);

    const handleEventClick = useCallback((event: CalendarEventType) => {
        // Vous pouvez personnaliser le comportement lors du clic sur un événement
        console.log('Event clicked:', event);
        // Utilisez updateEvent si nécessaire
    }, []);

    // Optimiser les re-rendus des événements avec useMemo
    const memoizedEvents = useMemo(() => events, [events]);

    // Définir le headerToolbar une seule fois
    const headerToolbar = useMemo(() => ({
        left: '',
        center: '',
        right: ''
    }), []);

    // Retourner différents composants selon l'état
    if (loading) {
        return <CalendarLoading />;
    }

    return (
        <div className="calendar-container flex flex-col gap-4">
            {/* En-tête du calendrier avec navigation et contrôles */}
            <CalendarHeaderSection
                view={view}
                currentRange={currentRange}
                onViewChange={changeView}
                onPrevious={goToPrevious}
                onNext={goToNext}
                onToday={goToToday}
            />

            {/* Grille du calendrier */}
            <CalendarGridSection
                calendarRef={calendarRef}
                events={memoizedEvents}
                view={view}
                loading={loading}
                editable={true}
                selectable={true}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                onDateSelect={handleDateSelect}
                onEventClick={handleEventClick}
                headerToolbar={headerToolbar}
            />

            {/* Affichage des erreurs */}
            {error && <CalendarError error={error} />}
        </div>
    );
};

/**
 * Calendar - Composant principal du calendrier utilisant un provider de contexte
 */
export const Calendar: React.FC<CalendarProps> = ({
    events = [],
    initialView = CalendarViewType.MONTH,
    loading = false,
    editable = false,
    selectable = false,
    onEventClick,
    onEventDrop,
    onEventResize,
    onDateSelect,
    title = 'Calendrier',
    description,
    extraHeaderActions,
    settings,
    fetchEvents,
    initialDate = new Date(),
    onViewChange,
    onDateRangeChange
}) => {
    // Créer un service d'événements à partir des callbacks fournis
    const eventServices = useMemo(() => ({
        fetchEvents: fetchEvents ?
            async (start: Date, end: Date, filters?: any) => {
                const result = await fetchEvents(start, end, filters);
                return result;
            }
            : undefined,
        updateEvent: onEventClick ?
            async (id: string, event: Partial<CalendarEventType>) => {
                if (onEventClick) {
                    onEventClick({
                        id,
                        ...event,
                        start: event.start || new Date(),
                        end: event.end || new Date(),
                        title: event.title || ''
                    });
                }
                return { id, ...event, start: event.start || new Date(), end: event.end || new Date(), title: event.title || '' };
            }
            : undefined,
        moveEvent: onEventDrop ?
            async (id: string, event: Partial<CalendarEventType>) => {
                if (event.start && event.end && onEventDrop) {
                    onEventDrop(id, event.start instanceof Date ? event.start : new Date(event.start),
                        event.end instanceof Date ? event.end : new Date(event.end));
                }
                return { id, ...event, start: event.start || new Date(), end: event.end || new Date(), title: event.title || '' };
            }
            : undefined,
        resizeEvent: onEventResize ?
            async (id: string, event: Partial<CalendarEventType>) => {
                if (event.start && event.end && onEventResize) {
                    onEventResize(id, event.start instanceof Date ? event.start : new Date(event.start),
                        event.end instanceof Date ? event.end : new Date(event.end));
                }
                return { id, ...event, start: event.start || new Date(), end: event.end || new Date(), title: event.title || '' };
            }
            : undefined
    }), [fetchEvents, onEventClick, onEventDrop, onEventResize]);

    return (
        <ErrorBoundary fallback={<div className="text-red-500">Une erreur est survenue dans le calendrier</div>}>
            <CalendarProvider
                initialDate={initialDate}
                initialView={initialView}
                eventServices={eventServices}
            >
                <CalendarInner />
            </CalendarProvider>
        </ErrorBoundary>
    );
};

// Exporter tous les composants et types pour les rendre facilement accessibles
export { CalendarHeader, CalendarViewType } from './CalendarHeader';
export { CalendarGrid, type CalendarEvent as CalendarEventType } from './CalendarGrid';
export { CalendarDay } from './CalendarDay';
export { CalendarEvent, EventType } from './CalendarEvent'; 