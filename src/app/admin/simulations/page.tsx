"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Button from '@/components/ui/button';
import { PlayIcon, EyeIcon, PencilIcon, TrashIcon, PlusCircleIcon, Loader2, AlertTriangleIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ScenarioFromAPI {
    id: string;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
    createdById: string;
    createdBy?: { name?: string | null; } | null;
    _count?: { results: number } | null;
    latestResultStatus?: string | null;
    latestResultId?: string | null;
}

export default function SimulationScenariosPage() {
    const [scenarios, setScenarios] = useState<ScenarioFromAPI[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const fetchScenarios = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/simulations', { cache: 'no-store' });
            if (!res.ok) {
                let errorMessage = "Échec de la récupération des scénarios";
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = `Erreur ${res.status}: ${res.statusText}`;
                }
                throw new Error(errorMessage);
            }
            const data = await res.json();
            const mappedData = data.map((scenario: any) => ({
                ...scenario,
                latestResultStatus: scenario.results?.[0]?.status,
                latestResultId: scenario.results?.[0]?.id,
            }));
            setScenarios(mappedData);
        } catch (err: any) {
            setError(err.message);
            toast.error("Erreur lors de la récupération des scénarios: " + err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchScenarios();
    }, [fetchScenarios]);

    const handleRunSimulation = async (scenarioId: string) => {
        toast.info("Lancement de la simulation...");
        try {
            const res = await fetch(`/api/simulations/${scenarioId}/run`, { method: 'POST' });
            if (!res.ok) {
                let errorMessage = "Échec du lancement de la simulation";
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = `Erreur ${res.status}: ${res.statusText}`;
                }
                throw new Error(errorMessage);
            }
            const result = await res.json();
            toast.success(`Simulation "${result.simulationScenario?.name || 'sans nom'}" lancée. Statut: ${result.status}`);
            fetchScenarios();
        } catch (err: any) {
            toast.error("Erreur lors du lancement de la simulation: " + err.message);
        }
    };

    const handleViewResults = (scenarioId: string, latestResultId?: string | null) => {
        if (latestResultId) {
            router.push(`/admin/simulations/${scenarioId}/results/${latestResultId}`);
        } else {
            const scenario = scenarios.find(s => s.id === scenarioId);
            if (scenario && (scenario._count?.results || 0) > 0) {
                toast.info("Ce scénario a des résultats mais le plus récent n'a pas pu être identifié directement. Consultation non implémentée.");
            } else {
                toast.info("Aucun résultat trouvé pour ce scénario. Veuillez d'abord lancer une simulation.");
            }
        }
    };

    const handleEditScenario = (scenarioId: string) => {
        router.push(`/admin/simulations/${scenarioId}/edit`);
    };

    const handleDeleteScenario = async (scenarioId: string) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce scénario ? Cette action est irréversible.")) {
            return;
        }
        toast.info("Suppression du scénario...");
        try {
            const res = await fetch(`/api/simulations/${scenarioId}`, { method: 'DELETE' });
            if (!res.ok) {
                let errorMessage = "Échec de la suppression du scénario";
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = `Erreur ${res.status}: ${res.statusText}`;
                }
                throw new Error(errorMessage);
            }
            toast.success("Scénario supprimé avec succès.");
            fetchScenarios();
        } catch (err: any) {
            toast.error("Erreur lors de la suppression du scénario: " + err.message);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-lg">Chargement des scénarios...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-8 text-center">
                <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-500 text-lg">Erreur: {error}</p>
                <Button onClick={fetchScenarios} className="mt-4">
                    Réessayer
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Scénarios de Simulation</h1>
                <Link href="/admin/simulations/new" passHref>
                    <Button variant="default" size="lg" className="flex items-center gap-2">
                        <PlusCircleIcon className="h-5 w-5" />
                        Créer un Scénario
                    </Button>
                </Link>
            </div>

            {scenarios.length === 0 ? (
                <div className="text-center py-10 bg-white shadow-md rounded-lg">
                    <PlusCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Aucun scénario trouvé</h2>
                    <p className="text-gray-500 mb-6">Commencez par créer votre premier scénario de simulation.</p>
                    <Link href="/admin/simulations/new" passHref>
                        <Button variant="default">Créer un Scénario</Button>
                    </Link>
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px] whitespace-nowrap">Nom</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-center whitespace-nowrap">Créé le</TableHead>
                                <TableHead className="text-center whitespace-nowrap">Créé par</TableHead>
                                <TableHead className="text-center whitespace-nowrap">Nb. Résultats</TableHead>
                                <TableHead className="text-center whitespace-nowrap">Dernier Statut</TableHead>
                                <TableHead className="text-right w-[300px] whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {scenarios.map((scenario) => (
                                <TableRow key={scenario.id}>
                                    <TableCell className="font-medium">{scenario.name}</TableCell>
                                    <TableCell className="text-sm text-gray-600 truncate max-w-xs">{scenario.description || '-'}</TableCell>
                                    <TableCell className="text-center text-sm text-gray-600">{new Date(scenario.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-center text-sm text-gray-600">
                                        {scenario.createdBy?.name || 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-center text-sm text-gray-600">{scenario._count?.results || 0}</TableCell>
                                    <TableCell className="text-center text-sm">
                                        {scenario.latestResultStatus ? (
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${scenario.latestResultStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                scenario.latestResultStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                    scenario.latestResultStatus === 'RUNNING' ? 'bg-blue-100 text-blue-700' :
                                                        scenario.latestResultStatus === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {scenario.latestResultStatus}
                                            </span>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="outline" size="sm" onClick={() => handleRunSimulation(scenario.id)} title="Lancer la simulation">
                                            <PlayIcon className="h-4 w-4 mr-1" /> Lancer
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewResults(scenario.id, scenario.latestResultId)}
                                            disabled={!(scenario.latestResultId || (scenario._count?.results || 0) > 0)}
                                            title="Voir les résultats"
                                        >
                                            <EyeIcon className="h-4 w-4 mr-1" /> Résultats
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleEditScenario(scenario.id)} title="Modifier">
                                            <PencilIcon className="h-4 w-4" />
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteScenario(scenario.id)} title="Supprimer">
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
} 