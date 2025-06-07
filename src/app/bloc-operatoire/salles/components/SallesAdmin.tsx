'use client';

import React, { useState, useEffect } from 'react';
import { logger } from "../../../../lib/logger";
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

interface Site {
    id: string;
    name: string;
    displayOrder?: number;
}

interface ExtendedBlocSector extends BlocSector {
    siteId?: string;
    displayOrder?: number;
}

interface ExtendedOperatingRoom extends OperatingRoom {
    siteId?: string;
    site?: Site;
    operatingSector?: ExtendedBlocSector;
}

// Schéma de validation pour le formulaire de salle
const salleFormSchema = z.object({
    id: z.number().optional(),
    number: z.string().min(1, 'Le numéro de salle est requis'),
    name: z.string().min(1, 'Le nom de la salle est requis'),
    siteId: z.string().min(1, 'Le site est requis'),
    operatingSectorId: z.number().min(1, 'Le secteur est requis'),
    colorCode: z.string().optional(),
    isActive: z.boolean().default(true),
});


export default function SallesAdmin() {
    const [salles, setSalles] = useState<ExtendedOperatingRoom[]>([]);
    const [secteurs, setSecteurs] = useState<ExtendedBlocSector[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [salleToDelete, setSalleToDelete] = useState<ExtendedOperatingRoom | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm({
        resolver: zodResolver(salleFormSchema),
        defaultValues: {
            number: '',
            name: '',
            siteId: '',
            operatingSectorId: 0,
            colorCode: '',
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
            
            // Charger les salles, secteurs et sites en parallèle
            const [sallesResponse, secteursResponse, sitesResponse] = await Promise.all([
                fetch('/api/operating-rooms'),
                fetch('/api/operating-sectors'),
                fetch('/api/sites')
            ]);
            
            if (!sallesResponse.ok || !secteursResponse.ok || !sitesResponse.ok) {
                throw new Error('Erreur lors du chargement des données');
            }
            
            const sallesData = await sallesResponse.json();
            const secteursData = await secteursResponse.json();
            const sitesData = await sitesResponse.json();

            // Enrichir les données des salles avec les infos de secteur et site
            const enrichedSalles = sallesData.map((salle: ExtendedOperatingRoom) => ({
                ...salle,
                operatingSector: secteursData.find((s: ExtendedBlocSector) => s.id === salle.operatingSectorId),
                site: sitesData.find((site: Site) => site.id === salle.siteId)
            }));

            // Trier les salles par site puis par ordre du secteur
            const sortedSalles = enrichedSalles.sort((a: ExtendedOperatingRoom, b: ExtendedOperatingRoom) => {
                // D'abord par ordre d'affichage du site
                const siteOrderA = a.site?.displayOrder || 999;
                const siteOrderB = b.site?.displayOrder || 999;
                if (siteOrderA !== siteOrderB) {
                    return siteOrderA - siteOrderB;
                }
                
                // Ensuite par ordre d'affichage du secteur
                const sectorOrderA = a.operatingSector?.displayOrder || 999;
                const sectorOrderB = b.operatingSector?.displayOrder || 999;
                if (sectorOrderA !== sectorOrderB) {
                    return sectorOrderA - sectorOrderB;
                }
                
                // Enfin par numéro de salle
                return a.number.localeCompare(b.number);
            });

            setSalles(sortedSalles);
            setSecteurs(secteursData);
            setSites(sitesData);
        } catch (error: unknown) {
            logger.error('Erreur lors du chargement des données:', { error: error });
            toast({
                variant: 'destructive',
                title: 'Erreur de chargement',
                description: 'Impossible de charger les données',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditSalle = (salle: ExtendedOperatingRoom) => {
        form.reset({
            id: salle.id,
            number: salle.number || '',
            name: salle.name || '',
            siteId: salle.siteId || '',
            operatingSectorId: salle.operatingSectorId || 0,
            colorCode: salle.colorCode || '',
            isActive: salle.isActive !== undefined ? salle.isActive : true,
        });
        setIsDialogOpen(true);
    };

    const handleAddSalle = () => {
        form.reset({
            number: '',
            name: '',
            siteId: '',
            operatingSectorId: 0,
            colorCode: '',
            isActive: true,
        });
        setIsDialogOpen(true);
    };

    const handleDeleteClick = (salle: ExtendedOperatingRoom) => {
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
        } catch (error: unknown) {
            logger.error('Erreur lors de la suppression:', { error: error });
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

    const onSubmit = async (values: unknown) => {
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
        } catch (error: unknown) {
            logger.error('Erreur lors de l\'enregistrement:', { error: error });
            toast({
                variant: 'destructive',
                title: 'Erreur d\'enregistrement',
                description: error instanceof Error ? error.message : 'Impossible d\'enregistrer la salle',
            });
        } finally {
            setIsLoading(false);
        }
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
                <div className="flex flex-col items-center justify-center p-6 bg-muted/20 rounded-md border border-dashed">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-center mb-3 text-sm">
                        Aucune salle d'opération n'a été configurée
                    </p>
                    <Button onClick={handleAddSalle} variant="outline" className="flex items-center gap-2" size="sm">
                        <Plus className="h-4 w-4" />
                        Ajouter une première salle
                    </Button>
                </div>
            ) : (
                <div className="border rounded-md overflow-x-auto">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="h-10">
                                <TableHead className="w-20 px-2">N°</TableHead>
                                <TableHead className="px-2">Site</TableHead>
                                <TableHead className="px-2">Nom</TableHead>
                                <TableHead className="px-2">Secteur</TableHead>
                                <TableHead className="w-20 px-2">Couleur</TableHead>
                                <TableHead className="w-20 px-2">Statut</TableHead>
                                <TableHead className="w-24 text-right px-2">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {salles.map((salle) => (
                                <TableRow key={salle.id} className="h-10">
                                    <TableCell className="font-medium px-2 py-1">{salle.number}</TableCell>
                                    <TableCell className="px-2 py-1">
                                        <span className="text-sm font-medium">
                                            {salle.site?.name || 'Non défini'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-2 py-1 text-sm">{salle.name}</TableCell>
                                    <TableCell className="px-2 py-1">
                                        <div className="flex items-center gap-1">
                                            <span
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: salle.operatingSector?.colorCode || '#CCCCCC' }}
                                            />
                                            <span className="text-sm truncate">
                                                {salle.operatingSector?.name || 'Non défini'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-2 py-1">
                                        <div className="flex items-center gap-1">
                                            <span
                                                className="w-3 h-3 rounded-full border border-gray-300"
                                                style={{ backgroundColor: salle.colorCode || '#FFFFFF' }}
                                                title={salle.colorCode || 'Aucune couleur'}
                                            />
                                            <span className="text-xs text-gray-500">
                                                {salle.colorCode || 'Non définie'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-2 py-1">
                                        <Badge 
                                            variant={salle.isActive ? "default" : "secondary"} 
                                            className="h-5 text-xs px-2"
                                        >
                                            {salle.isActive ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right px-2 py-1">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="outline"
                                                className="h-7 w-7 p-0"
                                                onClick={() => handleEditSalle(salle)}
                                                title="Modifier la salle"
                                            >
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:border-red-300"
                                                onClick={() => handleDeleteClick(salle)}
                                                title="Supprimer la salle"
                                            >
                                                <Trash2 className="h-3 w-3" />
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
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Numéro</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: 101" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nom</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Orthopédie" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="siteId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Site d'anesthésie</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                // Réinitialiser le secteur quand on change de site
                                                form.setValue('operatingSectorId', 0);
                                            }}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionnez un site" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-60 overflow-y-auto">
                                                {sites.map(site => (
                                                    <SelectItem key={site.id} value={site.id}>
                                                        {site.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Le site auquel cette salle appartient
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="operatingSectorId"
                                render={({ field }) => {
                                    const selectedSiteId = form.watch('siteId');
                                    const filteredSecteurs = secteurs.filter(secteur => 
                                        secteur.siteId === selectedSiteId
                                    );
                                    
                                    return (
                                        <FormItem>
                                            <FormLabel>Secteur</FormLabel>
                                            <Select
                                                onValueChange={(value) => field.onChange(parseInt(value))}
                                                value={field.value?.toString()}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sélectionnez un secteur" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="max-h-60 overflow-y-auto">
                                                    {filteredSecteurs.length > 0 ? (
                                                        filteredSecteurs.map(secteur => (
                                                            <SelectItem key={secteur.id} value={secteur.id.toString()}>
                                                                <div className="flex items-center gap-2">
                                                                    <span
                                                                        className="w-2 h-2 rounded-full"
                                                                        style={{ backgroundColor: secteur.colorCode }}
                                                                    />
                                                                    {secteur.name}
                                                                </div>
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem value="no-sectors" disabled>
                                                            Aucun secteur pour ce site
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                Le secteur de la salle
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />

                            <FormField
                                control={form.control}
                                name="colorCode"
                                render={({ field }) => {
                                    // Couleurs prédéfinies couramment utilisées pour les salles
                                    const commonColors = [
                                        '#3B82F6', // Bleu
                                        '#10B981', // Vert
                                        '#F59E0B', // Orange
                                        '#EF4444', // Rouge
                                        '#8B5CF6', // Violet
                                        '#F97316', // Orange foncé
                                        '#06B6D4', // Cyan
                                        '#84CC16', // Vert lime
                                        '#EC4899', // Rose
                                        '#6B7280', // Gris
                                    ];

                                    // Récupérer les couleurs déjà utilisées par d'autres salles
                                    const existingColors = salles
                                        .filter(s => s.colorCode && s.id !== form.getValues().id)
                                        .map(s => s.colorCode)
                                        .filter((color, index, self) => self.indexOf(color) === index); // Dédoublonner

                                    // Fusionner couleurs courantes et couleurs existantes
                                    const quickColors = [...new Set([...commonColors, ...existingColors])];

                                    return (
                                        <FormItem>
                                            <FormLabel>Couleur de la salle (optionnel)</FormLabel>
                                            <FormControl>
                                                <div className="space-y-3">
                                                    {/* Sélecteur de couleur principal */}
                                                    <div className="flex items-center gap-3">
                                                        <Input
                                                            type="color"
                                                            value={field.value || '#3B82F6'}
                                                            onChange={(e) => field.onChange(e.target.value)}
                                                            className="w-16 h-10 p-1 border rounded cursor-pointer"
                                                            title="Choisir une couleur personnalisée"
                                                        />
                                                        <Input
                                                            type="text"
                                                            placeholder="#3B82F6"
                                                            value={field.value || ''}
                                                            onChange={(e) => field.onChange(e.target.value)}
                                                            className="flex-1"
                                                            pattern="^#[0-9A-Fa-f]{6}$"
                                                        />
                                                        {field.value && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => field.onChange('')}
                                                                title="Supprimer la couleur"
                                                            >
                                                                ✕
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {/* Choix rapide de couleurs */}
                                                    <div className="space-y-2">
                                                        <p className="text-sm text-gray-600">Choix rapide :</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {quickColors.map((color, index) => (
                                                                <button
                                                                    key={color}
                                                                    type="button"
                                                                    onClick={() => field.onChange(color)}
                                                                    className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                                                                        field.value === color 
                                                                            ? 'border-gray-800 ring-2 ring-gray-300' 
                                                                            : 'border-gray-300 hover:border-gray-500'
                                                                    }`}
                                                                    style={{ backgroundColor: color }}
                                                                    title={`${color}${existingColors.includes(color) ? ' (déjà utilisée)' : ''}`}
                                                                >
                                                                    {field.value === color && (
                                                                        <span className="block w-full h-full rounded-full bg-white/20 flex items-center justify-center text-xs">
                                                                            ✓
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                Couleur distinctive pour cette salle dans le planning. 
                                                {existingColors.length > 0 && " Les couleurs avec ⚫ sont déjà utilisées."}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
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
                        <div className="py-4 space-y-1">
                            <p><strong>Numéro :</strong> {salleToDelete.number}</p>
                            <p><strong>Nom :</strong> {salleToDelete.name}</p>
                            <p><strong>Site :</strong> {salleToDelete.site?.name || 'Non défini'}</p>
                            <p><strong>Secteur :</strong> {salleToDelete.operatingSector?.name || 'Non défini'}</p>
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