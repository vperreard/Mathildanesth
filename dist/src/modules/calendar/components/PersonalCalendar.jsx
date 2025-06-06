import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BaseCalendar } from './BaseCalendar';
import { CalendarFiltersComponent } from './CalendarFilters';
import { CalendarLegend } from './CalendarLegend';
import { CalendarExport } from './CalendarExport';
import { useCalendar } from '../hooks/useCalendar';
import { CalendarEventType, CalendarViewType } from '../types/event';
export var PersonalCalendar = function (_a) {
    var userId = _a.userId, onEventClick = _a.onEventClick;
    // Gérer l'événement sélectionné et le modal
    var _b = useState(null), selectedEvent = _b[0], setSelectedEvent = _b[1];
    var _c = useState(false), isModalOpen = _c[0], setIsModalOpen = _c[1];
    // Filtres par défaut pour le calendrier personnel (tous les types d'événements pour l'utilisateur connecté)
    var defaultFilters = {
        eventTypes: Object.values(CalendarEventType),
        userIds: [userId],
    };
    // Utiliser le hook de calendrier
    var _d = useCalendar(defaultFilters), events = _d.events, loading = _d.loading, error = _d.error, filters = _d.filters, view = _d.view, currentRange = _d.currentRange, settings = _d.settings, updateFilters = _d.updateFilters, handleViewChange = _d.handleViewChange, handleDateRangeChange = _d.handleDateRangeChange, navigateToPrevious = _d.navigateToPrevious, navigateToNext = _d.navigateToNext, navigateToToday = _d.navigateToToday;
    // Gestionnaire de clic sur un événement
    var handleEventClick = useCallback(function (eventId, eventType) {
        // Trouver l'événement sélectionné
        var event = events.find(function (e) { return e.id === eventId; });
        // Si l'événement est trouvé, ouvrir le modal
        if (event) {
            // Extraire le vrai ID (suppression du préfixe)
            var realId = eventId.includes('-') ? eventId.split('-')[1] : eventId;
            setSelectedEvent(event);
            setIsModalOpen(true);
            if (onEventClick) {
                onEventClick(realId, eventType);
            }
        }
    }, [events, onEventClick]);
    // Formatage du titre de la plage de dates
    var getDateRangeTitle = function () {
        if (!currentRange.start || !currentRange.end)
            return '';
        if (view === CalendarViewType.MONTH) {
            return format(currentRange.start, 'MMMM yyyy', { locale: fr });
        }
        else if (view === CalendarViewType.WEEK) {
            return "".concat(format(currentRange.start, 'dd'), " - ").concat(format(currentRange.end, 'dd MMMM yyyy', { locale: fr }));
        }
        else if (view === CalendarViewType.DAY) {
            return format(currentRange.start, 'EEEE dd MMMM yyyy', { locale: fr });
        }
        return "".concat(format(currentRange.start, 'dd/MM/yyyy'), " - ").concat(format(currentRange.end, 'dd/MM/yyyy'));
    };
    // Configuration des boutons de la barre d'outils
    var headerToolbar = {
        left: '', // Géré par nos propres boutons
        center: 'title',
        right: '' // Géré par nos propres boutons
    };
    return (<div className="space-y-4">
            {/* En-tête avec titre et contrôles */}
            <div className="bg-white shadow rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 sm:mb-0">
                        Mon calendrier
                    </h2>

                    <div className="flex flex-wrap gap-2 justify-end">
                        {/* Contrôles de navigation */}
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                            <button onClick={navigateToPrevious} className="p-2 hover:bg-gray-100" aria-label="Période précédente">
                                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                                </svg>
                            </button>

                            <button onClick={navigateToToday} className="px-3 py-2 hover:bg-gray-100 border-l border-r border-gray-300 text-sm">
                                Aujourd'hui
                            </button>

                            <button onClick={navigateToNext} className="p-2 hover:bg-gray-100" aria-label="Période suivante">
                                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                                </svg>
                            </button>
                        </div>

                        {/* Sélecteur de vue */}
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                            <button onClick={function () { return handleViewChange(CalendarViewType.MONTH); }} className={"px-3 py-2 text-sm ".concat(view === CalendarViewType.MONTH ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100')}>
                                Mois
                            </button>

                            <button onClick={function () { return handleViewChange(CalendarViewType.WEEK); }} className={"px-3 py-2 text-sm border-l border-gray-300 ".concat(view === CalendarViewType.WEEK ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100')}>
                                Semaine
                            </button>

                            <button onClick={function () { return handleViewChange(CalendarViewType.DAY); }} className={"px-3 py-2 text-sm border-l border-gray-300 ".concat(view === CalendarViewType.DAY ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100')}>
                                Jour
                            </button>

                            <button onClick={function () { return handleViewChange(CalendarViewType.LIST); }} className={"px-3 py-2 text-sm border-l border-gray-300 ".concat(view === CalendarViewType.LIST ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100')}>
                                Liste
                            </button>
                        </div>

                        {/* Bouton de demande de congé */}
                        <a href="/leaves/new" className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                            </svg>
                            Demander un congé
                        </a>

                        {/* Export */}
                        <CalendarExport events={events} currentRange={currentRange}/>
                    </div>
                </div>

                <div className="mt-2 text-sm text-gray-500">
                    {getDateRangeTitle()}
                </div>
            </div>

            {/* Filtres */}
            <CalendarFiltersComponent filters={filters} onFilterChange={updateFilters} availableEventTypes={Object.values(CalendarEventType)} showLeaveFilter={true} showUserFilter={false} // Pas besoin de filtrer par utilisateur, c'est déjà le calendrier personnel
     showLocationFilter={true} showTeamFilter={true} showSpecialtyFilter={false}/>

            {/* Affichage des erreurs */}
            {error && (<div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                Erreur lors du chargement des données: {error.message}
                            </p>
                        </div>
                    </div>
                </div>)}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Calendrier (3/4 de la largeur) */}
                <div className="lg:col-span-3">
                    <BaseCalendar events={events} view={view} settings={settings} loading={loading} editable={false} selectable={false} onEventClick={handleEventClick} onViewChange={handleViewChange} onDateRangeChange={handleDateRangeChange} headerToolbar={headerToolbar}/>
                </div>

                {/* Légende (1/4 de la largeur) */}
                <div>
                    <CalendarLegend showEventTypes={true} showStatuses={true} showLocations={true} showTeams={true} showSpecialties={false} selectedEventTypes={filters.eventTypes}/>
                </div>
            </div>

            {/* Modal de détail d'événement */}
            {isModalOpen && selectedEvent && (<div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-900">{selectedEvent.title}</h3>
                                <button onClick={function () { return setIsModalOpen(false); }} className="text-gray-400 hover:text-gray-500">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Type:</span>
                                    <span className="ml-2">
                                        {getEventTypeDescription(selectedEvent)}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-sm font-medium text-gray-500">Date:</span>
                                    <span className="ml-2">
                                        Du {format(new Date(selectedEvent.start), 'dd/MM/yyyy')} au {format(new Date(selectedEvent.end), 'dd/MM/yyyy')}
                                    </span>
                                </div>

                                {selectedEvent.type === CalendarEventType.LEAVE && (<>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Type de congé:</span>
                                            <span className="ml-2">{selectedEvent['leaveType'] || 'Non spécifié'}</span>
                                        </div>

                                        {selectedEvent['status'] && (<div>
                                                <span className="text-sm font-medium text-gray-500">Statut:</span>
                                                <span className={"ml-2 px-2 py-1 rounded-full text-xs \n                          ".concat(selectedEvent['status'] === 'APPROVED' ? 'bg-green-100 text-green-800' : '', "\n                          ").concat(selectedEvent['status'] === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : '', "\n                          ").concat(selectedEvent['status'] === 'REJECTED' ? 'bg-red-100 text-red-800' : '', "\n                        ")}>
                                                    {selectedEvent['status'] === 'APPROVED' && 'Approuvé'}
                                                    {selectedEvent['status'] === 'PENDING' && 'En attente'}
                                                    {selectedEvent['status'] === 'REJECTED' && 'Refusé'}
                                                </span>
                                            </div>)}

                                        {selectedEvent['countedDays'] !== undefined && (<div>
                                                <span className="text-sm font-medium text-gray-500">Jours comptabilisés:</span>
                                                <span className="ml-2">{selectedEvent['countedDays']}</span>
                                            </div>)}
                                    </>)}

                                {selectedEvent.type === CalendarEventType.DUTY && (<div>
                                        <span className="text-sm font-medium text-gray-500">Lieu:</span>
                                        <span className="ml-2">{selectedEvent['locationName'] || 'Non spécifié'}</span>
                                    </div>)}

                                {selectedEvent.type === CalendarEventType.ON_CALL && (<div>
                                        <span className="text-sm font-medium text-gray-500">Lieu:</span>
                                        <span className="ml-2">{selectedEvent['locationName'] || 'Non spécifié'}</span>
                                    </div>)}

                                {selectedEvent.type === CalendarEventType.ASSIGNMENT && (<>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Lieu:</span>
                                            <span className="ml-2">{selectedEvent['locationName'] || 'Non spécifié'}</span>
                                        </div>
                                        {selectedEvent['teamName'] && (<div>
                                                <span className="text-sm font-medium text-gray-500">Équipe:</span>
                                                <span className="ml-2">{selectedEvent['teamName']}</span>
                                            </div>)}
                                        {selectedEvent['specialtyName'] && (<div>
                                                <span className="text-sm font-medium text-gray-500">Spécialité:</span>
                                                <span className="ml-2">{selectedEvent['specialtyName']}</span>
                                            </div>)}
                                    </>)}

                                {selectedEvent.description && (<div>
                                        <span className="text-sm font-medium text-gray-500">Description:</span>
                                        <p className="mt-1 text-sm text-gray-600">{selectedEvent.description}</p>
                                    </div>)}
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
                            {/* Boutons d'action conditionnels selon le type d'événement */}
                            {selectedEvent.type === CalendarEventType.LEAVE && (<a href={"/leaves/".concat(selectedEvent.id.replace('leave-', ''))} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500">
                                    Voir détails
                                </a>)}

                            <button onClick={function () { return setIsModalOpen(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>)}
        </div>);
};
// Fonction utilitaire pour obtenir la description d'un type d'événement
function getEventTypeDescription(event) {
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
