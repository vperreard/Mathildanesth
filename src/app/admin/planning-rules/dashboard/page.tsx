'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertCircle,
    AlertTriangle,
    Info,
    TrendingUp,
    TrendingDown,
    Activity,
    Clock,
    Users,
    Filter,
    Download,
    RefreshCw,
    Calendar
} from 'lucide-react';
import { useRuleNotifications } from '@/modules/dynamicRules/hooks/useRuleNotifications';
import { useQuery } from '@tanstack/react-query';
import { RuleSeverity } from '@/types/rules';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const COLORS = {
    [RuleSeverity.ERROR]: '#ef4444',
    [RuleSeverity.WARNING]: '#f59e0b',
    [RuleSeverity.INFO]: '#3b82f6'
};

export default function RuleDashboardPage() {
    const [timeRange, setTimeRange] = useState('24h');
    const [selectedRule, setSelectedRule] = useState<string>('all');
    const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

    const {
        violations,
        ruleChanges,
        connectionStatus,
        isConnected
    } = useRuleNotifications({
        autoConnect: true,
        showToasts: false // Pas de toasts sur le dashboard
    });

    // Charger les statistiques depuis l'API
    const { data: stats, refetch: refetchStats } = useQuery({
        queryKey: ['rule-dashboard-stats', timeRange],
        queryFn: async () => {
            const response = await fetch(`/api/admin/planning-rules/v2/stats?range=${timeRange}`);
            if (!response.ok) throw new Error('Failed to fetch stats');
            return response.json();
        },
        refetchInterval: 60000 // Rafraîchir toutes les minutes
    });

    // Filtrer les violations
    const filteredViolations = useMemo(() => {
        return violations.filter(v => {
            if (selectedRule !== 'all' && v.ruleId !== selectedRule) return false;
            if (selectedSeverity !== 'all' && v.severity !== selectedSeverity) return false;
            
            // Filtrer par période
            const violationDate = new Date(v.timestamp);
            const now = new Date();
            
            switch (timeRange) {
                case '1h':
                    return violationDate > subDays(now, 1/24);
                case '24h':
                    return violationDate > subDays(now, 1);
                case '7d':
                    return violationDate > subDays(now, 7);
                case '30d':
                    return violationDate > subDays(now, 30);
                default:
                    return true;
            }
        });
    }, [violations, selectedRule, selectedSeverity, timeRange]);

    // Statistiques en temps réel
    const realtimeStats = useMemo(() => {
        const severityCounts = {
            [RuleSeverity.ERROR]: 0,
            [RuleSeverity.WARNING]: 0,
            [RuleSeverity.INFO]: 0
        };

        const ruleViolations: Record<string, number> = {};
        const hourlyData: Record<string, number> = {};

        filteredViolations.forEach(v => {
            // Compter par sévérité
            severityCounts[v.severity]++;
            
            // Compter par règle
            ruleViolations[v.ruleName] = (ruleViolations[v.ruleName] || 0) + 1;
            
            // Compter par heure
            const hour = format(v.timestamp, 'HH:00');
            hourlyData[hour] = (hourlyData[hour] || 0) + 1;
        });

        // Top 5 des règles violées
        const topViolatedRules = Object.entries(ruleViolations)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // Données pour le graphique temporel
        const timelineData = Object.entries(hourlyData)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([hour, count]) => ({ hour, count }));

        return {
            severityCounts,
            topViolatedRules,
            timelineData,
            total: filteredViolations.length
        };
    }, [filteredViolations]);

    // Données pour le graphique en camembert
    const pieData = Object.entries(realtimeStats.severityCounts)
        .filter(([, count]) => count > 0)
        .map(([severity, count]) => ({
            name: severity,
            value: count
        }));

    const exportData = () => {
        const data = filteredViolations.map(v => ({
            date: format(v.timestamp, 'dd/MM/yyyy HH:mm'),
            rule: v.ruleName,
            severity: v.severity,
            message: v.message,
            user: v.context.userName || '-',
            location: v.context.location || '-'
        }));

        const csv = [
            ['Date', 'Règle', 'Sévérité', 'Message', 'Utilisateur', 'Lieu'],
            ...data.map(row => Object.values(row))
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `violations-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard des Règles</h1>
                    <p className="text-muted-foreground mt-1">
                        Surveillance en temps réel des violations et performances
                    </p>
                </div>
                
                <div className="flex items-center gap-2">
                    <Badge variant={isConnected ? 'default' : 'destructive'}>
                        {isConnected ? 'Connecté' : 'Déconnecté'}
                    </Badge>
                    
                    <Button variant="outline" size="sm" onClick={() => refetchStats()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Actualiser
                    </Button>
                    
                    <Button variant="outline" size="sm" onClick={exportData}>
                        <Download className="h-4 w-4 mr-2" />
                        Exporter
                    </Button>
                </div>
            </div>

            {/* Filtres */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Filtres</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1h">Dernière heure</SelectItem>
                                <SelectItem value="24h">24 heures</SelectItem>
                                <SelectItem value="7d">7 jours</SelectItem>
                                <SelectItem value="30d">30 jours</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Toutes sévérités" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes sévérités</SelectItem>
                                <SelectItem value={RuleSeverity.ERROR}>Erreurs</SelectItem>
                                <SelectItem value={RuleSeverity.WARNING}>Avertissements</SelectItem>
                                <SelectItem value={RuleSeverity.INFO}>Informations</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={selectedRule} onValueChange={setSelectedRule}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Toutes les règles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes les règles</SelectItem>
                                {Array.from(new Set(violations.map(v => v.ruleId))).map(ruleId => {
                                    const rule = violations.find(v => v.ruleId === ruleId);
                                    return (
                                        <SelectItem key={ruleId} value={ruleId}>
                                            {rule?.ruleName || ruleId}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Statistiques générales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{realtimeStats.total}</div>
                        {stats?.trend && (
                            <p className="text-xs text-muted-foreground flex items-center mt-1">
                                {stats.trend > 0 ? (
                                    <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                                ) : (
                                    <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                                )}
                                {Math.abs(stats.trend)}% vs période précédente
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Erreurs Critiques</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {realtimeStats.severityCounts[RuleSeverity.ERROR]}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {((realtimeStats.severityCounts[RuleSeverity.ERROR] / realtimeStats.total) * 100 || 0).toFixed(1)}% du total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avertissements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {realtimeStats.severityCounts[RuleSeverity.WARNING]}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {((realtimeStats.severityCounts[RuleSeverity.WARNING] / realtimeStats.total) * 100 || 0).toFixed(1)}% du total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Règles Actives</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeRules || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats?.totalRules || 0} règles au total
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Timeline des violations */}
                <Card>
                    <CardHeader>
                        <CardTitle>Évolution temporelle</CardTitle>
                        <CardDescription>
                            Nombre de violations par heure
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={realtimeStats.timelineData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <Tooltip />
                                <Line 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke="#3b82f6" 
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Répartition par sévérité */}
                <Card>
                    <CardHeader>
                        <CardTitle>Répartition par sévérité</CardTitle>
                        <CardDescription>
                            Distribution des types de violations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as RuleSeverity]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Top des règles violées */}
            <Card>
                <CardHeader>
                    <CardTitle>Top 5 des règles violées</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={realtimeStats.topViolatedRules} layout="horizontal">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={150} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Liste des violations récentes */}
            <Card>
                <CardHeader>
                    <CardTitle>Violations récentes</CardTitle>
                    <CardDescription>
                        {filteredViolations.length} violation(s) dans la période sélectionnée
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                            {filteredViolations.slice(0, 50).map((violation) => (
                                <div
                                    key={violation.id}
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50"
                                >
                                    {violation.severity === RuleSeverity.ERROR && (
                                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                                    )}
                                    {violation.severity === RuleSeverity.WARNING && (
                                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                                    )}
                                    {violation.severity === RuleSeverity.INFO && (
                                        <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                                    )}
                                    
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{violation.ruleName}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {format(violation.timestamp, 'HH:mm')}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {violation.message}
                                        </p>
                                        {(violation.context.userName || violation.context.location) && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {violation.context.userName && `Utilisateur: ${violation.context.userName}`}
                                                {violation.context.userName && violation.context.location && ' • '}
                                                {violation.context.location && `Lieu: ${violation.context.location}`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}