'use client';

import { useState, useEffect } from 'react';
import { BlocPeriod, BlocRoomAssignment, BlocSupervisor } from '@/modules/planning/bloc-operatoire/models/BlocModels';
import { Card, Button } from '@/components/ui';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface BlocPlanningCalendarProps {
    date: Date;
    period: BlocPeriod;
    onAssignmentChange?: (assignments: BlocRoomAssignment[]) => void;
}

export default function BlocPlanningCalendar({ date, period, onAssignmentChange }: BlocPlanningCalendarProps) {
    const [rooms, setRooms] = useState<any[]>([]);
    const [surgeons, setSurgeons] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<BlocRoomAssignment[]>([]);
    const [supervisors, setSupervisors] = useState<BlocSupervisor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                // Fetch rooms
                const roomsResponse = await fetch('/api/operating-rooms');
                if (!roomsResponse.ok) throw new Error('Erreur lors de la récupération des salles');
                const roomsData = await roomsResponse.json();
                setRooms(roomsData);

                // Fetch surgeons (à remplacer par la vraie API)
                const surgeonsResponse = await fetch('/api/surgeons');
                if (surgeonsResponse.ok) {
                    const surgeonsData = await surgeonsResponse.json();
                    setSurgeons(surgeonsData);
                }

                // Fetch existing planning
                const dateString = date.toISOString().split('T')[0];
                const planningResponse = await fetch(`/api/planning/bloc?date=${dateString}&period=${period}`);
                if (planningResponse.ok) {
                    const planningData = await planningResponse.json();
                    if (planningData) {
                        setAssignments(planningData.assignments || []);
                        setSupervisors(planningData.supervisors || []);
                    }
                }

                setError(null);
            } catch (error) {
                console.error('Erreur:', error);
                setError('Erreur lors du chargement des données');
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [date, period]);

    const handleAssignmentChange = (roomId: number, surgeonId: number | null) => {
        const newAssignments = [...assignments];
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

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const { draggableId, destination } = result;
        const roomId = parseInt(destination.droppableId.replace('room-', ''));
        const surgeonId = parseInt(draggableId.replace('surgeon-', ''));

        handleAssignmentChange(roomId, surgeonId);
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
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                {error}
            </div>
        );
    }

    const getSurgeonForRoom = (roomId: number) => {
        const assignment = assignments.find(a => a.roomId === roomId);
        if (!assignment) return null;

        return surgeons.find(s => s.id === assignment.surgeonId) || null;
    };

    const getSupervisorForRoom = (roomId: number) => {
        const room = rooms.find(r => r.id === roomId);
        if (!room) return null;

        const supervisor = supervisors.find(s =>
            s.sectorIds.includes(room.sectorId) || s.roomIds.includes(roomId)
        );

        return supervisor;
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold mb-3">Salles et assignations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rooms.map(room => {
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
                                                <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                                    <p className="font-medium">{surgeon.name}</p>
                                                    <p className="text-sm text-gray-600">{surgeon.specialty || 'Non définie'}</p>
                                                </div>
                                            ) : (
                                                <div className="mt-2 p-2 bg-gray-50 rounded border border-dashed border-gray-300 text-center text-gray-500 text-sm">
                                                    Déposez un chirurgien ici
                                                </div>
                                            )}

                                            {supervisor && (
                                                <div className="mt-2 text-xs bg-purple-50 p-1 rounded text-purple-700">
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
                    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-md">
                        {surgeons.map((surgeon, index) => (
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
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-3">Superviseurs</h3>
                    <div className="space-y-2">
                        {supervisors.map(supervisor => (
                            <Card key={supervisor.id} className="p-3 flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{supervisor.name}</p>
                                    <p className="text-sm text-gray-600">
                                        {supervisor.roomIds.length} salle(s) supervisée(s)
                                    </p>
                                </div>
                                <Button size="sm" variant="outline">Modifier</Button>
                            </Card>
                        ))}
                        <Button>Ajouter un superviseur</Button>
                    </div>
                </div>
            </div>
        </DragDropContext>
    );
} 