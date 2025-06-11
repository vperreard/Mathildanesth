'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Activity, Clock, AlertTriangle, CheckCircle, Users, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';

export const RuleMonitoringDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');

  // Fetch monitoring data
  const { data: monitoringData, isLoading } = useQuery({
    queryKey: ['rule-monitoring', timeRange],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:3000/api/admin/rules/v2/monitoring?range=${timeRange}`
      );
      if (!response.ok) throw new Error('Failed to fetch monitoring data');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Simulated data for demonstration
  const defaultData = {
    overview: {
      totalEvaluations: 45230,
      avgExecutionTime: 23,
      successRate: 0.89,
      activeRules: 24,
      totalViolations: 1342,
      affectedUsers: 67,
    },
    evaluationTrend: Array.from({ length: 7 }, (_, i) => ({
      date: format(subDays(new Date(), 6 - i), 'dd/MM'),
      evaluations: Math.floor(Math.random() * 8000) + 4000,
      violations: Math.floor(Math.random() * 300) + 100,
    })),
    rulePerformance: [
      { name: 'Limite gardes hebdo', execTime: 15, evaluations: 12000, successRate: 0.92 },
      { name: 'Repos après garde', execTime: 8, evaluations: 8500, successRate: 0.95 },
      { name: 'Supervision minimum', execTime: 32, evaluations: 6000, successRate: 0.78 },
      { name: 'Équilibrage charge', execTime: 45, evaluations: 4500, successRate: 0.85 },
      { name: 'Conflits congés', execTime: 12, evaluations: 3200, successRate: 0.91 },
    ],
    violationsByType: [
      { type: 'PLANNING', count: 542, percentage: 40 },
      { type: 'LEAVE', count: 380, percentage: 28 },
      { type: 'CONSTRAINT', count: 271, percentage: 20 },
      { type: 'SUPERVISION', count: 108, percentage: 8 },
      { type: 'ALLOCATION', count: 41, percentage: 4 },
    ],
    impactedUsers: {
      high: 12,
      medium: 28,
      low: 27,
    },
  };

  const data = monitoringData || defaultData;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Dernières 24h</SelectItem>
            <SelectItem value="7d">7 derniers jours</SelectItem>
            <SelectItem value="30d">30 derniers jours</SelectItem>
            <SelectItem value="90d">90 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Évaluations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.overview.totalEvaluations)}</div>
            <p className="text-xs text-muted-foreground">Total sur la période</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.avgExecutionTime}ms</div>
            <p className="text-xs text-muted-foreground">Temps moyen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Taux de succès
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.overview.successRate * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">Conformité</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatNumber(data.overview.totalViolations)}
            </div>
            <p className="text-xs text-muted-foreground">Détectées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.affectedUsers}</div>
            <p className="text-xs text-muted-foreground">Utilisateurs impactés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Règles actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.activeRules}</div>
            <p className="text-xs text-muted-foreground">En fonction</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trend">Tendances</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des évaluations et violations</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.evaluationTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="evaluations"
                    stroke="#3b82f6"
                    name="Évaluations"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="violations"
                    stroke="#ef4444"
                    name="Violations"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance par règle</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.rulePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="execTime" fill="#3b82f6" name="Temps d'exécution (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top 5 - Plus évaluées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.rulePerformance
                    .sort((a, b) => b.evaluations - a.evaluations)
                    .slice(0, 5)
                    .map((rule, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm">{rule.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatNumber(rule.evaluations)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {(rule.successRate * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top 5 - Plus lentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.rulePerformance
                    .sort((a, b) => b.execTime - a.execTime)
                    .slice(0, 5)
                    .map((rule, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm">{rule.name}</span>
                        <Badge variant={rule.execTime > 30 ? 'destructive' : 'secondary'}>
                          {rule.execTime}ms
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Violations par type de règle</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.violationsByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percentage }) => `${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.violationsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {data.violationsByType.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-sm">{item.type}</span>
                      </div>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendance des violations</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.evaluationTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="violations" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="impact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Impact sur les utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-red-600">{data.impactedUsers.high}</div>
                    <p className="text-sm text-muted-foreground">Impact élevé</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-orange-600">
                      {data.impactedUsers.medium}
                    </div>
                    <p className="text-sm text-muted-foreground">Impact moyen</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {data.impactedUsers.low}
                    </div>
                    <p className="text-sm text-muted-foreground">Impact faible</p>
                  </div>
                </div>

                <div className="pt-4">
                  <h4 className="font-medium mb-3">Recommandations</h4>
                  <div className="space-y-2">
                    {data.impactedUsers.high > 10 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {data.impactedUsers.high} utilisateurs fortement impactés. Considérez la
                          révision des règles les plus strictes.
                        </AlertDescription>
                      </Alert>
                    )}
                    {data.overview.successRate < 0.8 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Taux de conformité faible ({(data.overview.successRate * 100).toFixed(0)}
                          %). Les règles peuvent être trop restrictives.
                        </AlertDescription>
                      </Alert>
                    )}
                    {data.overview.avgExecutionTime > 50 && (
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          Temps d'exécution élevé ({data.overview.avgExecutionTime}ms). Optimisation
                          des règles recommandée.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
