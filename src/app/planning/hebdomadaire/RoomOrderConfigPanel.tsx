"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Room, RoomOrderConfig } from "./types";
// TODO: Replace @heroicons with lucide-react
interface RoomOrderConfigPanelProps {
    rooms: Room[];
    onSaveRoomOrder: (orderedRoomIds: (string | number)[]) => void;
    onClose: () => void;
}

/**
 * Composant permettant la réorganisation des salles de bloc opératoire par glisser-déposer
 */
const RoomOrderConfigPanel: React.FC<RoomOrderConfigPanelProps> = ({
    rooms,
    onSaveRoomOrder,
    onClose
}) => {
    // Organiser les salles par secteur
    const [sectorRooms, setSectorRooms] = useState<{ [sector: string]: Room[] }>({});

    useEffect(() => {
        // Trier les salles par secteur et par ordre (si défini)
        const groupedRooms: { [sector: string]: Room[] } = {};

        rooms.forEach(room => {
            if (!groupedRooms[room.sector]) {
                groupedRooms[room.sector] = [];
            }
            groupedRooms[room.sector].push(room);
        });

        // Trier les salles par ordre au sein de chaque secteur
        Object.keys(groupedRooms).forEach(sector => {
            groupedRooms[sector].sort((a, b) => {
                // Si les deux salles ont un ordre, les comparer
                if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order;
                }
                // Si seulement a a un ordre, le placer avant
                if (a.order !== undefined) {
                    return -1;
                }
                // Si seulement b a un ordre, le placer avant
                if (b.order !== undefined) {
                    return 1;
                }
                // Sinon, trier par numéro de salle si disponible, puis par nom
                if (a.number && b.number) {
                    return a.number.localeCompare(b.number);
                }
                return a.name.localeCompare(b.name);
            });
        });

        setSectorRooms(groupedRooms);
    }, [rooms]);

    // Gérer le déplacement d'une salle dans la liste
    const handleDragEnd = (result: unknown) => {
        // Ignorer si le drop n'est pas dans une zone valide
        if (!result.destination) {
            return;
        }

        // Ignorer si la salle est déplacée à la même position
        if (
            result.destination.droppableId === result.source.droppableId &&
            result.destination.index === result.source.index
        ) {
            return;
        }

        // Si on déplace une salle à l'intérieur du même secteur
        if (result.destination.droppableId === result.source.droppableId) {
            const sector = result.source.droppableId;
            const updatedRooms = Array.from(sectorRooms[sector]);
            const [movedRoom] = updatedRooms.splice(result.source.index, 1);
            updatedRooms.splice(result.destination.index, 0, movedRoom);

            // Mettre à jour l'ordre des salles
            const updatedRoomsWithOrder = updatedRooms.map((room, index) => ({
                ...room,
                order: index
            }));

            setSectorRooms({
                ...sectorRooms,
                [sector]: updatedRoomsWithOrder
            });
        }
        // Si on déplace une salle d'un secteur à un autre (ce qui ne devrait pas être possible dans notre UI)
        // Ce cas n'est pas géré car nous voulons maintenir les salles dans leurs secteurs respectifs
    };

    // Sauvegarder l'ordre des salles
    const saveRoomOrder = () => {
        const orderedRoomIds: (string | number)[] = [];

        // Parcourir tous les secteurs dans l'ordre et ajouter chaque salle
        Object.keys(sectorRooms).forEach(sector => {
            sectorRooms[sector].forEach(room => {
                orderedRoomIds.push(room.id);
            });
        });

        onSaveRoomOrder(orderedRoomIds);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-11/12 max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Réorganisation des salles de bloc
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        {/* <<XMarkIcon className="w-6 h-6"  /> */}
                    </button>
                </div>

                <div className="mb-4 flex items-center text-gray-600 dark:text-gray-300">
                    {/* <<ArrowsUpDownIcon className="h-5 w-5 mr-2"  /> */}
                    <span>Faire glisser les salles pour réorganiser leur ordre d'affichage dans le planning</span>
                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                    {Object.keys(sectorRooms).map(sector => (
                        <div key={sector} className="mb-6">
                            <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                {sector}
                            </h3>
                            <Droppable droppableId={sector}>
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="bg-gray-50 dark:bg-gray-800 rounded-md p-2"
                                    >
                                        {sectorRooms[sector].map((room, index) => (
                                            <Draggable
                                                key={String(room.id)}
                                                draggableId={String(room.id)}
                                                index={index}
                                            >
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`p-3 mb-2 rounded-md flex justify-between items-center ${snapshot.isDragging
                                                                ? "bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800"
                                                                : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                                                            }`}
                                                        style={{
                                                            ...provided.draggableProps.style,
                                                            borderLeft: `4px solid ${room.colorCode || '#ccc'}`
                                                        }}
                                                    >
                                                        <span className="font-medium text-gray-800 dark:text-gray-200">
                                                            {room.number ? `Salle ${room.number}` : room.name}
                                                        </span>
                                                        {/* <<ArrowsUpDownIcon className="h-5 w-5 text-gray-400 dark:text-gray-500"  /> */}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </DragDropContext>

                <div className="flex justify-end mt-6 space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={saveRoomOrder}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Enregistrer l'ordre
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoomOrderConfigPanel; 