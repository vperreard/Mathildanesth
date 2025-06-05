import { useEffect, useState, useCallback } from 'react';

import { logger } from "../lib/logger";
interface PerformanceMetrics {
    loadTime: number;
    renderTime: number;
    timeToInteractive: number;
    memoryUsage?: number;
}

interface PerformanceHookReturn {
    metrics: PerformanceMetrics | null;
    isLoading: boolean;
    recordMetric: (metricName: string, value: number) => void;
}

export const usePerformanceMetrics = (pageName?: string): PerformanceHookReturn => {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [customMetrics, setCustomMetrics] = useState<Record<string, number>>({});

    const recordMetric = useCallback((metricName: string, value: number) => {
        setCustomMetrics(prev => ({ ...prev, [metricName]: value }));
    }, []);

    useEffect(() => {
        // Attendre que la page soit complètement chargée
        const measurePerformance = () => {
            try {
                const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
                const paint = performance.getEntriesByType('paint');

                const loadTime = navigation.loadEventEnd - navigation.fetchStart;
                const renderTime = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;

                // Time to Interactive approximation
                const timeToInteractive = navigation.domInteractive - navigation.fetchStart;

                // Mesure de la mémoire si disponible
                let memoryUsage: number | undefined;
                if ('memory' in performance) {
                    const memInfo = (performance as any).memory;
                    memoryUsage = memInfo.usedJSHeapSize / (1024 * 1024); // En MB
                }

                const performanceMetrics: PerformanceMetrics = {
                    loadTime,
                    renderTime,
                    timeToInteractive,
                    memoryUsage,
                };

                setMetrics(performanceMetrics);
                setIsLoading(false);

                // Log en développement
                if (process.env.NODE_ENV === 'development') {
                    console.group(`🚀 Performance Metrics ${pageName ? `- ${pageName}` : ''}`);
                    logger.info(`Load Time: ${loadTime.toFixed(2)}ms`);
                    logger.info(`Render Time: ${renderTime.toFixed(2)}ms`);
                    logger.info(`Time to Interactive: ${timeToInteractive.toFixed(2)}ms`);
                    if (memoryUsage) {
                        logger.info(`Memory Usage: ${memoryUsage.toFixed(2)}MB`);
                    }
                    // Log custom metrics at measurement time
                    setCustomMetrics(currentCustomMetrics => {
                        if (Object.keys(currentCustomMetrics).length > 0) {
                            logger.info('Custom Metrics:', currentCustomMetrics);
                        }
                        return currentCustomMetrics;
                    });
                    console.groupEnd();
                }

                // Envoyer les métriques en production (optionnel)
                if (process.env.NODE_ENV === 'production' && pageName) {
                    // Ici vous pourriez envoyer les métriques à un service d'analytics
                    // sendAnalytics(pageName, performanceMetrics);
                }

            } catch (error) {
                logger.error('Erreur lors de la mesure des performances:', error);
                setIsLoading(false);
            }
        };

        // Mesurer après le chargement complet
        if (document.readyState === 'complete') {
            setTimeout(measurePerformance, 100);
        } else {
            window.addEventListener('load', () => setTimeout(measurePerformance, 100));
        }

        // Nettoyer les listeners
        return () => {
            window.removeEventListener('load', measurePerformance);
        };
    }, [pageName]);

    return { metrics, isLoading, recordMetric };
};

// Hook spécialisé pour les pages d'authentification
export const useAuthPerformanceMetrics = () => {
    const { metrics, isLoading, recordMetric } = usePerformanceMetrics('Authentication');
    const [authMetrics, setAuthMetrics] = useState<Record<string, number>>({});

    const recordAuthStep = useCallback((step: string) => {
        const timestamp = performance.now();
        setAuthMetrics(prev => ({ ...prev, [step]: timestamp }));
        recordMetric(`auth_${step}`, timestamp);
    }, [recordMetric]);

    const getAuthMetrics = useCallback(() => {
        return authMetrics;
    }, [authMetrics]);

    return {
        metrics,
        isLoading,
        recordAuthStep,
        getAuthMetrics,
        recordMetric,
    };
};

// Fonction utilitaire pour mesurer les temps d'exécution
export const measureExecutionTime = async <T>(
    fn: () => Promise<T>,
    metricName: string
): Promise<{ result: T; executionTime: number }> => {
    const startTime = performance.now();

    try {
        const result = await fn();
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        if (process.env.NODE_ENV === 'development') {
            logger.info(`⏱️ ${metricName}: ${executionTime.toFixed(2)}ms`);
        }

        return { result, executionTime };
    } catch (error) {
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        logger.error(`❌ ${metricName} failed after ${executionTime.toFixed(2)}ms:`, error);
        throw error;
    }
}; 