import React, { useState, useEffect } from 'react';
import { CalendarEventType, CalendarFilters } from '../types/event';

interface CalendarFiltersProps {
    filters: CalendarFilters;
    onFilterChange: (filters: Partial<CalendarFilters>) => void;
    availableEventTypes?: CalendarEventType[];
    showLeaveFilter?: boolean;
    showUserFilter?: boolean;
    showLocationFilter?: boolean;
    showTeamFilter?: boolean;
    showSpecialtyFilter?: boolean;
    showSearchTerm?: boolean;
}

export const CalendarFiltersComponent: React.FC<CalendarFiltersProps> = ({
    filters,
    onFilterChange,
    availableEventTypes = Object.values(CalendarEventType),
    showLeaveFilter = true,
    showUserFilter = true,
    showLocationFilter = true,
    showTeamFilter = true,
    showSpecialtyFilter = true,
    showSearchTerm = true
}) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>(filters.searchTerm || '');
    const [eventTypesState, setEventTypesState] = useState<CalendarEventType[]>(filters.eventTypes);

    // Autres états pour les filtres avancés
    const [userIds, setUserIds] = useState<string[]>(filters.userIds || []);
    const [userRoles, setUserRoles] = useState<string[]>(filters.userRoles || []);
    const [leaveTypes, setLeaveTypes] = useState<string[]>(filters.leaveTypes || []);
    const [leaveStatuses, setLeaveStatuses] = useState<string[]>(filters.leaveStatuses || []);
    const [locationIds, setLocationIds] = useState<string[]>(filters.locationIds || []);
    const [teamIds, setTeamIds] = useState<string[]>(filters.teamIds || []);
    const [specialtyIds, setSpecialtyIds] = useState<string[]>(filters.specialtyIds || []);

    // Synchroniser les filtres externes avec l'état local
    useEffect(() => {
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
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSearchTerm = e.target.value;
        setSearchTerm(newSearchTerm);
        onFilterChange({ searchTerm: newSearchTerm });
    };

    // Gérer les changements de types d'événements
    const handleEventTypeChange = (type: CalendarEventType) => {
        const newEventTypes = eventTypesState.includes(type)
            ? eventTypesState.filter(t => t !== type)
            : [...eventTypesState, type];

        setEventTypesState(newEventTypes);
        onFilterChange({ eventTypes: newEventTypes });
    };

    // Gérer les changements d'utilisateurs
    const handleUserChange = (userId: string) => {
        const newUserIds = userIds.includes(userId)
            ? userIds.filter(id => id !== userId)
            : [...userIds, userId];

        setUserIds(newUserIds);
        onFilterChange({ userIds: newUserIds });
    };

    // Gérer les changements de rôles d'utilisateurs
    const handleUserRoleChange = (role: string) => {
        const newUserRoles = userRoles.includes(role)
            ? userRoles.filter(r => r !== role)
            : [...userRoles, role];

        setUserRoles(newUserRoles);
        onFilterChange({ userRoles: newUserRoles });
    };

    // Gérer les changements de types de congés
    const handleLeaveTypeChange = (type: string) => {
        const newLeaveTypes = leaveTypes.includes(type)
            ? leaveTypes.filter(t => t !== type)
            : [...leaveTypes, type];

        setLeaveTypes(newLeaveTypes);
        onFilterChange({ leaveTypes: newLeaveTypes });
    };

    // Gérer les changements de statuts de congés
    const handleLeaveStatusChange = (status: string) => {
        const newLeaveStatuses = leaveStatuses.includes(status)
            ? leaveStatuses.filter(s => s !== status)
            : [...leaveStatuses, status];

        setLeaveStatuses(newLeaveStatuses);
        onFilterChange({ leaveStatuses: newLeaveStatuses });
    };

    // Gérer les changements de lieux
    const handleLocationChange = (locationId: string) => {
        const newLocationIds = locationIds.includes(locationId)
            ? locationIds.filter(id => id !== locationId)
            : [...locationIds, locationId];

        setLocationIds(newLocationIds);
        onFilterChange({ locationIds: newLocationIds });
    };

    // Gérer les changements d'équipes
    const handleTeamChange = (teamId: string) => {
        const newTeamIds = teamIds.includes(teamId)
            ? teamIds.filter(id => id !== teamId)
            : [...teamIds, teamId];

        setTeamIds(newTeamIds);
        onFilterChange({ teamIds: newTeamIds });
    };

    // Gérer les changements de spécialités
    const handleSpecialtyChange = (specialtyId: string) => {
        const newSpecialtyIds = specialtyIds.includes(specialtyId)
            ? specialtyIds.filter(id => id !== specialtyId)
            : [...specialtyIds, specialtyId];

        setSpecialtyIds(newSpecialtyIds);
        onFilterChange({ specialtyIds: newSpecialtyIds });
    };

    // Réinitialiser tous les filtres
    const handleResetFilters = () => {
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

    return (
        <div className="bg-white shadow rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Barre de recherche */}
                {showSearchTerm && (
                    <div className="flex-grow">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Rechercher..."
                            />
                        </div>
                    </div>
                )}

                {/* Filtres de type d'événement */}
                <div className="flex flex-wrap gap-2">
                    {availableEventTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => handleEventTypeChange(type)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${eventTypesState.includes(type)
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                                }`}
                        >
                            {getEventTypeLabel(type)}
                        </button>
                    ))}
                </div>

                {/* Bouton de filtres avancés */}
                <div className="flex items-center">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Filtres avancés
                        <svg
                            className={`ml-2 -mr-0.5 h-4 w-4 transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    <button
                        onClick={handleResetFilters}
                        className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Réinitialiser
                    </button>
                </div>
            </div>

            {/* Filtres avancés */}
            {isExpanded && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Filtres d'utilisateurs */}
                    {showUserFilter && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-700">Utilisateurs</h3>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                                {/* Exemple de liste d'utilisateurs */}
                                {['User 1', 'User 2', 'User 3'].map((user, index) => (
                                    <div key={index} className="flex items-center">
                                        <input
                                            id={`user-${index}`}
                                            type="checkbox"
                                            checked={userIds.includes(index.toString())}
                                            onChange={() => handleUserChange(index.toString())}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor={`user-${index}`} className="ml-2 text-sm text-gray-700">
                                            {user}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filtres de types de congés */}
                    {showLeaveFilter && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-700">Types de congés</h3>
                            <div className="space-y-1">
                                {['RTT', 'CP', 'MALADIE', 'FORMATION'].map((type, index) => (
                                    <div key={index} className="flex items-center">
                                        <input
                                            id={`leave-type-${index}`}
                                            type="checkbox"
                                            checked={leaveTypes.includes(type)}
                                            onChange={() => handleLeaveTypeChange(type)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor={`leave-type-${index}`} className="ml-2 text-sm text-gray-700">
                                            {type}
                                        </label>
                                    </div>
                                ))}
                            </div>

                            <h3 className="text-sm font-medium text-gray-700 mt-3">Statuts de congés</h3>
                            <div className="space-y-1">
                                {['PENDING', 'APPROVED', 'REJECTED'].map((status, index) => (
                                    <div key={index} className="flex items-center">
                                        <input
                                            id={`leave-status-${index}`}
                                            type="checkbox"
                                            checked={leaveStatuses.includes(status)}
                                            onChange={() => handleLeaveStatusChange(status)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor={`leave-status-${index}`} className="ml-2 text-sm text-gray-700">
                                            {getStatusLabel(status)}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filtres de lieux */}
                    {showLocationFilter && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-700">Lieux</h3>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                                {/* Exemple de liste de lieux */}
                                {['Location 1', 'Location 2', 'Location 3'].map((location, index) => (
                                    <div key={index} className="flex items-center">
                                        <input
                                            id={`location-${index}`}
                                            type="checkbox"
                                            checked={locationIds.includes(index.toString())}
                                            onChange={() => handleLocationChange(index.toString())}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor={`location-${index}`} className="ml-2 text-sm text-gray-700">
                                            {location}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filtres d'équipes et spécialités */}
                    {(showTeamFilter || showSpecialtyFilter) && (
                        <div className="space-y-2">
                            {showTeamFilter && (
                                <>
                                    <h3 className="text-sm font-medium text-gray-700">Équipes</h3>
                                    <div className="max-h-20 overflow-y-auto space-y-1">
                                        {/* Exemple de liste d'équipes */}
                                        {['Team 1', 'Team 2', 'Team 3'].map((team, index) => (
                                            <div key={index} className="flex items-center">
                                                <input
                                                    id={`team-${index}`}
                                                    type="checkbox"
                                                    checked={teamIds.includes(index.toString())}
                                                    onChange={() => handleTeamChange(index.toString())}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor={`team-${index}`} className="ml-2 text-sm text-gray-700">
                                                    {team}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {showSpecialtyFilter && (
                                <>
                                    <h3 className="text-sm font-medium text-gray-700 mt-3">Spécialités</h3>
                                    <div className="max-h-20 overflow-y-auto space-y-1">
                                        {/* Exemple de liste de spécialités */}
                                        {['Specialty 1', 'Specialty 2', 'Specialty 3'].map((specialty, index) => (
                                            <div key={index} className="flex items-center">
                                                <input
                                                    id={`specialty-${index}`}
                                                    type="checkbox"
                                                    checked={specialtyIds.includes(index.toString())}
                                                    onChange={() => handleSpecialtyChange(index.toString())}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor={`specialty-${index}`} className="ml-2 text-sm text-gray-700">
                                                    {specialty}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Fonction utilitaire pour obtenir l'étiquette d'un type d'événement
function getEventTypeLabel(type: CalendarEventType): string {
    switch (type) {
        case CalendarEventType.LEAVE:
            return 'Congés';
        case CalendarEventType.DUTY:
            return 'Gardes';
        case CalendarEventType.ON_CALL:
            return 'Astreintes';
        case CalendarEventType.ASSIGNMENT:
            return 'Affectations';
        case CalendarEventType.MEETING:
            return 'Rendez-vous';
        case CalendarEventType.TRAINING:
            return 'Formation';
        default:
            return 'Événement';
    }
}

// Fonction utilitaire pour obtenir l'étiquette d'un statut
function getStatusLabel(status: string): string {
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