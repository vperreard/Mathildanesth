'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  DragOverEvent,
  rectIntersection,
  pointerWithin,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { logger } from '../../../../lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PlusCircle,
  GripVertical,
  Building2,
  MapPin,
  Edit,
  Trash2,
  Move3D,
  Lock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Site {
  id: string;
  name: string;
  colorCode?: string;
  displayOrder?: number;
}

interface Secteur {
  id: number;
  name: string;
  description?: string;
  displayOrder?: number;
  siteId?: string;
  colorCode?: string;
  isActive?: boolean;
  site?: Site;
}

interface Salle {
  id: number;
  number: string;
  name: string;
  operatingSectorId: number;
  siteId?: string;
  isActive: boolean;
  displayOrder?: number;
  colorCode?: string;
}

interface ExtendedSecteur extends Secteur {
  salles: Salle[];
}

// Composant sortable pour les secteurs
function SortableSecteur({
  secteur,
  children,
  disabled = false,
}: {
  secteur: ExtendedSecteur;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `secteur-${secteur.id}`,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {React.cloneElement(children as React.ReactElement, {
        ...attributes,
        ...listeners,
        isDragging,
      })}
    </div>
  );
}

// Composant sortable pour les salles
function SortableSalle({
  salle,
  children,
  disabled = false,
}: {
  salle: Salle;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `salle-${salle.id}`,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {React.cloneElement(children as React.ReactElement, {
        isDragging,
      })}
    </div>
  );
}

// Composant droppable pour les secteurs vides
function DroppableEmptyArea({
  secteurId,
  children,
}: {
  secteurId: number;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `secteur-${secteurId}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-colors ${
        isOver ? 'border-blue-500 bg-blue-50 border-solid' : 'border-gray-200 border-dashed'
      }`}
    >
      {children}
    </div>
  );
}

