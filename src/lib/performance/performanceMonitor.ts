import { logger } from '@/lib/logger';

interface PerformanceMetrics {
    // Core Web Vitals
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
    fcp?: number; // First Contentful Paint
    ttfb?: number; // Time to First Byte
    inp?: number; // Interaction to Next Paint
    
    // Custom metrics
    apiResponseTime?: number;
    cacheHitRate?: number;
    errorRate?: number;
    memoryUsage?: number;
    
    // Navigation
    navigationTiming?: {
        domContentLoaded: number;
        loadComplete: number;
        redirectTime: number;
        dnsTime: number;
        connectionTime: number;
        requestTime: number;
        responseTime: number;
    };
}

interface PerformanceThresholds {
    lcp: { good: number; needsImprovement: number }; // milliseconds
    fid: { good: number; needsImprovement: number }; // milliseconds
    cls: { good: number; needsImprovement: number }; // score
    fcp: { good: number; needsImprovement: number }; // milliseconds
    ttfb: { good: number; needsImprovement: number }; // milliseconds
    inp: { good: number; needsImprovement: number }; // milliseconds
    apiResponseTime: { good: number; needsImprovement: number }; // milliseconds
}

export class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: PerformanceMetrics = {};
    private observers: Map<string, PerformanceObserver> = new Map();
    private alertCallbacks: Array<(metric: string, value: number) => void> = [];
    
    private thresholds: PerformanceThresholds = {
        lcp: { good: 2500, needsImprovement: 4000 },
        fid: { good: 100, needsImprovement: 300 },
        cls: { good: 0.1, needsImprovement: 0.25 },
        fcp: { good: 1800, needsImprovement: 3000 },
        ttfb: { good: 800, needsImprovement: 1800 },
        inp: { good: 200, needsImprovement: 500 },
        apiResponseTime: { good: 500, needsImprovement: 1000 },
    };

    private constructor() {
        if (typeof window !== 'undefined') {
            this.initializeObservers();
            this.trackNavigationTiming();
        }
    }

    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    private initializeObservers(): void {
        // Observer pour LCP
        try {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1] as any;
                this.updateMetric('lcp', lastEntry.renderTime || lastEntry.loadTime);
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.set('lcp', lcpObserver);
        } catch (e: unknown) {
            logger.warn('LCP observer not supported');
        }

        // Observer pour FID
        try {
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry: unknown) => {
                    if (entry.name === 'first-input') {
                        this.updateMetric('fid', entry.processingStart - entry.startTime);
                    }
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });
            this.observers.set('fid', fidObserver);
        } catch (e: unknown) {
            logger.warn('FID observer not supported');
        }

        // Observer pour CLS
        try {
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry: unknown) => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        this.updateMetric('cls', clsValue);
                    }
                });
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
            this.observers.set('cls', clsObserver);
        } catch (e: unknown) {
            logger.warn('CLS observer not supported');
        }

        // Observer pour FCP
        try {
            const fcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    if (entry.name === 'first-contentful-paint') {
                        this.updateMetric('fcp', entry.startTime);
                    }
                });
            });
            fcpObserver.observe({ entryTypes: ['paint'] });
            this.observers.set('fcp', fcpObserver);
        } catch (e: unknown) {
            logger.warn('FCP observer not supported');
        }

        // Observer pour INP (Interaction to Next Paint)
        try {
            const inpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry: unknown) => {
                    if (entry.interactionId) {
                        const inputDelay = entry.processingStart - entry.startTime;
                        const processingTime = entry.processingEnd - entry.processingStart;
                        const presentationDelay = entry.startTime + entry.duration - entry.processingEnd;
                        const inp = inputDelay + processingTime + presentationDelay;
                        this.updateMetric('inp', inp);
                    }
                });
            });
            inpObserver.observe({ entryTypes: ['event'] });
            this.observers.set('inp', inpObserver);
        } catch (e: unknown) {
            logger.warn('INP observer not supported');
        }
    }

    private trackNavigationTiming(): void {
        if (typeof window !== 'undefined' && window.performance && window.performance.timing) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const timing = window.performance.timing;
                    const navigationTiming = {
                        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                        loadComplete: timing.loadEventEnd - timing.navigationStart,
                        redirectTime: timing.redirectEnd - timing.redirectStart,
                        dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
                        connectionTime: timing.connectEnd - timing.connectStart,
                        requestTime: timing.responseStart - timing.requestStart,
                        responseTime: timing.responseEnd - timing.responseStart,
                    };
                    
                    this.metrics.navigationTiming = navigationTiming;
                    this.updateMetric('ttfb', timing.responseStart - timing.fetchStart);
                    
                    logger.info('Navigation timing collected', navigationTiming);
                }, 0);
            });
        }
    }

    private updateMetric(metric: keyof PerformanceMetrics, value: number): void {
        this.metrics[metric] = value;
        
        // Vérifier les seuils et déclencher des alertes si nécessaire
        this.checkThresholds(metric, value);
        
        // Log la métrique
        logger.debug(`Performance metric updated: ${metric} = ${value}`);
    }

    private checkThresholds(metric: string, value: number): void {
        const threshold = this.thresholds[metric as keyof PerformanceThresholds];
        if (!threshold) return;

        let status: 'good' | 'needs-improvement' | 'poor';
        
        if (value <= threshold.good) {
            status = 'good';
        } else if (value <= threshold.needsImprovement) {
            status = 'needs-improvement';
        } else {
            status = 'poor';
            
            // Déclencher les callbacks d'alerte
            this.alertCallbacks.forEach(callback => {
                callback(metric, value);
            });
            
            logger.warn(`Performance degradation detected: ${metric} = ${value} (status: ${status})`);
        }
    }

    // API publique
    
    /**
     * Obtenir toutes les métriques collectées
     */
    getMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }

    /**
     * Obtenir une métrique spécifique
     */
    getMetric(metric: keyof PerformanceMetrics): number | undefined {
        return this.metrics[metric];
    }

    /**
     * Enregistrer un callback d'alerte pour les performances dégradées
     */
    onPerformanceDegradation(callback: (metric: string, value: number) => void): void {
        this.alertCallbacks.push(callback);
    }

    /**
     * Mesurer le temps d'une opération
     */
    async measureOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
        const startTime = performance.now();
        try {
            const result = await operation();
            const duration = performance.now() - startTime;
            
            logger.debug(`Operation '${name}' completed in ${duration.toFixed(2)}ms`);
            
            // Envoyer la métrique personnalisée
            this.sendCustomMetric(name, duration);
            
            return result;
        } catch (error: unknown) {
            const duration = performance.now() - startTime;
            logger.error(`Operation '${name}' failed after ${duration.toFixed(2)}ms`, error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Marquer un point dans le temps
     */
    mark(name: string): void {
        if (typeof window !== 'undefined' && window.performance) {
            window.performance.mark(name);
        }
    }

    /**
     * Mesurer entre deux marks
     */
    measure(name: string, startMark: string, endMark?: string): void {
        if (typeof window !== 'undefined' && window.performance) {
            try {
                window.performance.measure(name, startMark, endMark);
                const measures = window.performance.getEntriesByName(name, 'measure');
                if (measures.length > 0) {
                    const duration = measures[measures.length - 1].duration;
                    this.sendCustomMetric(name, duration);
                }
            } catch (error: unknown) {
                logger.error('Failed to measure performance', error instanceof Error ? error : new Error(String(error)));
            }
        }
    }

    /**
     * Envoyer une métrique personnalisée
     */
    sendCustomMetric(name: string, value: number, unit: string = 'ms'): void {
        logger.info(`Custom metric: ${name} = ${value}${unit}`);
        
        // Ici, vous pourriez envoyer la métrique à un service de monitoring externe
        // comme Google Analytics, Sentry, DataDog, etc.
        
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'timing_complete', {
                name: name,
                value: Math.round(value),
                event_category: 'Performance',
            });
        }
    }

    /**
     * Obtenir un rapport de performance
     */
    generateReport(): {
        metrics: PerformanceMetrics;
        status: Record<string, 'good' | 'needs-improvement' | 'poor' | 'unknown'>;
        recommendations: string[];
    } {
        const status: Record<string, 'good' | 'needs-improvement' | 'poor' | 'unknown'> = {};
        const recommendations: string[] = [];

        // Évaluer chaque métrique
        Object.entries(this.metrics).forEach(([key, value]) => {
            if (typeof value === 'number') {
                const threshold = this.thresholds[key as keyof PerformanceThresholds];
                if (threshold) {
                    if (value <= threshold.good) {
                        status[key] = 'good';
                    } else if (value <= threshold.needsImprovement) {
                        status[key] = 'needs-improvement';
                        recommendations.push(this.getRecommendation(key, value));
                    } else {
                        status[key] = 'poor';
                        recommendations.push(this.getRecommendation(key, value));
                    }
                } else {
                    status[key] = 'unknown';
                }
            }
        });

        return {
            metrics: this.metrics,
            status,
            recommendations: [...new Set(recommendations)], // Enlever les doublons
        };
    }

    private getRecommendation(metric: string, value: number): string {
        const recommendations: Record<string, string> = {
            lcp: 'Optimisez le chargement des ressources critiques et utilisez le lazy loading pour les images',
            fid: 'Réduisez le JavaScript bloquant et utilisez le code splitting',
            cls: 'Définissez des dimensions explicites pour les images et évitez les insertions de contenu dynamique',
            fcp: 'Optimisez le chemin critique de rendu et réduisez le CSS bloquant',
            ttfb: 'Améliorez la performance du serveur et utilisez un CDN',
            inp: 'Optimisez les gestionnaires d\'événements et évitez les tâches longues',
            apiResponseTime: 'Optimisez les requêtes API et utilisez la mise en cache',
        };

        return recommendations[metric] || `Optimisez la métrique ${metric} (valeur actuelle: ${value})`;
    }

    /**
     * Nettoyer les observers
     */
    cleanup(): void {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        this.alertCallbacks = [];
    }
}

// Export d'une instance singleton
export const performanceMonitor = PerformanceMonitor.getInstance();