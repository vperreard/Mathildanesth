/**
 * Module de Monitoring Baseline - Mathildanesth
 * 
 * Fonctionnalités :
 * - Tracking des temps de chargement pages critiques
 * - Monitoring des API responses times
 * - Métriques Core Web Vitals
 * - Alertes automatiques sur dégradation
 */

import React from 'react';
import { Analytics } from '@vercel/analytics/react';

export interface PerformanceMetric {
    name: string;
    value: number;
    unit: 'ms' | 'bytes' | 'score';
    timestamp: number;
    context?: Record<string, any>;
}

export interface AlertThreshold {
    metric: string;
    warningThreshold: number;
    criticalThreshold: number;
    enabled: boolean;
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private alerts: AlertThreshold[] = [
        {
            metric: 'page_load_time',
            warningThreshold: 2000, // 2 secondes
            criticalThreshold: 5000, // 5 secondes
            enabled: true
        },
        {
            metric: 'api_response_time',
            warningThreshold: 200, // 200ms
            criticalThreshold: 500, // 500ms
            enabled: true
        },
        {
            metric: 'first_contentful_paint',
            warningThreshold: 1800,
            criticalThreshold: 3000,
            enabled: true
        },
        {
            metric: 'largest_contentful_paint',
            warningThreshold: 2500,
            criticalThreshold: 4000,
            enabled: true
        },
        {
            metric: 'cumulative_layout_shift',
            warningThreshold: 0.1,
            criticalThreshold: 0.25,
            enabled: true
        }
    ];

    /**
     * Enregistre une métrique de performance
     */
    recordMetric(name: string, value: number, unit: 'ms' | 'bytes' | 'score', context?: Record<string, any>) {
        const metric: PerformanceMetric = {
            name,
            value,
            unit,
            timestamp: Date.now(),
            context
        };

        this.metrics.push(metric);

        // Nettoyage automatique : garder seulement les 1000 dernières métriques
        if (this.metrics.length > 1000) {
            this.metrics = this.metrics.slice(-1000);
        }

        // Vérification des seuils d'alerte
        this.checkAlerts(metric);

        // Envoi vers Vercel Analytics si disponible
        this.sendToAnalytics(metric);

        return metric;
    }

    /**
     * Mesure le temps de chargement d'une page
     */
    measurePageLoad(pageName: string): () => void {
        const startTime = performance.now();

        return () => {
            const loadTime = performance.now() - startTime;
            this.recordMetric('page_load_time', loadTime, 'ms', {
                page: pageName,
                url: window.location.pathname
            });
        };
    }

    /**
     * Mesure le temps de réponse d'une API
     */
    measureApiCall(endpoint: string, method: string = 'GET'): () => void {
        const startTime = performance.now();

        return () => {
            const responseTime = performance.now() - startTime;
            this.recordMetric('api_response_time', responseTime, 'ms', {
                endpoint,
                method,
                timestamp: new Date().toISOString()
            });
        };
    }

