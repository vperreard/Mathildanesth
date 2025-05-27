'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    PlanningSimulator,
    PlanningSimulation,
    SimulationMetrics
} from '../services/planningSimulator';
import { Attribution, GenerationParameters, ValidationResult, AssignmentType } from '../types/attribution';
import { User } from '../types/user';
import { RulesConfiguration, FatigueConfig } from '../types/rules';
import { Card } from './ui/card';
import Button from './ui/button';
import Input from './ui/input';
import { Select } from './ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Switch } from './ui/switch';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';

// Styles pour les tableaux comparatifs
const tableStyles = {
    table: 'min-w-full divide-y divide-gray-200',
    thead: 'bg-gray-50',
    th: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
    tbody: 'bg-white divide-y divide-gray-200',
    td: 'px-6 py-4 whitespace-nowrap text-sm text-gray-500',
    metric: 'font-medium',
    betterValue: 'font-bold text-green-600',
    worseValue: 'font-bold text-red-600',
    neutralValue: 'font-medium text-gray-700',
};

// Configuration des presets de simulation
const simulationPresets = [
    {
        id: 'equite',
        name: 'Priorité à l\'équité',
        description: 'Favorise une répartition équitable des gardes et astreintes entre tous les membres',
        parameterOverrides: {
            poidsEquite: 0.8,
            poidsPreference: 0.2,
            poidsQualiteVie: 0.4
        },
        rulesOverrides: {
            equite: {
                poidsGardesWeekend: 2.0,
                poidsGardesFeries: 2.5
            }
        }
    },
    {
        id: 'preferences',
        name: 'Priorité aux préférences',
        description: 'Favorise le respect des préférences personnelles et des contraintes individuelles',
        parameterOverrides: {
            poidsEquite: 0.3,
            poidsPreference: 0.9,
            poidsQualiteVie: 0.6
        },
        rulesOverrides: {
            qualiteVie: {
                poidsPreferences: 0.9
            }
        }
    },
    {
        id: 'qualiteVie',
        name: 'Priorité à la qualité de vie',
        description: 'Réduit la fatigue et les contraintes pour favoriser l\'équilibre vie-travail',
        parameterOverrides: {
            poidsEquite: 0.4,
            poidsPreference: 0.6,
            poidsQualiteVie: 0.9
        },
        rulesOverrides: {
            qualiteVie: {
                eviterConsecutifs: true,
                recuperationApresGardeNuit: true
            },
            intervalle: {
                minJoursEntreGardes: 10,
                minJoursRecommandes: 28
            }
        },
        fatigueOverrides: {
            points: {
                garde: 40,
                astreinte: 15,
                supervisionMultiple: 15,
                pediatrie: 10,
                jour: -20,
                weekend: -30
            },
            tauxRecuperation: 12
        }
    },
    {
        id: 'optimisation',
        name: 'Optimisation maximale',
        description: 'Recherche approfondie pour trouver la meilleure solution possible',
        parameterOverrides: {
            niveauOptimisation: 'approfondi' as const,
            poidsEquite: 0.6,
            poidsPreference: 0.6,
            poidsQualiteVie: 0.6
        }
    }
];

interface PlanningSimulatorProps {
    initialParameters: GenerationParameters;
    personnel: User[];
    existingAssignments: Attribution[];
    onSimulationApplied: (attributions: Attribution[]) => void;
}

