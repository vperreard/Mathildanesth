"use client";

import React, { useState, useEffect } from 'react';
import { logger } from "../../../../../lib/logger";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, Lightbulb, Settings, Users, Calendar, Loader2, SaveIcon, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { fetchTemplates, SimulationTemplate } from '@/services/simulationTemplateService';

interface RecommendationSettings {
    enabled: boolean;
    contextual: boolean;
    priority: {
        usage: number;
        recency: number;
        seasonality: number;
    };
    showFor: {
        newUsers: boolean;
        experiencedUsers: boolean;
        administrators: boolean;
    };
    maxRecommendations: number;
}

export default function TemplatesRecommendationsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [templates, setTemplates] = useState<SimulationTemplate[]>([]);
    const [featuredTemplates, setFeaturedTemplates] = useState<string[]>([]);
    const [hiddenTemplates, setHiddenTemplates] = useState<string[]>([]);

    const [settings, setSettings] = useState<RecommendationSettings>({
        enabled: true,
        contextual: true,
        priority: {
            usage: 60,
            recency: 25,
            seasonality: 15,
        },
        showFor: {
            newUsers: true,
            experiencedUsers: true,
            administrators: false,
        },
        maxRecommendations: 3,
    });

    // Charger les données
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Charger la liste des templates
            const templatesData = await fetchTemplates();
            setTemplates(templatesData);

            // Simuler le chargement des préférences de recommandation
            // Dans une version réelle, cela viendrait d'une API
            await new Promise(resolve => setTimeout(resolve, 500));

            // Simuler des templates mis en avant et masqués
            setFeaturedTemplates(['2', '5', '7']);
            setHiddenTemplates(['3', '9']);

        } catch (error: unknown) {
            logger.error('Erreur lors du chargement des données:', { error: error });
            toast.error('Erreur lors du chargement des données');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSettingsChange = (key: string, value: unknown) => {
        setSettings(prev => {
            // Gérer les chemins imbriqués avec la notation point
            if (key.includes('.')) {
                const [parent, child] = key.split('.');

                if (parent === 'priority' || parent === 'showFor') {
                    return {
                        ...prev,
                        [parent]: {
                            ...prev[parent as keyof RecommendationSettings] as Record<string, unknown>,
                            [child]: value
                        }
                    };
                }
            }

            return {
                ...prev,
                [key]: value
            };
        });
    };

    const toggleFeaturedTemplate = (templateId: string) => {
        if (featuredTemplates.includes(templateId)) {
            setFeaturedTemplates(featuredTemplates.filter(id => id !== templateId));
        } else {
            setFeaturedTemplates([...featuredTemplates, templateId]);
        }
    };

    const toggleHiddenTemplate = (templateId: string) => {
        if (hiddenTemplates.includes(templateId)) {
            setHiddenTemplates(hiddenTemplates.filter(id => id !== templateId));
        } else {
            setHiddenTemplates([...hiddenTemplates, templateId]);
        }
    };

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            // Simuler un appel API pour sauvegarder les paramètres
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('Paramètres de recommandation enregistrés');
        } catch (error: unknown) {
            toast.error('Erreur lors de l\'enregistrement des paramètres');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="container p-4 mx-auto flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p>Chargement des paramètres de recommandation...</p>
            </div>
        );
    }

    return (
        <div className="container p-4 mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Link href="/admin/simulations/templates" className="inline-flex items-center text-sm text-primary hover:underline mb-2">
                        <ArrowLeftIcon className="mr-2 h-4 w-4" />
                        Retour à la liste des templates
                    </Link>
                    <h1 className="text-2xl font-bold">Recommandations de Modèles</h1>
                    <p className="text-muted-foreground">
                        Configurez comment les templates sont recommandés aux utilisateurs
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={loadData}
                        disabled={isLoading}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Actualiser
                    </Button>
                    <Button
                        onClick={saveSettings}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <SaveIcon className="h-4 w-4 mr-2" />
                                Enregistrer
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="general">
                        <Settings className="h-4 w-4 mr-2" />
                        Paramètres généraux
                    </TabsTrigger>
                    <TabsTrigger value="content">
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Contenu recommandé
                    </TabsTrigger>
                    <TabsTrigger value="audience">
                        <Users className="h-4 w-4 mr-2" />
                        Audience
                    </TabsTrigger>
                    <TabsTrigger value="planification">
                        <Calendar className="h-4 w-4 mr-2" />
                        Planification
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Paramètres généraux</CardTitle>
                            <CardDescription>
                                Configurez les paramètres de base du système de recommandation
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="recommendation-enabled" className="text-base">Activer les recommandations</Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Affiche des recommandations de templates sur la page d'accueil et lors de la création de scénarios
                                    </p>
                                </div>
                                <Switch
                                    id="recommendation-enabled"
                                    checked={settings.enabled}
                                    onCheckedChange={(checked: boolean) => handleSettingsChange('enabled', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="contextual-recommendations" className="text-base">Recommandations contextuelles</Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Recommande des templates en fonction du contexte actuel (période de l'année, historique d'utilisation)
                                    </p>
                                </div>
                                <Switch
                                    id="contextual-recommendations"
                                    checked={settings.contextual}
                                    onCheckedChange={(checked: boolean) => handleSettingsChange('contextual', checked)}
                                    disabled={!settings.enabled}
                                />
                            </div>

                            <div>
                                <Label className="text-base mb-3 block">Nombre maximal de recommandations</Label>
                                <Select
                                    value={settings.maxRecommendations.toString()}
                                    onValueChange={(value) => handleSettingsChange('maxRecommendations', parseInt(value))}
                                    disabled={!settings.enabled}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Sélectionner..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 recommandation</SelectItem>
                                        <SelectItem value="2">2 recommandations</SelectItem>
                                        <SelectItem value="3">3 recommandations</SelectItem>
                                        <SelectItem value="4">4 recommandations</SelectItem>
                                        <SelectItem value="5">5 recommandations</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-base mb-3 block">Priorité des facteurs</Label>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <Label>Fréquence d'utilisation</Label>
                                            <span className="text-sm">{settings.priority.usage}%</span>
                                        </div>
                                        <Slider
                                            value={[settings.priority.usage]}
                                            max={100}
                                            step={5}
                                            onValueChange={(value) => handleSettingsChange('priority.usage', value[0])}
                                            disabled={!settings.enabled}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <Label>Utilisation récente</Label>
                                            <span className="text-sm">{settings.priority.recency}%</span>
                                        </div>
                                        <Slider
                                            value={[settings.priority.recency]}
                                            max={100}
                                            step={5}
                                            onValueChange={(value) => handleSettingsChange('priority.recency', value[0])}
                                            disabled={!settings.enabled}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <Label>Saisonnalité</Label>
                                            <span className="text-sm">{settings.priority.seasonality}%</span>
                                        </div>
                                        <Slider
                                            value={[settings.priority.seasonality]}
                                            max={100}
                                            step={5}
                                            onValueChange={(value) => handleSettingsChange('priority.seasonality', value[0])}
                                            disabled={!settings.enabled}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="content">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contenu recommandé</CardTitle>
                            <CardDescription>
                                Gérez les templates qui sont mis en avant ou masqués dans les recommandations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium mb-3">Modèles mis en avant</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Ces templates apparaîtront en priorité dans les recommandations
                                    </p>

                                    <div className="space-y-2">
                                        {templates.map(template => (
                                            <div key={`featured-${template.id}`} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`featured-${template.id}`}
                                                    checked={featuredTemplates.includes(template.id)}
                                                    onCheckedChange={() => toggleFeaturedTemplate(template.id)}
                                                    disabled={!settings.enabled || hiddenTemplates.includes(template.id)}
                                                />
                                                <Label
                                                    htmlFor={`featured-${template.id}`}
                                                    className="flex-grow"
                                                >
                                                    {template.name}
                                                    {template.category && (
                                                        <span className="text-xs text-muted-foreground ml-2">
                                                            ({template.category})
                                                        </span>
                                                    )}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium mb-3">Modèles masqués</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Ces templates n'apparaîtront jamais dans les recommandations
                                    </p>

                                    <div className="space-y-2">
                                        {templates.map(template => (
                                            <div key={`hidden-${template.id}`} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`hidden-${template.id}`}
                                                    checked={hiddenTemplates.includes(template.id)}
                                                    onCheckedChange={() => toggleHiddenTemplate(template.id)}
                                                    disabled={!settings.enabled || featuredTemplates.includes(template.id)}
                                                />
                                                <Label
                                                    htmlFor={`hidden-${template.id}`}
                                                    className="flex-grow"
                                                >
                                                    {template.name}
                                                    {template.category && (
                                                        <span className="text-xs text-muted-foreground ml-2">
                                                            ({template.category})
                                                        </span>
                                                    )}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="audience">
                    <Card>
                        <CardHeader>
                            <CardTitle>Audience cible</CardTitle>
                            <CardDescription>
                                Définissez à quels utilisateurs montrer des recommandations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="show-new-users"
                                        checked={settings.showFor.newUsers}
                                        onCheckedChange={(checked) => handleSettingsChange('showFor.newUsers', !!checked)}
                                        disabled={!settings.enabled}
                                    />
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="show-new-users">Nouveaux utilisateurs</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Utilisateurs ayant créé moins de 5 scénarios
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="show-experienced-users"
                                        checked={settings.showFor.experiencedUsers}
                                        onCheckedChange={(checked) => handleSettingsChange('showFor.experiencedUsers', !!checked)}
                                        disabled={!settings.enabled}
                                    />
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="show-experienced-users">Utilisateurs expérimentés</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Utilisateurs ayant déjà utilisé plusieurs templates
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="show-administrators"
                                        checked={settings.showFor.administrators}
                                        onCheckedChange={(checked) => handleSettingsChange('showFor.administrators', !!checked)}
                                        disabled={!settings.enabled}
                                    />
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="show-administrators">Administrateurs</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Utilisateurs avec des droits d'administration
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="planification">
                    <Card>
                        <CardHeader>
                            <CardTitle>Planification des recommandations</CardTitle>
                            <CardDescription>
                                Configurez quand et comment afficher certaines recommandations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-8 text-center text-muted-foreground">
                                <p>La planification des recommandations sera disponible dans une prochaine mise à jour.</p>
                                <p className="text-sm mt-2">Cette fonctionnalité permettra de programmer l'affichage de certains templates à des périodes spécifiques de l'année.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end">
                            <Button variant="outline" disabled>Configuration avancée</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 