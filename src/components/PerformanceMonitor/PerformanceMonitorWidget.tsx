'use client';

import React, { useEffect, useState } from 'react';
import { performanceMonitor } from '@/lib/performance/performanceMonitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricDisplay {
    name: string;
    value: number | undefined;
    unit: string;
    status: 'good' | 'needs-improvement' | 'poor' | 'unknown';
    threshold: { good: number; needsImprovement: number };
}

export const PerformanceMonitorWidget: React.FC<{
    className?: string;
    compact?: boolean;
}> = ({ className, compact = false }) => {
    const [metrics, setMetrics] = useState<MetricDisplay[]>([]);
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [isVisible, setIsVisible] = useState(!compact);

    useEffect(() => {
        const updateMetrics = () => {
            const report = performanceMonitor.generateReport();

            const metricDisplays: MetricDisplay[] = [
                {
                    name: 'LCP',
                    value: report.metrics.lcp,
                    unit: 'ms',
                    status: report.status.lcp || 'unknown',
                    threshold: { good: 2500, needsImprovement: 4000 }
                },
                {
                    name: 'FID',
                    value: report.metrics.fid,
                    unit: 'ms',
                    status: report.status.fid || 'unknown',
                    threshold: { good: 100, needsImprovement: 300 }
                },
                {
                    name: 'CLS',
                    value: report.metrics.cls,
                    unit: '',
                    status: report.status.cls || 'unknown',
                    threshold: { good: 0.1, needsImprovement: 0.25 }
                },
                {
                    name: 'FCP',
                    value: report.metrics.fcp,
                    unit: 'ms',
                    status: report.status.fcp || 'unknown',
                    threshold: { good: 1800, needsImprovement: 3000 }
                },
                {
                    name: 'TTFB',
                    value: report.metrics.ttfb,
                    unit: 'ms',
                    status: report.status.ttfb || 'unknown',
                    threshold: { good: 800, needsImprovement: 1800 }
                },
                {
                    name: 'INP',
                    value: report.metrics.inp,
                    unit: 'ms',
                    status: report.status.inp || 'unknown',
                    threshold: { good: 200, needsImprovement: 500 }
                },
            ];

            setMetrics(metricDisplays);
            setRecommendations(report.recommendations);
        };

        // Mise à jour initiale
        updateMetrics();

        // Mise à jour périodique
        const interval = setInterval(updateMetrics, 5000);

        // Écouter les alertes de performance
        performanceMonitor.onPerformanceDegradation((metric, value) => {
            console.warn(`Performance alert: ${metric} = ${value}`);
        });

        return () => clearInterval(interval);
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'good':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'needs-improvement':
                return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'poor':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Activity className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'good':
                return 'text-green-600';
            case 'needs-improvement':
                return 'text-yellow-600';
            case 'poor':
                return 'text-red-600';
            default:
                return 'text-gray-400';
        }
    };

    const getProgressValue = (metric: MetricDisplay) => {
        if (!metric.value) return 0;
        const { good, needsImprovement } = metric.threshold;
        const maxValue = needsImprovement * 1.5;
        return Math.min((metric.value / maxValue) * 100, 100);
    };

    const getProgressColor = (status: string) => {
        switch (status) {
            case 'good':
                return 'bg-green-500';
            case 'needs-improvement':
                return 'bg-yellow-500';
            case 'poor':
                return 'bg-red-500';
            default:
                return 'bg-gray-300';
        }
    };

    if (compact) {
        const overallStatus = metrics.some(m => m.status === 'poor') ? 'poor' :
            metrics.some(m => m.status === 'needs-improvement') ? 'needs-improvement' :
                'good';

        return (
            <button
                onClick={() => setIsVisible(!isVisible)}
                className={cn(
                    "fixed bottom-4 right-4 p-3 rounded-full shadow-lg transition-colors",
                    overallStatus === 'good' && "bg-green-100 hover:bg-green-200",
                    overallStatus === 'needs-improvement' && "bg-yellow-100 hover:bg-yellow-200",
                    overallStatus === 'poor' && "bg-red-100 hover:bg-red-200",
                    className
                )}
                title="Performance Monitor"
            >
                {getStatusIcon(overallStatus)}
            </button>
        );
    }

    return (
        <Card className={cn("w-full max-w-4xl", className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Performance Monitor
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {metrics.map((metric) => (
                        <div key={metric.name} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{metric.name}</span>
                                {getStatusIcon(metric.status)}
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-baseline gap-1">
                                    <span className={cn("text-2xl font-bold", getStatusColor(metric.status))}>
                                        {metric.value !== undefined ?
                                            (metric.unit === '' ? metric.value.toFixed(3) : Math.round(metric.value)) :
                                            '-'
                                        }
                                    </span>
                                    {metric.unit && <span className="text-sm text-muted-foreground">{metric.unit}</span>}
                                </div>
                                <Progress
                                    value={getProgressValue(metric)}
                                    className={cn("h-2", getProgressColor(metric.status))}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Good: ≤{metric.threshold.good}{metric.unit}</span>
                                    <span>Poor: &gt;{metric.threshold.needsImprovement}{metric.unit}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {recommendations.length > 0 && (
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-1">
                                <div className="font-medium">Recommandations d'optimisation:</div>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    {recommendations.map((rec, index) => (
                                        <li key={index}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

// Hook pour utiliser le monitoring dans d'autres composants
export const usePerformanceMetric = (metricName: keyof ReturnType<typeof performanceMonitor.getMetrics>) => {
    const [value, setValue] = useState<number | undefined>();

    useEffect(() => {
        const updateValue = () => {
            const metrics = performanceMonitor.getMetrics();
            setValue(metrics[metricName] as number | undefined);
        };

        updateValue();
        const interval = setInterval(updateValue, 1000);

        return () => clearInterval(interval);
    }, [metricName]);

    return value;
};