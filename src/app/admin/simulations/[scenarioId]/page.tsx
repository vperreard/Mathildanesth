"use client";

import React, { useState, useEffect } from 'react';
import { logger } from "../../../../lib/logger";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, Calendar, Clock, Loader2, Play, Eye, PencilIcon, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import AdvancedFilters, { FilterOptions } from './filters/AdvancedFilters';

interface SimulationResult {
    id: string;
    scenarioId: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    executionTime?: number;
    createdAt: string;
    statisticsJson?: {
        staffUtilization: number;
        ruleComplianceRate: number;
        overcoverageWaste: number;
        undercoverageMissing: number;
        fairnessScore: number;
        overallScore: number;
    };
}

interface SimulationScenario {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    createdBy?: {
        id: number;
        name: string;
    };
    templateId?: string;
    template?: {
        id: string;
        name: string;
    };
    results?: SimulationResult[];
    parametersJson: Record<string, unknown>;
}

export default function ScenarioDetailsPage({ params }: { params: Promise<{ scenarioId: string }> }) {
    const router = useRouter();
    const [scenarioId, setScenarioId] = useState<string>('');
    const [scenario, setScenario] = useState<SimulationScenario | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<FilterOptions>({
        dateRange: undefined,
        serviceIds: [],
        userIds: [],
        resourceIds: [],
        scoreThreshold: null,
        statuses: ['COMPLETED']
    });
    const [isApplyingFilters, setIsApplyingFilters] = useState(false);
    const [filteredResults, setFilteredResults] = useState<SimulationResult[]>([]);

    // Resolve params Promise
    useEffect(() => {
        params.then(resolvedParams => {
            setScenarioId(resolvedParams.scenarioId);
        });
    }, [params]);

    // Charger les données du scénario
    useEffect(() => {
        const fetchScenario = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`http://localhost:3000/api/simulations/scenarios/${scenarioId}`);
                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération du scénario');
                }
                const data = await response.json();
                setScenario(data.data);
            } catch (err: unknown) {
                logger.error('Erreur lors du chargement du scénario:', err);
                const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchScenario();
    }, [scenarioId]);

    // Exécuter la simulation
    const runSimulation = async () => {
        setIsRunning(true);
        try {
            const response = await fetch('http://localhost:3000/api/simulations/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ scenarioId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors du démarrage de la simulation');
            }

            const result = await response.json();
            toast.success('Simulation démarrée avec succès');

            // Mettre à jour la liste des résultats
            if (scenario) {
                setScenario({
                    ...scenario,
                    results: [
                        {
                            id: result.simulationId,
                            scenarioId,
                            createdAt: new Date().toISOString(),
                            status: 'RUNNING'
                        },
                        ...(scenario.results || [])
                    ]
                });
            }
        } catch (err: unknown) {
            logger.error('Erreur lors du démarrage de la simulation:', err);
            const errorMessage = err instanceof Error ? err.message : 'Erreur lors du démarrage de la simulation';
            toast.error(errorMessage);
        } finally {
            setIsRunning(false);
        }
    };

    // Formater la date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Obtenir le statut du badge
    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'success';
            case 'RUNNING':
                return 'default';
            case 'PENDING':
                return 'secondary';
            case 'FAILED':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    // Obtenir le texte du badge pour le statut
    const getStatusBadgeText = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'Terminé';
            case 'RUNNING':
                return 'En cours';
            case 'PENDING':
                return 'En attente';
            case 'FAILED':
                return 'Échoué';
            default:
                return 'Inconnu';
        }
    };

    // Trier les résultats par date (plus récent en premier)
    const sortedResults = scenario?.results
        ? [...scenario.results].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [];

    // Filtrer les résultats selon les critères
    useEffect(() => {
        if (!scenario?.results) {
            setFilteredResults([]);
            return;
        }

        const filtered = sortedResults.filter(result => {
            // Filtrer par statut
            if (filters.statuses.length > 0 && !filters.statuses.includes(result.status)) {
                return false;
            }

            // Filtrer par seuil de score
            if (filters.scoreThreshold !== null && result.statisticsJson?.overallScore) {
                const scorePercentage = result.statisticsJson.overallScore * 100;
                if (scorePercentage < filters.scoreThreshold) {
                    return false;
                }
            }

            // Filtrer par date
            if (filters.dateRange?.from && filters.dateRange?.to) {
                const resultDate = new Date(result.createdAt);
                const fromDate = new Date(filters.dateRange.from);
                const toDate = new Date(filters.dateRange.to);

                // Réinitialiser les heures pour comparer seulement les dates
                fromDate.setHours(0, 0, 0, 0);
                toDate.setHours(23, 59, 59, 999);

                if (resultDate < fromDate || resultDate > toDate) {
                    return false;
                }
            }

            // Pour les autres filtres (serviceIds, userIds, resourceIds), nous aurions besoin
            // que ces informations soient disponibles dans le résultat de simulation
            // Ce qui n'est pas le cas actuellement dans notre template de données

            return true;
        });

        setFilteredResults(filtered);
    }, [filters, scenario, sortedResults]);

    // Gestionnaire pour appliquer les filtres
    const handleApplyFilters = (newFilters: FilterOptions) => {
        setIsApplyingFilters(true);

        setTimeout(() => {
            setFilters(newFilters);
            setIsApplyingFilters(false);
            // Si nous sommes sur un autre onglet, basculer vers l'onglet des résultats
            if (activeTab !== 'results') {
                setActiveTab('results');
            }
        }, 500); // Simulation d'un petit délai pour l'effet visuel
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[70vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p>Chargement des données du scénario...</p>
            </div>
        );
    }

    if (error || !scenario) {
        return (
            <div className="container mx-auto p-4">
                <div className="mb-4">
                    <Link href="/admin/simulations" className="inline-flex items-center text-sm text-primary hover:underline">
                        <ArrowLeftIcon className="mr-2 h-4 w-4" />
                        Retour à la liste des simulations
                    </Link>
                </div>
                <Alert variant="destructive" className="my-4">
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>
                        {error || "Impossible de charger le scénario demandé."}
                    </AlertDescription>
                </Alert>
                <Button onClick={() => router.back()}>Retour</Button>
            </div>
        );
    }

    // Extraire les dates du scénario (qui peuvent être stockées dans parametersJson)
    const startDate = scenario.parametersJson?.startDate
        ? new Date(scenario.parametersJson.startDate)
        : null;
    const endDate = scenario.parametersJson?.endDate
        ? new Date(scenario.parametersJson.endDate)
        : null;

    const dateRange = startDate && endDate
        ? `${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}`
        : "Non spécifiée";

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-6">
                <Link href="/admin/simulations" className="inline-flex items-center text-sm text-primary hover:underline mb-2">
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Retour à la liste des simulations
                </Link>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{scenario.name}</h1>
                        {scenario.description && (
                            <p className="text-muted-foreground mb-2">{scenario.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                            <span className="inline-flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Période: {dateRange}
                            </span>
                            {scenario.createdAt && (
                                <span className="inline-flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    Créé le: {formatDate(scenario.createdAt)}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0 space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/admin/simulations/${scenarioId}/edit`)}
                        >
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Modifier
                        </Button>
                        <Button
                            onClick={runSimulation}
                            disabled={isRunning}
                        >
                            {isRunning ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Démarrage...
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Exécuter
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                    <TabsTrigger value="results">Résultats ({sortedResults.length})</TabsTrigger>
                    <TabsTrigger value="filters">
                        <Filter className="h-4 w-4 mr-2" />
                        Filtres avancés
                    </TabsTrigger>
                    <TabsTrigger value="settings">Paramètres</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informations générales</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="space-y-4">
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Période</dt>
                                        <dd className="mt-1">{dateRange}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Modèle utilisé</dt>
                                        <dd className="mt-1">
                                            {scenario.template ? (
                                                <Link
                                                    href={`/admin/simulations/templates/${scenario.template.id}`}
                                                    className="text-primary hover:underline"
                                                >
                                                    {scenario.template.name}
                                                </Link>
                                            ) : (
                                                <span className="text-muted-foreground italic">Aucun template</span>
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Créé par</dt>
                                        <dd className="mt-1">
                                            {scenario.createdBy?.name || <span className="text-muted-foreground italic">Utilisateur inconnu</span>}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Date de création</dt>
                                        <dd className="mt-1">{formatDate(scenario.createdAt)}</dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Résultats récents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sortedResults.length === 0 ? (
                                    <div className="text-center py-6">
                                        <p className="text-muted-foreground mb-4">Aucun résultat disponible</p>
                                        <Button size="sm" onClick={runSimulation} disabled={isRunning}>
                                            <Play className="h-4 w-4 mr-2" />
                                            Exécuter la simulation
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {sortedResults.slice(0, 3).map(result => (
                                            <div
                                                key={result.id}
                                                className="p-3 border rounded-md flex justify-between items-center"
                                            >
                                                <div>
                                                    <div className="font-medium">
                                                        Exécution du {formatDate(result.createdAt)}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {result.executionTime
                                                            ? `Durée: ${(result.executionTime / 1000).toFixed(1)}s`
                                                            : 'Durée: -'
                                                        }
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={getStatusBadgeVariant(result.status)}>
                                                        {getStatusBadgeText(result.status)}
                                                    </Badge>
                                                    {result.status === 'COMPLETED' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => router.push(`/admin/simulations/${scenarioId}/results/${result.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {sortedResults.length > 3 && (
                                            <div className="text-center mt-2">
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    onClick={() => setActiveTab('results')}
                                                >
                                                    Voir tous les résultats ({sortedResults.length})
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="results">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Historique des résultats</span>
                                {(filters.dateRange || filters.serviceIds.length > 0 ||
                                    filters.userIds.length > 0 || filters.resourceIds.length > 0 ||
                                    filters.scoreThreshold !== null ||
                                    (filters.statuses.length > 0 && filters.statuses.length < 4)) && (
                                        <Badge variant="outline" className="ml-2 cursor-pointer" onClick={() => setActiveTab('filters')}>
                                            <Filter className="h-3 w-3 mr-1" />
                                            Filtres actifs
                                        </Badge>
                                    )}
                            </CardTitle>
                            <CardDescription>
                                {filteredResults.length === sortedResults.length
                                    ? 'Liste complète des exécutions de ce scénario'
                                    : `${filteredResults.length} résultat(s) sur ${sortedResults.length} après filtrage`
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {sortedResults.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-muted-foreground mb-4">Aucun résultat disponible</p>
                                    <Button onClick={runSimulation} disabled={isRunning}>
                                        <Play className="h-4 w-4 mr-2" />
                                        Exécuter la simulation
                                    </Button>
                                </div>
                            ) : filteredResults.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-muted-foreground mb-4">Aucun résultat ne correspond aux filtres appliqués</p>
                                    <Button variant="outline" onClick={() => setActiveTab('filters')}>
                                        <Filter className="h-4 w-4 mr-2" />
                                        Modifier les filtres
                                    </Button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Date d'exécution
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Statut
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Durée
                                                </th>
                                                <th className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                                                    Score
                                                </th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredResults.map((result, index) => (
                                                <tr key={result.id} className={index % 2 === 0 ? 'bg-white' : 'bg-muted/20'}>
                                                    <td className="px-4 py-2 whitespace-nowrap">
                                                        <div className="text-sm">{formatDate(result.createdAt)}</div>
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap">
                                                        <Badge variant={getStatusBadgeVariant(result.status)}>
                                                            {getStatusBadgeText(result.status)}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap">
                                                        <div className="text-sm">
                                                            {result.executionTime
                                                                ? `${(result.executionTime / 1000).toFixed(2)}s`
                                                                : '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-center">
                                                        <div className="text-sm">
                                                            {result.statisticsJson?.overallScore
                                                                ? (result.statisticsJson.overallScore * 100).toFixed(0) + '%'
                                                                : '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {result.status === 'COMPLETED' && (
                                                                <>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => router.push(`/admin/simulations/${scenarioId}/results/${result.id}`)}
                                                                    >
                                                                        <Eye className="h-4 w-4 mr-1" />
                                                                        Détails
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                    >
                                                                        <Download className="h-4 w-4 mr-1" />
                                                                        Exporter
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="filters">
                    <AdvancedFilters
                        onApplyFilters={handleApplyFilters}
                        initialFilters={filters}
                        scenarioId={scenarioId}
                        isLoading={isApplyingFilters}
                    />
                </TabsContent>

                <TabsContent value="settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>Paramètres du scénario</CardTitle>
                            <CardDescription>
                                Consultez les paramètres détaillés de ce scénario
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium mb-2">Période</h3>
                                    <p className="text-muted-foreground mb-2">
                                        {dateRange}
                                    </p>
                                </div>

                                <Separator />

                                <div>
                                    <h3 className="text-lg font-medium mb-2">Modèle</h3>
                                    <p className="mb-2">
                                        {scenario.template ? (
                                            <Link
                                                href={`/admin/simulations/templates/${scenario.template.id}`}
                                                className="text-primary hover:underline"
                                            >
                                                {scenario.template.name}
                                            </Link>
                                        ) : (
                                            <span className="text-muted-foreground italic">Aucun template</span>
                                        )}
                                    </p>
                                </div>

                                <Separator />

                                <div>
                                    <h3 className="text-lg font-medium mb-2">Paramètres avancés</h3>
                                    <div className="bg-muted rounded-md p-4 overflow-auto max-h-[300px]">
                                        <pre className="text-xs">
                                            {JSON.stringify(scenario.parametersJson, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <div className="flex gap-2 w-full justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(`/admin/simulations/${scenarioId}/edit`)}
                                >
                                    <PencilIcon className="h-4 w-4 mr-2" />
                                    Modifier
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 