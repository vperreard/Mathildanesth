'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, DownloadIcon, BarChart4Icon, Network } from 'lucide-react';
import Button from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import HeatMapChart from '@/components/ui/HeatMapChart';
import SankeyChart from '@/components/ui/SankeyChart';

// Mémoïsation du composant de chargement
const LoadingIndicator = memo(() => (
    <Card>
        <CardContent className="flex justify-center items-center p-12">
            <div className="flex flex-col items-center gap-2">
                <div className="animate-spin">
                    <RefreshCw className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Chargement des visualisations...</p>
            </div>
        </CardContent>
    </Card>
));

LoadingIndicator.displayName = 'LoadingIndicator';

// Mémoïsation du composant d'erreur
const ErrorDisplay = memo(({ error, onRetry }: { error: string, onRetry: () => void }) => (
    <Card>
        <CardContent className="flex justify-center items-center p-12">
            <div className="flex flex-col items-center gap-2 text-destructive">
                <p>Erreur lors du chargement des données: {error}</p>
                <Button variant="outline" size="sm" onClick={onRetry}>
                    Charger des données de démonstration
                </Button>
            </div>
        </CardContent>
    </Card>
));

ErrorDisplay.displayName = 'ErrorDisplay';

// Mémoïsation du composant de diagramme de chaleur
const HeatMapTab = memo(({ data, selectedMetric, selectedView }: {
    data: any,
    selectedMetric: string,
    selectedView: string,
    onExport: (format: 'png' | 'svg' | 'csv') => void
}) => (
    <TabsContent value="heatmap" className="space-y-4">
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Carte de Chaleur</CardTitle>
                    <div className="flex items-center gap-2">
                        <Select value={selectedMetric} onValueChange={value => {
                            // Cette prop sera passée par le parent
                            (window as any).setSelectedMetric?.(value);
                        }}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Sélectionner une métrique" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="staffing">Taux de Couverture</SelectItem>
                                <SelectItem value="utilization">Taux d'Utilisation</SelectItem>
                                <SelectItem value="satisfaction">Satisfaction Équipe</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={selectedView} onValueChange={value => {
                            // Cette prop sera passée par le parent
                            (window as any).setSelectedView?.(value);
                        }}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Vue" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Journalière</SelectItem>
                                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                                <SelectItem value="monthly">Mensuelle</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <CardDescription>
                    Visualisation de {
                        selectedMetric === 'staffing' ? 'la couverture des besoins en personnel' :
                            selectedMetric === 'utilization' ? 'l\'utilisation des ressources' :
                                'la satisfaction de l\'équipe'
                    } par {
                        selectedView === 'daily' ? 'jour' :
                            selectedView === 'weekly' ? 'semaine' : 'mois'
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 px-2">
                <div className="w-full h-[500px]">
                    <HeatMapChart
                        data={data?.heatmapData?.[selectedMetric] || []}
                        xAxisLabel={
                            selectedView === 'daily' ? 'Jour' :
                                selectedView === 'weekly' ? 'Semaine' : 'Mois'
                        }
                        yAxisLabel="Service / Utilisateur"
                        colorRanges={
                            selectedMetric === 'staffing' ? [
                                { min: 0, max: 20, color: '#ef4444' },
                                { min: 20, max: 40, color: '#f97316' },
                                { min: 40, max: 60, color: '#facc15' },
                                { min: 60, max: 80, color: '#84cc16' },
                                { min: 80, max: 100, color: '#22c55e' }
                            ] :
                                selectedMetric === 'utilization' ? [
                                    { min: 0, max: 20, color: '#22c55e' },
                                    { min: 20, max: 40, color: '#84cc16' },
                                    { min: 40, max: 60, color: '#facc15' },
                                    { min: 60, max: 80, color: '#f97316' },
                                    { min: 80, max: 100, color: '#ef4444' }
                                ] : [
                                    { min: 0, max: 20, color: '#ef4444' },
                                    { min: 20, max: 40, color: '#f97316' },
                                    { min: 40, max: 60, color: '#facc15' },
                                    { min: 60, max: 80, color: '#84cc16' },
                                    { min: 80, max: 100, color: '#22c55e' }
                                ]
                        }
                        title={
                            selectedMetric === 'staffing' ? 'Taux de Couverture des Besoins' :
                                selectedMetric === 'utilization' ? 'Taux d\'Utilisation des Ressources' :
                                    'Indice de Satisfaction de l\'Équipe'
                        }
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => data.onExport('png')}>
                    <DownloadIcon className="w-4 h-4 mr-1" />
                    PNG
                </Button>
                <Button variant="outline" size="sm" onClick={() => data.onExport('svg')}>
                    <DownloadIcon className="w-4 h-4 mr-1" />
                    SVG
                </Button>
                <Button variant="outline" size="sm" onClick={() => data.onExport('csv')}>
                    <DownloadIcon className="w-4 h-4 mr-1" />
                    CSV
                </Button>
            </CardFooter>
        </Card>
    </TabsContent>
));

