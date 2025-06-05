'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { logger } from "../../../../lib/logger";
import { OperatingRoom, OperatingSector } from '@/modules/planning/bloc-operatoire/models/BlocModels';
import { AddRoomModal } from './AddRoomModal';
import Button from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { BlocFilterBar, BlocFilters } from './BlocFilterBar';
import { ROOM_TYPE_LABELS } from '../constants/roomTypes';

interface RoomsListProps {
    rooms: OperatingRoom[];
    sectors: OperatingSector[];
    isLoading: boolean;
    error: string | null;
    onEdit: (id: number, data: unknown) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    onAdd: (data: unknown) => Promise<void>;
}

export function RoomsList({ rooms, sectors, isLoading, error, onEdit, onDelete, onAdd }: RoomsListProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [roomToEdit, setRoomToEdit] = useState<OperatingRoom | undefined>(undefined);
    const [roomToDelete, setRoomToDelete] = useState<OperatingRoom | undefined>(undefined);
    const [filters, setFilters] = useState<BlocFilters>({});
    const { toast } = useToast();

    // Filtrer les salles en fonction des filtres sélectionnés
    const filteredRooms = useMemo(() => {
        return rooms.filter(room => {
            // Filtre par type de salle
            if (filters.roomType && room.type !== filters.roomType) {
                return false;
            }

            // Filtre par catégorie de secteur (en utilisant le secteur associé à la salle)
            if (filters.sectorCategory) {
                const sector = sectors.find(s => s.id === room.sectorId);
                if (!sector || sector.category !== filters.sectorCategory) {
                    return false;
                }
            }

            // Filtre par statut actif/inactif
            if (filters.isActive !== null && filters.isActive !== undefined) {
                return room.isActive === filters.isActive;
            }

            return true;
        });
    }, [rooms, sectors, filters]);

    const handleOpenModal = (room?: OperatingRoom) => {
        setRoomToEdit(room);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setRoomToEdit(undefined);
    };

    const handleSaveRoom = async (data: unknown) => {
        try {
            if (roomToEdit?.id) {
                await onEdit(roomToEdit.id, data);
                toast({ title: "Salle mise à jour", description: `La salle ${data.name} a été mise à jour.` });
            } else {
                await onAdd(data);
                toast({ title: "Salle ajoutée", description: `La salle ${data.name} a été ajoutée.` });
            }
            handleCloseModal();
        } catch (err: unknown) {
            toast({ title: "Erreur", description: "Impossible de sauvegarder la salle.", variant: "destructive" });
            logger.error(err);
        }
    };

    const handleDeleteConfirm = async () => {
        if (roomToDelete?.id) {
            try {
                await onDelete(roomToDelete.id);
                toast({ title: "Salle supprimée", description: `La salle ${roomToDelete.name} a été supprimée.` });
                setRoomToDelete(undefined);
            } catch (err: unknown) {
                toast({ title: "Erreur", description: "Impossible de supprimer la salle.", variant: "destructive" });
                logger.error(err);
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

            {/* Barre de filtres */}
            <BlocFilterBar onFilterChange={setFilters} />

            {filteredRooms.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                    {rooms.length > 0
                        ? "Aucune salle ne correspond aux critères de filtrage."
                        : "Aucune salle d'opération disponible"}
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Numéro</TableHead>
                            <TableHead>Nom</TableHead>
                            <TableHead>Secteur</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRooms.map((room) => {
                            const sector = sectors.find(s => s.id === room.sectorId);
                            // Obtenir le libellé convivial du type de salle
                            const roomTypeLabel = Object.entries(ROOM_TYPE_LABELS).find(
                                ([_, value]) => value === room.type
                            )?.[0] || room.type;

                            return (
                                <TableRow
                                    key={room.id}
                                    className="cursor-pointer hover:bg-gray-50"
                                >
                                    <TableCell>{room.number}</TableCell>
                                    <TableCell>{room.name}</TableCell>
                                    <TableCell>{sector?.name || 'N/A'}</TableCell>
                                    <TableCell>{roomTypeLabel}</TableCell>
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