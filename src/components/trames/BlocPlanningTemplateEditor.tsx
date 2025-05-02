'use client';

import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, Trash, Copy, Download, Upload, Check, X, Clock, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    Trame,
    TramePeriod,
    Assignment,
    Post,
    WeekType,
    DayType,
    PostType,
    AssignmentType,
    trameAffectationService
} from '@/services/trameAffectationService';

// Composant principal
const BlocPlanningTemplateEditor: React.FC = () => {
    // États
    const [trames, setTrames] = useState<Trame[]>([]);
    const [selectedTrameId, setSelectedTrameId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('edit');

    // Chargement initial des trames
    useEffect(() => {
        loadTrames();
    }, []);

    // Fonction pour charger les trames
    const loadTrames = async () => {
        setIsLoading(true);
        try {
            const loadedTrames = await trameAffectationService.getAllTrames();
            setTrames(loadedTrames);
            if (loadedTrames.length > 0 && !selectedTrameId) {
                setSelectedTrameId(loadedTrames[0].id);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des trames:', error);
            toast.error('Impossible de charger les trames');
        } finally {
            setIsLoading(false);
        }
    };

    // Trouver la trame sélectionnée
    const selectedTrame = trames.find(t => t.id === selectedTrameId) || null;

    // Gestionnaire de changement de trame
    const handleTrameChange = (trameId: string) => {
        setSelectedTrameId(trameId);
    };

    // Fonction pour créer une nouvelle trame
    const handleCreateNewTrame = () => {
        const newTrame: Trame = {
            id: '',
            name: 'Nouvelle trame',
            description: 'Description de la nouvelle trame',
            weekType: 'ALL',
            dayType: 'WEEKDAY',
            isActive: true,
            isLocked: false,
            periods: [],
        };

        setTrames([...trames, newTrame]);
        setSelectedTrameId(newTrame.id);
    };

    // Fonction pour sauvegarder une trame
    const handleSaveTrame = async () => {
        if (!selectedTrame) return;

        setIsLoading(true);
        try {
            const savedTrame = await trameAffectationService.saveTrame(selectedTrame);
            if (savedTrame) {
                toast.success('Trame sauvegardée avec succès');
                await loadTrames();
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la trame:', error);
            toast.error('Impossible de sauvegarder la trame');
        } finally {
            setIsLoading(false);
        }
    };

    // Fonction pour copier une trame
    const handleCopyTrame = async () => {
        if (!selectedTrame) return;

        setIsLoading(true);
        try {
            const newName = `Copie de ${selectedTrame.name}`;
            const copiedTrame = await trameAffectationService.copyTrame(selectedTrame.id, newName);
            if (copiedTrame) {
                toast.success('Trame copiée avec succès');
                await loadTrames();
                setSelectedTrameId(copiedTrame.id);
            }
        } catch (error) {
            console.error('Erreur lors de la copie de la trame:', error);
            toast.error('Impossible de copier la trame');
        } finally {
            setIsLoading(false);
        }
    };

    // Fonction pour exporter une trame
    const handleExportTrame = () => {
        if (!selectedTrame) return;
        trameAffectationService.exportTrameToJSON(selectedTrame);
        toast.success('Trame exportée avec succès');
    };

    // Fonction pour importer une trame
    const handleImportTrame = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result as string;
                const importedTrame = JSON.parse(content) as Trame;

                // Réinitialiser l'ID pour créer une nouvelle trame
                importedTrame.id = '';
                importedTrame.name = `Importé: ${importedTrame.name}`;

                setIsLoading(true);
                const savedTrame = await trameAffectationService.saveTrame(importedTrame);
                if (savedTrame) {
                    toast.success('Trame importée avec succès');
                    await loadTrames();
                    setSelectedTrameId(savedTrame.id);
                }
            } catch (error) {
                console.error('Erreur lors de l\'import de la trame:', error);
                toast.error('Impossible d\'importer la trame: format invalide');
            } finally {
                setIsLoading(false);
            }
        };

        reader.readAsText(file);
    };

    // Contenu principal
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Select
                        value={selectedTrameId || ''}
                        onValueChange={handleTrameChange}
                        disabled={isLoading}
                    >
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Sélectionner une trame" />
                        </SelectTrigger>
                        <SelectContent>
                            {trames.map((trame) => (
                                <SelectItem key={trame.id} value={trame.id}>
                                    {trame.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCreateNewTrame}
                        disabled={isLoading}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Nouvelle
                    </Button>
                </div>

                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveTrame}
                        disabled={isLoading || !selectedTrame}
                    >
                        <Save className="h-4 w-4 mr-1" />
                        Enregistrer
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyTrame}
                        disabled={isLoading || !selectedTrame}
                    >
                        <Copy className="h-4 w-4 mr-1" />
                        Dupliquer
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportTrame}
                        disabled={isLoading || !selectedTrame}
                    >
                        <Download className="h-4 w-4 mr-1" />
                        Exporter
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('import-file')?.click()}
                        disabled={isLoading}
                    >
                        <Upload className="h-4 w-4 mr-1" />
                        Importer
                    </Button>
                    <input
                        id="import-file"
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleImportTrame}
                    />
                </div>
            </div>

            {selectedTrame ? (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="edit">Éditer</TabsTrigger>
                        <TabsTrigger value="preview">Prévisualiser</TabsTrigger>
                        <TabsTrigger value="validate">Valider</TabsTrigger>
                    </TabsList>

                    <TabsContent value="edit">
                        <Card>
                            <CardHeader>
                                <CardTitle>Édition de la trame</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">
                                    Les fonctionnalités d'édition complètes seront disponibles prochainement.
                                </p>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Nom de la trame</label>
                                            <Input
                                                value={selectedTrame.name}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    setTrames(trames.map(t =>
                                                        t.id === selectedTrame.id
                                                            ? { ...t, name: e.target.value }
                                                            : t
                                                    ));
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">Description</label>
                                            <Input
                                                value={selectedTrame.description || ''}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    setTrames(trames.map(t =>
                                                        t.id === selectedTrame.id
                                                            ? { ...t, description: e.target.value }
                                                            : t
                                                    ));
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Type de semaine</label>
                                            <Select
                                                value={selectedTrame.weekType}
                                                onValueChange={(value) => {
                                                    setTrames(trames.map(t =>
                                                        t.id === selectedTrame.id
                                                            ? { ...t, weekType: value as WeekType }
                                                            : t
                                                    ));
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Type de semaine" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">Toutes les semaines</SelectItem>
                                                    <SelectItem value="EVEN">Semaines paires</SelectItem>
                                                    <SelectItem value="ODD">Semaines impaires</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">Type de jour</label>
                                            <Select
                                                value={selectedTrame.dayType}
                                                onValueChange={(value) => {
                                                    setTrames(trames.map(t =>
                                                        t.id === selectedTrame.id
                                                            ? { ...t, dayType: value as DayType }
                                                            : t
                                                    ));
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Type de jour" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="WEEKDAY">Semaine</SelectItem>
                                                    <SelectItem value="WEEKEND">Week-end</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="preview">
                        <Card>
                            <CardHeader>
                                <CardTitle>Prévisualisation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 text-center text-muted-foreground">
                                    La prévisualisation sera disponible prochainement.
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="validate">
                        <Card>
                            <CardHeader>
                                <CardTitle>Validation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 text-center text-muted-foreground">
                                    La validation sera disponible prochainement.
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            ) : (
                <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                        {isLoading ? (
                            <p>Chargement des trames...</p>
                        ) : (
                            <p>Sélectionnez une trame existante ou créez-en une nouvelle.</p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default BlocPlanningTemplateEditor; 