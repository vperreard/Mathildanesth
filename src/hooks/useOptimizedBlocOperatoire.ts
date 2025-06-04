import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface OptimizedBlocOperatoireOptions {
    siteId?: string;
    enablePrefetch?: boolean;
    staleTime?: number;
    cacheTime?: number;
}

interface QueryKeys {
    operatingRooms: string[];
    operatingSectors: string[];
    supervisors: string[];
    activityTypes: string[];
    blocPlanning: (date: Date) => string[];
    trameModeles: string[];
}

// Stratégie de cache optimisée pour le bloc opératoire
const CACHE_CONFIG = {
    // Données statiques (salles, secteurs) - cache longue durée
    static: {
        staleTime: 1000 * 60 * 30, // 30 minutes
        cacheTime: 1000 * 60 * 60, // 1 heure
    },
    // Données dynamiques (planning, disponibilités) - cache courte durée
    dynamic: {
        staleTime: 1000 * 60 * 2, // 2 minutes
        cacheTime: 1000 * 60 * 5, // 5 minutes
    },
    // Données temps réel (affectations en cours) - pas de cache
    realtime: {
        staleTime: 0,
        cacheTime: 1000 * 30, // 30 secondes
    }
};

export const useOptimizedBlocOperatoire = (options: OptimizedBlocOperatoireOptions = {}) => {
    const { 
        siteId, 
        enablePrefetch = true,
        staleTime = CACHE_CONFIG.dynamic.staleTime,
        cacheTime = CACHE_CONFIG.dynamic.cacheTime
    } = options;
    
    const queryClient = useQueryClient();

    // Clés de requête centralisées
    const queryKeys: QueryKeys = {
        operatingRooms: ['operating-rooms', siteId].filter(Boolean),
        operatingSectors: ['operating-sectors', siteId].filter(Boolean),
        supervisors: ['supervisors', 'available', siteId].filter(Boolean),
        activityTypes: ['activity-types'],
        blocPlanning: (date: Date) => ['bloc-planning', date.toISOString(), siteId].filter(Boolean),
        trameModeles: ['trameModele-modeles', 'bloc', siteId].filter(Boolean)
    };

    // Préchargement intelligent des données critiques
    const prefetchCriticalData = useCallback(async () => {
        if (!enablePrefetch) return;

        // Précharger en parallèle les données statiques
        await Promise.all([
            queryClient.prefetchQuery({
                queryKey: queryKeys.operatingRooms,
                queryFn: async () => {
                    const response = await axios.get('http://localhost:3000/api/bloc-operatoire/operating-rooms', {
                        params: { siteId, includeInactive: false }
                    });
                    return response.data;
                },
                staleTime: CACHE_CONFIG.static.staleTime,
            }),
            queryClient.prefetchQuery({
                queryKey: queryKeys.operatingSectors,
                queryFn: async () => {
                    const response = await axios.get('http://localhost:3000/api/bloc-operatoire/operating-sectors', {
                        params: { siteId, includeRooms: true }
                    });
                    return response.data;
                },
                staleTime: CACHE_CONFIG.static.staleTime,
            }),
            queryClient.prefetchQuery({
                queryKey: queryKeys.activityTypes,
                queryFn: async () => {
                    const response = await axios.get('http://localhost:3000/api/activity-types');
                    return response.data;
                },
                staleTime: CACHE_CONFIG.static.staleTime,
            })
        ]);
    }, [queryClient, queryKeys, siteId, enablePrefetch]);

    // Hook pour les salles d'opération avec optimisation
    const useOperatingRooms = () => {
        return useQuery({
            queryKey: queryKeys.operatingRooms,
            queryFn: async () => {
                const response = await axios.get('http://localhost:3000/api/bloc-operatoire/operating-rooms', {
                    params: { siteId, includeInactive: false }
                });
                return response.data;
            },
            staleTime: CACHE_CONFIG.static.staleTime,
            gcTime: CACHE_CONFIG.static.cacheTime,
            refetchOnWindowFocus: false,
            refetchOnMount: false
        });
    };

    // Hook pour les secteurs avec optimisation
    const useOperatingSectors = () => {
        return useQuery({
            queryKey: queryKeys.operatingSectors,
            queryFn: async () => {
                const response = await axios.get('http://localhost:3000/api/bloc-operatoire/operating-sectors', {
                    params: { siteId, includeRooms: true }
                });
                return response.data;
            },
            staleTime: CACHE_CONFIG.static.staleTime,
            gcTime: CACHE_CONFIG.static.cacheTime,
            refetchOnWindowFocus: false,
            refetchOnMount: false
        });
    };

    // Hook pour le planning avec cache intelligent
    const useBlocPlanning = (date: Date) => {
        // Précharger les jours adjacents
        useCallback(() => {
            if (!enablePrefetch) return;

            const prevDay = new Date(date);
            prevDay.setDate(date.getDate() - 1);
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);

            // Précharger les jours adjacents en arrière-plan
            queryClient.prefetchQuery({
                queryKey: queryKeys.blocPlanning(prevDay),
                queryFn: async () => {
                    const response = await axios.get('http://localhost:3000/api/bloc-operatoire/planning', {
                        params: { date: prevDay.toISOString(), siteId }
                    });
                    return response.data;
                },
                staleTime: CACHE_CONFIG.dynamic.staleTime,
            });

            queryClient.prefetchQuery({
                queryKey: queryKeys.blocPlanning(nextDay),
                queryFn: async () => {
                    const response = await axios.get('http://localhost:3000/api/bloc-operatoire/planning', {
                        params: { date: nextDay.toISOString(), siteId }
                    });
                    return response.data;
                },
                staleTime: CACHE_CONFIG.dynamic.staleTime,
            });
        }, [date, siteId, queryClient, queryKeys, enablePrefetch])();

        return useQuery({
            queryKey: queryKeys.blocPlanning(date),
            queryFn: async () => {
                const response = await axios.get('http://localhost:3000/api/bloc-operatoire/planning', {
                    params: { date: date.toISOString(), siteId }
                });
                return response.data;
            },
            staleTime,
            gcTime: cacheTime,
            refetchInterval: 1000 * 60 * 5 // Rafraîchir toutes les 5 minutes
        });
    };

    // Hook pour les superviseurs disponibles avec cache court
    const useAvailableSupervisors = (date: Date, period: string) => {
        return useQuery({
            queryKey: [...queryKeys.supervisors, date.toISOString(), period],
            queryFn: async () => {
                const response = await axios.get('http://localhost:3000/api/utilisateurs', {
                    params: {
                        role: 'SUPERVISOR',
                        available: true,
                        date: date.toISOString(),
                        period,
                        siteId
                    }
                });
                return response.data;
            },
            staleTime: CACHE_CONFIG.dynamic.staleTime,
            gcTime: CACHE_CONFIG.dynamic.cacheTime,
            enabled: !!date && !!period
        });
    };

    // Invalidation intelligente du cache
    const invalidateBlocData = useCallback((type: 'all' | 'planning' | 'static' = 'planning') => {
        switch (type) {
            case 'all':
                queryClient.invalidateQueries({ queryKey: ['operating-rooms'] });
                queryClient.invalidateQueries({ queryKey: ['operating-sectors'] });
                queryClient.invalidateQueries({ queryKey: ['bloc-planning'] });
                queryClient.invalidateQueries({ queryKey: ['supervisors'] });
                break;
            case 'planning':
                queryClient.invalidateQueries({ queryKey: ['bloc-planning'] });
                queryClient.invalidateQueries({ queryKey: ['supervisors'] });
                break;
            case 'static':
                queryClient.invalidateQueries({ queryKey: ['operating-rooms'] });
                queryClient.invalidateQueries({ queryKey: ['operating-sectors'] });
                break;
        }
    }, [queryClient]);

    // Optimisation des requêtes batch
    const batchFetchPlanningWeek = useCallback(async (startDate: Date) => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dates.push(date);
        }

        const promises = dates.map(date => 
            queryClient.fetchQuery({
                queryKey: queryKeys.blocPlanning(date),
                queryFn: async () => {
                    const response = await axios.get('http://localhost:3000/api/bloc-operatoire/planning', {
                        params: { date: date.toISOString(), siteId }
                    });
                    return response.data;
                },
                staleTime: CACHE_CONFIG.dynamic.staleTime,
            })
        );

        return Promise.all(promises);
    }, [queryClient, queryKeys, siteId]);

    // Métriques de performance
    const getCacheMetrics = useCallback(() => {
        const cache = queryClient.getQueryCache();
        const queries = cache.getAll();
        
        const blocQueries = queries.filter(query => 
            query.queryKey.some(key => 
                typeof key === 'string' && 
                (key.includes('operating') || key.includes('bloc') || key.includes('supervisor'))
            )
        );

        return {
            totalQueries: blocQueries.length,
            staleQueries: blocQueries.filter(q => q.isStale()).length,
            activeQueries: blocQueries.filter(q => q.observers.length > 0).length,
            cachedDataSize: blocQueries.reduce((acc, q) => acc + (q.state.data ? 1 : 0), 0)
        };
    }, [queryClient]);

    return {
        // Hooks de requête
        useOperatingRooms,
        useOperatingSectors,
        useBlocPlanning,
        useAvailableSupervisors,
        
        // Utilitaires
        prefetchCriticalData,
        invalidateBlocData,
        batchFetchPlanningWeek,
        getCacheMetrics,
        
        // Configuration
        queryKeys,
        cacheConfig: CACHE_CONFIG
    };
};

export default useOptimizedBlocOperatoire;