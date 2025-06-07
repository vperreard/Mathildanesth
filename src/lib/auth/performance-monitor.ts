import { logger } from '@/lib/logger';

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  details?: Record<string, any>;
}

class AuthPerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000;
  private operationCounts = new Map<string, number>();
  private operationDurations = new Map<string, number[]>();

  async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    details?: Record<string, any>
  ): Promise<T> {
    const start = performance.now();
    let success = true;
    
    try {
      const result = await fn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - start;
      this.recordMetric({
        operation,
        duration,
        timestamp: Date.now(),
        success,
        details
      });
    }
  }

  measureSync<T>(
    operation: string,
    fn: () => T,
    details?: Record<string, any>
  ): T {
    const start = performance.now();
    let success = true;
    
    try {
      const result = fn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - start;
      this.recordMetric({
        operation,
        duration,
        timestamp: Date.now(),
        success,
        details
      });
    }
  }

  private recordMetric(metric: PerformanceMetric) {
    // Add to metrics array (with size limit)
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Update operation counts
    const count = this.operationCounts.get(metric.operation) || 0;
    this.operationCounts.set(metric.operation, count + 1);

    // Update operation durations
    const durations = this.operationDurations.get(metric.operation) || [];
    durations.push(metric.duration);
    if (durations.length > 100) {
      durations.shift();
    }
    this.operationDurations.set(metric.operation, durations);

    // Log slow operations
    if (metric.duration > 1000) {
      logger.warn(`Slow auth operation: ${metric.operation}`, {
        duration: metric.duration,
        details: metric.details
      });
    }
  }

  getStats(operation?: string) {
    if (operation) {
      const durations = this.operationDurations.get(operation) || [];
      if (durations.length === 0) {
        return null;
      }

      const sorted = [...durations].sort((a, b) => a - b);
      return {
        operation,
        count: this.operationCounts.get(operation) || 0,
        avg: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      };
    }

    // Return stats for all operations
    const allStats: Record<string, any> = {};
    for (const [op] of this.operationCounts) {
      allStats[op] = this.getStats(op);
    }
    return allStats;
  }

  getRecentMetrics(limit = 100): PerformanceMetric[] {
    return this.metrics.slice(-limit);
  }

  reset() {
    this.metrics = [];
    this.operationCounts.clear();
    this.operationDurations.clear();
  }

  // Helper to identify bottlenecks
  getBottlenecks(threshold = 500): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.duration > threshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
  }

  // Generate performance report
  generateReport() {
    const stats = this.getStats();
    const bottlenecks = this.getBottlenecks();
    
    return {
      timestamp: new Date().toISOString(),
      totalOperations: this.metrics.length,
      operationStats: stats,
      bottlenecks: bottlenecks.map(b => ({
        operation: b.operation,
        duration: b.duration,
        timestamp: new Date(b.timestamp).toISOString(),
        details: b.details
      })),
      recommendations: this.generateRecommendations(stats, bottlenecks)
    };
  }

  private generateRecommendations(stats: any, bottlenecks: PerformanceMetric[]) {
    const recommendations = [];

    // Check for slow JWT operations
    if (stats.verifyToken?.avg > 100) {
      recommendations.push('Consider caching JWT verification results');
    }

    // Check for slow bcrypt operations
    if (stats.bcryptCompare?.avg > 300) {
      recommendations.push('Consider using argon2 or reducing bcrypt rounds');
    }

    // Check for slow database queries
    if (stats.findUser?.avg > 200) {
      recommendations.push('Add database indexes for user lookups');
    }

    // Check for cache misses
    const cacheMissRate = (stats.cacheMiss?.count || 0) / 
      ((stats.cacheHit?.count || 0) + (stats.cacheMiss?.count || 0));
    if (cacheMissRate > 0.5) {
      recommendations.push('Increase cache TTL or implement cache warming');
    }

    return recommendations;
  }
}

// Export singleton instance
export const authPerformanceMonitor = new AuthPerformanceMonitor();