const SecteursAdminWithDndKit: React.FC = () => {
  const [secteurs, setSecteurs] = useState<ExtendedSecteur[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour les dialogues
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [secteurToEdit, setSecteurToEdit] = useState<ExtendedSecteur | null>(null);
  const [secteurToDelete, setSecteurToDelete] = useState<ExtendedSecteur | null>(null);

  // Mode réorganisation
  const [isReorderMode, setIsReorderMode] = useState(false);

  // État pour le drag
  const [draggedItem, setDraggedItem] = useState<{
    type: 'secteur' | 'salle';
    item: ExtendedSecteur | Salle;
  } | null>(null);

  // États pour le formulaire d'édition
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    siteId: '',
    colorCode: '',
    isActive: true,
  });

  // Configuration des sensors pour @dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Charger secteurs, salles et sites en parallèle
      const [secteursResponse, sallesResponse, sitesResponse] = await Promise.all([
        fetch('/api/operating-sectors', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch('/api/operating-rooms', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch('/api/sites', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }),
      ]);

      if (!secteursResponse.ok || !sallesResponse.ok || !sitesResponse.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const secteursData = await secteursResponse.json();
      const sallesData = await sallesResponse.json();
      const sitesData = await sitesResponse.json();

      // Enrichir les secteurs avec leurs salles
      const enrichedSecteurs = secteursData.map((secteur: Secteur) => ({
        ...secteur,
        salles: sallesData
          .filter((salle: Salle) => salle.operatingSectorId === secteur.id)
          .sort((a: Salle, b: Salle) => (a.displayOrder || 0) - (b.displayOrder || 0)),
      }));

      // Trier les secteurs par ordre d'affichage
      enrichedSecteurs.sort(
        (a: ExtendedSecteur, b: ExtendedSecteur) => (a.displayOrder || 0) - (b.displayOrder || 0)
      );

      setSecteurs(enrichedSecteurs);
      setSites(sitesData);
      setError(null);
    } catch (error) {
      logger.error('Erreur lors du chargement des données:', error);
      setError('Impossible de charger les données');
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;

    if (activeId.startsWith('secteur-')) {
      const secteurId = parseInt(activeId.replace('secteur-', ''));
      const secteur = secteurs.find(s => s.id === secteurId);
      if (secteur) {
        setDraggedItem({ type: 'secteur', item: secteur });
      }
    } else if (activeId.startsWith('salle-')) {
      const salleId = parseInt(activeId.replace('salle-', ''));
      const salle = secteurs.flatMap(s => s.salles).find(s => s.id === salleId);
      if (salle) {
        setDraggedItem({ type: 'salle', item: salle });
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedItem(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    try {
      if (activeId.startsWith('secteur-') && overId.startsWith('secteur-')) {
        // Réorganisation des secteurs
        const oldIndex = secteurs.findIndex(s => `secteur-${s.id}` === activeId);
        const newIndex = secteurs.findIndex(s => `secteur-${s.id}` === overId);

        if (oldIndex !== newIndex) {
          const newSecteurs = arrayMove(secteurs, oldIndex, newIndex);

          // Mettre à jour l'ordre d'affichage
          const updatedSecteurs = newSecteurs.map((secteur, index) => ({
            ...secteur,
            displayOrder: index,
          }));

          setSecteurs(updatedSecteurs);

          // Sauvegarder l'ordre des secteurs
          await fetch('/api/operating-sectors/reorder', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sectorOrders: updatedSecteurs.map((secteur, index) => ({
                id: secteur.id,
                displayOrder: index,
              })),
            }),
          });

          toast.success('Ordre des secteurs mis à jour');
        }
      } else if (activeId.startsWith('salle-')) {
        // Réorganisation des salles
        const salleId = parseInt(activeId.replace('salle-', ''));
        const salle = secteurs.flatMap(s => s.salles).find(s => s.id === salleId);

        if (!salle) return;

        // Déterminer le secteur de destination
        let targetSectorId: number;
        let targetPosition: number = 0;

        if (overId.startsWith('secteur-')) {
          // Déposé sur un secteur
          targetSectorId = parseInt(overId.replace('secteur-', ''));
        } else if (overId.startsWith('salle-')) {
          // Déposé sur une autre salle
          const targetSalleId = parseInt(overId.replace('salle-', ''));
          const targetSalle = secteurs.flatMap(s => s.salles).find(s => s.id === targetSalleId);
          if (!targetSalle) return;

          targetSectorId = targetSalle.operatingSectorId;
          const targetSector = secteurs.find(s => s.id === targetSectorId);
          if (targetSector) {
            targetPosition = targetSector.salles.findIndex(s => s.id === targetSalleId);
          }
        } else {
          return;
        }

        // Trouver les secteurs source et destination
        const sourceSector = secteurs.find(s => s.salles.some(salle => salle.id === salleId));
        const targetSector = secteurs.find(s => s.id === targetSectorId);

        if (!sourceSector || !targetSector) return;

        const newSecteurs = [...secteurs];
        const sourceIndex = newSecteurs.findIndex(s => s.id === sourceSector.id);
        const targetIndex = newSecteurs.findIndex(s => s.id === targetSector.id);

        // Retirer la salle du secteur source
        const salleIndex = newSecteurs[sourceIndex].salles.findIndex(s => s.id === salleId);
        const [movedSalle] = newSecteurs[sourceIndex].salles.splice(salleIndex, 1);

        // Mettre à jour le secteur de la salle si nécessaire
        if (sourceSector.id !== targetSector.id) {
          movedSalle.operatingSectorId = targetSector.id;
        }

        // Ajouter la salle au secteur de destination
        newSecteurs[targetIndex].salles.splice(targetPosition, 0, movedSalle);

        // Mettre à jour l'ordre d'affichage des salles dans les secteurs concernés
        newSecteurs[sourceIndex].salles.forEach((salle, index) => {
          salle.displayOrder = index;
        });

        newSecteurs[targetIndex].salles.forEach((salle, index) => {
          salle.displayOrder = index;
        });

        setSecteurs(newSecteurs);

        // Sauvegarder les changements
        if (sourceSector.id !== targetSector.id) {
          // Mettre à jour le secteur de la salle
          await fetch(`/api/operating-rooms/${salleId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...movedSalle,
              operatingSectorId: targetSector.id,
            }),
          });
        }

        // Mettre à jour l'ordre des salles
        const allSalles = [
          ...newSecteurs[sourceIndex].salles.map((salle, index) => ({
            id: salle.id,
            displayOrder: index,
            operatingSectorId: sourceSector.id,
          })),
          ...newSecteurs[targetIndex].salles.map((salle, index) => ({
            id: salle.id,
            displayOrder: index,
            operatingSectorId: targetSector.id,
          })),
        ];

        await fetch('/api/operating-rooms/reorder', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomOrders: allSalles }),
        });

        toast.success(
          sourceSector.id !== targetSector.id
            ? 'Salle déplacée vers un autre secteur'
            : 'Ordre des salles mis à jour'
        );
      }
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
      // Recharger les données en cas d'erreur
      loadData();
    }
  };

  const getSiteInfo = (siteId?: string) => {
    if (!siteId) return null;
    return sites.find(site => site.id === siteId);
  };

  // Grouper les secteurs par site
  const secteursBySite = () => {
    const grouped: { [key: string]: ExtendedSecteur[] } = {};

    secteurs.forEach(secteur => {
      const siteId = secteur.siteId || 'sans-site';
      if (!grouped[siteId]) {
        grouped[siteId] = [];
      }
      grouped[siteId].push(secteur);
    });

    // Trier les secteurs dans chaque site par displayOrder
    Object.keys(grouped).forEach(siteId => {
      grouped[siteId].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    });

    return grouped;
  };

  // Obtenir la couleur de fond transparente pour une salle
  const getRoomBackgroundColor = (salle: Salle) => {
    if (salle.colorCode) {
      // Convertir hex en rgba avec transparence plus visible
      const hex = salle.colorCode.replace('#', '');
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, 0.25)`;
      }
    }
    return 'rgba(200, 200, 200, 0.2)';
  };

  // Obtenir la couleur de bordure pour une salle
  const getRoomBorderColor = (salle: Salle) => {
    if (salle.colorCode) {
      const hex = salle.colorCode.replace('#', '');
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, 0.5)`;
      }
    }
    return '#d1d5db';
  };

  // Fonctions pour gérer l'édition (identiques à l'original)
  const handleEditClick = (secteur: ExtendedSecteur) => {
    setSecteurToEdit(secteur);
    setEditForm({
      name: secteur.name || '',
      description: secteur.description || '',
      siteId: secteur.siteId || '',
      colorCode: secteur.colorCode || '',
      isActive: secteur.isActive !== false,
    });
    setIsEditDialogOpen(true);
  };

  const handleAddClick = () => {
    setSecteurToEdit(null);
    setEditForm({
      name: '',
      description: '',
      siteId: '',
      colorCode: '',
      isActive: true,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveSecteur = async () => {
    try {
      setIsLoading(true);

      const method = secteurToEdit ? 'PUT' : 'POST';
      const url = secteurToEdit
        ? `/api/operating-sectors/${secteurToEdit.id}`
        : '/api/operating-sectors';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      toast.success(secteurToEdit ? 'Secteur mis à jour' : 'Secteur créé');
      setIsEditDialogOpen(false);
      await loadData();
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (secteur: ExtendedSecteur) => {
    setSecteurToDelete(secteur);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!secteurToDelete) return;

    try {
      setIsLoading(true);

      const response = await fetch(`/api/operating-sectors/${secteurToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression');
      }

      toast.success('Secteur supprimé avec succès');
      setIsDeleteDialogOpen(false);
      setSecteurToDelete(null);
      await loadData();
    } catch (error) {
      logger.error('Erreur lors de la suppression:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-center">Chargement des secteurs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <Button onClick={loadData} className="ml-4" size="sm">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion des Secteurs</h1>
        <div className="flex items-center space-x-3">
          <Button
            variant={isReorderMode ? 'default' : 'outline'}
            onClick={() => setIsReorderMode(!isReorderMode)}
            className={isReorderMode ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            {isReorderMode ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Désactiver réorganisation
              </>
            ) : (
              <>
                <Move3D className="h-4 w-4 mr-2" />
                Activer réorganisation
              </>
            )}
          </Button>
          <Button onClick={handleAddClick}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Ajouter un secteur
          </Button>
        </div>
      </div>

      <div
        className={`px-4 py-3 rounded border ${
          isReorderMode
            ? 'bg-blue-100 border-blue-400 text-blue-700'
            : 'bg-gray-100 border-gray-400 text-gray-700'
        }`}
      >
        <p className="font-semibold">
          {isReorderMode ? '🎯 Mode Réorganisation Actif' : '🔒 Mode Consultation'}
        </p>
        <p className="text-sm mt-1">
          {isReorderMode
            ? 'Faites glisser les secteurs pour réorganiser leur ordre.'
            : 'Activez le mode réorganisation pour pouvoir déplacer les secteurs par glisser-déposer.'}
        </p>
      </div>

      {secteurs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Aucun secteur trouvé</p>
          </CardContent>
        </Card>
      ) : isReorderMode ? (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-8">
            {Object.entries(secteursBySite())
              .sort(([siteIdA], [siteIdB]) => {
                if (siteIdA === 'sans-site') return 1;
                if (siteIdB === 'sans-site') return -1;

                const siteA = getSiteInfo(siteIdA);
                const siteB = getSiteInfo(siteIdB);
                const orderA = siteA?.displayOrder || 999;
                const orderB = siteB?.displayOrder || 999;

                return orderA - orderB;
              })
              .map(([siteId, secteursDuSite]) => {
                const siteInfo = siteId === 'sans-site' ? null : getSiteInfo(siteId);

                return (
                  <div key={siteId} className="space-y-4">
                    {/* En-tête du site */}
                    <div className="flex items-center space-x-3 pb-3 border-b-2 border-gray-200">
                      <MapPin className="h-6 w-6 text-blue-600" />
                      <h2 className="text-xl font-semibold text-gray-800">
                        {siteInfo ? siteInfo.name : 'Secteurs sans site assigné'}
                      </h2>
                      <Badge variant="outline" className="text-sm">
                        {secteursDuSite.length} secteur{secteursDuSite.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    {/* Secteurs du site avec DnD */}
                    <SortableContext
                      items={secteursDuSite.map(s => `secteur-${s.id}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4">
                        {secteursDuSite.map(secteur => (
                          <SortableSecteur key={secteur.id} secteur={secteur}>
                            <Card className="transition-all duration-200 shadow-md hover:shadow-lg">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-blue-500">
                                      <GripVertical className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <CardTitle className="text-lg">{secteur.name}</CardTitle>
                                      {secteur.description && (
                                        <p className="text-sm text-gray-600 mt-1">
                                          {secteur.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline">
                                      {secteur.salles.length} salle
                                      {secteur.salles.length !== 1 ? 's' : ''}
                                    </Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditClick(secteur)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteClick(secteur)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>

                              <CardContent className="pt-0">
                                {secteur.salles.length === 0 ? (
                                  <DroppableEmptyArea secteurId={secteur.id}>
                                    <div className="min-h-[80px] p-4 rounded border-2 transition-colors">
                                      <div className="text-center py-4 text-gray-500">
                                        <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Aucune salle dans ce secteur</p>
                                        <p className="text-xs">Glissez une salle ici</p>
                                      </div>
                                    </div>
                                  </DroppableEmptyArea>
                                ) : (
                                  <div className="min-h-[50px] p-2 rounded border-2 border-dashed border-gray-200 transition-colors">
                                    <SortableContext
                                      items={secteur.salles.map(s => `salle-${s.id}`)}
                                      strategy={rectSortingStrategy}
                                    >
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {secteur.salles.map(salle => (
                                          <SortableSalle key={salle.id} salle={salle}>
                                            <div
                                              className="p-3 border rounded shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                                              style={{
                                                backgroundColor: getRoomBackgroundColor(salle),
                                                borderColor: getRoomBorderColor(salle),
                                                borderWidth: '1px',
                                              }}
                                            >
                                              <div className="flex items-center justify-between">
                                                <div>
                                                  <p className="font-medium text-sm">
                                                    {salle.number}
                                                  </p>
                                                  <p className="text-xs text-gray-600 truncate">
                                                    {salle.name}
                                                  </p>
                                                </div>
                                                <Badge
                                                  variant={salle.isActive ? 'default' : 'secondary'}
                                                  className="text-xs"
                                                >
                                                  {salle.isActive ? 'Actif' : 'Inactif'}
                                                </Badge>
                                              </div>
                                            </div>
                                          </SortableSalle>
                                        ))}
                                      </div>
                                    </SortableContext>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </SortableSecteur>
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                );
              })}
          </div>

          {/* Overlay pour le drag */}
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
              <div
                className="p-3 border rounded shadow-2xl ring-4 ring-green-300 ring-opacity-50 bg-green-50 opacity-90 max-w-xs"
                style={{
                  backgroundColor: getRoomBackgroundColor(draggedItem.item as Salle),
                  borderColor: getRoomBorderColor(draggedItem.item as Salle),
                  borderWidth: '2px',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{(draggedItem.item as Salle).number}</p>
                    <p className="text-xs text-gray-600 truncate max-w-[120px]">
                      {(draggedItem.item as Salle).name}
                    </p>
                  </div>
                  <Badge
                    variant={(draggedItem.item as Salle).isActive ? 'default' : 'secondary'}
                    className="text-xs ml-2"
                  >
                    {(draggedItem.item as Salle).isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        // Mode consultation (identique à l'original)
        <div className="space-y-8">
          {Object.entries(secteursBySite())
            .sort(([siteIdA], [siteIdB]) => {
              if (siteIdA === 'sans-site') return 1;
              if (siteIdB === 'sans-site') return -1;

              const siteA = getSiteInfo(siteIdA);
              const siteB = getSiteInfo(siteIdB);
              const orderA = siteA?.displayOrder || 999;
              const orderB = siteB?.displayOrder || 999;

              return orderA - orderB;
            })
            .map(([siteId, secteursDuSite]) => {
              const siteInfo = siteId === 'sans-site' ? null : getSiteInfo(siteId);

              return (
                <div key={siteId} className="space-y-4">
                  <div className="flex items-center space-x-3 pb-3 border-b-2 border-gray-200">
                    <MapPin className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-800">
                      {siteInfo ? siteInfo.name : 'Secteurs sans site assigné'}
                    </h2>
                    <Badge variant="outline" className="text-sm">
                      {secteursDuSite.length} secteur{secteursDuSite.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {secteursDuSite.map(secteur => (
                      <Card key={secteur.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="text-gray-300">
                                <Building2 className="h-5 w-5" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{secteur.name}</CardTitle>
                                {secteur.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {secteur.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">
                                {secteur.salles.length} salle
                                {secteur.salles.length !== 1 ? 's' : ''}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditClick(secteur)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(secteur)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                          <div className="min-h-[50px] p-2 rounded border-2 border-gray-200">
                            {secteur.salles.length === 0 ? (
                              <div className="text-center py-4 text-gray-500">
                                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Aucune salle dans ce secteur</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {secteur.salles.map(salle => (
                                  <div
                                    key={salle.id}
                                    className="p-3 border rounded shadow-sm"
                                    style={{
                                      backgroundColor: getRoomBackgroundColor(salle),
                                      borderColor: getRoomBorderColor(salle),
                                      borderWidth: '1px',
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium text-sm">{salle.number}</p>
                                        <p className="text-xs text-gray-600 truncate">
                                          {salle.name}
                                        </p>
                                      </div>
                                      <Badge
                                        variant={salle.isActive ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {salle.isActive ? 'Actif' : 'Inactif'}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Dialogues (identiques à l'original) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {secteurToEdit ? 'Modifier le secteur' : 'Ajouter un secteur'}
            </DialogTitle>
            <DialogDescription>
              {secteurToEdit
                ? 'Modifiez les informations du secteur ci-dessous.'
                : 'Créez un nouveau secteur opératoire.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du secteur</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Orthopédie"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description optionnelle"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="siteId">Site d'anesthésie</Label>
              <Select
                value={editForm.siteId}
                onValueChange={value => setEditForm(prev => ({ ...prev, siteId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="colorCode">Code couleur (optionnel)</Label>
              <Input
                id="colorCode"
                type="color"
                value={editForm.colorCode}
                onChange={e => setEditForm(prev => ({ ...prev, colorCode: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveSecteur} disabled={!editForm.name.trim()}>
              {secteurToEdit ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Supprimer le secteur</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le secteur "{secteurToDelete?.name}" ?
              {secteurToDelete?.salles.length > 0 && (
                <span className="block mt-2 text-orange-600 font-medium">
                  ⚠️ Ce secteur contient {secteurToDelete.salles.length} salle(s). Elles devront
                  être réassignées à un autre secteur.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecteursAdminWithDndKit;
