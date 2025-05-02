import { useState, useEffect } from 'react';
import { Button, Table, Badge, Spinner, Alert } from '@/components/ui';
import { OperatingRoom } from '@/modules/planning/bloc-operatoire/models/BlocModels';
import AddRoomModal from './AddRoomModal';

interface RoomsListProps {
    onSelect?: (room: OperatingRoom) => void;
    selectable?: boolean;
}

export default function RoomsList({ onSelect, selectable = false }: RoomsListProps) {
    const [rooms, setRooms] = useState<OperatingRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        async function fetchRooms() {
            try {
                setIsLoading(true);
                const response = await fetch('/api/operating-rooms');

                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des salles');
                }

                const data = await response.json();
                setRooms(data);
                setError(null);
            } catch (error) {
                console.error('Erreur:', error);
                setError('Impossible de charger les salles d\'opération');
            } finally {
                setIsLoading(false);
            }
        }

        fetchRooms();
    }, []);

    const handleAddRoom = (newRoom: OperatingRoom) => {
        setRooms(prevRooms => [...prevRooms, newRoom]);
        setShowAddModal(false);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="error" className="m-4">
                {error}
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Salles d'opération</h2>
                <Button onClick={() => setShowAddModal(true)}>Ajouter une salle</Button>
            </div>

            {rooms.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                    Aucune salle d'opération disponible
                </div>
            ) : (
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>Numéro</Table.HeaderCell>
                            <Table.HeaderCell>Nom</Table.HeaderCell>
                            <Table.HeaderCell>Secteur</Table.HeaderCell>
                            <Table.HeaderCell>Statut</Table.HeaderCell>
                            {!selectable && <Table.HeaderCell>Actions</Table.HeaderCell>}
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {rooms.map((room) => (
                            <Table.Row
                                key={room.id}
                                className={selectable ? 'cursor-pointer hover:bg-gray-50' : ''}
                                onClick={selectable ? () => onSelect?.(room) : undefined}
                            >
                                <Table.Cell>{room.number}</Table.Cell>
                                <Table.Cell>{room.name}</Table.Cell>
                                <Table.Cell>{room.sector?.name || 'Non défini'}</Table.Cell>
                                <Table.Cell>
                                    <Badge variant={room.isActive ? 'success' : 'error'}>
                                        {room.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </Table.Cell>
                                {!selectable && (
                                    <Table.Cell>
                                        <Button size="sm" variant="outline">Éditer</Button>
                                    </Table.Cell>
                                )}
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            )}

            {showAddModal && (
                <AddRoomModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onAdd={handleAddRoom}
                />
            )}
        </div>
    );
} 