import { useState, useEffect, useRef, useCallback } from 'react';

import { logger } from "../lib/logger";
type QueryState<T> = {
    data: T | null;
    isLoading: boolean;
    error: Error | null;
    isStale: boolean;
};

type QueryOptions = {
    cacheKey?: string;
    cacheTTL?: number; // Durée de vie du cache en ms
    staleTime?: number; // Temps avant que les données soient considérées comme périmées
    retryCount?: number;
    retryDelay?: number;
    dependsOn?: unknown[];
    onSuccess?: (data: unknown) => void;
    onError?: (error: Error) => void;
    enabled?: boolean;
};

type QueryClient = {
    cache: Map<string, { data: unknown; timestamp: number }>;
    addToCache: (key: string, data: unknown, ttl: number) => void;
    getFromCache: (key: string) => { data: unknown; timestamp: number } | undefined;
    invalidateQuery: (key: string) => void;
    invalidateQueries: (keyPattern?: RegExp) => void;
    clearCache: () => void;
};

// Création d'une instance unique du client de requête
const defaultQueryClient: QueryClient = {
    cache: new Map(),

    addToCache: (key, data, ttl) => {
        defaultQueryClient.cache.set(key, { data, timestamp: Date.now() });
        if (ttl > 0) {
            setTimeout(() => {
                defaultQueryClient.invalidateQuery(key);
            }, ttl);
        }
    },

    getFromCache: (key) => {
        return defaultQueryClient.cache.get(key);
    },

    invalidateQuery: (key) => {
        defaultQueryClient.cache.delete(key);
    },

    invalidateQueries: (keyPattern) => {
        if (!keyPattern) {
            defaultQueryClient.clearCache();
            return;
        }

        for (const key of defaultQueryClient.cache.keys()) {
            if (keyPattern.test(key)) {
                defaultQueryClient.cache.delete(key);
            }
        }
    },

    clearCache: () => {
        defaultQueryClient.cache.clear();
    }
};

export const QueryClientProvider = {
    getClient: () => defaultQueryClient
};

/**
 * Hook pour effectuer des requêtes API optimisées avec mise en cache
 * @param queryFn Fonction qui retourne une promesse avec les données
 * @param options Options de configuration de la requête
 * @returns État de la requête avec méthodes pour rafraîchir ou annuler
 */
