import { useState, useCallback, useMemo } from 'react';
import { CalendarFilters, CalendarEventType } from '../types/event';

interface UseCalendarFiltersProps {
    initialFilters?: Partial<CalendarFilters>;
}

/**
 * Hook pour gérer les filtres du calendrier
 */
export const useCalendarFilters = ({ initialFilters = {} }: UseCalendarFiltersProps = {}) => {
    // Valeur par défaut pour les filtres
    const defaultFilters: CalendarFilters = {
        eventTypes: [],
        dateRange: {
            start: new Date(),
            end: new Date()
        }
    };

    // État des filtres
    const [filters, setFilters] = useState<CalendarFilters>({
        ...defaultFilters,
        ...initialFilters
    });

    // Mettre à jour un filtre spécifique
    const updateFilter = useCallback(<K extends keyof CalendarFilters>(
        key: K,
        value: CalendarFilters[K]
    ) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    }, []);

    // Ajouter/supprimer un type d'événement du filtre
    const toggleEventType = useCallback((eventType: CalendarEventType) => {
        setFilters(prev => {
            const currentTypes = prev.eventTypes || [];
            const isSelected = currentTypes.includes(eventType);

            return {
                ...prev,
                eventTypes: isSelected
                    ? currentTypes.filter(type => type !== eventType)
                    : [...currentTypes, eventType]
            };
        });
    }, []);

    // Ajouter/supprimer un utilisateur du filtre
    const toggleUser = useCallback((userId: string) => {
        setFilters(prev => {
            const currentUsers = prev.userIds || [];
            const isSelected = currentUsers.includes(userId);

            return {
                ...prev,
                userIds: isSelected
                    ? currentUsers.filter(id => id !== userId)
                    : [...currentUsers, userId]
            };
        });
    }, []);

    // Ajouter/supprimer un lieu du filtre
    const toggleLocation = useCallback((locationId: string) => {
        setFilters(prev => {
            const currentLocations = prev.locationIds || [];
            const isSelected = currentLocations.includes(locationId);

            return {
                ...prev,
                locationIds: isSelected
                    ? currentLocations.filter(id => id !== locationId)
                    : [...currentLocations, locationId]
            };
        });
    }, []);

    // Mettre à jour la plage de dates
    const updateDateRange = useCallback((start: Date, end: Date) => {
        setFilters(prev => ({
            ...prev,
            dateRange: { start, end }
        }));
    }, []);

    // Réinitialiser tous les filtres
    const resetFilters = useCallback(() => {
        setFilters(defaultFilters);
    }, [defaultFilters]);

    // Déterminer si des filtres sont actifs
    const hasActiveFilters = useMemo(() => {
        const { eventTypes = [], userIds = [], locationIds = [] } = filters;
        return eventTypes.length > 0 || userIds.length > 0 || locationIds.length > 0;
    }, [filters]);

    return {
        filters,
        setFilters,
        updateFilter,
        toggleEventType,
        toggleUser,
        toggleLocation,
        updateDateRange,
        resetFilters,
        hasActiveFilters
    };
}; 