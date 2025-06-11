/**
 * Composant de drag & drop avancé pour les trames
 * Permet le déplacement entre salles et jours avec preview en temps réel
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  rectIntersection,
  CollisionDetection,
  pointerWithin,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

interface DragData {
  affectationId: string;
  userId: string;
  userName: string;
  sourceRoomId: string;
  sourceDayOfWeek: number;
  shiftType: string;
  weekType: string;
  multiSelection?: string[]; // IDs des affectations sélectionnées
}

interface DropZone {
  roomId: string;
  dayOfWeek: number;
  shiftType: string;
}

interface AdvancedDragDropProps {
  affectations: any[];
  rooms: any[];
  onMove: (moves: MoveOperation[]) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

export interface MoveOperation {
  affectationId: string;
  targetRoomId: string;
  targetDayOfWeek: number;
  targetShiftType?: string;
}

export function AdvancedDragDrop({
  affectations,
  rooms,
  onMove,
  selectedIds,
  onSelectionChange,
}: AdvancedDragDropProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [dragData, setDragData] = useState<DragData | null>(null);
  const [previewPosition, setPreviewPosition] = useState<DropZone | null>(null);

  // Configuration des capteurs pour un drag fluide
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Commence le drag après 8px de mouvement
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Détection de collision personnalisée pour les zones de drop
  const customCollisionDetection: CollisionDetection = useCallback(
    (args) => {
      // Utilise d'abord pointerWithin pour une détection précise
      const pointerCollisions = pointerWithin(args);
      
      // Si pas de collision avec le pointeur, utilise closestCenter
      if (!pointerCollisions.length) {
        return closestCenter(args);
      }
      
      return pointerCollisions;
    },
    []
  );

  // Gestionnaire de début de drag
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const affectation = affectations.find(a => a.id === active.id);
    
    if (affectation) {
      setActiveId(active.id as string);
      
      // Si l'affectation fait partie d'une sélection multiple
      const isPartOfSelection = selectedIds.has(affectation.id);
      const draggedIds = isPartOfSelection 
        ? Array.from(selectedIds)
        : [affectation.id];
      
      setDragData({
        affectationId: affectation.id,
        userId: affectation.userId,
        userName: affectation.user?.name || 'Utilisateur',
        sourceRoomId: affectation.operatingRoomId,
        sourceDayOfWeek: affectation.dayOfWeek,
        shiftType: affectation.shiftType,
        weekType: affectation.weekType,
        multiSelection: draggedIds.length > 1 ? draggedIds : undefined,
      });
    }
  };

  // Gestionnaire de survol pendant le drag
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id as string | null);
    
    if (over && over.data.current) {
      const dropData = over.data.current as DropZone;
      setPreviewPosition({
        roomId: dropData.roomId,
        dayOfWeek: dropData.dayOfWeek,
        shiftType: dropData.shiftType,
      });
    } else {
      setPreviewPosition(null);
    }
  };

  // Gestionnaire de fin de drag
  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event;
    
    if (over && dragData) {
      const dropData = over.data.current as DropZone;
      
      // Préparer les opérations de déplacement
      const moves: MoveOperation[] = [];
      
      if (dragData.multiSelection) {
        // Déplacer toutes les affectations sélectionnées
        dragData.multiSelection.forEach((affId) => {
          moves.push({
            affectationId: affId,
            targetRoomId: dropData.roomId,
            targetDayOfWeek: dropData.dayOfWeek,
            targetShiftType: dropData.shiftType,
          });
        });
      } else {
        // Déplacer une seule affectation
        moves.push({
          affectationId: dragData.affectationId,
          targetRoomId: dropData.roomId,
          targetDayOfWeek: dropData.dayOfWeek,
          targetShiftType: dropData.shiftType,
        });
      }
      
      // Exécuter les déplacements
      onMove(moves);
      
      // Réinitialiser la sélection après le déplacement
      onSelectionChange(new Set());
    }
    
    // Réinitialiser l'état
    setActiveId(null);
    setOverId(null);
    setDragData(null);
    setPreviewPosition(null);
  };

  // Composant de preview pendant le drag
  const DragPreview = () => {
    if (!dragData) return null;
    
    const count = dragData.multiSelection?.length || 1;
    
    return (
      <div className="pointer-events-none">
        <div className="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-2xl">
          <div className="font-medium">{dragData.userName}</div>
          {count > 1 && (
            <div className="text-xs opacity-90">
              +{count - 1} autre{count > 2 ? 's' : ''}
            </div>
          )}
        </div>
        {previewPosition && (
          <div className="mt-1 text-xs bg-gray-800 text-white px-2 py-1 rounded">
            → {rooms.find(r => r.id === previewPosition.roomId)?.name || 'Salle'}
            {' - '}
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][previewPosition.dayOfWeek]}
          </div>
        )}
      </div>
    );
  };

  // Indicateur visuel de zone de drop valide
  const DropIndicator = ({ isOver }: { isOver: boolean }) => {
    if (!isOver || !dragData) return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        <div className="h-full w-full bg-blue-500 opacity-20 rounded animate-pulse" />
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
          <div className="h-0.5 bg-blue-500 animate-pulse" />
        </div>
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      {/* Contenu principal avec zones draggables et droppables */}
      <div className="relative">
        {/* Le contenu réel sera rendu par le composant parent */}
        {/* Cette div sert de conteneur pour le contexte DnD */}
      </div>

      {/* Overlay de drag avec preview personnalisé */}
      <DragOverlay>
        {activeId ? <DragPreview /> : null}
      </DragOverlay>
    </DndContext>
  );
}

// Hook pour créer une zone draggable
export function useDraggableAffectation(affectation: any, isSelected: boolean) {
  const [isDragging, setIsDragging] = useState(false);
  
  const draggableProps = useMemo(() => ({
    'data-draggable-id': affectation.id,
    'data-selected': isSelected,
    className: `
      cursor-move select-none
      ${isDragging ? 'opacity-50' : ''}
      ${isSelected ? 'ring-2 ring-blue-500' : ''}
    `,
    onDragStart: () => setIsDragging(true),
    onDragEnd: () => setIsDragging(false),
  }), [affectation.id, isSelected, isDragging]);
  
  return { draggableProps, isDragging };
}

// Hook pour créer une zone droppable
export function useDroppableZone(roomId: string, dayOfWeek: number, shiftType: string) {
  const [isOver, setIsOver] = useState(false);
  
  const droppableProps = useMemo(() => ({
    'data-droppable-id': `${roomId}-${dayOfWeek}-${shiftType}`,
    'data-room-id': roomId,
    'data-day': dayOfWeek,
    'data-shift': shiftType,
    className: `
      relative transition-colors
      ${isOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
    `,
    onDragEnter: () => setIsOver(true),
    onDragLeave: () => setIsOver(false),
    onDrop: () => setIsOver(false),
  }), [roomId, dayOfWeek, shiftType, isOver]);
  
  return { droppableProps, isOver };
}

// Composant helper pour afficher les guides visuels
export function DragGuides({ show }: { show: boolean }) {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Lignes de guide horizontales */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-blue-500 opacity-30" />
      
      {/* Lignes de guide verticales */}
      <div className="absolute inset-y-0 left-1/2 w-px bg-blue-500 opacity-30" />
      
      {/* Indicateur de distance */}
      <div className="absolute top-4 right-4 bg-black/80 text-white px-2 py-1 rounded text-xs">
        Maintenez Shift pour aligner
      </div>
    </div>
  );
}