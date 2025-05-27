"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, BarChart2, Calendar, Clock, Play, Eye, PencilIcon, Trash2, AlertTriangle, Copy, ArrowRightLeft, BarChart as BarChartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface SimulationTemplate {
    id: string;
    name: string;
    category?: string;
    isPublic: boolean;
    createdAt: string;
}

interface SimulationScenario {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    startDate: string;
    endDate: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    templateId?: string;
    template?: SimulationTemplate;
    results?: SimulationResult[];
}

interface SimulationResult {
    id: string;
    createdAt: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    executionTime?: number;
}

export default function SimulationsPage() {
    const router = useRouter();
    const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
    const [templates, setTemplates] = useState<SimulationTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
    const [newScenarioName, setNewScenarioName] = useState('');

    // Charger les données
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Charger les scénarios
                const scenariosResponse = await fetch('/api/simulations/scenarios');

                if (!scenariosResponse.ok) {
                    throw new Error('Erreur lors de la récupération des scénarios');
                }

                const scenariosData = await scenariosResponse.json();
                setScenarios(scenariosData.data);

                // Charger les templates
                const templatesResponse = await fetch('/api/simulations/templates');

                if (!templatesResponse.ok) {
                    throw new Error('Erreur lors de la récupération des templates');
                }

                const templatesData = await templatesResponse.json();
                setTemplates(templatesData.data);
            } catch (err: any) {
                console.error('Erreur lors du chargement des données:', err);
                setError(err.message || 'Erreur inconnue');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Supprimer un scénario
    const deleteScenario = async () => {
        if (!selectedScenarioId) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/simulations/scenarios/${selectedScenarioId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression du scénario');
            }

            // Mettre à jour la liste des scénarios
            setScenarios(scenarios.filter(scenario => scenario.id !== selectedScenarioId));
            toast.success('Scénario supprimé avec succès');
        } catch (err: any) {
            console.error('Erreur lors de la suppression:', err);
            toast.error(err.message || 'Erreur lors de la suppression');
        } finally {
            setIsDeleting(false);
            setIsDialogOpen(false);
            setSelectedScenarioId(null);
        }
    };

    // Exécuter une simulation
    const runSimulation = async (scenarioId: string) => {
        try {
            // Appeler l'API pour exécuter la simulation
            const response = await fetch('/api/simulations/run', {
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

            // Mettre à jour la liste des scénarios
            setScenarios(scenarios.map(scenario =>
                scenario.id === scenarioId
                    ? {
                        ...scenario,
                        results: [
                            {
                                id: result.simulationId,
                                createdAt: new Date().toISOString(),
                                status: 'RUNNING'
                            },
                            ...(scenario.results || [])
                        ]
                    }
                    : scenario
            ));

            toast.success('Simulation démarrée avec succès');
        } catch (err: any) {
            console.error('Erreur lors du démarrage de la simulation:', err);
            toast.error(err.message || 'Erreur lors du démarrage de la simulation');
        }
    };

    // Dupliquer un scénario
    const duplicateScenario = async () => {
        if (!selectedScenarioId || !newScenarioName.trim()) return;

        setIsDuplicating(true);
        try {
            // Appeler l'API pour dupliquer le scénario
            const response = await fetch('/api/simulations/scenarios/duplicate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sourceScenarioId: selectedScenarioId,
                    name: newScenarioName.trim()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la duplication du scénario');
            }

            const result = await response.json();

            // Ajouter le nouveau scénario à la liste
            setScenarios([result.data, ...scenarios]);
            toast.success('Scénario dupliqué avec succès');

            // Fermer la boîte de dialogue et réinitialiser les états
            setIsDuplicateDialogOpen(false);
            setNewScenarioName('');
        } catch (err: any) {
            console.error('Erreur lors de la duplication du scénario:', err);
            toast.error(err.message || 'Erreur lors de la duplication du scénario');
        } finally {
            setIsDuplicating(false);
        }
    };

    // Formater la date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Obtenir le statut de la dernière simulation
    const getLatestSimulationStatus = (scenario: SimulationScenario) => {
        if (!scenario.results || scenario.results.length === 0) {
            return null;
        }

        // Trier par date de création décroissante
        const sortedResults = [...scenario.results].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return sortedResults[0].status;
    };

    // Obtenir la couleur du badge selon le statut
    const getStatusBadgeVariant = (status: string | null) => {
        if (!status) return 'outline';

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

    // Obtenir le texte du badge selon le statut
    const getStatusBadgeText = (status: string | null) => {
        if (!status) return 'Non exécuté';

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

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[70vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p>Chargement des données...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[70vh]">
                <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Erreur</h2>
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>Réessayer</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="flex flex-wrap gap-2 items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Simulations</h1>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/admin/simulations/compare')}
                    >
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Comparer
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push('/admin/simulations/performance')}
                    >
                        <BarChart2 className="h-4 w-4 mr-2" />
                        Performance
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push('/admin/simulations/visualizations')}
                    >
                        <BarChartIcon className="h-4 w-4 mr-2" />
                        Visualisations
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push('/admin/simulations/templates')}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        Templates
                    </Button>
                    <Button
                        onClick={() => router.push('/admin/simulations/nouveau')}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau scénario
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="scenarios" className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="scenarios">
                        <Calendar className="h-4 w-4 mr-2" />
                        Scénarios
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                        <BarChart2 className="h-4 w-4 mr-2" />
                        Templates
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        <Clock className="h-4 w-4 mr-2" />
                        Historique
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="scenarios">
                    {scenarios.length === 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Aucun scénario disponible</CardTitle>
                                <CardDescription>
                                    Créez votre premier scénario de simulation pour commencer
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-center py-6">
                                <Button onClick={() => router.push('/admin/simulations/nouveau')}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Créer un scénario
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {scenarios.map(scenario => {
                                const latestStatus = getLatestSimulationStatus(scenario);

                                return (
                                    <Card key={scenario.id} className="flex flex-col">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg flex justify-between items-start">
                                                <span className="line-clamp-1">{scenario.name}</span>
                                                <Badge
                                                    variant={getStatusBadgeVariant(latestStatus)}
                                                    className="ml-2 whitespace-nowrap"
                                                >
                                                    {getStatusBadgeText(latestStatus)}
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription>
                                                {scenario.description ? (
                                                    <span className="line-clamp-2">{scenario.description}</span>
                                                ) : (
                                                    <span className="text-muted-foreground italic">Aucune description</span>
                                                )}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="py-2 flex-1">
                                            <div className="text-sm space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Période:</span>
                                                    <span>
                                                        {formatDate(scenario.startDate)} - {formatDate(scenario.endDate)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Template:</span>
                                                    <span>
                                                        {scenario.template?.name || 'Aucun'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Créé le:</span>
                                                    <span>{formatDate(scenario.createdAt)}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="grid grid-cols-2 gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => router.push(`/admin/simulations/scenarios/${scenario.id}`)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Détails
                                            </Button>

                                            {latestStatus === 'RUNNING' || latestStatus === 'PENDING' ? (
                                                <Button
                                                    size="sm"
                                                    className="w-full"
                                                    variant="secondary"
                                                    disabled
                                                >
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    En cours
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => runSimulation(scenario.id)}
                                                >
                                                    <Play className="h-4 w-4 mr-2" />
                                                    Exécuter
                                                </Button>
                                            )}

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full col-span-1"
                                                onClick={() => router.push(`/admin/simulations/scenarios/${scenario.id}/edit`)}
                                            >
                                                <PencilIcon className="h-4 w-4 mr-2" />
                                                Modifier
                                            </Button>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full col-span-1"
                                                onClick={() => {
                                                    setSelectedScenarioId(scenario.id);
                                                    setNewScenarioName(`Copie de ${scenario.name}`);
                                                    setIsDuplicateDialogOpen(true);
                                                }}
                                            >
                                                <Copy className="h-4 w-4 mr-2" />
                                                Dupliquer
                                            </Button>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full col-span-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => {
                                                    setSelectedScenarioId(scenario.id);
                                                    setIsDialogOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Supprimer
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="templates">
                    <Card>
                        <CardHeader>
                            <CardTitle>Templates de Simulation</CardTitle>
                            <CardDescription>
                                Utilisez des templates prédéfinis pour créer rapidement des scénarios
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {templates.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-muted-foreground mb-4">Aucun template disponible</p>
                                    <Button onClick={() => router.push('/admin/simulations/templates/nouveau')} size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Créer un template
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {templates.map(template => (
                                        <Card key={template.id} className="overflow-hidden">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base flex justify-between items-start">
                                                    <span className="line-clamp-1">{template.name}</span>
                                                    {template.category && (
                                                        <Badge variant="outline" className="ml-2">
                                                            {template.category}
                                                        </Badge>
                                                    )}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardFooter className="pb-2 pt-1 flex justify-between gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => router.push(`/admin/simulations/templates/${template.id}`)}
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    Voir
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => {
                                                        router.push({
                                                            pathname: '/admin/simulations/nouveau',
                                                            query: { templateId: template.id }
                                                        });
                                                    }}
                                                >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Utiliser
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <div className="flex justify-between w-full">
                                <Link href="/admin/simulations/templates">
                                    <Button variant="outline" size="sm">
                                        Voir tous les templates
                                    </Button>
                                </Link>
                                <Link href="/admin/simulations/templates/stats">
                                    <Button variant="outline" size="sm">
                                        <BarChart2 className="h-4 w-4 mr-2" />
                                        Statistiques
                                    </Button>
                                </Link>
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historique des Simulations</CardTitle>
                            <CardDescription>
                                Consultez l'historique des simulations exécutées récemment
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {scenarios.filter(s => s.results && s.results.length > 0).length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-muted-foreground">Aucune simulation exécutée</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Scénario
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Date d'exécution
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Statut
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Durée
                                                </th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {scenarios
                                                .filter(s => s.results && s.results.length > 0)
                                                .flatMap(scenario =>
                                                    (scenario.results || []).map(result => ({
                                                        scenarioId: scenario.id,
                                                        scenarioName: scenario.name,
                                                        resultId: result.id,
                                                        createdAt: result.createdAt,
                                                        status: result.status,
                                                        executionTime: result.executionTime
                                                    }))
                                                )
                                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                                .slice(0, 10) // Limiter à 10 résultats
                                                .map((item, index) => (
                                                    <tr key={item.resultId} className={index % 2 === 0 ? 'bg-white' : 'bg-muted/20'}>
                                                        <td className="px-4 py-2 whitespace-nowrap">
                                                            <div className="text-sm">{item.scenarioName}</div>
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap">
                                                            <div className="text-sm">{formatDate(item.createdAt)}</div>
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap">
                                                            <Badge variant={getStatusBadgeVariant(item.status)}>
                                                                {getStatusBadgeText(item.status)}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap">
                                                            <div className="text-sm">
                                                                {item.executionTime
                                                                    ? `${(item.executionTime / 1000).toFixed(2)}s`
                                                                    : '-'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.push(`/admin/simulations/scenarios/${item.scenarioId}/results/${item.resultId}`)}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Dialogue de confirmation de suppression */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmer la suppression</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer ce scénario ? Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={deleteScenario}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Suppression...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialogue de duplication de scénario */}
            <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Dupliquer le scénario</DialogTitle>
                        <DialogDescription>
                            Créez une copie de ce scénario avec un nouveau nom.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="new-scenario-name" className="mb-2 block">
                            Nom du nouveau scénario
                        </Label>
                        <Input
                            id="new-scenario-name"
                            value={newScenarioName}
                            onChange={(e) => setNewScenarioName(e.target.value)}
                            placeholder="Entrez un nom pour la copie"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDuplicateDialogOpen(false);
                                setNewScenarioName('');
                            }}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={duplicateScenario}
                            disabled={isDuplicating || !newScenarioName.trim()}
                        >
                            {isDuplicating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Duplication...
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Dupliquer
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 