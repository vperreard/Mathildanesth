"use client";

import { useState, useEffect, useCallback } from 'react';
import { prisma } from '@/lib/prisma';
import { usePerformance } from '@/context/PerformanceContext';
import { usePathname } from 'next/navigation';

// Type pour prisma avec statistiques de cache
type PrismaWithCache = typeof prisma & {
    $cacheStats: () => {
        size: number;
        hits: number;
        misses: number;
        hitRate: number;
    }
};

interface QueryPerformanceHookReturn {
    lastQueryDuration: number | null;
    averageQueryDuration: number | null;
    slowestQuery: {
        name: string;
        duration: number;
        timestamp: number;
    } | null;
    cacheStats: {
        size: number;
        hits: number;
        misses: number;
        hitRate: number;
    };
    queryCount: number;
    pageLoadTimes: {
        page: string;
        loadTime: number;
        timestamp: number;
    }[];
    navigationHistory: {
        from: string;
        to: string;
        duration: number;
        timestamp: number;
    }[];
    recordQuery: (name: string, startTime: number) => void;
    resetMetrics: () => void;
}

/**
 * Hook pour mesurer et surveiller les performances des requêtes
 * Les métriques sont persistantes entre les navigations
 */
export function useQueryPerformance(): QueryPerformanceHookReturn {
    const {
        metrics,
        recordQueryPerformance,
        updateCacheStats,
        recordPageLoad,
        recordPageNavigation,
        resetMetrics
    } = usePerformance();

    const pathname = usePathname();
    const [prevPathname, setPrevPathname] = useState<string | null>(null);
    const [navigationType, setNavigationType] = useState<'initial' | 'navigation'>('initial');
    const [navigationStartTime, setNavigationStartTime] = useState<number | null>(null);

    // Surveiller les changements de page pour mesurer les performances de navigation
    useEffect(() => {
        // Ne rien faire au chargement initial
        if (!prevPathname && navigationType === 'initial') {
            setPrevPathname(pathname);
            const pageLoadTime = performance.now();
            recordPageLoad(pathname || 'unknown', pageLoadTime);
            return;
        }

        // Si c'est une navigation (pas le premier rendu)
        if (prevPathname && pathname !== prevPathname) {
            // Si on a un temps de début de navigation
            if (navigationStartTime) {
                const navDuration = performance.now() - navigationStartTime;
                recordPageNavigation(prevPathname, pathname || 'unknown', navDuration);
            }

            // Mettre à jour pour la prochaine navigation
            setPrevPathname(pathname);
            setNavigationType('navigation');
            setNavigationStartTime(performance.now());
        }
    }, [pathname, prevPathname, navigationType, navigationStartTime, recordPageNavigation, recordPageLoad]);

    // Récupérer les statistiques de cache de Prisma
    useEffect(() => {
        // Vérifier si prisma a des statistiques de cache
        try {
            // @ts-ignore - Accès aux statistiques internes
            const cacheStats = (prisma as PrismaWithCache).$cacheStats?.();
            if (cacheStats) {
                updateCacheStats(cacheStats);
            }
        } catch (error) {
            // Ignorer les erreurs - le cache n'est peut-être pas disponible
        }

        const interval = setInterval(() => {
            try {
                // @ts-ignore - Accès aux statistiques internes
                const cacheStats = (prisma as PrismaWithCache).$cacheStats?.();
                if (cacheStats) {
                    updateCacheStats(cacheStats);
                }
            } catch (error) {
                // Ignorer les erreurs
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [updateCacheStats]);

    // Fonction pour enregistrer une requête
    const recordQuery = useCallback((name: string, startTime: number) => {
        const duration = performance.now() - startTime;
        recordQueryPerformance(name, duration);
    }, [recordQueryPerformance]);

    // Retourner les valeurs du contexte et la fonction d'enregistrement
    return {
        lastQueryDuration: metrics.lastQueryDuration,
        averageQueryDuration: metrics.averageQueryDuration,
        slowestQuery: metrics.slowestQuery,
        cacheStats: {
            size: metrics.cacheSize,
            hits: metrics.cacheHits,
            misses: metrics.cacheMisses,
            hitRate: metrics.cacheHitRate
        },
        queryCount: metrics.queryCount,
        pageLoadTimes: metrics.pageLoadTimes,
        navigationHistory: metrics.navigationHistory,
        recordQuery,
        resetMetrics
    };
} 