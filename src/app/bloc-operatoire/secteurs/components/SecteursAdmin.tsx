'use client';

import React, { useState, useEffect, memo, useCallback, useRef } from 'react';
import { logger } from "../../../../lib/logger";
import { apiClient } from '@/utils/apiClient';
import { DragDropContext } from '@hello-pangea/dnd';
// TODO: Implement proper drag and drop with @hello-pangea/dnd
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import {
  PlusCircle,
  PencilLine,
  Trash2,
  AlertCircle,
  Palette,
  Layers,
  Move,
  X,
} from 'lucide-react';

import { BlocSector, OperatingRoom } from '@/types/bloc-planning-types';
import { blocPlanningService } from '@/modules/planning/bloc-operatoire/services/blocPlanningService';

// Composant pour une zone de drop de secteur (pour recevoir les salles)
const DroppableSecteurZone = memo(
  ({
    secteurId,
    children,
    isDragMode,
  }: {
    secteurId: string;
    children: React.ReactNode;
    isDragMode: boolean;
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: `secteur-${secteurId}`,
    });

    return (
      <div
        ref={setNodeRef}
        className={`min-h-[40px] p-2 border border-gray-200 rounded transition-all ${
          isDragMode
            ? `bg-yellow-50/50 border-yellow-300 border-dashed ${isOver ? 'bg-yellow-100 border-yellow-400' : ''}`
            : 'bg-white'
        }`}
      >
        {children}
      </div>
    );
  }
);

DroppableSecteurZone.displayName = 'DroppableSecteurZone';

// Composant pour une zone de drop de site (pour recevoir les secteurs)
const DroppableSiteZone = memo(
  ({
    siteId,
    children,
    isDragMode,
  }: {
    siteId: string;
    children: React.ReactNode;
    isDragMode: boolean;
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: `site-${siteId}`,
    });

    // Couleurs différentes pour les secteurs non-assignés vs sites normaux
    const isNonAssigned = siteId === 'null';

    return (
      <div
        ref={setNodeRef}
        className={`min-h-[100px] p-4 border-2 border-dashed rounded-lg transition-all ${
          isDragMode
            ? isNonAssigned
              ? `bg-orange-50/30 border-orange-300 ${isOver ? 'bg-orange-100 border-orange-400' : ''}`
              : `bg-blue-50/30 border-blue-300 ${isOver ? 'bg-blue-100 border-blue-400' : ''}`
            : isNonAssigned
              ? 'border-gray-300 bg-gray-100'
              : 'border-gray-200 bg-gray-50'
        }`}
      >
        {children}
      </div>
    );
  }
);

DroppableSiteZone.displayName = 'DroppableSiteZone';

// Composant pour la zone de drop des salles non-assignées
const DroppableNonAssigneesZone = memo(
  ({ children, isDragMode }: { children: React.ReactNode; isDragMode: boolean }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: 'secteur-null',
    });

    return (
      <div
        ref={setNodeRef}
        className={`min-h-[60px] p-3 border-2 border-dashed rounded transition-all ${
          isDragMode
            ? `bg-gray-50/50 border-gray-400 ${isOver ? 'bg-gray-100 border-gray-500' : ''}`
            : 'border-gray-300 bg-gray-100'
        }`}
      >
        {children}
      </div>
    );
  }
);

DroppableNonAssigneesZone.displayName = 'DroppableNonAssigneesZone';

// Composant pour un secteur draggable (dans la hiérarchie des sites)
const SortableSecteurItem = memo(
  ({ secteur, isDragMode, onEdit, onDelete, countRooms, getSiteName }: unknown) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: `secteur-${secteur.id}`,
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
        {...(isDragMode ? { ...attributes, ...listeners } : {})}
        className={`flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded shadow transition-all ${
          isDragMode ? 'cursor-move hover:shadow-lg' : ''
        } ${isDragging ? 'z-50' : ''}`}
      >
        <div className="flex items-center">
          <div
            className="w-6 h-6 rounded-full mr-3"
            style={{ backgroundColor: secteur.couleur || '#CBD5E1' }}
            title={secteur.couleur}
          />
          <div className="flex flex-col">
            <strong>{secteur.nom}</strong>
            <small className="text-gray-500">{getSiteName((secteur as any).siteId)}</small>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {countRooms(secteur.id)}
          </Badge>
          {secteur.estActif ? (
            <Badge variant="default">Actif</Badge>
          ) : (
            <Badge variant="secondary">Inactif</Badge>
          )}
          {!isDragMode && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => onEdit(secteur)} title="Modifier">
                <PencilLine className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(secteur)}
                title="Supprimer"
                disabled={countRooms(secteur.id) > 0}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

SortableSecteurItem.displayName = 'SortableSecteurItem';

