'use client';

import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { OperatingRoom, BlocSector } from '@/types/bloc-planning-types';

// Schéma de validation pour le formulaire de salle
const salleFormSchema = z.object({
    id: z.number().optional(),
    number: z.string().min(1, 'Le numéro de salle est requis'),
    name: z.string().min(1, 'Le nom de la salle est requis'),
    operatingSectorId: z.number().min(1, 'Le secteur est requis'),
    isActive: z.boolean().default(true),
});


export default function SallesAdmin() {
    const [salles, setSalles] = useState<OperatingRoom[]>([]);
    const [secteurs, setSecteurs] = useState<BlocSector[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [salleToDelete, setSalleToDelete] = useState<OperatingRoom | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm({
        resolver: zodResolver(salleFormSchema),
        defaultValues: {
            number: '',
            name: '',
            operatingSectorId: 0,
            isActive: true,
        },
    });

    // Charger les données initiales
    useEffect(() => {
        loadData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const loadData = async () => {
        try {
            setIsLoading(true);
            
            // Charger les salles via l'API
            const sallesResponse = await fetch('/api/operating-rooms');
            if (!sallesResponse.ok) {
                throw new Error('Erreur lors du chargement des salles');
            }
            const sallesData = await sallesResponse.json();
            
            // Charger les secteurs via l'API
            const secteursResponse = await fetch('/api/operating-sectors');
            if (!secteursResponse.ok) {
                throw new Error('Erreur lors du chargement des secteurs');
            }
            const secteursData = await secteursResponse.json();

            setSalles(sallesData);
            setSecteurs(secteursData);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            toast({
                variant: 'destructive',
                title: 'Erreur de chargement',
                description: 'Impossible de charger les données des salles et secteurs',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditSalle = (salle: OperatingRoom) => {
        form.reset({
            id: salle.id,
            number: salle.number || '',
            name: salle.name || '',
            operatingSectorId: salle.operatingSectorId || 0,
            isActive: salle.isActive !== undefined ? salle.isActive : true,
        });
        setIsDialogOpen(true);
    };

    const handleAddSalle = () => {
        form.reset({
            number: '',
            name: '',
            operatingSectorId: 0,
            isActive: true,
        });
        setIsDialogOpen(true);
    };

    const handleDeleteClick = (salle: OperatingRoom) => {
        setSalleToDelete(salle);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!salleToDelete) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/operating-rooms/${salleToDelete.id}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                throw new Error('Erreur lors de la suppression');
            }
            
            toast({
                title: 'Salle supprimée',
                description: `La salle ${salleToDelete.name} a été supprimée avec succès`,
            });
            await loadData();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            toast({
                variant: 'destructive',
                title: 'Erreur de suppression',
                description: error instanceof Error ? error.message : 'Impossible de supprimer la salle',
            });
        } finally {
            setIsLoading(false);
            setIsDeleteDialogOpen(false);
            setSalleToDelete(null);
        }
    };

    const onSubmit = async (values: any) => {
        setIsLoading(true);
        try {
            if (values.id) {
                // Mise à jour d'une salle existante
                const response = await fetch(`/api/operating-rooms/${values.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(values),
                });
                
                if (!response.ok) {
                    throw new Error('Erreur lors de la mise à jour');
                }
                
                const updatedSalle = await response.json();
                toast({
                    title: 'Salle mise à jour',
                    description: `La salle ${updatedSalle.name || values.name} a été mise à jour avec succès`,
                });
            } else {
                // Création d'une nouvelle salle
                const response = await fetch('/api/operating-rooms', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(values),
                });
                
                if (!response.ok) {
                    throw new Error('Erreur lors de la création');
                }
                
                const newSalle = await response.json();
                toast({
                    title: 'Salle créée',
                    description: `La salle ${newSalle.name || values.name} a été créée avec succès`,
                });
            }

            await loadData();
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement:', error);
            toast({
                variant: 'destructive',
                title: 'Erreur d\'enregistrement',
                description: error instanceof Error ? error.message : 'Impossible d\'enregistrer la salle',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getSecteurNom = (secteurId: number) => {
        const secteur = secteurs.find(s => s.id === secteurId);
        return secteur ? secteur.name : 'Secteur inconnu';
    };

    const getSecteurCouleur = (secteurId: number) => {
        const secteur = secteurs.find(s => s.id === secteurId);
        return secteur ? secteur.colorCode : '#CCCCCC';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Liste des salles d'opération</h2>
                <Button onClick={handleAddSalle} className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Ajouter une salle
                </Button>
            </div>

            {salles.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-muted/20 rounded-md border border-dashed">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center mb-4">
                        Aucune salle d'opération n'a été configurée
                    </p>
                    <Button onClick={handleAddSalle} variant="outline" className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Ajouter une première salle
                    </Button>
                </div>
            ) : (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Numéro</TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead>Secteur</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {salles.map((salle) => (
                                <TableRow key={salle.id}>
                                    <TableCell className="font-medium">{salle.number}</TableCell>
                                    <TableCell>{salle.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: getSecteurCouleur(salle.operatingSectorId) }}
                                            />
                                            {getSecteurNom(salle.operatingSectorId)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={salle.isActive ? "default" : "secondary"}>
                                            {salle.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                className="h-10 w-10 p-0"
                                                onClick={() => handleEditSalle(salle)}
                                                title="Modifier la salle"
                                            >
                                                <Edit className="h-5 w-5" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:border-red-300"
                                                onClick={() => handleDeleteClick(salle)}
                                                title="Supprimer la salle"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Dialog de création/édition */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {form.getValues().id ? 'Modifier la salle' : 'Ajouter une salle'}
                        </DialogTitle>
                        <DialogDescription>
                            Remplissez le formulaire ci-dessous pour {form.getValues().id ? 'modifier' : 'ajouter'} une salle d'opération
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Numéro de salle</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: 101" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Le numéro unique qui identifie cette salle
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom de la salle</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Salle d'orthopédie" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Un nom descriptif pour cette salle
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="operatingSectorId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Secteur</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(parseInt(value))}
                                            defaultValue={field.value?.toString()}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionnez un secteur" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {secteurs.map(secteur => (
                                                    <SelectItem key={secteur.id} value={secteur.id.toString()}>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="w-3 h-3 rounded-full"
                                                                style={{ backgroundColor: secteur.colorCode }}
                                                            />
                                                            {secteur.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Le secteur auquel cette salle est rattachée
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Salle active</FormLabel>
                                            <FormDescription>
                                                Désactivez pour masquer temporairement cette salle du planning
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                    disabled={isLoading}
                                >
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Dialog de confirmation de suppression */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirmer la suppression</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer cette salle ? Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>

                    {salleToDelete && (
                        <div className="py-4">
                            <p><strong>Numéro :</strong> {salleToDelete.number}</p>
                            <p><strong>Nom :</strong> {salleToDelete.name}</p>
                            <p><strong>Secteur :</strong> {getSecteurNom(salleToDelete.operatingSectorId)}</p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isLoading}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Suppression...' : 'Supprimer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}