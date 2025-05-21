"use client";

import { useState, useEffect, useCallback } from 'react';
import { prisma } from '@/lib/prisma';

interface PerformanceMetrics {
    cacheSize: number;
    cacheHits: number;
    cacheMisses: number;
    cacheHitRate: number;
    lastQueryDuration: number | null;
    averageQueryDuration: number | null;
    slowestQuery: {
        name: string;
        duration: number;
    } | null;
}

// Type pour prisma avec statistiques de cache
type PrismaWithCache = typeof prisma & {
    $cacheStats: () => {
        size: number;
        hits: number;
        misses: number;
        hitRate: number;
    }
};

/**
 * Hook pour mesurer et surveiller les performances des requêtes
 * Fonctionne en coordination avec le système de cache Prisma
 */
export function useQueryPerformance() {
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        cacheSize: 0,
        cacheHits: 0,
        cacheMisses: 0,
        cacheHitRate: 0,
        lastQueryDuration: null,
        averageQueryDuration: null,
        slowestQuery: null
    });

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    // Récupérer les métriques de cache
    const refreshMetrics = useCallback(async () => {
        try {
            setIsLoading(true);

            // Accéder aux statistiques du cache si disponibles
            if ((prisma as PrismaWithCache).$cacheStats) {
                const cacheStats = (prisma as PrismaWithCache).$cacheStats();

                setMetrics(prev => ({
                    ...prev,
                    cacheSize: cacheStats.size,
                    cacheHits: cacheStats.hits,
                    cacheMisses: cacheStats.misses,
                    cacheHitRate: cacheStats.hitRate
                }));
            }

            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la récupération des métriques'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Mesurer les performances d'une requête
    const measureQuery = useCallback(async <T>(
        queryName: string,
        queryFn: () => Promise<T>
    ): Promise<T> => {
        const startTime = performance.now();
        try {
            const result = await queryFn();
            const duration = performance.now() - startTime;

            setMetrics(prev => {
                const newMetrics = {
                    ...prev,
                    lastQueryDuration: duration,
                    averageQueryDuration: prev.averageQueryDuration
                        ? (prev.averageQueryDuration + duration) / 2
                        : duration
                };

                // Enregistrer la requête la plus lente
                if (!prev.slowestQuery || duration > prev.slowestQuery.duration) {
                    newMetrics.slowestQuery = {
                        name: queryName,
                        duration
                    };
                }

                return newMetrics;
            });

            return result;
        } catch (error) {
            // Enregistrer l'erreur mais la propager pour la gestion externe
            throw error;
        }
    }, []);

    // Rafraîchir les métriques au montage
    useEffect(() => {
        refreshMetrics();

        // Optionnel: rafraîchir périodiquement
        const intervalId = setInterval(refreshMetrics, 30000); // toutes les 30 sec

        return () => clearInterval(intervalId);
    }, [refreshMetrics]);

    return {
        metrics,
        isLoading,
        error,
        refreshMetrics,
        measureQuery
    };
} 