import React, { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BaseCalendar } from './BaseCalendar';
import { CalendarFiltersComponent } from './CalendarFilters';
import { CalendarLegend } from './CalendarLegend';
import { CalendarExport } from './CalendarExport';
import { AnyCalendarEvent, CalendarEventType, CalendarViewType } from '../types/event';
import { useCalendarStore } from '../store/calendarStore';
import { CalendarHeader } from './ui/CalendarHeader';
import { EventDetailModal } from './events/EventDetailModal';
import { useRouter } from 'next/navigation';
import { usePublicHolidays } from '../hooks/usePublicHolidays';

interface PersonalCalendarProps {
    userId?: string;
    editable?: boolean;
    showFilters?: boolean;
    onEventClick?: (eventId: string, eventType: string) => void;
    onRequestLeave?: () => void;
}

export const PersonalCalendar: React.FC<PersonalCalendarProps> = ({
    userId,
    editable = false,
    showFilters = true,
    onEventClick,
    onRequestLeave,
}) => {
    const router = useRouter();
    const [selectedEvent, setSelectedEvent] = useState<AnyCalendarEvent | null>(null);
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
        start: new Date(),
        end: new Date(new Date().setMonth(new Date().getMonth() + 1))
    });

    // Hooks pour les jours fériés
    const {
        holidayEvents,
        loadHolidays,
        loading: holidaysLoading
    } = usePublicHolidays();

    const {
        events,
        loading,
        error,
        filters,
        view,
        currentRange,
        updateFilters,
        setView,
        navigateToNext,
        navigateToPrevious,
        navigateToToday,
        fetchEvents,
        userSettings,
        setCurrentRange,
    } = useCalendarStore();

    // Initialiser les filtres au montage du composant
    useEffect(() => {
        updateFilters({
            eventTypes: Object.values(CalendarEventType),
            userIds: userId ? [userId] : undefined
        });
    }, [userId, updateFilters]);

    // Charger les événements au montage
    useEffect(() => {
        if (userId) {
            fetchEvents(userId);
        } else {
            fetchEvents();
        }
    }, [userId, fetchEvents]);

    // Charger les jours fériés quand la plage de dates change
    useEffect(() => {
        if (userSettings?.showPublicHolidays) {
            loadHolidays(dateRange.start, dateRange.end);
        }
    }, [dateRange, userSettings?.showPublicHolidays, loadHolidays]);

    // Gestionnaire de clic sur un événement
    const handleEventClick = useCallback((event: AnyCalendarEvent) => {
        setSelectedEvent(event);

        if (onEventClick) {
            onEventClick(event.id, event.type);
        }
    }, [onEventClick]);

    // Gestionnaire de changement de plage de dates
    const handleDateRangeChange = (start: Date, end: Date) => {
        setDateRange({ start, end });
        setCurrentRange(start, end);
    };

    // Combiner les événements réguliers avec les jours fériés
    const allEvents = [
        ...events,
        ...(userSettings?.showPublicHolidays ? holidayEvents : [])
    ];

    // Composant pour le bouton de demande de congé
    const RequestLeaveButton = (
        <button
            onClick={onRequestLeave}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
            <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Demander un congé
        </button>
    );

    // Formatage du titre de la plage de dates
    const getDateRangeTitle = () => {
        if (!currentRange.start || !currentRange.end) return '';

        if (view === CalendarViewType.MONTH) {
            return format(currentRange.start, 'MMMM yyyy', { locale: fr });
        } else if (view === CalendarViewType.WEEK) {
            return `${format(currentRange.start, 'dd')} - ${format(currentRange.end, 'dd MMMM yyyy', { locale: fr })}`;
        } else if (view === CalendarViewType.DAY) {
            return format(currentRange.start, 'EEEE dd MMMM yyyy', { locale: fr });
        }

        return `${format(currentRange.start, 'dd/MM/yyyy')} - ${format(currentRange.end, 'dd/MM/yyyy')}`;
    };

    return (
        <div className="space-y-4">
            {/* En-tête du calendrier avec navigation */}
            <CalendarHeader
                title="Mon calendrier"
                description="Consultez et gérez vos événements personnels"
                view={view}
                currentRange={currentRange}
                onViewChange={setView}
                onPrevious={navigateToPrevious}
                onNext={navigateToNext}
                onToday={navigateToToday}
                extraActions={RequestLeaveButton}
                showExport={true}
                showFilters={showFilters}
            />

            {showFilters && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-3">
                        <CalendarFiltersComponent
                            filters={filters}
                            onFilterChange={updateFilters}
                            availableEventTypes={Object.values(CalendarEventType)}
                            showLeaveFilter={true}
                            showUserFilter={false}
                            showLocationFilter={true}
                            showTeamFilter={true}
                            showSpecialtyFilter={false}
                        />
                    </div>
                    <div>
                        <CalendarLegend showHolidays={userSettings?.showPublicHolidays} />
                    </div>
                </div>
            )}

            {/* Affichage des erreurs */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                Erreur lors du chargement des données: {error.message}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Disposition responsive: mobile comme avant, améliorations sur laptop */}
            <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {/* Calendrier (mobile: 100% largeur, laptop: 4/5, grands écrans: 5/6) */}
                <div className="lg:col-span-4 xl:col-span-5 order-2 lg:order-1">
                    <div className="bg-white rounded-lg p-0 sm:p-4 shadow">
                        <BaseCalendar
                            events={allEvents}
                            view={view}
                            userSettings={userSettings}
                            loading={loading || holidaysLoading}
                            editable={editable}
                            selectable={editable}
                            onEventClick={handleEventClick}
                            onDateRangeChange={handleDateRangeChange}
                        />
                    </div>
                </div>

                {/* Légende et actions */}
                <div className="lg:col-span-1 order-1 lg:order-2">
                    <div className="space-y-4">
                        <CalendarExport events={events} currentRange={currentRange} />
                    </div>
                </div>
            </div>

            {/* Modal de détail d'événement */}
            {selectedEvent && (
                <EventDetailModal
                    event={selectedEvent}
                    isOpen={!!selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                />
            )}
        </div>
    );
};

// Fonction utilitaire pour obtenir la description d'un type d'événement
function getEventTypeDescription(event: AnyCalendarEvent): string {
    switch (event.type) {
        case CalendarEventType.LEAVE:
            return 'Congé';
        case CalendarEventType.DUTY:
            return 'Garde';
        case CalendarEventType.ON_CALL:
            return 'Astreinte';
        case CalendarEventType.ASSIGNMENT:
            return 'Affectation';
        default:
            return 'Événement';
    }
} 