export const PlanningSimulatorComponent: React.FC<PlanningSimulatorProps> = ({
    initialParameters,
    personnel,
    existingAssignments,
    onSimulationApplied
}) => {
    // État du simulateur
    const [simulator] = useState(() =>
        new PlanningSimulator(initialParameters, personnel, existingAssignments)
    );
    const [simulations, setSimulations] = useState<PlanningSimulation[]>([]);
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedSimulations, setSelectedSimulations] = useState<string[]>([]);
    const [customName, setCustomName] = useState('');
    const [customDescription, setCustomDescription] = useState('');
    const [selectedPreset, setSelectedPreset] = useState('');

    // Paramètres personnalisés
    const [customParams, setCustomParams] = useState<{
        poidsEquite: number;
        poidsPreference: number;
        poidsQualiteVie: number;
        minJoursEntreGardes: number;
    }>({
        poidsEquite: initialParameters.poidsEquite,
        poidsPreference: initialParameters.poidsPreference,
        poidsQualiteVie: initialParameters.poidsQualiteVie,
        minJoursEntreGardes: 7
    });

    // Métriques des simulations sélectionnées
    const selectedMetrics = useMemo(() => {
        return selectedSimulations.map(id => ({
            id,
            simulation: simulator.getSimulation(id),
            metrics: simulator.calculateMetrics(id)
        })).filter(item => item.simulation && item.metrics);
    }, [selectedSimulations, simulator]);

    // Différences entre les simulations sélectionnées
    const simulationComparison = useMemo(() => {
        if (selectedSimulations.length !== 2) return null;
        return simulator.compareSimulations(selectedSimulations[0], selectedSimulations[1]);
    }, [selectedSimulations, simulator]);

    // Charge les simulations au démarrage
    useEffect(() => {
        refreshSimulations();
    }, []);

    // Rafraîchit la liste des simulations
    const refreshSimulations = () => {
        setSimulations(simulator.getAllSimulations());
    };

    // Génère une nouvelle simulation
    const handleGenerateSimulation = async (presetId?: string) => {
        try {
            setLoading(presetId || 'custom');
            setError(null);

            let name = customName || 'Simulation sans nom';
            let description = customDescription || 'Aucune description';
            let parameterOverrides: Partial<GenerationParameters> = {};
            let rulesOverrides: Partial<RulesConfiguration> = {};
            let fatigueOverrides: Partial<FatigueConfig> = {};

            // Applique les presets si spécifiés
            if (presetId) {
                const preset = simulationPresets.find(p => p.id === presetId);
                if (preset) {
                    name = preset.name;
                    description = preset.description;
                    parameterOverrides = preset.parameterOverrides;
                    rulesOverrides = preset.rulesOverrides;
                    if (preset.fatigueOverrides) {
                        fatigueOverrides = preset.fatigueOverrides;
                    }
                }
            } else {
                // Utilise les paramètres personnalisés
                parameterOverrides = {
                    poidsEquite: customParams.poidsEquite,
                    poidsPreference: customParams.poidsPreference,
                    poidsQualiteVie: customParams.poidsQualiteVie
                };

                rulesOverrides = {
                    intervalle: {
                        minJoursEntreGardes: customParams.minJoursEntreGardes
                    }
                };
            }

            // Génère la simulation
            const simulationId = await simulator.generateSimulation(
                name,
                description,
                parameterOverrides,
                rulesOverrides,
                fatigueOverrides
            );

            // Met à jour la liste des simulations
            refreshSimulations();

            // Sélectionne automatiquement la nouvelle simulation
            setSelectedSimulations(prev => {
                if (prev.length < 2) {
                    return [...prev, simulationId];
                } else {
                    return [prev[1], simulationId];
                }
            });

            setLoading(null);
        } catch (err) {
            setError(`Erreur de génération: ${err instanceof Error ? err.message : String(err)}`);
            setLoading(null);
        }
    };

    // Applique une simulation comme planning définitif
    const handleApplySimulation = (simulationId: string) => {
        try {
            const attributions = simulator.applySimulation(simulationId);
            if (attributions) {
                onSimulationApplied(attributions);
            } else {
                setError('Simulation introuvable');
            }
        } catch (err) {
            setError(`Erreur lors de l'application: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    // Supprime une simulation
    const handleDeleteSimulation = (simulationId: string) => {
        simulator.deleteSimulation(simulationId);
        setSelectedSimulations(prev => prev.filter(id => id !== simulationId));
        refreshSimulations();
    };

    // Gère la sélection/désélection d'une simulation
    const handleToggleSelection = (simulationId: string) => {
        setSelectedSimulations(prev => {
            if (prev.includes(simulationId)) {
                return prev.filter(id => id !== simulationId);
            } else if (prev.length < 2) {
                return [...prev, simulationId];
            } else {
                return [prev[1], simulationId];
            }
        });
    };

    // Détermine la meilleure valeur entre deux métriques
    const getBetterMetricClass = (value1: number, value2: number, isHigherBetter: boolean) => {
        if (value1 === value2) return tableStyles.neutralValue;
        const isBetter = isHigherBetter ? value1 > value2 : value1 < value2;
        return isBetter ? tableStyles.betterValue : tableStyles.worseValue;
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Simulateur Multi-Planning</h2>

            {/* Onglets principaux */}
            <Tabs defaultValue="simulations">
                <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="simulations">Simulations</TabsTrigger>
                    <TabsTrigger value="comparaison">Comparaison</TabsTrigger>
                    <TabsTrigger value="nouvelle">Nouvelle Simulation</TabsTrigger>
                </TabsList>

                {/* Contenu de l'onglet Simulations */}
                <TabsContent value="simulations" className="space-y-4">
                    {simulations.length === 0 ? (
                        <div className="text-center p-8 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">Aucune simulation disponible. Créez-en une nouvelle.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {simulations.map(sim => {
                                const metrics = simulator.calculateMetrics(sim.id);
                                const isSelected = selectedSimulations.includes(sim.id);

                                return (
                                    <Card key={sim.id} className={`p-4 ${isSelected ? 'border-2 border-blue-500' : ''}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-lg">{sim.name}</h3>
                                                <p className="text-sm text-gray-500">{sim.description}</p>
                                            </div>
                                            <div>
                                                <Badge variant={metrics?.ruleViolationsCount.critical > 0 ? "destructive" :
                                                    metrics?.ruleViolationsCount.major > 0 ? "default" : "success"}>
                                                    {metrics?.ruleViolationsCount.total} violations
                                                    {metrics?.ruleViolationsCount.total > 0 && (
                                                        <Link href="/documentation?doc=guide-resolution-problemes-simulateur.md#problèmes-liés-aux-violations-de-règles"
                                                            className="ml-1 text-white hover:underline" title="Résoudre les problèmes de violations">
                                                            <HelpCircle size={12} />
                                                        </Link>
                                                    )}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            <div className="bg-gray-50 p-2 rounded">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium">Équité</span>
                                                    <Link href="/documentation?doc=guide-utilisateur-simulateur.md#score-déquité"
                                                        className="text-blue-500 hover:text-blue-700" title="Comprendre le score d'équité">
                                                        <HelpCircle size={14} />
                                                    </Link>
                                                </div>
                                                <p className="text-lg">{metrics?.equityScore.toFixed(2)}</p>
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium">Fatigue</span>
                                                    <Link href="/documentation?doc=guide-utilisateur-simulateur.md#score-de-fatigue"
                                                        className="text-blue-500 hover:text-blue-700" title="Comprendre le score de fatigue">
                                                        <HelpCircle size={14} />
                                                    </Link>
                                                </div>
                                                <p className="text-lg">{metrics?.fatigueScore.toFixed(2)}</p>
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium">Satisfaction</span>
                                                    <Link href="/documentation?doc=guide-utilisateur-simulateur.md#score-de-satisfaction"
                                                        className="text-blue-500 hover:text-blue-700" title="Comprendre le score de satisfaction">
                                                        <HelpCircle size={14} />
                                                    </Link>
                                                </div>
                                                <p className="text-lg">{metrics?.satisfactionScore.toFixed(2)}</p>
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded">
                                                <span className="text-sm font-medium">Total gardes/vacations</span>
                                                <p className="text-lg">{metrics?.assignmentCounts.total}</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleToggleSelection(sim.id)}
                                            >
                                                {isSelected ? 'Désélectionner' : 'Sélectionner'}
                                            </Button>

                                            <div className="space-x-2">
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => handleApplySimulation(sim.id)}
                                                >
                                                    Appliquer
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDeleteSimulation(sim.id)}
                                                >
                                                    Supprimer
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* Contenu de l'onglet Comparaison */}
                <TabsContent value="comparaison" className="space-y-4">
                    {selectedMetrics.length < 2 ? (
                        <div className="text-center p-8 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">Veuillez sélectionner deux simulations à comparer.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Tableau de comparaison des métriques */}
                            <Card className="overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b">
                                    <h3 className="font-bold">Comparaison des métriques</h3>
                                </div>
                                <div className="p-4">
                                    <table className={tableStyles.table}>
                                        <thead className={tableStyles.thead}>
                                            <tr>
                                                <th className={tableStyles.th}>Métrique</th>
                                                <th className={tableStyles.th}>{selectedMetrics[0].simulation?.name}</th>
                                                <th className={tableStyles.th}>{selectedMetrics[1].simulation?.name}</th>
                                                <th className={tableStyles.th}>Différence</th>
                                            </tr>
                                        </thead>
                                        <tbody className={tableStyles.tbody}>
                                            <tr>
                                                <td className={`${tableStyles.td} ${tableStyles.metric}`}>Équité</td>
                                                <td className={`${tableStyles.td} ${getBetterMetricClass(
                                                    selectedMetrics[0].metrics!.equityScore,
                                                    selectedMetrics[1].metrics!.equityScore,
                                                    true
                                                )}`}>
                                                    {selectedMetrics[0].metrics!.equityScore.toFixed(2)}
                                                </td>
                                                <td className={`${tableStyles.td} ${getBetterMetricClass(
                                                    selectedMetrics[1].metrics!.equityScore,
                                                    selectedMetrics[0].metrics!.equityScore,
                                                    true
                                                )}`}>
                                                    {selectedMetrics[1].metrics!.equityScore.toFixed(2)}
                                                </td>
                                                <td className={tableStyles.td}>
                                                    {(selectedMetrics[1].metrics!.equityScore -
                                                        selectedMetrics[0].metrics!.equityScore).toFixed(2)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className={`${tableStyles.td} ${tableStyles.metric}`}>Fatigue</td>
                                                <td className={`${tableStyles.td} ${getBetterMetricClass(
                                                    selectedMetrics[0].metrics!.fatigueScore,
                                                    selectedMetrics[1].metrics!.fatigueScore,
                                                    true
                                                )}`}>
                                                    {selectedMetrics[0].metrics!.fatigueScore.toFixed(2)}
                                                </td>
                                                <td className={`${tableStyles.td} ${getBetterMetricClass(
                                                    selectedMetrics[1].metrics!.fatigueScore,
                                                    selectedMetrics[0].metrics!.fatigueScore,
                                                    true
                                                )}`}>
                                                    {selectedMetrics[1].metrics!.fatigueScore.toFixed(2)}
                                                </td>
                                                <td className={tableStyles.td}>
                                                    {(selectedMetrics[1].metrics!.fatigueScore -
                                                        selectedMetrics[0].metrics!.fatigueScore).toFixed(2)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className={`${tableStyles.td} ${tableStyles.metric}`}>Satisfaction</td>
                                                <td className={`${tableStyles.td} ${getBetterMetricClass(
                                                    selectedMetrics[0].metrics!.satisfactionScore,
                                                    selectedMetrics[1].metrics!.satisfactionScore,
                                                    true
                                                )}`}>
                                                    {selectedMetrics[0].metrics!.satisfactionScore.toFixed(2)}
                                                </td>
                                                <td className={`${tableStyles.td} ${getBetterMetricClass(
                                                    selectedMetrics[1].metrics!.satisfactionScore,
                                                    selectedMetrics[0].metrics!.satisfactionScore,
                                                    true
                                                )}`}>
                                                    {selectedMetrics[1].metrics!.satisfactionScore.toFixed(2)}
                                                </td>
                                                <td className={tableStyles.td}>
                                                    {(selectedMetrics[1].metrics!.satisfactionScore -
                                                        selectedMetrics[0].metrics!.satisfactionScore).toFixed(2)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className={`${tableStyles.td} ${tableStyles.metric}`}>Violations critiques</td>
                                                <td className={`${tableStyles.td} ${getBetterMetricClass(
                                                    selectedMetrics[0].metrics!.ruleViolationsCount.critical,
                                                    selectedMetrics[1].metrics!.ruleViolationsCount.critical,
                                                    false
                                                )}`}>
                                                    {selectedMetrics[0].metrics!.ruleViolationsCount.critical}
                                                </td>
                                                <td className={`${tableStyles.td} ${getBetterMetricClass(
                                                    selectedMetrics[1].metrics!.ruleViolationsCount.critical,
                                                    selectedMetrics[0].metrics!.ruleViolationsCount.critical,
                                                    false
                                                )}`}>
                                                    {selectedMetrics[1].metrics!.ruleViolationsCount.critical}
                                                </td>
                                                <td className={tableStyles.td}>
                                                    {selectedMetrics[1].metrics!.ruleViolationsCount.critical -
                                                        selectedMetrics[0].metrics!.ruleViolationsCount.critical}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className={`${tableStyles.td} ${tableStyles.metric}`}>Total violations</td>
                                                <td className={`${tableStyles.td} ${getBetterMetricClass(
                                                    selectedMetrics[0].metrics!.ruleViolationsCount.total,
                                                    selectedMetrics[1].metrics!.ruleViolationsCount.total,
                                                    false
                                                )}`}>
                                                    {selectedMetrics[0].metrics!.ruleViolationsCount.total}
                                                </td>
                                                <td className={`${tableStyles.td} ${getBetterMetricClass(
                                                    selectedMetrics[1].metrics!.ruleViolationsCount.total,
                                                    selectedMetrics[0].metrics!.ruleViolationsCount.total,
                                                    false
                                                )}`}>
                                                    {selectedMetrics[1].metrics!.ruleViolationsCount.total}
                                                </td>
                                                <td className={tableStyles.td}>
                                                    {selectedMetrics[1].metrics!.ruleViolationsCount.total -
                                                        selectedMetrics[0].metrics!.ruleViolationsCount.total}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            {/* Tableau des différences de paramètres */}
                            {simulationComparison && Object.keys(simulationComparison.parameterDifferences).length > 0 && (
                                <Card className="overflow-hidden">
                                    <div className="p-4 bg-gray-50 border-b">
                                        <h3 className="font-bold">Différences de paramètres</h3>
                                    </div>
                                    <div className="p-4">
                                        <table className={tableStyles.table}>
                                            <thead className={tableStyles.thead}>
                                                <tr>
                                                    <th className={tableStyles.th}>Paramètre</th>
                                                    <th className={tableStyles.th}>{selectedMetrics[0].simulation?.name}</th>
                                                    <th className={tableStyles.th}>{selectedMetrics[1].simulation?.name}</th>
                                                </tr>
                                            </thead>
                                            <tbody className={tableStyles.tbody}>
                                                {Object.entries(simulationComparison.parameterDifferences).map(([key, values]) => (
                                                    <tr key={key}>
                                                        <td className={`${tableStyles.td} ${tableStyles.metric}`}>{key}</td>
                                                        <td className={tableStyles.td}>{values.value1}</td>
                                                        <td className={tableStyles.td}>{values.value2}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            )}

                            {/* Actions pour les simulations comparées */}
                            <div className="flex justify-center space-x-4">
                                <Button
                                    variant="default"
                                    onClick={() => handleApplySimulation(selectedMetrics[0].id)}
                                >
                                    Appliquer {selectedMetrics[0].simulation?.name}
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={() => handleApplySimulation(selectedMetrics[1].id)}
                                >
                                    Appliquer {selectedMetrics[1].simulation?.name}
                                </Button>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* Contenu de l'onglet Nouvelle Simulation */}
                <TabsContent value="nouvelle" className="space-y-4">
                    <Card>
                        <div className="p-4 bg-gray-50 border-b">
                            <h3 className="font-bold">Paramètres de simulation</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            {/* Choix des presets */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-lg font-medium text-gray-700">
                                        Préréglages
                                    </label>
                                    <Link href="/documentation?doc=guide-utilisateur-simulateur.md#préréglages-standards"
                                        className="text-blue-500 hover:text-blue-700" title="En savoir plus sur les préréglages">
                                        <HelpCircle size={16} />
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {simulationPresets.map(preset => (
                                        <Button
                                            key={preset.id}
                                            variant={selectedPreset === preset.id ? "default" : "outline"}
                                            className="justify-start h-auto py-2"
                                            onClick={() => setSelectedPreset(preset.id)}
                                        >
                                            <div className="text-left">
                                                <div className="font-medium">{preset.name}</div>
                                                <div className="text-xs text-gray-500">{preset.description}</div>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <Switch
                                    id="custom-params"
                                    checked={!selectedPreset}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedPreset('');
                                        } else {
                                            setSelectedPreset('equite');
                                        }
                                    }}
                                />
                                <label htmlFor="custom-params" className="text-sm font-medium">
                                    Paramètres personnalisés
                                </label>
                            </div>

                            {!selectedPreset && (
                                <div className="pt-4 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nom de la simulation
                                        </label>
                                        <Link href="/documentation?doc=guide-utilisateur-simulateur.md#génération-et-simulation"
                                            className="text-blue-500 hover:text-blue-700" title="Aide sur la génération de simulation">
                                            <HelpCircle size={16} />
                                        </Link>
                                    </div>
                                    <Input
                                        value={customName}
                                        onChange={(e) => setCustomName(e.target.value)}
                                        placeholder="Nom descriptif pour cette simulation"
                                    />
                                </div>
                            )}

                            {!selectedPreset && (
                                <div className="pt-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <Input
                                            value={customDescription}
                                            onChange={(e) => setCustomDescription(e.target.value)}
                                            placeholder="Description détaillée des paramètres"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Poids Équité (0-1)
                                            </label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={customParams.poidsEquite}
                                                onChange={(e) => setCustomParams({
                                                    ...customParams,
                                                    poidsEquite: parseFloat(e.target.value)
                                                })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Poids Préférence (0-1)
                                            </label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={customParams.poidsPreference}
                                                onChange={(e) => setCustomParams({
                                                    ...customParams,
                                                    poidsPreference: parseFloat(e.target.value)
                                                })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Poids Qualité Vie (0-1)
                                            </label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={customParams.poidsQualiteVie}
                                                onChange={(e) => setCustomParams({
                                                    ...customParams,
                                                    poidsQualiteVie: parseFloat(e.target.value)
                                                })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Jours minimum entre gardes
                                            </label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="30"
                                                step="1"
                                                value={customParams.minJoursEntreGardes}
                                                onChange={(e) => setCustomParams({
                                                    ...customParams,
                                                    minJoursEntreGardes: parseInt(e.target.value)
                                                })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
                            {selectedPreset ? (
                                <Button
                                    onClick={() => handleGenerateSimulation(selectedPreset)}
                                    disabled={!!loading}
                                >
                                    {loading === selectedPreset ? 'Génération...' : `Générer avec '${simulationPresets.find(p => p.id === selectedPreset)?.name}'`}
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => handleGenerateSimulation()}
                                    disabled={!!loading}
                                >
                                    {loading === 'custom' ? 'Génération...' : 'Générer avec paramètres personnalisés'}
                                </Button>
                            )}
                        </div>
                    </Card>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                            {error}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PlanningSimulatorComponent; 