import React, { useState } from 'react';
import {
    useOperatingSectorsQuery,
    useDeleteSectorMutation,
    useUpdateSectorMutation,
    useCreateSectorMutation
} from '../hooks/useOperatingResourceQueries';
import { OperatingSector } from '../types';
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
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import Switch from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';

// Schéma de validation Zod pour formulaire secteur
const sectorSchema = z.object({
    id: z.string().optional(),
    nom: z.string().min(1, 'Le nom est obligatoire'),
    description: z.string().optional(),
    couleur: z.string().min(1, 'La couleur est obligatoire'),
    estActif: z.boolean().default(true)
});

type SectorFormValues = z.infer<typeof sectorSchema>;

export function OperatingSectorList() {
    const { data: sectors = [], isLoading, error } = useOperatingSectorsQuery();
    const createSectorMutation = useCreateSectorMutation();
    const updateSectorMutation = useUpdateSectorMutation();
    const deleteSectorMutation = useDeleteSectorMutation();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [sectorToDelete, setSectorToDelete] = useState<OperatingSector | null>(null);
    const { toast } = useToast();

    const form = useForm<SectorFormValues>({
        resolver: zodResolver(sectorSchema),
        defaultValues: {
            nom: '',
            description: '',
            couleur: '#3B82F6',
            estActif: true
        }
    });

    const handleAddSector = () => {
        form.reset({
            nom: '',
            description: '',
            couleur: '#3B82F6',
            estActif: true
        });
        setIsDialogOpen(true);
    };

    const handleEditSector = (sector: OperatingSector) => {
        form.reset({
            id: sector.id,
            nom: sector.nom,
            description: sector.description,
            couleur: sector.couleur,
            estActif: sector.estActif
        });
        setIsDialogOpen(true);
    };

    const handleDeleteSector = (sector: OperatingSector) => {
        setSectorToDelete(sector);
        setIsDeleteDialogOpen(true);
    };

    const confirmDeleteSector = async () => {
        if (!sectorToDelete) return;

        try {
            await deleteSectorMutation.mutateAsync(sectorToDelete.id);
            toast({
                title: 'Secteur supprimé',
                description: `Le secteur ${sectorToDelete.nom} a été supprimé avec succès`
            });
            setIsDeleteDialogOpen(false);
            setSectorToDelete(null);
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            toast({
                variant: 'destructive',
                title: 'Erreur de suppression',
                description: 'Impossible de supprimer le secteur'
            });
        }
    };

    const onSubmit = async (values: SectorFormValues) => {
        try {
            if (values.id) {
                // Mise à jour
                await updateSectorMutation.mutateAsync({
                    id: values.id,
                    data: {
                        nom: values.nom,
                        description: values.description,
                        couleur: values.couleur,
                        estActif: values.estActif
                    }
                });
                toast({
                    title: 'Secteur mis à jour',
                    description: `Le secteur ${values.nom} a été mis à jour avec succès`
                });
            } else {
                // Création
                await createSectorMutation.mutateAsync({
                    nom: values.nom,
                    description: values.description,
                    couleur: values.couleur,
                    estActif: values.estActif
                });
                toast({
                    title: 'Secteur créé',
                    description: `Le secteur ${values.nom} a été créé avec succès`
                });
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement:', error);
            toast({
                variant: 'destructive',
                title: 'Erreur d\'enregistrement',
                description: 'Impossible d\'enregistrer le secteur'
            });
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8">Chargement des secteurs...</div>;
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
                    <CardTitle>Secteurs Opératoires</CardTitle>
                    <CardDescription>Gérez les secteurs du bloc opératoire</CardDescription>
                </div>
                <Button
                    onClick={handleAddSector}
                    size="sm"
                    className="flex items-center gap-1"
                >
                    <Plus size={16} />
                    Ajouter un secteur
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Couleur</TableHead>
                            <TableHead>Nom</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sectors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                    Aucun secteur disponible
                                </TableCell>
                            </TableRow>
                        ) : (
                            sectors.map((sector) => (
                                <TableRow key={sector.id}>
                                    <TableCell>
                                        <div
                                            className="w-6 h-6 rounded-full"
                                            style={{ backgroundColor: sector.couleur }}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{sector.nom}</TableCell>
                                    <TableCell>{sector.description || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={sector.estActif ? "default" : "secondary"}>
                                            {sector.estActif ? "Actif" : "Inactif"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button
                                            onClick={() => handleEditSector(sector)}
                                            variant="outline"
                                            size="sm"
                                            className="px-2"
                                        >
                                            <Pencil size={16} />
                                            <span className="sr-only">Modifier</span>
                                        </Button>
                                        <Button
                                            onClick={() => handleDeleteSector(sector)}
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
            </CardContent>

            {/* Dialogue de création/édition */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {form.getValues('id') ? 'Modifier un secteur' : 'Ajouter un secteur'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="nom" className="text-right">
                                    Nom
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
                                <Label htmlFor="couleur" className="text-right">
                                    Couleur
                                </Label>
                                <div className="col-span-3 flex items-center gap-2">
                                    <Input
                                        id="couleur"
                                        type="color"
                                        {...form.register('couleur')}
                                        className="w-14 h-10 p-1"
                                    />
                                    <Input
                                        {...form.register('couleur')}
                                        className={cn(form.formState.errors.couleur && "border-red-500")}
                                    />
                                </div>
                                {form.formState.errors.couleur && (
                                    <p className="col-span-4 text-sm text-red-500 text-right -mt-3">
                                        {form.formState.errors.couleur.message}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="estActif" className="text-right">
                                    Actif
                                </Label>
                                <div className="flex items-center col-span-3">
                                    <Switch
                                        checked={form.watch('estActif')}
                                        onChange={() => form.setValue('estActif', !form.watch('estActif'))}
                                        ariaLabel="Secteur actif"
                                    />
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
                                isLoading={createSectorMutation.isPending || updateSectorMutation.isPending}
                            >
                                {form.getValues('id') ? 'Mettre à jour' : 'Créer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialogue de confirmation de suppression */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmer la suppression</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        Êtes-vous sûr de vouloir supprimer le secteur <strong>{sectorToDelete?.nom}</strong> ?
                        {sectorToDelete?.salles && sectorToDelete.salles.length > 0 && (
                            <div className="mt-2 text-amber-600 bg-amber-50 p-3 rounded-md flex items-center gap-2">
                                <Layers size={16} />
                                <span>
                                    Ce secteur contient {sectorToDelete.salles.length} salle(s).
                                    La suppression affectera également ces salles.
                                </span>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDeleteSector}
                            isLoading={deleteSectorMutation.isPending}
                        >
                            Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

export default OperatingSectorList; 