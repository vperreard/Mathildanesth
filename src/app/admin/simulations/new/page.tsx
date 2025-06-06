"use client";

import React, { useState, useEffect } from 'react';
import { logger } from "../../../../lib/logger";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, Loader2, Save, PlusCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Types
interface SimulationRule {
    id: string;
    type: string;
    description: string;
    enabled: boolean;
    priority: number;
    parameters: Record<string, unknown>;
}

interface SimulationTemplate {
    id: string;
    name: string;
    category?: string;
}

export default function NewSimulationPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [templates, setTemplates] = useState<SimulationTemplate[]>([]);

    // États du formulaire
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(new Date(new Date().setDate(new Date().getDate() + 14)));
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [selectedSite, setSelectedSite] = useState<string>('');
    const [sites, setSites] = useState<{ id: string, name: string }[]>([]);
    const [parameters, setParameters] = useState<Record<string, unknown>>({
        maxShiftsPerWeek: 5,
        minRestBetweenShifts: 11,
        enforceSkillRequirements: true,
        considerPreferences: true,
        allowWeekendOverrides: false
    });
    const [rules, setRules] = useState<SimulationRule[]>([
        {
            id: '1',
            type: 'MAX_CONSECUTIVE_DAYS',
            description: 'Maximum 5 jours consécutifs de travail',
            enabled: true,
            priority: 1,
            parameters: { maxDays: 5 }
        },
        {
            id: '2',
            type: 'MIN_REST_BETWEEN_SHIFTS',
            description: 'Repos minimum de 11h entre services',
            enabled: true,
            priority: 2,
            parameters: { minHours: 11 }
        },
        {
            id: '3',
            type: 'WEEKEND_BALANCE',
            description: 'Équilibrer les weekends de travail',
            enabled: true,
            priority: 3,
            parameters: { maxImbalance: 1 }
        }
    ]);

    // Charger les données initiales
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                // Charger les templates de simulation
                const templatesResponse = await fetch('http://localhost:3000/api/simulations/templates');
                if (templatesResponse.ok) {
                    const templatesData = await templatesResponse.json();
                    setTemplates(templatesData.data);
                }

                // Charger les sites
                const sitesResponse = await fetch('http://localhost:3000/api/sites');
                if (sitesResponse.ok) {
                    const sitesData = await sitesResponse.json();
                    setSites(sitesData.data);
                }
            } catch (error: unknown) {
                logger.error('Erreur lors du chargement des données initiales:', { error: error });
                toast.error('Erreur lors du chargement des données initiales');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Toggle l'état d'une règle
    const toggleRuleEnabled = (ruleId: string) => {
        setRules(prevRules =>
            prevRules.map(rule =>
                rule.id === ruleId
                    ? { ...rule, enabled: !rule.enabled }
                    : rule
            )
        );
    };

    // Met à jour un paramètre
    const updateParameter = (key: string, value: unknown) => {
        setParameters(prev => ({ ...prev, [key]: value }));
    };

    // Enregistrer le scénario
    const saveScenario = async () => {
        if (!name || !startDate || !endDate) {
            toast.error('Veuillez remplir tous les champs obligatoires');
            return;
        }

        if (endDate && startDate && endDate < startDate) {
            toast.error('La date de fin doit être postérieure à la date de début');
            return;
        }

        setIsSaving(true);
        try {
            // Préparer les données à envoyer
            const scenarioData = {
                name,
                description,
                startDate: startDate?.toISOString(),
                endDate: endDate?.toISOString(),
                templateId: selectedTemplateId || null,
                siteId: selectedSite || null,
                parameters: {
                    ...parameters,
                    rules: rules
                        .filter(rule => rule.enabled)
                        .map(({ id, type, priority, parameters }) => ({
                            type,
                            priority,
                            parameters
                        }))
                }
            };

            // Envoyer les données
            const response = await fetch('http://localhost:3000/api/simulations/scenarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(scenarioData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la création du scénario');
            }

            const result = await response.json();
            toast.success('Scénario créé avec succès');

            // Rediriger vers la page du scénario créé
            router.push(`/admin/simulations/scenarios/${result.data.id}`);
        } catch (error: unknown) {
            logger.error('Erreur lors de la création du scénario:', { error: error });
            toast.error(error instanceof Error ? error.message : 'Erreur lors de la création du scénario');
        } finally {
            setIsSaving(false);
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

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-8">
                <Link href="/admin/simulations" className="inline-flex items-center text-sm text-primary hover:underline mb-2">
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Retour à la liste des simulations
                </Link>
                <h1 className="text-3xl font-bold mb-2">Nouveau Scénario de Simulation</h1>
                <p className="text-muted-foreground">
                    Créez un scénario pour simuler un planning et analyser les résultats
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations de base</CardTitle>
                            <CardDescription>Définissez les paramètres principaux de la simulation</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="scenario-name" className="mb-1 block">Nom du scénario <span className="text-red-500">*</span></Label>
                                <Input
                                    id="scenario-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex: Simulation planning été 2024"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <Label htmlFor="scenario-description" className="mb-1 block">Description</Label>
                                <Textarea
                                    id="scenario-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Décrivez l'objectif de cette simulation..."
                                    className="w-full h-20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="mb-1 block">Date de début <span className="text-red-500">*</span></Label>
                                    <DatePicker
                                        selected={startDate}
                                        onSelect={setStartDate}
                                    />
                                </div>
                                <div>
                                    <Label className="mb-1 block">Date de fin <span className="text-red-500">*</span></Label>
                                    <DatePicker
                                        selected={endDate}
                                        onSelect={setEndDate}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="template-select" className="mb-1 block">Modèle de simulation</Label>
                                    <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                                        <SelectTrigger id="template-select">
                                            <SelectValue placeholder="Sélectionner un template" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Aucun template</SelectItem>
                                            {templates.map(template => (
                                                <SelectItem key={template.id} value={template.id}>
                                                    {template.name} {template.category ? `(${template.category})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="site-select" className="mb-1 block">Site</Label>
                                    <Select value={selectedSite} onValueChange={setSelectedSite}>
                                        <SelectTrigger id="site-select">
                                            <SelectValue placeholder="Sélectionner un site" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Tous les sites</SelectItem>
                                            {sites.map(site => (
                                                <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="rules" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="rules">Règles et Contraintes</TabsTrigger>
                            <TabsTrigger value="preferences">Préférences</TabsTrigger>
                            <TabsTrigger value="advanced">Paramètres avancés</TabsTrigger>
                        </TabsList>

                        <TabsContent value="rules">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Règles et Contraintes</CardTitle>
                                    <CardDescription>Configurez les règles appliquées lors de la simulation</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {rules.map(rule => (
                                            <div key={rule.id} className="flex items-start space-x-3 p-3 rounded-md border bg-card">
                                                <Checkbox
                                                    id={`rule-${rule.id}`}
                                                    checked={rule.enabled}
                                                    onCheckedChange={() => toggleRuleEnabled(rule.id)}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1">
                                                    <Label htmlFor={`rule-${rule.id}`} className="font-medium">
                                                        {rule.description}
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Type: {rule.type}, Priorité: {rule.priority}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="text-center pt-2">
                                            <Button variant="outline" size="sm" type="button" disabled>
                                                <PlusCircle className="h-4 w-4 mr-2" />
                                                Ajouter une règle personnalisée
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="preferences">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Préférences</CardTitle>
                                    <CardDescription>Définissez les préférences à prendre en compte</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label htmlFor="consider-preferences" className="text-base">Prendre en compte les préférences</Label>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Permet d'intégrer les préférences individuelles dans la génération du planning
                                                </p>
                                            </div>
                                            <Checkbox
                                                id="consider-preferences"
                                                checked={parameters.considerPreferences}
                                                onCheckedChange={(checked) => updateParameter('considerPreferences', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label htmlFor="weekend-overrides" className="text-base">Permettre les dérogations weekend</Label>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Autorise certaines exceptions aux règles pour les weekends
                                                </p>
                                            </div>
                                            <Checkbox
                                                id="weekend-overrides"
                                                checked={parameters.allowWeekendOverrides}
                                                onCheckedChange={(checked) => updateParameter('allowWeekendOverrides', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label htmlFor="enforce-skills" className="text-base">Exiger les compétences requises</Label>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Vérifie que le personnel affecté possède les compétences nécessaires
                                                </p>
                                            </div>
                                            <Checkbox
                                                id="enforce-skills"
                                                checked={parameters.enforceSkillRequirements}
                                                onCheckedChange={(checked) => updateParameter('enforceSkillRequirements', checked)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="advanced">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Paramètres avancés</CardTitle>
                                    <CardDescription>Ajustez les paramètres fins de la simulation</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="max-shifts" className="mb-1 block">Nombre maximum de services par semaine</Label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    id="max-shifts"
                                                    type="number"
                                                    min={1}
                                                    max={7}
                                                    value={parameters.maxShiftsPerWeek}
                                                    onChange={(e) => updateParameter('maxShiftsPerWeek', parseInt(e.target.value) || 0)}
                                                    className="w-20"
                                                />
                                                <span className="text-sm text-muted-foreground">services</span>
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="min-rest" className="mb-1 block">Repos minimum entre services</Label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    id="min-rest"
                                                    type="number"
                                                    min={0}
                                                    max={48}
                                                    value={parameters.minRestBetweenShifts}
                                                    onChange={(e) => updateParameter('minRestBetweenShifts', parseInt(e.target.value) || 0)}
                                                    className="w-20"
                                                />
                                                <span className="text-sm text-muted-foreground">heures</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <div>
                    <Card className="sticky top-4">
                        <CardHeader>
                            <CardTitle>Résumé</CardTitle>
                            <CardDescription>Aperçu du scénario à créer</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="font-medium">{name || 'Nouveau scénario'}</p>
                                <p className="text-sm text-muted-foreground">{description || 'Aucune description'}</p>
                            </div>

                            <div className="text-sm">
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Période</span>
                                    <span>
                                        {startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Modèle</span>
                                    <span>
                                        {templates.find(t => t.id === selectedTemplateId)?.name || 'Aucun'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Site</span>
                                    <span>
                                        {sites.find(s => s.id === selectedSite)?.name || 'Tous les sites'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Règles actives</span>
                                    <span>
                                        {rules.filter(r => r.enabled).length} / {rules.length}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3">
                            <Button
                                className="w-full"
                                onClick={saveScenario}
                                disabled={isSaving || !name || !startDate || !endDate}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Enregistrement...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Créer le scénario
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push('/admin/simulations')}
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Annuler
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
} 