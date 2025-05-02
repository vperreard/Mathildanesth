import { useState, useEffect, useCallback } from 'react';
import { calendarCache } from '../services/calendarCache';
import { calendarService } from '../services/calendarService';
import { AnyCalendarEvent, CalendarFilters } from '../types/event';

interface UseCalendarCacheOptions {
    enabled?: boolean;
    ttl?: number;
}

/**
 * Hook pour gérer le cache des événements du calendrier
 * @param filters Les filtres à appliquer
 * @param options Options du cache
 * @returns Les données et fonctions de gestion du cache
 */
export function useCalendarCache(
    filters: CalendarFilters,
    options: UseCalendarCacheOptions = {}
) {
    const { enabled = true, ttl = 5 * 60 * 1000 } = options;

    const [events, setEvents] = useState<AnyCalendarEvent[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [isCacheHit, setIsCacheHit] = useState<boolean>(false);

    const filtersKey = JSON.stringify(filters);

    // Fonction pour récupérer les événements avec ou sans le cache
    const fetchEvents = useCallback(async (fetchFilters: CalendarFilters = filters) => {
        setLoading(true);
        setError(null);

        try {
            const result = await calendarService.getEvents(fetchFilters);

            setEvents(result);

            // Mettre en cache les données si le cache est activé
            if (enabled) {
                const fetchFiltersKey = JSON.stringify(fetchFilters);
                calendarCache.cacheEvents(result, fetchFiltersKey, { ttl });
            }

            setLoading(false);
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Une erreur est survenue');
            console.error('Erreur lors de la récupération des événements:', error);
            setError(error);
            setEvents([]);
            setLoading(false);
            throw error;
        }
    }, [enabled, filters, ttl]);

    // Fonction pour invalider le cache
    const invalidateCache = useCallback((specificKey?: string) => {
        if (specificKey) {
            calendarCache.invalidateEvents(specificKey);
        } else {
            calendarCache.clearCache();
        }
    }, []);

    // Chargement initial des données
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);

            try {
                // Essayer de récupérer depuis le cache si activé
                if (enabled) {
                    const cachedData = calendarCache.getCachedEvents(filtersKey);

                    if (cachedData) {
                        setEvents(cachedData);
                        setIsCacheHit(true);
                        setLoading(false);
                        return;
                    }
                }

                // Si pas de données en cache ou cache désactivé, charger depuis l'API
                const apiData = await calendarService.getEvents(filters);
                setEvents(apiData);
                setIsCacheHit(false);

                // Mettre en cache si activé
                if (enabled) {
                    calendarCache.cacheEvents(apiData, filtersKey, { ttl });
                }
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Une erreur est survenue');
                console.error('Erreur lors de la récupération des événements:', error);
                setError(error);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [filtersKey, enabled, ttl, filters]);

    return {
        events,
        loading,
        error,
        isCacheHit,
        invalidateCache,
        fetchEvents
    };
} 