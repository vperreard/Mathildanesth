import React from 'react';
import { OperatingRoom, OperatingSector, OperatingRoomStatus } from '../types';
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
import { Edit, Trash2, AlertCircle } from 'lucide-react';

interface SectorRoomsDisplayProps {
    sectors: OperatingSector[];
    rooms: OperatingRoom[];
    onEditRoom: (room: OperatingRoom) => void;
    onDeleteRoom: (room: OperatingRoom) => void;
}

/**
 * Fonction utilitaire pour obtenir la classe CSS de couleur du statut
 */
const getStatusBadgeVariant = (status?: OperatingRoomStatus) => {
    switch (status) {
        case 'DISPONIBLE': return 'default';
        case 'OCCUPE': return 'secondary';
        case 'MAINTENANCE': return 'warning';
        case 'HORS_SERVICE': return 'destructive';
        default: return 'outline';
    }
};

/**
 * Fonction utilitaire pour obtenir le libellé du statut
 */
const getStatusLabel = (status?: OperatingRoomStatus): string => {
    switch (status) {
        case 'DISPONIBLE': return 'Disponible';
        case 'OCCUPE': return 'Occupé';
        case 'MAINTENANCE': return 'En maintenance';
        case 'HORS_SERVICE': return 'Hors service';
        default: return 'Non défini';
    }
};

export function SectorRoomsDisplay({ sectors, rooms, onEditRoom, onDeleteRoom }: SectorRoomsDisplayProps) {
    // Grouper les salles par secteur
    const roomsBySector = React.useMemo(() => {
        const grouped: { [sectorId: string]: OperatingRoom[] } = {};
        const unassignedRooms: OperatingRoom[] = [];

        rooms.forEach((room: OperatingRoom) => {
            if (room.secteurId) {
                const sectorId = room.secteurId.toString();
                if (!grouped[sectorId]) {
                    grouped[sectorId] = [];
                }
                grouped[sectorId].push(room);
            } else {
                unassignedRooms.push(room);
            }
        });

        return { grouped, unassignedRooms };
    }, [rooms]);

    if (rooms.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                Aucune salle d'opération n'a été configurée.
            </div>
        );
    }

    return (
        <div>
            {/* Afficher les salles par secteur */}
            {sectors.map((sector: OperatingSector) => {
                const sectorRooms = roomsBySector.grouped[sector.id] || [];
                if (sectorRooms.length === 0) return null;

                return (
                    <div key={sector.id} className="mb-8">
                        <h3 className="text-lg font-medium mb-2 flex items-center">
                            <span
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: sector.couleur || '#ccc' }}
                            ></span>
                            Secteur: {sector.nom}
                        </h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Numéro</TableHead>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead>État</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sectorRooms.map((room: OperatingRoom) => (
                                    <TableRow key={room.id}>
                                        <TableCell>{room.numero}</TableCell>
                                        <TableCell>{room.nom}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(room.status)}>
                                                {getStatusLabel(room.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={room.estActif ? 'default' : 'destructive'}>
                                                {room.estActif ? 'Actif' : 'Inactif'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    onClick={() => onEditRoom(room)}
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <Edit size={16} />
                                                </Button>
                                                <Button
                                                    onClick={() => onDeleteRoom(room)}
                                                    size="sm"
                                                    variant="destructive"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                );
            })}

            {/* Afficher les salles sans secteur */}
            {roomsBySector.unassignedRooms.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
                        Salles sans secteur assigné
                    </h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Numéro</TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>État</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roomsBySector.unassignedRooms.map((room: OperatingRoom) => (
                                <TableRow key={room.id}>
                                    <TableCell>{room.numero}</TableCell>
                                    <TableCell>{room.nom}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(room.status)}>
                                            {getStatusLabel(room.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={room.estActif ? 'default' : 'destructive'}>
                                            {room.estActif ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                onClick={() => onEditRoom(room)}
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Edit size={16} />
                                            </Button>
                                            <Button
                                                onClick={() => onDeleteRoom(room)}
                                                size="sm"
                                                variant="destructive"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
} 