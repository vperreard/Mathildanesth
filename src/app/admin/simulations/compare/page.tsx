"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, BarChart2, FileText, Check, X, Download } from 'lucide-react';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts';

// Types
interface SimulationScenario {
    id: string;
    name: string;
    description?: string;
    results?: SimulationResult[];
}

interface SimulationResult {
    id: string;
    status: string;
    createdAt: string;
    statistics: {
        staffingRate?: number;
        satisfactionRate?: number;
        costEfficiency?: number;
        conflictRate?: number;
        workloadBalance?: number;
        coverage?: number;
        [key: string]: number | undefined;
    };
    // Données pour la comparaison
    data?: any;
}

interface ComparisonData {
    scenarios: SimulationScenario[];
    results: SimulationResult[];
    metrics: string[];
}

export default function CompareSimulationsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const resultIds = searchParams?.get('resultIds')?.split(',') || [];
    const scenarioIds = searchParams?.get('scenarioIds')?.split(',') || [];

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
    const [selectedMetric, setSelectedMetric] = useState<string>('staffingRate');
    const [selectedView, setSelectedView] = useState<string>('bar');
    const [activeTab, setActiveTab] = useState('overview');

    // Charger les données de comparaison
    useEffect(() => {
        const fetchComparisonData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Si pas de résultats ou scénarios spécifiés, simuler des données pour la démonstration
                if (resultIds.length === 0 && scenarioIds.length === 0) {
                    const demoData = generateDemoComparisonData();
                    setComparisonData(demoData);
                    setLoading(false);
                    return;
                }

                // Construire les paramètres pour la requête
                const params = new URLSearchParams();
                if (resultIds.length > 0) {
                    params.append('resultIds', resultIds.join(','));
                }
                if (scenarioIds.length > 0) {
                    params.append('scenarioIds', scenarioIds.join(','));
                }

                // Appeler l'API
                const response = await fetch(`/api/simulations/compare?${params.toString()}`);

                if (!response.ok) {
                    throw new Error(`Erreur lors de la récupération des données de comparaison: ${response.statusText}`);
                }

                const data = await response.json();
                setComparisonData(data);
            } catch (err) {
                console.error('Erreur:', err);
                setError(err instanceof Error ? err.message : 'Erreur inconnue');

                // En cas d'erreur, utiliser des données de démonstration
                const demoData = generateDemoComparisonData();
                setComparisonData(demoData);

                toast.error('Erreur lors du chargement des données, affichage de données de démonstration');
            } finally {
                setLoading(false);
            }
        };

        fetchComparisonData();
    }, [resultIds, scenarioIds]);

    // Fonction pour générer des données de démonstration
    const generateDemoComparisonData = (): ComparisonData => {
        // Créer des scénarios de démonstration
        const scenarios: SimulationScenario[] = [
            { id: 'scenario-1', name: 'Scénario optimal', description: 'Optimisation du taux de couverture' },
            { id: 'scenario-2', name: 'Scénario équilibré', description: 'Équilibre entre satisfaction et efficacité' },
            { id: 'scenario-3', name: 'Scénario économique', description: 'Réduction des coûts de personnel' }
        ];

        // Créer des résultats de simulation
        const results: SimulationResult[] = [
            {
                id: 'result-1',
                status: 'COMPLETED',
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                statistics: {
                    staffingRate: 92,
                    satisfactionRate: 78,
                    costEfficiency: 85,
                    conflictRate: 12,
                    workloadBalance: 88,
                    coverage: 95
                },
                data: {
                    // Données supplémentaires pour la comparaison
                }
            },
            {
                id: 'result-2',
                status: 'COMPLETED',
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                statistics: {
                    staffingRate: 85,
                    satisfactionRate: 89,
                    costEfficiency: 78,
                    conflictRate: 8,
                    workloadBalance: 90,
                    coverage: 87
                },
                data: {
                    // Données supplémentaires pour la comparaison
                }
            },
            {
                id: 'result-3',
                status: 'COMPLETED',
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                statistics: {
                    staffingRate: 78,
                    satisfactionRate: 72,
                    costEfficiency: 95,
                    conflictRate: 18,
                    workloadBalance: 75,
                    coverage: 82
                },
                data: {
                    // Données supplémentaires pour la comparaison
                }
            }
        ];

        // Métriques disponibles pour la comparaison
        const metrics = [
            'staffingRate',
            'satisfactionRate',
            'costEfficiency',
            'conflictRate',
            'workloadBalance',
            'coverage'
        ];

        return { scenarios, results, metrics };
    };

    // Préparer les données pour les graphiques
    const prepareChartData = () => {
        if (!comparisonData || !comparisonData.results || comparisonData.results.length === 0) {
            return [];
        }

        return comparisonData.results.map((result, index) => {
            const scenarioName = comparisonData.scenarios[index]?.name || `Scénario ${index + 1}`;
            const data: any = {
                name: scenarioName,
            };

            // Ajouter toutes les métriques disponibles
            comparisonData.metrics.forEach(metric => {
                if (result.statistics && result.statistics[metric] !== undefined) {
                    data[metric] = result.statistics[metric];
                    data[`${metric}Label`] = formatMetricLabel(metric);
                }
            });

            return data;
        });
    };

    // Formatter les noms de métriques pour l'affichage
    const formatMetricLabel = (metric: string): string => {
        const labels: Record<string, string> = {
            'staffingRate': 'Taux de couverture',
            'satisfactionRate': 'Satisfaction',
            'costEfficiency': 'Efficacité coût',
            'conflictRate': 'Taux de conflits',
            'workloadBalance': 'Équilibre de charge',
            'coverage': 'Couverture'
        };
        return labels[metric] || metric;
    };

    // Générer des couleurs pour les graphiques
    const getChartColors = () => {
        return ['#4f46e5', '#16a34a', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4'];
    };

    // Exporter les données de comparaison
    const handleExport = (format: 'pdf' | 'excel') => {
        toast.success(`Export en format ${format.toUpperCase()} en cours...`);
        // À implémenter: appel à l'API d'export
    };

    // Rendu conditionnel pendant le chargement
    if (loading) {
        return (
            <div className="container mx-auto py-6 flex items-center justify-center h-screen">
                <div className="text-center">
                    <RefreshCw className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-lg">Chargement des données de comparaison...</p>
                </div>
            </div>
        );
    }

    // Données pour les graphiques
    const chartData = prepareChartData();

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Retour
                    </Button>
                    <h1 className="text-2xl font-bold">Comparaison de Simulations</h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                        <FileText className="w-4 h-4 mr-1" />
                        Export PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                        <Download className="w-4 h-4 mr-1" />
                        Export Excel
                    </Button>
                </div>
            </div>

            {error && (
                <Card className="bg-red-50 border-red-200">
                    <CardContent className="py-4">
                        <div className="flex items-start gap-2">
                            <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-red-700">Erreur lors du chargement des données</p>
                                <p className="text-sm text-red-600">{error}</p>
                                <p className="text-sm text-red-600 mt-1">Affichage de données de démonstration.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {comparisonData && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Scénarios comparés</CardTitle>
                            <CardDescription>
                                Comparaison de {comparisonData.scenarios.length} scénarios de simulation
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {comparisonData.scenarios.map((scenario, index) => (
                                    <Card key={scenario.id} className="bg-gray-50">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-base">
                                                        {scenario.name}
                                                    </CardTitle>
                                                    {scenario.description && (
                                                        <CardDescription className="text-xs">
                                                            {scenario.description}
                                                        </CardDescription>
                                                    )}
                                                </div>
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    Scénario {index + 1}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="text-sm space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Date de la simulation:</span>
                                                    <span>{new Date(comparisonData.results[index]?.createdAt || Date.now()).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Statut:</span>
                                                    <span className="flex items-center">
                                                        {comparisonData.results[index]?.status === 'COMPLETED' ? (
                                                            <>
                                                                <Check className="w-3 h-3 text-green-500 mr-1" />
                                                                Terminé
                                                            </>
                                                        ) : (
                                                            <>
                                                                <X className="w-3 h-3 text-red-500 mr-1" />
                                                                Non terminé
                                                            </>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-0">
                                            <Link href={`/admin/simulations/${scenario.id}/results/${comparisonData.results[index]?.id}`}>
                                                <Button variant="outline" size="sm" className="p-0 h-auto">
                                                    Voir les détails
                                                </Button>
                                            </Link>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-3 mb-4">
                            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                            <TabsTrigger value="metrics">Métriques individuelles</TabsTrigger>
                            <TabsTrigger value="radar">Comparaison radar</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Comparaison générale</CardTitle>
                                        <Select value={selectedView} onValueChange={setSelectedView}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Type de graphique" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="bar">Graphique à barres</SelectItem>
                                                <SelectItem value="line">Graphique linéaire</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[400px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            {selectedView === 'bar' ? (
                                                <BarChart
                                                    data={chartData}
                                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" />
                                                    <YAxis domain={[0, 100]} />
                                                    <Tooltip formatter={(value) => [`${value}%`, '']} />
                                                    <Legend formatter={(value) => formatMetricLabel(value)} />
                                                    {comparisonData.metrics.map((metric, index) => (
                                                        <Bar
                                                            key={metric}
                                                            dataKey={metric}
                                                            fill={getChartColors()[index % getChartColors().length]}
                                                            name={formatMetricLabel(metric)}
                                                        />
                                                    ))}
                                                </BarChart>
                                            ) : (
                                                <LineChart
                                                    data={chartData}
                                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" />
                                                    <YAxis domain={[0, 100]} />
                                                    <Tooltip formatter={(value) => [`${value}%`, '']} />
                                                    <Legend formatter={(value) => formatMetricLabel(value)} />
                                                    {comparisonData.metrics.map((metric, index) => (
                                                        <Line
                                                            key={metric}
                                                            type="monotone"
                                                            dataKey={metric}
                                                            stroke={getChartColors()[index % getChartColors().length]}
                                                            name={formatMetricLabel(metric)}
                                                            activeDot={{ r: 8 }}
                                                        />
                                                    ))}
                                                </LineChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="metrics" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Comparaison par métrique</CardTitle>
                                        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Sélectionner une métrique" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {comparisonData.metrics.map((metric) => (
                                                    <SelectItem key={metric} value={metric}>
                                                        {formatMetricLabel(metric)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <CardDescription>
                                        Comparaison détaillée pour la métrique: {formatMetricLabel(selectedMetric)}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[400px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={chartData}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis domain={[0, 100]} />
                                                <Tooltip formatter={(value) => [`${value}%`, '']} />
                                                <Legend />
                                                <Bar
                                                    dataKey={selectedMetric}
                                                    fill="#4f46e5"
                                                    name={formatMetricLabel(selectedMetric)}
                                                    label={{ position: 'top', formatter: (value: number) => `${value}%` }}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="mt-6">
                                        <h3 className="text-lg font-semibold mb-3">Analyse comparative</h3>
                                        <div className="space-y-4">
                                            {comparisonData.results.map((result, index) => {
                                                const scenarioName = comparisonData.scenarios[index]?.name || `Scénario ${index + 1}`;
                                                const value = result.statistics[selectedMetric];
                                                const isHighest = value === Math.max(...comparisonData.results.map(r => r.statistics[selectedMetric] || 0));
                                                const isLowest = value === Math.min(...comparisonData.results.map(r => r.statistics[selectedMetric] || 0));

                                                return (
                                                    <div key={result.id} className={`p-3 rounded-md ${isHighest ? 'bg-green-50 border border-green-200' : isLowest ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'}`}>
                                                        <div className="flex justify-between items-center">
                                                            <h4 className="font-medium">{scenarioName}</h4>
                                                            <Badge variant="outline" className={
                                                                isHighest
                                                                    ? 'bg-green-100 text-green-800 border-green-300'
                                                                    : isLowest
                                                                        ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                                                        : 'bg-gray-100'
                                                            }>
                                                                {value}%
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm mt-1">
                                                            {isHighest
                                                                ? `Meilleure performance pour ${formatMetricLabel(selectedMetric)}`
                                                                : isLowest
                                                                    ? `Performance la plus basse pour ${formatMetricLabel(selectedMetric)}`
                                                                    : `Performance moyenne pour ${formatMetricLabel(selectedMetric)}`
                                                            }
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="radar" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Comparaison radar</CardTitle>
                                    <CardDescription>
                                        Vue radar permettant de comparer toutes les métriques simultanément
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[500px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart outerRadius={180} data={chartData}>
                                                <PolarGrid />
                                                <PolarAngleAxis
                                                    dataKey="name"
                                                />
                                                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                                                {comparisonData.metrics.map((metric, index) => (
                                                    <Radar
                                                        key={metric}
                                                        name={formatMetricLabel(metric)}
                                                        dataKey={metric}
                                                        stroke={getChartColors()[index % getChartColors().length]}
                                                        fill={getChartColors()[index % getChartColors().length]}
                                                        fillOpacity={0.2}
                                                    />
                                                ))}
                                                <Legend />
                                                <Tooltip formatter={(value) => [`${value}%`, '']} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="mt-6">
                                        <h3 className="text-lg font-semibold mb-3">Analyse globale</h3>
                                        <div className="space-y-2">
                                            {comparisonData.scenarios.map((scenario, index) => {
                                                const metrics = comparisonData.results[index]?.statistics || {};
                                                const values = Object.values(metrics).filter(val => val !== undefined) as number[];
                                                const avgScore = values.length > 0
                                                    ? values.reduce((sum, val) => sum + val, 0) / values.length
                                                    : 0;

                                                // Trouver les points forts et faibles
                                                const sortedMetrics = Object.entries(metrics)
                                                    .map(([key, value]) => ({ key, value: value || 0 }))
                                                    .sort((a, b) => b.value - a.value);

                                                const strengths = sortedMetrics.slice(0, 2);
                                                const weaknesses = sortedMetrics.slice(-2).reverse();

                                                return (
                                                    <div key={scenario.id} className="p-4 bg-gray-50 rounded-md">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h4 className="font-medium">{scenario.name}</h4>
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                Score global: {avgScore.toFixed(1)}%
                                                            </Badge>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                                            <div>
                                                                <p className="text-sm font-medium text-green-700 mb-1">Points forts:</p>
                                                                <ul className="text-xs space-y-1">
                                                                    {strengths.map(({ key, value }) => (
                                                                        <li key={key} className="flex justify-between">
                                                                            <span>{formatMetricLabel(key)}</span>
                                                                            <span className="font-medium">{value}%</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>

                                                            <div>
                                                                <p className="text-sm font-medium text-amber-700 mb-1">Points à améliorer:</p>
                                                                <ul className="text-xs space-y-1">
                                                                    {weaknesses.map(({ key, value }) => (
                                                                        <li key={key} className="flex justify-between">
                                                                            <span>{formatMetricLabel(key)}</span>
                                                                            <span className="font-medium">{value}%</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
} 