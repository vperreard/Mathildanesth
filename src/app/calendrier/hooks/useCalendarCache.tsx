import { useCallback, useEffect, useRef } from 'react';
import { CalendarEvent } from '../components/CalendarGrid';
import { CalendarFilters } from './useCalendarFilters';

// Type pour une entrée de cache
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    key: string;
}

// Type pour le cache complet
interface Cache<T> {
    [key: string]: CacheEntry<T>;
}

// Structure d'une plage de dates
interface DateRange {
    start: Date;
    end: Date;
}

// Options du hook de cache
interface CalendarCacheOptions {
    cacheDuration?: number; // Durée de vie du cache en millisecondes
    maxEntries?: number; // Nombre maximal d'entrées dans le cache
}

/**
 * Hook personnalisé pour gérer le cache des données du calendrier
 */
export const useCalendarCache = <T extends any[]>(
    options: CalendarCacheOptions = {}
) => {
    // Valeurs par défaut des options
    const {
        cacheDuration = 5 * 60 * 1000, // 5 minutes par défaut
        maxEntries = 20 // Maximum 20 entrées par défaut
    } = options;

    // Référence au cache (pour éviter les re-rendus)
    const cacheRef = useRef<Cache<T>>({});

    // Fonction pour générer une clé de cache à partir des paramètres
    const generateCacheKey = useCallback((
        dateRange: DateRange,
        filters?: Partial<CalendarFilters>
    ): string => {
        // Créer une représentation JSON des paramètres
        const keyObj = {
            startDate: dateRange.start.toISOString(),
            endDate: dateRange.end.toISOString(),
            filters: filters || {}
        };

        return JSON.stringify(keyObj);
    }, []);

    // Fonction pour obtenir une valeur du cache
    const getCachedData = useCallback((
        dateRange: DateRange,
        filters?: Partial<CalendarFilters>
    ): T | null => {
        const key = generateCacheKey(dateRange, filters);
        const cacheEntry = cacheRef.current[key];

        // Vérifier si l'entrée existe et est encore valide
        if (cacheEntry) {
            const now = Date.now();
            const isExpired = now - cacheEntry.timestamp > cacheDuration;

            if (!isExpired) {
                return cacheEntry.data;
            }
        }

        return null;
    }, [generateCacheKey, cacheDuration]);

    // Fonction pour mettre en cache une valeur
    const cacheData = useCallback((
        data: T,
        dateRange: DateRange,
        filters?: Partial<CalendarFilters>
    ): void => {
        const key = generateCacheKey(dateRange, filters);
        const timestamp = Date.now();

        // Ajouter l'entrée au cache
        cacheRef.current[key] = {
            data,
            timestamp,
            key
        };

        // Nettoyer le cache si nécessaire (LRU - Least Recently Used)
        const entries = Object.values(cacheRef.current);
        if (entries.length > maxEntries) {
            // Trier par timestamp et supprimer les plus anciennes
            const sortedEntries = entries.sort((a, b) => a.timestamp - b.timestamp);
            const entriesToRemove = sortedEntries.slice(0, entries.length - maxEntries);

            // Supprimer les entrées les plus anciennes
            entriesToRemove.forEach(entry => {
                delete cacheRef.current[entry.key];
            });
        }
    }, [generateCacheKey, maxEntries]);

    // Fonction pour invalider le cache
    const invalidateCache = useCallback((
        dateRange?: DateRange,
        filters?: Partial<CalendarFilters>
    ): void => {
        // Si des paramètres sont fournis, invalider uniquement cette entrée
        if (dateRange) {
            const key = generateCacheKey(dateRange, filters);
            delete cacheRef.current[key];
        } else {
            // Sinon, vider tout le cache
            cacheRef.current = {};
        }
    }, [generateCacheKey]);

    // Nettoyer les entrées expirées périodiquement
    useEffect(() => {
        const cleanupInterval = setInterval(() => {
            const now = Date.now();
            const entries = Object.entries(cacheRef.current);

            // Supprimer les entrées expirées
            entries.forEach(([key, entry]) => {
                if (now - entry.timestamp > cacheDuration) {
                    delete cacheRef.current[key];
                }
            });
        }, cacheDuration); // Nettoyer à la fréquence de la durée du cache

        return () => {
            clearInterval(cleanupInterval);
        };
    }, [cacheDuration]);

    // Fonction de fetch avec cache
    const fetchWithCache = useCallback(async (
        fetchFn: (dateRange: DateRange, filters?: Partial<CalendarFilters>) => Promise<T>,
        dateRange: DateRange,
        filters?: Partial<CalendarFilters>
    ): Promise<T> => {
        // Vérifier si les données sont en cache
        const cachedData = getCachedData(dateRange, filters);
        if (cachedData) {
            return cachedData;
        }

        // Sinon, appeler la fonction de fetch
        const data = await fetchFn(dateRange, filters);

        // Mettre en cache les résultats
        cacheData(data, dateRange, filters);

        return data;
    }, [getCachedData, cacheData]);

    // Retourner les fonctions du hook
    return {
        getCachedData,
        cacheData,
        invalidateCache,
        fetchWithCache
    };
}; 