'use client';

import React, { useEffect, useState } from 'react';
import { logger } from '../../../lib/logger';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Button from '@/components/ui/button';
import { PlusIcon, RefreshCcw, AlertCircle, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from 'react-toastify';
import { toast as managedToast, toastManager } from '@/lib/toast-manager';
import { Badge } from '@/components/ui/badge';
import { useUsers } from '@/hooks/useUsers';
import { useTrameModeles, useTrameModele, useUpdateTrameModele, usePrefetchTrames } from '@/hooks/useTrameQueries';
import { TRAME_ENDPOINTS, buildApiUrl } from '@/config/api-endpoints';
import { useQuery } from '@tanstack/react-query';

// Import du modal de création
const NewTrameModal = dynamic(() => import('@/components/trames/grid-view/NewTrameModal'), {
  ssr: false,
});

// Import dynamique pour éviter les problèmes SSR avec react-beautiful-dnd
const TrameGridView = dynamic(() => import('@/components/trames/grid-view/TrameGridView'), {
  ssr: false,
});

// Importer uniquement les types
import type { TrameModele, AffectationModele } from '@/components/trames/grid-view/TrameGridView';

// Interfaces pour les salles et secteurs
interface OperatingRoom {
  id: string;
  name: string;
  number?: string;
  operatingSectorId: string;
  isActive: boolean;
  displayOrder?: number;
  sector?: OperatingSector;
}

interface OperatingSector {
  id: string;
  name: string;
  description?: string;
  colorCode?: string;
  siteId: string;
  isActive: boolean;
}

// Fonction pour convertir les données du back-end vers le format attendu par TrameGridView
const mapTrameFromApi = (apiTrame: any): TrameModele => {
  logger.info('[MAPPING] API TrameModele before mapping:', apiTrame);

  // Mapping du type de semaine
  let weekType: 'ALL' | 'EVEN' | 'ODD' = 'ALL';
  if (apiTrame.typeSemaine === 'PAIRES') weekType = 'EVEN';
  if (apiTrame.typeSemaine === 'IMPAIRES') weekType = 'ODD';
  if (apiTrame.typeSemaine === 'TOUTES') weekType = 'ALL';

  logger.info(`[MAPPING] typeSemaine "${apiTrame.typeSemaine}" mapped to weekType "${weekType}"`);

  // Mapping des affectations
  const affectations: AffectationModele[] =
    apiTrame.affectations?.map((aff: any) => {
      // Mapping du type de période
      let period: 'MORNING' | 'AFTERNOON' | 'FULL_DAY' = 'FULL_DAY';
      if (aff.periode === 'MATIN') period = 'MORNING';
      if (aff.periode === 'APRES_MIDI') period = 'AFTERNOON';
      if (aff.periode === 'JOURNEE_ENTIERE') period = 'FULL_DAY';

      // Mapping des personnels requis
      const requiredStaff =
        aff.personnelRequis?.map((pr: any) => {
          let userId = undefined;

          // Gérer les différents cas d'assignation d'utilisateur
          if (pr.userHabituel?.id) {
            // Si on a un objet User complet
            userId = pr.userHabituel.id.toString();
          } else if (pr.personnelHabituelUserId) {
            // Si on a un ID d'utilisateur standard
            userId = pr.personnelHabituelUserId.toString();
          } else if (pr.personnelHabituelSurgeonId) {
            // Si on a un ID de chirurgien, préfixer avec "surgeon-"
            userId = `surgeon-${pr.personnelHabituelSurgeonId}`;
          }

          return {
            id: pr.id.toString(),
            affectationId: aff.id.toString(),
            role: mapRoleFromApi(pr.roleGenerique),
            count: pr.nombreRequis || 1,
            userId: userId,
          };
        }) || [];

      return {
        id: aff.id.toString(),
        trameId: apiTrame.id.toString(),
        roomId: aff.operatingRoomId?.toString(),
        activityTypeId: aff.activityTypeId,
        period: period,
        dayOverride: aff.jourSemaine, // Convertir jour de la semaine si nécessaire
        weekTypeOverride: mapWeekTypeFromApi(aff.typeSemaine),
        requiredStaff: requiredStaff,
        isActive: aff.isActive,
      };
    }) || [];

  const mappedTrame: TrameModele = {
    id: apiTrame.id.toString(),
    name: apiTrame.name,
    description: apiTrame.description,
    siteId: apiTrame.siteId,
    weekType: weekType,
    activeDays: apiTrame.joursSemaineActifs || [1, 2, 3, 4, 5],
    effectiveStartDate: new Date(apiTrame.dateDebutEffet),
    effectiveEndDate: apiTrame.dateFinEffet ? new Date(apiTrame.dateFinEffet) : undefined,
    affectations: affectations,
    // Preserve detailsJson from API response containing selectedRooms and selectedSectors
    detailsJson: apiTrame.detailsJson || null,
  };

  logger.info('[MAPPING] Final mapped TrameModele:', mappedTrame);
  return mappedTrame;
};

// Fonction pour mapper les rôles depuis l'API
const mapRoleFromApi = (role: string): 'MAR' | 'SURGEON' | 'IADE' | 'IBODE' => {
  switch (role) {
    case 'MAR':
      return 'MAR';
    case 'CHIRURGIEN':
      return 'SURGEON';
    case 'IADE':
      return 'IADE';
    case 'IBODE':
      return 'IBODE';
    default:
      return 'MAR'; // Valeur par défaut
  }
};

// Fonction pour mapper les types de semaine depuis l'API
const mapWeekTypeFromApi = (typeSemaine: string): 'ALL' | 'EVEN' | 'ODD' => {
  switch (typeSemaine) {
    case 'PAIRES':
      return 'EVEN';
    case 'IMPAIRES':
      return 'ODD';
    case 'TOUTES':
      return 'ALL';
    default:
      return 'ALL';
  }
};

// Fonction pour mapper de TrameModele vers le format API
const mapTrameToApi = (trameModele: TrameModele): any => {
  // Mapping inverse du type de semaine
  let typeSemaine: 'TOUTES' | 'PAIRES' | 'IMPAIRES' = 'TOUTES';
  if (trameModele.weekType === 'EVEN') typeSemaine = 'PAIRES';
  if (trameModele.weekType === 'ODD') typeSemaine = 'IMPAIRES';
  if (trameModele.weekType === 'ALL') typeSemaine = 'TOUTES';

  return {
    name: trameModele.name,
    description: trameModele.description,
    siteId: trameModele.siteId,
    isActive: true,
    dateDebutEffet: trameModele.effectiveStartDate,
    dateFinEffet: trameModele.effectiveEndDate,
    recurrenceType: 'HEBDOMADAIRE',
    joursSemaineActifs: trameModele.activeDays,
    typeSemaine: typeSemaine,
    roles: ['TOUS'],
    // Preserve detailsJson containing selectedRooms and selectedSectors
    detailsJson: trameModele.detailsJson || null,
  };
};

const TrameGridEditor: React.FC = () => {
  const { user } = useAuth();
  const { users } = useUsers(); // Récupération des utilisateurs réels
  const [selectedTrameId, setSelectedTrameId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sites, setSites] = useState<Array<{ id: string; name: string }>>([]);
  const [rooms, setRooms] = useState<OperatingRoom[]>([]);
  const [sectors, setSectors] = useState<OperatingSector[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [trameToEdit, setTrameToEdit] = useState<TrameModele | null>(null);
  
  // Utiliser React Query pour charger les trames
  const { data: tramesData = [], isLoading, error: loadingError, refetch: refetchTrames } = useTrameModeles({ includeAffectations: true });
  const trameModeles = tramesData.map(mapTrameFromApi);
  
  // Hook pour la mise à jour des trames
  const updateTrameMutation = useUpdateTrameModele();
  
  // Hook pour précharger les données
  const { prefetchTrameModeles, prefetchTrameDetail } = usePrefetchTrames();

  // Effet pour sélectionner la première trame par défaut
  useEffect(() => {
    if (trameModeles.length > 0 && !selectedTrameId) {
      setSelectedTrameId(trameModeles[0].id);
      
      // Si la trameModele a un siteId, on le sélectionne pour charger les salles/secteurs
      if (trameModeles[0].siteId) {
        setSelectedSiteId(trameModeles[0].siteId);
      }
    }
  }, [trameModeles, selectedTrameId]);
  
  // Fonction pour recharger les données
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchTrames();
      toastManager.success('Données actualisées');
    } catch (error) {
      toastManager.error('Erreur lors de l\'actualisation');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Charger les sites avec React Query
  const { data: sitesData = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const response = await axios.get(buildApiUrl('/api/sites'));
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
  
  useEffect(() => {
    setSites(sitesData);
  }, [sitesData]);

  // Charger les secteurs avec React Query
  const { data: sectorsData = [] } = useQuery({
    queryKey: ['operating-sectors', selectedSiteId],
    queryFn: async () => {
      const url = selectedSiteId 
        ? `/api/operating-sectors?siteId=${selectedSiteId}`
        : '/api/operating-sectors';
      const response = await axios.get(buildApiUrl(url));
      return response.data;
    },
    enabled: selectedTrameId !== null,
    staleTime: 5 * 60 * 1000,
  });
  
  // Charger les salles avec React Query
  const { data: roomsData = [] } = useQuery({
    queryKey: ['operating-rooms', selectedSiteId],
    queryFn: async () => {
      const url = selectedSiteId 
        ? `/api/operating-rooms?siteId=${selectedSiteId}`
        : '/api/operating-rooms';
      const response = await axios.get(buildApiUrl(url));
      return response.data;
    },
    enabled: selectedTrameId !== null,
    staleTime: 5 * 60 * 1000,
  });
  
  useEffect(() => {
    setSectors(sectorsData);
    setRooms(roomsData);
    if (sectorsData.length > 0 || roomsData.length > 0) {
      logger.info(`📍 Données chargées: ${sectorsData.length} secteurs, ${roomsData.length} salles`);
    }
  }, [sectorsData, roomsData]);

  // Vérifier l'authentification
  useEffect(() => {
    if (!user && !isLoading) {
      toastManager.error('Vous devez être connecté pour accéder à cette fonctionnalité.');
    }
  }, [user, isLoading]);

  // Quand selectedTrameId change, mettre à jour selectedSiteId
  useEffect(() => {
    if (selectedTrameId) {
      const trameModele = trameModeles.find(t => t.id === selectedTrameId);
      if (trameModele) {
        logger.info(
          `📍 Sélection de la trameModele "${trameModele.name}" avec siteId: ${trameModele.siteId}`
        );

        if (trameModele.siteId) {
          // TrameModele liée à un site spécifique : forcer ce site
          setSelectedSiteId(trameModele.siteId);
        } else {
          // TrameModele globale : garder le site actuellement sélectionné ou mettre null (tous les sites)
          if (selectedSiteId === undefined) {
            setSelectedSiteId(null); // Par défaut : tous les sites
          }
          // Sinon on garde selectedSiteId tel qu'il est
        }
      }
    }
  }, [selectedTrameId, trameModeles]);

  // SUPPRIMÉ : Actualisation automatique au focus de l'onglet
  // Désormais, utilisez uniquement le bouton "Actualiser" pour rafraîchir les données
  // Cela évite les rechargements intempestifs qui bloquaient le workflow


  const handleTrameChange = async (updatedTrame: TrameModele) => {
    try {
      // Si la trame mise à jour contient des affectations, on met à jour le state local directement
      // Les affectations sont gérées via leur propre API dans TrameGridView
      if (updatedTrame.affectations) {
        logger.info('[TrameGridEditor] Mise à jour locale de la trame avec affectations:', {
          trameId: updatedTrame.id,
          trameName: updatedTrame.name,
          affectationsCount: updatedTrame.affectations.length,
          affectations: updatedTrame.affectations.map(a => ({
            id: a.id,
            roomId: a.roomId,
            period: a.period,
          })),
        });

        // Les affectations sont gérées par TrameGridView directement
        // React Query se chargera de mettre à jour automatiquement le cache
      } else {
        // Si pas d'affectations, c'est une mise à jour des propriétés de base
        // Convertir au format API
        const apiTrame = mapTrameToApi(updatedTrame);

        // Utiliser la mutation React Query
        await updateTrameMutation.mutateAsync({
          id: updatedTrame.id,
          data: apiTrame
        });
      }
    } catch (err: unknown) {
      logger.error('Erreur lors de la mise à jour de la trameModele:', { error: err });
      // Les erreurs sont gérées par React Query et toastManager
    }
  };

  const handleCreateTrameSuccess = async (newTrameId: string) => {
    // React Query rechargera automatiquement les données
    await refetchTrames();
    // Sélectionner la nouvelle trameModele
    setSelectedTrameId(newTrameId);
    setIsModalOpen(false);
  };

  // handleRefresh est déjà défini plus haut avec React Query

  const handleEditTrame = (trameModele: TrameModele) => {
    setTrameToEdit(trameModele);
    setIsEditModalOpen(true);
  };

  const handleEditTrameSuccess = async (updatedTrameId: string) => {
    // React Query rechargera automatiquement les données
    await refetchTrames();
    // Garder la trameModele sélectionnée actuelle
    setSelectedTrameId(updatedTrameId);
    setIsEditModalOpen(false);
    setTrameToEdit(null);
  };

  const selectedTrame = trameModeles.find(trameModele => trameModele.id === selectedTrameId);

  // Rendu du composant
  return (
    <div className="space-y-4">
      {/* Gestion des erreurs */}
      {loadingError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            {loadingError?.message || 'Une erreur est survenue lors du chargement des données.'}
          </AlertDescription>
          <div className="mt-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Réessayer
            </Button>
          </div>
        </Alert>
      )}

      {/* Sélection de trameModele et actions */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Sélectionner une trameModele:</span>
            <div className="flex items-center space-x-2">
              <Select
                value={selectedTrameId || ''}
                onValueChange={value => setSelectedTrameId(value)}
                disabled={isLoading || trameModeles.length === 0}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Sélectionner une trameModele" />
                </SelectTrigger>
                <SelectContent>
                  {trameModeles.map(trameModele => {
                    const site = sites.find(s => s.id === trameModele.siteId);
                    return (
                      <SelectItem key={trameModele.id} value={trameModele.id}>
                        <div className="flex items-center gap-2">
                          <span>{trameModele.name}</span>
                          {trameModele.siteId ? (
                            <Badge variant="secondary" className="text-xs">
                              {site ? site.name : `Site ${trameModele.siteId}`}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Global
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {isRefreshing && (
                <div className="flex items-center space-x-1 text-xs text-blue-600">
                  <RefreshCcw className="h-3 w-3 animate-spin" />
                  <span>Actualisation...</span>
                </div>
              )}
            </div>
          </div>

          {/* Indicateur permanent du site de la trameModele sélectionnée */}
          {selectedTrame && (
            <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-950 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                Site actuel:
              </span>
              {selectedTrame.siteId ? (
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-200">
                  {sites.find(s => s.id === selectedTrame.siteId)?.name ||
                    `Site ${selectedTrame.siteId}`}
                </span>
              ) : (
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-200">
                  TrameModele globale
                </span>
              )}
            </div>
          )}

          {/* Sélecteur de site - affiché seulement pour les trameModeles globales */}
          {selectedTrame && !selectedTrame.siteId && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Vue site:</span>
              <Select
                value={selectedSiteId || 'all'}
                onValueChange={value => setSelectedSiteId(value === 'all' ? null : value)}
                disabled={isLoading || sites.length === 0}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Choisir un site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <span>Tous les sites</span>
                      <Badge variant="secondary" className="text-xs">
                        Global
                      </Badge>
                    </div>
                  </SelectItem>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Actualiser
          </Button>

          {/* Bouton d'urgence pour fermer tous les toasts */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              try {
                // Utiliser le ToastManager pour fermer tous les toasts
                toastManager.dismissAll();
                // Fermer aussi les toasts react-toastify directs (legacy)
                toast.dismiss();
                // Nettoyer le DOM des toasts orphelins
                const toastElements = document.querySelectorAll('[class*="Toastify"]');
                toastElements.forEach(el => el.remove());
                logger.info('Tous les toasts ont été fermés via ToastManager');
              } catch (error: unknown) {
                logger.error('Erreur lors de la fermeture des toasts:', { error: error });
              }
            }}
            className="text-red-600 hover:text-red-800 hover:bg-red-50 border-red-300"
            title={`Fermer tous les toasts (${toastManager.getActiveCount()} actifs, ${toastManager.getQueuedCount()} en attente)`}
          >
            🚫 Fermer toasts ({toastManager.getActiveCount()})
          </Button>

          {/* Bouton de modification de la trameModele sélectionnée */}
          {selectedTrame && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditTrame(selectedTrame)}
              disabled={isLoading}
              className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <Settings className="h-4 w-4 mr-2" /> Modifier la trameModele
            </Button>
          )}
        </div>

        <Button onClick={() => setIsModalOpen(true)} disabled={isLoading}>
          <PlusIcon className="h-4 w-4 mr-2" /> Nouvelle trameModele
        </Button>
      </div>

      {/* État de chargement */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          {/* Affichage des trameModeles */}
          {selectedTrame ? (
            <TrameGridView
              key={`${selectedTrame.id}-${rooms.length}-${sectors.length}`}
              trameModele={selectedTrame}
              onTrameChange={handleTrameChange}
              rooms={rooms}
              users={users}
              sectors={sectors}
              sites={sites}
              selectedSiteId={selectedSiteId}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                {trameModeles.length === 0 ? (
                  <>
                    <p className="text-center text-muted-foreground mb-4">
                      Aucune trameModele disponible. Créez votre première trameModele pour
                      commencer.
                    </p>
                    <Button onClick={() => setIsModalOpen(true)}>
                      <PlusIcon className="h-4 w-4 mr-2" /> Créer une trameModele
                    </Button>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground">
                    Sélectionnez une trameModele dans la liste déroulante ci-dessus.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Modal de création de trameModele */}
      {isModalOpen && (
        <NewTrameModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleCreateTrameSuccess}
          sites={sites}
          rooms={rooms}
          sectors={sectors}
        />
      )}

      {/* Modal de modification de trameModele */}
      {isEditModalOpen && trameToEdit && (
        <NewTrameModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setTrameToEdit(null);
          }}
          onSuccess={handleEditTrameSuccess}
          sites={sites}
          initialTrame={trameToEdit}
          isEditMode={true}
          rooms={rooms}
          sectors={sectors}
        />
      )}
    </div>
  );
};

export default TrameGridEditor;
