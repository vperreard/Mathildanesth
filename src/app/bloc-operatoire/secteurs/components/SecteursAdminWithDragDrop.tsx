'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { logger } from '../../../../lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, GripVertical, Building2, MapPin, Edit, Trash2, Move3D, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DragGhostFix } from './DragGhostFix';

interface Site {
  id: string;
  name: string;
  colorCode?: string;
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

const SecteursAdminWithDragDrop: React.FC = () => {
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
  
  // États pour le formulaire d'édition
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    siteId: '',
    colorCode: '',
    isActive: true
  });

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Charger secteurs, salles et sites en parallèle
      const [secteursResponse, sallesResponse, sitesResponse] = await Promise.all([
        fetch('/api/operating-sectors', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch('/api/operating-rooms', {
          method: 'GET', 
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch('/api/sites', {
          method: 'GET',
          credentials: 'include', 
          headers: { 'Content-Type': 'application/json' }
        })
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
        salles: sallesData.filter((salle: Salle) => salle.operatingSectorId === secteur.id)
          .sort((a: Salle, b: Salle) => (a.displayOrder || 0) - (b.displayOrder || 0))
      }));

      // Trier les secteurs par ordre d'affichage
      enrichedSecteurs.sort((a: ExtendedSecteur, b: ExtendedSecteur) => 
        (a.displayOrder || 0) - (b.displayOrder || 0)
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

  const handleDragEnd = async (result: DropResult) => {
    // Remettre tout à la normale
    document.body.style.cursor = '';
    document.body.classList.remove('dragging-active');
    
    // Restore transforms
    const transformedElements = (window as any).__transformedElements;
    if (transformedElements && Array.isArray(transformedElements)) {
      transformedElements.forEach(({ elem, transform }) => {
        elem.style.transform = transform;
      });
      delete (window as any).__transformedElements;
    }
    
    const { destination, source, draggableId, type } = result;

    // Annuler si pas de destination
    if (!destination) return;

    // Annuler si même position
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    try {
      if (type === 'SECTEUR') {
        // Réorganiser les secteurs
        const newSecteurs = Array.from(secteurs);
        const [removed] = newSecteurs.splice(source.index, 1);
        newSecteurs.splice(destination.index, 0, removed);

        // Mettre à jour l'ordre d'affichage
        const updatedSecteurs = newSecteurs.map((secteur, index) => ({
          ...secteur,
          displayOrder: index
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
              displayOrder: index
            }))
          })
        });

        toast.success('Ordre des secteurs mis à jour');
      } else if (type === 'SALLE') {
        // Réorganiser les salles
        const sourceSecteurIndex = secteurs.findIndex(s => s.id.toString() === source.droppableId);
        const destSecteurIndex = secteurs.findIndex(s => s.id.toString() === destination.droppableId);
        
        if (sourceSecteurIndex === -1 || destSecteurIndex === -1) return;

        const newSecteurs = [...secteurs];
        const sourceSecteur = newSecteurs[sourceSecteurIndex];
        const destSecteur = newSecteurs[destSecteurIndex];

        // Obtenir la salle déplacée
        const salleId = parseInt(draggableId.replace('salle-', ''));
        const salleIndex = sourceSecteur.salles.findIndex(s => s.id === salleId);
        const [movedSalle] = sourceSecteur.salles.splice(salleIndex, 1);

        // Mettre à jour le secteur de la salle si nécessaire
        if (sourceSecteurIndex !== destSecteurIndex) {
          movedSalle.operatingSectorId = destSecteur.id;
        }

        // Ajouter la salle au secteur de destination
        destSecteur.salles.splice(destination.index, 0, movedSalle);

        // Mettre à jour l'ordre d'affichage des salles dans les secteurs concernés
        sourceSecteur.salles.forEach((salle, index) => {
          salle.displayOrder = index;
        });
        
        destSecteur.salles.forEach((salle, index) => {
          salle.displayOrder = index;
        });

        setSecteurs(newSecteurs);

        // Sauvegarder les changements
        if (sourceSecteurIndex !== destSecteurIndex) {
          // Mettre à jour le secteur de la salle
          await fetch(`/api/operating-rooms/${salleId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...movedSalle,
              operatingSectorId: destSecteur.id
            })
          });
        }

        // Mettre à jour l'ordre des salles
        const allSalles = [
          ...sourceSecteur.salles.map((salle, index) => ({ id: salle.id, displayOrder: index, operatingSectorId: sourceSecteur.id })),
          ...destSecteur.salles.map((salle, index) => ({ id: salle.id, displayOrder: index, operatingSectorId: destSecteur.id }))
        ];

        await fetch('/api/operating-rooms/reorder', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomOrders: allSalles })
        });

        toast.success(sourceSecteurIndex !== destSecteurIndex 
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
        return `rgba(${r}, ${g}, ${b}, 0.25)`; // Augmenté de 0.1 à 0.25
      }
    }
    return 'rgba(200, 200, 200, 0.2)'; // Fond gris plus visible par défaut
  };

  // Obtenir la couleur de bordure pour une salle
  const getRoomBorderColor = (salle: Salle) => {
    if (salle.colorCode) {
      // Couleur plus opaque pour la bordure
      const hex = salle.colorCode.replace('#', '');
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, 0.5)`; // Augmenté de 0.3 à 0.5
      }
    }
    return '#d1d5db'; // Couleur de bordure plus visible
  };

  // Fonctions pour gérer l'édition
  const handleEditClick = (secteur: ExtendedSecteur) => {
    setSecteurToEdit(secteur);
    setEditForm({
      name: secteur.name || '',
      description: secteur.description || '',
      siteId: secteur.siteId || '',
      colorCode: secteur.colorCode || '',
      isActive: secteur.isActive !== false
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
      isActive: true
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
        body: JSON.stringify(editForm)
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

  // Fonctions pour gérer la suppression
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
        credentials: 'include'
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

  // Track mouse position for ghost positioning fix
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      (window as any).__lastMouseX = e.clientX;
      (window as any).__lastMouseY = e.clientY;
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // Fix drag ghost positioning issues
  useEffect(() => {
    if (!isReorderMode) return;
    
    // Inject comprehensive CSS fixes for drag ghost
    const style = document.createElement('style');
    style.id = 'drag-ghost-fixes';
    style.textContent = `
      /* Remove ALL transforms during drag to fix ghost position */
      .dragging-active body,
      .dragging-active #__next,
      .dragging-active main,
      .dragging-active div {
        transform: none !important;
      }
      
      /* Fix scrollable containers */
      .dragging-active #bloc-operatoire-main,
      .dragging-active .overflow-y-auto,
      .dragging-active .overflow-auto {
        overflow: visible !important;
      }
      
      /* Ensure drag handle has proper cursor */
      [data-rbd-drag-handle-draggable-id] {
        cursor: grab !important;
      }
      
      /* Style for the drag ghost - force it to be visible and on top */
      body > div[data-rbd-draggable-id] {
        position: fixed !important;
        z-index: 999999 !important;
        pointer-events: none !important;
      }
      
      /* Alternative selector for the ghost */
      body > div:last-child[style*="position: fixed"] {
        z-index: 999999 !important;
      }
      
      /* Hide original element while dragging */
      [data-rbd-draggable-id].dragging {
        opacity: 0 !important;
      }
      
      /* Ensure droppables don't have transforms */
      [data-rbd-droppable-id] {
        transform: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      const styleEl = document.getElementById('drag-ghost-fixes');
      if (styleEl) {
        document.head.removeChild(styleEl);
      }
    };
  }, [isReorderMode]);

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
      {/* Composant pour corriger le ghost */}
      {isReorderMode && <DragGhostFix />}
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion des Secteurs</h1>
        <div className="flex items-center space-x-3">
          <Button 
            variant={isReorderMode ? "default" : "outline"}
            onClick={() => setIsReorderMode(!isReorderMode)}
            className={isReorderMode ? "bg-blue-600 hover:bg-blue-700" : ""}
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

      <div className={`px-4 py-3 rounded border ${
        isReorderMode 
          ? 'bg-blue-100 border-blue-400 text-blue-700' 
          : 'bg-gray-100 border-gray-400 text-gray-700'
      }`}>
        <p className="font-semibold">
          {isReorderMode ? '🎯 Mode Réorganisation Actif' : '🔒 Mode Consultation'}
        </p>
        <p className="text-sm mt-1">
          {isReorderMode 
            ? 'Faites glisser les secteurs pour réorganiser leur ordre, ou déplacez les salles entre les secteurs.'
            : 'Activez le mode réorganisation pour pouvoir déplacer les secteurs et salles par glisser-déposer.'
          }
        </p>
      </div>

      {secteurs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Aucun secteur trouvé</p>
          </CardContent>
        </Card>
      ) : isReorderMode ? (
        <DragDropContext 
          onDragEnd={handleDragEnd}
          onDragStart={(start) => {
            document.body.style.cursor = 'grabbing';
            document.body.classList.add('dragging-active');
            
            // Fix positioning by removing transforms from all parent elements
            const removeTransforms = (element: Element | null) => {
              const transformedElements: Array<{elem: HTMLElement, transform: string}> = [];
              let current = element;
              
              while (current && current !== document.body) {
                if (current instanceof HTMLElement) {
                  const transform = window.getComputedStyle(current).transform;
                  if (transform && transform !== 'none') {
                    transformedElements.push({ elem: current, transform: current.style.transform });
                    current.style.transform = 'none';
                  }
                }
                current = current.parentElement;
              }
              
              // Store for restoration
              (window as any).__transformedElements = transformedElements;
            };
            
            // Wait a tick for the drag to initialize, then fix transforms
            setTimeout(() => {
              const draggableElement = document.querySelector(`[data-rbd-draggable-id="${start.draggableId}"]`);
              removeTransforms(draggableElement);
              
              // Also check for the ghost element and ensure it's positioned correctly
              const ghost = Array.from(document.body.children).find(el => 
                el instanceof HTMLElement && 
                el.style.position === 'fixed' &&
                el.getAttribute('data-rbd-draggable-id')
              ) as HTMLElement;
              
              if (ghost) {
                // Force the ghost to use viewport positioning
                ghost.style.position = 'fixed';
                ghost.style.zIndex = '999999';
                
                // If ghost is offset, try to correct it
                const rect = ghost.getBoundingClientRect();
                const mouseY = (window as any).__lastMouseY || 0;
                if (Math.abs(rect.top - mouseY) > 100) {
                  ghost.style.transform = `translateY(${mouseY - rect.top}px)`;
                }
              }
            }, 10);
          }}
        >
            <div className="space-y-8">
            {/* Affichage groupé par site dans l'ordre configuré */}
            {Object.entries(secteursBySite())
              .sort(([siteIdA], [siteIdB]) => {
                // Les secteurs sans site en dernier
                if (siteIdA === 'sans-site') return 1;
                if (siteIdB === 'sans-site') return -1;
                
                // Trier par displayOrder des sites
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

                  {/* Secteurs du site */}
                  <Droppable droppableId={`site-${siteId}`} type="SECTEUR">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-4 transition-all duration-300 p-2 rounded-lg ${
                          snapshot.isDraggingOver 
                            ? 'bg-blue-50 ring-2 ring-blue-200 ring-opacity-70 shadow-inner' 
                            : ''
                        }`}
                      >
                        {secteursDuSite.map((secteur, index) => {
                          // Index global pour le drag & drop
                          const globalIndex = secteurs.findIndex(s => s.id === secteur.id);
                          
                          return (
                            <Draggable
                              key={secteur.id}
                              draggableId={`secteur-${secteur.id}`}
                              index={globalIndex}
                            >
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`transition-all duration-200 ${
                                    snapshot.isDragging 
                                      ? 'shadow-2xl ring-4 ring-blue-300 ring-opacity-50 bg-blue-50' 
                                      : 'shadow-md hover:shadow-lg'
                                  }`}
                                  style={{
                                    ...provided.draggableProps.style
                                  }}
                                >
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div
                                          {...provided.dragHandleProps}
                                          className={`transition-all duration-150 cursor-grab active:cursor-grabbing hover:scale-110 ${
                                            snapshot.isDragging 
                                              ? 'text-blue-600 animate-pulse' 
                                              : 'text-gray-400 hover:text-blue-500'
                                          }`}
                                        >
                                          <GripVertical className="h-5 w-5" />
                                        </div>
                                        <div>
                                          <CardTitle className="text-lg">{secteur.name}</CardTitle>
                                          {secteur.description && (
                                            <p className="text-sm text-gray-600 mt-1">{secteur.description}</p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Badge variant="outline">
                                          {secteur.salles.length} salle{secteur.salles.length !== 1 ? 's' : ''}
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

                                  <CardContent className="pt-0 overflow-visible">
                                    <Droppable droppableId={secteur.id.toString()} type="SALLE">
                                      {(provided, snapshot) => (
                                        <div
                                          {...provided.droppableProps}
                                          ref={provided.innerRef}
                                          className={`min-h-[50px] p-2 rounded border-2 border-dashed transition-all duration-300 overflow-visible ${
                                            snapshot.isDraggingOver 
                                              ? 'border-blue-500 bg-blue-100 shadow-inner scale-[1.02] ring-2 ring-blue-200 ring-opacity-50' 
                                              : 'border-gray-200 hover:border-gray-300'
                                          }`}
                                        >
                                          {secteur.salles.length === 0 ? (
                                            <div className={`text-center py-4 transition-all duration-300 ${
                                              snapshot.isDraggingOver 
                                                ? 'text-blue-600 animate-bounce' 
                                                : 'text-gray-500'
                                            }`}>
                                              <Building2 className={`h-8 w-8 mx-auto mb-2 transition-all duration-300 ${
                                                snapshot.isDraggingOver 
                                                  ? 'opacity-100 scale-125 text-blue-500' 
                                                  : 'opacity-50'
                                              }`} />
                                              <p className="text-sm font-medium">
                                                {snapshot.isDraggingOver ? '✨ Déposez la salle ici !' : 'Aucune salle dans ce secteur'}
                                              </p>
                                              {!snapshot.isDraggingOver && (
                                                <p className="text-xs">Glissez une salle ici</p>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                              {secteur.salles.map((salle, salleIndex) => (
                                                <Draggable
                                                  key={salle.id}
                                                  draggableId={`salle-${salle.id}`}
                                                  index={salleIndex}
                                                >
                                                  {(provided, snapshot) => (
                                                    <div
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                      {...provided.dragHandleProps}
                                                      className={`p-3 border rounded cursor-grab active:cursor-grabbing transition-all duration-200 ${
                                                        snapshot.isDragging 
                                                          ? 'shadow-2xl ring-4 ring-green-300 ring-opacity-60' 
                                                          : 'shadow-sm hover:shadow-lg hover:scale-105'
                                                      }`}
                                                      style={{
                                                        backgroundColor: getRoomBackgroundColor(salle),
                                                        borderColor: getRoomBorderColor(salle),
                                                        borderWidth: '1px',
                                                        ...provided.draggableProps.style
                                                      }}
                                                    >
                                                      <div className="flex items-center justify-between">
                                                        <div>
                                                          <p className="font-medium text-sm">{salle.number}</p>
                                                          <p className="text-xs text-gray-600 truncate">{salle.name}</p>
                                                        </div>
                                                        <Badge 
                                                          variant={salle.isActive ? "default" : "secondary"}
                                                          className="text-xs"
                                                        >
                                                          {salle.isActive ? 'Actif' : 'Inactif'}
                                                        </Badge>
                                                      </div>
                                                    </div>
                                                  )}
                                                </Draggable>
                                              ))}
                                            </div>
                                          )}
                                          {provided.placeholder}
                                        </div>
                                      )}
                                    </Droppable>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
            </div>
          </DragDropContext>
      ) : (
        // Mode consultation (sans drag & drop)
        <div className="space-y-8">
          {Object.entries(secteursBySite())
            .sort(([siteIdA], [siteIdB]) => {
              // Les secteurs sans site en dernier
              if (siteIdA === 'sans-site') return 1;
              if (siteIdB === 'sans-site') return -1;
              
              // Trier par displayOrder des sites
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

                  {/* Secteurs du site (sans drag & drop) */}
                  <div className="space-y-4">
                    {secteursDuSite.map((secteur) => (
                      <Card key={secteur.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {/* Pas de grip handle en mode consultation */}
                              <div className="text-gray-300">
                                <Building2 className="h-5 w-5" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{secteur.name}</CardTitle>
                                {secteur.description && (
                                  <p className="text-sm text-gray-600 mt-1">{secteur.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">
                                {secteur.salles.length} salle{secteur.salles.length !== 1 ? 's' : ''}
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
                                {secteur.salles.map((salle) => (
                                  <div
                                    key={salle.id}
                                    className="p-3 border rounded shadow-sm"
                                    style={{
                                      backgroundColor: getRoomBackgroundColor(salle),
                                      borderColor: getRoomBorderColor(salle),
                                      borderWidth: '1px'
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium text-sm">{salle.number}</p>
                                        <p className="text-xs text-gray-600 truncate">{salle.name}</p>
                                      </div>
                                      <Badge 
                                        variant={salle.isActive ? "default" : "secondary"}
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

      {/* Dialogue d'édition */}
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
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Orthopédie"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description optionnelle"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="siteId">Site d'anesthésie</Label>
              <Select
                value={editForm.siteId}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, siteId: value }))}
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
                onChange={(e) => setEditForm(prev => ({ ...prev, colorCode: e.target.value }))}
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

      {/* Dialogue de suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Supprimer le secteur</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le secteur "{secteurToDelete?.name}" ?
              {secteurToDelete?.salles.length > 0 && (
                <span className="block mt-2 text-orange-600 font-medium">
                  ⚠️ Ce secteur contient {secteurToDelete.salles.length} salle(s). 
                  Elles devront être réassignées à un autre secteur.
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

export default SecteursAdminWithDragDrop;