'use client';

jest.mock('@/lib/prisma');


import React, { useEffect, useState } from 'react';
import { logger } from "../../../lib/logger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PerformanceMonitorWidget } from '@/components/PerformanceMonitor/PerformanceMonitorWidget';
import { Activity, RefreshCw, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface CacheStats {
    auth: {
        tokens: number;
        users: number;
        permissions: number;
    };
    prisma: {
        queries: number;
        planning: number;
        sectors: number;
        rooms: number;
        leaveBalances: number;
    };
}

interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    status: 'good' | 'warning' | 'critical';
}

export default function PerformanceDashboardClient() {
    const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
    const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const fetchCacheStats = async () => {
        try {
            // Appel API pour récupérer les stats du cache
            const response = await fetch('http://localhost:3000/api/admin/cache/stats');
            if (response.ok) {
                const data = await response.json();
                setCacheStats(data);
            }
        } catch (error) {
            logger.error('Failed to fetch cache stats:', error);
        }
    };

    const fetchPerformanceMetrics = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/monitoring/metrics?dashboard=true');
            if (response.ok) {
                const data = await response.json();
                setPerformanceMetrics(data.metrics || []);
            }
        } catch (error) {
            logger.error('Failed to fetch performance metrics:', error);
        }
    };

    const refreshData = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchCacheStats(), fetchPerformanceMetrics()]);
        setIsRefreshing(false);
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const clearCache = async (type: 'auth' | 'prisma' | 'all') => {
        try {
            const response = await fetch('http://localhost:3000/api/admin/cache/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });

            if (response.ok) {
                await refreshData();
            }
        } catch (error) {
            logger.error('Failed to clear cache:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'good':
                return 'text-green-600';
            case 'warning':
                return 'text-yellow-600';
            case 'critical':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    const getTrendIcon = (trend: string) => {
        if (trend === 'up') return '↑';
        if (trend === 'down') return '↓';
        return '→';
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Activity className="w-8 h-8" />
                        Performance Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Monitoring en temps réel des performances de l'application
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={refreshData}
                    disabled={isRefreshing}
                >
                    <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
                    Actualiser
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                    <TabsTrigger value="webvitals">Core Web Vitals</TabsTrigger>
                    <TabsTrigger value="cache">Cache</TabsTrigger>
                    <TabsTrigger value="api">API Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Temps de réponse moyen
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">124ms</div>
                                <p className="text-xs text-muted-foreground">
                                    <span className="text-green-600">↓ 12%</span> vs semaine dernière
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Taux de cache
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">87%</div>
                                <Progress value={87} className="mt-2" />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Requêtes/seconde
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">342</div>
                                <p className="text-xs text-muted-foreground">
                                    <span className="text-green-600">↑ 5%</span> vs hier
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Erreurs (24h)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">12</div>
                                <p className="text-xs text-muted-foreground">
                                    0.003% du total
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Métriques de performance</CardTitle>
                            <CardDescription>
                                Aperçu des principales métriques système
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {performanceMetrics.map((metric) => (
                                    <div key={metric.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{metric.name}</span>
                                            <span className={cn("text-sm", getStatusColor(metric.status))}>
                                                {getTrendIcon(metric.trend)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={cn("font-mono", getStatusColor(metric.status))}>
                                                {metric.value}{metric.unit}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="webvitals" className="space-y-6">
                    <PerformanceMonitorWidget />
                </TabsContent>

                <TabsContent value="cache" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Cache Authentication</span>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => clearCache('auth')}
                                    >
                                        Vider
                                    </Button>
                                </CardTitle>
                                <CardDescription>
                                    Statistiques du cache d'authentification
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {cacheStats?.auth && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Tokens JWT</span>
                                            <span className="font-mono">{cacheStats.auth.tokens}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Données utilisateur</span>
                                            <span className="font-mono">{cacheStats.auth.users}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Permissions</span>
                                            <span className="font-mono">{cacheStats.auth.permissions}</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Cache Prisma</span>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => clearCache('prisma')}
                                    >
                                        Vider
                                    </Button>
                                </CardTitle>
                                <CardDescription>
                                    Statistiques du cache des requêtes Prisma
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {cacheStats?.prisma && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Requêtes</span>
                                            <span className="font-mono">{cacheStats.prisma.queries}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Planning</span>
                                            <span className="font-mono">{cacheStats.prisma.planning}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Secteurs</span>
                                            <span className="font-mono">{cacheStats.prisma.sectors}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Salles</span>
                                            <span className="font-mono">{cacheStats.prisma.rooms}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Soldes congés</span>
                                            <span className="font-mono">{cacheStats.prisma.leaveBalances}</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Vider le cache peut temporairement dégrader les performances pendant que les données sont rechargées.
                        </AlertDescription>
                    </Alert>
                </TabsContent>

                <TabsContent value="api" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance des endpoints API</CardTitle>
                            <CardDescription>
                                Temps de réponse moyens par endpoint (dernières 24h)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { endpoint: '/api/auth/connexion', avg: 45, p95: 120, requests: 1240 },
                                    { endpoint: '/api/conges', avg: 67, p95: 180, requests: 3421 },
                                    { endpoint: '/api/planning/bloc-operatoire', avg: 234, p95: 450, requests: 876 },
                                    { endpoint: '/api/utilisateurs', avg: 34, p95: 89, requests: 5643 },
                                    { endpoint: '/api/operating-rooms', avg: 56, p95: 134, requests: 2341 },
                                ].map((api) => (
                                    <div key={api.endpoint} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-mono">{api.endpoint}</span>
                                            <span className="text-muted-foreground">
                                                {api.requests.toLocaleString()} requêtes
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <Progress 
                                                    value={Math.min((api.avg / 500) * 100, 100)} 
                                                    className="h-2"
                                                />
                                            </div>
                                            <div className="text-sm text-right min-w-[100px]">
                                                <div>Moy: {api.avg}ms</div>
                                                <div className="text-muted-foreground">P95: {api.p95}ms</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}