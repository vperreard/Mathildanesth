'use client';

import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Card,
    CardContent
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
    PlusCircle,
    PencilLine,
    Trash2,
    AlertCircle,
    Zap,
    ShieldCheck,
    List,
    Hash,
    Check,
    FileWarning
} from 'lucide-react';

import { SupervisionRule, BlocSector } from '@/types/bloc-planning-types';
import { blocPlanningService } from '@/modules/planning/bloc-operatoire/services/blocPlanningService';

// Interface pour le formulaire de règle de supervision
interface RegleFormData {
    id?: string;
    nom: string;
    description: string;
    secteurId?: string;
    type: 'BASIQUE' | 'SPECIFIQUE' | 'EXCEPTION';
    maxSallesParMAR: number;
    maxSallesExceptionnel?: number;
    supervisionInterne: boolean;
    supervisionContigues: boolean;
    competencesRequises: string[];
    supervisionDepuisAutreSecteur: string[];
    incompatibilites: string[];
    priorite: number;
    estActif: boolean;
}

/**
 * Composant d'administration des règles de supervision du bloc opératoire
 */
export default function ReglesSupervisionAdmin() {
    // États
    const [regles, setRegles] = useState<SupervisionRule[]>([]);
    const [secteurs, setSecteurs] = useState<BlocSector[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [currentRegle, setCurrentRegle] = useState<RegleFormData | null>(null);
    const [competenceInput, setCompetenceInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('regles');

    // Charger les données initiales
    useEffect(() => {
        loadData();
    }, []);

    // Fonction pour charger les données
    const loadData = async () => {
        setIsLoading(true);
        try {
            const [reglesData, secteursData] = await Promise.all([
                blocPlanningService.getAllSupervisionRules(),
                blocPlanningService.getAllSectors()
            ]);
            setRegles(reglesData);
            setSecteurs(secteursData);
        } catch (err) {
            setError('Erreur lors du chargement des données');
            console.error('Erreur de chargement:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Ouvrir le dialogue pour ajouter une nouvelle règle
    const handleAddRegle = () => {
        setCurrentRegle({
            nom: '',
            description: '',
            secteurId: undefined,
            type: 'BASIQUE',
            maxSallesParMAR: 2,
            maxSallesExceptionnel: 3,
            supervisionInterne: false,
            supervisionContigues: false,
            competencesRequises: [],
            supervisionDepuisAutreSecteur: [],
            incompatibilites: [],
            priorite: 1,
            estActif: true
        });
        setShowDialog(true);
    };

    // Ouvrir le dialogue pour modifier une règle existante
    const handleEditRegle = (regle: SupervisionRule) => {
        setCurrentRegle({
            id: regle.id,
            nom: regle.nom,
            description: regle.description || '',
            secteurId: regle.secteurId,
            type: regle.type,
            maxSallesParMAR: regle.conditions.maxSallesParMAR,
            maxSallesExceptionnel: regle.conditions.maxSallesExceptionnel,
            supervisionInterne: regle.conditions.supervisionInterne || false,
            supervisionContigues: regle.conditions.supervisionContigues || false,
            competencesRequises: regle.conditions.competencesRequises || [],
            supervisionDepuisAutreSecteur: regle.conditions.supervisionDepuisAutreSecteur || [],
            incompatibilites: regle.conditions.incompatibilites || [],
            priorite: regle.priorite,
            estActif: regle.estActif
        });
        setShowDialog(true);
    };

    // Ouvrir le dialogue de confirmation de suppression
    const handleDeleteClick = (regle: SupervisionRule) => {
        setCurrentRegle({
            id: regle.id,
            nom: regle.nom,
            description: regle.description || '',
            secteurId: regle.secteurId,
            type: regle.type,
            maxSallesParMAR: regle.conditions.maxSallesParMAR,
            maxSallesExceptionnel: regle.conditions.maxSallesExceptionnel,
            supervisionInterne: regle.conditions.supervisionInterne || false,
            supervisionContigues: regle.conditions.supervisionContigues || false,
            competencesRequises: regle.conditions.competencesRequises || [],
            supervisionDepuisAutreSecteur: regle.conditions.supervisionDepuisAutreSecteur || [],
            incompatibilites: regle.conditions.incompatibilites || [],
            priorite: regle.priorite,
            estActif: regle.estActif
        });
        setShowDeleteDialog(true);
    };

    // Confirmer la suppression d'une règle
    const handleDeleteConfirm = async () => {
        if (!currentRegle?.id) return;

        setIsSubmitting(true);
        try {
            await blocPlanningService.deleteSupervisionRule(currentRegle.id);
            setRegles(prev => prev.filter(r => r.id !== currentRegle.id));
            toast({
                title: "Règle supprimée",
                description: `La règle ${currentRegle.nom} a été supprimée avec succès.`,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
            toast({
                title: "Erreur",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
            setShowDeleteDialog(false);
        }
    };

    // Gérer les changements du formulaire
    const handleInputChange = (field: keyof RegleFormData, value: any) => {
        if (!currentRegle) return;

        // Si on change le type, réinitialiser certains champs
        if (field === 'type' && value !== currentRegle.type) {
            if (value === 'BASIQUE') {
                setCurrentRegle({
                    ...currentRegle,
                    type: value,
                    secteurId: undefined,
                    supervisionInterne: false,
                    supervisionContigues: false,
                    competencesRequises: [],
                    supervisionDepuisAutreSecteur: [],
                    incompatibilites: []
                });
                return;
            }
        }

        setCurrentRegle({
            ...currentRegle,
            [field]: value
        });
    };

    // Ajouter une compétence requise
    const handleAddCompetence = () => {
        if (!competenceInput.trim() || !currentRegle) return;

        if (!currentRegle.competencesRequises.includes(competenceInput.trim())) {
            setCurrentRegle({
                ...currentRegle,
                competencesRequises: [...currentRegle.competencesRequises, competenceInput.trim()]
            });
        }
        setCompetenceInput('');
    };

    // Supprimer une compétence requise
    const handleRemoveCompetence = (competence: string) => {
        if (!currentRegle) return;
        setCurrentRegle({
            ...currentRegle,
            competencesRequises: currentRegle.competencesRequises.filter(c => c !== competence)
        });
    };

    // Toggle secteur dans la liste des secteurs de supervision ou incompatibilités
    const handleToggleSecteur = (secteurId: string, field: 'supervisionDepuisAutreSecteur' | 'incompatibilites') => {
        if (!currentRegle) return;

        const isIncluded = currentRegle[field].includes(secteurId);

        if (isIncluded) {
            // Retirer de la liste
            setCurrentRegle({
                ...currentRegle,
                [field]: currentRegle[field].filter(id => id !== secteurId)
            });
        } else {
            // Ajouter à la liste
            setCurrentRegle({
                ...currentRegle,
                [field]: [...currentRegle[field], secteurId]
            });
        }
    };

    // Soumettre le formulaire
    const handleSubmit = async () => {
        if (!currentRegle) return;

        // Validation
        if (!currentRegle.nom.trim()) {
            toast({
                title: "Erreur de validation",
                description: "Le nom de la règle est obligatoire.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const regleData: Omit<SupervisionRule, 'id' | 'createdAt' | 'updatedAt'> = {
                nom: currentRegle.nom.trim(),
                description: currentRegle.description.trim() || undefined,
                secteurId: currentRegle.secteurId,
                type: currentRegle.type,
                conditions: {
                    maxSallesParMAR: currentRegle.maxSallesParMAR,
                    maxSallesExceptionnel: currentRegle.maxSallesExceptionnel,
                    supervisionInterne: currentRegle.supervisionInterne || undefined,
                    supervisionContigues: currentRegle.supervisionContigues || undefined,
                    competencesRequises: currentRegle.competencesRequises.length > 0
                        ? currentRegle.competencesRequises
                        : undefined,
                    supervisionDepuisAutreSecteur: currentRegle.supervisionDepuisAutreSecteur.length > 0
                        ? currentRegle.supervisionDepuisAutreSecteur
                        : undefined,
                    incompatibilites: currentRegle.incompatibilites.length > 0
                        ? currentRegle.incompatibilites
                        : undefined
                },
                priorite: currentRegle.priorite,
                estActif: currentRegle.estActif
            };

            let updatedRegle: SupervisionRule;

            if (currentRegle.id) {
                // Mise à jour
                updatedRegle = await blocPlanningService.updateSupervisionRule(
                    currentRegle.id,
                    regleData
                );
                setRegles(prev => prev.map(r => r.id === currentRegle.id ? updatedRegle : r));
                toast({
                    title: "Règle mise à jour",
                    description: `La règle ${updatedRegle.nom} a été mise à jour avec succès.`
                });
            } else {
                // Création
                updatedRegle = await blocPlanningService.createSupervisionRule(regleData);
                setRegles(prev => [...prev, updatedRegle]);
                toast({
                    title: "Règle ajoutée",
                    description: `La règle ${updatedRegle.nom} a été ajoutée avec succès.`
                });
            }

            setShowDialog(false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
            toast({
                title: "Erreur",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Obtenir le nom d'un secteur par son ID
    const getSecteurName = (secteurId?: string) => {
        if (!secteurId) return 'Tous les secteurs';
        const secteur = secteurs.find(s => s.id === secteurId);
        return secteur ? secteur.nom : 'Secteur inconnu';
    };

    // Obtenir un badge pour le type de règle
    const getTypeRegleBadge = (type: string) => {
        switch (type) {
            case 'BASIQUE':
                return <Badge variant="default" className="flex items-center gap-1">
                    <List className="h-3 w-3" />
                    Basique
                </Badge>;
            case 'SPECIFIQUE':
                return <Badge variant="outline" className="flex items-center gap-1 border-blue-400 text-blue-600">
                    <Zap className="h-3 w-3" />
                    Spécifique
                </Badge>;
            case 'EXCEPTION':
                return <Badge variant="outline" className="flex items-center gap-1 border-amber-400 text-amber-600">
                    <FileWarning className="h-3 w-3" />
                    Exception
                </Badge>;
            default:
                return <Badge>{type}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-6 w-full max-w-md">
                    <TabsTrigger value="regles">Règles de supervision</TabsTrigger>
                    <TabsTrigger value="parametres">Paramètres globaux</TabsTrigger>
                </TabsList>

                <TabsContent value="regles" className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-center">
                            <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                            {error}
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Règles de supervision</h2>
                        <Button onClick={handleAddRegle}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Ajouter une règle
                        </Button>
                    </div>

                    {isLoading ? (
                        <p className="text-center py-4">Chargement des règles...</p>
                    ) : regles.length === 0 ? (
                        <Card>
                            <CardContent className="p-6 text-center text-muted-foreground">
                                Aucune règle de supervision n'a été configurée.
                                <div className="mt-4">
                                    <Button variant="outline" onClick={handleAddRegle}>
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Ajouter votre première règle
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Table>
                            <TableCaption>Liste des règles de supervision configurées</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-1/6">Type</TableHead>
                                    <TableHead className="w-1/4">Nom</TableHead>
                                    <TableHead className="w-1/4">Secteur</TableHead>
                                    <TableHead className="w-1/6">Max Salles</TableHead>
                                    <TableHead className="w-1/6">Priorité</TableHead>
                                    <TableHead className="w-1/6 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {regles.map(regle => (
                                    <TableRow key={regle.id} className={!regle.estActif ? 'opacity-60' : ''}>
                                        <TableCell>{getTypeRegleBadge(regle.type)}</TableCell>
                                        <TableCell><strong>{regle.nom}</strong></TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {getSecteurName(regle.secteurId)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Hash className="h-3 w-3 text-muted-foreground" />
                                                {regle.conditions.maxSallesParMAR}
                                                {regle.conditions.maxSallesExceptionnel && (
                                                    <span className="text-xs text-muted-foreground ml-1">
                                                        (max {regle.conditions.maxSallesExceptionnel})
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {regle.priorite}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditRegle(regle)}
                                                title="Modifier"
                                            >
                                                <PencilLine className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteClick(regle)}
                                                title="Supprimer"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </TabsContent>

                <TabsContent value="parametres" className="space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold mb-4">Paramètres de supervision globaux</h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="default-max-rooms">Nombre maximum de salles par défaut</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="default-max-rooms"
                                                type="number"
                                                min="1"
                                                max="10"
                                                className="w-16 text-center"
                                                value="2"
                                                readOnly
                                            />
                                            <span className="text-sm text-muted-foreground">salles/MAR</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="max-exceptional">Maximum exceptionnel</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="max-exceptional"
                                                type="number"
                                                min="1"
                                                max="10"
                                                className="w-16 text-center"
                                                value="3"
                                                readOnly
                                            />
                                            <span className="text-sm text-muted-foreground">salles/MAR</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 mt-6">
                                        <Checkbox id="default-contiguous" checked={false} disabled />
                                        <Label htmlFor="default-contiguous" className="text-muted-foreground">
                                            Supervision de salles contiguës par défaut
                                        </Label>
                                    </div>

                                    <div className="border-t pt-4 mt-4">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Note: Ces paramètres par défaut sont utilisés lorsqu'aucune règle spécifique ne s'applique.
                                            Vous pouvez créer des règles personnalisées pour remplacer ces valeurs.
                                        </p>

                                        <div className="flex justify-end mt-4">
                                            <Button variant="outline" disabled>
                                                <ShieldCheck className="h-4 w-4 mr-2" />
                                                Mettre à jour les paramètres globaux
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Dialogue d'ajout/modification */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {currentRegle?.id ? 'Modifier la règle' : 'Ajouter une règle de supervision'}
                        </DialogTitle>
                        <DialogDescription>
                            {currentRegle?.id
                                ? 'Modifiez les paramètres de la règle de supervision.'
                                : 'Créez une nouvelle règle de supervision en remplissant le formulaire.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nom" className="text-right">
                                    Nom <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="nom"
                                    value={currentRegle?.nom || ''}
                                    onChange={(e) => handleInputChange('nom', e.target.value)}
                                    placeholder="Ex: Règle standard"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">
                                    Type de règle <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={currentRegle?.type || 'BASIQUE'}
                                    onValueChange={(value) => handleInputChange('type', value)}
                                >
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Sélectionner un type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BASIQUE">Basique (tous secteurs)</SelectItem>
                                        <SelectItem value="SPECIFIQUE">Spécifique (par secteur)</SelectItem>
                                        <SelectItem value="EXCEPTION">Exception</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={currentRegle?.description || ''}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Description de la règle (optionnel)"
                                rows={2}
                            />
                        </div>

                        {currentRegle?.type !== 'BASIQUE' && (
                            <div className="space-y-2">
                                <Label htmlFor="secteur">
                                    Secteur concerné {currentRegle?.type === 'SPECIFIQUE' && <span className="text-red-500">*</span>}
                                </Label>
                                <Select
                                    value={currentRegle?.secteurId || ''}
                                    onValueChange={(value) => handleInputChange('secteurId', value)}
                                >
                                    <SelectTrigger id="secteur">
                                        <SelectValue placeholder="Sélectionner un secteur" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currentRegle?.type === 'EXCEPTION' && (
                                            <SelectItem value="">Tous les secteurs</SelectItem>
                                        )}
                                        {secteurs.map((secteur) => (
                                            <SelectItem key={secteur.id} value={secteur.id}>
                                                {secteur.nom}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="maxSallesParMAR">
                                    Maximum de salles par MAR <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="maxSallesParMAR"
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={currentRegle?.maxSallesParMAR || 2}
                                    onChange={(e) => handleInputChange(
                                        'maxSallesParMAR',
                                        parseInt(e.target.value)
                                    )}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="maxSallesExceptionnel">
                                    Maximum exceptionnel (si besoin)
                                </Label>
                                <Input
                                    id="maxSallesExceptionnel"
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={currentRegle?.maxSallesExceptionnel || ''}
                                    onChange={(e) => handleInputChange(
                                        'maxSallesExceptionnel',
                                        e.target.value ? parseInt(e.target.value) : undefined
                                    )}
                                    placeholder="Optionnel"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priorite">
                                Priorité de la règle <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center gap-4">
                                <Slider
                                    id="priorite"
                                    min={1}
                                    max={10}
                                    step={1}
                                    value={[currentRegle?.priorite || 1]}
                                    onValueChange={(values) => handleInputChange('priorite', values[0])}
                                    className="flex-1"
                                />
                                <div className="w-12 text-center font-medium">
                                    {currentRegle?.priorite || 1}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Plus la priorité est élevée, plus la règle sera appliquée en priorité en cas de conflit.
                            </p>
                        </div>

                        {currentRegle?.type !== 'BASIQUE' && (
                            <>
                                <div className="space-y-2 mt-2">
                                    <h3 className="text-sm font-medium">Conditions spécifiques</h3>

                                    <div className="space-y-3 pl-1">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="supervisionInterne"
                                                checked={currentRegle?.supervisionInterne || false}
                                                onCheckedChange={(checked) =>
                                                    handleInputChange('supervisionInterne', checked === true)
                                                }
                                            />
                                            <Label htmlFor="supervisionInterne">
                                                Supervision uniquement par le personnel du secteur
                                            </Label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="supervisionContigues"
                                                checked={currentRegle?.supervisionContigues || false}
                                                onCheckedChange={(checked) =>
                                                    handleInputChange('supervisionContigues', checked === true)
                                                }
                                            />
                                            <Label htmlFor="supervisionContigues">
                                                Les salles supervisées doivent être contiguës
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                {/* Compétences requises */}
                                <div className="space-y-2">
                                    <Label htmlFor="competences">Compétences requises</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="competences"
                                            value={competenceInput}
                                            onChange={(e) => setCompetenceInput(e.target.value)}
                                            placeholder="Ajouter une compétence requise"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddCompetence();
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={handleAddCompetence}
                                        >
                                            <PlusCircle className="h-4 w-4 mr-1" /> Ajouter
                                        </Button>
                                    </div>

                                    {currentRegle?.competencesRequises && currentRegle.competencesRequises.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {currentRegle.competencesRequises.map((competence, index) => (
                                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                                    <Check className="h-3 w-3" />
                                                    {competence}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-4 w-4 p-0 ml-1"
                                                        onClick={() => handleRemoveCompetence(competence)}
                                                    >
                                                        <span className="sr-only">Supprimer</span>
                                                        ×
                                                    </Button>
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Aucune compétence requise définie
                                        </p>
                                    )}
                                </div>

                                {/* Secteurs pour supervision */}
                                <div className="space-y-2">
                                    <Label>Supervision depuis d'autres secteurs</Label>
                                    {secteurs.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            {secteurs
                                                .filter(s => !currentRegle?.secteurId || s.id !== currentRegle.secteurId)
                                                .map((secteur) => (
                                                    <div
                                                        key={secteur.id}
                                                        className="flex items-center space-x-2"
                                                    >
                                                        <Checkbox
                                                            id={`supervision-${secteur.id}`}
                                                            checked={currentRegle?.supervisionDepuisAutreSecteur.includes(secteur.id) || false}
                                                            onCheckedChange={() => handleToggleSecteur(
                                                                secteur.id,
                                                                'supervisionDepuisAutreSecteur'
                                                            )}
                                                        />
                                                        <Label
                                                            htmlFor={`supervision-${secteur.id}`}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <div
                                                                className="w-3 h-3 rounded-full"
                                                                style={{ backgroundColor: secteur.couleur || '#CBD5E1' }}
                                                            />
                                                            {secteur.nom}
                                                        </Label>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Aucun secteur disponible
                                        </p>
                                    )}
                                </div>

                                {/* Incompatibilités */}
                                <div className="space-y-2">
                                    <Label>Secteurs incompatibles</Label>
                                    {secteurs.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            {secteurs
                                                .filter(s => !currentRegle?.secteurId || s.id !== currentRegle.secteurId)
                                                .map((secteur) => (
                                                    <div
                                                        key={secteur.id}
                                                        className="flex items-center space-x-2"
                                                    >
                                                        <Checkbox
                                                            id={`incompatible-${secteur.id}`}
                                                            checked={currentRegle?.incompatibilites.includes(secteur.id) || false}
                                                            onCheckedChange={() => handleToggleSecteur(
                                                                secteur.id,
                                                                'incompatibilites'
                                                            )}
                                                        />
                                                        <Label
                                                            htmlFor={`incompatible-${secteur.id}`}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <div
                                                                className="w-3 h-3 rounded-full"
                                                                style={{ backgroundColor: secteur.couleur || '#CBD5E1' }}
                                                            />
                                                            {secteur.nom}
                                                        </Label>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Aucun secteur disponible
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="flex items-center space-x-2 mt-2">
                            <Checkbox
                                id="estActif"
                                checked={currentRegle?.estActif || false}
                                onCheckedChange={(checked) =>
                                    handleInputChange('estActif', checked === true)
                                }
                            />
                            <Label htmlFor="estActif">
                                Règle active et applicable lors de la validation
                            </Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDialog(false)}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? 'Enregistrement...'
                                : currentRegle?.id
                                    ? 'Enregistrer les modifications'
                                    : 'Ajouter la règle'
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialogue de confirmation de suppression */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirmer la suppression</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer la règle "{currentRegle?.nom}" ?
                            Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 my-4">
                        <p className="text-yellow-800 text-sm">
                            <AlertCircle className="h-4 w-4 inline-block mr-2 text-yellow-500" />
                            La suppression de cette règle peut affecter la validation des plannings existants.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Suppression...' : 'Supprimer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 