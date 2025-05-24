import { useEffect, useState, useCallback } from 'react';

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
                    console.log(`Load Time: ${loadTime.toFixed(2)}ms`);
                    console.log(`Render Time: ${renderTime.toFixed(2)}ms`);
                    console.log(`Time to Interactive: ${timeToInteractive.toFixed(2)}ms`);
                    if (memoryUsage) {
                        console.log(`Memory Usage: ${memoryUsage.toFixed(2)}MB`);
                    }
                    if (Object.keys(customMetrics).length > 0) {
                        console.log('Custom Metrics:', customMetrics);
                    }
                    console.groupEnd();
                }

                // Envoyer les métriques en production (optionnel)
                if (process.env.NODE_ENV === 'production' && pageName) {
                    // Ici vous pourriez envoyer les métriques à un service d'analytics
                    // sendAnalytics(pageName, performanceMetrics);
                }

            } catch (error) {
                console.error('Erreur lors de la mesure des performances:', error);
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
    }, [pageName, customMetrics]);

    return { metrics, isLoading, recordMetric };
};

// Hook spécialisé pour les pages d'authentification
export const useAuthPerformanceMetrics = () => {
    const { metrics, isLoading, recordMetric } = usePerformanceMetrics('Authentication');

    const recordAuthStep = useCallback((step: 'login_start' | 'api_call' | 'redirect') => {
        const timestamp = performance.now();
        recordMetric(`auth_${step}`, timestamp);
    }, [recordMetric]);

    return {
        metrics,
        isLoading,
        recordAuthStep,
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
            console.log(`⏱️ ${metricName}: ${executionTime.toFixed(2)}ms`);
        }

        return { result, executionTime };
    } catch (error) {
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        console.error(`❌ ${metricName} failed after ${executionTime.toFixed(2)}ms:`, error);
        throw error;
    }
}; 