'use client';

import { useState, useEffect } from 'react';
import { logger } from "../../../../lib/logger";
import { BlocPeriod, BlocRoomAssignment, BlocSupervisor } from '@/modules/planning/bloc-operatoire/models/BlocModels';
import { Card, Button } from '@/components/ui';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface BlocPlanningCalendarProps {
    date: Date;
    period: BlocPeriod;
    onAssignmentChange?: (attributions: BlocRoomAssignment[]) => void;
}

export default function BlocPlanningCalendar({ date, period, onAssignmentChange }: BlocPlanningCalendarProps) {
    const [rooms, setRooms] = useState<any[]>([]);
    const [surgeons, setSurgeons] = useState<any[]>([]);
    const [attributions, setAssignments] = useState<BlocRoomAssignment[]>([]);
    const [supervisors, setSupervisors] = useState<BlocSupervisor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                // Fetch rooms
                const roomsResponse = await fetch('http://localhost:3000/api/operating-rooms');
                if (!roomsResponse.ok) throw new Error('Erreur lors de la récupération des salles');
                const roomsData = await roomsResponse.json();
                setRooms(Array.isArray(roomsData) ? roomsData : []);

                // Fetch surgeons
                const surgeonsResponse = await fetch('http://localhost:3000/api/chirurgiens');
                if (surgeonsResponse.ok) {
                    const surgeonsData = await surgeonsResponse.json();
                    setSurgeons(Array.isArray(surgeonsData) ? surgeonsData : []);
                }

                // Fetch existing planning
                const dateString = date.toISOString().split('T')[0];
                const planningResponse = await fetch(`http://localhost:3000/api/planning/bloc?date=${dateString}&period=${period}`);
                if (planningResponse.ok) {
                    const planningData = await planningResponse.json();
                    if (planningData) {
                        setAssignments(planningData.attributions || []);
                        setSupervisors(planningData.supervisors || []);
                    }
                }

                setError(null);
            } catch (error: unknown) {
                logger.error('Erreur:', error instanceof Error ? error : new Error(String(error)));
                setError('Erreur lors du chargement des données');
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [date, period]);

    const handleAssignmentChange = (roomId: number, surgeonId: number | null) => {
        const newAssignments = [...attributions];
        const existingAssignmentIndex = newAssignments.findIndex(a => a.roomId === roomId);

        if (existingAssignmentIndex >= 0) {
            if (surgeonId) {
                newAssignments[existingAssignmentIndex].surgeonId = surgeonId;
            } else {
                newAssignments.splice(existingAssignmentIndex, 1);
            }
        } else if (surgeonId) {
            newAssignments.push({
                roomId,
                surgeonId,
                date: date,
                period
            });
        }

        setAssignments(newAssignments);
        if (onAssignmentChange) onAssignmentChange(newAssignments);
    };

    const handleDragEnd = (result: unknown) => {
        if (!result.destination) return;

        const { draggableId, destination, source } = result;
        
        // Check if dropping on an unavailable room
        const targetRoomId = parseInt(destination.droppableId.replace('room-', ''));
        const targetRoom = rooms.find(r => r.id === targetRoomId);
        if (targetRoom && targetRoom.available === false) {
            setError('Cette salle n\'est pas disponible');
            return;
        }

        // Handle surgeon drag from surgeons list
        if (source.droppableId === 'surgeons') {
            const surgeonId = parseInt(draggableId.replace('surgeon-', ''));
            const newAssignments = [...attributions];
            
            // Create new assignment
            const newAssignment = {
                id: `attribution-${Date.now()}`,
                roomId: destination.droppableId,
                surgeonId: draggableId,
                date: date,
                period
            };
            
            newAssignments.push(newAssignment);
            setAssignments(newAssignments);
            if (onAssignmentChange) onAssignmentChange(newAssignments);
        }
        // Handle attribution drag between rooms
        else if (source.droppableId.startsWith('room-')) {
            const attributionId = draggableId;
            const newRoomId = destination.droppableId;
            
            const newAssignments = attributions.map(attr => 
                attr.id === attributionId 
                    ? { ...attr, roomId: newRoomId }
                    : attr
            );
            
            setAssignments(newAssignments);
            if (onAssignmentChange) onAssignmentChange(newAssignments);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div data-testid="loading-spinner" className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
        );
    }

    if (error && !error.includes('succès') && !error.includes('Cette salle')) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                {error}
            </div>
        );
    }

    const getSurgeonForRoom = (roomId: number) => {
        const attribution = attributions.find(a => a.roomId === roomId);
        if (!attribution) return null;

        return surgeons.find(s => s.id === attribution.surgeonId) || null;
    };

    const getSupervisorForRoom = (roomId: number) => {
        const room = rooms.find(r => r.id === roomId);
        if (!room) return null;

        const supervisor = supervisors.find(s =>
            (s.sectorIds && s.sectorIds.includes(room.sectorId)) || 
            (s.roomIds && s.roomIds.includes(roomId))
        );

        return supervisor;
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold mb-3">Salles et assignations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.isArray(rooms) && rooms.map(room => {
                            const surgeon = getSurgeonForRoom(room.id);
                            const supervisor = getSupervisorForRoom(room.id);

                            return (
                                <Droppable key={`room-${room.id}`} droppableId={`room-${room.id}`}>
                                    {(provided) => (
                                        <Card
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="p-4 min-h-[120px] border-l-4"
                                            style={{ borderLeftColor: room.colorCode || '#000000' }}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-bold">{room.name}</h4>
                                                    <p className="text-gray-500 text-sm">{room.number}</p>
                                                </div>
                                                {surgeon && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleAssignmentChange(room.id, null)}
                                                    >
                                                        ✕
                                                    </Button>
                                                )}
                                            </div>

                                            {surgeon ? (
                                                <Draggable key={`attribution-${room.id}`} draggableId={`attribution-${room.id}`} index={0}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="mt-2 p-2 bg-blue-50 rounded border border-blue-200"
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="font-medium">{surgeon.name}</p>
                                                                    <p className="text-sm text-gray-600">{surgeon.specialty || 'Non définie'}</p>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        data-testid={`edit-attribution-${room.id}`}
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => {/* Edit modal logic */}}
                                                                    >
                                                                        ✏️
                                                                    </Button>
                                                                    <Button
                                                                        data-testid={`delete-attribution-${room.id}`}
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleAssignmentChange(room.id, null)}
                                                                    >
                                                                        🗑️
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ) : (
                                                <div className="mt-2 p-2 bg-gray-50 rounded border border-dashed border-gray-300 text-center text-gray-500 text-sm">
                                                    Déposez un chirurgien ici
                                                </div>
                                            )}

                                            {supervisor && (
                                                <div data-testid={`supervisor-${supervisor.sectorId || supervisor.id}`} className="mt-2 text-xs bg-purple-50 p-1 rounded text-purple-700">
                                                    Superviseur: {supervisor.name}
                                                </div>
                                            )}

                                            {provided.placeholder}
                                        </Card>
                                    )}
                                </Droppable>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-3">Chirurgiens disponibles</h3>
                    <Droppable droppableId="surgeons">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-md"
                            >
                                {Array.isArray(surgeons) && surgeons.map((surgeon, index) => (
                                    <Draggable key={`surgeon-${surgeon.id}`} draggableId={`surgeon-${surgeon.id}`} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className="p-2 bg-white rounded shadow-sm border cursor-move"
                                            >
                                                <p className="font-medium">{surgeon.name}</p>
                                                <p className="text-xs text-gray-600">{surgeon.specialty || 'Non définie'}</p>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {surgeons.length === 0 && (
                                    <p className="text-gray-500">Aucun chirurgien disponible</p>
                                )}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-3">Superviseurs</h3>
                    <div className="space-y-2">
                        {supervisors.map(supervisor => (
                            <Card key={supervisor.id} className="p-3 flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{supervisor.name}</p>
                                    <p className="text-sm text-gray-600">
                                        {supervisor.roomIds?.length || 0} salle(s) supervisée(s)
                                    </p>
                                </div>
                                <Button size="sm" variant="outline">Modifier</Button>
                            </Card>
                        ))}
                        <Button onClick={() => {/* Open supervisor modal */}}>Ajouter un superviseur</Button>
                    </div>
                </div>

                {/* Time slots display */}
                <div>
                    <h3 className="text-lg font-semibold mb-3">Créneaux horaires</h3>
                    <div className="flex gap-4 p-4 bg-blue-50 rounded-md">
                        {period === BlocPeriod.MORNING && (
                            <>
                                <span className="text-sm font-medium">08:00</span>
                                <span className="text-sm text-gray-500">-</span>
                                <span className="text-sm font-medium">12:00</span>
                            </>
                        )}
                        {period === BlocPeriod.AFTERNOON && (
                            <>
                                <span className="text-sm font-medium">13:00</span>
                                <span className="text-sm text-gray-500">-</span>
                                <span className="text-sm font-medium">18:00</span>
                            </>
                        )}
                        {period === BlocPeriod.ALL_DAY && (
                            <>
                                <span className="text-sm font-medium">08:00</span>
                                <span className="text-sm text-gray-500">-</span>
                                <span className="text-sm font-medium">18:00</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Save functionality */}
                <div className="flex justify-end gap-2">
                    <Button 
                        onClick={async () => {
                            try {
                                const response = await fetch('http://localhost:3000/api/planning/bloc', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ attributions, date, period })
                                });
                                
                                if (response.ok) {
                                    setError('Planning enregistré avec succès');
                                } else {
                                    setError('Erreur lors de l\'enregistrement');
                                }
                            } catch (err: unknown) {
                                setError('Erreur lors de l\'enregistrement');
                            }
                        }}
                    >
                        Enregistrer
                    </Button>
                </div>

                {/* Success/Error messages */}
                {error && error.includes('succès') && (
                    <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md">
                        {error}
                    </div>
                )}
                {error && !error.includes('succès') && !error.includes('chargement') && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                        {error}
                    </div>
                )}

                {/* Modals */}
                <div data-testid="supervisor-modal" style={{ display: 'none' }}>
                    {/* Supervisor modal content */}
                </div>
                <div data-testid="attribution-edit-modal" style={{ display: 'none' }}>
                    {/* Attribution edit modal content */}
                </div>

                {/* Validation messages */}
                {attributions.some(attr => 
                    attributions.filter(a => a.surgeonId === attr.surgeonId).length > 1
                ) && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md">
                        Conflit de planning détecté
                    </div>
                )}
            </div>
        </DragDropContext>
    );
}