import { useReducer, useCallback, useMemo } from 'react';
import { produce } from 'immer';
import { EventType } from '../components/CalendarEvent';

// Types pour les filtres du calendrier
export interface CalendarFilters {
    eventTypes: EventType[];
    userIds?: string[];
    userRoles?: string[];
    leaveTypes?: string[];
    leaveStatuses?: string[];
    locationIds?: string[];
    teamIds?: string[];
    specialtyIds?: string[];
    searchTerm?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
    showWeekends?: boolean;
    showAllDay?: boolean;
    showRejectedLeaves?: boolean;
}

// Type pour l'état du hook
interface FiltersState {
    filters: CalendarFilters;
    availableFilters: {
        eventTypes: EventType[];
        userIds?: string[];
        userRoles?: string[];
        leaveTypes?: string[];
        leaveStatuses?: string[];
        locationIds?: string[];
        teamIds?: string[];
        specialtyIds?: string[];
    };
}

// Types d'action pour le reducer
type FiltersAction =
    | { type: 'SET_EVENT_TYPES'; eventTypes: EventType[] }
    | { type: 'TOGGLE_EVENT_TYPE'; eventType: EventType }
    | { type: 'SET_USER_IDS'; userIds: string[] }
    | { type: 'SET_USER_ROLES'; userRoles: string[] }
    | { type: 'SET_LEAVE_TYPES'; leaveTypes: string[] }
    | { type: 'SET_LEAVE_STATUSES'; leaveStatuses: string[] }
    | { type: 'SET_LOCATION_IDS'; locationIds: string[] }
    | { type: 'SET_TEAM_IDS'; teamIds: string[] }
    | { type: 'SET_SPECIALTY_IDS'; specialtyIds: string[] }
    | { type: 'SET_SEARCH_TERM'; searchTerm: string }
    | { type: 'SET_DATE_RANGE'; dateRange: { start: Date; end: Date } }
    | { type: 'TOGGLE_SHOW_WEEKENDS' }
    | { type: 'TOGGLE_SHOW_ALL_DAY' }
    | { type: 'TOGGLE_SHOW_REJECTED_LEAVES' }
    | { type: 'RESET_FILTERS' }
    | { type: 'SET_ALL_FILTERS'; filters: Partial<CalendarFilters> }
    | { type: 'SET_AVAILABLE_FILTERS'; availableFilters: Partial<FiltersState['availableFilters']> };

// État initial des filtres
const initialFiltersState: FiltersState = {
    filters: {
        eventTypes: Object.values(EventType),
        showWeekends: true,
        showAllDay: true,
        showRejectedLeaves: false
    },
    availableFilters: {
        eventTypes: Object.values(EventType)
    }
};

