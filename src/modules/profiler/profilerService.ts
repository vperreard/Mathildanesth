import { v4 as uuidv4 } from 'uuid';
import {
    MetricType,
    PerformanceMetric,
    MemoryMetric,
    ProfilingSession,
    ProfilerConfig,
    ProfilerReport,
    ProfilerReportOptions
} from './types';

// Configuration par défaut
const DEFAULT_CONFIG: ProfilerConfig = {
    enabled: process.env.NODE_ENV !== 'production',
    sampleRate: 1000, // 1 seconde entre chaque mesure mémoire
    maxSessionDuration: 5 * 60 * 1000, // 5 minutes maximum
    componentsToProfil: [
        'PlanningSimulator',
        'PlanningValidator',
        'DraggableCalendar',
        'SpecialtyManager',
        'AdminRequestsDashboard',
        'UserForm',
        'SurgeonForm'
    ]
};

/**
 * Service singleton pour le profilage des performances de l'application
 */
class ProfilerService {
    private static instance: ProfilerService;
    private currentSession: ProfilingSession | null = null;
    private config: ProfilerConfig = DEFAULT_CONFIG;
    private memoryIntervalId: NodeJS.Timeout | null = null;
    private sessionTimeoutId: NodeJS.Timeout | null = null;

    private constructor() {
        // Le constructeur est privé pour empêcher la création directe d'instances
    }

    /**
     * Obtenir l'instance unique du service de profilage
     */
    public static getInstance(): ProfilerService {
        if (!ProfilerService.instance) {
            ProfilerService.instance = new ProfilerService();
        }
        return ProfilerService.instance;
    }