    /**
     * Collecte automatique des Core Web Vitals
     */
    collectWebVitals() {
        if (typeof window === 'undefined') return;

        // First Contentful Paint
        const observer = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    this.recordMetric('first_contentful_paint', entry.startTime, 'ms');
                }
            }
        });
        observer.observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.recordMetric('largest_contentful_paint', lastEntry.startTime, 'ms');
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                // Type assertion pour les propriétés spécifiques aux layout-shift
                const layoutShiftEntry = entry as any;
                if (!layoutShiftEntry.hadRecentInput) {
                    clsValue += layoutShiftEntry.value;
                }
            }
            this.recordMetric('cumulative_layout_shift', clsValue, 'score');
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                // Type assertion pour les propriétés spécifiques aux first-input
                const firstInputEntry = entry as any;
                const fid = firstInputEntry.processingStart - firstInputEntry.startTime;
                this.recordMetric('first_input_delay', fid, 'ms');
            }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
    }

    /**
     * Vérification des seuils d'alerte
     */
    private checkAlerts(metric: PerformanceMetric) {
        const alert = this.alerts.find(a => a.metric === metric.name && a.enabled);
        if (!alert) return;

        let severity: 'warning' | 'critical' | null = null;

        if (metric.value >= alert.criticalThreshold) {
            severity = 'critical';
        } else if (metric.value >= alert.warningThreshold) {
            severity = 'warning';
        }

        if (severity) {
            this.triggerAlert(metric, severity, alert);
        }
    }

    /**
     * Déclenchement d'une alerte
     */
    private triggerAlert(metric: PerformanceMetric, severity: 'warning' | 'critical', threshold: AlertThreshold) {
        const alertData = {
            metric: metric.name,
            value: metric.value,
            unit: metric.unit,
            severity,
            threshold: severity === 'critical' ? threshold.criticalThreshold : threshold.warningThreshold,
            context: metric.context,
            timestamp: metric.timestamp
        };

        // Log dans la console en développement
        if (process.env.NODE_ENV === 'development') {
            console.warn(`🚨 Performance Alert [${severity.toUpperCase()}]:`, alertData);
        }

        // En production, on pourrait envoyer vers un service de monitoring
        if (process.env.NODE_ENV === 'production') {
            this.sendAlertToService(alertData);
        }
    }

    /**
     * Envoi vers service d'alerte externe
     */
    private async sendAlertToService(alertData: any) {
        try {
            // Exemple d'envoi vers une API de monitoring
            // await fetch('/api/monitoring/alerts', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(alertData)
            // });

            console.info('Alert sent to monitoring service:', alertData);
        } catch (error) {
            console.error('Failed to send alert:', error);
        }
    }

    /**
     * Envoi vers Vercel Analytics
     */
    private sendToAnalytics(metric: PerformanceMetric) {
        try {
            // Utilisation de Vercel Analytics pour tracker les métriques custom
            if (typeof window !== 'undefined' && (window as any).va) {
                (window as any).va('track', `performance_${metric.name}`, {
                    value: metric.value,
                    unit: metric.unit,
                    ...metric.context
                });
            }
        } catch (error) {
            console.debug('Analytics tracking failed:', error);
        }
    }

    /**
     * Récupération des métriques récentes
     */
    getRecentMetrics(metricName?: string, limit: number = 50): PerformanceMetric[] {
        let filtered = this.metrics;

        if (metricName) {
            filtered = this.metrics.filter(m => m.name === metricName);
        }

        return filtered
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    /**
     * Calcul de statistiques sur une métrique
     */
    getMetricStats(metricName: string, timeWindow: number = 3600000): {
        average: number;
        min: number;
        max: number;
        count: number;
        p95: number;
    } {
        const now = Date.now();
        const windowStart = now - timeWindow;

        const metrics = this.metrics
            .filter(m => m.name === metricName && m.timestamp >= windowStart)
            .map(m => m.value)
            .sort((a, b) => a - b);

        if (metrics.length === 0) {
            return { average: 0, min: 0, max: 0, count: 0, p95: 0 };
        }

        const sum = metrics.reduce((acc, val) => acc + val, 0);
        const p95Index = Math.floor(metrics.length * 0.95);

        return {
            average: sum / metrics.length,
            min: metrics[0],
            max: metrics[metrics.length - 1],
            count: metrics.length,
            p95: metrics[p95Index] || metrics[metrics.length - 1]
        };
    }

    /**
     * Export des données pour rapport
     */
    exportData(): {
        metrics: PerformanceMetric[];
        alerts: AlertThreshold[];
        summary: Record<string, any>;
    } {
        const summary: Record<string, any> = {};

        // Calcul des résumés par métrique
        const metricNames = [...new Set(this.metrics.map(m => m.name))];
        metricNames.forEach(name => {
            summary[name] = this.getMetricStats(name);
        });

        return {
            metrics: this.metrics,
            alerts: this.alerts,
            summary
        };
    }

    /**
     * Reset des métriques (utile pour les tests)
     */
    reset() {
        this.metrics = [];
    }
}

// Instance singleton
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook React pour monitoring simple
 */
export function usePerformanceMonitoring(pageName: string) {
    React.useEffect(() => {
        const stopMeasuring = performanceMonitor.measurePageLoad(pageName);

        // Démarrage de la collecte des Web Vitals
        performanceMonitor.collectWebVitals();

        return stopMeasuring;
    }, [pageName]);
}

/**
 * Wrapper pour les appels API avec monitoring
 */
export async function monitoredFetch(
    url: string,
    options?: RequestInit
): Promise<Response> {
    const stopMeasuring = performanceMonitor.measureApiCall(url, options?.method);

    try {
        const response = await fetch(url, options);
        stopMeasuring();

        // Enregistrement du statut de réponse
        performanceMonitor.recordMetric('api_status', response.status, 'score', {
            url,
            method: options?.method || 'GET',
            ok: response.ok
        });

        return response;
    } catch (error) {
        stopMeasuring();

        // Enregistrement de l'erreur
        performanceMonitor.recordMetric('api_error', 1, 'score', {
            url,
            method: options?.method || 'GET',
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        throw error;
    }
}

/**
 * Composant Analytics pour Next.js
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    return (
        <React.Fragment>
            {children}
            <Analytics />
        </React.Fragment>
    );
}

// Auto-start monitoring si dans un browser
if (typeof window !== 'undefined') {
    performanceMonitor.collectWebVitals();
} 