export function useOptimizedQuery<T = any>(
    arg1: string | (() => Promise<T>),
    arg2?: (() => Promise<T>) | QueryOptions,
    arg3: QueryOptions = {}
) {
    // Supporter deux signatures : (queryFn, options) ou (cacheKey, queryFn, options)
    let queryFn: () => Promise<T>;
    let options: QueryOptions;

    if (typeof arg1 === 'string' && typeof arg2 === 'function') {
        // Signature : (cacheKey, queryFn, options)
        queryFn = arg2;
        options = arg3;
        options.cacheKey = arg1;
    } else {
        // Signature : (queryFn, options)
        queryFn = arg1 as () => Promise<T>;
        options = (arg2 as QueryOptions) || {};
    }
    const {
        cacheKey,
        cacheTTL = 5 * 60 * 1000, // 5 minutes par défaut
        staleTime = 60 * 1000,     // 1 minute par défaut
        retryCount = 3,
        retryDelay = 1000,
        dependsOn = [],
        onSuccess,
        onError,
        enabled = true
    } = options;

    const client = QueryClientProvider.getClient();
    const [state, setState] = useState<QueryState<T>>({
        data: null,
        isLoading: enabled,
        error: null,
        isStale: false
    });

    const isMounted = useRef(true);
    const controller = useRef<AbortController | null>(null);
    const retryCountRef = useRef(0);
    const initialLoadRef = useRef(true);

    const fetchData = useCallback(async (isRefresh = false) => {
        // Si la requête est désactivée, ne rien faire
        if (!enabled) {
            setState(prev => ({ ...prev, isLoading: false }));
            return;
        }

        // Ne pas refaire la requête si elle est déjà en cours, sauf si c'est un rafraîchissement explicite
        if (state.isLoading && !isRefresh) return;

        // Vérifier le cache
        if (cacheKey && !isRefresh) {
            const cached = client.getFromCache(cacheKey);

            if (cached) {
                const isDataStale = Date.now() - cached.timestamp > staleTime;

                // Utiliser les données du cache et mettre à jour le statut
                setState({
                    data: cached.data,
                    isLoading: isDataStale && enabled, // Recharger en background si les données sont périmées
                    error: null,
                    isStale: isDataStale
                });

                // Si les données sont encore fraîches, on s'arrête ici
                if (!isDataStale) {
                    if (onSuccess) onSuccess(cached.data);
                    return;
                }
            }
        }

        // Si on arrive ici, on doit faire ou refaire la requête
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Annuler toute requête précédente
        if (controller.current) {
            controller.current.abort();
        }

        controller.current = new AbortController();

        try {
            const data = await queryFn();

            if (!isMounted.current) return;

            // Mettre à jour l'état
            setState({
                data,
                isLoading: false,
                error: null,
                isStale: false
            });

            // Mettre à jour le cache
            if (cacheKey) {
                client.addToCache(cacheKey, data, cacheTTL);
            }

            // Réinitialiser le nombre de tentatives
            retryCountRef.current = 0;

            // Appeler le callback de succès
            if (onSuccess) onSuccess(data);

        } catch (error: unknown) {
            if (!isMounted.current || error.name === 'AbortError') return;

            logger.error(`Erreur lors de la requête${cacheKey ? ` (${cacheKey})` : ''}:`, { error: error });

            // Gérer les tentatives de réessai
            if (retryCountRef.current < retryCount) {
                retryCountRef.current += 1;
                setTimeout(() => {
                    fetchData(true);
                }, retryDelay * retryCountRef.current);
                return;
            }

            // Mettre à jour l'état avec l'erreur
            setState({
                data: state.data, // Conserver les données précédentes si elles existent
                isLoading: false,
                error: error instanceof Error ? error : new Error(String(error)),
                isStale: true
            });

            // Appeler le callback d'erreur
            if (onError) onError(error instanceof Error ? error : new Error(String(error)));
        }
    }, [queryFn, state.isLoading, state.data, cacheKey, cacheTTL, staleTime, enabled, retryCount, retryDelay, onSuccess, onError, client]);

    // Lancer la requête au montage et quand les dépendances changent
    useEffect(() => {
        isMounted.current = true;

        // Ne pas charger automatiquement si disabled
        if (enabled) {
            fetchData(false);
        } else if (initialLoadRef.current) {
            // Si désactivé dès le début, marquer comme non chargement
            setState(prev => ({ ...prev, isLoading: false }));
        }

        initialLoadRef.current = false;

        return () => {
            isMounted.current = false;
            controller.current?.abort();
        };
    }, [fetchData, enabled, ...dependsOn]);

    /**
     * Rafraîchit les données en ignorant le cache
     */
    const refetch = useCallback(() => {
        return fetchData(true);
    }, [fetchData]);

    /**
     * Annule la requête en cours
     */
    const cancel = useCallback(() => {
        if (controller.current) {
            controller.current.abort();
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, []);

    /**
     * Invalide explicitement le cache pour cette requête
     */
    const invalidateCache = useCallback(() => {
        if (cacheKey) {
            client.invalidateQuery(cacheKey);
        }
    }, [cacheKey, client]);

    return {
        ...state,
        refetch,
        cancel,
        invalidateCache
    };
}

/**
 * Fonction utilitaire pour invalider certaines requêtes du cache
 * @param keyPattern Expression régulière pour filtrer les clés à invalider
 */
export function invalidateQueries(keyPattern?: RegExp) {
    const client = QueryClientProvider.getClient();
    client.invalidateQueries(keyPattern);
}

/**
 * Efface complètement le cache
 */
export function clearQueryCache() {
    const client = QueryClientProvider.getClient();
    client.clearCache();
}

/**
 * Ajoute manuellement des données au cache
 * @param key Clé de cache
 * @param data Données à mettre en cache
 * @param ttl Durée de vie en ms
 */
export function setQueryCache<T>(key: string, data: T, ttl = 5 * 60 * 1000) {
    const client = QueryClientProvider.getClient();
    client.addToCache(key, data, ttl);
}

/**
 * Récupère des données du cache sans déclencher de requête
 * @param key Clé de cache
 * @returns Données mises en cache ou undefined si non trouvées
 */
export function getQueryCache<T>(key: string): T | undefined {
    const client = QueryClientProvider.getClient();
    const cached = client.getFromCache(key);
    return cached?.data;
} 