import { useState, useCallback, useEffect } from 'react';
import { AnyCalendarEvent, CalendarFilters, CalendarSettings } from '../types/event';
import { calendarCache } from '../services/calendarCache';
import { fetchCalendarEvents } from '../services/calendarService';

interface UseCalendarCacheOptions {
    enabled?: boolean;  // Activer/désactiver le cache
    ttl?: number;       // Durée de vie du cache en ms
}

interface UseCalendarCacheReturn {
    events: AnyCalendarEvent[];
    loading: boolean;
    error: Error | null;
    fetchEvents: (filters: CalendarFilters) => Promise<AnyCalendarEvent[]>;
    invalidateCache: (filters?: CalendarFilters) => void;
    isCacheHit: boolean;
}

const DEFAULT_OPTIONS: UseCalendarCacheOptions = {
    enabled: true,
    ttl: 5 * 60 * 1000 // 5 minutes
};

/**
 * Hook pour gérer le cache des événements du calendrier
 * Utilise le service calendarCache pour mettre en cache les résultats d'appels API
 */
export const useCalendarCache = (
    initialFilters: CalendarFilters,
    options: UseCalendarCacheOptions = DEFAULT_OPTIONS
): UseCalendarCacheReturn => {
    // Fusionner les options avec les valeurs par défaut
    const { enabled, ttl } = { ...DEFAULT_OPTIONS, ...options };

    // État pour les événements, le chargement et les erreurs
    const [events, setEvents] = useState<AnyCalendarEvent[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [isCacheHit, setIsCacheHit] = useState<boolean>(false);

    // Fonction pour récupérer les événements avec gestion du cache
    const fetchEvents = useCallback(async (filters: CalendarFilters): Promise<AnyCalendarEvent[]> => {
        setLoading(true);
        setError(null);
        setIsCacheHit(false);

        try {
            // Vérifier si les données sont dans le cache
            if (enabled) {
                const cachedEvents = calendarCache.getCachedEvents(filters);

                if (cachedEvents) {
                    setEvents(cachedEvents);
                    setIsCacheHit(true);
                    setLoading(false);
                    return cachedEvents;
                }
            }

            // Si pas de cache ou cache désactivé, faire l'appel API
            const fetchedEvents = await fetchCalendarEvents(filters);

            // Mettre en cache les résultats si le cache est activé
            if (enabled) {
                calendarCache.cacheEvents(fetchedEvents, filters, { ttl });
            }

            setEvents(fetchedEvents);
            return fetchedEvents;
        } catch (err) {
            const errorObject = err instanceof Error ? err : new Error('Erreur inconnue');
            setError(errorObject);
            console.error('Erreur dans useCalendarCache:', err);
            return [];
        } finally {
            setLoading(false);
        }
    }, [enabled, ttl]);

    // Fonction pour invalider le cache
    const invalidateCache = useCallback((filters?: CalendarFilters) => {
        if (filters) {
            calendarCache.invalidateEvents(filters);
        } else {
            calendarCache.clearCache();
        }
    }, []);

    // Récupérer les événements au montage du composant
    useEffect(() => {
        fetchEvents(initialFilters);
    }, [initialFilters, fetchEvents]);

    return {
        events,
        loading,
        error,
        fetchEvents,
        invalidateCache,
        isCacheHit
    };
}; 