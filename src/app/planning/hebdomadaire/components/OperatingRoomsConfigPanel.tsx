import React, { useState, useEffect } from 'react';
import { logger } from "../../../../lib/logger";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';
import { DropResult } from '@hello-pangea/dnd';

interface Room {
    id: string;
    name: string;
    sector: string;
    orderInSector: number;
}

const OperatingRoomsConfigPanel: React.FC = () => {
    const [roomOrder, setRoomOrder] = useState<Room[]>([]);
    const [sectorOrder, setSectorOrder] = useState<string[]>([]);
    const [showRoomOrderPanel, setShowRoomOrderPanel] = useState(false);

    useEffect(() => {
        // Charger l'ordre des salles depuis le localStorage
        const savedRoomOrder = localStorage.getItem('roomOrder');
        if (savedRoomOrder) {
            setRoomOrder(JSON.parse(savedRoomOrder));
        }

        // Charger l'ordre des secteurs depuis le localStorage
        const savedSectorOrder = localStorage.getItem('sectorOrder');
        if (savedSectorOrder) {
            setSectorOrder(JSON.parse(savedSectorOrder));
        }
    }, []);

    const saveRoomOrder = (order: Room[]) => {
        localStorage.setItem('roomOrder', JSON.stringify(order));
    };

    const saveSectorOrder = (order: string[]) => {
        localStorage.setItem('sectorOrder', JSON.stringify(order));
    };

    const handleDragEnd = (result: DropResult) => {
        logger.info("Drag End Result:", result);
        const { destination, source, draggableId, type } = result;

        if (!destination) return;

        // Si on déplace une salle
        if (type === "ROOM") {
            const sourceSector = source.droppableId;
            const destSector = destination.droppableId;
            const roomId = draggableId;

            const newRoomOrder = [...roomOrder];
            const sourceIndex = newRoomOrder.findIndex(room => room.id === roomId);
            const room = newRoomOrder[sourceIndex];

            // Retirer la salle de son secteur d'origine
            newRoomOrder.splice(sourceIndex, 1);

            // Trouver l'index de destination dans le nouveau secteur
            const destIndex = newRoomOrder.findIndex(room => {
                if (room.sector === destSector) {
                    return room.orderInSector >= destination.index;
                }
                return false;
            });

            // Insérer la salle à sa nouvelle position
            if (destIndex === -1) {
                newRoomOrder.push({ ...room, sector: destSector, orderInSector: destination.index });
            } else {
                newRoomOrder.splice(destIndex, 0, { ...room, sector: destSector, orderInSector: destination.index });
            }

            // Mettre à jour l'ordre des salles dans chaque secteur
            const updatedRoomOrder = newRoomOrder.map((room, index) => ({
                ...room,
                orderInSector: newRoomOrder.filter(r => r.sector === room.sector && r.orderInSector <= index).length - 1
            }));

            setRoomOrder(updatedRoomOrder);
            saveRoomOrder(updatedRoomOrder);
        }
        // Si on déplace un secteur
        else if (type === "SECTOR") {
            const newSectorOrder = [...sectorOrder];
            const [removed] = newSectorOrder.splice(source.index, 1);
            newSectorOrder.splice(destination.index, 0, removed);
            setSectorOrder(newSectorOrder);
            saveSectorOrder(newSectorOrder);
        }
    };

    return (
        <div className="space-y-6">
            <Dialog open={showRoomOrderPanel} onOpenChange={setShowRoomOrderPanel}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Organisation des salles</DialogTitle>
                        <DialogDescription>
                            Glissez-déposez les salles pour les réorganiser. Vous pouvez également réorganiser les secteurs.
                        </DialogDescription>
                    </DialogHeader>

                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="all-sectors" type="SECTOR" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-4"
                                >
                                    {sectorOrder.map((sector, index) => (
                                        <Draggable
                                            key={sector}
                                            draggableId={sector}
                                            index={index}
                                        >
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className="border rounded-lg p-4 bg-white"
                                                >
                                                    <div
                                                        {...provided.dragHandleProps}
                                                        className="flex items-center justify-between mb-2"
                                                    >
                                                        <h3 className="text-lg font-semibold">{sector}</h3>
                                                        <GripVertical className="h-5 w-5 text-gray-400" />
                                                    </div>

                                                    <Droppable droppableId={sector} type="ROOM">
                                                        {(provided) => (
                                                            <div
                                                                {...provided.droppableProps}
                                                                ref={provided.innerRef}
                                                                className="space-y-2"
                                                            >
                                                                {roomOrder
                                                                    .filter(room => room.sector === sector)
                                                                    .sort((a, b) => a.orderInSector - b.orderInSector)
                                                                    .map((room, index) => (
                                                                        <Draggable
                                                                            key={room.id}
                                                                            draggableId={room.id}
                                                                            index={index}
                                                                        >
                                                                            {(provided) => (
                                                                                <div
                                                                                    ref={provided.innerRef}
                                                                                    {...provided.draggableProps}
                                                                                    {...provided.dragHandleProps}
                                                                                    className="flex items-center gap-2 p-2 bg-gray-50 rounded border"
                                                                                >
                                                                                    <GripVertical className="h-5 w-5 text-gray-400" />
                                                                                    <span>{room.name}</span>
                                                                                </div>
                                                                            )}
                                                                        </Draggable>
                                                                    ))}
                                                                {provided.placeholder}
                                                            </div>
                                                        )}
                                                    </Droppable>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OperatingRoomsConfigPanel; 