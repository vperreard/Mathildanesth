'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { logger } from '../../../../lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'react-toastify';
import { Edit, Trash2, Plus, GripVertical, Building2 } from 'lucide-react';

// Types optimisés
interface OperatingRoom {
  id: number;
  name: string;
  number?: string;
  isActive: boolean;
  colorCode?: string;
}

interface ExtendedSecteur {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  displayOrder?: number;
  operatingRooms?: OperatingRoom[];
}

interface DraggedItem {
  type: 'secteur' | 'salle';
  item: ExtendedSecteur | OperatingRoom;
}

// Composant salle optimisé avec React.memo
const SortableRoom = React.memo(({ room, sectorId }: { room: OperatingRoom; sectorId: number }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `room-${room.id}`,
    data: { type: 'salle', room, sectorId }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 border rounded-md bg-white shadow-sm hover:shadow-md transition-shadow"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center space-x-3">
        <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
        <Building2 className="h-4 w-4 text-green-600" />
        <div>
          <span className="font-medium text-sm">{room.name}</span>
          {room.number && <span className="text-xs text-gray-500 ml-2">N°{room.number}</span>}
        </div>
      </div>
      <Badge variant={room.isActive ? "default" : "secondary"}>
        {room.isActive ? "Actif" : "Inactif"}
      </Badge>
    </div>
  );
});

SortableRoom.displayName = 'SortableRoom';

// Composant secteur optimisé avec React.memo
const SortableSector = React.memo(({ secteur }: { secteur: ExtendedSecteur }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `sector-${secteur.id}`,
    data: { type: 'secteur', secteur }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const roomIds = useMemo(() => 
    secteur.operatingRooms?.map(room => `room-${room.id}`) || [], 
    [secteur.operatingRooms]
  );

  return (
    <Card ref={setNodeRef} style={style} className="mb-4 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div {...attributes} {...listeners} className="cursor-grab">
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>
            <CardTitle className="text-lg font-semibold">{secteur.name}</CardTitle>
            <Badge variant={secteur.isActive ? "default" : "secondary"}>
              {secteur.isActive ? "Actif" : "Inactif"}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {secteur.description && (
          <p className="text-sm text-gray-600 mt-2">{secteur.description}</p>
        )}
      </CardHeader>

      <CardContent>
        {secteur.operatingRooms && secteur.operatingRooms.length > 0 ? (
          <SortableContext items={roomIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {secteur.operatingRooms.map((room) => (
                <SortableRoom 
                  key={room.id} 
                  room={room} 
                  sectorId={secteur.id} 
                />
              ))}
            </div>
          </SortableContext>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune salle d'opération</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

SortableSector.displayName = 'SortableSector';

// Composant principal optimisé
export default function SecteursAdminOptimized() {
  const [secteurs, setSecteurs] = useState<ExtendedSecteur[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);

  // Sensors optimisés
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch data optimisé avec useCallback
  const fetchSecteurs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/operating-sectors');
      if (!response.ok) throw new Error('Erreur de chargement');
      
      const data = await response.json();
      setSecteurs(data);
    } catch (error) {
      logger.error('Erreur lors du chargement des secteurs:', error);
      toast.error('Erreur lors du chargement des secteurs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecteurs();
  }, [fetchSecteurs]);

  // Handlers optimisés
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;
    
    if (activeData?.type === 'secteur') {
      setDraggedItem({ type: 'secteur', item: activeData.secteur });
    } else if (activeData?.type === 'salle') {
      setDraggedItem({ type: 'salle', item: activeData.room });
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedItem(null);

    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Réorganisation des secteurs
    if (activeData?.type === 'secteur' && overData?.type === 'secteur') {
      const oldIndex = secteurs.findIndex(s => s.id === activeData.secteur.id);
      const newIndex = secteurs.findIndex(s => s.id === overData.secteur.id);
      
      if (oldIndex !== newIndex) {
        const newSecteurs = arrayMove(secteurs, oldIndex, newIndex);
        setSecteurs(newSecteurs);

        // Sauvegarder l'ordre
        try {
          const sectorOrders = newSecteurs.map((secteur, index) => ({
            id: secteur.id,
            displayOrder: index + 1,
          }));

          const response = await fetch('/api/operating-sectors/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sectorOrders }),
          });

          if (!response.ok) throw new Error('Erreur de sauvegarde');
          toast.success('Ordre des secteurs mis à jour');
        } catch (error) {
          logger.error('Erreur lors de la sauvegarde:', error);
          toast.error('Erreur lors de la sauvegarde');
          // Restaurer l'ordre précédent
          fetchSecteurs();
        }
      }
    }
  }, [secteurs, fetchSecteurs]);

  // Memoized sector IDs
  const sectorIds = useMemo(() => 
    secteurs.map(secteur => `sector-${secteur.id}`), 
    [secteurs]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Chargement des secteurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Secteurs opératoires</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau secteur
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sectorIds} strategy={verticalListSortingStrategy}>
          {secteurs.map((secteur) => (
            <SortableSector key={secteur.id} secteur={secteur} />
          ))}
        </SortableContext>

        <DragOverlay>
          {draggedItem && draggedItem.type === 'secteur' ? (
            <Card className="shadow-2xl ring-4 ring-blue-300 ring-opacity-50 bg-blue-50 opacity-90 max-w-sm">
              <CardHeader className="pb-2 px-4 py-3">
                <CardTitle className="text-base font-medium">
                  {(draggedItem.item as ExtendedSecteur).name}
                </CardTitle>
              </CardHeader>
            </Card>
          ) : draggedItem && draggedItem.type === 'salle' ? (
            <div className="p-3 border rounded shadow-2xl ring-4 ring-green-300 ring-opacity-50 bg-green-50 opacity-90 max-w-xs">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">
                  {(draggedItem.item as OperatingRoom).name}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}