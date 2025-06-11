/**
 * Hook optimisé pour la gestion des affectations de trames avec opérations batch
 * Utilise React Query et l'API batch pour réduire drastiquement les appels API
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TRAME_ENDPOINTS, buildApiUrl } from '@/config/api-endpoints';
import { toastManager } from '@/lib/toast-manager';
import { logger } from '@/lib/logger';
import axios from 'axios';
import { TRAME_QUERY_KEYS } from './useTrameQueries';

export interface BatchOperation {
  create?: Array<{
    userId?: string;
    operatingRoomId: string;
    dayOfWeek: number;
    shiftType: 'MORNING' | 'AFTERNOON' | 'FULL_DAY' | 'GUARD' | 'ON_CALL';
    weekType?: 'ALL' | 'EVEN' | 'ODD';
    activityTypeId?: string;
  }>;
  update?: Array<{
    id: string;
    data: {
      userId?: string;
      operatingRoomId?: string;
      dayOfWeek?: number;
      shiftType?: 'MORNING' | 'AFTERNOON' | 'FULL_DAY' | 'GUARD' | 'ON_CALL';
      weekType?: 'ALL' | 'EVEN' | 'ODD';
      activityTypeId?: string | null;
    };
  }>;
  delete?: string[];
}

/**
 * Hook pour les opérations batch sur les affectations
 */