// Reducer pour les filtres
const filtersReducer = (state: FiltersState, action: FiltersAction): FiltersState => {
    return produce(state, draft => {
        switch (action.type) {
            case 'SET_EVENT_TYPES':
                draft.filters.eventTypes = action.eventTypes;
                break;

            case 'TOGGLE_EVENT_TYPE': {
                const index = draft.filters.eventTypes.indexOf(action.eventType);
                if (index === -1) {
                    draft.filters.eventTypes.push(action.eventType);
                } else {
                    draft.filters.eventTypes.splice(index, 1);
                }
                break;
            }

            case 'SET_USER_IDS':
                draft.filters.userIds = action.userIds;
                break;

            case 'SET_USER_ROLES':
                draft.filters.userRoles = action.userRoles;
                break;

            case 'SET_LEAVE_TYPES':
                draft.filters.leaveTypes = action.leaveTypes;
                break;

            case 'SET_LEAVE_STATUSES':
                draft.filters.leaveStatuses = action.leaveStatuses;
                break;

            case 'SET_LOCATION_IDS':
                draft.filters.locationIds = action.locationIds;
                break;

            case 'SET_TEAM_IDS':
                draft.filters.teamIds = action.teamIds;
                break;

            case 'SET_SPECIALTY_IDS':
                draft.filters.specialtyIds = action.specialtyIds;
                break;

            case 'SET_SEARCH_TERM':
                draft.filters.searchTerm = action.searchTerm;
                break;

            case 'SET_DATE_RANGE':
                draft.filters.dateRange = action.dateRange;
                break;

            case 'TOGGLE_SHOW_WEEKENDS':
                draft.filters.showWeekends = !draft.filters.showWeekends;
                break;

            case 'TOGGLE_SHOW_ALL_DAY':
                draft.filters.showAllDay = !draft.filters.showAllDay;
                break;

            case 'TOGGLE_SHOW_REJECTED_LEAVES':
                draft.filters.showRejectedLeaves = !draft.filters.showRejectedLeaves;
                break;

            case 'RESET_FILTERS':
                draft.filters = {
                    eventTypes: Object.values(EventType),
                    showWeekends: true,
                    showAllDay: true,
                    showRejectedLeaves: false
                };
                break;

            case 'SET_ALL_FILTERS':
                draft.filters = { ...draft.filters, ...action.filters };
                break;

            case 'SET_AVAILABLE_FILTERS':
                draft.availableFilters = { ...draft.availableFilters, ...action.availableFilters };
                break;
        }
    });
};

// Interface du hook
interface CalendarFiltersProps {
    initialFilters?: Partial<CalendarFilters>;
    availableFilters?: Partial<FiltersState['availableFilters']>;
}

interface CalendarFiltersReturn {
    filters: CalendarFilters;
    availableFilters: FiltersState['availableFilters'];
    setEventTypes: (eventTypes: EventType[]) => void;
    toggleEventType: (eventType: EventType) => void;
    setUserIds: (userIds: string[]) => void;
    setUserRoles: (userRoles: string[]) => void;
    setLeaveTypes: (leaveTypes: string[]) => void;
    setLeaveStatuses: (leaveStatuses: string[]) => void;
    setLocationIds: (locationIds: string[]) => void;
    setTeamIds: (teamIds: string[]) => void;
    setSpecialtyIds: (specialtyIds: string[]) => void;
    setSearchTerm: (searchTerm: string) => void;
    setDateRange: (dateRange: { start: Date; end: Date }) => void;
    toggleShowWeekends: () => void;
    toggleShowAllDay: () => void;
    toggleShowRejectedLeaves: () => void;
    resetFilters: () => void;
    setAllFilters: (filters: Partial<CalendarFilters>) => void;
    filteredEventTypes: EventType[];
    hasActiveFilters: boolean;
}

/**
 * Hook personnalisé pour gérer les filtres du calendrier
 */
