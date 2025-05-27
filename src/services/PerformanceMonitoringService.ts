/**
 * Service de monitoring de performance pour l'application
 * Suit les métriques clés et génère des alertes si nécessaire
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  averageResponseTime: number;
  slowestOperations: PerformanceMetric[];
  timestamp: Date;
}

class PerformanceMonitoringService {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private alertThreshold = 2000; // 2 secondes
  private degradationThreshold = 1.2; // 20% de dégradation
  private baseline: Map<string, number> = new Map();

  /**
   * Démarre une mesure de performance
   */
  startMeasure(name: string, metadata?: Record<string, any>): string {
    const id = `${name}_${Date.now()}_${Math.random()}`;
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };

    // Utiliser performance.mark() pour les devtools
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${name}-start`);
    }

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);

    return id;
  }

  /**
   * Termine une mesure de performance
   */
  endMeasure(name: string): number {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      console.warn(`No active measure found for ${name}`);
      return 0;
    }

    const metric = metrics[metrics.length - 1];
    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Utiliser performance.mark() et performance.measure()
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }

    // Vérifier les seuils
    this.checkThresholds(name, metric.duration);

    // Logger si l'opération est lente
    if (metric.duration > this.alertThreshold) {
      console.warn(`🐌 Slow operation detected: ${name} took ${metric.duration.toFixed(2)}ms`);
    }

    return metric.duration;
  }

  /**
   * Mesure une fonction asynchrone
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<{ result: T; duration: number }> {
    this.startMeasure(name, metadata);
    try {
      const result = await fn();
      const duration = this.endMeasure(name);
      return { result, duration };
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }

  /**
   * Mesure une fonction synchrone
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): { result: T; duration: number } {
    this.startMeasure(name, metadata);
    try {
      const result = fn();
      const duration = this.endMeasure(name);
      return { result, duration };
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }

  /**
   * Vérifie les seuils de performance
   */
  private checkThresholds(name: string, duration: number): void {
    const baseline = this.baseline.get(name);
    
    if (baseline) {
      const degradation = duration / baseline;
      if (degradation > this.degradationThreshold) {
        console.warn(
          `⚠️ Performance degradation detected for ${name}: ` +
          `${((degradation - 1) * 100).toFixed(1)}% slower than baseline`
        );
        this.sendAlert(name, duration, baseline);
      }
    }
  }

  /**
   * Définit une baseline pour une opération
   */
  setBaseline(name: string, duration: number): void {
    this.baseline.set(name, duration);
  }

  /**
   * Obtient les métriques pour une opération
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Calcule les statistiques pour une opération
   */
  getStats(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const metrics = this.getMetrics(name).filter(m => m.duration !== undefined);
    if (metrics.length === 0) return null;

    const durations = metrics.map(m => m.duration!).sort((a, b) => a - b);
    const sum = durations.reduce((acc, d) => acc + d, 0);
    const p95Index = Math.floor(durations.length * 0.95);

    return {
      count: durations.length,
      average: sum / durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      p95: durations[p95Index] || durations[durations.length - 1]
    };
  }

  /**
   * Génère un rapport de performance
   */
  generateReport(): PerformanceReport {
    const allMetrics: PerformanceMetric[] = [];
    
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics.filter(m => m.duration !== undefined));
    }

    const sortedByDuration = [...allMetrics].sort((a, b) => (b.duration || 0) - (a.duration || 0));
    const totalDuration = allMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);

    return {
      metrics: allMetrics,
      averageResponseTime: allMetrics.length > 0 ? totalDuration / allMetrics.length : 0,
      slowestOperations: sortedByDuration.slice(0, 10),
      timestamp: new Date()
    };
  }

  /**
   * Envoie une alerte de performance
   */
  private async sendAlert(name: string, duration: number, baseline: number): Promise<void> {
    try {
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'performance_degradation',
          operation: name,
          duration,
          baseline,
          degradation: ((duration / baseline - 1) * 100).toFixed(1),
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to send performance alert:', error);
    }
  }

  /**
   * Nettoie les métriques anciennes
   */
  cleanup(olderThanMinutes = 60): void {
    const cutoff = Date.now() - olderThanMinutes * 60 * 1000;
    
    for (const [name, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(m => m.startTime > cutoff);
      if (filtered.length === 0) {
        this.metrics.delete(name);
      } else {
        this.metrics.set(name, filtered);
      }
    }
  }

  /**
   * Export les métriques pour analyse
   */
  exportMetrics(): string {
    const report = this.generateReport();
    const stats: Record<string, any> = {};

    for (const [name] of this.metrics.entries()) {
      stats[name] = this.getStats(name);
    }

    return JSON.stringify({
      report,
      stats,
      baseline: Object.fromEntries(this.baseline)
    }, null, 2);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitoringService();

// Hook React pour utiliser le monitoring
export function usePerformanceMonitor() {
  return {
    startMeasure: performanceMonitor.startMeasure.bind(performanceMonitor),
    endMeasure: performanceMonitor.endMeasure.bind(performanceMonitor),
    measureAsync: performanceMonitor.measureAsync.bind(performanceMonitor),
    measureSync: performanceMonitor.measureSync.bind(performanceMonitor),
    getStats: performanceMonitor.getStats.bind(performanceMonitor),
    generateReport: performanceMonitor.generateReport.bind(performanceMonitor)
  };
}