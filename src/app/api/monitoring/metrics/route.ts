import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { prisma } from '@/lib/prisma';
import { performanceMonitor } from '@/lib/monitoring';
import { performanceMonitor as serviceMonitor } from '@/services/PerformanceMonitoringService';


// Stockage en mémoire des métriques (à remplacer par Redis en production)
const metricsStore: any[] = [];
const MAX_METRICS = 10000;

export async function POST(req: NextRequest) {
  try {
    // Authentification optionnelle pour les métriques internes
    const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    let userId = null;
    
    if (authToken) {
      const authResult = await verifyAuthToken(authToken);
      if (authResult.authenticated) {
        userId = authResult.userId;
      }
    }

    const metric = await req.json();
    
    // Ajouter les métadonnées
    const enrichedMetric = {
      ...metric,
      userId,
      userAgent: req.headers.get('user-agent'),
      clientIp: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      receivedAt: new Date().toISOString()
    };

    // Stocker la métrique
    metricsStore.push(enrichedMetric);
    
    // Limiter la taille du store
    if (metricsStore.length > MAX_METRICS) {
      metricsStore.splice(0, metricsStore.length - MAX_METRICS);
    }

    // Si c'est une dégradation de performance critique, logger dans la DB
    if (metric.type === 'performance_degradation' && metric.degradation > 50) {
      await prisma.auditLog.create({
        data: {
          action: 'PERFORMANCE_ALERT',
          entityType: 'system',
          entityId: metric.operation,
          userId,
          details: JSON.stringify(metric)
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing metric:', error);
    return NextResponse.json(
      { error: 'Failed to store metric' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check if request is for dashboard metrics (no auth required for basic metrics)
    const { searchParams } = req.nextUrl;
    const isDashboard = searchParams.get('dashboard') === 'true';
    
    if (isDashboard) {
      // Return dashboard metrics without authentication
      return getDashboardMetrics();
    }
    
    // Authentification requise pour consulter les métriques détaillées
    const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const authResult = await verifyAuthToken(authToken);
    if (!authResult.authenticated || authResult.role !== 'ADMIN_TOTAL') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const type = searchParams.get('type');
    const operation = searchParams.get('operation');
    const last = parseInt(searchParams.get('last') || '100');

    // Filtrer les métriques
    let filtered = metricsStore;
    
    if (type) {
      filtered = filtered.filter(m => m.type === type);
    }
    
    if (operation) {
      filtered = filtered.filter(m => m.operation === operation);
    }

    // Retourner les dernières métriques
    const results = filtered.slice(-last);

    // Calculer les statistiques
    const stats = {
      total: filtered.length,
      byType: {} as Record<string, number>,
      byOperation: {} as Record<string, number>,
      averageDuration: 0,
      slowestOperations: [] as any[]
    };

    // Grouper par type
    filtered.forEach(m => {
      if (m.type) {
        stats.byType[m.type] = (stats.byType[m.type] || 0) + 1;
      }
      if (m.operation) {
        stats.byOperation[m.operation] = (stats.byOperation[m.operation] || 0) + 1;
      }
    });

    // Calculer la durée moyenne et les opérations les plus lentes
    const durations = filtered
      .filter(m => m.duration)
      .map(m => ({ operation: m.operation, duration: m.duration }));
    
    if (durations.length > 0) {
      stats.averageDuration = durations.reduce((sum, d) => sum + d.duration, 0) / durations.length;
      stats.slowestOperations = durations
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10);
    }

    return NextResponse.json({
      metrics: results,
      stats
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

// Helper function to get dashboard metrics
function getDashboardMetrics() {
  try {
    // Collect metrics from monitoring service
    const monitoringStats = performanceMonitor.exportData();
    const serviceReport = serviceMonitor.generateReport();

    // Calculate metrics with trend and status
    const metrics: Array<{
      name: string;
      value: number;
      unit: string;
      trend: 'up' | 'down' | 'stable';
      status: 'good' | 'warning' | 'critical';
    }> = [];

    // Page Load Time
    const pageLoadStats = performanceMonitor.getMetricStats('page_load_time', 3600000); // Last hour
    metrics.push({
      name: 'Page Load Time',
      value: Math.round(pageLoadStats.average),
      unit: 'ms',
      trend: pageLoadStats.average > 2000 ? 'up' : 'stable',
      status: pageLoadStats.average > 5000 ? 'critical' : pageLoadStats.average > 2000 ? 'warning' : 'good'
    });

    // API Response Time
    const apiStats = performanceMonitor.getMetricStats('api_response_time', 3600000);
    metrics.push({
      name: 'API Response Time',
      value: Math.round(apiStats.average),
      unit: 'ms',
      trend: apiStats.average > 200 ? 'up' : 'stable',
      status: apiStats.average > 500 ? 'critical' : apiStats.average > 200 ? 'warning' : 'good'
    });

    // First Contentful Paint
    const fcpStats = performanceMonitor.getMetricStats('first_contentful_paint', 3600000);
    metrics.push({
      name: 'First Contentful Paint',
      value: Math.round(fcpStats.average),
      unit: 'ms',
      trend: fcpStats.average > 1800 ? 'up' : 'stable',
      status: fcpStats.average > 3000 ? 'critical' : fcpStats.average > 1800 ? 'warning' : 'good'
    });

    // Largest Contentful Paint
    const lcpStats = performanceMonitor.getMetricStats('largest_contentful_paint', 3600000);
    metrics.push({
      name: 'Largest Contentful Paint',
      value: Math.round(lcpStats.average),
      unit: 'ms',
      trend: lcpStats.average > 2500 ? 'up' : 'stable',
      status: lcpStats.average > 4000 ? 'critical' : lcpStats.average > 2500 ? 'warning' : 'good'
    });

    // Cumulative Layout Shift
    const clsStats = performanceMonitor.getMetricStats('cumulative_layout_shift', 3600000);
    metrics.push({
      name: 'Cumulative Layout Shift',
      value: Number(clsStats.average.toFixed(3)),
      unit: '',
      trend: clsStats.average > 0.1 ? 'up' : 'stable',
      status: clsStats.average > 0.25 ? 'critical' : clsStats.average > 0.1 ? 'warning' : 'good'
    });

    // Error Rate
    const errorStats = performanceMonitor.getMetricStats('api_error', 3600000);
    const totalApiCalls = apiStats.count + errorStats.count;
    const errorRate = totalApiCalls > 0 ? (errorStats.count / totalApiCalls) * 100 : 0;
    metrics.push({
      name: 'Error Rate',
      value: Number(errorRate.toFixed(2)),
      unit: '%',
      trend: errorRate > 1 ? 'up' : 'stable',
      status: errorRate > 5 ? 'critical' : errorRate > 1 ? 'warning' : 'good'
    });

    // Cache Hit Rate (simulated for now)
    const cacheHitRate = 87; // This would come from actual cache stats
    metrics.push({
      name: 'Cache Hit Rate',
      value: cacheHitRate,
      unit: '%',
      trend: 'stable',
      status: cacheHitRate > 80 ? 'good' : cacheHitRate > 60 ? 'warning' : 'critical'
    });

    // Memory Usage (if available)
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      metrics.push({
        name: 'Memory Usage',
        value: heapUsedMB,
        unit: 'MB',
        trend: heapUsedMB > 500 ? 'up' : 'stable',
        status: heapUsedMB > 1000 ? 'critical' : heapUsedMB > 500 ? 'warning' : 'good'
      });
    }

    // Response with all collected metrics
    return NextResponse.json({
      metrics,
      summary: monitoringStats.summary,
      recentMetrics: performanceMonitor.getRecentMetrics(undefined, 20),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}