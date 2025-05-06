'use client';

import React, { useState, useEffect } from 'react';
import { OperatingRoom, OperatingSector } from '@/modules/planning/bloc-operatoire/models/BlocModels';
import { AddRoomModal } from './AddRoomModal';
import Button from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

interface RoomsListProps {
    rooms: OperatingRoom[];
    sectors: OperatingSector[];
    isLoading: boolean;
    error: string | null;
    onEdit: (id: number, data: any) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    onAdd: (data: any) => Promise<void>;
}

export function RoomsList({ rooms, sectors, isLoading, error, onEdit, onDelete, onAdd }: RoomsListProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [roomToEdit, setRoomToEdit] = useState<OperatingRoom | undefined>(undefined);
    const [roomToDelete, setRoomToDelete] = useState<OperatingRoom | undefined>(undefined);
    const { toast } = useToast();

    const handleOpenModal = (room?: OperatingRoom) => {
        setRoomToEdit(room);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setRoomToEdit(undefined);
    };

    const handleSaveRoom = async (data: any) => {
        try {
            if (roomToEdit?.id) {
                await onEdit(roomToEdit.id, data);
                toast({ title: "Salle mise à jour", description: `La salle ${data.name} a été mise à jour.` });
            } else {
                await onAdd(data);
                toast({ title: "Salle ajoutée", description: `La salle ${data.name} a été ajoutée.` });
            }
            handleCloseModal();
        } catch (err) {
            toast({ title: "Erreur", description: "Impossible de sauvegarder la salle.", variant: "destructive" });
            console.error(err);
        }
    };

    const handleDeleteConfirm = async () => {
        if (roomToDelete?.id) {
            try {
                await onDelete(roomToDelete.id);
                toast({ title: "Salle supprimée", description: `La salle ${roomToDelete.name} a été supprimée.` });
                setRoomToDelete(undefined);
            } catch (err) {
                toast({ title: "Erreur", description: "Impossible de supprimer la salle.", variant: "destructive" });
                console.error(err);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
        );
    }

    if (error) {
        return (
            <AlertDialog open={true} onOpenChange={handleCloseModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Erreur</AlertDialogTitle>
                        <AlertDialogDescription>{error}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Fermer</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Salles d'opération</h2>
                <Button onClick={() => handleOpenModal()}>Ajouter une salle</Button>
            </div>

            {rooms.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                    Aucune salle d'opération disponible
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Numéro</TableHead>
                            <TableHead>Nom</TableHead>
                            <TableHead>Secteur</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rooms.map((room) => {
                            const sector = sectors.find(s => s.id === room.sectorId);
                            return (
                                <TableRow
                                    key={room.id}
                                    className="cursor-pointer hover:bg-gray-50"
                                >
                                    <TableCell>{room.number}</TableCell>
                                    <TableCell>{room.name}</TableCell>
                                    <TableCell>{sector?.name || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={room.isActive ? 'success' : 'secondary'}>
                                            {room.isActive ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Ouvrir menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenModal(room)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Éditer
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setRoomToDelete(room)} className="text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            )}

            <AddRoomModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveRoom}
                sectors={sectors}
                initialData={roomToEdit}
            />

            <AlertDialog open={!!roomToDelete} onOpenChange={handleCloseModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer la salle</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer cette salle ?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm}>Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 