/**
 * Types pour le module de profilage de performance
 */

// Types de mesures disponibles
export enum MetricType {
    RULE_EVALUATION = 'rule_evaluation',
    RULE_EVALUATION_CACHED = 'rule_evaluation_cached',
    COMPONENT_RENDER = 'component_render',
    MEMORY_USAGE = 'memory_usage',
    API_CALL = 'api_call',
    DATABASE_QUERY = 'database_query',
}

// Structure d'une métrique de performance
export interface PerformanceMetric {
    id: string;
    type: MetricType;
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: Record<string, unknown>;
}

// Structure d'une mesure de mémoire
export interface MemoryMetric {
    timestamp: number;
    jsHeapSizeLimit?: number;
    totalJSHeapSize?: number;
    usedJSHeapSize?: number;
    usagePercentage?: number;
}

// Structure d'une session de profilage
export interface ProfilingSession {
    id: string;
    startTime: number;
    endTime?: number;
    metrics: PerformanceMetric[];
    memoryMetrics: MemoryMetric[];
}

// Configuration du profileur
export interface ProfilerConfig {
    enabled: boolean;
    sampleRate: number; // Fréquence d'échantillonnage en ms pour les métriques de mémoire
    maxSessionDuration: number; // Durée maximale d'une session en ms
    componentsToProfil: string[]; // Liste des noms de composants à profiler
}

// Options pour le rapport de profilage
export interface ProfilerReportOptions {
    groupBy?: 'type' | 'name';
    sortBy?: 'duration' | 'count' | 'startTime';
    sortDirection?: 'asc' | 'desc';
    limit?: number;
    filterByType?: MetricType[];
}

// Structure du rapport de profilage
export interface ProfilerReport {
    sessionId: string;
    duration: number;
    metricsCount: number;
    averages: {
        [key in MetricType]?: {
            avgDuration: number;
            count: number;
            min: number;
            max: number;
        };
    };
    topDurations: PerformanceMetric[];
    memoryUsage: {
        average: number;
        peak: number;
        samples: MemoryMetric[];
    };
    recommendations: string[];
} 