// Composant pour une salle draggable et droppable (pour réorganisation interne)
const DraggableSalleItem = memo(({ salle, isDragMode }: unknown) => {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({ id: `salle-${salle.id}` });

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `salle-${salle.id}` });

  // Combiner les refs
  const setNodeRef = (node: HTMLElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  const style = {
    transform: isDragging
      ? 'none'
      : transform
        ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
        : undefined,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDragMode ? { ...attributes, ...listeners } : {})}
      className={`flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border transition-all ${
        isDragMode ? 'cursor-move hover:shadow-md' : ''
      } ${isOver && isDragMode ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
    >
      <div className="flex items-center">
        <span className="font-medium text-sm">{salle.nom || `Salle ${salle.numero}`}</span>
        <span className="text-xs text-gray-500 ml-2">#{salle.numero}</span>
      </div>
      <div className="flex items-center gap-1">
        {salle.estActif ? (
          <Badge variant="default" className="text-xs">
            Actif
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            Inactif
          </Badge>
        )}
      </div>
    </div>
  );
});

DraggableSalleItem.displayName = 'DraggableSalleItem';

// Interface pour le formulaire de secteur
interface SecteurFormData {
  id?: string;
  nom: string;
  description: string;
  couleur: string;
  specialites: string[];
  estActif: boolean;
  requiresSpecificSkills: boolean;
  supervisionSpeciale: boolean;
  siteId?: string;
}

// Palettes de couleurs prédéfinies pour les secteurs
const COLOR_PRESETS = [
  '#3B82F6', // Bleu
  '#10B981', // Vert
  '#EF4444', // Rouge
  '#F59E0B', // Orange
  '#8B5CF6', // Violet
  '#EC4899', // Rose
  '#6366F1', // Indigo
  '#D946EF', // Fuchsia
  '#0EA5E9', // Bleu ciel
  '#14B8A6', // Turquoise
  '#F97316', // Orange foncé
  '#8B5CF6', // Violet
];

/**
 * Composant d'administration des secteurs du bloc opératoire avec drag & drop hiérarchique
 */
export default function SecteursAdmin() {
  // États principaux
  const [secteurs, setSecteurs] = useState<BlocSector[]>([]);
  const [salles, setSalles] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentSecteur, setCurrentSecteur] = useState<SecteurFormData | null>(null);
  const [specialiteInput, setSpecialiteInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // États pour le drag & drop
  const [isDragMode, setIsDragMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<any>(null);

  // Ref pour throttling de la collision detection
  const lastCollisionDetectionTime = useRef<number>(0);
  const lastCollisionResult = useRef<any>(null);
  const lastLoggedCollision = useRef<string>('');
  const COLLISION_THROTTLE_MS = 100; // Throttle collision detection à 100ms (plus agressif)

  // Capteurs pour le drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Collision detection personnalisée pour gérer les trois cas : secteurs, salles ET sites
  const customCollisionDetection = useCallback((args: unknown) => {
    const { active, droppableContainers } = args;
    
    // Throttling pour éviter les détections excessives
    const now = Date.now();
    if (now - lastCollisionDetectionTime.current < COLLISION_THROTTLE_MS) {
      // Retourner le dernier résultat si on est dans la période de throttling
      return lastCollisionResult.current || [];
    }
    lastCollisionDetectionTime.current = now;

    // Si on drag une salle
    if (active.id.toString().startsWith('salle-')) {
      // Utiliser rectIntersection pour toutes les collisions possibles
      const allCollisions = rectIntersection(args);

      if (allCollisions.length === 0) {
        lastCollisionResult.current = [];
        return [];
      }

      // Séparer les collisions par type
      const secteurCollisions = allCollisions.filter((collision: unknown) =>
        collision.id.toString().startsWith('secteur-')
      );
      const salleCollisions = allCollisions.filter(
        (collision: unknown) =>
          collision.id.toString().startsWith('salle-') && collision.id !== active.id
      );

      // Déterminer le secteur de la salle active
      const activeSalleId = active.id.toString().replace('salle-', '');
      const activeSalle = salles.find(s => s.id === parseInt(activeSalleId));

      // PRIORITÉ ABSOLUE : Si on drop sur une salle, toujours l'utiliser (même cross-secteur)
      if (salleCollisions.length > 0) {
        const targetSalleId = salleCollisions[0].id.toString().replace('salle-', '');
        const targetSalle = salles.find(s => s.id === parseInt(targetSalleId));

        // Si même secteur → réorganisation interne
        if (activeSalle?.secteurId === targetSalle?.secteurId) {
          logger.info('🔄 Drop salle-à-salle (même secteur) détecté:', salleCollisions[0].id);
          lastCollisionResult.current = salleCollisions;
          return salleCollisions;
        }
        // Si secteurs différents → changement de secteur AVEC position précise
        else {
          logger.info('🏥 Drop cross-secteur sur salle détecté:', salleCollisions[0].id);
          lastCollisionResult.current = salleCollisions;
          return salleCollisions;
        }
      }
      // Sinon, drop sur zone de secteur vide (à la fin)
      else if (secteurCollisions.length > 0) {
        logger.info('🏥 Drop salle-à-secteur (zone vide) détecté:', secteurCollisions[0].id);
        lastCollisionResult.current = secteurCollisions;
        return secteurCollisions;
      }

      lastCollisionResult.current = allCollisions;
      return allCollisions;
    }

    // Si on drag un secteur
    if (active.id.toString().startsWith('secteur-')) {
      // Utiliser rectIntersection pour détecter les sites et autres secteurs
      const allCollisions = rectIntersection(args);

      if (allCollisions.length === 0) {
        lastCollisionResult.current = [];
        return [];
      }

      // Déterminer le secteur actif
      const activeSecteurId = active.id.toString().replace('secteur-', '');
      const activeSecteur = secteurs.find(s => s.id === activeSecteurId);

      // Séparer les collisions par type
      const siteCollisions = allCollisions.filter((collision: unknown) =>
        collision.id.toString().startsWith('site-')
      );
      const secteurCollisions = allCollisions.filter(
        (collision: unknown) =>
          collision.id.toString().startsWith('secteur-') && collision.id !== active.id
      );

      // PRIORITÉ 1: Drop secteur-à-secteur (même site pour réorganisation)
      if (secteurCollisions.length > 0) {
        const targetSecteurId = secteurCollisions[0].id.toString().replace('secteur-', '');
        const targetSecteur = secteurs.find(s => s.id === targetSecteurId);

        // Si même site → réorganisation interne
        if (activeSecteur?.siteId === targetSecteur?.siteId) {
          const collisionKey = `secteur-${secteurCollisions[0].id}`;
          if (lastLoggedCollision.current !== collisionKey) {
            logger.info('🔄 Drop secteur-à-secteur (même site) détecté:', secteurCollisions[0].id);
            lastLoggedCollision.current = collisionKey;
          }
          lastCollisionResult.current = secteurCollisions;
          return secteurCollisions;
        }
      }

      // PRIORITÉ 2: Drop secteur-à-site (changement de site)
      if (siteCollisions.length > 0) {
        const collisionKey = `site-${siteCollisions[0].id}`;
        if (lastLoggedCollision.current !== collisionKey) {
          logger.info('🏢 Drop secteur-à-site détecté:', siteCollisions[0].id);
          lastLoggedCollision.current = collisionKey;
        }
        lastCollisionResult.current = siteCollisions;
        return siteCollisions;
      }

      lastCollisionResult.current = allCollisions;
      return allCollisions;
    }

    // Pour les autres cas, utiliser la détection normale
    const result = closestCorners(args);
    lastCollisionResult.current = result;
    return result;
  }, [secteurs, salles]); // Dependencies pour useCallback

  // Charger les données initiales
  useEffect(() => {
    loadData();
  }, []);

  // Fonction helper pour faire des appels API authentifiés (utilise apiClient)
  const makeAuthenticatedRequest = async (
    url: string,
    options: { method?: string; body?: unknown } = {}
  ) => {
    const response = await apiClient({
      url,
      method: options.method || 'GET',
      data: options.body,
    });
    return response.data;
  };

  // Fonction pour charger les données
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    logger.info('🔄 Début du chargement des données...');

    try {
      logger.info('📡 Appel API operating-sectors...');
      const secteursResponse = await makeAuthenticatedRequest('/api/operating-sectors');
      logger.info('✅ Secteurs reçus:', secteursResponse);

      logger.info('📡 Appel API operating-rooms...');
      const sallesResponse = await makeAuthenticatedRequest('/api/operating-rooms');
      logger.info('✅ Salles reçues:', sallesResponse);

      logger.info('📡 Appel API sites...');
      const sitesResponse = await makeAuthenticatedRequest('/api/sites');
      logger.info('✅ Sites reçus:', sitesResponse);

      const [secteursData, sallesData] = [secteursResponse, sallesResponse];

      // Mapper les secteurs
      const mappedSecteurs = secteursData.map((sector: unknown) => ({
        id: sector.id,
        nom: sector.name,
        description: sector.description,
        couleur: sector.colorCode,
        specialites: sector.specialites || [],
        salles: sector.rooms?.map((room: unknown) => room.id) || [],
        estActif: sector.isActive,
        requiresSpecificSkills: sector.requiresSpecificSkills || false,
        supervisionSpeciale: sector.supervisionSpeciale || false,
        siteId: sector.siteId,
        siteName: sector.site?.name,
        displayOrder: sector.displayOrder || 0,
      }));

      const mappedSalles = sallesData.map((room: unknown) => ({
        id: room.id,
        numero: room.numero || room.number,
        nom: room.nom || room.name,
        secteurId: room.secteurId || room.operatingSectorId,
        estActif: room.estActif !== undefined ? room.estActif : room.isActive,
        displayOrder: room.displayOrder || 0,
      }));

      logger.info('📊 Secteurs mappés:', mappedSecteurs);
      logger.info('🏥 Salles mappées:', mappedSalles);
      logger.info('🏢 Sites:', sitesResponse);

      setSecteurs(mappedSecteurs);
      setSalles(mappedSalles);
      setSites(sitesResponse);

      logger.info('✅ Données chargées avec succès !');
    } catch (err: unknown) {
      logger.error('❌ Erreur de chargement:', { error: err });
      setError(
        `Erreur lors du chargement des données: ${err instanceof Error ? err.message : 'Erreur inconnue'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Ouvrir le dialogue pour ajouter un nouveau secteur
  const handleAddSecteur = () => {
    setCurrentSecteur({
      nom: '',
      description: '',
      couleur: COLOR_PRESETS[0],
      specialites: [],
      estActif: true,
      requiresSpecificSkills: false,
      supervisionSpeciale: false,
      siteId: sites.length > 0 ? sites[0].id : '',
    });
    setShowDialog(true);
  };

  // Ouvrir le dialogue pour modifier un secteur existant
  const handleEditSecteur = (secteur: BlocSector) => {
    setCurrentSecteur({
      id: secteur.id,
      nom: secteur.nom,
      description: secteur.description || '',
      couleur: secteur.couleur || COLOR_PRESETS[0],
      specialites: secteur.specialites || [],
      estActif: secteur.estActif,
      requiresSpecificSkills: secteur.requiresSpecificSkills || false,
      supervisionSpeciale: secteur.supervisionSpeciale || false,
      siteId: (secteur as any).siteId || (sites.length > 0 ? sites[0].id : ''),
    });
    setShowDialog(true);
  };

  // Ouvrir le dialogue de confirmation de suppression
  const handleDeleteClick = (secteur: BlocSector) => {
    setCurrentSecteur({
      id: secteur.id,
      nom: secteur.nom,
      description: secteur.description || '',
      couleur: secteur.couleur || '',
      specialites: secteur.specialites || [],
      estActif: secteur.estActif,
      requiresSpecificSkills: secteur.requiresSpecificSkills || false,
      supervisionSpeciale: secteur.supervisionSpeciale || false,
      siteId: (secteur as any).siteId || '',
    });
    setShowDeleteDialog(true);
  };

  // Confirmer la suppression d'un secteur
  const handleDeleteConfirm = async () => {
    if (!currentSecteur?.id) return;

    setIsSubmitting(true);
    try {
      await makeAuthenticatedRequest(`/api/operating-sectors/${currentSecteur.id}`, {
        method: 'DELETE',
      });

      setSecteurs(prev => prev.filter(s => s.id !== currentSecteur.id));
      toast({
        title: 'Secteur supprimé',
        description: `Le secteur ${currentSecteur.nom} a été supprimé avec succès.`,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  // Sauvegarder un secteur (création ou modification)
  const handleSaveSecteur = async () => {
    if (!currentSecteur) return;

    // Validation basique
    if (!currentSecteur.nom.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom du secteur est requis.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const secteurData = {
        name: currentSecteur.nom,
        description: currentSecteur.description,
        colorCode: currentSecteur.couleur,
        isActive: currentSecteur.estActif,
        requiresSpecificSkills: currentSecteur.requiresSpecificSkills,
        supervisionSpeciale: currentSecteur.supervisionSpeciale,
        siteId: currentSecteur.siteId || null,
        specialites: currentSecteur.specialites,
      };

      let updatedSecteur;
      if (currentSecteur.id) {
        // Modification
        updatedSecteur = await makeAuthenticatedRequest(
          `/api/operating-sectors/${currentSecteur.id}`,
          {
            method: 'PUT',
            body: secteurData,
          }
        );

        setSecteurs(prev =>
          prev.map(s =>
            s.id === currentSecteur.id
              ? {
                  ...s,
                  nom: secteurData.name,
                  description: secteurData.description,
                  couleur: secteurData.colorCode,
                  estActif: secteurData.isActive,
                  requiresSpecificSkills: secteurData.requiresSpecificSkills,
                  supervisionSpeciale: secteurData.supervisionSpeciale,
                  siteId: secteurData.siteId,
                  specialites: secteurData.specialites,
                }
              : s
          )
        );

        toast({
          title: 'Secteur modifié',
          description: `Le secteur ${secteurData.name} a été mis à jour avec succès.`,
        });
      } else {
        // Création
        updatedSecteur = await makeAuthenticatedRequest('/api/operating-sectors', {
          method: 'POST',
          body: secteurData,
        });

        const newSecteur = {
          id: updatedSecteur.id,
          nom: secteurData.name,
          description: secteurData.description,
          couleur: secteurData.colorCode,
          specialites: secteurData.specialites,
          salles: [],
          estActif: secteurData.isActive,
          requiresSpecificSkills: secteurData.requiresSpecificSkills,
          supervisionSpeciale: secteurData.supervisionSpeciale,
          siteId: secteurData.siteId,
        };

        setSecteurs(prev => [...prev, newSecteur]);

        toast({
          title: 'Secteur ajouté',
          description: `Le secteur ${updatedSecteur.nom} a été ajouté avec succès.`,
        });
      }

      setShowDialog(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compter le nombre de salles dans un secteur
  const countRoomsInSector = (secteurId: string) => {
    return salles.filter(salle => salle.secteurId === secteurId).length;
  };

  // Obtenir le nom du site par son ID
  const getSiteName = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : 'Site inconnu';
  };

  // Fonctions de gestion du drag & drop
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Reset le log de collision pour un nouveau drag
    lastLoggedCollision.current = '';

    logger.info('DragStart - Active:', active.id);

    // Déterminer le type d'élément (secteur ou salle)
    const id = active.id as string;
    if (id.startsWith('secteur-')) {
      const secteurId = id.replace('secteur-', '');
      const secteur = secteurs.find(s => s.id === secteurId);
      setDraggedItem({ type: 'secteur', data: secteur });
    } else if (id.startsWith('salle-')) {
      const salleId = id.replace('salle-', '');
      const salle = salles.find(s => s.id === parseInt(salleId));
      setDraggedItem({ type: 'salle', data: salle });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    logger.info('DragEnd - Active:', active.id, 'Over:', over?.id);

    if (!over || !isDragMode) {
      setActiveId(null);
      setDraggedItem(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Gestion du déplacement des secteurs vers un site
    if (activeId.startsWith('secteur-') && overId.startsWith('site-')) {
      const secteurId = activeId.replace('secteur-', '');
      const siteId = overId.replace('site-', '');

      await handleMoveSecteurToSite(secteurId, siteId === 'null' ? null : siteId);
    }

    // Gestion de la réorganisation des secteurs au sein du même site
    else if (activeId.startsWith('secteur-') && overId.startsWith('secteur-')) {
      const activeSecteurId = activeId.replace('secteur-', '');
      const targetSecteurId = overId.replace('secteur-', '');

      // Vérifier que les secteurs sont dans le même site
      const activeSecteur = secteurs.find(s => s.id === parseInt(activeSecteurId));
      const targetSecteur = secteurs.find(s => s.id === parseInt(targetSecteurId));

      if (
        activeSecteur &&
        targetSecteur &&
        (activeSecteur as any).siteId === (targetSecteur as any).siteId
      ) {
        await handleReorganizeSecteursInSite(activeSecteurId, targetSecteurId);
      }
    }

    // Gestion du déplacement des salles vers un secteur
    else if (activeId.startsWith('salle-') && overId.startsWith('secteur-')) {
      const salleId = activeId.replace('salle-', '');
      const secteurId = overId.replace('secteur-', '');

      await handleMoveSalleToSecteur(salleId, secteurId === 'null' ? null : secteurId);
    }

    // Gestion des drops salle-à-salle (même secteur OU cross-secteur)
    else if (activeId.startsWith('salle-') && overId.startsWith('salle-')) {
      const activeSalleId = activeId.replace('salle-', '');
      const overSalleId = overId.replace('salle-', '');

      // Déterminer si c'est un drop interne ou cross-secteur
      const activeSalle = salles.find(s => s.id === parseInt(activeSalleId));
      const overSalle = salles.find(s => s.id === parseInt(overSalleId));

      if (activeSalle?.secteurId === overSalle?.secteurId) {
        // Même secteur → réorganisation interne
        await handleReorganizeSallesInSector(activeSalleId, overSalleId);
      } else {
        // Secteurs différents → changement de secteur avec position précise
        await handleMoveSalleToSecteurAtPosition(
          activeSalleId,
          overSalle?.secteurId || null,
          overSalleId
        );
      }
    }

    setActiveId(null);
    setDraggedItem(null);
  };

  // Déplacer un secteur vers un site
  const handleMoveSecteurToSite = async (secteurId: string, newSiteId: string | null) => {
    try {
      await makeAuthenticatedRequest(`/api/operating-sectors/${secteurId}`, {
        method: 'PUT',
        body: {
          siteId: newSiteId,
        },
      });

      // Recharger les données depuis l'API pour être sûr de la synchronisation
      await loadData();

      toast({
        title: 'Secteur déplacé',
        description: `Le secteur a été déplacé vers ${newSiteId ? getSiteName(newSiteId) : 'les non-assignés'}.`,
      });
    } catch (error: unknown) {
      logger.error('Erreur lors du déplacement du secteur:', { error: error });
      toast({
        title: 'Erreur',
        description: 'Impossible de déplacer le secteur.',
        variant: 'destructive',
      });
    }
  };

  // Réorganiser les secteurs au sein du même site
  const handleReorganizeSecteursInSite = async (
    activeSecteurId: string,
    targetSecteurId: string
  ) => {
    try {
      const activeSecteur = secteurs.find(s => s.id === parseInt(activeSecteurId));
      const targetSecteur = secteurs.find(s => s.id === parseInt(targetSecteurId));

      if (
        !activeSecteur ||
        !targetSecteur ||
        (activeSecteur as any).siteId !== (targetSecteur as any).siteId
      ) {
        return;
      }

      // Récupérer tous les secteurs du même site, triés par displayOrder
      const secteursDuSite = secteurs
        .filter(s => (s as any).siteId === (activeSecteur as any).siteId)
        .sort((a, b) => ((a as any).displayOrder || 0) - ((b as any).displayOrder || 0));

      const activeIndex = secteursDuSite.findIndex(s => s.id === parseInt(activeSecteurId));
      const targetIndex = secteursDuSite.findIndex(s => s.id === parseInt(targetSecteurId));

      if (activeIndex === -1 || targetIndex === -1) return;

      // Créer le nouvel ordre
      const newOrder = [...secteursDuSite];
      const [removed] = newOrder.splice(activeIndex, 1);
      newOrder.splice(targetIndex, 0, removed);

      // Mettre à jour les displayOrder
      const updatedSecteurs = newOrder.map((secteur, index) => ({
        ...secteur,
        displayOrder: index,
      }));

      // Mettre à jour en base seulement le secteur déplacé
      await makeAuthenticatedRequest(`/api/operating-sectors/${activeSecteurId}`, {
        method: 'PUT',
        body: {
          displayOrder:
            updatedSecteurs.find(s => s.id === parseInt(activeSecteurId))?.displayOrder || 0,
        },
      });

      // Recharger les données depuis l'API pour être sûr de la synchronisation
      await loadData();

      toast({
        title: 'Secteurs réorganisés',
        description:
          "L'ordre des secteurs a été mis à jour pour améliorer la présentation des plannings.",
      });

      logger.info(
        `Réorganisation interne: secteur ${activeSecteurId} déplacé à la position du secteur ${targetSecteurId}`
      );
    } catch (error: unknown) {
      logger.error('Erreur lors de la réorganisation des secteurs:', { error: error });
      // Recharger les données en cas d'erreur
      loadData();
      toast({
        title: 'Erreur',
        description: 'Impossible de réorganiser les secteurs.',
        variant: 'destructive',
      });
    }
  };

  // Déplacer une salle vers un secteur
  const handleMoveSalleToSecteur = async (salleId: string, newSecteurId: string | null) => {
    try {
      // Récupérer les données actuelles de la salle
      const currentSalle = salles.find(s => s.id === parseInt(salleId));
      if (!currentSalle) {
        throw new Error('Salle introuvable');
      }

      // Calculer le displayOrder pour le nouveau secteur (à la fin)
      const sallesDansNouveauSecteur = salles.filter(
        s =>
          s.secteurId === (newSecteurId ? parseInt(newSecteurId) : null) &&
          s.id !== parseInt(salleId) // Exclure la salle qu'on déplace
      );
      const nouveauDisplayOrder = sallesDansNouveauSecteur.length; // Position à la fin

      // Préparer les données complètes pour l'API
      const updateData = {
        name: currentSalle.nom || currentSalle.name || `Salle ${currentSalle.numero}`,
        number: currentSalle.numero?.toString() || currentSalle.number?.toString() || salleId,
        sectorId: newSecteurId ? parseInt(newSecteurId) : null,
        isActive: currentSalle.estActif ?? currentSalle.isActive ?? true,
        type: currentSalle.type || 'STANDARD',
        displayOrder: nouveauDisplayOrder,
      };

      logger.info(`Déplacement salle ${salleId} vers secteur ${newSecteurId}:`, updateData);

      const response = await makeAuthenticatedRequest(`/api/operating-rooms/${salleId}`, {
        method: 'PUT',
        body: updateData,
      });

      logger.info('Réponse API:', response);

      // Mettre à jour l'état local avec la donnée de l'API si possible
      const updatedSecteurId = newSecteurId ? parseInt(newSecteurId) : null;
      setSalles(prev =>
        prev.map(s =>
          s.id === parseInt(salleId)
            ? {
                ...s,
                secteurId: updatedSecteurId,
                displayOrder: nouveauDisplayOrder,
              }
            : s
        )
      );

      logger.info('État local mis à jour:', { salleId, newSecteurId, updatedSecteurId });

      toast({
        title: 'Salle déplacée',
        description: `La salle a été déplacée vers ${newSecteurId ? 'le secteur sélectionné' : 'les non-assignées'}.`,
      });
    } catch (error: unknown) {
      logger.error('Erreur lors du déplacement de la salle:', { error: error });

      // Afficher l'erreur détaillée dans le toast
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: 'Erreur',
        description: `Impossible de déplacer la salle: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  // Réorganiser les salles au sein du même secteur
  const handleReorganizeSallesInSector = async (activeSalleId: string, targetSalleId: string) => {
    try {
      const activeSalle = salles.find(s => s.id === parseInt(activeSalleId));
      const targetSalle = salles.find(s => s.id === parseInt(targetSalleId));

      if (!activeSalle || !targetSalle || activeSalle.secteurId !== targetSalle.secteurId) {
        return;
      }

      // Récupérer toutes les salles du secteur, triées par displayOrder
      const sallesDuSecteur = salles
        .filter(s => s.secteurId === activeSalle.secteurId)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

      const activeIndex = sallesDuSecteur.findIndex(s => s.id === parseInt(activeSalleId));
      const targetIndex = sallesDuSecteur.findIndex(s => s.id === parseInt(targetSalleId));

      if (activeIndex === -1 || targetIndex === -1) return;

      // Créer le nouvel ordre
      const newOrder = [...sallesDuSecteur];
      const [removed] = newOrder.splice(activeIndex, 1);
      newOrder.splice(targetIndex, 0, removed);

      // Mettre à jour les displayOrder
      const updatedSalles = newOrder.map((salle, index) => ({
        ...salle,
        displayOrder: index,
      }));

      // Mettre à jour l'état local immédiatement
      setSalles(prev =>
        prev.map(s => {
          const updated = updatedSalles.find(us => us.id === s.id);
          return updated ? updated : s;
        })
      );

      // Mettre à jour en base
      await makeAuthenticatedRequest(`/api/operating-rooms/${activeSalleId}`, {
        method: 'PUT',
        body: {
          name: activeSalle.nom || `Salle ${activeSalle.numero}`,
          number: activeSalle.numero?.toString() || activeSalleId,
          sectorId: activeSalle.secteurId,
          isActive: activeSalle.estActif ?? true,
          type: activeSalle.type || 'STANDARD',
          displayOrder:
            updatedSalles.find(s => s.id === parseInt(activeSalleId))?.displayOrder || 0,
        },
      });

      logger.info('Réorganisation interne réussie');
    } catch (error: unknown) {
      logger.error('Erreur lors de la réorganisation:', { error: error });
      // Recharger les données en cas d'erreur
      loadData();
    }
  };

  // Déplacer une salle vers un secteur à une position précise
  const handleMoveSalleToSecteurAtPosition = async (
    activeSalleId: string,
    newSecteurId: number | null,
    targetSalleId: string
  ) => {
    try {
      const activeSalle = salles.find(s => s.id === parseInt(activeSalleId));
      const targetSalle = salles.find(s => s.id === parseInt(targetSalleId));

      if (!activeSalle || !targetSalle) {
        throw new Error('Salle introuvable');
      }

      // Récupérer les salles du secteur de destination, triées par displayOrder
      const sallesDuSecteurDestination = salles
        .filter(s => s.secteurId === newSecteurId && s.id !== parseInt(activeSalleId))
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

      // Trouver l'index de la salle cible
      const targetIndex = sallesDuSecteurDestination.findIndex(
        s => s.id === parseInt(targetSalleId)
      );

      // Créer le nouvel ordre en insérant la salle active à la position de la cible
      const newOrder = [...sallesDuSecteurDestination];
      newOrder.splice(targetIndex, 0, { ...activeSalle, secteurId: newSecteurId });

      // Mettre à jour les displayOrder pour toutes les salles affectées
      const updatedSalles = newOrder.map((salle, index) => ({
        ...salle,
        displayOrder: index,
      }));

      // Mettre à jour l'état local
      setSalles(prev =>
        prev.map(s => {
          if (s.id === parseInt(activeSalleId)) {
            return { ...s, secteurId: newSecteurId, displayOrder: targetIndex };
          }
          const updated = updatedSalles.find(us => us.id === s.id);
          return updated ? updated : s;
        })
      );

      // Mettre à jour en base
      await makeAuthenticatedRequest(`/api/operating-rooms/${activeSalleId}`, {
        method: 'PUT',
        body: {
          name: activeSalle.nom || `Salle ${activeSalle.numero}`,
          number: activeSalle.numero?.toString() || activeSalleId,
          sectorId: newSecteurId,
          isActive: activeSalle.estActif ?? true,
          type: activeSalle.type || 'STANDARD',
          displayOrder: targetIndex,
        },
      });

      toast({
        title: 'Salle déplacée',
        description: `La salle a été déplacée et positionnée précisément.`,
      });

      logger.info(
        `Cross-secteur avec position: salle ${activeSalleId} → secteur ${newSecteurId} à la position ${targetIndex}`
      );
    } catch (error: unknown) {
      logger.error('Erreur lors du déplacement cross-secteur:', { error: error });
      toast({
        title: 'Erreur',
        description: 'Impossible de déplacer la salle à cette position.',
        variant: 'destructive',
      });
    }
  };

  // Ajouter une spécialité
  const handleAddSpecialite = () => {
    if (!specialiteInput.trim() || !currentSecteur) return;

    setCurrentSecteur({
      ...currentSecteur,
      specialites: [...currentSecteur.specialites, specialiteInput.trim()],
    });
    setSpecialiteInput('');
  };

  // Supprimer une spécialité
  const handleRemoveSpecialite = (index: number) => {
    if (!currentSecteur) return;

    setCurrentSecteur({
      ...currentSecteur,
      specialites: currentSecteur.specialites.filter((_, i) => i !== index),
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
          <Button onClick={loadData} className="mt-4">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Administration des secteurs</h1>
        <div className="flex gap-2">
          <Button
            variant={isDragMode ? 'default' : 'outline'}
            onClick={() => setIsDragMode(!isDragMode)}
            className="flex items-center gap-2"
          >
            <Move className="h-4 w-4" />
            {isDragMode ? 'Quitter' : 'Mode'} réorganisation
          </Button>
          <Button onClick={handleAddSecteur} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Ajouter un secteur
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {isLoading ? (
          <p className="text-center py-4">Chargement des secteurs...</p>
        ) : secteurs.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Aucun secteur n'a été configuré.
              <div className="mt-4">
                <Button variant="outline" onClick={handleAddSecteur}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Ajouter votre premier secteur
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Sites avec leurs secteurs */}
            {sites.map(site => (
              <div key={site.id} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  📍 {site.name}
                </h3>

                {/* Zone de drop pour les secteurs */}
                <SortableContext
                  items={secteurs
                    .filter(s => (s as any).siteId === site.id)
                    .sort((a, b) => ((a as any).displayOrder || 0) - ((b as any).displayOrder || 0))
                    .map(s => `secteur-${s.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <DroppableSiteZone siteId={site.id} isDragMode={isDragMode}>
                    <div className="space-y-3">
                      {secteurs
                        .filter(secteur => (secteur as any).siteId === site.id)
                        .sort(
                          (a, b) => ((a as any).displayOrder || 0) - ((b as any).displayOrder || 0)
                        )
                        .map(secteur => (
                          <div key={secteur.id} className="space-y-2">
                            <SortableSecteurItem
                              secteur={secteur}
                              isDragMode={isDragMode}
                              onEdit={handleEditSecteur}
                              onDelete={handleDeleteClick}
                              countRooms={countRoomsInSector}
                              getSiteName={getSiteName}
                            />

                            {/* Salles du secteur - Zone de drop toujours visible en mode drag */}
                            {(salles.filter(salle => salle.secteurId === secteur.id).length > 0 ||
                              isDragMode) && (
                              <div className="ml-8 space-y-1">
                                <DroppableSecteurZone
                                  secteurId={secteur.id}
                                  isDragMode={isDragMode}
                                >
                                  {salles
                                    .filter(salle => salle.secteurId === secteur.id)
                                    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                                    .map(salle => (
                                      <DraggableSalleItem
                                        key={salle.id}
                                        salle={salle}
                                        isDragMode={isDragMode}
                                      />
                                    ))}
                                  {salles.filter(salle => salle.secteurId === secteur.id).length ===
                                    0 &&
                                    isDragMode && (
                                      <p className="text-center text-yellow-600 text-sm py-2">
                                        Glissez une salle ici
                                      </p>
                                    )}
                                </DroppableSecteurZone>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                    {secteurs.filter(s => (s as any).siteId === site.id).length === 0 && (
                      <p className="text-center text-gray-400 py-4">
                        {isDragMode ? 'Glissez un secteur ici' : 'Aucun secteur dans ce site'}
                      </p>
                    )}
                  </DroppableSiteZone>
                </SortableContext>
              </div>
            ))}

            {/* Secteurs non assignés */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-600 border-b pb-2">
                🔸 Secteurs non assignés
              </h3>

              <SortableContext
                items={secteurs
                  .filter(s => !(s as any).siteId)
                  .sort((a, b) => ((a as any).displayOrder || 0) - ((b as any).displayOrder || 0))
                  .map(s => `secteur-${s.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <DroppableSiteZone siteId="null" isDragMode={isDragMode}>
                  <div className="space-y-3">
                    {secteurs
                      .filter(secteur => !(secteur as any).siteId)
                      .sort(
                        (a, b) => ((a as any).displayOrder || 0) - ((b as any).displayOrder || 0)
                      )
                      .map(secteur => (
                        <div key={secteur.id} className="space-y-2">
                          <SortableSecteurItem
                            secteur={secteur}
                            isDragMode={isDragMode}
                            onEdit={handleEditSecteur}
                            onDelete={handleDeleteClick}
                            countRooms={countRoomsInSector}
                            getSiteName={getSiteName}
                          />

                          {/* Salles du secteur - Zone de drop toujours visible en mode drag */}
                          {(salles.filter(salle => salle.secteurId === secteur.id).length > 0 ||
                            isDragMode) && (
                            <div className="ml-8 space-y-1">
                              <DroppableSecteurZone secteurId={secteur.id} isDragMode={isDragMode}>
                                {salles
                                  .filter(salle => salle.secteurId === secteur.id)
                                  .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                                  .map(salle => (
                                    <DraggableSalleItem
                                      key={salle.id}
                                      salle={salle}
                                      isDragMode={isDragMode}
                                    />
                                  ))}
                                {salles.filter(salle => salle.secteurId === secteur.id).length ===
                                  0 &&
                                  isDragMode && (
                                    <p className="text-center text-yellow-600 text-sm py-2">
                                      Glissez une salle ici
                                    </p>
                                  )}
                              </DroppableSecteurZone>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                  {secteurs.filter(s => !(s as any).siteId).length === 0 && (
                    <p className="text-center text-gray-400 py-4">
                      {isDragMode
                        ? 'Glissez un secteur ici pour le désassigner'
                        : 'Aucun secteur non assigné'}
                    </p>
                  )}
                </DroppableSiteZone>
              </SortableContext>
            </div>

            {/* Salles non assignées - Toujours visible en mode drag */}
            {(salles.filter(salle => !salle.secteurId).length > 0 || isDragMode) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-500 border-b pb-2">
                  🏥 Salles non assignées
                </h3>

                <DroppableNonAssigneesZone isDragMode={isDragMode}>
                  <div className="space-y-2">
                    {salles
                      .filter(salle => !salle.secteurId)
                      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                      .map(salle => (
                        <DraggableSalleItem key={salle.id} salle={salle} isDragMode={isDragMode} />
                      ))}
                    {salles.filter(salle => !salle.secteurId).length === 0 && (
                      <p className="text-center text-gray-400 py-4">
                        {isDragMode
                          ? 'Glissez une salle ici pour la désassigner'
                          : 'Aucune salle non assignée'}
                      </p>
                    )}
                  </div>
                </DroppableNonAssigneesZone>
              </div>
            )}
          </div>
        )}

        {/* Overlay de drag */}
        <DragOverlay>
          {activeId && draggedItem ? (
            <div className="bg-white rounded shadow-lg border-2 border-blue-500 p-3 opacity-90">
              {draggedItem.type === 'secteur' ? (
                <div className="flex items-center">
                  <div
                    className="w-6 h-6 rounded-full mr-3"
                    style={{ backgroundColor: draggedItem.data?.couleur || '#CBD5E1' }}
                  />
                  <strong>{draggedItem.data?.nom}</strong>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="font-medium">
                    {draggedItem.data?.nom || `Salle ${draggedItem.data?.numero}`}
                  </span>
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Dialogue d'ajout/modification de secteur */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentSecteur?.id ? 'Modifier le secteur' : 'Ajouter un secteur'}
            </DialogTitle>
            <DialogDescription>
              {currentSecteur?.id
                ? 'Modifiez les informations du secteur sélectionné.'
                : 'Créez un nouveau secteur opératoire.'}
            </DialogDescription>
          </DialogHeader>

          {currentSecteur && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="nom">Nom du secteur *</Label>
                <Input
                  id="nom"
                  value={currentSecteur.nom}
                  onChange={e => setCurrentSecteur({ ...currentSecteur, nom: e.target.value })}
                  placeholder="Ex: Bloc Orthopédie"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={currentSecteur.description}
                  onChange={e =>
                    setCurrentSecteur({ ...currentSecteur, description: e.target.value })
                  }
                  placeholder="Description du secteur..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="site">Site</Label>
                <select
                  id="site"
                  value={currentSecteur.siteId || ''}
                  onChange={e => setCurrentSecteur({ ...currentSecteur, siteId: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Aucun site (non assigné)</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="couleur">Couleur</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={currentSecteur.couleur}
                    onChange={e =>
                      setCurrentSecteur({ ...currentSecteur, couleur: e.target.value })
                    }
                    className="w-12 h-10 border rounded cursor-pointer"
                  />
                  <div className="flex flex-wrap gap-1">
                    {COLOR_PRESETS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCurrentSecteur({ ...currentSecteur, couleur: color })}
                        className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>Spécialités</Label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    value={specialiteInput}
                    onChange={e => setSpecialiteInput(e.target.value)}
                    placeholder="Ajouter une spécialité..."
                    onKeyPress={e => e.key === 'Enter' && handleAddSpecialite()}
                  />
                  <Button type="button" onClick={handleAddSpecialite} size="sm">
                    Ajouter
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {currentSecteur.specialites.map((spec, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {spec}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveSpecialite(index)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="actif"
                    checked={currentSecteur.estActif}
                    onCheckedChange={checked =>
                      setCurrentSecteur({ ...currentSecteur, estActif: checked as boolean })
                    }
                  />
                  <Label htmlFor="actif">Secteur actif</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requiresSpecificSkills"
                    checked={currentSecteur.requiresSpecificSkills}
                    onCheckedChange={checked =>
                      setCurrentSecteur({
                        ...currentSecteur,
                        requiresSpecificSkills: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="requiresSpecificSkills">
                    Requiert des compétences spécifiques
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="supervisionSpeciale"
                    checked={currentSecteur.supervisionSpeciale}
                    onCheckedChange={checked =>
                      setCurrentSecteur({
                        ...currentSecteur,
                        supervisionSpeciale: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="supervisionSpeciale">Supervision spéciale requise</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveSecteur} disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : currentSecteur?.id ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>Cette action est irréversible.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p>
              Êtes-vous sûr de vouloir supprimer le secteur <strong>{currentSecteur?.nom}</strong> ?
            </p>
            {currentSecteur && countRoomsInSector(currentSecteur.id || '') > 0 && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                <div className="flex items-center text-orange-800">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Ce secteur contient {countRoomsInSector(currentSecteur.id || '')} salle(s). La
                  suppression n'est pas autorisée.
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={
                isSubmitting || (currentSecteur && countRoomsInSector(currentSecteur.id || '') > 0)
              }
            >
              {isSubmitting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
