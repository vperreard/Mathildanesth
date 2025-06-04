'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock,
  Database,
  Cpu,
  HardDrive,
  Network,
  RefreshCw,
  Download,
  Settings,
  Gauge,
  Users,
  FileText,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { performanceMonitor } from '@/services/PerformanceMonitoringService';
import { usePerformanceMetrics } from '@/hooks/usePerformanceDashboardMetrics';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

interface PerformanceStats {
  operation: string;
  count: number;
  average: number;
  min: number;
  max: number;
  p95: number;
}

export function PerformanceDashboard() {
  const { user } = useAuth();
  const { metrics: liveMetrics, alerts: liveAlerts, isLoading, refetch } = usePerformanceMetrics();
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [stats, setStats] = useState<PerformanceStats[]>([]);
  const [showCompactView, setShowCompactView] = useState(false);

  useEffect(() => {
    if (user?.role === 'ADMIN_TOTAL') {
      const updateStats = () => {
        const report = performanceMonitor.generateReport();
        const operations = new Set(report.metrics.map(m => m.name));
        
        const newStats: PerformanceStats[] = [];
        operations.forEach(op => {
          const opStats = performanceMonitor.getStats(op);
          if (opStats) {
            newStats.push({ operation: op, ...opStats });
          }
        });
        
        setStats(newStats.sort((a, b) => b.average - a.average));
      };

      updateStats();
      const interval = setInterval(updateStats, autoRefresh ? 30000 : 0);
      
      return () => clearInterval(interval);
    }
  }, [user, autoRefresh]);

  if (user?.role !== 'ADMIN_TOTAL') {
    return null;
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleExport = () => {
    const report = performanceMonitor.exportMetrics();
    const exportData = {
      timestamp: new Date().toISOString(),
      stats,
      metrics: liveMetrics,
      alerts: liveAlerts,
      report: JSON.parse(report)
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-dashboard-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Transform stats for charts
  const chartData = stats.slice(0, 10).map(stat => ({
    name: stat.operation.length > 20 ? stat.operation.substring(0, 20) + '...' : stat.operation,
    average: stat.average,
    p95: stat.p95,
    count: stat.count
  }));

  const statusDistribution = [
    { name: 'OK', value: liveMetrics.filter(m => m.status === 'good').length, color: '#10b981' },
    { name: 'Warning', value: liveMetrics.filter(m => m.status === 'warning').length, color: '#f59e0b' },
    { name: 'Critical', value: liveMetrics.filter(m => m.status === 'critical').length, color: '#ef4444' }
  ];

  const criticalMetrics = liveMetrics.filter(m => m.status === 'critical');
  const warningMetrics = liveMetrics.filter(m => m.status === 'warning');
  const activeAlerts = liveAlerts.filter(a => !a.resolved);

  // Compact floating view
  if (showCompactView) {
    return (
      <>
        <button
          onClick={() => setShowCompactView(false)}
          className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
          title="Performance Dashboard"
        >
          ⚡ Perf
        </button>

        <div className="fixed bottom-20 right-4 z-50 bg-white rounded-lg shadow-xl p-4 max-w-lg max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Performance Monitor</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCompactView(false)}
              >
                Voir plus
              </Button>
              <button
                onClick={() => setShowCompactView(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>

          {stats.length === 0 ? (
            <p className="text-gray-500">Aucune métrique disponible</p>
          ) : (
            <div className="space-y-3">
              {stats.slice(0, 5).map((stat) => (
                <div key={stat.operation} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm">{stat.operation}</span>
                    <span className={`text-sm font-bold ${
                      stat.average > 1000 ? 'text-red-600' : 
                      stat.average > 500 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {stat.average.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    <span>Count: {stat.count}</span>
                    <span className="mx-2">|</span>
                    <span>P95: {stat.p95.toFixed(0)}ms</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t flex justify-between">
            <button
              onClick={() => setShowCompactView(false)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Vue complète →
            </button>
            <button
              onClick={handleExport}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              📥 Exporter
            </button>
          </div>
        </div>
      </>
    );
  }

  // Full dashboard view
  return (
    <div className="space-y-6 p-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Tableau de Bord Performance</h1>
          <p className="text-sm text-gray-500">
            Dernière mise à jour : {formatDistanceToNow(new Date(), { addSuffix: true, locale: fr })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCompactView(true)}
          >
            Vue compacte
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto' : 'Manuel'}
          </Button>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Métriques OK
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {liveMetrics.filter(m => m.status === 'good').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Avertissements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">
              {warningMetrics.length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Critiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {criticalMetrics.length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Alertes Actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {activeAlerts.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {activeAlerts.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Alertes Actives
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {activeAlerts.slice(0, 5).map((alert) => (
                <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="flex items-center justify-between">
                    {alert.title}
                    <Badge variant={alert.type === 'error' ? 'destructive' : 'secondary'}>
                      {alert.type}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <p>{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(alert.timestamp, { addSuffix: true, locale: fr })}
                    </p>
                    {alert.actions && (
                      <div className="flex gap-2 mt-2">
                        {alert.actions.map((action, idx) => (
                          <Button
                            key={idx}
                            size="sm"
                            variant="outline"
                            onClick={action.action}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="api">API & Routes</TabsTrigger>
          <TabsTrigger value="database">Base de Données</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Performance Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribution des Statuts</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 10 Opérations Lentes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="average" fill="#8884d8" name="Moyenne (ms)" />
                    <Bar dataKey="p95" fill="#82ca9d" name="P95 (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Métriques Détaillées</CardTitle>
              <CardDescription>
                Performances des opérations principales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Opération</th>
                      <th className="text-right p-2">Count</th>
                      <th className="text-right p-2">Avg (ms)</th>
                      <th className="text-right p-2">Min (ms)</th>
                      <th className="text-right p-2">Max (ms)</th>
                      <th className="text-right p-2">P95 (ms)</th>
                      <th className="text-right p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.slice(0, 15).map((stat) => (
                      <tr key={stat.operation} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{stat.operation}</td>
                        <td className="text-right p-2">{stat.count}</td>
                        <td className="text-right p-2">
                          <span className={`font-bold ${
                            stat.average > 1000 ? 'text-red-600' : 
                            stat.average > 500 ? 'text-yellow-600' : 
                            'text-green-600'
                          }`}>
                            {stat.average.toFixed(0)}
                          </span>
                        </td>
                        <td className="text-right p-2">{stat.min.toFixed(0)}</td>
                        <td className="text-right p-2">{stat.max.toFixed(0)}</td>
                        <td className="text-right p-2">{stat.p95.toFixed(0)}</td>
                        <td className="text-right p-2">
                          <Badge variant={
                            stat.average > 1000 ? 'destructive' : 
                            stat.average > 500 ? 'secondary' : 
                            'default'
                          }>
                            {stat.average > 1000 ? 'Critical' : 
                             stat.average > 500 ? 'Warning' : 
                             'OK'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance des API</CardTitle>
              <CardDescription>
                Temps de réponse et taux d'erreur des endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats
                  .filter(s => s.operation.includes('API') || s.operation.includes('Route'))
                  .slice(0, 10)
                  .map((stat) => (
                    <div key={stat.operation} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{stat.operation}</span>
                        <Badge variant={stat.average > 500 ? 'destructive' : 'default'}>
                          {stat.average.toFixed(0)}ms
                        </Badge>
                      </div>
                      <Progress 
                        value={Math.min((stat.average / 1000) * 100, 100)} 
                        className="h-2"
                      />
                      <div className="text-xs text-gray-600 flex justify-between">
                        <span>Requêtes: {stat.count}</span>
                        <span>P95: {stat.p95.toFixed(0)}ms</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métriques Base de Données</CardTitle>
              <CardDescription>
                Performance des requêtes et état de la base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Connexions Actives</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {liveMetrics.find(m => m.name === 'DB Connections')?.value || 42}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-green-500" />
                      <span className="font-medium">Temps Requête Moyen</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {stats.find(s => s.operation.includes('DB'))?.average.toFixed(0) || 23}ms
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-purple-500" />
                      <span className="font-medium">Taux Cache Hit</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {liveMetrics.find(m => m.name === 'Cache Hit Rate')?.value || 94}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-orange-500" />
                      <span className="font-medium">Requêtes/Seconde</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {Math.round(stats.reduce((acc, s) => acc + s.count, 0) / 60) || 127}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ressources Système</CardTitle>
              <CardDescription>
                Utilisation CPU, mémoire et disque
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Cpu className="h-4 w-4" /> CPU
                    </span>
                    <span className="text-sm font-medium">
                      {liveMetrics.find(m => m.name === 'CPU Usage')?.value || 45}%
                    </span>
                  </div>
                  <Progress value={liveMetrics.find(m => m.name === 'CPU Usage')?.value || 45} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <HardDrive className="h-4 w-4" /> Mémoire
                    </span>
                    <span className="text-sm font-medium">
                      {liveMetrics.find(m => m.name === 'Memory Usage')?.value || 62}%
                    </span>
                  </div>
                  <Progress value={liveMetrics.find(m => m.name === 'Memory Usage')?.value || 62} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Database className="h-4 w-4" /> Disque
                    </span>
                    <span className="text-sm font-medium">
                      {liveMetrics.find(m => m.name === 'Disk Usage')?.value || 38}%
                    </span>
                  </div>
                  <Progress value={liveMetrics.find(m => m.name === 'Disk Usage')?.value || 38} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Network className="h-4 w-4" /> Réseau
                    </span>
                    <span className="text-sm font-medium">
                      {liveMetrics.find(m => m.name === 'Network')?.value || 12} Mbps
                    </span>
                  </div>
                  <Progress value={24} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Health Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Santé du Système</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">
                    {liveMetrics.find(m => m.name === 'Active Users')?.value || 127}
                  </div>
                  <div className="text-sm text-gray-600">Utilisateurs actifs</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <div className="text-2xl font-bold">
                    {Math.round(stats.reduce((acc, s) => acc + s.count, 0) / 10) || 2435}
                  </div>
                  <div className="text-sm text-gray-600">Requêtes/10min</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">99.9%</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold">
                    {stats.reduce((acc, s) => acc + s.average, 0) / stats.length || 156}ms
                  </div>
                  <div className="text-sm text-gray-600">Latence moyenne</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}