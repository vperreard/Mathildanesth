import { useCallback, useEffect, useRef } from 'react';
import { performanceMonitor } from '@/lib/performance/performanceMonitor';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

interface PerformanceTrackingOptions {
    trackNavigation?: boolean;
    trackApiCalls?: boolean;
    trackRenders?: boolean;
    trackInteractions?: boolean;
}

export const usePerformanceTracking = (
    componentName: string,
    options: PerformanceTrackingOptions = {}
) => {
    const {
        trackNavigation = true,
        trackApiCalls = true,
        trackRenders = true,
        trackInteractions = true,
    } = options;

    const renderCount = useRef(0);
    const renderStartTime = useRef<number>();
    const queryClient = useQueryClient();

    // Tracker le rendu du composant
    useEffect(() => {
        if (trackRenders) {
            renderCount.current += 1;
            const renderTime = renderStartTime.current
                ? performance.now() - renderStartTime.current
                : 0;

            if (renderTime > 0) {
                performanceMonitor.sendCustomMetric(
                    `${componentName}_render_time`,
                    renderTime
                );
            }

            // Log si trop de re-renders
            if (renderCount.current > 10) {
                logger.warn(
                    `Component ${componentName} has rendered ${renderCount.current} times`
                );
            }
        }
    });

    // Tracker les interactions
    const trackInteraction = useCallback(
        (interactionName: string) => {
            if (!trackInteractions) return;

            return async <T,>(fn: () => T | Promise<T>): Promise<T> => {
                const startTime = performance.now();
                performanceMonitor.mark(`${componentName}_${interactionName}_start`);

                try {
                    const result = await fn();
                    const duration = performance.now() - startTime;

                    performanceMonitor.mark(`${componentName}_${interactionName}_end`);
                    performanceMonitor.measure(
                        `${componentName}_${interactionName}`,
                        `${componentName}_${interactionName}_start`,
                        `${componentName}_${interactionName}_end`
                    );

                    if (duration > 1000) {
                        logger.warn(
                            `Slow interaction detected: ${componentName}.${interactionName} took ${duration.toFixed(
                                2
                            )}ms`
                        );
                    }

                    return result;
                } catch (error: unknown) {
                    const duration = performance.now() - startTime;
                    logger.error(
                        `Interaction failed: ${componentName}.${interactionName} after ${duration.toFixed(
                            2
                        )}ms`,
                        error
                    );
                    throw error;
                }
            };
        },
        [componentName, trackInteractions]
    );

    // Tracker les appels API
    const trackApiCall = useCallback(
        <T,>(queryKey: string[], fn: () => Promise<T>) => {
            if (!trackApiCalls) return fn();

            return performanceMonitor.measureOperation(
                `api_${queryKey.join('_')}`,
                fn
            );
        },
        [trackApiCalls]
    );

    // Tracker la navigation
    useEffect(() => {
        if (!trackNavigation) return;

        const handleRouteChange = () => {
            performanceMonitor.mark(`${componentName}_navigation_start`);
        };

        const handleRouteComplete = () => {
            performanceMonitor.mark(`${componentName}_navigation_end`);
            performanceMonitor.measure(
                `${componentName}_navigation`,
                `${componentName}_navigation_start`,
                `${componentName}_navigation_end`
            );
        };

        // Écouter les changements de route (Next.js specific)
        if (typeof window !== 'undefined') {
            window.addEventListener('popstate', handleRouteChange);
            
            // Observer les changements de l'URL
            const observer = new MutationObserver(() => {
                handleRouteComplete();
            });

            observer.observe(document.querySelector('body')!, {
                childList: true,
                subtree: true,
            });

            return () => {
                window.removeEventListener('popstate', handleRouteChange);
                observer.disconnect();
            };
        }
    }, [componentName, trackNavigation]);

    // Hook pour mesurer le temps de chargement des données
    const measureDataLoading = useCallback(
        async <T,>(
            loadingName: string,
            loadFn: () => Promise<T>
        ): Promise<T> => {
            performanceMonitor.mark(`${componentName}_${loadingName}_start`);

            try {
                const result = await loadFn();

                performanceMonitor.mark(`${componentName}_${loadingName}_end`);
                performanceMonitor.measure(
                    `${componentName}_${loadingName}`,
                    `${componentName}_${loadingName}_start`,
                    `${componentName}_${loadingName}_end`
                );

                return result;
            } catch (error: unknown) {
                logger.error(`Data loading failed: ${loadingName}`, error instanceof Error ? error : new Error(String(error)));
                throw error;
            }
        },
        [componentName]
    );

    // Mesurer le temps jusqu'à l'interactivité
    useEffect(() => {
        renderStartTime.current = performance.now();

        // Marquer quand le composant devient interactif
        const markInteractive = () => {
            performanceMonitor.mark(`${componentName}_interactive`);
            performanceMonitor.measure(
                `${componentName}_time_to_interactive`,
                'navigationStart',
                `${componentName}_interactive`
            );
        };

        // Attendre que le composant soit monté et prêt
        if (document.readyState === 'complete') {
            markInteractive();
        } else {
            window.addEventListener('load', markInteractive);
            return () => window.removeEventListener('load', markInteractive);
        }
    }, [componentName]);

    return {
        trackInteraction,
        trackApiCall,
        measureDataLoading,
        // Exposer des méthodes utiles
        markStart: (name: string) =>
            performanceMonitor.mark(`${componentName}_${name}_start`),
        markEnd: (name: string) =>
            performanceMonitor.mark(`${componentName}_${name}_end`),
        measure: (name: string, startMark?: string, endMark?: string) =>
            performanceMonitor.measure(
                `${componentName}_${name}`,
                startMark || `${componentName}_${name}_start`,
                endMark || `${componentName}_${name}_end`
            ),
        sendMetric: (name: string, value: number, unit?: string) =>
            performanceMonitor.sendCustomMetric(
                `${componentName}_${name}`,
                value,
                unit
            ),
    };
};