HeatMapTab.displayName = 'HeatMapTab';

// Mémoïsation du composant de diagramme Sankey
const SankeyTab = memo(({ data, selectedDepth, onExport }: {
    data: any,
    selectedDepth: string,
    onExport: (format: 'png' | 'svg' | 'csv') => void
}) => (
    <TabsContent value="sankey" className="space-y-4">
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Diagramme de Flux</CardTitle>
                    <Select value={selectedDepth} onValueChange={value => {
                        // Cette prop sera passée par le parent
                        (window as any).setSelectedDepth?.(value);
                    }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Niveau de détail" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="departments">Services</SelectItem>
                            <SelectItem value="skills">Compétences</SelectItem>
                            <SelectItem value="resources">Ressources</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <CardDescription>
                    Visualisation des flux de personnel entre les différentes affectations
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 px-2">
                <div className="w-full h-[500px]">
                    <SankeyChart
                        data={data?.sankeyData?.[selectedDepth] || { nodes: [], links: [] }}
                        title={
                            selectedDepth === 'departments' ? 'Flux de Personnel entre Services' :
                                selectedDepth === 'skills' ? 'Flux par Compétences' :
                                    'Flux de Ressources Détaillé'
                        }
                        nodeWidth={20}
                        nodePadding={10}
                        units="personnes"
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => onExport('png')}>
                    <DownloadIcon className="w-4 h-4 mr-1" />
                    PNG
                </Button>
                <Button variant="outline" size="sm" onClick={() => onExport('svg')}>
                    <DownloadIcon className="w-4 h-4 mr-1" />
                    SVG
                </Button>
            </CardFooter>
        </Card>
    </TabsContent>
));

SankeyTab.displayName = 'SankeyTab';

