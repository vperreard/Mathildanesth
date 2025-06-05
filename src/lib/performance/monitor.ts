import { logger } from "../logger";

/**
 * Service de monitoring de performance simple
 * Remplace l'ancien PerformanceMonitoringService
 */

interface PerformanceMeasure {
    id: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: Record<string, any>;
}

class PerformanceMonitor {
    private measures: Map<string, PerformanceMeasure> = new Map();
    private enabled: boolean = process.env.NODE_ENV === 'development';

    /**
     * Démarre une mesure de performance
     */
    startMeasure(id: string, metadata?: Record<string, any>): string {
        if (!this.enabled) return id;

        const measure: PerformanceMeasure = {
            id,
            startTime: performance.now(),
            metadata
        };

        this.measures.set(id, measure);
        return id;
    }

    /**
     * Termine une mesure et retourne la durée en ms
     */
    endMeasure(id: string): number {
        if (!this.enabled) return 0;

        const measure = this.measures.get(id);
        if (!measure) {
            logger.warn(`Performance measure '${id}' not found`);
            return 0;
        }

        measure.endTime = performance.now();
        measure.duration = measure.endTime - measure.startTime;

        // Log en développement
        if (process.env.NODE_ENV === 'development') {
            logger.info(`⏱️ [Performance] ${id}: ${measure.duration.toFixed(2)}ms`, measure.metadata);
        }

        // Nettoyer après 1 minute
        setTimeout(() => this.measures.delete(id), 60000);

        return measure.duration;
    }

    /**
     * Mesure une fonction async
     */
    async measureAsync<T>(
        id: string,
        fn: () => Promise<T>,
        metadata?: Record<string, any>
    ): Promise<T> {
        const measureId = this.startMeasure(id, metadata);
        try {
            const result = await fn();
            this.endMeasure(measureId);
            return result;
        } catch (error) {
            this.endMeasure(measureId);
            throw error;
        }
    }

    /**
     * Obtient toutes les mesures actives
     */
    getActiveMeasures(): PerformanceMeasure[] {
        return Array.from(this.measures.values());
    }

    /**
     * Obtient les statistiques de performance
     */
    getStats(): {
        totalMeasures: number;
        activeMeasures: number;
        averageDuration: number;
    } {
        const allMeasures = Array.from(this.measures.values());
        const completedMeasures = allMeasures.filter(m => m.duration !== undefined);
        
        return {
            totalMeasures: allMeasures.length,
            activeMeasures: allMeasures.filter(m => !m.endTime).length,
            averageDuration: completedMeasures.length > 0
                ? completedMeasures.reduce((sum, m) => sum + (m.duration || 0), 0) / completedMeasures.length
                : 0
        };
    }

    /**
     * Réinitialise toutes les mesures
     */
    clear(): void {
        this.measures.clear();
    }
}

// Export singleton
export const performanceMonitor = new PerformanceMonitor();

// Export pour compatibilité avec l'ancien code
export default performanceMonitor;