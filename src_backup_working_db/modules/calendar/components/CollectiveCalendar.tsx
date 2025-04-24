import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BaseCalendar } from './BaseCalendar';
import { CalendarFiltersComponent } from './CalendarFilters';
import { CalendarLegend } from './CalendarLegend';
import { CalendarExport } from './CalendarExport';
import { useCalendar } from '../hooks/useCalendar';
import { AnyCalendarEvent, CalendarEventType, CalendarViewType } from '../types/event';
import { User } from '../../../types/user';

interface CollectiveCalendarProps {
    onEventClick?: (eventId: string, eventType: string) => void;
}

export const CollectiveCalendar: React.FC<CollectiveCalendarProps> = ({
    onEventClick,
}) => {
    // Gérer l'événement sélectionné et le modal
    const [selectedEvent, setSelectedEvent] = useState<AnyCalendarEvent | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    // Filtres par défaut pour le calendrier collectif (focus sur les congés)
    const defaultFilters = {
        eventTypes: [CalendarEventType.LEAVE],
    };

    // Utiliser le hook de calendrier
    const {
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
        navigateToToday
    } = useCalendar(defaultFilters);

    // Gestionnaire de clic sur un événement
    const handleEventClick = useCallback((eventId: string, eventType: string) => {
        // Trouver l'événement sélectionné
        const event = events.find(e => e.id === eventId);

        // Si l'événement est trouvé, ouvrir le modal
        if (event) {
            // Extraire le vrai ID (suppression du préfixe)
            const realId = eventId.includes('-') ? eventId.split('-')[1] : eventId;

            // Créer les données d'événement
            const eventData = {
                ...event,
                id: realId,
                user: {
                    id: event.userId,
                    firstName: event.user?.firstName || '',
                    lastName: event.user?.lastName || '',
                } as User,
                userId: event.userId,
                ...event
            };

            setSelectedEvent(eventData);
            setIsModalOpen(true);

            if (onEventClick) {
                onEventClick(realId, eventType);
            }
        }
    }, [events, onEventClick]);

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

    // Configuration des boutons de la barre d'outils
    const headerToolbar = {
        left: '', // Géré par nos propres boutons
        center: 'title',
        right: '' // Géré par nos propres boutons
    };

    return (
        <div className="space-y-4">
            {/* En-tête avec titre et contrôles */}
            <div className="bg-white shadow rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 sm:mb-0">
                        Calendrier des congés
                    </h2>

                    <div className="flex flex-wrap gap-2 justify-end">
                        {/* Contrôles de navigation */}
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                            <button
                                onClick={navigateToPrevious}
                                className="p-2 hover:bg-gray-100"
                                aria-label="Période précédente"
                            >
                                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <button
                                onClick={navigateToToday}
                                className="px-3 py-2 hover:bg-gray-100 border-l border-r border-gray-300 text-sm"
                            >
                                Aujourd'hui
                            </button>

                            <button
                                onClick={navigateToNext}
                                className="p-2 hover:bg-gray-100"
                                aria-label="Période suivante"
                            >
                                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Sélecteur de vue */}
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                            <button
                                onClick={() => handleViewChange(CalendarViewType.MONTH)}
                                className={`px-3 py-2 text-sm ${view === CalendarViewType.MONTH ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                            >
                                Mois
                            </button>

                            <button
                                onClick={() => handleViewChange(CalendarViewType.WEEK)}
                                className={`px-3 py-2 text-sm border-l border-gray-300 ${view === CalendarViewType.WEEK ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                            >
                                Semaine
                            </button>

                            <button
                                onClick={() => handleViewChange(CalendarViewType.DAY)}
                                className={`px-3 py-2 text-sm border-l border-gray-300 ${view === CalendarViewType.DAY ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                            >
                                Jour
                            </button>

                            <button
                                onClick={() => handleViewChange(CalendarViewType.LIST)}
                                className={`px-3 py-2 text-sm border-l border-gray-300 ${view === CalendarViewType.LIST ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                            >
                                Liste
                            </button>
                        </div>

                        {/* Export */}
                        <CalendarExport events={events} currentRange={currentRange} />
                    </div>
                </div>

                <div className="mt-2 text-sm text-gray-500">
                    {getDateRangeTitle()}
                </div>
            </div>

            {/* Filtres */}
            <CalendarFiltersComponent
                filters={filters}
                onFilterChange={updateFilters}
                availableEventTypes={[CalendarEventType.LEAVE]}
                showLeaveFilter={true}
                showUserFilter={true}
                showLocationFilter={false}
                showTeamFilter={false}
                showSpecialtyFilter={false}
            />

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

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Calendrier (3/4 de la largeur) */}
                <div className="lg:col-span-3">
                    <BaseCalendar
                        events={events}
                        view={view}
                        settings={settings}
                        loading={loading}
                        editable={false}
                        selectable={false}
                        onEventClick={handleEventClick}
                        onViewChange={handleViewChange}
                        onDateRangeChange={handleDateRangeChange}
                        headerToolbar={headerToolbar}
                    />
                </div>

                {/* Légende (1/4 de la largeur) */}
                <div>
                    <CalendarLegend
                        showEventTypes={true}
                        showStatuses={true}
                        showLocations={false}
                        showTeams={false}
                        showSpecialties={false}
                        selectedEventTypes={[CalendarEventType.LEAVE]}
                    />
                </div>
            </div>

            {/* Modal de détail d'événement */}
            {isModalOpen && selectedEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-900">{selectedEvent.title}</h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Utilisateur:</span>
                                    <span className="ml-2">{selectedEvent.user?.firstName} {selectedEvent.user?.lastName}</span>
                                </div>

                                <div>
                                    <span className="text-sm font-medium text-gray-500">Type:</span>
                                    <span className="ml-2">
                                        {selectedEvent.type === CalendarEventType.LEAVE && (
                                            <span>{selectedEvent['leaveType'] || 'Congé'}</span>
                                        )}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-sm font-medium text-gray-500">Date:</span>
                                    <span className="ml-2">
                                        Du {format(new Date(selectedEvent.start), 'dd/MM/yyyy')} au {format(new Date(selectedEvent.end), 'dd/MM/yyyy')}
                                    </span>
                                </div>

                                {selectedEvent.type === CalendarEventType.LEAVE && selectedEvent['status'] && (
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Statut:</span>
                                        <span className={`ml-2 px-2 py-1 rounded-full text-xs 
                      ${selectedEvent['status'] === 'APPROVED' ? 'bg-green-100 text-green-800' : ''}
                      ${selectedEvent['status'] === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${selectedEvent['status'] === 'REJECTED' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                                            {selectedEvent['status'] === 'APPROVED' && 'Approuvé'}
                                            {selectedEvent['status'] === 'PENDING' && 'En attente'}
                                            {selectedEvent['status'] === 'REJECTED' && 'Refusé'}
                                        </span>
                                    </div>
                                )}

                                {selectedEvent.type === CalendarEventType.LEAVE && selectedEvent['countedDays'] !== undefined && (
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Jours comptabilisés:</span>
                                        <span className="ml-2">{selectedEvent['countedDays']}</span>
                                    </div>
                                )}

                                {selectedEvent.description && (
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Description:</span>
                                        <p className="mt-1 text-sm text-gray-600">{selectedEvent.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}; 