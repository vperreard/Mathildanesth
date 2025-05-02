import { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
    renderTime: number;
    interactionDelay: number;
    scrollPerformance: number;
}

interface CalendarPerformanceOptions {
    measureRenderTime?: boolean;
    measureInteractions?: boolean;
    optimizeForMobile?: boolean;
    debug?: boolean;
}

/**
 * Hook personnalisé pour optimiser et mesurer les performances du calendrier
 * Permet de détecter et résoudre les problèmes de performance, notamment sur mobile (bug #301)
 */
export const useCalendarPerformance = (options: CalendarPerformanceOptions = {}) => {
    const {
        measureRenderTime = true,
        measureInteractions = true,
        optimizeForMobile = true,
        debug = false
    } = options;

    // Référence pour stocker les timestamps des rendus
    const renderTimeRef = useRef<number>(0);
    const interactionTimeRef = useRef<number>(0);

    // État pour les métriques de performance
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        renderTime: 0,
        interactionDelay: 0,
        scrollPerformance: 0
    });

    // État pour les optimisations
    const [optimizations, setOptimizations] = useState({
        reducedAnimations: false,
        simplifiedRendering: false,
        lazyLoading: false,
        reduceEventDetails: false
    });

    // Détecter si l'appareil est mobile
    const isMobile = useRef<boolean>(
        typeof window !== 'undefined' &&
        (window.innerWidth < 768 ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    );

    // Fonction pour mesurer le temps de rendu
    const measureRender = useCallback(() => {
        if (!measureRenderTime) return;

        renderTimeRef.current = performance.now();

        return () => {
            const renderDuration = performance.now() - renderTimeRef.current;
            setMetrics(prev => ({ ...prev, renderTime: renderDuration }));

            if (debug) {
                console.log(`Calendar render time: ${renderDuration.toFixed(2)}ms`);
            }
        };
    }, [measureRenderTime, debug]);

    // Fonction pour mesurer le délai d'interaction
    const startInteractionMeasure = useCallback(() => {
        if (!measureInteractions) return;

        interactionTimeRef.current = performance.now();
    }, [measureInteractions]);

    const endInteractionMeasure = useCallback(() => {
        if (!measureInteractions || interactionTimeRef.current === 0) return;

        const interactionDelay = performance.now() - interactionTimeRef.current;
        setMetrics(prev => ({ ...prev, interactionDelay }));

        if (debug) {
            console.log(`Calendar interaction delay: ${interactionDelay.toFixed(2)}ms`);
        }

        interactionTimeRef.current = 0;
    }, [measureInteractions, debug]);

    // Appliquer des optimisations basées sur les métriques et le type d'appareil
    useEffect(() => {
        if (!optimizeForMobile) return;

        // Optimisations pour les appareils mobiles
        if (isMobile.current) {
            // Appliquer des optimisations spécifiques pour mobile
            const newOptimizations = {
                reducedAnimations: true,
                simplifiedRendering: metrics.renderTime > 50, // Si le rendu est lent
                lazyLoading: true,
                reduceEventDetails: metrics.renderTime > 100 // Si le rendu est très lent
            };

            setOptimizations(newOptimizations);

            if (debug) {
                console.log('Applied mobile optimizations:', newOptimizations);
            }

            // Appliquer des classes CSS pour les optimisations
            document.documentElement.classList.toggle('calendar-reduced-animations', newOptimizations.reducedAnimations);
            document.documentElement.classList.toggle('calendar-simplified-rendering', newOptimizations.simplifiedRendering);
        }
    }, [metrics.renderTime, optimizeForMobile, debug]);

    // Surveillance des problèmes de performance
    useEffect(() => {
        if (!debug) return;

        // Alerter en cas de problèmes de performance significatifs
        if (metrics.renderTime > 200) {
            console.warn('Calendar render time is high, consider further optimizations');
        }

        if (metrics.interactionDelay > 100) {
            console.warn('Calendar interaction delay is high, check for blocking operations');
        }
    }, [metrics, debug]);

    return {
        metrics,
        optimizations,
        isMobile: isMobile.current,
        measureRender,
        startInteractionMeasure,
        endInteractionMeasure
    };
};

export default useCalendarPerformance; 