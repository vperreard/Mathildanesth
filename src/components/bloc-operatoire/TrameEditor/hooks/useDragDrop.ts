import { useCallback, useState } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { DragItem, DropTarget, EditorAffectation, UseDragDropOptions } from '../types';
import { DayOfWeek, Period } from '@prisma/client';

export interface DragDropState {
    isDragging: boolean;
    draggedItem?: DragItem;
    dropTarget?: DropTarget;
    isValidDrop: boolean;
}

export const useDragDrop = (options: UseDragDropOptions = {}) => {
    const {
        onDragStart,
        onDragEnd,
        onDrop,
        canDrop
    } = options;

    const [dragState, setDragState] = useState<DragDropState>({
        isDragging: false,
        isValidDrop: false
    });

    // Gestionnaire de début de drag
    const handleDragStart = useCallback((result: unknown) => {
        const { source, draggableId } = result;

        const dragItem: DragItem = {
            id: draggableId,
            type: 'affectation',
            data: {},
            source: {
                jourSemaine: source.droppableId.split('-')[1] as DayOfWeek,
                periode: source.droppableId.split('-')[2] as Period,
                roomId: source.droppableId.split('-')[3] ? parseInt(source.droppableId.split('-')[3]) : undefined
            }
        };

        setDragState({
            isDragging: true,
            draggedItem: dragItem,
            isValidDrop: false
        });

        onDragStart?.(dragItem);
    }, [onDragStart]);

    // Gestionnaire de mise à jour pendant le drag
    const handleDragUpdate = useCallback((result: unknown) => {
        const { destination } = result;

        if (!destination || !dragState.draggedItem) {
            setDragState(prev => ({ ...prev, isValidDrop: false, dropTarget: undefined }));
            return;
        }

        const dropTarget: DropTarget = {
            jourSemaine: destination.droppableId.split('-')[1] as DayOfWeek,
            periode: destination.droppableId.split('-')[2] as Period,
            roomId: destination.droppableId.split('-')[3] ? parseInt(destination.droppableId.split('-')[3]) : undefined,
            accepts: ['affectation', 'personnel'],
            isValid: true
        };

        const isValid = canDrop ? canDrop(dragState.draggedItem, dropTarget) : true;
        dropTarget.isValid = isValid;

        setDragState(prev => ({
            ...prev,
            dropTarget,
            isValidDrop: isValid
        }));
    }, [dragState.draggedItem, canDrop]);

    // Gestionnaire de fin de drag
    const handleDragEnd = useCallback((result: DropResult) => {
        const { destination, source } = result;

        if (!dragState.draggedItem) return;

        setDragState({
            isDragging: false,
            isValidDrop: false
        });

        if (!destination) {
            onDragEnd?.(dragState.draggedItem);
            return;
        }

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            onDragEnd?.(dragState.draggedItem);
            return;
        }

        const dropTarget: DropTarget = {
            jourSemaine: destination.droppableId.split('-')[1] as DayOfWeek,
            periode: destination.droppableId.split('-')[2] as Period,
            roomId: destination.droppableId.split('-')[3] ? parseInt(destination.droppableId.split('-')[3]) : undefined,
            accepts: ['affectation', 'personnel'],
            isValid: true
        };

        const isValid = canDrop ? canDrop(dragState.draggedItem, dropTarget) : true;

        if (isValid) {
            onDrop?.(dragState.draggedItem, dropTarget);
        }

        onDragEnd?.(dragState.draggedItem, dropTarget);
    }, [dragState.draggedItem, onDragEnd, onDrop, canDrop]);

    // Générer un ID droppable
    const generateDroppableId = useCallback((
        jourSemaine: DayOfWeek,
        periode: Period,
        roomId?: number
    ): string => {
        return `cell-${jourSemaine}-${periode}${roomId ? `-${roomId}` : ''}`;
    }, []);

    // Générer un ID draggable
    const generateDraggableId = useCallback((
        type: 'affectation' | 'personnel',
        id: number | string
    ): string => {
        return `${type}-${id}`;
    }, []);

    // Fonction de validation personnalisée
    const validateDrop = useCallback((
        dragItem: DragItem,
        dropTarget: DropTarget,
        existingAffectations: EditorAffectation[] = []
    ): { isValid: boolean; reason?: string; conflictLevel?: 'warning' | 'error' } => {
        if (
            dragItem.source.jourSemaine === dropTarget.jourSemaine &&
            dragItem.source.periode === dropTarget.periode &&
            dragItem.source.roomId === dropTarget.roomId
        ) {
            return { isValid: false, reason: 'Même position' };
        }

        const existingInSlot = existingAffectations.filter(aff =>
            aff.jourSemaine === dropTarget.jourSemaine &&
            aff.periode === dropTarget.periode &&
            aff.operatingRoomId === dropTarget.roomId
        );

        if (existingInSlot.length > 0) {
            return {
                isValid: true,
                reason: 'Conflit potentiel avec affectation existante',
                conflictLevel: 'warning'
            };
        }

        if (!dropTarget.accepts.includes(dragItem.type)) {
            return {
                isValid: false,
                reason: `Type ${dragItem.type} non accepté dans cette zone`
            };
        }

        return { isValid: true };
    }, []);

    // Calculer les styles de drag
    const getDragStyles = useCallback((isDragging: boolean) => ({
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: isDragging ? 'scale(1.05) rotate(2deg)' : 'none',
        opacity: isDragging ? 0.8 : 1,
        boxShadow: isDragging ? '0 8px 25px rgba(0,0,0,0.15)' : 'none',
        zIndex: isDragging ? 1000 : 'auto',
        transition: isDragging ? 'none' : 'all 0.2s ease'
    }), []);

    // Calculer les styles de drop zone
    const getDropZoneStyles = useCallback((
        isDragOver: boolean,
        isValidDrop: boolean = true
    ) => ({
        backgroundColor: isDragOver
            ? isValidDrop
                ? 'rgba(34, 197, 94, 0.1)'
                : 'rgba(239, 68, 68, 0.1)'
            : 'transparent',
        borderColor: isDragOver
            ? isValidDrop
                ? '#22c55e'
                : '#ef4444'
            : 'transparent',
        borderWidth: isDragOver ? '2px' : '1px',
        borderStyle: 'dashed',
        transition: 'all 0.2s ease'
    }), []);

    return {
        dragState,
        generateDroppableId,
        generateDraggableId,
        validateDrop,
        getDragStyles,
        getDropZoneStyles,
        handleDragStart,
        handleDragUpdate,
        handleDragEnd
    };
};

export default useDragDrop; 