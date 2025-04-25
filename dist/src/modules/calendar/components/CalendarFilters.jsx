var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { useState, useEffect } from 'react';
import { CalendarEventType } from '../types/event';
export var CalendarFiltersComponent = function (_a) {
    var filters = _a.filters, onFilterChange = _a.onFilterChange, _b = _a.availableEventTypes, availableEventTypes = _b === void 0 ? Object.values(CalendarEventType) : _b, _c = _a.showLeaveFilter, showLeaveFilter = _c === void 0 ? true : _c, _d = _a.showUserFilter, showUserFilter = _d === void 0 ? true : _d, _e = _a.showLocationFilter, showLocationFilter = _e === void 0 ? true : _e, _f = _a.showTeamFilter, showTeamFilter = _f === void 0 ? true : _f, _g = _a.showSpecialtyFilter, showSpecialtyFilter = _g === void 0 ? true : _g, _h = _a.showSearchTerm, showSearchTerm = _h === void 0 ? true : _h;
    var _j = useState(false), isExpanded = _j[0], setIsExpanded = _j[1];
    var _k = useState(filters.searchTerm || ''), searchTerm = _k[0], setSearchTerm = _k[1];
    var _l = useState(filters.eventTypes), eventTypesState = _l[0], setEventTypesState = _l[1];
    // Autres états pour les filtres avancés
    var _m = useState(filters.userIds || []), userIds = _m[0], setUserIds = _m[1];
    var _o = useState(filters.userRoles || []), userRoles = _o[0], setUserRoles = _o[1];
    var _p = useState(filters.leaveTypes || []), leaveTypes = _p[0], setLeaveTypes = _p[1];
    var _q = useState(filters.leaveStatuses || []), leaveStatuses = _q[0], setLeaveStatuses = _q[1];
    var _r = useState(filters.locationIds || []), locationIds = _r[0], setLocationIds = _r[1];
    var _s = useState(filters.teamIds || []), teamIds = _s[0], setTeamIds = _s[1];
    var _t = useState(filters.specialtyIds || []), specialtyIds = _t[0], setSpecialtyIds = _t[1];
    // Synchroniser les filtres externes avec l'état local
    useEffect(function () {
        setEventTypesState(filters.eventTypes);
        setSearchTerm(filters.searchTerm || '');
        setUserIds(filters.userIds || []);
        setUserRoles(filters.userRoles || []);
        setLeaveTypes(filters.leaveTypes || []);
        setLeaveStatuses(filters.leaveStatuses || []);
        setLocationIds(filters.locationIds || []);
        setTeamIds(filters.teamIds || []);
        setSpecialtyIds(filters.specialtyIds || []);
    }, [filters]);
    // Mettre à jour le terme de recherche
    var handleSearchChange = function (e) {
        var newSearchTerm = e.target.value;
        setSearchTerm(newSearchTerm);
        onFilterChange({ searchTerm: newSearchTerm });
    };
    // Gérer les changements de types d'événements
    var handleEventTypeChange = function (type) {
        var newEventTypes = eventTypesState.includes(type)
            ? eventTypesState.filter(function (t) { return t !== type; })
            : __spreadArray(__spreadArray([], eventTypesState, true), [type], false);
        setEventTypesState(newEventTypes);
        onFilterChange({ eventTypes: newEventTypes });
    };
    // Gérer les changements d'utilisateurs
    var handleUserChange = function (userId) {
        var newUserIds = userIds.includes(userId)
            ? userIds.filter(function (id) { return id !== userId; })
            : __spreadArray(__spreadArray([], userIds, true), [userId], false);
        setUserIds(newUserIds);
        onFilterChange({ userIds: newUserIds });
    };
    // Gérer les changements de rôles d'utilisateurs
    var handleUserRoleChange = function (role) {
        var newUserRoles = userRoles.includes(role)
            ? userRoles.filter(function (r) { return r !== role; })
            : __spreadArray(__spreadArray([], userRoles, true), [role], false);
        setUserRoles(newUserRoles);
        onFilterChange({ userRoles: newUserRoles });
    };
    // Gérer les changements de types de congés
    var handleLeaveTypeChange = function (type) {
        var newLeaveTypes = leaveTypes.includes(type)
            ? leaveTypes.filter(function (t) { return t !== type; })
            : __spreadArray(__spreadArray([], leaveTypes, true), [type], false);
        setLeaveTypes(newLeaveTypes);
        onFilterChange({ leaveTypes: newLeaveTypes });
    };
    // Gérer les changements de statuts de congés
    var handleLeaveStatusChange = function (status) {
        var newLeaveStatuses = leaveStatuses.includes(status)
            ? leaveStatuses.filter(function (s) { return s !== status; })
            : __spreadArray(__spreadArray([], leaveStatuses, true), [status], false);
        setLeaveStatuses(newLeaveStatuses);
        onFilterChange({ leaveStatuses: newLeaveStatuses });
    };
    // Gérer les changements de lieux
    var handleLocationChange = function (locationId) {
        var newLocationIds = locationIds.includes(locationId)
            ? locationIds.filter(function (id) { return id !== locationId; })
            : __spreadArray(__spreadArray([], locationIds, true), [locationId], false);
        setLocationIds(newLocationIds);
        onFilterChange({ locationIds: newLocationIds });
    };
    // Gérer les changements d'équipes
    var handleTeamChange = function (teamId) {
        var newTeamIds = teamIds.includes(teamId)
            ? teamIds.filter(function (id) { return id !== teamId; })
            : __spreadArray(__spreadArray([], teamIds, true), [teamId], false);
        setTeamIds(newTeamIds);
        onFilterChange({ teamIds: newTeamIds });
    };
    // Gérer les changements de spécialités
    var handleSpecialtyChange = function (specialtyId) {
        var newSpecialtyIds = specialtyIds.includes(specialtyId)
            ? specialtyIds.filter(function (id) { return id !== specialtyId; })
            : __spreadArray(__spreadArray([], specialtyIds, true), [specialtyId], false);
        setSpecialtyIds(newSpecialtyIds);
        onFilterChange({ specialtyIds: newSpecialtyIds });
    };
    // Réinitialiser tous les filtres
    var handleResetFilters = function () {
        setEventTypesState(availableEventTypes);
        setSearchTerm('');
        setUserIds([]);
        setUserRoles([]);
        setLeaveTypes([]);
        setLeaveStatuses([]);
        setLocationIds([]);
        setTeamIds([]);
        setSpecialtyIds([]);
        onFilterChange({
            eventTypes: availableEventTypes,
            searchTerm: '',
            userIds: [],
            userRoles: [],
            leaveTypes: [],
            leaveStatuses: [],
            locationIds: [],
            teamIds: [],
            specialtyIds: []
        });
    };
    return (<div className="bg-white shadow rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Barre de recherche */}
                {showSearchTerm && (<div className="flex-grow">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                </svg>
                            </div>
                            <input type="text" value={searchTerm} onChange={handleSearchChange} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Rechercher..."/>
                        </div>
                    </div>)}

                {/* Filtres de type d'événement */}
                <div className="flex flex-wrap gap-2">
                    {availableEventTypes.map(function (type) { return (<button key={type} onClick={function () { return handleEventTypeChange(type); }} className={"inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ".concat(eventTypesState.includes(type)
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800')}>
                            {getEventTypeLabel(type)}
                        </button>); })}
                </div>

                {/* Bouton de filtres avancés */}
                <div className="flex items-center">
                    <button onClick={function () { return setIsExpanded(!isExpanded); }} className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Filtres avancés
                        <svg className={"ml-2 -mr-0.5 h-4 w-4 transform ".concat(isExpanded ? 'rotate-180' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>

                    <button onClick={handleResetFilters} className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                        Réinitialiser
                    </button>
                </div>
            </div>

            {/* Filtres avancés */}
            {isExpanded && (<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Filtres d'utilisateurs */}
                    {showUserFilter && (<div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-700">Utilisateurs</h3>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                                {/* Exemple de liste d'utilisateurs */}
                                {['User 1', 'User 2', 'User 3'].map(function (user, index) { return (<div key={index} className="flex items-center">
                                        <input id={"user-".concat(index)} type="checkbox" checked={userIds.includes(index.toString())} onChange={function () { return handleUserChange(index.toString()); }} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                                        <label htmlFor={"user-".concat(index)} className="ml-2 text-sm text-gray-700">
                                            {user}
                                        </label>
                                    </div>); })}
                            </div>
                        </div>)}

                    {/* Filtres de types de congés */}
                    {showLeaveFilter && (<div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-700">Types de congés</h3>
                            <div className="space-y-1">
                                {['RTT', 'CP', 'MALADIE', 'FORMATION'].map(function (type, index) { return (<div key={index} className="flex items-center">
                                        <input id={"leave-type-".concat(index)} type="checkbox" checked={leaveTypes.includes(type)} onChange={function () { return handleLeaveTypeChange(type); }} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                                        <label htmlFor={"leave-type-".concat(index)} className="ml-2 text-sm text-gray-700">
                                            {type}
                                        </label>
                                    </div>); })}
                            </div>

                            <h3 className="text-sm font-medium text-gray-700 mt-3">Statuts de congés</h3>
                            <div className="space-y-1">
                                {['PENDING', 'APPROVED', 'REJECTED'].map(function (status, index) { return (<div key={index} className="flex items-center">
                                        <input id={"leave-status-".concat(index)} type="checkbox" checked={leaveStatuses.includes(status)} onChange={function () { return handleLeaveStatusChange(status); }} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                                        <label htmlFor={"leave-status-".concat(index)} className="ml-2 text-sm text-gray-700">
                                            {getStatusLabel(status)}
                                        </label>
                                    </div>); })}
                            </div>
                        </div>)}

                    {/* Filtres de lieux */}
                    {showLocationFilter && (<div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-700">Lieux</h3>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                                {/* Exemple de liste de lieux */}
                                {['Location 1', 'Location 2', 'Location 3'].map(function (location, index) { return (<div key={index} className="flex items-center">
                                        <input id={"location-".concat(index)} type="checkbox" checked={locationIds.includes(index.toString())} onChange={function () { return handleLocationChange(index.toString()); }} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                                        <label htmlFor={"location-".concat(index)} className="ml-2 text-sm text-gray-700">
                                            {location}
                                        </label>
                                    </div>); })}
                            </div>
                        </div>)}

                    {/* Filtres d'équipes et spécialités */}
                    {(showTeamFilter || showSpecialtyFilter) && (<div className="space-y-2">
                            {showTeamFilter && (<>
                                    <h3 className="text-sm font-medium text-gray-700">Équipes</h3>
                                    <div className="max-h-20 overflow-y-auto space-y-1">
                                        {/* Exemple de liste d'équipes */}
                                        {['Team 1', 'Team 2', 'Team 3'].map(function (team, index) { return (<div key={index} className="flex items-center">
                                                <input id={"team-".concat(index)} type="checkbox" checked={teamIds.includes(index.toString())} onChange={function () { return handleTeamChange(index.toString()); }} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                                                <label htmlFor={"team-".concat(index)} className="ml-2 text-sm text-gray-700">
                                                    {team}
                                                </label>
                                            </div>); })}
                                    </div>
                                </>)}

                            {showSpecialtyFilter && (<>
                                    <h3 className="text-sm font-medium text-gray-700 mt-3">Spécialités</h3>
                                    <div className="max-h-20 overflow-y-auto space-y-1">
                                        {/* Exemple de liste de spécialités */}
                                        {['Specialty 1', 'Specialty 2', 'Specialty 3'].map(function (specialty, index) { return (<div key={index} className="flex items-center">
                                                <input id={"specialty-".concat(index)} type="checkbox" checked={specialtyIds.includes(index.toString())} onChange={function () { return handleSpecialtyChange(index.toString()); }} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                                                <label htmlFor={"specialty-".concat(index)} className="ml-2 text-sm text-gray-700">
                                                    {specialty}
                                                </label>
                                            </div>); })}
                                    </div>
                                </>)}
                        </div>)}
                </div>)}
        </div>);
};
// Fonction utilitaire pour obtenir l'étiquette d'un type d'événement
function getEventTypeLabel(type) {
    switch (type) {
        case CalendarEventType.LEAVE:
            return 'Congés';
        case CalendarEventType.DUTY:
            return 'Gardes';
        case CalendarEventType.ON_CALL:
            return 'Astreintes';
        case CalendarEventType.ASSIGNMENT:
            return 'Affectations';
        default:
            return 'Événement';
    }
}
// Fonction utilitaire pour obtenir l'étiquette d'un statut
function getStatusLabel(status) {
    switch (status) {
        case 'PENDING':
            return 'En attente';
        case 'APPROVED':
            return 'Approuvé';
        case 'REJECTED':
            return 'Refusé';
        default:
            return status;
    }
}