// Hook spécialisé pour tracker les performances des formulaires
export const useFormPerformanceTracking = (formName: string) => {
    const { trackInteraction, sendMetric } = usePerformanceTracking(
        `form_${formName}`,
        {
            trackNavigation: false,
            trackRenders: true,
        }
    );

    const trackFieldValidation = useCallback(
        (fieldName: string, validationTime: number) => {
            sendMetric(`field_${fieldName}_validation`, validationTime);

            if (validationTime > 100) {
                logger.warn(
                    `Slow field validation: ${fieldName} took ${validationTime}ms`
                );
            }
        },
        [sendMetric]
    );

    const trackSubmit = useCallback(
        async <T,>(submitFn: () => Promise<T>): Promise<T> => {
            return trackInteraction('submit')(submitFn);
        },
        [trackInteraction]
    );

    return {
        trackFieldValidation,
        trackSubmit,
        trackInteraction,
    };
};

// Hook pour tracker les performances des listes/tableaux
export const useListPerformanceTracking = (listName: string) => {
    const { sendMetric, measureDataLoading } = usePerformanceTracking(
        `list_${listName}`,
        {
            trackNavigation: false,
        }
    );

    const trackScroll = useCallback(
        (scrollPosition: number, totalHeight: number) => {
            const scrollPercentage = (scrollPosition / totalHeight) * 100;
            sendMetric('scroll_percentage', scrollPercentage, '%');
        },
        [sendMetric]
    );

    const trackItemRender = useCallback(
        (itemCount: number, renderTime: number) => {
            sendMetric('items_rendered', itemCount, 'items');
            sendMetric('render_time', renderTime);
            
            const timePerItem = renderTime / itemCount;
            if (timePerItem > 10) {
                logger.warn(
                    `Slow list rendering: ${timePerItem.toFixed(2)}ms per item`
                );
            }
        },
        [sendMetric]
    );

    return {
        trackScroll,
        trackItemRender,
        measureDataLoading,
    };
};