'use client';

import React, { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { Attribution } from '@/types/attribution';
import { User } from '@/types/user';
import { RulesConfiguration } from '@/types/rules';
import { Violation } from '@/types/validation';

// Lazy load heavy dependencies
const DragDropContext = lazy(() => 
    import('@hello-pangea/dnd').then(mod => ({ default: mod.DragDropContext }))
);
const Droppable = lazy(() => 
    import('@hello-pangea/dnd').then(mod => ({ default: mod.Droppable }))
);
const Draggable = lazy(() => 
    import('@hello-pangea/dnd').then(mod => ({ default: mod.Draggable }))
);

interface OptimizedDraggableCalendarProps {
    initialAssignments: Attribution[];
    users: User[];
    rules: RulesConfiguration;
    onSave: (attributions: Attribution[]) => void;
    onValidationError: (violations: Violation[]) => void;
    onSyncComplete: (success: boolean) => void;
}

const CalendarSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded-lg"></div>
    </div>
);

export default function OptimizedDraggableCalendar({
    initialAssignments,
    users,
    rules,
    onSave,
    onValidationError,
    onSyncComplete
}: OptimizedDraggableCalendarProps) {
    const [attributions, setAssignments] = useState(initialAssignments);
    const [isDragging, setIsDragging] = useState(false);

    // Memoize expensive calculations
    const assignmentsByUser = useMemo(() => {
        const map = new Map<string, Attribution[]>();
        if (attributions) {
            attributions.forEach(attribution => {
                const userId = attribution.userId;
                if (!map.has(userId)) {
                    map.set(userId, []);
                }
                map.get(userId)!.push(attribution);
            });
        }
        return map;
    }, [attributions]);

    const handleDragStart = useCallback(() => {
        setIsDragging(true);
    }, []);

    const handleDragEnd = useCallback((result: any) => {
        setIsDragging(false);
        
        if (!result.destination) return;

        const { source, destination, draggableId } = result;
        
        // Simple implementation - update attribution
        const newAssignments = [...attributions];
        const assignmentIndex = newAssignments.findIndex(a => a.id === draggableId);
        
        if (assignmentIndex !== -1) {
            // Update attribution based on destination
            // This is a simplified version - implement your business logic
            setAssignments(newAssignments);
        }
    }, [attributions]);

    const handleSaveClick = useCallback(() => {
        // Validate before saving
        const violations: Violation[] = [];
        
        // Simple validation example
        if (attributions.length === 0) {
            violations.push({
                type: 'error',
                message: 'Aucune affectation à sauvegarder',
                assignmentIds: []
            });
        }

        if (violations.length > 0) {
            onValidationError(violations);
            return;
        }

        onSave(attributions);
        onSyncComplete(true);
    }, [attributions, onSave, onValidationError, onSyncComplete]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Allocation des Gardes</h2>
                <button
                    onClick={handleSaveClick}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                    Sauvegarder
                </button>
            </div>

            {/* Calendar Grid */}
            <Suspense fallback={<CalendarSkeleton />}>
                <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="grid grid-cols-1 gap-4">
                            {users.map(user => (
                                <Droppable key={user.id} droppableId={user.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`border rounded-lg p-4 transition-colors ${
                                                snapshot.isDraggingOver ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'
                                            }`}
                                        >
                                            <h3 className="font-medium mb-2">
                                                {user.prenom} {user.nom}
                                            </h3>
                                            <div className="space-y-2 min-h-[50px]">
                                                {(assignmentsByUser.get(user.id) || []).map((attribution, index) => (
                                                    <Draggable
                                                        key={attribution.id}
                                                        draggableId={attribution.id}
                                                        index={index}
                                                    >
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`p-2 bg-white border rounded shadow-sm transition-all ${
                                                                    snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                                                }`}
                                                            >
                                                                <div className="text-sm">
                                                                    {attribution.startDate.toLocaleDateString()} - 
                                                                    {attribution.endDate.toLocaleDateString()}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {attribution.type}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        </div>
                                    )}
                                </Droppable>
                            ))}
                        </div>
                    </div>
                </DragDropContext>
            </Suspense>

            {/* Status */}
            {isDragging && (
                <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
                    Déplacement en cours...
                </div>
            )}
        </div>
    );
}