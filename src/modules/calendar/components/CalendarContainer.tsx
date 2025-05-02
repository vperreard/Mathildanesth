import React, { memo, useState, useCallback, useMemo } from 'react';
import { CalendarProvider, useCalendarNavigation, useCalendarEvents, useCalendarFilters } from '../context/CalendarContext';
import { AnyCalendarEvent, CalendarViewType, CalendarFilters } from '../types/event';
import { CalendarHeader } from './base/CalendarHeader';
import { CalendarGrid } from './base/CalendarGrid';
import { CalendarEventModal } from './events/CalendarEventModal';
import { CalendarFiltersPanel } from './filters/CalendarFiltersPanel';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { calendarService } from '../services/calendarService';
import { Spinner } from '../../../components/ui/Spinner';

// Composants internes optimisés

// Header optimisé avec React.memo pour éviter les re-rendus inutiles
const OptimizedHeader = memo(function OptimizedHeader() {
    const { view, currentDate, currentRange, goToPrevious, goToNext, goToToday, changeView } = useCalendarNavigation();

    return (
        <CalendarHeader
            view={view}
            currentDate={currentDate}
            dateRange={currentRange}
            onPrevious={goToPrevious}
            onNext={goToNext}
            onToday={goToToday}
            onViewChange={changeView}
        />
    );
});

// Grille optimisée
const OptimizedGrid = memo(function OptimizedGrid() {
    const { view, currentRange } = useCalendarNavigation();
    const { events, loading, error, selectEvent, moveEvent } = useCalendarEvents();

    // Optimisation : ne calculer les transformations d'événements que lorsque les données changent
    const formattedEvents = useMemo(() => {
        return events.map(event => ({
            id: event.id,
            title: event.title,
            start: new Date(event.start),
            end: new Date(event.end),
            allDay: event.allDay,
            extendedProps: { ...event }
        }));
    }, [events]);

    const handleEventClick = useCallback((info: any) => {
        if (info.event?.extendedProps) {
            selectEvent(info.event.extendedProps as AnyCalendarEvent);
        }
    }, [selectEvent]);

    const handleEventDrop = useCallback((info: any) => {
        const eventId = info.event.id;
        const newStart = info.event.start;
        const newEnd = info.event.end || info.event.start;
        moveEvent(eventId, newStart, newEnd);
    }, [moveEvent]);

    if (error) {
        return (
            <div className="calendar-error">
                <p>Une erreur est survenue lors du chargement du calendrier:</p>
                <p>{error.message}</p>
                <button onClick={() => window.location.reload()}>Réessayer</button>
            </div>
        );
    }

    return (
        <div className="calendar-grid-container">
            {loading && <div className="calendar-loading-overlay"><Spinner size="lg" /></div>}
            <CalendarGrid
                events={formattedEvents}
                view={view}
                dateRange={currentRange}
                onEventClick={handleEventClick}
                onEventDrop={handleEventDrop}
                editable={true}
            />
        </div>
    );
});

// Panneau de filtres optimisé
const OptimizedFiltersPanel = memo(function OptimizedFiltersPanel() {
    const { filters, applyFilters, resetFilters, hasActiveFilters } = useCalendarFilters();
    const [isOpen, setIsOpen] = useState(false);

    const togglePanel = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    return (
        <div className="calendar-filters-container">
            <button
                className={`calendar-filters-toggle ${hasActiveFilters ? 'has-filters' : ''}`}
                onClick={togglePanel}
            >
                Filtres {hasActiveFilters && <span className="filter-badge">!</span>}
            </button>

            {isOpen && (
                <CalendarFiltersPanel
                    filters={filters}
                    onApplyFilters={applyFilters}
                    onResetFilters={resetFilters}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </div>
    );
});

// Composant interne du calendrier qui utilise le contexte
const CalendarContent = memo(function CalendarContent() {
    const { selectedEvent } = useCalendarEvents();

    return (
        <div className="calendar-container">
            <div className="calendar-toolbar">
                <OptimizedHeader />
                <OptimizedFiltersPanel />
            </div>

            <OptimizedGrid />

            {selectedEvent && (
                <CalendarEventModal
                    event={selectedEvent}
                    onClose={() => selectEvent(null)}
                />
            )}
        </div>
    );
});

// Props pour le composant principal
interface CalendarContainerProps {
    initialDate?: Date;
    initialView?: CalendarViewType;
    initialFilters?: Partial<CalendarFilters>;
    customServices?: {
        fetchEvents?: (filters: CalendarFilters) => Promise<AnyCalendarEvent[]>;
        createEvent?: (event: Omit<AnyCalendarEvent, 'id'>) => Promise<AnyCalendarEvent>;
        updateEvent?: (id: string, event: Partial<AnyCalendarEvent>) => Promise<AnyCalendarEvent>;
        deleteEvent?: (id: string) => Promise<boolean>;
    };
}

/**
 * Composant conteneur principal du calendrier
 * Gère la configuration du contexte et encapsule le composant dans une ErrorBoundary
 */
export const CalendarContainer: React.FC<CalendarContainerProps> = ({
    initialDate,
    initialView = CalendarViewType.MONTH,
    initialFilters,
    customServices
}) => {
    // Utiliser les services personnalisés ou les services par défaut
    const services = useMemo(() => {
        return {
            fetchEvents: customServices?.fetchEvents || calendarService.getEvents,
            createEvent: customServices?.createEvent || calendarService.createEvent,
            updateEvent: customServices?.updateEvent || calendarService.updateEvent,
            deleteEvent: customServices?.deleteEvent || calendarService.deleteEvent
        };
    }, [customServices]);

    return (
        <ErrorBoundary fallback={<div>Une erreur est survenue dans le calendrier. Veuillez rafraîchir la page.</div>}>
            <CalendarProvider
                initialDate={initialDate}
                initialView={initialView}
                initialFilters={initialFilters}
                services={services}
            >
                <CalendarContent />
            </CalendarProvider>
        </ErrorBoundary>
    );
}; 