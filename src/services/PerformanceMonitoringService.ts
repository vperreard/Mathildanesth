import { logger } from "../lib/logger";

/**
 * Service de monitoring de performance pour l'application
 * Suit les métriques clés et génère des alertes si nécessaire
 * Enhanced with Core Web Vitals and comprehensive monitoring
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface CoreWebVitals {
  LCP: number | null; // Largest Contentful Paint
  FID: number | null; // First Input Delay  
  CLS: number | null; // Cumulative Layout Shift
  FCP: number | null; // First Contentful Paint
  TTFB: number | null; // Time to First Byte
}

interface PerformanceThresholds {
  LCP: number; // Should be < 2.5s
  FID: number; // Should be < 100ms
  CLS: number; // Should be < 0.1
  FCP: number; // Should be < 1.8s
  TTFB: number; // Should be < 800ms
  apiResponse: number; // Should be < 500ms
  pageLoad: number; // Should be < 3s
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
  private observers: Map<string, PerformanceObserver> = new Map();
  private coreWebVitals: CoreWebVitals = {
    LCP: null,
    FID: null,
    CLS: null,
    FCP: null,
    TTFB: null
  };
  private thresholds: PerformanceThresholds = {
    LCP: 2500,
    FID: 100,
    CLS: 0.1,
    FCP: 1800,
    TTFB: 800,
    apiResponse: 500,
    pageLoad: 3000
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeCoreWebVitals();
    }
  }

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
      logger.warn(`No active measure found for ${name}`);
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
      logger.warn(`🐌 Slow operation detected: ${name} took ${metric.duration.toFixed(2)}ms`);
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
        logger.warn(
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
      await fetch('http://localhost:3000/api/monitoring/metrics', {
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
      logger.error('Failed to send performance alert:', error);
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
   * Initialize Core Web Vitals monitoring
   */
  private initializeCoreWebVitals(): void {
    try {
      // LCP Observer
      if (PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.coreWebVitals.LCP = lastEntry.startTime;
          this.checkCoreWebVitalThreshold('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      }

      // FCP Observer
      if (PerformanceObserver.supportedEntryTypes.includes('paint')) {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.coreWebVitals.FCP = entry.startTime;
              this.checkCoreWebVitalThreshold('FCP', entry.startTime);
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('fcp', fcpObserver);
      }

      // FID Observer
      if (PerformanceObserver.supportedEntryTypes.includes('first-input')) {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            const fid = entry.processingStart - entry.startTime;
            this.coreWebVitals.FID = fid;
            this.checkCoreWebVitalThreshold('FID', fid);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      }

      // CLS Observer
      if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
        let cumulativeLayoutShift = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              cumulativeLayoutShift += entry.value;
            }
          });
          this.coreWebVitals.CLS = cumulativeLayoutShift;
          this.checkCoreWebVitalThreshold('CLS', cumulativeLayoutShift);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      }

      // Navigation Observer for TTFB
      if (PerformanceObserver.supportedEntryTypes.includes('navigation')) {
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              const ttfb = navEntry.responseStart - navEntry.requestStart;
              this.coreWebVitals.TTFB = ttfb;
              this.checkCoreWebVitalThreshold('TTFB', ttfb);
            }
          });
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navObserver);
      }
    } catch (error) {
      logger.warn('Some Core Web Vitals observers not supported:', error);
    }
  }

  /**
   * Check Core Web Vital thresholds
   */
  private checkCoreWebVitalThreshold(metric: keyof CoreWebVitals, value: number): void {
    const threshold = this.thresholds[metric as keyof PerformanceThresholds];
    if (threshold && value > threshold) {
      logger.warn(`🚨 Core Web Vital threshold exceeded: ${metric} = ${value.toFixed(2)}ms (threshold: ${threshold}ms)`);
      this.sendAlert(`core-web-vital-${metric}`, value, threshold);
    }
  }

  /**
   * Get Core Web Vitals
   */
  getCoreWebVitals(): CoreWebVitals {
    return { ...this.coreWebVitals };
  }

  /**
   * Get performance score based on Core Web Vitals
   */
  getPerformanceScore(): number {
    let score = 100;
    const vitals = this.getCoreWebVitals();
    
    // Deduct points for each vital that exceeds threshold
    if (vitals.LCP && vitals.LCP > this.thresholds.LCP) {
      score -= 20;
    }
    if (vitals.FID && vitals.FID > this.thresholds.FID) {
      score -= 15;
    }
    if (vitals.CLS && vitals.CLS > this.thresholds.CLS) {
      score -= 15;
    }
    if (vitals.FCP && vitals.FCP > this.thresholds.FCP) {
      score -= 10;
    }
    if (vitals.TTFB && vitals.TTFB > this.thresholds.TTFB) {
      score -= 10;
    }
    
    return Math.max(0, score);
  }

  /**
   * Generate comprehensive performance report
   */
  generateCoreWebVitalsReport(): string {
    const vitals = this.getCoreWebVitals();
    const score = this.getPerformanceScore();
    
    let report = `Core Web Vitals Report (Score: ${score}/100)\n`;
    report += `==========================================\n\n`;
    
    Object.entries(vitals).forEach(([key, value]) => {
      if (value !== null) {
        const threshold = this.thresholds[key as keyof PerformanceThresholds];
        const status = threshold && value > threshold ? '❌ FAIL' : '✅ PASS';
        report += `${key}: ${value.toFixed(2)}ms ${status}\n`;
      }
    });
    
    return report;
  }

  /**
   * Cleanup observers
   */
  destroyObservers(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  /**
   * Export les métriques pour analyse
   */
  exportMetrics(): string {
    const report = this.generateReport();
    const coreWebVitalsReport = this.generateCoreWebVitalsReport();
    const stats: Record<string, any> = {};

    for (const [name] of this.metrics.entries()) {
      stats[name] = this.getStats(name);
    }

    return JSON.stringify({
      report,
      coreWebVitalsReport,
      coreWebVitals: this.getCoreWebVitals(),
      performanceScore: this.getPerformanceScore(),
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