    /**
     * Mettre à jour la configuration du profileur
     */
    public configure(config: Partial<ProfilerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Démarrer une nouvelle session de profilage
     */
    public startSession(): string | null {
        if (!this.config.enabled) return null;

        // Si une session est déjà en cours, l'arrêter
        if (this.currentSession) {
            this.stopSession();
        }

        const sessionId = uuidv4();
        this.currentSession = {
            id: sessionId,
            startTime: performance.now(),
            metrics: [],
            memoryMetrics: []
        };

        // Démarrer l'échantillonnage de mémoire
        this.startMemorySampling();

        // Configurer le timeout pour la session
        this.sessionTimeoutId = setTimeout(() => {
            this.stopSession();
        }, this.config.maxSessionDuration);

        return sessionId;
    }

    /**
     * Arrêter la session de profilage en cours
     */
    public stopSession(): ProfilingSession | null {
        if (!this.currentSession) return null;

        // Arrêter l'échantillonnage de mémoire
        this.stopMemorySampling();

        // Nettoyer le timeout de session
        if (this.sessionTimeoutId) {
            clearTimeout(this.sessionTimeoutId);
            this.sessionTimeoutId = null;
        }

        // Finaliser la session
        this.currentSession.endTime = performance.now();
        const session = { ...this.currentSession };
        this.currentSession = null;

        return session;
    }

    /**
     * Démarrer une mesure de performance
     */
    public startMetric(type: MetricType, name: string, metadata?: Record<string, any>): string | null {
        if (!this.config.enabled || !this.currentSession) return null;

        const metricId = uuidv4();
        const metric: PerformanceMetric = {
            id: metricId,
            type,
            name,
            startTime: performance.now(),
            metadata
        };

        this.currentSession.metrics.push(metric);
        return metricId;
    }

    /**
     * Terminer une mesure de performance
     */
    public endMetric(metricId: string): PerformanceMetric | null {
        if (!this.config.enabled || !this.currentSession) return null;

        const metricIndex = this.currentSession.metrics.findIndex(m => m.id === metricId);
        if (metricIndex === -1) return null;

        const endTime = performance.now();
        const metric = this.currentSession.metrics[metricIndex];

        metric.endTime = endTime;
        metric.duration = endTime - metric.startTime;

        return metric;
    }

    /**
     * Créer une fonction d'enveloppement pour mesurer le temps d'exécution
     */
    public wrapFunction<T extends (...args: any[]) => any>(
        func: T,
        type: MetricType,
        name: string,
        metadata?: Record<string, any>
    ): (...args: Parameters<T>) => ReturnType<T> {
        return (...args: Parameters<T>): ReturnType<T> => {
            if (!this.config.enabled || !this.currentSession) {
                return func(...args);
            }

            const metricId = this.startMetric(type, name, metadata);
            try {
                const result = func(...args);

                // Support pour les promesses
                if (result instanceof Promise) {
                    return result
                        .then(value => {
                            if (metricId) this.endMetric(metricId);
                            return value;
                        })
                        .catch(error => {
                            if (metricId) this.endMetric(metricId);
                            throw error;
                        }) as ReturnType<T>;
                }

                if (metricId) this.endMetric(metricId);
                return result;
            } catch (error) {
                if (metricId) this.endMetric(metricId);
                throw error;
            }
        };
    }

    /**
     * Démarrer l'échantillonnage de mémoire
     */
    private startMemorySampling(): void {
        if (typeof window === 'undefined' || !this.config.enabled || !this.currentSession) return;

        this.sampleMemory();

        this.memoryIntervalId = setInterval(() => {
            this.sampleMemory();
        }, this.config.sampleRate);
    }

    /**
     * Arrêter l'échantillonnage de mémoire
     */
    private stopMemorySampling(): void {
        if (this.memoryIntervalId) {
            clearInterval(this.memoryIntervalId);
            this.memoryIntervalId = null;
        }
    }

    /**
     * Prendre un échantillon de l'utilisation mémoire
     */
    private sampleMemory(): void {
        if (typeof window === 'undefined' || !this.currentSession) return;

        const memory = (performance as any).memory;
        if (!memory) return;

        const memoryMetric: MemoryMetric = {
            timestamp: performance.now(),
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            totalJSHeapSize: memory.totalJSHeapSize,
            usedJSHeapSize: memory.usedJSHeapSize,
            usagePercentage: memory.usedJSHeapSize / memory.jsHeapSizeLimit
        };

        this.currentSession.memoryMetrics.push(memoryMetric);
    }

    /**
     * Générer un rapport de profilage pour la session spécifiée
     */
    public generateReport(session: ProfilingSession, options: ProfilerReportOptions = {}): ProfilerReport {
        // Valeurs par défaut pour les options
        const opts = {
            groupBy: options.groupBy || 'type',
            sortBy: options.sortBy || 'duration',
            sortDirection: options.sortDirection || 'desc',
            limit: options.limit || 10,
            filterByType: options.filterByType || []
        };

        // Durée totale de la session
        const duration = (session.endTime || performance.now()) - session.startTime;

        // Filtrer les métriques terminées (avec une durée)
        const completedMetrics = session.metrics.filter(m => m.duration !== undefined);

        // Grouper les métriques par type
        const metricsByType: Record<string, PerformanceMetric[]> = {};
        completedMetrics.forEach(metric => {
            if (!metricsByType[metric.type]) {
                metricsByType[metric.type] = [];
            }
            metricsByType[metric.type].push(metric);
        });

        // Calculer les moyennes, min, max pour chaque type
        const averages: ProfilerReport['averages'] = {};
        Object.entries(metricsByType).forEach(([type, metrics]) => {
            const durations = metrics.map(m => m.duration as number);
            const total = durations.reduce((sum, duration) => sum + duration, 0);
            const count = durations.length;

            averages[type as MetricType] = {
                avgDuration: total / count,
                count,
                min: Math.min(...durations),
                max: Math.max(...durations)
            };
        });

        // Trier les métriques par durée (décroissante) et prendre les N premières
        const sortedMetrics = [...completedMetrics].sort((a, b) => {
            const aValue = a[opts.sortBy || 'duration'] as number;
            const bValue = b[opts.sortBy || 'duration'] as number;
            return opts.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        });

        const topDurations = sortedMetrics.slice(0, opts.limit);

        // Analyser les métriques de mémoire
        const memoryMetrics = session.memoryMetrics;
        const usageValues = memoryMetrics
            .map(m => m.usedJSHeapSize || 0)
            .filter(val => val > 0);

        const averageMemory = usageValues.length > 0
            ? usageValues.reduce((sum, val) => sum + val, 0) / usageValues.length
            : 0;

        const peakMemory = usageValues.length > 0
            ? Math.max(...usageValues)
            : 0;

        // Générer des recommandations basées sur l'analyse
        const recommendations = this.generateRecommendations(session, averages, peakMemory);

        // Construire le rapport final
        return {
            sessionId: session.id,
            duration,
            metricsCount: completedMetrics.length,
            averages,
            topDurations,
            memoryUsage: {
                average: averageMemory,
                peak: peakMemory,
                samples: memoryMetrics
            },
            recommendations
        };
    }

    /**
     * Générer des recommandations basées sur l'analyse des métriques
     */
    private generateRecommendations(
        session: ProfilingSession,
        averages: ProfilerReport['averages'],
        peakMemory: number
    ): string[] {
        const recommendations: string[] = [];

        // Analyser les temps d'évaluation des règles
        const ruleEval = averages[MetricType.RULE_EVALUATION];
        const ruleEvalCached = averages[MetricType.RULE_EVALUATION_CACHED];

        if (ruleEval && ruleEvalCached) {
            const cacheSpeedup = ruleEval.avgDuration / ruleEvalCached.avgDuration;

            if (cacheSpeedup > 10) {
                recommendations.push(
                    `Le cache des règles est très efficace (x${cacheSpeedup.toFixed(1)}). Augmenter la durée de vie du cache pourrait améliorer les performances.`
                );
            } else if (cacheSpeedup < 2) {
                recommendations.push(
                    `Le cache des règles n'apporte pas un gain significatif (x${cacheSpeedup.toFixed(1)}). Vérifier son implémentation ou optimiser l'évaluation des règles.`
                );
            }

            if (ruleEval.avgDuration > 100) {
                recommendations.push(
                    `L'évaluation des règles sans cache est lente (${ruleEval.avgDuration.toFixed(2)}ms). Optimiser les algorithmes d'évaluation.`
                );
            }
        }

        // Analyser les temps de rendu des composants
        const componentRenders = session.metrics.filter(
            m => m.type === MetricType.COMPONENT_RENDER && m.duration !== undefined
        );

        const slowComponents = componentRenders
            .filter(m => (m.duration as number) > 50)
            .map(m => m.name);

        const uniqueSlowComponents = Array.from(new Set(slowComponents));

        if (uniqueSlowComponents.length > 0) {
            recommendations.push(
                `Composants avec un temps de rendu élevé: ${uniqueSlowComponents.join(', ')}. Envisager d'optimiser avec memo, useMemo ou useCallback.`
            );
        }

        // Analyser la consommation mémoire
        const jsHeapLimit = session.memoryMetrics[0]?.jsHeapSizeLimit || 0;

        if (peakMemory > 0 && jsHeapLimit > 0 && (peakMemory / jsHeapLimit) > 0.8) {
            recommendations.push(
                `Utilisation mémoire élevée (${((peakMemory / jsHeapLimit) * 100).toFixed(1)}% du maximum). Rechercher les fuites mémoire potentielles.`
            );
        }

        return recommendations;
    }

    /**
     * Accéder à la session courante
     */
    public getCurrentSession(): ProfilingSession | null {
        return this.currentSession;
    }
}

// Exporter une instance unique du service
export const profilerService = ProfilerService.getInstance();

// Fonction utilitaire pour mesurer une fonction unique
export function profileFunction<T extends (...args: any[]) => any>(
    func: T,
    type: MetricType,
    name: string,
    metadata?: Record<string, any>
): (...args: Parameters<T>) => ReturnType<T> {
    return profilerService.wrapFunction(func, type, name, metadata);
} 