export default function AdvancedVisualizationsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const resultId = searchParams?.get('resultId');
    const scenarioId = searchParams?.get('scenarioId');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resultData, setResultData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('heatmap');
    const [selectedMetric, setSelectedMetric] = useState('staffing');
    const [selectedView, setSelectedView] = useState('daily');
    const [selectedDepth, setSelectedDepth] = useState('departments');

    // Exposer les setters pour les composants mémoïsés
    (window as any).setSelectedMetric = setSelectedMetric;
    (window as any).setSelectedView = setSelectedView;
    (window as any).setSelectedDepth = setSelectedDepth;

    // Mémoïsation de la fonction de génération de données de démonstration
    const generateDemoData = useCallback(() => {
        // Données pour la heat map
        const heatmapData = {
            staffing: generateStaffingHeatmapData(),
            utilization: generateUtilizationHeatmapData(),
            satisfaction: generateSatisfactionHeatmapData()
        };

        // Données pour le diagramme de Sankey
        const sankeyData = {
            departments: generateDepartmentFlowData(),
            skills: generateSkillFlowData(),
            resources: generateResourceFlowData()
        };

        return {
            heatmapData,
            sankeyData,
            scenarioName: 'Scénario optimisé Q3 2025',
            resultLabel: 'Résultat optimisé',
            period: {
                start: '2025-07-01',
                end: '2025-09-30'
            }
        };
    }, []);

    // Mémoïsation du traitement des données
    const processResultData = useCallback((data: any) => {
        // Dans une implémentation réelle, on traiterait ici les données
        // Pour l'instant, on retourne les données de démonstration
        return generateDemoData();
    }, [generateDemoData]);

    // Gestion des exports - mémoïsée pour éviter des re-créations à chaque rendu
    const handleExport = useCallback((format: 'png' | 'svg' | 'csv') => {
        toast.success(`Export en ${format.toUpperCase()} déclenché`);
        // Logique d'export à implémenter
    }, []);

    // Mémoïsation du retour à la page précédente
    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    // Mémoïsation du rafraîchissement des données
    const refreshData = useCallback(() => {
        setResultData(generateDemoData());
    }, [generateDemoData]);

    // Effet pour charger les données - mémoïsé pour éviter des re-créations
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            if (!resultId) {
                // Si pas d'ID de résultat, générer des données de démonstration
                setResultData(generateDemoData());
                setLoading(false);
                return;
            }

            try {
                // Appel API pour charger les données du résultat
                const response = await fetch(`/api/simulations/results/${resultId}`);

                if (!response.ok) {
                    throw new Error('Erreur lors du chargement des données du résultat');
                }

                const data = await response.json();

                // Traiter les données pour les visualisations
                const processedData = processResultData(data);
                setResultData(processedData);
            } catch (err) {
                console.error('Erreur:', err);
                setError(err instanceof Error ? err.message : 'Erreur inconnue');
                toast.error('Erreur lors du chargement des données');

                // En cas d'erreur, utiliser des données de démonstration
                setResultData(generateDemoData());
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [resultId, generateDemoData, processResultData]);

    // Mémoïsation du titre du scénario
    const scenarioTitle = useMemo(() => {
        return resultData?.scenarioName || 'Visualisations Avancées';
    }, [resultData?.scenarioName]);

    // Mémoïsation des dates formatées
    const formattedPeriod = useMemo(() => {
        const startDate = resultData?.period?.start
            ? new Date(resultData.period.start).toLocaleDateString()
            : 'N/A';
        const endDate = resultData?.period?.end
            ? new Date(resultData.period.end).toLocaleDateString()
            : 'N/A';
        return `${startDate} - ${endDate}`;
    }, [resultData?.period]);

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBack}
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Retour
                    </Button>
                    <h1 className="text-2xl font-bold">Visualisations Avancées</h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshData}
                        disabled={loading}
                    >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Actualiser
                    </Button>
                </div>
            </div>

            {loading ? (
                <LoadingIndicator />
            ) : error ? (
                <ErrorDisplay error={error} onRetry={refreshData} />
            ) : resultData ? (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>{scenarioTitle}</CardTitle>
                            <CardDescription>
                                Période: {formattedPeriod}
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-2 mb-4">
                            <TabsTrigger value="heatmap" className="flex items-center">
                                <BarChart4Icon className="w-4 h-4 mr-2" /> Carte de Chaleur
                            </TabsTrigger>
                            <TabsTrigger value="sankey" className="flex items-center">
                                <Network className="w-4 h-4 mr-2" /> Diagramme de Flux
                            </TabsTrigger>
                        </TabsList>

                        {activeTab === 'heatmap' && (
                            <HeatMapTab
                                data={{
                                    heatmapData: resultData.heatmapData,
                                    onExport: handleExport
                                }}
                                selectedMetric={selectedMetric}
                                selectedView={selectedView}
                                onExport={handleExport}
                            />
                        )}

                        {activeTab === 'sankey' && (
                            <SankeyTab
                                data={resultData}
                                selectedDepth={selectedDepth}
                                onExport={handleExport}
                            />
                        )}
                    </Tabs>
                </>
            ) : null}
        </div>
    );
}

// Fonctions de génération de données de démonstration pour les visualisations
function generateStaffingHeatmapData() {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const services = ['Bloc Opératoire', 'Consultations', 'Urgences', 'Soins Intensifs', 'Radiologie'];

    return days.flatMap(day =>
        services.map(service => ({
            x: day,
            y: service,
            value: Math.floor(Math.random() * 41) + 60, // 60-100%
        }))
    );
}

function generateUtilizationHeatmapData() {
    const timeSlots = ['8h-10h', '10h-12h', '12h-14h', '14h-16h', '16h-18h', '18h-20h'];
    const resources = ['Salles Opératoires', 'Personnel MA', 'Personnel IDE', 'Équipements', 'Lits Disponibles'];

    return timeSlots.flatMap(time =>
        resources.map(resource => ({
            x: time,
            y: resource,
            value: Math.floor(Math.random() * 41) + 60, // 60-100%
        }))
    );
}

function generateSatisfactionHeatmapData() {
    const weeks = ['S27', 'S28', 'S29', 'S30', 'S31', 'S32', 'S33', 'S34', 'S35', 'S36'];
    const teams = ['Anesthésistes', 'Chirurgiens', 'IADE', 'IBODE', 'Administration'];

    return weeks.flatMap(week =>
        teams.map(team => ({
            x: week,
            y: team,
            value: Math.floor(Math.random() * 41) + 60, // 60-100%
        }))
    );
}

