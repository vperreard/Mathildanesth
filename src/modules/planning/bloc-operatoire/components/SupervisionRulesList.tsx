'use client';

import React, { useState } from 'react';
import { logger } from "../../../../lib/logger";
import {
    useSupervisionRulesQuery,
    useOperatingSectorsQuery,
    useDeleteSupervisionRuleMutation,
    useUpdateSupervisionRuleMutation,
    useCreateSupervisionRuleMutation
} from '../hooks/useOperatingResourceQueries';
import { OperatingSupervisionRule } from '../types';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { AlertTriangle, Edit, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';

// Schéma de validation Zod pour formulaire de règle de supervision
const ruleFormSchema = z.object({
    id: z.string().optional(),
    nom: z.string().min(1, 'Le nom est obligatoire'),
    description: z.string().optional(),
    type: z.enum(['BASIQUE', 'SPECIFIQUE', 'EXCEPTION']),
    secteurId: z.string().optional().nullable(),
    priorite: z.number().int().min(1, 'La priorité doit être au moins 1'),
    estActif: z.boolean().default(true),
    conditions: z.object({
        maxSallesParMAR: z.number().int().min(1, 'Minimum 1 salle par MAR'),
        maxSallesExceptionnel: z.number().int().optional(),
        supervisionInterne: z.boolean().optional(),
        supervisionContigues: z.boolean().optional(),
        competencesRequises: z.array(z.string()).optional(),
        supervisionDepuisAutreSecteur: z.array(z.string()).optional(),
        incompatibilites: z.array(z.string()).optional()
    })
});

type RuleFormValues = z.infer<typeof ruleFormSchema>;

export default function SupervisionRulesList() {
    const { data: rules = [], isLoading, error } = useSupervisionRulesQuery();
    const { data: sectors = [] } = useOperatingSectorsQuery();
    const createRuleMutation = useCreateSupervisionRuleMutation();
    const updateRuleMutation = useUpdateSupervisionRuleMutation();
    const deleteRuleMutation = useDeleteSupervisionRuleMutation();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<OperatingSupervisionRule | null>(null);
    const { toast } = useToast();

    const form = useForm<RuleFormValues>({
        resolver: zodResolver(ruleFormSchema) as any,
        defaultValues: {
            nom: '',
            description: '',
            type: 'BASIQUE',
            secteurId: null,
            priorite: 1,
            estActif: true,
            conditions: {
                maxSallesParMAR: 2,
                maxSallesExceptionnel: 3,
                supervisionInterne: false,
                supervisionContigues: false,
                competencesRequises: [],
                supervisionDepuisAutreSecteur: [],
                incompatibilites: []
            }
        }
    });

    // Fonctions de gestion d'affichage
    const getRuleTypeBadge = (type: 'BASIQUE' | 'SPECIFIQUE' | 'EXCEPTION') => {
        switch (type) {
            case 'BASIQUE':
                return <Badge variant="default">Basique</Badge>;
            case 'SPECIFIQUE':
                return <Badge variant="secondary">Spécifique</Badge>;
            case 'EXCEPTION':
                return <Badge variant="destructive">Exception</Badge>;
            default:
                return <Badge variant="outline">Inconnu</Badge>;
        }
    };

    const getSectorName = (sectorId: string | undefined | null) => {
        if (!sectorId) return 'Tous les secteurs';
        const sector = sectors.find(s => s.id === sectorId);
        return sector ? sector.nom : 'Secteur inconnu';
    };

    // Gestionnaires d'événements
    const handleAddRule = () => {
        form.reset({
            nom: '',
            description: '',
            type: 'BASIQUE',
            secteurId: null,
            priorite: 1,
            estActif: true,
            conditions: {
                maxSallesParMAR: 2,
                maxSallesExceptionnel: 3,
                supervisionInterne: false,
                supervisionContigues: false,
                competencesRequises: [],
                supervisionDepuisAutreSecteur: [],
                incompatibilites: []
            }
        });
        setIsDialogOpen(true);
    };

    const handleEditRule = (rule: OperatingSupervisionRule) => {
        form.reset({
            id: rule.id,
            nom: rule.nom,
            description: rule.description,
            type: rule.type,
            secteurId: rule.secteurId || null,
            priorite: rule.priorite,
            estActif: rule.estActif,
            conditions: {
                maxSallesParMAR: rule.conditions.maxSallesParMAR,
                maxSallesExceptionnel: rule.conditions.maxSallesExceptionnel,
                supervisionInterne: rule.conditions.supervisionInterne || false,
                supervisionContigues: rule.conditions.supervisionContigues || false,
                competencesRequises: rule.conditions.competencesRequises || [],
                supervisionDepuisAutreSecteur: rule.conditions.supervisionDepuisAutreSecteur || [],
                incompatibilites: rule.conditions.incompatibilites || []
            }
        });
        setIsDialogOpen(true);
    };

    const handleDeleteRule = (rule: OperatingSupervisionRule) => {
        setRuleToDelete(rule);
        setIsDeleteDialogOpen(true);
    };

    const confirmDeleteRule = async () => {
        if (!ruleToDelete) return;

        try {
            await deleteRuleMutation.mutateAsync(ruleToDelete.id);
            toast({
                title: 'Règle supprimée',
                description: `La règle "${ruleToDelete.nom}" a été supprimée avec succès.`
            });
            setIsDeleteDialogOpen(false);
            setRuleToDelete(null);
        } catch (error) {
            logger.error('Erreur lors de la suppression:', error);
            toast({
                variant: 'destructive',
                title: 'Erreur de suppression',
                description: 'Impossible de supprimer la règle.'
            });
        }
    };

    const onSubmit = async (values: RuleFormValues) => {
        try {
            if (values.id) {
                // Mise à jour
                await updateRuleMutation.mutateAsync({
                    id: values.id,
                    data: {
                        nom: values.nom,
                        description: values.description,
                        type: values.type,
                        secteurId: values.secteurId,
                        priorite: values.priorite,
                        estActif: values.estActif,
                        conditions: values.conditions
                    }
                });
                toast({
                    title: 'Règle mise à jour',
                    description: `La règle "${values.nom}" a été mise à jour avec succès.`
                });
            } else {
                // Création
                await createRuleMutation.mutateAsync({
                    nom: values.nom,
                    description: values.description,
                    type: values.type,
                    secteurId: values.secteurId,
                    priorite: values.priorite,
                    estActif: values.estActif,
                    conditions: values.conditions
                });
                toast({
                    title: 'Règle créée',
                    description: `La règle "${values.nom}" a été créée avec succès.`
                });
            }
            setIsDialogOpen(false);
        } catch (error) {
            logger.error('Erreur lors de l\'enregistrement:', error);
            toast({
                variant: 'destructive',
                title: 'Erreur d\'enregistrement',
                description: 'Impossible d\'enregistrer la règle de supervision.'
            });
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8">Chargement des règles de supervision...</div>;
    }

    if (error) {
        return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md my-4">
            Erreur: {error.message}
        </div>;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle>Règles de Supervision</CardTitle>
                    <CardDescription>Définissez les règles de supervision des salles du bloc opératoire</CardDescription>
                </div>
                <Button
                    onClick={handleAddRule}
                    size="sm"
                    className="flex items-center gap-1"
                >
                    <Plus size={16} />
                    Ajouter une règle
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Secteur</TableHead>
                            <TableHead>Max. Salles</TableHead>
                            <TableHead>Priorité</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rules.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                                    Aucune règle de supervision disponible
                                </TableCell>
                            </TableRow>
                        ) : (
                            rules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell className="font-medium">{rule.nom}</TableCell>
                                    <TableCell>{getRuleTypeBadge(rule.type)}</TableCell>
                                    <TableCell>{getSectorName(rule.secteurId)}</TableCell>
                                    <TableCell>
                                        {rule.conditions.maxSallesParMAR}
                                        {rule.conditions.maxSallesExceptionnel && (
                                            <span className="text-xs text-muted-foreground ml-1">
                                                (max {rule.conditions.maxSallesExceptionnel} exception)
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{rule.priorite}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={rule.estActif ? "default" : "secondary"}>
                                            {rule.estActif ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button
                                            onClick={() => handleEditRule(rule)}
                                            variant="outline"
                                            size="sm"
                                            className="px-2"
                                        >
                                            <Edit size={16} />
                                            <span className="sr-only">Modifier</span>
                                        </Button>
                                        <Button
                                            onClick={() => handleDeleteRule(rule)}
                                            variant="outline"
                                            size="sm"
                                            className="px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 size={16} />
                                            <span className="sr-only">Supprimer</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Dialogue de confirmation de suppression */}
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                            <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer la règle "{ruleToDelete?.nom}" ?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDeleteRule}>
                                Supprimer
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>

            {/* Dialogue de création/édition */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {form.getValues('id') ? 'Modifier une règle' : 'Ajouter une règle'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
                        <div className="grid gap-4 py-4">
                            {/* Informations de base */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="nom" className="text-right">
                                    Nom <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="nom"
                                    {...form.register('nom')}
                                    className={cn("col-span-3", form.formState.errors.nom && "border-red-500")}
                                />
                                {form.formState.errors.nom && (
                                    <p className="col-span-4 text-sm text-red-500 text-right -mt-3">
                                        {form.formState.errors.nom.message}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    {...form.register('description')}
                                    className="col-span-3"
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="type" className="text-right">
                                    Type <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={form.watch('type')}
                                    onValueChange={(value) => form.setValue('type', value as 'BASIQUE' | 'SPECIFIQUE' | 'EXCEPTION', { shouldValidate: true })}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Sélectionnez un type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BASIQUE">Règle basique (tous secteurs)</SelectItem>
                                        <SelectItem value="SPECIFIQUE">Règle spécifique (secteur précis)</SelectItem>
                                        <SelectItem value="EXCEPTION">Exception (priorité plus élevée)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {form.watch('type') !== 'BASIQUE' && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="secteurId" className="text-right">
                                        Secteur <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={form.watch('secteurId') || ''}
                                        onValueChange={(value) => form.setValue('secteurId', value || null, { shouldValidate: true })}
                                    >
                                        <SelectTrigger className={cn("col-span-3", form.formState.errors.secteurId && "border-red-500")}>
                                            <SelectValue placeholder="Sélectionnez un secteur" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sectors.length === 0 ? (
                                                <SelectItem value="no-sectors" disabled>
                                                    Aucun secteur disponible
                                                </SelectItem>
                                            ) : (
                                                sectors.map(sector => (
                                                    <SelectItem key={sector.id} value={sector.id}>
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-3 h-3 rounded-full"
                                                                style={{ backgroundColor: sector.couleur }}
                                                            />
                                                            <span>{sector.nom}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {form.watch('type') !== 'BASIQUE' && !form.watch('secteurId') && (
                                        <p className="col-span-4 text-sm text-amber-500 text-right -mt-3 flex items-center">
                                            <AlertTriangle size={14} className="mr-1" />
                                            Un secteur est requis pour les règles spécifiques et exceptions
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="priorite" className="text-right">
                                    Priorité <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="priorite"
                                    type="number"
                                    min={1}
                                    {...form.register('priorite', { valueAsNumber: true })}
                                    className={cn("col-span-3 w-24", form.formState.errors.priorite && "border-red-500")}
                                />
                                {form.formState.errors.priorite && (
                                    <p className="col-span-4 text-sm text-red-500 text-right -mt-3">
                                        {form.formState.errors.priorite.message}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="estActif" className="text-right">
                                    Active
                                </Label>
                                <div className="flex items-center col-span-3">
                                    <Switch
                                        checked={form.watch('estActif')}
                                        onChange={() => form.setValue('estActif', !form.watch('estActif'))}
                                        ariaLabel="Règle active"
                                    />
                                </div>
                            </div>

                            <div className="col-span-4">
                                <h3 className="font-medium text-primary mb-2">Conditions de supervision</h3>
                                <div className="border rounded-md p-4 space-y-4 bg-slate-50">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="maxSallesParMAR" className="text-right">
                                            Max. salles par MAR <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="maxSallesParMAR"
                                            type="number"
                                            min={1}
                                            {...form.register('conditions.maxSallesParMAR', { valueAsNumber: true })}
                                            className={cn("w-24", form.formState.errors.conditions?.maxSallesParMAR && "border-red-500")}
                                        />
                                        {form.formState.errors.conditions?.maxSallesParMAR && (
                                            <p className="col-span-4 text-sm text-red-500 text-right -mt-3">
                                                {form.formState.errors.conditions.maxSallesParMAR.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="maxSallesExceptionnel" className="text-right">
                                            Max. salles (exceptionnel)
                                        </Label>
                                        <Input
                                            id="maxSallesExceptionnel"
                                            type="number"
                                            min={1}
                                            {...form.register('conditions.maxSallesExceptionnel', { valueAsNumber: true })}
                                            className="w-24"
                                        />
                                    </div>

                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="supervisionInterne" className="text-right">
                                            Supervision interne uniquement
                                        </Label>
                                        <div className="flex items-center">
                                            <Switch
                                                checked={form.watch('conditions.supervisionInterne')}
                                                onChange={() => form.setValue('conditions.supervisionInterne', !form.watch('conditions.supervisionInterne'))}
                                                ariaLabel="Supervision interne uniquement"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="supervisionContigues" className="text-right">
                                            Salles contiguës uniquement
                                        </Label>
                                        <div className="flex items-center">
                                            <Switch
                                                checked={form.watch('conditions.supervisionContigues')}
                                                onChange={() => form.setValue('conditions.supervisionContigues', !form.watch('conditions.supervisionContigues'))}
                                                ariaLabel="Salles contiguës uniquement"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                isLoading={createRuleMutation.isPending || updateRuleMutation.isPending}
                            >
                                {form.getValues('id') ? 'Mettre à jour' : 'Créer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
} 