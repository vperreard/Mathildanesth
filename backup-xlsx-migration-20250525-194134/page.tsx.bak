"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, Loader2, AlertTriangleIcon, FileJsonIcon, BarChartIcon, AlertCircleIcon, CheckCircle2Icon, ZapIcon, HourglassIcon, UserIcon, CalendarIcon, FileTextIcon, DownloadIcon, FileIcon, ClipboardCheckIcon, BarChart3Icon } from 'lucide-react';
import Button from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { SimulationStatus } from '@prisma/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { exportSimulationResults } from '@/services/exportService';
import { ApplySimulationModal } from '@/components/simulations/ApplySimulationModal';
import AdvancedFilters, { FilterState } from '@/components/ui/AdvancedFilters';

// Interface pour le résultat retourné par l'API
interface SimulationResultData {
    id: string;
    status: SimulationStatus;
    createdAt: string;
    updatedAt: string;
    parametersJson?: Record<string, unknown> | string | null;
    generatedPlanningData?: unknown | null;
    statisticsJson?: Record<string, unknown> | string | null;
    conflictAlertsJson?: unknown[] | string | null;
    comparisonDataJson?: unknown | string | null;
    errorMessage?: string | null;
    scenarioName?: string;
    scenarioDescription?: string;
}

interface ConflictAlert {
    type: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    affectedUsers?: string[];
    date?: string;
    resolution?: string;
}

interface Statistic {
    name: string;
    value: number;
    category: string;
    unit?: string;
}

interface UserAssignment {
    userId: string;
    userName: string;
    assignments: number;
    hours: number;
    conflicts: number;
}

const statusConfig = {
    PENDING: { label: 'En attente', icon: HourglassIcon, color: 'bg-yellow-500', textColor: 'text-yellow-500' },
    RUNNING: { label: 'En cours', icon: ZapIcon, color: 'bg-blue-500', textColor: 'text-blue-500' },
    COMPLETED: { label: 'Terminée', icon: CheckCircle2Icon, color: 'bg-green-500', textColor: 'text-green-500' },
    FAILED: { label: 'Échouée', icon: AlertCircleIcon, color: 'bg-red-500', textColor: 'text-red-500' },
};

const severityColors = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-blue-100 text-blue-800 border-blue-300',
};

