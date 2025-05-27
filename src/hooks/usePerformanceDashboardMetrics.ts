import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  threshold?: number;
  description?: string;
  icon?: React.ReactNode;
  history?: Array<{ timestamp: string; value: number }>;
}

interface PerformanceAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  resolved?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

interface UsePerformanceMetricsReturn {
  metrics: PerformanceMetric[];
  alerts: PerformanceAlert[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePerformanceMetrics(): UsePerformanceMetricsReturn {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/monitoring/metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch performance metrics');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (data) {
      // Transform API data to metrics format
      const transformedMetrics: PerformanceMetric[] = [
        {
          name: 'Temps de réponse API',
          value: data.apiResponseTime || 120,
          unit: 'ms',
          trend: data.apiTrend || 'stable',
          status: data.apiResponseTime > 500 ? 'critical' : data.apiResponseTime > 200 ? 'warning' : 'good',
          threshold: 500,
          description: 'Temps de réponse moyen des API',
        },
        {
          name: 'CPU Usage',
          value: data.cpuUsage || 45,
          unit: '%',
          trend: data.cpuTrend || 'up',
          status: data.cpuUsage > 80 ? 'critical' : data.cpuUsage > 60 ? 'warning' : 'good',
          threshold: 100,
        },
        {
          name: 'Memory Usage',
          value: data.memoryUsage || 62,
          unit: '%',
          trend: data.memoryTrend || 'stable',
          status: data.memoryUsage > 85 ? 'critical' : data.memoryUsage > 70 ? 'warning' : 'good',
          threshold: 100,
        },
        {
          name: 'DB Connections',
          value: data.dbConnections || 42,
          unit: '',
          trend: 'stable',
          status: data.dbConnections > 80 ? 'critical' : data.dbConnections > 60 ? 'warning' : 'good',
          threshold: 100,
        },
        {
          name: 'Cache Hit Rate',
          value: data.cacheHitRate || 94,
          unit: '%',
          trend: 'up',
          status: data.cacheHitRate < 80 ? 'warning' : 'good',
          threshold: 100,
        },
        {
          name: 'Active Users',
          value: data.activeUsers || 127,
          unit: '',
          trend: 'up',
          status: 'good',
        },
        {
          name: 'Error Rate',
          value: data.errorRate || 0.5,
          unit: '%',
          trend: data.errorRate > 1 ? 'up' : 'down',
          status: data.errorRate > 5 ? 'critical' : data.errorRate > 2 ? 'warning' : 'good',
          threshold: 5,
        },
        {
          name: 'Request Queue',
          value: data.requestQueue || 12,
          unit: '',
          trend: 'stable',
          status: data.requestQueue > 100 ? 'critical' : data.requestQueue > 50 ? 'warning' : 'good',
          threshold: 100,
        },
      ];

      setMetrics(transformedMetrics);

      // Generate alerts based on metrics
      const newAlerts: PerformanceAlert[] = [];
      
      if (data.apiResponseTime > 500) {
        newAlerts.push({
          id: 'api-slow',
          type: 'error',
          title: 'API Lenteur Critique',
          message: `Le temps de réponse API est de ${data.apiResponseTime}ms (seuil: 500ms)`,
          timestamp: new Date(),
          actions: [
            {
              label: 'Analyser',
              action: () => console.log('Analyzing slow API...'),
            },
          ],
        });
      }

      if (data.cpuUsage > 80) {
        newAlerts.push({
          id: 'cpu-high',
          type: 'warning',
          title: 'CPU Élevé',
          message: `L'utilisation CPU est à ${data.cpuUsage}%`,
          timestamp: new Date(),
        });
      }

      if (data.errorRate > 2) {
        newAlerts.push({
          id: 'error-rate',
          type: 'error',
          title: 'Taux d\'erreur élevé',
          message: `Le taux d'erreur est de ${data.errorRate}% (seuil: 2%)`,
          timestamp: new Date(),
          actions: [
            {
              label: 'Voir les logs',
              action: () => window.open('/admin/logs', '_blank'),
            },
          ],
        });
      }

      setAlerts(newAlerts);
    }
  }, [data]);

  // Mock data for development
  useEffect(() => {
    if (!data && !isLoading && !error) {
      const mockMetrics: PerformanceMetric[] = [
        {
          name: 'Temps de réponse API',
          value: 120,
          unit: 'ms',
          trend: 'stable',
          status: 'good',
          threshold: 500,
          description: 'Temps de réponse moyen des API',
          history: Array.from({ length: 24 }, (_, i) => ({
            timestamp: new Date(Date.now() - i * 3600000).toISOString(),
            value: 100 + Math.random() * 50,
          })).reverse(),
        },
        {
          name: 'CPU Usage',
          value: 45,
          unit: '%',
          trend: 'up',
          status: 'good',
          threshold: 100,
        },
        {
          name: 'Memory Usage',
          value: 62,
          unit: '%',
          trend: 'stable',
          status: 'warning',
          threshold: 100,
        },
        {
          name: 'DB Connections',
          value: 42,
          unit: '',
          trend: 'stable',
          status: 'good',
          threshold: 100,
        },
        {
          name: 'Cache Hit Rate',
          value: 94,
          unit: '%',
          trend: 'up',
          status: 'good',
          threshold: 100,
        },
        {
          name: 'Active Users',
          value: 127,
          unit: '',
          trend: 'up',
          status: 'good',
        },
        {
          name: 'Disk Usage',
          value: 38,
          unit: '%',
          trend: 'stable',
          status: 'good',
          threshold: 100,
        },
        {
          name: 'Network',
          value: 12,
          unit: 'Mbps',
          trend: 'stable',
          status: 'good',
        },
      ];

      const mockAlerts: PerformanceAlert[] = [
        {
          id: '1',
          type: 'warning',
          title: 'Mémoire élevée détectée',
          message: 'L\'utilisation de la mémoire approche 70%. Considérez l\'optimisation des requêtes.',
          timestamp: new Date(Date.now() - 600000),
          actions: [
            {
              label: 'Optimiser',
              action: () => console.log('Optimizing memory...'),
            },
          ],
        },
      ];

      setMetrics(mockMetrics);
      setAlerts(mockAlerts);
    }
  }, [data, isLoading, error]);

  return {
    metrics,
    alerts,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}