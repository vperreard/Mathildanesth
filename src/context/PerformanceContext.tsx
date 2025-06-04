"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface PerformanceMetrics {
    cacheSize: number;
    cacheHits: number;
    cacheMisses: number;
    cacheHitRate: number;
    lastQueryDuration: number | null;
    averageQueryDuration: number | null;
    queryCount: number;
    slowestQuery: {
        name: string;
        duration: number;
        timestamp: number;
    } | null;
    navigationHistory: {
        from: string;
        to: string;
        duration: number;
        timestamp: number;
    }[];
    pageLoadTimes: {
        page: string;
        loadTime: number;
        timestamp: number;
    }[];
}

interface PerformanceContextType {
    metrics: PerformanceMetrics;
    recordQueryPerformance: (queryName: string, duration: number) => void;
    recordPageNavigation: (from: string, to: string, duration: number) => void;
    recordPageLoad: (page: string, loadTime: number) => void;
    updateCacheStats: (stats: { size: number; hits: number; misses: number; hitRate: number }) => void;
    resetMetrics: () => void;
}

const initialMetrics: PerformanceMetrics = {
    cacheSize: 0,
    cacheHits: 0,
    cacheMisses: 0,
    cacheHitRate: 0,
    lastQueryDuration: null,
    averageQueryDuration: null,
    queryCount: 0,
    slowestQuery: null,
    navigationHistory: [],
    pageLoadTimes: [],
};

const PerformanceContext = createContext<PerformanceContextType | null>(null);

export function PerformanceProvider({ children }: { children: ReactNode }) {
    const [metrics, setMetrics] = useState<PerformanceMetrics>(initialMetrics);

    // Charger les métriques depuis le localStorage au démarrage
    useEffect(() => {
        try {
            const savedMetrics = localStorage.getItem('performanceMetrics');
            if (savedMetrics) {
                setMetrics(JSON.parse(savedMetrics));
            }
        } catch (e) {
            console.error('Erreur lors du chargement des métriques de performance:', e);
        }
    }, []);

    // Persister les métriques dans le localStorage à chaque mise à jour
    useEffect(() => {
        try {
            localStorage.setItem('performanceMetrics', JSON.stringify(metrics));
        } catch (e) {
            console.error('Erreur lors de la sauvegarde des métriques de performance:', e);
        }
    }, [metrics]);

    // Enregistrer les performances d'une requête
    const recordQueryPerformance = useCallback((queryName: string, duration: number) => {
        setMetrics(prev => {
            const newTotal = (prev.averageQueryDuration || 0) * prev.queryCount + duration;
            const newCount = prev.queryCount + 1;
            const newAverage = newTotal / newCount;

            const isSlower = !prev.slowestQuery || duration > prev.slowestQuery.duration;

            return {
                ...prev,
                lastQueryDuration: duration,
                averageQueryDuration: newAverage,
                queryCount: newCount,
                slowestQuery: isSlower
                    ? { name: queryName, duration, timestamp: Date.now() }
                    : prev.slowestQuery,
            };
        });
    }, []);

    // Enregistrer une navigation entre pages
    const recordPageNavigation = useCallback((from: string, to: string, duration: number) => {
        setMetrics(prev => {
            const newHistory = [...prev.navigationHistory, { from, to, duration, timestamp: Date.now() }];
            // Garder seulement les 20 dernières navigations
            if (newHistory.length > 20) {
                newHistory.shift();
            }
            return {
                ...prev,
                navigationHistory: newHistory
            };
        });
    }, []);

    // Enregistrer le temps de chargement d'une page
    const recordPageLoad = useCallback((page: string, loadTime: number) => {
        setMetrics(prev => {
            const newPageLoadTimes = [...prev.pageLoadTimes, { page, loadTime, timestamp: Date.now() }];
            // Garder seulement les 20 derniers temps de chargement
            if (newPageLoadTimes.length > 20) {
                newPageLoadTimes.shift();
            }
            return {
                ...prev,
                pageLoadTimes: newPageLoadTimes
            };
        });
    }, []);

    // Mettre à jour les statistiques du cache
    const updateCacheStats = useCallback((stats: { size: number; hits: number; misses: number; hitRate: number }) => {
        setMetrics(prev => ({
            ...prev,
            cacheSize: stats.size,
            cacheHits: stats.hits,
            cacheMisses: stats.misses,
            cacheHitRate: stats.hitRate
        }));
    }, []);

    // Réinitialiser toutes les métriques
    const resetMetrics = useCallback(() => {
        setMetrics(initialMetrics);
        localStorage.removeItem('performanceMetrics');
    }, []);

    return (
        <PerformanceContext.Provider
            value={{
                metrics,
                recordQueryPerformance,
                recordPageNavigation,
                recordPageLoad,
                updateCacheStats,
                resetMetrics
            }}
        >
            {children}
        </PerformanceContext.Provider>
    );
}

export function usePerformance() {
    const context = useContext(PerformanceContext);
    if (!context) {
        throw new Error('usePerformance must be used within a PerformanceProvider');
    }
    return context;
} 