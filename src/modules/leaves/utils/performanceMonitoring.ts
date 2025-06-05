import { logger } from "../../../lib/logger";

/**
 * Utilitaire de suivi des performances pour le module de congés
 * Permet de tracer et d'analyser les performances des fonctionnalités critiques
 */

/**
 * Métrique de performance
 */
export interface PerformanceMetric {
    name: string;                // Nom de la fonction ou du processus
    lastDuration: number;        // Dernière durée d'exécution (ms)
    minDuration: number;         // Durée minimale d'exécution (ms)
    maxDuration: number;         // Durée maximale d'exécution (ms)
    averageDuration: number;     // Durée moyenne d'exécution (ms)
    totalDuration: number;       // Durée totale cumulée (ms)
    calls: number;               // Nombre total d'appels
    timestamps: number[];        // Horodatages des derniers appels
}

/**
 * Statistiques de cache
 */
export interface CacheStatistics {
    name: string;               // Nom du cache
    hits: number;               // Nombre de succès du cache
    misses: number;             // Nombre d'échecs du cache
    hitRatio: number;           // Taux de succès (hits / (hits + misses))
    size: number;               // Taille actuelle du cache
    maxSize: number;            // Taille maximale du cache
    evictions: number;          // Nombre d'évictions du cache
}

/**
 * Options de suivi des performances
 */
export interface PerformanceTrackerOptions {
    maxMetricsHistory: number;    // Nombre maximum d'entrées d'historique à conserver
    enableLogging: boolean;       // Activer la journalisation des mesures dans la console
    sampleRate: number;           // Taux d'échantillonnage (1 = toutes les mesures, 0.1 = 10% des mesures)
}

// Valeurs par défaut des options
const DEFAULT_OPTIONS: PerformanceTrackerOptions = {
    maxMetricsHistory: 100,
    enableLogging: false,
    sampleRate: 1.0
};

/**
 * Classe de suivi des performances
 */
export class PerformanceTracker {
    private static instance: PerformanceTracker;
    private metrics: Map<string, PerformanceMetric> = new Map();
    private cacheStats: Map<string, CacheStatistics> = new Map();
    private options: PerformanceTrackerOptions;
    private startTimes: Map<string, number> = new Map();

    /**
     * Récupérer l'instance du tracker (Singleton)
     */
    public static getInstance(options?: Partial<PerformanceTrackerOptions>): PerformanceTracker {
        if (!PerformanceTracker.instance) {
            PerformanceTracker.instance = new PerformanceTracker(options);
        } else if (options) {
            PerformanceTracker.instance.updateOptions(options);
        }
        return PerformanceTracker.instance;
    }

    /**
     * Constructeur privé (Singleton)
     */
    private constructor(options?: Partial<PerformanceTrackerOptions>) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Mettre à jour les options
     */
    public updateOptions(options: Partial<PerformanceTrackerOptions>): void {
        this.options = { ...this.options, ...options };
    }

    /**
     * Démarrer la mesure d'une fonction
     */
    public startMeasure(name: string): void {
        if (Math.random() > this.options.sampleRate) {
            return; // Échantillonnage - ignorer certaines mesures
        }

        this.startTimes.set(name, performance.now());

        if (this.options.enableLogging) {
            logger.debug(`[Performance] Starting measure: ${name}`);
        }
    }

    /**
     * Terminer la mesure d'une fonction et enregistrer les résultats
     */
    public endMeasure(name: string): number {
        const startTime = this.startTimes.get(name);
        if (!startTime) {
            logger.warn(`[Performance] No start time found for measure: ${name}`);
            return 0;
        }

        const duration = performance.now() - startTime;
        this.startTimes.delete(name);

        this.recordMetric(name, duration);

        if (this.options.enableLogging) {
            logger.debug(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
        }

        return duration;
    }

    /**
     * Enregistrer une métrique de performance
     */
    private recordMetric(name: string, duration: number): void {
        let metric = this.metrics.get(name);

        if (!metric) {
            metric = {
                name,
                lastDuration: duration,
                minDuration: duration,
                maxDuration: duration,
                averageDuration: duration,
                totalDuration: duration,
                calls: 1,
                timestamps: [Date.now()]
            };
        } else {
            metric.lastDuration = duration;
            metric.minDuration = Math.min(metric.minDuration, duration);
            metric.maxDuration = Math.max(metric.maxDuration, duration);
            metric.totalDuration += duration;
            metric.calls += 1;
            metric.averageDuration = metric.totalDuration / metric.calls;

            // Ajouter l'horodatage actuel à l'historique
            metric.timestamps.push(Date.now());

            // Limiter la taille de l'historique
            if (metric.timestamps.length > this.options.maxMetricsHistory) {
                metric.timestamps = metric.timestamps.slice(-this.options.maxMetricsHistory);
            }
        }

        this.metrics.set(name, metric);
    }

    /**
     * Mesurer la durée d'exécution d'une fonction
     */
    public measure<T>(name: string, fn: () => T): T {
        this.startMeasure(name);
        try {
            return fn();
        } finally {
            this.endMeasure(name);
        }
    }

    /**
     * Mesurer la durée d'exécution d'une fonction asynchrone
     */
    public async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
        this.startMeasure(name);
        try {
            return await fn();
        } finally {
            this.endMeasure(name);
        }
    }

