"use client";

import React, { useState } from 'react';
import { logger } from "../../../lib/logger";
import { ArrowLeftIcon, Loader2, Play, Download, RefreshCw, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

export default function PerformanceDemoPage() {
    const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
    const [selectedStrategy, setSelectedStrategy] = useState<string>('DEFAULT');
    const [isRunning, setIsRunning] = useState(false);
    const [useCache, setUseCache] = useState(true);
    const [parallelWorkers, setParallelWorkers] = useState(2);
    const [benchmarkResults, setBenchmarkResults] = useState<any[]>([]);
    const [isLoadingScenarios, setIsLoadingScenarios] = useState(true);
    const [scenarios, setScenarios] = useState<any[]>([]);

    // Simuler le chargement des scénarios
    React.useEffect(() => {
        const fetchScenarios = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/simulations/scenarios');
                const data = await response.json();
                setScenarios(data.data || []);
            } catch (error) {
                logger.error('Erreur lors du chargement des scénarios:', error);
                toast.error('Erreur lors du chargement des scénarios');
            } finally {
                setIsLoadingScenarios(false);
            }
        };

        fetchScenarios();
    }, []);

    // Lancer une simulation avec la stratégie sélectionnée
    const runBenchmark = async () => {
        if (!selectedScenarioId) {
            toast.error('Veuillez sélectionner un scénario');
            return;
        }

        setIsRunning(true);
        toast.info(`Démarrage de la simulation avec la stratégie: ${selectedStrategy}`);

        try {
            const startTime = Date.now();

            const response = await fetch('http://localhost:3000/api/simulations/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    scenarioId: selectedScenarioId,
                    strategy: selectedStrategy,
                    options: {
                        useCache,
                        parallelWorkers
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors du démarrage de la simulation');
            }

            const result = await response.json();
            const executionTime = Date.now() - startTime;

            // Ajouter le résultat au benchmark
            setBenchmarkResults(prev => [
                ...prev,
                {
                    strategy: selectedStrategy,
                    executionTime,
                    useCache,
                    parallelWorkers: selectedStrategy === 'PARALLEL_PROCESSING' ? parallelWorkers : 'N/A',
                    timestamp: new Date().toISOString(),
                    resultId: result.simulationId
                }
            ]);

            toast.success(`Simulation terminée en ${executionTime / 1000} secondes`);
        } catch (error: any) {
            logger.error('Erreur lors de la simulation:', error);
            toast.error(error.message || 'Erreur lors de la simulation');
        } finally {
            setIsRunning(false);
        }
    };

    // Formater le temps d'exécution
    const formatExecutionTime = (time: number) => {
        return (time / 1000).toFixed(2) + 's';
    };

    // Télécharger les résultats du benchmark
    const downloadBenchmarkResults = () => {
        if (benchmarkResults.length === 0) {
            toast.error('Aucun résultat à télécharger');
            return;
        }

        const json = JSON.stringify(benchmarkResults, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `simulation-benchmark-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success('Résultats téléchargés');
    };

    // Données pour le graphique de comparaison
    const chartData = benchmarkResults.map((result, index) => ({
        name: `Test ${index + 1}`,
        temps: result.executionTime,
        stratégie: result.strategy
    }));

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-6">
                <Link href="/admin/simulations" className="inline-flex items-center text-sm text-primary hover:underline mb-2">
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Retour à la liste des simulations
                </Link>
                <h1 className="text-3xl font-bold mb-2">Démo d'optimisation des performances</h1>
                <p className="text-muted-foreground">
                    Cette page permet de tester différentes stratégies d'optimisation des simulations
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration du test</CardTitle>
                            <CardDescription>
                                Sélectionnez un scénario et une stratégie d'optimisation
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="scenario">Scénario</Label>
                                <Select
                                    value={selectedScenarioId || ""}
                                    onValueChange={setSelectedScenarioId}
                                    disabled={isLoadingScenarios || isRunning}
                                >
                                    <SelectTrigger id="scenario">
                                        <SelectValue placeholder="Sélectionner un scénario" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {scenarios.map(scenario => (
                                            <SelectItem key={scenario.id} value={scenario.id}>
                                                {scenario.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="strategy">Stratégie d'optimisation</Label>
                                <Select
                                    value={selectedStrategy}
                                    onValueChange={setSelectedStrategy}
                                    disabled={isRunning}
                                >
                                    <SelectTrigger id="strategy">
                                        <SelectValue placeholder="Sélectionner une stratégie" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DEFAULT">Stratégie par défaut</SelectItem>
                                        <SelectItem value="CACHE_ONLY">Cache uniquement</SelectItem>
                                        <SelectItem value="PARALLEL_PROCESSING">Traitement parallèle</SelectItem>
                                        <SelectItem value="INCREMENTAL">Calcul incrémental</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="pt-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="use-cache">Utiliser le cache</Label>
                                    <Switch
                                        id="use-cache"
                                        checked={useCache}
                                        onCheckedChange={setUseCache}
                                        disabled={isRunning || selectedStrategy === 'CACHE_ONLY'}
                                    />
                                </div>
                            </div>

                            {selectedStrategy === 'PARALLEL_PROCESSING' && (
                                <div className="pt-4 space-y-2">
                                    <Label htmlFor="workers">
                                        Nombre de workers ({parallelWorkers})
                                    </Label>
                                    <Slider
                                        id="workers"
                                        min={1}
                                        max={8}
                                        step={1}
                                        value={[parallelWorkers]}
                                        onValueChange={(values) => setParallelWorkers(values[0])}
                                        disabled={isRunning}
                                    />
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={runBenchmark}
                                disabled={isRunning || !selectedScenarioId}
                                className="w-full"
                            >
                                {isRunning ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Simulation en cours...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4 mr-2" />
                                        Exécuter le benchmark
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>Résultats du benchmark</span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setBenchmarkResults([])}
                                        disabled={benchmarkResults.length === 0}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Réinitialiser
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={downloadBenchmarkResults}
                                        disabled={benchmarkResults.length === 0}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Exporter
                                    </Button>
                                </div>
                            </CardTitle>
                            <CardDescription>
                                Comparaison des temps d'exécution pour différentes stratégies
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {benchmarkResults.length === 0 ? (
                                <div className="text-center py-12">
                                    <BarChart2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">
                                        Aucun résultat de benchmark disponible
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Sélectionnez un scénario et une stratégie pour commencer
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="h-80 mb-6">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis label={{ value: 'Temps (ms)', angle: -90, position: 'insideLeft' }} />
                                                <Tooltip formatter={(value) => [`${value} ms`, 'Temps d\'exécution']} />
                                                <Legend />
                                                <Bar dataKey="temps" name="Temps d'exécution (ms)" fill="#8884d8" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-muted/50">
                                                    <th className="p-2 text-left text-xs font-medium">Test</th>
                                                    <th className="p-2 text-left text-xs font-medium">Stratégie</th>
                                                    <th className="p-2 text-left text-xs font-medium">Temps</th>
                                                    <th className="p-2 text-left text-xs font-medium">Cache</th>
                                                    <th className="p-2 text-left text-xs font-medium">Workers</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {benchmarkResults.map((result, index) => (
                                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-muted/20'}>
                                                        <td className="p-2 border-t">{index + 1}</td>
                                                        <td className="p-2 border-t">
                                                            <Badge variant="outline">
                                                                {result.strategy}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-2 border-t font-mono">
                                                            {formatExecutionTime(result.executionTime)}
                                                        </td>
                                                        <td className="p-2 border-t">
                                                            {result.useCache ? (
                                                                <Badge variant="success">Activé</Badge>
                                                            ) : (
                                                                <Badge variant="secondary">Désactivé</Badge>
                                                            )}
                                                        </td>
                                                        <td className="p-2 border-t font-mono">
                                                            {result.parallelWorkers !== 'N/A' ? result.parallelWorkers : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="mt-6">
                <Alert>
                    <AlertTitle>Informations sur les stratégies</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li><strong>Stratégie par défaut</strong>: Exécute la simulation normalement avec des optimisations de base.</li>
                            <li><strong>Cache uniquement</strong>: Utilise uniquement les résultats en cache sans effectuer de nouveaux calculs.</li>
                            <li><strong>Traitement parallèle</strong>: Divise la période en sous-périodes traitées en parallèle.</li>
                            <li><strong>Calcul incrémental</strong>: Utilise les résultats précédents comme base pour les nouveaux calculs.</li>
                        </ul>
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    );
} 