import React, { useState } from 'react';
import { logger } from "../../../../lib/logger";
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Edit, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { SectorRoomsDisplay } from './SectorRoomsDisplay';

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
    sectors.forEach((sector: OperatingSector) => {
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
        } catch (error: unknown) {
            logger.error('Erreur lors de la suppression:', { error: error });
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
        } catch (error: unknown) {
            logger.error('Erreur lors de l\'enregistrement:', { error: error });
            toast({
                variant: 'destructive',
                title: 'Erreur d\'enregistrement',
                description: 'Impossible d\'enregistrer la salle'
            });
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
        <>
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
                    <SectorRoomsDisplay
                        sectors={sectors}
                        rooms={rooms}
                        onEditRoom={handleEditRoom}
                        onDeleteRoom={handleDeleteRoom}
                    />
                </CardContent>
            </Card>

            {/* Dialog pour ajouter/modifier une salle */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {form.getValues('id') ? 'Modifier une salle' : 'Ajouter une salle'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="numero">Numéro</Label>
                                <Input
                                    id="numero"
                                    {...form.register('numero')}
                                    placeholder="Ex: 1, A, 2B..."
                                />
                                {form.formState.errors.numero && (
                                    <p className="text-sm text-red-500">{form.formState.errors.numero.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nom">Nom</Label>
                                <Input
                                    id="nom"
                                    {...form.register('nom')}
                                    placeholder="Nom de la salle"
                                />
                                {form.formState.errors.nom && (
                                    <p className="text-sm text-red-500">{form.formState.errors.nom.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="secteur">Secteur</Label>
                            <Select
                                value={form.getValues('secteurId')}
                                onValueChange={(value) => form.setValue('secteurId', value)}
                            >
                                <SelectTrigger id="secteur">
                                    <SelectValue placeholder="Sélectionner un secteur" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sectors.map((sector: OperatingSector) => (
                                        <SelectItem key={sector.id} value={sector.id}>
                                            {sector.nom}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.formState.errors.secteurId && (
                                <p className="text-sm text-red-500">{form.formState.errors.secteurId.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Statut</Label>
                            <Select
                                value={form.getValues('status')}
                                onValueChange={(value) => form.setValue('status', value as OperatingRoomStatus)}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Sélectionner un statut" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                                    <SelectItem value="OCCUPE">Occupé</SelectItem>
                                    <SelectItem value="MAINTENANCE">En maintenance</SelectItem>
                                    <SelectItem value="HORS_SERVICE">Hors service</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                {...form.register('description')}
                                placeholder="Description optionnelle"
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="estActif"
                                checked={form.getValues('estActif')}
                                onCheckedChange={(checked) => form.setValue('estActif', checked)}
                            />
                            <Label htmlFor="estActif">Salle active</Label>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Annuler
                            </Button>
                            <Button type="submit">Enregistrer</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog de confirmation de suppression */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirmer la suppression</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        Êtes-vous sûr de vouloir supprimer la salle {roomToDelete?.nom} ?
                        Cette action est irréversible.
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDeleteRoom}
                        >
                            Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default OperatingRoomList; 