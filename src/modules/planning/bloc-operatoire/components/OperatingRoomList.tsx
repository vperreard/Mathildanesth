import React, { useState } from 'react';
import {
    useOperatingRoomsQuery,
    useOperatingSectorsQuery,
    useDeleteRoomMutation,
    useUpdateRoomMutation,
    useCreateRoomMutation
} from '../hooks/useOperatingResourceQueries';
import { OperatingRoom, OperatingSector, OperatingRoomStatus } from '../types';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import Switch from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';

// Schéma de validation Zod pour formulaire salle
const roomSchema = z.object({
    id: z.string().optional(),
    numero: z.string().min(1, 'Le numéro est obligatoire'),
    nom: z.string().min(1, 'Le nom est obligatoire'),
    secteurId: z.string().min(1, 'Le secteur est obligatoire'),
    description: z.string().optional(),
    status: z.enum(['DISPONIBLE', 'OCCUPE', 'MAINTENANCE', 'HORS_SERVICE']).optional(),
    estActif: z.boolean().default(true)
});

type RoomFormValues = z.infer<typeof roomSchema>;

export function OperatingRoomList() {
    const { data: rooms = [], isLoading, error } = useOperatingRoomsQuery();
    const { data: sectors = [] } = useOperatingSectorsQuery();
    const createRoomMutation = useCreateRoomMutation();
    const updateRoomMutation = useUpdateRoomMutation();
    const deleteRoomMutation = useDeleteRoomMutation();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState<OperatingRoom | null>(null);
    const { toast } = useToast();

    const form = useForm<RoomFormValues>({
        resolver: zodResolver(roomSchema),
        defaultValues: {
            numero: '',
            nom: '',
            secteurId: '',
            description: '',
            status: 'DISPONIBLE',
            estActif: true
        }
    });

    // Créer un Map pour un accès rapide aux secteurs par ID
    const sectorsMap = new Map<string, OperatingSector>();
    sectors.forEach(sector => {
        sectorsMap.set(sector.id, sector);
    });

    const handleAddRoom = () => {
        form.reset({
            numero: '',
            nom: '',
            secteurId: '',
            description: '',
            status: 'DISPONIBLE',
            estActif: true
        });
        setIsDialogOpen(true);
    };

    const handleEditRoom = (room: OperatingRoom) => {
        form.reset({
            id: room.id,
            numero: room.numero,
            nom: room.nom,
            secteurId: room.secteurId,
            description: room.description,
            status: room.status || 'DISPONIBLE',
            estActif: room.estActif
        });
        setIsDialogOpen(true);
    };

    const handleDeleteRoom = (room: OperatingRoom) => {
        setRoomToDelete(room);
        setIsDeleteDialogOpen(true);
    };

    const confirmDeleteRoom = async () => {
        if (!roomToDelete) return;

        try {
            await deleteRoomMutation.mutateAsync(roomToDelete.id);
            toast({
                title: 'Salle supprimée',
                description: `La salle ${roomToDelete.nom} a été supprimée avec succès`
            });
            setIsDeleteDialogOpen(false);
            setRoomToDelete(null);
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            toast({
                variant: 'destructive',
                title: 'Erreur de suppression',
                description: 'Impossible de supprimer la salle'
            });
        }
    };

    const onSubmit = async (values: RoomFormValues) => {
        try {
            if (values.id) {
                // Mise à jour
                await updateRoomMutation.mutateAsync({
                    id: values.id,
                    data: {
                        numero: values.numero,
                        nom: values.nom,
                        secteurId: values.secteurId,
                        description: values.description,
                        status: values.status,
                        estActif: values.estActif
                    }
                });
                toast({
                    title: 'Salle mise à jour',
                    description: `La salle ${values.nom} a été mise à jour avec succès`
                });
            } else {
                // Création
                await createRoomMutation.mutateAsync({
                    numero: values.numero,
                    nom: values.nom,
                    secteurId: values.secteurId,
                    description: values.description,
                    status: values.status,
                    estActif: values.estActif
                });
                toast({
                    title: 'Salle créée',
                    description: `La salle ${values.nom} a été créée avec succès`
                });
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement:', error);
            toast({
                variant: 'destructive',
                title: 'Erreur d\'enregistrement',
                description: 'Impossible d\'enregistrer la salle'
            });
        }
    };

    // Obtenir les détails du secteur à partir de l'ID
    const getSectorInfo = (sectorId: string) => {
        return sectorsMap.get(sectorId);
    };

    // Fonction pour obtenir la classe CSS de couleur du statut
    const getStatusBadgeVariant = (status?: OperatingRoomStatus) => {
        switch (status) {
            case 'DISPONIBLE': return 'default';
            case 'OCCUPE': return 'secondary';
            case 'MAINTENANCE': return 'warning';
            case 'HORS_SERVICE': return 'destructive';
            default: return 'outline';
        }
    };

    // Fonction pour obtenir le libellé du statut
    const getStatusLabel = (status?: OperatingRoomStatus): string => {
        switch (status) {
            case 'DISPONIBLE': return 'Disponible';
            case 'OCCUPE': return 'Occupé';
            case 'MAINTENANCE': return 'En maintenance';
            case 'HORS_SERVICE': return 'Hors service';
            default: return 'Non défini';
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8">Chargement des salles...</div>;
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
                    <CardTitle>Salles d'Opération</CardTitle>
                    <CardDescription>Gérez les salles du bloc opératoire</CardDescription>
                </div>
                <Button
                    onClick={handleAddRoom}
                    size="sm"
                    className="flex items-center gap-1"
                >
                    <Plus size={16} />
                    Ajouter une salle
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Numéro</TableHead>
                            <TableHead>Nom</TableHead>
                            <TableHead>Secteur</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>État</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rooms.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                    Aucune salle disponible
                                </TableCell>
                            </TableRow>
                        ) : (
                            rooms.map((room) => {
                                const sectorInfo = getSectorInfo(room.secteurId);
                                return (
                                    <TableRow key={room.id}>
                                        <TableCell className="font-medium">{room.numero}</TableCell>
                                        <TableCell>{room.nom}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: sectorInfo?.couleur || '#CBD5E1' }}
                                                />
                                                <span>{sectorInfo?.nom || 'Secteur inconnu'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(room.status) as any}>
                                                {getStatusLabel(room.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={room.estActif ? "default" : "secondary"}>
                                                {room.estActif ? "Actif" : "Inactif"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button
                                                onClick={() => handleEditRoom(room)}
                                                variant="outline"
                                                size="sm"
                                                className="px-2"
                                            >
                                                <Edit size={16} />
                                                <span className="sr-only">Modifier</span>
                                            </Button>
                                            <Button
                                                onClick={() => handleDeleteRoom(room)}
                                                variant="outline"
                                                size="sm"
                                                className="px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 size={16} />
                                                <span className="sr-only">Supprimer</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            {/* Dialogue de création/édition */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {form.getValues('id') ? 'Modifier une salle' : 'Ajouter une salle'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="numero" className="text-right">
                                    Numéro
                                </Label>
                                <Input
                                    id="numero"
                                    {...form.register('numero')}
                                    className={cn("col-span-3", form.formState.errors.numero && "border-red-500")}
                                />
                                {form.formState.errors.numero && (
                                    <p className="col-span-4 text-sm text-red-500 text-right -mt-3">
                                        {form.formState.errors.numero.message}
                                    </p>
                                )}
                            </div>

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
                                <Label htmlFor="secteurId" className="text-right">
                                    Secteur
                                </Label>
                                <Select
                                    value={form.watch('secteurId')}
                                    onValueChange={(value) => form.setValue('secteurId', value, { shouldValidate: true })}
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
                                {form.formState.errors.secteurId && (
                                    <p className="col-span-4 text-sm text-red-500 text-right -mt-3">
                                        {form.formState.errors.secteurId.message}
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
                                <Label htmlFor="status" className="text-right">
                                    Statut
                                </Label>
                                <Select
                                    value={form.watch('status')}
                                    onValueChange={(value) => form.setValue('status', value as OperatingRoomStatus, { shouldValidate: true })}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Sélectionnez un statut" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                                        <SelectItem value="OCCUPE">Occupé</SelectItem>
                                        <SelectItem value="MAINTENANCE">En maintenance</SelectItem>
                                        <SelectItem value="HORS_SERVICE">Hors service</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="estActif" className="text-right">
                                    Actif
                                </Label>
                                <div className="flex items-center col-span-3">
                                    <Switch
                                        checked={form.watch('estActif')}
                                        onChange={() => form.setValue('estActif', !form.watch('estActif'))}
                                        ariaLabel="Salle active"
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
                                isLoading={createRoomMutation.isPending || updateRoomMutation.isPending}
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
                        Êtes-vous sûr de vouloir supprimer la salle <strong>{roomToDelete?.nom}</strong> ?
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
                            onClick={confirmDeleteRoom}
                            isLoading={deleteRoomMutation.isPending}
                        >
                            Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

export default OperatingRoomList; 