import React, { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BaseCalendar } from './BaseCalendar';
import { CalendarFiltersComponent } from './CalendarFilters';
import { CalendarLegend } from './CalendarLegend';
import { CalendarExport } from './CalendarExport';
import { useCalendar } from '../hooks/useCalendar';
import { AnyCalendarEvent, CalendarEventType, CalendarViewType, LeaveCalendarEvent } from '../types/event';
import { User } from '../../../types/user';
import { LeaveDetailsModal } from './LeaveDetailsModal';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

interface CollectiveCalendarProps {
    onEventClick?: (eventId: string, eventType: string) => void;
    onRequestLeave?: () => void;
    title?: string;
    description?: string;
}

export const CollectiveCalendar: React.FC<CollectiveCalendarProps> = ({
    onEventClick,
    onRequestLeave,
    title = 'Calendrier collectif',
    description = 'Vue d\'ensemble des congés et absences de l\'équipe'
}) => {
    // Gérer l'événement sélectionné et le modal
    const [selectedEvent, setSelectedEvent] = useState<LeaveCalendarEvent | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN_TOTAL' || user?.role === 'ADMIN_PARTIEL';

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

    // Filtrer les congés refusés (REJECTED) et garder les autres types d'événements
    const filteredEvents = events.filter(event => {
        // Si c'est un congé avec statut REJECTED, on ne l'affiche pas
        if (event.type === CalendarEventType.LEAVE && event.status === 'REJECTED') {
            return false;
        }
        // Sinon on garde l'événement
        return true;
    });

    // Gestionnaire de clic sur un événement
    const handleEventClick = useCallback((eventId: string, eventType: string) => {
        if (eventType === CalendarEventType.LEAVE) {
            const leaveEvent = events.find(event => event.id === eventId) as LeaveCalendarEvent;
            if (leaveEvent) {
                setSelectedEvent(leaveEvent);
                setIsModalOpen(true);
            }
        }
        // Pour les autres types d'événements, on peut ajouter une logique spécifique
    }, [events]);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedEvent(null);
    }, []);

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

    // Formatage de la plage de dates actuelle pour l'affichage
    const formatDateRange = useCallback(() => {
        const { start, end } = currentRange;
        const options = { locale: fr };

        switch (view) {
            case 'dayGridMonth':
                return format(start, 'MMMM yyyy', options);
            case 'timeGridWeek':
                return `${format(start, 'dd MMMM', options)} - ${format(end, 'dd MMMM yyyy', options)}`;
            case 'timeGridDay':
                return format(start, 'EEEE dd MMMM yyyy', options);
            default:
                return format(start, 'MMMM yyyy', options);
        }
    }, [currentRange, view]);

    // Fonction pour approuver un congé
    const handleApproveLeave = useCallback(async (leaveId: string) => {
        if (!isAdmin || !leaveId) return;

        try {
            await axios.put(`/api/leaves/${leaveId}/approve`);
            toast.success('Congé approuvé avec succès');
            updateFilters({}); // Rafraîchir le calendrier
            handleCloseModal();
        } catch (error) {
            console.error('Erreur lors de l\'approbation du congé:', error);
            toast.error('Erreur lors de l\'approbation du congé');
        }
    }, [isAdmin, updateFilters, handleCloseModal]);

    // Fonction pour refuser un congé
    const handleRejectLeave = useCallback(async (leaveId: string) => {
        if (!isAdmin || !leaveId) return;

        try {
            await axios.put(`/api/leaves/${leaveId}/reject`);
            toast.success('Congé refusé avec succès');
            updateFilters({}); // Rafraîchir le calendrier
            handleCloseModal();
        } catch (error) {
            console.error('Erreur lors du refus du congé:', error);
            toast.error('Erreur lors du refus du congé');
        }
    }, [isAdmin, updateFilters, handleCloseModal]);

    return (
        <div className="space-y-4">
            {/* En-tête avec titre et contrôles */}
            <div className="bg-white shadow rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 sm:mb-0">
                        {title}
                    </h2>

                    <div className="flex flex-wrap gap-2 justify-end">
                        {/* Contrôles de navigation */}
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                            <button
                                onClick={navigateToPrevious}
                                className="p-1 sm:p-2 hover:bg-gray-100"
                                aria-label="Période précédente"
                            >
                                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <button
                                onClick={navigateToToday}
                                className="px-2 py-1 sm:px-3 sm:py-2 hover:bg-gray-100 border-l border-r border-gray-300 text-xs sm:text-sm"
                            >
                                Aujourd'hui
                            </button>

                            <button
                                onClick={navigateToNext}
                                className="p-1 sm:p-2 hover:bg-gray-100"
                                aria-label="Période suivante"
                            >
                                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Sélecteur de vue */}
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                            <button
                                onClick={() => handleViewChange(CalendarViewType.MONTH)}
                                className={`px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm ${view === CalendarViewType.MONTH ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                            >
                                Mois
                            </button>

                            <button
                                onClick={() => handleViewChange(CalendarViewType.WEEK)}
                                className={`px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border-l border-gray-300 ${view === CalendarViewType.WEEK ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                            >
                                Sem.
                            </button>

                            <button
                                onClick={() => handleViewChange(CalendarViewType.DAY)}
                                className={`px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border-l border-gray-300 ${view === CalendarViewType.DAY ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                            >
                                Jour
                            </button>

                            <button
                                onClick={() => handleViewChange(CalendarViewType.LIST)}
                                className={`px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border-l border-gray-300 ${view === CalendarViewType.LIST ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                            >
                                Liste
                            </button>
                        </div>

                        {/* Bouton de demande de congé */}
                        {onRequestLeave ? (
                            <button
                                onClick={onRequestLeave}
                                className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg
                                    className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Demander un congé
                            </button>
                        ) : (
                            <a
                                href="/leaves/new"
                                className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg
                                    className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Demander un congé
                            </a>
                        )}

                        {/* Export */}
                        <CalendarExport events={filteredEvents} currentRange={currentRange} />
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
                {/* Calendrier (pleine largeur sur mobile, 3/4 sur desktop) */}
                <div className="lg:col-span-3 order-2 lg:order-1">
                    <BaseCalendar
                        events={filteredEvents}
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

                {/* Légende (première sur mobile, côté droit sur desktop) */}
                <div className="order-1 lg:order-2 mb-4 lg:mb-0">
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
            {selectedEvent && (
                <LeaveDetailsModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    leave={selectedEvent}
                    showApprovalButtons={isAdmin && selectedEvent.status === 'PENDING'}
                    onApprove={() => handleApproveLeave(selectedEvent.id)}
                    onReject={() => handleRejectLeave(selectedEvent.id)}
                />
            )}
        </div>
    );
}; 