export function useTrameAffectationsBatch(trameId: string) {
  const queryClient = useQueryClient();

  const batchMutation = useMutation({
    mutationFn: async (operations: BatchOperation) => {
      logger.info('[Batch] Opérations affectations:', {
        trameId,
        create: operations.create?.length || 0,
        update: operations.update?.length || 0,
        delete: operations.delete?.length || 0,
      });

      const response = await axios.post(
        buildApiUrl(TRAME_ENDPOINTS.AFFECTATIONS(trameId)),
        operations
      );

      return response.data;
    },
    onMutate: async (operations) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ 
        queryKey: TRAME_QUERY_KEYS.affectations(trameId) 
      });

      // Sauvegarder l'état actuel pour rollback
      const previousAffectations = queryClient.getQueryData(
        TRAME_QUERY_KEYS.affectations(trameId)
      );

      // Optimistic update
      queryClient.setQueryData(
        TRAME_QUERY_KEYS.affectations(trameId),
        (old: any[] | undefined) => {
          if (!old) return old;

          let updated = [...old];

          // Suppressions
          if (operations.delete && operations.delete.length > 0) {
            updated = updated.filter(a => !operations.delete!.includes(a.id));
          }

          // Mises à jour
          if (operations.update && operations.update.length > 0) {
            operations.update.forEach(({ id, data }) => {
              const index = updated.findIndex(a => a.id === id);
              if (index !== -1) {
                updated[index] = { ...updated[index], ...data, updatedAt: new Date() };
              }
            });
          }

          // Créations (avec IDs temporaires)
          if (operations.create && operations.create.length > 0) {
            const newItems = operations.create.map((item, index) => ({
              ...item,
              id: `temp-${Date.now()}-${index}`,
              trameModeleId: trameId,
              createdAt: new Date(),
              updatedAt: new Date(),
            }));
            updated.push(...newItems);
          }

          return updated;
        }
      );

      return { previousAffectations };
    },
    onError: (err, variables, context) => {
      // Rollback en cas d'erreur
      if (context?.previousAffectations) {
        queryClient.setQueryData(
          TRAME_QUERY_KEYS.affectations(trameId),
          context.previousAffectations
        );
      }
      
      logger.error('[Batch] Erreur opérations:', err);
      toastManager.error('Erreur lors de la mise à jour des affectations');
    },
    onSuccess: (data) => {
      // Mettre à jour avec les vraies données du serveur
      queryClient.setQueryData(TRAME_QUERY_KEYS.affectations(trameId), data);
      
      // Invalider les caches liés
      queryClient.invalidateQueries({ 
        queryKey: TRAME_QUERY_KEYS.detail(trameId) 
      });
      
      toastManager.success('Affectations mises à jour');
    },
  });

  // Helper pour créer une seule affectation
  const createAffectation = (affectation: BatchOperation['create'][0]) => {
    return batchMutation.mutate({ create: [affectation] });
  };

  // Helper pour mettre à jour une seule affectation
  const updateAffectation = (id: string, data: BatchOperation['update'][0]['data']) => {
    return batchMutation.mutate({ update: [{ id, data }] });
  };

  // Helper pour supprimer une seule affectation
  const deleteAffectation = (id: string) => {
    return batchMutation.mutate({ delete: [id] });
  };

  // Helper pour créer plusieurs affectations d'un coup
  const createMultipleAffectations = (affectations: BatchOperation['create']) => {
    return batchMutation.mutate({ create: affectations });
  };

  // Helper pour appliquer une affectation à toute la ligne (même salle, tous les jours)
  const applyToRow = (
    roomId: string,
    userId: string,
    shiftType: 'MORNING' | 'AFTERNOON' | 'FULL_DAY',
    weekType: 'ALL' | 'EVEN' | 'ODD' = 'ALL',
    activityTypeId?: string
  ) => {
    const affectations = [0, 1, 2, 3, 4].map(dayOfWeek => ({
      userId,
      operatingRoomId: roomId,
      dayOfWeek,
      shiftType,
      weekType,
      activityTypeId,
    }));

    return batchMutation.mutate({ create: affectations });
  };

  // Helper pour appliquer une affectation à toute la colonne (même jour, toutes les salles)
  const applyToColumn = (
    dayOfWeek: number,
    userId: string,
    shiftType: 'MORNING' | 'AFTERNOON' | 'FULL_DAY',
    roomIds: string[],
    weekType: 'ALL' | 'EVEN' | 'ODD' = 'ALL',
    activityTypeId?: string
  ) => {
    const affectations = roomIds.map(roomId => ({
      userId,
      operatingRoomId: roomId,
      dayOfWeek,
      shiftType,
      weekType,
      activityTypeId,
    }));

    return batchMutation.mutate({ create: affectations });
  };

  // Helper pour dupliquer des affectations
  const duplicateAffectations = (
    affectationIds: string[],
    targetDay?: number,
    targetRoom?: string
  ) => {
    const currentAffectations = queryClient.getQueryData(
      TRAME_QUERY_KEYS.affectations(trameId)
    ) as any[];

    if (!currentAffectations) return;

    const toDuplicate = currentAffectations.filter(a => 
      affectationIds.includes(a.id)
    );

    const newAffectations = toDuplicate.map(aff => ({
      userId: aff.userId,
      operatingRoomId: targetRoom || aff.operatingRoomId,
      dayOfWeek: targetDay !== undefined ? targetDay : aff.dayOfWeek,
      shiftType: aff.shiftType,
      weekType: aff.weekType,
      activityTypeId: aff.activityTypeId,
    }));

    return batchMutation.mutate({ create: newAffectations });
  };

  // Helper pour échanger deux affectations
  const swapAffectations = (affectationId1: string, affectationId2: string) => {
    const currentAffectations = queryClient.getQueryData(
      TRAME_QUERY_KEYS.affectations(trameId)
    ) as any[];

    if (!currentAffectations) return;

    const aff1 = currentAffectations.find(a => a.id === affectationId1);
    const aff2 = currentAffectations.find(a => a.id === affectationId2);

    if (!aff1 || !aff2) return;

    return batchMutation.mutate({
      update: [
        {
          id: affectationId1,
          data: {
            userId: aff2.userId,
            activityTypeId: aff2.activityTypeId,
          }
        },
        {
          id: affectationId2,
          data: {
            userId: aff1.userId,
            activityTypeId: aff1.activityTypeId,
          }
        }
      ]
    });
  };

  return {
    batchMutation,
    createAffectation,
    updateAffectation,
    deleteAffectation,
    createMultipleAffectations,
    applyToRow,
    applyToColumn,
    duplicateAffectations,
    swapAffectations,
    isLoading: batchMutation.isPending,
    error: batchMutation.error,
  };
}