export const useCalendarFilters = ({
    initialFilters = {},
    availableFilters = {}
}: CalendarFiltersProps = {}): CalendarFiltersReturn => {
    // Initialisation avec les filtres et les filtres disponibles fournis
    const initialState = {
        ...initialFiltersState,
        filters: {
            ...initialFiltersState.filters,
            ...initialFilters
        },
        availableFilters: {
            ...initialFiltersState.availableFilters,
            ...availableFilters
        }
    };

    const [state, dispatch] = useReducer(filtersReducer, initialState);

    // Actions pour modifier les filtres
    const setEventTypes = useCallback((eventTypes: EventType[]) => {
        dispatch({ type: 'SET_EVENT_TYPES', eventTypes });
    }, []);

    const toggleEventType = useCallback((eventType: EventType) => {
        dispatch({ type: 'TOGGLE_EVENT_TYPE', eventType });
    }, []);

    const setUserIds = useCallback((userIds: string[]) => {
        dispatch({ type: 'SET_USER_IDS', userIds });
    }, []);

    const setUserRoles = useCallback((userRoles: string[]) => {
        dispatch({ type: 'SET_USER_ROLES', userRoles });
    }, []);

    const setLeaveTypes = useCallback((leaveTypes: string[]) => {
        dispatch({ type: 'SET_LEAVE_TYPES', leaveTypes });
    }, []);

    const setLeaveStatuses = useCallback((leaveStatuses: string[]) => {
        dispatch({ type: 'SET_LEAVE_STATUSES', leaveStatuses });
    }, []);

    const setLocationIds = useCallback((locationIds: string[]) => {
        dispatch({ type: 'SET_LOCATION_IDS', locationIds });
    }, []);

    const setTeamIds = useCallback((teamIds: string[]) => {
        dispatch({ type: 'SET_TEAM_IDS', teamIds });
    }, []);

    const setSpecialtyIds = useCallback((specialtyIds: string[]) => {
        dispatch({ type: 'SET_SPECIALTY_IDS', specialtyIds });
    }, []);

    const setSearchTerm = useCallback((searchTerm: string) => {
        dispatch({ type: 'SET_SEARCH_TERM', searchTerm });
    }, []);

    const setDateRange = useCallback((dateRange: { start: Date; end: Date }) => {
        dispatch({ type: 'SET_DATE_RANGE', dateRange });
    }, []);

    const toggleShowWeekends = useCallback(() => {
        dispatch({ type: 'TOGGLE_SHOW_WEEKENDS' });
    }, []);

    const toggleShowAllDay = useCallback(() => {
        dispatch({ type: 'TOGGLE_SHOW_ALL_DAY' });
    }, []);

    const toggleShowRejectedLeaves = useCallback(() => {
        dispatch({ type: 'TOGGLE_SHOW_REJECTED_LEAVES' });
    }, []);

    const resetFilters = useCallback(() => {
        dispatch({ type: 'RESET_FILTERS' });
    }, []);

    const setAllFilters = useCallback((filters: Partial<CalendarFilters>) => {
        dispatch({ type: 'SET_ALL_FILTERS', filters });
    }, []);

    // Calculer les types d'événements filtrés
    const filteredEventTypes = useMemo(() => {
        return state.filters.eventTypes;
    }, [state.filters.eventTypes]);

    // Déterminer si des filtres sont actifs
    const hasActiveFilters = useMemo(() => {
        const { filters } = state;
        const allEventTypesSelected = filters.eventTypes.length === Object.values(EventType).length;
        const hasSpecificFilters = Boolean(
            (filters.userIds && filters.userIds.length > 0) ||
            (filters.userRoles && filters.userRoles.length > 0) ||
            (filters.leaveTypes && filters.leaveTypes.length > 0) ||
            (filters.leaveStatuses && filters.leaveStatuses.length > 0) ||
            (filters.locationIds && filters.locationIds.length > 0) ||
            (filters.teamIds && filters.teamIds.length > 0) ||
            (filters.specialtyIds && filters.specialtyIds.length > 0) ||
            (filters.searchTerm && filters.searchTerm.trim() !== '')
        );

        const hasUIFilters =
            filters.showWeekends !== initialFiltersState.filters.showWeekends ||
            filters.showAllDay !== initialFiltersState.filters.showAllDay ||
            filters.showRejectedLeaves !== initialFiltersState.filters.showRejectedLeaves;

        return !allEventTypesSelected || hasSpecificFilters || hasUIFilters;
    }, [state.filters]);

    // Retourner l'API de gestion des filtres
    return {
        filters: state.filters,
        availableFilters: state.availableFilters,
        setEventTypes,
        toggleEventType,
        setUserIds,
        setUserRoles,
        setLeaveTypes,
        setLeaveStatuses,
        setLocationIds,
        setTeamIds,
        setSpecialtyIds,
        setSearchTerm,
        setDateRange,
        toggleShowWeekends,
        toggleShowAllDay,
        toggleShowRejectedLeaves,
        resetFilters,
        setAllFilters,
        filteredEventTypes,
        hasActiveFilters
    };
}; 