export default function SimulationResultPage() {
    const router = useRouter();
    const params = useParams();
    const scenarioId = typeof params?.scenarioId === 'string' ? params.scenarioId : null;
    const resultId = typeof params?.resultId === 'string' ? params.resultId : null;

    const [result, setResult] = useState<SimulationResultData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('summary');
    const [showRawJson, setShowRawJson] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

    // Données traitées pour les visuels
    const [statistics, setStatistics] = useState<Statistic[]>([]);
    const [conflicts, setConflicts] = useState<ConflictAlert[]>([]);
    const [userAssignments, setUserAssignments] = useState<UserAssignment[]>([]);
    const [periodCoverage, setPeriodCoverage] = useState<number>(0);

    // Ajout du state pour le modal d'application
    const [showApplyModal, setShowApplyModal] = useState(false);

    // Ajouter la fonction handleFilterChange avant le return du composant principal
    const [, setFilteredData] = useState(result);

    const handleFilterChange = (filters: FilterState) => {
        // console.log('Nouveaux filtres appliqués:', filters);
        // Implémenter la logique de filtrage des données
        // Cette fonction sera appelée chaque fois que les filtres sont modifiés

        // Exemple simplifié de filtrage
        if (!result) return;

        const filtered = { ...result };

        // Filtrer par période
        if (filters.dateRange?.from) {
            // Logique de filtrage par date
        }

        // Filtrer par catégorie
        if (filters.selectedCategories.length > 0) {
            // Logique de filtrage par catégorie
        }

        // Filtrer par personnel
        if (filters.selectedUsers.length > 0) {
            // Logique de filtrage par personnel
        }

        // Appliquer le seuil
        if (filters.threshold > 0) {
            // Logique d'application du seuil
        }

        setFilteredData(filtered);
    };

    // Fonction pour démarrer l'auto-refresh
    const startAutoRefresh = useCallback(() => {
        // Arrêter tout intervalle existant d'abord
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }

        // Créer un nouvel intervalle qui s'exécute toutes les 5 secondes
        const interval = setInterval(() => {
            fetchResultData();
        }, 5000);

        setRefreshInterval(interval);
    }, [refreshInterval, fetchResultData]);

    // Fonction pour arrêter l'auto-refresh
    const stopAutoRefresh = useCallback(() => {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            setRefreshInterval(null);
        }
    }, [refreshInterval]);

    const fetchResultData = useCallback(async () => {
        if (!scenarioId || !resultId) {
            setError("ID de scénario ou de résultat manquant.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/simulations/${scenarioId}/results/${resultId}`);
            if (!res.ok) {
                let errorMessage = "Échec de la récupération des résultats de la simulation";
                if (res.status === 404) errorMessage = "Résultat de simulation non trouvé.";
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = `Erreur ${res.status}: ${res.statusText}`;
                }
                throw new Error(errorMessage);
            }
            const data: SimulationResultData = await res.json();
            setResult(data);

            // Traitement des données pour les visualisations
            processData(data);

            // Si la simulation est terminée (COMPLETED ou FAILED), arrêter l'auto-refresh
            if (data.status === 'COMPLETED' || data.status === 'FAILED') {
                stopAutoRefresh();
            } else if (data.status === 'RUNNING' || data.status === 'PENDING') {
                // Si la simulation est en cours ou en attente, s'assurer que l'auto-refresh est actif
                if (!refreshInterval) {
                    startAutoRefresh();
                }
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(errorMessage);
            toast.error("Erreur lors du chargement des résultats: " + errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [scenarioId, resultId, startAutoRefresh, stopAutoRefresh, refreshInterval]);

    // Fonction pour traiter les données
    const processData = (data: SimulationResultData) => {
        // Traitement des statistiques
        if (data.statisticsJson) {
            try {
                const stats = typeof data.statisticsJson === 'string'
                    ? JSON.parse(data.statisticsJson)
                    : data.statisticsJson;

                // Format fictif pour l'exemple - à adapter selon le format réel
                const formattedStats: Statistic[] = [];

                // Ajouter des statistiques basées sur le JSON reçu
                if (stats.totalAssignments) formattedStats.push({
                    name: 'Nombre total d\'affectations',
                    value: stats.totalAssignments,
                    category: 'Général'
                });

                if (stats.satisfactionRate) formattedStats.push({
                    name: 'Taux de satisfaction',
                    value: stats.satisfactionRate,
                    category: 'Performance',
                    unit: '%'
                });

                if (stats.coverageRate) {
                    formattedStats.push({
                        name: 'Taux de couverture',
                        value: stats.coverageRate,
                        category: 'Performance',
                        unit: '%'
                    });
                    setPeriodCoverage(stats.coverageRate);
                }

                if (stats.conflictsResolved) formattedStats.push({
                    name: 'Conflits résolus',
                    value: stats.conflictsResolved,
                    category: 'Conflits'
                });

                if (stats.conflictsUnresolved) formattedStats.push({
                    name: 'Conflits non résolus',
                    value: stats.conflictsUnresolved,
                    category: 'Conflits'
                });

                // S'il n'y a pas de données spécifiques, créer des données par défaut basées sur le nombre de conflits
                if (formattedStats.length === 0 && data.conflictAlertsJson) {
                    const conflicts = typeof data.conflictAlertsJson === 'string'
                        ? JSON.parse(data.conflictAlertsJson)
                        : data.conflictAlertsJson;

                    formattedStats.push({
                        name: 'Nombre de conflits',
                        value: Array.isArray(conflicts) ? conflicts.length : 0,
                        category: 'Conflits'
                    });
                }

                setStatistics(formattedStats);

            } catch (e) {
                console.error("Erreur lors du traitement des statistiques", e);
            }
        }

        // Traitement des alertes de conflit
        if (data.conflictAlertsJson) {
            try {
                const conflictData = typeof data.conflictAlertsJson === 'string'
                    ? JSON.parse(data.conflictAlertsJson)
                    : data.conflictAlertsJson;

                if (Array.isArray(conflictData)) {
                    setConflicts(conflictData.map(conflict => ({
                        type: conflict.type || 'Non spécifié',
                        description: conflict.description || 'Aucune description disponible',
                        severity: conflict.severity || 'medium',
                        affectedUsers: conflict.affectedUsers || [],
                        date: conflict.date,
                        resolution: conflict.resolution
                    })));
                }
            } catch (e) {
                console.error("Erreur lors du traitement des alertes de conflit", e);
            }
        }

        // Traitement des données de planning généré
        if (data.generatedPlanningData) {
            try {
                const planningData = typeof data.generatedPlanningData === 'string'
                    ? JSON.parse(data.generatedPlanningData)
                    : data.generatedPlanningData;

                // Extraction des données d'affectation des utilisateurs à partir du planning généré
                // Format fictif - à adapter en fonction de la structure réelle des données
                if (planningData.userAssignments) {
                    setUserAssignments(planningData.userAssignments);
                } else if (planningData.assignments) {
                    // Créer un objet pour agréger les données par utilisateur
                    const userMap: Record<string, UserAssignment> = {};

                    planningData.assignments.forEach((assignment: { userId: string; userName?: string; [key: string]: unknown }) => {
                        if (!userMap[assignment.userId]) {
                            userMap[assignment.userId] = {
                                userId: assignment.userId,
                                userName: assignment.userName || `Utilisateur ${assignment.userId}`,
                                assignments: 0,
                                hours: 0,
                                conflicts: 0
                            };
                        }

                        userMap[assignment.userId].assignments += 1;

                        if (assignment.durationHours) {
                            userMap[assignment.userId].hours += assignment.durationHours;
                        }

                        if (assignment.hasConflict) {
                            userMap[assignment.userId].conflicts += 1;
                        }
                    });

                    setUserAssignments(Object.values(userMap));
                }
            } catch (e) {
                console.error("Erreur lors du traitement des données de planning", e);
            }
        }
    };

    // Effet pour démarrer/arrêter l'auto-refresh en fonction de l'état
    useEffect(() => {
        if (result) {
            if (result.status === 'RUNNING' || result.status === 'PENDING') {
                startAutoRefresh();
            } else {
                stopAutoRefresh();
            }
        }

        // Nettoyage lors du démontage du composant
        return () => {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, [result, startAutoRefresh, stopAutoRefresh, refreshInterval]);

    useEffect(() => {
        fetchResultData();
    }, [fetchResultData]);

    const renderRawJsonData = (jsonData: unknown, title: string) => {
        if (!jsonData) return <p className="text-sm text-gray-500">Aucune donnée disponible.</p>;
        let dataToDisplay = jsonData;
        if (typeof jsonData === 'string') {
            try {
                dataToDisplay = JSON.parse(jsonData);
            } catch (e) {
                return <p className="text-sm text-red-500">Données JSON invalides.</p>;
            }
        }
        return (
            <Card className="mt-4">
                <CardHeader className="pb-2">
                    <CardTitle className="text-md flex items-center"><FileJsonIcon className="w-4 h-4 mr-2" />{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-x-auto">
                        {JSON.stringify(dataToDisplay, null, 2)}
                    </pre>
                </CardContent>
            </Card>
        );
    };

    // Téléchargement des données en JSON
    const handleDownloadJson = () => {
        if (!result) return;

        const jsonData = JSON.stringify(result, null, 2);
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `simulation-result-${result.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Téléchargement du fichier JSON démarré");
    };

    // Fonctions pour les exports
    const handleExportPDF = async () => {
        if (!result) return;

        toast.info("Préparation de l'export PDF...");

        try {
            // Préparation des données pour l'export
            const exportData = {
                id: result.id,
                scenarioName: result.scenarioName || 'Scénario sans nom',
                scenarioDescription: result.scenarioDescription,
                createdAt: result.createdAt,
                status: result.status,
                statistics: statistics.reduce((acc, stat) => {
                    acc[stat.name] = stat.value + (stat.unit || '');
                    return acc;
                }, {} as Record<string, string>),
                conflicts,
                userAssignments,
                periodCoverage
            };

            const blob = await exportSimulationResults(exportData, {
                format: 'pdf',
                fileName: `simulation_${result.scenarioName?.replace(/\s+/g, '_') || 'scenario'}_${result.id.slice(0, 8)}.pdf`
            });

            // Télécharger le PDF
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `simulation_${result.scenarioName?.replace(/\s+/g, '_') || 'scenario'}_${result.id.slice(0, 8)}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Export PDF généré avec succès");
        } catch (error) {
            console.error('Erreur lors de l\'export PDF:', error);
            toast.error("Échec de l'export PDF");
        }
    };

    const handleExportExcel = async () => {
        if (!result) return;

        toast.info("Préparation de l'export Excel...");

        try {
            // Préparation des données pour l'export
            const exportData = {
                id: result.id,
                scenarioName: result.scenarioName || 'Scénario sans nom',
                scenarioDescription: result.scenarioDescription,
                createdAt: result.createdAt,
                status: result.status,
                statistics: statistics.reduce((acc, stat) => {
                    acc[stat.name] = stat.value + (stat.unit || '');
                    return acc;
                }, {} as Record<string, string>),
                conflicts,
                userAssignments,
                periodCoverage
            };

            const blob = await exportSimulationResults(exportData, {
                format: 'excel',
                fileName: `simulation_${result.scenarioName?.replace(/\s+/g, '_') || 'scenario'}_${result.id.slice(0, 8)}.xlsx`
            });

            // Télécharger l'Excel
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `simulation_${result.scenarioName?.replace(/\s+/g, '_') || 'scenario'}_${result.id.slice(0, 8)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Export Excel généré avec succès");
        } catch (error) {
            console.error('Erreur lors de l\'export Excel:', error);
            toast.error("Échec de l'export Excel");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-lg">Chargement des résultats...</p>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="container mx-auto py-8 text-center">
                <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-500 text-lg">{error || "Résultat non trouvé."}</p>
                <Link href={`/admin/simulations`} passHref>
                    <Button variant="outline" className="mt-4 mr-2">
                        <ArrowLeftIcon className="mr-2 h-4 w-4" /> Retour à la liste des scénarios
                    </Button>
                </Link>
                {scenarioId && (
                    <Link href={`/admin/simulations/${scenarioId}/edit`} passHref>
                        <Button variant="outline" className="mt-4">
                            Modifier le scénario
                        </Button>
                    </Link>
                )}
            </div>
        );
    }

    const currentStatusConfig = statusConfig[result.status] || statusConfig.PENDING;
    const CurrentStatusIcon = currentStatusConfig.icon;

    return (
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 max-w-6xl">
            <Link href={`/admin/simulations`} className="inline-flex items-center text-sm text-primary hover:underline mb-4">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Retour à la liste des scénarios
            </Link>

            <Card className="mb-6">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl mb-1">Résultats de la Simulation</CardTitle>
                            {result.scenarioName && <CardDescription>Pour le scénario : "{result.scenarioName}"</CardDescription>}
                        </div>
                        <Badge variant="outline" className={`text-sm ${currentStatusConfig.color} border-${currentStatusConfig.color.replace('bg-', '')} text-white`}>
                            <CurrentStatusIcon className="w-4 h-4 mr-2" />
                            {currentStatusConfig.label}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><strong>ID Résultat:</strong> {result.id}</div>
                    <div><strong>Date de création:</strong> {new Date(result.createdAt).toLocaleString()}</div>
                    <div><strong>Dernière MàJ:</strong> {new Date(result.updatedAt).toLocaleString()}</div>
                    {result.scenarioDescription && <div className="md:col-span-2"><strong>Description du scénario:</strong> {result.scenarioDescription}</div>}
                    {result.errorMessage && (
                        <div className="md:col-span-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                            <strong className="flex items-center"><AlertCircleIcon className="w-4 h-4 mr-2" />Erreur d'exécution:</strong> {result.errorMessage}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex items-center justify-end space-x-2">
                    {result.status === 'COMPLETED' && (
                        <>
                            <Button variant="outline" size="sm" onClick={handleExportPDF} className="flex items-center">
                                <FileTextIcon className="w-4 h-4 mr-2" /> Export PDF
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleExportExcel} className="flex items-center">
                                <FileIcon className="w-4 h-4 mr-2" /> Export Excel
                            </Button>
                            <Button variant="primary" size="sm" onClick={() => setShowApplyModal(true)} className="flex items-center">
                                <ClipboardCheckIcon className="w-4 h-4 mr-2" /> Appliquer au planning
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/admin/simulations/advanced-visualizations?resultId=${result.id}&scenarioId=${params.scenarioId as string}`)}
                                className="flex items-center"
                            >
                                <BarChart3Icon className="w-4 h-4 mr-2" /> Visualisations avancées
                            </Button>
                        </>
                    )}
                    <Button variant="outline" size="sm" onClick={handleDownloadJson} className="flex items-center">
                        <DownloadIcon className="w-4 h-4 mr-2" /> Télécharger JSON
                    </Button>
                </CardFooter>
            </Card>

            {result.status === 'COMPLETED' && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-4 mb-4">
                        <TabsTrigger value="summary" className="flex items-center">
                            <BarChartIcon className="w-4 h-4 mr-2" /> Résumé
                        </TabsTrigger>
                        <TabsTrigger value="conflicts" className="flex items-center">
                            <AlertTriangleIcon className="w-4 h-4 mr-2" /> Conflits
                        </TabsTrigger>
                        <TabsTrigger value="users" className="flex items-center">
                            <UserIcon className="w-4 h-4 mr-2" /> Participants
                        </TabsTrigger>
                        <TabsTrigger value="details" className="flex items-center">
                            <FileTextIcon className="w-4 h-4 mr-2" /> Détails
                        </TabsTrigger>
                    </TabsList>

                    {/* Onglet Résumé */}
                    <TabsContent value="summary" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Statistiques clés</CardTitle>
                                <CardDescription>Vue d'ensemble des résultats de la simulation</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Taux de couverture */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <h3 className="text-sm font-medium">Taux de couverture de la période</h3>
                                        <span className="text-sm font-semibold">{periodCoverage}%</span>
                                    </div>
                                    <Progress value={periodCoverage} className="h-2" />
                                </div>

                                <Separator />

                                {/* Statistiques en grille */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {statistics.length > 0 ? (
                                        statistics.map((stat, index) => (
                                            <Card key={index} className="border bg-gray-50">
                                                <CardContent className="p-4">
                                                    <div className="flex flex-col items-center text-center">
                                                        <span className="text-xs text-gray-500 uppercase">{stat.category}</span>
                                                        <span className="text-3xl font-bold mt-2">
                                                            {stat.value}{stat.unit}
                                                        </span>
                                                        <span className="text-sm mt-1">{stat.name}</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <p className="col-span-full text-center text-gray-500 py-6">
                                            Aucune statistique disponible pour cette simulation.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Onglet Conflits */}
                    <TabsContent value="conflicts" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Alertes de conflits</CardTitle>
                                <CardDescription>Détail des conflits détectés durant la simulation</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {conflicts.length > 0 ? (
                                    <div className="space-y-4">
                                        {conflicts.map((conflict, index) => (
                                            <div key={index} className={`border rounded-md p-4 ${severityColors[conflict.severity]}`}>
                                                <div className="flex flex-col space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="text-sm font-semibold">{conflict.type}</h3>
                                                        <Badge variant="outline" className={severityColors[conflict.severity]}>
                                                            {conflict.severity === 'high' ? 'Élevée' : conflict.severity === 'medium' ? 'Moyenne' : 'Faible'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm">{conflict.description}</p>

                                                    {conflict.date && (
                                                        <div className="flex items-center text-xs text-gray-600">
                                                            <CalendarIcon className="w-3 h-3 mr-1" /> Date: {conflict.date}
                                                        </div>
                                                    )}

                                                    {conflict.affectedUsers && conflict.affectedUsers.length > 0 && (
                                                        <div className="mt-2">
                                                            <span className="text-xs font-medium">Utilisateurs affectés:</span>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {conflict.affectedUsers.map((user, i) => (
                                                                    <Badge key={i} variant="secondary" className="text-xs">
                                                                        {user}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {conflict.resolution && (
                                                        <div className="mt-2">
                                                            <span className="text-xs font-medium">Résolution suggérée:</span>
                                                            <p className="text-xs mt-1">{conflict.resolution}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <CheckCircle2Icon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                        <p className="text-lg font-medium text-gray-700">Aucun conflit détecté</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            La simulation n'a rencontré aucun conflit dans le planning généré.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Onglet Participants */}
                    <TabsContent value="users" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Affectations par utilisateur</CardTitle>
                                <CardDescription>Répartition et statistiques par participant</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {userAssignments.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nom</TableHead>
                                                <TableHead className="text-right">Affectations</TableHead>
                                                <TableHead className="text-right">Heures</TableHead>
                                                <TableHead className="text-right">Conflits</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {userAssignments.map((user) => (
                                                <TableRow key={user.userId}>
                                                    <TableCell className="font-medium">{user.userName}</TableCell>
                                                    <TableCell className="text-right">{user.assignments}</TableCell>
                                                    <TableCell className="text-right">{user.hours.toFixed(1)}h</TableCell>
                                                    <TableCell className="text-right">
                                                        {user.conflicts > 0 ? (
                                                            <Badge variant="destructive">{user.conflicts}</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">0</Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-8">
                                        <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">
                                            Aucune donnée d'affectation des utilisateurs disponible.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Onglet Détails */}
                    <TabsContent value="details" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>Données techniques</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowRawJson(!showRawJson)}
                                    >
                                        {showRawJson ? "Masquer JSON brut" : "Afficher JSON brut"}
                                    </Button>
                                </div>
                                <CardDescription>Paramètres et données détaillées de la simulation</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Collapsible open={true} className="mb-4">
                                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md p-2 font-medium hover:bg-gray-50">
                                        <div className="flex items-center">
                                            <FileTextIcon className="w-4 h-4 mr-2" />
                                            <span>Paramètres du scénario</span>
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="p-2">
                                        {result.parametersJson ? (
                                            <div className="rounded-md bg-gray-50 p-3 text-sm">
                                                <dl className="space-y-2">
                                                    {typeof result.parametersJson === 'string'
                                                        ? JSON.parse(result.parametersJson)
                                                        : Object.entries(result.parametersJson || {}).map(([key, value]) => (
                                                            <div key={key} className="grid grid-cols-3 gap-2">
                                                                <dt className="font-medium text-gray-700">{key}:</dt>
                                                                <dd className="col-span-2">
                                                                    {typeof value === 'object'
                                                                        ? JSON.stringify(value)
                                                                        : String(value)
                                                                    }
                                                                </dd>
                                                            </div>
                                                        ))}
                                                </dl>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">Aucun paramètre disponible</p>
                                        )}
                                    </CollapsibleContent>
                                </Collapsible>

                                {showRawJson && (
                                    <div className="mt-6 space-y-6">
                                        <Separator className="my-6" />
                                        <h3 className="text-lg font-medium mb-2">Données JSON brutes</h3>
                                        {renderRawJsonData(result.statisticsJson, "Statistiques de la simulation")}
                                        {renderRawJsonData(result.conflictAlertsJson, "Alertes de conflit")}
                                        {renderRawJsonData(result.generatedPlanningData, "Données du planning généré")}
                                        {renderRawJsonData(result.comparisonDataJson, "Données de comparaison")}
                                        {renderRawJsonData(result.parametersJson, "Paramètres du scénario")}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}

            {result.status !== 'COMPLETED' && (
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle className="text-md flex items-center">
                            {result.status === 'PENDING' ? <HourglassIcon className="w-4 h-4 mr-2" /> :
                                result.status === 'RUNNING' ? <ZapIcon className="w-4 h-4 mr-2" /> :
                                    <AlertCircleIcon className="w-4 h-4 mr-2" />}
                            Statut: {currentStatusConfig.label}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {result.status === 'PENDING' && (
                            <p className="text-sm text-gray-600">
                                La simulation est en attente de traitement. Veuillez revenir ultérieurement pour consulter les résultats.
                            </p>
                        )}
                        {result.status === 'RUNNING' && (
                            <>
                                <p className="text-sm text-gray-600 mb-4">
                                    La simulation est en cours d'exécution. Cette page se rafraîchit automatiquement toutes les 5 secondes.
                                </p>
                                <div className="flex flex-col items-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                    <p className="text-sm text-gray-500">Traitement en cours...</p>
                                </div>
                            </>
                        )}
                        {result.status === 'FAILED' && result.errorMessage && (
                            <div className="p-4 bg-red-50 rounded-md text-red-700">
                                <p className="font-medium mb-2">Message d'erreur:</p>
                                <p className="text-sm">{result.errorMessage}</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                        {result.status === 'FAILED' && (
                            <Button variant="outline" onClick={() => handleRunSimulation(scenarioId || '')}>
                                <ZapIcon className="w-4 h-4 mr-2" /> Relancer la simulation
                            </Button>
                        )}
                        {renderRawJsonData(result.parametersJson, "Paramètres du scénario utilisés pour cette exécution")}
                    </CardFooter>
                </Card>
            )}

            {/* Modal d'application au planning réel */}
            {result && showApplyModal && (
                <ApplySimulationModal
                    isOpen={showApplyModal}
                    onClose={() => setShowApplyModal(false)}
                    simulationResult={{
                        id: result.id,
                        scenarioId: params.scenarioId as string,
                        scenarioName: result.scenarioName,
                        status: result.status
                    }}
                    onSuccess={() => {
                        toast.success('Application de la simulation réussie');
                    }}
                />
            )}

            <div className="mb-6">
                <AdvancedFilters
                    onFilterChange={handleFilterChange}
                    dateRangeOptions={{
                        label: 'Période d\'analyse',
                        enabled: true
                    }}
                    categoryOptions={{
                        label: 'Catégories d\'affectation',
                        enabled: true,
                        options: [
                            { id: 'morning', label: 'Matin', value: 'morning' },
                            { id: 'afternoon', label: 'Après-midi', value: 'afternoon' },
                            { id: 'night', label: 'Nuit', value: 'night' },
                            { id: 'weekend', label: 'Week-end', value: 'weekend' },
                            { id: 'holiday', label: 'Jours fériés', value: 'holiday' }
                        ]
                    }}
                    userOptions={{
                        label: 'Personnel',
                        enabled: result?.generatedPlanningData?.userAssignments?.length > 0,
                        options: result?.generatedPlanningData?.userAssignments?.map(staff => ({
                            id: staff.userId,
                            label: staff.userName,
                            value: staff.userId,
                            group: staff.role
                        })) || []
                    }}
                    metricsOptions={{
                        label: 'Métriques',
                        enabled: true,
                        options: [
                            { id: 'staffingRate', label: 'Taux de couverture', value: 'staffingRate' },
                            { id: 'satisfactionRate', label: 'Satisfaction', value: 'satisfactionRate' },
                            { id: 'costEfficiency', label: 'Efficacité coût', value: 'costEfficiency' },
                            { id: 'conflictRate', label: 'Taux de conflits', value: 'conflictRate' },
                            { id: 'workloadBalance', label: 'Équilibre de charge', value: 'workloadBalance' }
                        ]
                    }}
                    thresholdOptions={{
                        label: 'Seuil de conformité',
                        enabled: true,
                        min: 0,
                        max: 100,
                        step: 5,
                        initialValue: 80
                    }}
                    saveFiltersEnabled={true}
                />
            </div>
        </div>
    );

    function handleRunSimulation(scenarioId: string) {
        toast.info("Lancement d'une nouvelle simulation...");
        fetch(`/api/simulations/${scenarioId}/run`, { method: 'POST' })
            .then(res => {
                if (!res.ok) throw new Error("Échec du lancement de la simulation");
                return res.json();
            })
            .then(data => {
                toast.success("Simulation lancée avec succès");
                // Rediriger vers le nouveau résultat ou actualiser après quelques secondes
                setTimeout(() => {
                    router.push(`/admin/simulations/${scenarioId}/results/${data.id}`);
                }, 1000);
            })
            .catch(err => {
                toast.error("Erreur lors du lancement de la simulation: " + err.message);
            });
    }
} 