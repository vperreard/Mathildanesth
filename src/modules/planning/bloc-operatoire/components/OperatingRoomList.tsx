import React, { useState, useEffect } from 'react';
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
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { OperatingRoom, OperatingSector } from '../types';
import { OperatingRoomService } from '../services/OperatingRoomService';

interface OperatingRoomListProps {
    onAddRoom: () => void;
    onEditRoom: (room: OperatingRoom) => void;
}

export const OperatingRoomList: React.FC<OperatingRoomListProps> = ({
    onAddRoom,
    onEditRoom
}) => {
    const [rooms, setRooms] = useState<OperatingRoom[]>([]);
    const [sectors, setSectors] = useState<Map<string, OperatingSector>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [roomToDelete, setRoomToDelete] = useState<OperatingRoom | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Service instance
    const roomService = new OperatingRoomService();

    // Charger les données au montage du composant
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);

            // Récupérer toutes les salles
            const allRooms = roomService.getAll();
            setRooms(allRooms);

            // Récupérer tous les secteurs et les stocker dans une Map pour un accès facile
            const allSectors = roomService.getAllSectors();
            const sectorsMap = new Map<string, OperatingSector>();
            allSectors.forEach(sector => {
                sectorsMap.set(sector.id, sector);
            });
            setSectors(sectorsMap);

            setError(null);
        } catch (err) {
            setError("Erreur lors du chargement des salles d'opération");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = (room: OperatingRoom) => {
        setRoomToDelete(room);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!roomToDelete) return;

        try {
            // Vérifier si la salle est utilisée dans des plannings
            if (roomService.isRoomUsedInPlannings(roomToDelete.id)) {
                setError("Cette salle est utilisée dans des plannings existants et ne peut pas être supprimée.");
                return;
            }

            // Supprimer la salle
            const success = roomService.delete(roomToDelete.id);
            if (success) {
                // Recharger les données après suppression
                loadData();
            } else {
                setError("Échec de la suppression de la salle d'opération");
            }
        } catch (err) {
            setError("Erreur lors de la suppression de la salle d'opération");
            console.error(err);
        } finally {
            setDeleteDialogOpen(false);
            setRoomToDelete(null);
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'DISPONIBLE': return 'bg-green-100 text-green-800';
            case 'OCCUPE': return 'bg-red-100 text-red-800';
            case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800';
            case 'HORS_SERVICE': return 'bg-gray-100 text-gray-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Salles d'opération</CardTitle>
                    <CardDescription>Gérez les salles du bloc opératoire</CardDescription>
                </div>
                <Button onClick={onAddRoom}>Ajouter une salle</Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
                    </div>
                ) : error ? (
                    <div className="text-red-500 py-2">{error}</div>
                ) : rooms.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        Aucune salle d'opération n'a été configurée.
                        <div className="mt-2">
                            <Button variant="outline" onClick={onAddRoom}>
                                Ajouter votre première salle
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Numéro</TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead>Secteur</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Équipements</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rooms.map((room) => (
                                <TableRow key={room.id}>
                                    <TableCell className="font-medium">{room.numero}</TableCell>
                                    <TableCell>{room.nom}</TableCell>
                                    <TableCell>
                                        {sectors.get(room.secteurId)?.nom || "Secteur inconnu"}
                                        {sectors.get(room.secteurId) && (
                                            <span
                                                className="ml-2 inline-block w-3 h-3 rounded-full"
                                                style={{ backgroundColor: sectors.get(room.secteurId)?.couleur }}
                                            ></span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(room.status)}>
                                            {room.status || 'Non défini'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {room.equipements?.join(', ') || "Aucun"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onEditRoom(room)}
                                            >
                                                Modifier
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDeleteClick(room)}
                                            >
                                                Supprimer
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmation de suppression</AlertDialogTitle>
                            <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer la salle {roomToDelete?.nom} ({roomToDelete?.numero}) ?
                                Cette action est irréversible.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
};

export default OperatingRoomList; 