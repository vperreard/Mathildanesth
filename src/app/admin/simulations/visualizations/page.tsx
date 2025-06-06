'use client';

import React, { useState } from 'react';
import { logger } from "../../../../lib/logger";
import Link from 'next/link';
import { ArrowLeftIcon, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import HeatMapChart from '@/components/ui/HeatMapChart';
import SankeyChart from '@/components/ui/SankeyChart';

// Données d'exemple pour le HeatMap
const heatMapData = [
    // Personnel (lignes) x Jours de la semaine (colonnes)
    { x: 'Lundi', y: 'Dr. Martin', value: 8 },
    { x: 'Mardi', y: 'Dr. Martin', value: 6 },
    { x: 'Mercredi', y: 'Dr. Martin', value: 4 },
    { x: 'Jeudi', y: 'Dr. Martin', value: 7 },
    { x: 'Vendredi', y: 'Dr. Martin', value: 3 },

    { x: 'Lundi', y: 'Dr. Dupont', value: 5 },
    { x: 'Mardi', y: 'Dr. Dupont', value: 9 },
    { x: 'Mercredi', y: 'Dr. Dupont', value: 2 },
    { x: 'Jeudi', y: 'Dr. Dupont', value: 8 },
    { x: 'Vendredi', y: 'Dr. Dupont', value: 7 },

    { x: 'Lundi', y: 'Dr. Bernard', value: 3 },
    { x: 'Mardi', y: 'Dr. Bernard', value: 4 },
    { x: 'Mercredi', y: 'Dr. Bernard', value: 8 },
    { x: 'Jeudi', y: 'Dr. Bernard', value: 6 },
    { x: 'Vendredi', y: 'Dr. Bernard', value: 9 },

    { x: 'Lundi', y: 'Inf. Petit', value: 7 },
    { x: 'Mardi', y: 'Inf. Petit', value: 6 },
    { x: 'Mercredi', y: 'Inf. Petit', value: 5 },
    { x: 'Jeudi', y: 'Inf. Petit', value: 4 },
    { x: 'Vendredi', y: 'Inf. Petit', value: 8 },

    { x: 'Lundi', y: 'Inf. Moreau', value: 2 },
    { x: 'Mardi', y: 'Inf. Moreau', value: 5 },
    { x: 'Mercredi', y: 'Inf. Moreau', value: 7 },
    { x: 'Jeudi', y: 'Inf. Moreau', value: 9 },
    { x: 'Vendredi', y: 'Inf. Moreau', value: 6 },
];

// Données d'exemple pour le Sankey
const sankeyData = {
    nodes: [
        // Personnel
        { id: 'dr-martin', name: 'Dr. Martin', category: 'MAR' },
        { id: 'dr-dupont', name: 'Dr. Dupont', category: 'MAR' },
        { id: 'dr-bernard', name: 'Dr. Bernard', category: 'MAR' },
        { id: 'inf-petit', name: 'Inf. Petit', category: 'IADE' },
        { id: 'inf-moreau', name: 'Inf. Moreau', category: 'IADE' },

        // Services
        { id: 'bloc-a', name: 'Bloc A', category: 'Bloc' },
        { id: 'bloc-b', name: 'Bloc B', category: 'Bloc' },
        { id: 'reanimation', name: 'Réanimation', category: 'Service' },
        { id: 'urgences', name: 'Urgences', category: 'Service' },

        // Périodes
        { id: 'matin', name: 'Matin', category: 'Période' },
        { id: 'apres-midi', name: 'Après-midi', category: 'Période' },
        { id: 'garde', name: 'Garde', category: 'Période' },
    ],
    links: [
        // MAR → Blocs
        { source: 'dr-martin', target: 'bloc-a', value: 12 },
        { source: 'dr-martin', target: 'bloc-b', value: 8 },
        { source: 'dr-dupont', target: 'bloc-a', value: 5 },
        { source: 'dr-dupont', target: 'bloc-b', value: 15 },
        { source: 'dr-bernard', target: 'bloc-a', value: 10 },
        { source: 'dr-bernard', target: 'bloc-b', value: 3 },

        // MAR → Services
        { source: 'dr-martin', target: 'reanimation', value: 4 },
        { source: 'dr-dupont', target: 'urgences', value: 6 },
        { source: 'dr-bernard', target: 'reanimation', value: 7 },

        // IADE → Blocs
        { source: 'inf-petit', target: 'bloc-a', value: 18 },
        { source: 'inf-petit', target: 'bloc-b', value: 2 },
        { source: 'inf-moreau', target: 'bloc-a', value: 7 },
        { source: 'inf-moreau', target: 'bloc-b', value: 13 },

        // Blocs → Périodes
        { source: 'bloc-a', target: 'matin', value: 25 },
        { source: 'bloc-a', target: 'apres-midi', value: 20 },
        { source: 'bloc-b', target: 'matin', value: 18 },
        { source: 'bloc-b', target: 'apres-midi', value: 22 },

        // Services → Périodes
        { source: 'reanimation', target: 'matin', value: 6 },
        { source: 'reanimation', target: 'apres-midi', value: 5 },
        { source: 'reanimation', target: 'garde', value: 8 },
        { source: 'urgences', target: 'matin', value: 3 },
        { source: 'urgences', target: 'apres-midi', value: 3 },
        { source: 'urgences', target: 'garde', value: 7 },
    ]
};

// Générer des données d'exemple pour la heat map de couverture
const generateCoverageData = () => {
    const weekdays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const services = ['Bloc Opératoire', 'Réanimation', 'Urgences', 'Consultations', 'Maternité'];
    const data = [];

    for (const service of services) {
        for (const day of weekdays) {
            // Générer une valeur entre 0.6 et 1.0 pour la couverture
            // Weekend généralement plus bas
            const isWeekend = day === 'Samedi' || day === 'Dimanche';
            const baseValue = isWeekend ? 0.6 : 0.75;
            const value = baseValue + Math.random() * 0.3;

            data.push({
                x: day,
                y: service,
                value
            });
        }
    }

    return data;
};

// Générer des données d'exemple pour la satisfaction du personnel
const generateSatisfactionData = () => {
    const personnel = [
        'Dr. Martin',
        'Dr. Dupont',
        'Dr. Bernard',
        'Dr. Leroy',
        'Dr. Petit',
        'Inf. Moreau',
        'Inf. Simon',
        'Inf. Dubois',
        'Inf. Girard',
        'Inf. Bonnet'
    ];

    const aspects = [
        'Équité planning',
        'Respect souhaits',
        'Charge travail',
        'Continuité soins',
        'Équilibre vie pro'
    ];

    const data = [];

    for (const person of personnel) {
        for (const aspect of aspects) {
            // Générer une note de satisfaction entre 1 et 10
            const value = 5 + Math.floor(Math.random() * 6);
            data.push({
                x: aspect,
                y: person,
                value
            });
        }
    }

    return data;
};

export default function VisualizationsPage() {
    const [selectedView, setSelectedView] = useState<string>('heatmap');
    const [heatMapType, setHeatMapType] = useState<string>('workload');
    const [colorScheme, setColorScheme] = useState<string>('blue');

    // Sélectionner les bonnes données selon le type de heat map
    const getHeatMapData = () => {
        switch (heatMapType) {
            case 'workload':
                return {
                    data: heatMapData,
                    title: 'Charge de travail par personnel et jour',
                    xAxisLabel: 'Jour de la semaine',
                    yAxisLabel: 'Personnel',
                    legendTitle: 'Heures'
                };
            case 'coverage':
                return {
                    data: generateCoverageData(),
                    title: 'Taux de couverture par service et jour',
                    xAxisLabel: 'Jour de la semaine',
                    yAxisLabel: 'Service',
                    legendTitle: 'Taux'
                };
            case 'satisfaction':
                return {
                    data: generateSatisfactionData(),
                    title: 'Satisfaction du personnel par critère',
                    xAxisLabel: 'Critère',
                    yAxisLabel: 'Personnel',
                    legendTitle: 'Note'
                };
            default:
                return {
                    data: heatMapData,
                    title: 'Charge de travail par personnel et jour',
                    xAxisLabel: 'Jour de la semaine',
                    yAxisLabel: 'Personnel',
                    legendTitle: 'Heures'
                };
        }
    };

    const heatMapConfig = getHeatMapData();

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-6">
                <Link href="/admin/simulations" className="inline-flex items-center text-sm text-primary hover:underline mb-2">
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Retour aux simulations
                </Link>
                <h1 className="text-3xl font-bold mb-2">Visualisations avancées</h1>
                <p className="text-muted-foreground">
                    Explorez vos données de simulation avec des visualisations interactives
                </p>
            </div>

            <Tabs value={selectedView} onValueChange={setSelectedView} className="w-full">
                <div className="flex justify-between items-center mb-4">
                    <TabsList>
                        <TabsTrigger value="heatmap">Heat Map</TabsTrigger>
                        <TabsTrigger value="sankey">Diagramme de Sankey</TabsTrigger>
                    </TabsList>

                    {selectedView === 'heatmap' && (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="heatmap-type" className="text-sm">Type:</Label>
                                <Select value={heatMapType} onValueChange={setHeatMapType}>
                                    <SelectTrigger id="heatmap-type" className="w-[180px]">
                                        <SelectValue placeholder="Type de heat map" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="workload">Charge de travail</SelectItem>
                                        <SelectItem value="coverage">Taux de couverture</SelectItem>
                                        <SelectItem value="satisfaction">Satisfaction</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Label htmlFor="color-scheme" className="text-sm">Couleurs:</Label>
                                <Select value={colorScheme} onValueChange={setColorScheme}>
                                    <SelectTrigger id="color-scheme" className="w-[150px]">
                                        <SelectValue placeholder="Schéma de couleurs" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="blue">Bleu</SelectItem>
                                        <SelectItem value="green">Vert</SelectItem>
                                        <SelectItem value="red">Rouge</SelectItem>
                                        <SelectItem value="purple">Violet</SelectItem>
                                        <SelectItem value="orange">Orange</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </div>

                <TabsContent value="heatmap" className="w-full">
                    <HeatMapChart
                        data={heatMapConfig.data}
                        title={heatMapConfig.title}
                        xAxisLabel={heatMapConfig.xAxisLabel}
                        yAxisLabel={heatMapConfig.yAxisLabel}
                        legendTitle={heatMapConfig.legendTitle}
                        colorScheme={colorScheme as any}
                        height={500}
                        showLabels={true}
                        onCellClick={(x, y, value) => {
                            logger.info(`Clicked: ${y} - ${x} (${value})`);
                        }}
                    />
                </TabsContent>

                <TabsContent value="sankey" className="w-full">
                    <SankeyChart
                        data={sankeyData}
                        title="Flux d'affectation du personnel"
                        height={600}
                        width={1000}
                        onNodeClick={(node) => {
                            logger.info(`Node clicked: ${node.name}`);
                        }}
                        onLinkClick={(link) => {
                            logger.info(`Link clicked: ${link.source.name} → ${link.target.name}`);
                        }}
                    />
                </TabsContent>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>À propos des Heat Maps</CardTitle>
                        <CardDescription>
                            Visualisation de données sous forme de matrice colorée
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Les heat maps (ou cartes thermiques) permettent de visualiser des données quantitatives sous forme de matrices colorées.
                            Elles sont particulièrement utiles pour identifier rapidement des tendances et des patterns dans de grandes quantités de données.
                        </p>

                        <div className="text-sm space-y-2">
                            <p><strong>Applications dans la planification:</strong></p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Charge de travail par jour et par personnel</li>
                                <li>Taux de couverture des services par période</li>
                                <li>Satisfaction du personnel selon différents critères</li>
                                <li>Répartition des compétences au sein de l'équipe</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>À propos des Diagrammes de Sankey</CardTitle>
                        <CardDescription>
                            Visualisation des flux et relations entre entités
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Les diagrammes de Sankey représentent graphiquement des flux entre des nœuds dans un réseau. L'épaisseur des liens est proportionnelle à la quantité du flux.
                            Ils sont particulièrement adaptés pour visualiser des allocations de ressources et des transformations.
                        </p>

                        <div className="text-sm space-y-2">
                            <p><strong>Applications dans la planification:</strong></p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Affectation du personnel aux services et aux salles</li>
                                <li>Répartition des heures de travail par type d'activité</li>
                                <li>Flux de patients entre services</li>
                                <li>Allocation des compétences selon les besoins</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8 text-center">
                <Button
                    onClick={() => window.history.back()}
                    variant="outline"
                >
                    Retour
                </Button>
            </div>
        </div>
    );
} 