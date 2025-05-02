import { CalendarFilters, CalendarSettings } from '../types/event';
import { startOfMonth, endOfMonth } from 'date-fns';

// Configuration du store par défaut
export const DEFAULT_FILTERS: CalendarFilters = {
    eventTypes: [],
    userIds: [],
    userRoles: [],
    leaveTypes: [],
    leaveStatuses: [],
    locationIds: [],
    teamIds: [],
    specialtyIds: [],
    searchTerm: '',
    dateRange: {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    }
};

export const DEFAULT_SETTINGS: CalendarSettings = {
    locale: 'fr',
    firstDay: 1,
    businessHours: {
        startTime: '08:00',
        endTime: '18:00',
        daysOfWeek: [1, 2, 3, 4, 5]
    },
    nowIndicator: true,
    snapDuration: '00:15:00',
    slotDuration: '00:30:00',
    slotLabelInterval: '01:00:00',
    slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    },
    slotMinTime: '08:00:00',
    slotMaxTime: '20:00:00'
};

// Fonction de hachage simple pour créer une clé de cache
export const createCacheKey = (filters: CalendarFilters): string => {
    return JSON.stringify({
        eventTypes: filters.eventTypes,
        userIds: filters.userIds,
        dateRange: filters.dateRange ? {
            start: filters.dateRange.start.toISOString(),
            end: filters.dateRange.end.toISOString()
        } : undefined
    });
};

// TTL du cache en ms (5 minutes)
export const CACHE_TTL = 5 * 60 * 1000; 