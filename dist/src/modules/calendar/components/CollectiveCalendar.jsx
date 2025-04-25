var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BaseCalendar } from './BaseCalendar';
import { CalendarFiltersComponent } from './CalendarFilters';
import { CalendarLegend } from './CalendarLegend';
import { CalendarExport } from './CalendarExport';
import { useCalendar } from '../hooks/useCalendar';
import { CalendarEventType, CalendarViewType } from '../types/event';
import { LeaveDetailsModal } from './LeaveDetailsModal';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@prisma/client';
import axios from 'axios';
import { toast } from 'react-toastify';
export var CollectiveCalendar = function (_a) {
    var onEventClick = _a.onEventClick, _b = _a.title, title = _b === void 0 ? 'Calendrier collectif' : _b, _c = _a.description, description = _c === void 0 ? 'Vue d\'ensemble des congés et absences de l\'équipe' : _c;
    // Gérer l'événement sélectionné et le modal
    var _d = useState(null), selectedEvent = _d[0], setSelectedEvent = _d[1];
    var _e = useState(false), isModalOpen = _e[0], setIsModalOpen = _e[1];
    var user = useAuth().user;
    var isAdmin = (user === null || user === void 0 ? void 0 : user.role) === UserRole.ADMIN;
    // Filtres par défaut pour le calendrier collectif (focus sur les congés)
    var defaultFilters = {
        eventTypes: [CalendarEventType.LEAVE],
    };
    // Utiliser le hook de calendrier
    var _f = useCalendar(defaultFilters), events = _f.events, loading = _f.loading, error = _f.error, filters = _f.filters, view = _f.view, currentRange = _f.currentRange, settings = _f.settings, updateFilters = _f.updateFilters, handleViewChange = _f.handleViewChange, handleDateRangeChange = _f.handleDateRangeChange, navigateToPrevious = _f.navigateToPrevious, navigateToNext = _f.navigateToNext, navigateToToday = _f.navigateToToday;
    // Filtrer les congés refusés (REJECTED) et garder les autres types d'événements
    var filteredEvents = events.filter(function (event) {
        // Si c'est un congé avec statut REJECTED, on ne l'affiche pas
        if (event.type === CalendarEventType.LEAVE && event.status === 'REJECTED') {
            return false;
        }
        // Sinon on garde l'événement
        return true;
    });
    // Gestionnaire de clic sur un événement
    var handleEventClick = useCallback(function (eventId, eventType) {
        if (eventType === CalendarEventType.LEAVE) {
            var leaveEvent = events.find(function (event) { return event.id === eventId; });
            if (leaveEvent) {
                setSelectedEvent(leaveEvent);
                setIsModalOpen(true);
            }
        }
        // Pour les autres types d'événements, on peut ajouter une logique spécifique
    }, [events]);
    var handleCloseModal = useCallback(function () {
        setIsModalOpen(false);
        setSelectedEvent(null);
    }, []);
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
    // Formatage de la plage de dates actuelle pour l'affichage
    var formatDateRange = useCallback(function () {
        var start = currentRange.start, end = currentRange.end;
        var options = { locale: fr };
        switch (view) {
            case 'dayGridMonth':
                return format(start, 'MMMM yyyy', options);
            case 'timeGridWeek':
                return "".concat(format(start, 'dd MMMM', options), " - ").concat(format(end, 'dd MMMM yyyy', options));
            case 'timeGridDay':
                return format(start, 'EEEE dd MMMM yyyy', options);
            default:
                return format(start, 'MMMM yyyy', options);
        }
    }, [currentRange, view]);
    // Fonction pour approuver un congé
    var handleApproveLeave = useCallback(function (leaveId) { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isAdmin || !leaveId)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios.put("/api/leaves/".concat(leaveId, "/approve"))];
                case 2:
                    _a.sent();
                    toast.success('Congé approuvé avec succès');
                    updateFilters({}); // Rafraîchir le calendrier
                    handleCloseModal();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Erreur lors de l\'approbation du congé:', error_1);
                    toast.error('Erreur lors de l\'approbation du congé');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [isAdmin, updateFilters, handleCloseModal]);
    // Fonction pour refuser un congé
    var handleRejectLeave = useCallback(function (leaveId) { return __awaiter(void 0, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isAdmin || !leaveId)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios.put("/api/leaves/".concat(leaveId, "/reject"))];
                case 2:
                    _a.sent();
                    toast.success('Congé refusé avec succès');
                    updateFilters({}); // Rafraîchir le calendrier
                    handleCloseModal();
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('Erreur lors du refus du congé:', error_2);
                    toast.error('Erreur lors du refus du congé');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [isAdmin, updateFilters, handleCloseModal]);
    return (<div className="space-y-4">
            {/* En-tête avec titre et contrôles */}
            <div className="bg-white shadow rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 sm:mb-0">
                        {title}
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

                        {/* Export */}
                        <CalendarExport events={events} currentRange={currentRange}/>
                    </div>
                </div>

                <div className="mt-2 text-sm text-gray-500">
                    {getDateRangeTitle()}
                </div>
            </div>

            {/* Filtres */}
            <CalendarFiltersComponent filters={filters} onFilterChange={updateFilters} availableEventTypes={[CalendarEventType.LEAVE]} showLeaveFilter={true} showUserFilter={true} showLocationFilter={false} showTeamFilter={false} showSpecialtyFilter={false}/>

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
                    <BaseCalendar events={filteredEvents} view={view} settings={settings} loading={loading} editable={false} selectable={false} onEventClick={handleEventClick} onViewChange={handleViewChange} onDateRangeChange={handleDateRangeChange} headerToolbar={headerToolbar}/>
                </div>

                {/* Légende (1/4 de la largeur) */}
                <div>
                    <CalendarLegend showEventTypes={true} showStatuses={true} showLocations={false} showTeams={false} showSpecialties={false} selectedEventTypes={[CalendarEventType.LEAVE]}/>
                </div>
            </div>

            {/* Modal de détail d'événement */}
            {selectedEvent && (<LeaveDetailsModal isOpen={isModalOpen} onClose={handleCloseModal} leave={selectedEvent} showApprovalButtons={isAdmin && selectedEvent.status === 'PENDING'} onApprove={function () { return handleApproveLeave(selectedEvent.id); }} onReject={function () { return handleRejectLeave(selectedEvent.id); }}/>)}
        </div>);
};