    /**
     * Enregistrer les statistiques d'un cache
     */
    public recordCacheStats(
        name: string,
        stats: { hits: number; misses: number; size: number; maxSize: number; evictions: number }
    ): void {
        const hitRatio = stats.hits + stats.misses > 0
            ? stats.hits / (stats.hits + stats.misses)
            : 0;

        this.cacheStats.set(name, {
            name,
            hits: stats.hits,
            misses: stats.misses,
            hitRatio,
            size: stats.size,
            maxSize: stats.maxSize,
            evictions: stats.evictions
        });
    }

    /**
     * Obtenir toutes les métriques
     */
    public getMetrics(): PerformanceMetric[] {
        return Array.from(this.metrics.values());
    }

    /**
     * Obtenir toutes les statistiques de cache
     */
    public getCacheStats(): CacheStatistics[] {
        return Array.from(this.cacheStats.values());
    }

    /**
     * Obtenir une métrique spécifique
     */
    public getMetric(name: string): PerformanceMetric | undefined {
        return this.metrics.get(name);
    }

    /**
     * Générer un rapport de performance détaillé
     */
    public generateReport(): {
        metrics: PerformanceMetric[];
        cacheStats: CacheStatistics[];
        summary: {
            totalFunctionsCalled: number;
            slowestFunction: { name: string; duration: number } | null;
            fastestFunction: { name: string; duration: number } | null;
            mostCalledFunction: { name: string; calls: number } | null;
            bestCachePerformance: { name: string; hitRatio: number } | null;
            worstCachePerformance: { name: string; hitRatio: number } | null;
            totalCalls: number;
            averageDuration: number;
        }
    } {
        const metrics = this.getMetrics();
        const cacheStats = this.getCacheStats();

        // Calculer les statistiques agrégées
        let slowestFunction = null;
        let fastestFunction = null;
        let mostCalledFunction = null;
        let totalCalls = 0;
        let totalDuration = 0;

        for (const metric of metrics) {
            totalCalls += metric.calls;
            totalDuration += metric.totalDuration;

            if (!slowestFunction || metric.maxDuration > slowestFunction.duration) {
                slowestFunction = { name: metric.name, duration: metric.maxDuration };
            }

            if (!fastestFunction || metric.minDuration < fastestFunction.duration) {
                fastestFunction = { name: metric.name, duration: metric.minDuration };
            }

            if (!mostCalledFunction || metric.calls > mostCalledFunction.calls) {
                mostCalledFunction = { name: metric.name, calls: metric.calls };
            }
        }

        // Statistiques des caches
        let bestCachePerformance = null;
        let worstCachePerformance = null;

        for (const stat of cacheStats) {
            if (stat.hits + stat.misses > 10) { // Seuil minimum pour éviter les statistiques non significatives
                if (!bestCachePerformance || stat.hitRatio > bestCachePerformance.hitRatio) {
                    bestCachePerformance = { name: stat.name, hitRatio: stat.hitRatio };
                }

                if (!worstCachePerformance || stat.hitRatio < worstCachePerformance.hitRatio) {
                    worstCachePerformance = { name: stat.name, hitRatio: stat.hitRatio };
                }
            }
        }

        return {
            metrics,
            cacheStats,
            summary: {
                totalFunctionsCalled: metrics.length,
                slowestFunction,
                fastestFunction,
                mostCalledFunction,
                bestCachePerformance,
                worstCachePerformance,
                totalCalls,
                averageDuration: totalCalls > 0 ? totalDuration / totalCalls : 0
            }
        };
    }

    /**
     * Réinitialiser toutes les métriques
     */
    public reset(): void {
        this.metrics.clear();
        this.cacheStats.clear();
        this.startTimes.clear();
    }
}

/**
 * Décorateur pour mesurer les performances d'une méthode
 */
export function measurePerformance(options?: { name?: string }) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;
        const metricName = options?.name || `${target.constructor.name}.${propertyKey}`;

        descriptor.value = function (...args: any[]) {
            const tracker = PerformanceTracker.getInstance();
            tracker.startMeasure(metricName);

            try {
                const result = originalMethod.apply(this, args);

                // Gestion des promesses
                if (result instanceof Promise) {
                    return result.finally(() => {
                        tracker.endMeasure(metricName);
                    });
                }

                tracker.endMeasure(metricName);
                return result;
            } catch (error) {
                tracker.endMeasure(metricName);
                throw error;
            }
        };

        return descriptor;
    };
}

// Exporter l'instance singleton
export const performanceTracker = PerformanceTracker.getInstance(); 