// Les fonctions suivantes sont mémoïsées pour éviter des recalculs inutiles
const generateDepartmentFlowData = () => {
    return {
        nodes: [
            { id: 'BO', name: 'Bloc Opératoire' },
            { id: 'Cons', name: 'Consultations' },
            { id: 'Urg', name: 'Urgences' },
            { id: 'SI', name: 'Soins Intensifs' },
            { id: 'Radio', name: 'Radiologie' },
            { id: 'Admin', name: 'Administration' },
        ],
        links: [
            { source: 'BO', target: 'Cons', value: 12 },
            { source: 'BO', target: 'SI', value: 8 },
            { source: 'Cons', target: 'BO', value: 15 },
            { source: 'Urg', target: 'BO', value: 5 },
            { source: 'Urg', target: 'SI', value: 10 },
            { source: 'SI', target: 'BO', value: 7 },
            { source: 'Radio', target: 'BO', value: 4 },
            { source: 'Admin', target: 'Cons', value: 6 },
            { source: 'Admin', target: 'BO', value: 3 },
        ]
    };
};

const generateSkillFlowData = () => {
    return {
        nodes: [
            { id: 'Anest', name: 'Anesthésistes' },
            { id: 'ChirOrtho', name: 'Chir. Orthopédique' },
            { id: 'ChirVis', name: 'Chir. Viscérale' },
            { id: 'ChirUro', name: 'Chir. Urologique' },
            { id: 'IADE', name: 'IADE' },
            { id: 'IBODE', name: 'IBODE' },
            { id: 'Consult', name: 'Consultation' },
        ],
        links: [
            { source: 'Anest', target: 'ChirOrtho', value: 18 },
            { source: 'Anest', target: 'ChirVis', value: 15 },
            { source: 'Anest', target: 'ChirUro', value: 12 },
            { source: 'IADE', target: 'ChirOrtho', value: 14 },
            { source: 'IADE', target: 'ChirVis', value: 10 },
            { source: 'IADE', target: 'ChirUro', value: 8 },
            { source: 'IBODE', target: 'ChirOrtho', value: 16 },
            { source: 'IBODE', target: 'ChirVis', value: 13 },
            { source: 'IBODE', target: 'ChirUro', value: 9 },
            { source: 'Anest', target: 'Consult', value: 7 },
            { source: 'ChirOrtho', target: 'Consult', value: 6 },
            { source: 'ChirVis', target: 'Consult', value: 5 },
            { source: 'ChirUro', target: 'Consult', value: 4 },
        ]
    };
};

const generateResourceFlowData = () => {
    return {
        nodes: [
            { id: 'S1', name: 'Salle 1' },
            { id: 'S2', name: 'Salle 2' },
            { id: 'S3', name: 'Salle 3' },
            { id: 'S4', name: 'Salle 4' },
            { id: 'MA1', name: 'Dr. Martin' },
            { id: 'MA2', name: 'Dr. Dubois' },
            { id: 'MA3', name: 'Dr. Bernard' },
            { id: 'IADE1', name: 'IADE Dupont' },
            { id: 'IADE2', name: 'IADE Moreau' },
            { id: 'IBODE1', name: 'IBODE Lambert' },
            { id: 'IBODE2', name: 'IBODE Petit' },
        ],
        links: [
            { source: 'MA1', target: 'S1', value: 8 },
            { source: 'MA1', target: 'S2', value: 6 },
            { source: 'MA2', target: 'S2', value: 7 },
            { source: 'MA2', target: 'S3', value: 5 },
            { source: 'MA3', target: 'S3', value: 6 },
            { source: 'MA3', target: 'S4', value: 9 },
            { source: 'IADE1', target: 'S1', value: 10 },
            { source: 'IADE1', target: 'S2', value: 8 },
            { source: 'IADE2', target: 'S3', value: 9 },
            { source: 'IADE2', target: 'S4', value: 7 },
            { source: 'IBODE1', target: 'S1', value: 6 },
            { source: 'IBODE1', target: 'S3', value: 5 },
            { source: 'IBODE2', target: 'S2', value: 4 },
            { source: 'IBODE2', target: 'S4', value: 6 },
        ]
    };
}; 