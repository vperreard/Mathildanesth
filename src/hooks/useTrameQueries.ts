/**
 * Hooks React Query pour la gestion des trames avec cache intelligent
 * Optimise les performances en réduisant drastiquement les appels API
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import axios from 'axios';
import { TRAME_ENDPOINTS, buildApiUrl } from '@/config/api-endpoints';
import { toastManager } from '@/lib/toast-manager';

// Types
export interface TrameModele {
  id: string;
  name: string;
  weekType: 'ALL' | 'EVEN' | 'ODD';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  affectations?: TrameAffectation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TrameAffectation {
  id: string;
  trameModeleId: string;
  userId: string;
  operatingRoomId: string;
  dayOfWeek: number;
  shiftType: 'MORNING' | 'AFTERNOON' | 'FULL_DAY' | 'GUARD' | 'ON_CALL';
  weekType?: 'ALL' | 'EVEN' | 'ODD';
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  operatingRoom?: {
    id: string;
    name: string;
    sectorId: string;
    sector?: {
      id: string;
      name: string;
    };
  };
}

// Configuration du QueryClient avec cache intelligent
export const trameQueryConfig = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  refetchInterval: false,
  retry: 1,
};

// Clés de cache standardisées
export const TRAME_QUERY_KEYS = {
  all: ['trames'] as const,
  lists: () => [...TRAME_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...TRAME_QUERY_KEYS.lists(), filters] as const,
  details: () => [...TRAME_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TRAME_QUERY_KEYS.details(), id] as const,
  affectations: (trameId: string) => [...TRAME_QUERY_KEYS.detail(trameId), 'affectations'] as const,
};

/**
 * Hook pour récupérer la liste des modèles de trames
 */
export function useTrameModeles(filters?: Record<string, any>): UseQueryResult<TrameModele[]> {
  return useQuery({
    queryKey: TRAME_QUERY_KEYS.list(filters),
    queryFn: async () => {
      const response = await axios.get(buildApiUrl(TRAME_ENDPOINTS.TRAME_MODELES), {
        params: filters,
      });
      return response.data;
    },
    ...trameQueryConfig,
  });
}

/**
 * Hook pour récupérer un modèle de trame spécifique
 */
export function useTrameModele(id: string): UseQueryResult<TrameModele> {
  return useQuery({
    queryKey: TRAME_QUERY_KEYS.detail(id),
    queryFn: async () => {
      const response = await axios.get(buildApiUrl(TRAME_ENDPOINTS.TRAME_MODELE_BY_ID(id)));
      return response.data;
    },
    enabled: !!id,
    ...trameQueryConfig,
  });
}

/**
 * Hook pour récupérer les affectations d'une trame
 */
export function useTrameAffectations(trameId: string): UseQueryResult<TrameAffectation[]> {
  return useQuery({
    queryKey: TRAME_QUERY_KEYS.affectations(trameId),
    queryFn: async () => {
      const response = await axios.get(buildApiUrl(TRAME_ENDPOINTS.AFFECTATIONS(trameId)));
      return response.data;
    },
    enabled: !!trameId,
    ...trameQueryConfig,
  });
}

/**
 * Hook pour créer un nouveau modèle de trame
 */
export function useCreateTrameModele(): UseMutationResult<TrameModele, Error, Partial<TrameModele>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await axios.post(buildApiUrl(TRAME_ENDPOINTS.TRAME_MODELES), data);
      return response.data;
    },
    onSuccess: (newTrame) => {
      // Invalider la liste des trames
      queryClient.invalidateQueries({ queryKey: TRAME_QUERY_KEYS.lists() });
      toastManager.success('Modèle de trame créé avec succès');
    },
    onError: (error) => {
      toastManager.error('Erreur lors de la création du modèle de trame');
      console.error('Create trame error:', error);
    },
  });
}

/**
 * Hook pour mettre à jour un modèle de trame
 */
export function useUpdateTrameModele(): UseMutationResult<TrameModele, Error, { id: string; data: Partial<TrameModele> }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axios.put(buildApiUrl(TRAME_ENDPOINTS.TRAME_MODELE_BY_ID(id)), data);
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: TRAME_QUERY_KEYS.detail(id) });

      // Sauvegarder l'état précédent
      const previousTrame = queryClient.getQueryData(TRAME_QUERY_KEYS.detail(id));

      // Mise à jour optimiste
      queryClient.setQueryData(TRAME_QUERY_KEYS.detail(id), (old: TrameModele | undefined) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      return { previousTrame };
    },
    onError: (err, { id }, context) => {
      // Rollback en cas d'erreur
      if (context?.previousTrame) {
        queryClient.setQueryData(TRAME_QUERY_KEYS.detail(id), context.previousTrame);
      }
      toastManager.error('Erreur lors de la mise à jour du modèle de trame');
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: TRAME_QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: TRAME_QUERY_KEYS.lists() });
      toastManager.success('Modèle de trame mis à jour avec succès');
    },
  });
}

/**
 * Hook pour supprimer un modèle de trame
 */
export function useDeleteTrameModele(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await axios.delete(buildApiUrl(TRAME_ENDPOINTS.TRAME_MODELE_BY_ID(id)));
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: TRAME_QUERY_KEYS.lists() });
      queryClient.removeQueries({ queryKey: TRAME_QUERY_KEYS.detail(id) });
      toastManager.success('Modèle de trame supprimé avec succès');
    },
    onError: () => {
      toastManager.error('Erreur lors de la suppression du modèle de trame');
    },
  });
}

/**
 * Hook pour créer/modifier/supprimer des affectations en batch
 */
export function useBatchAffectations(trameId: string): UseMutationResult<TrameAffectation[], Error, {
  create?: Partial<TrameAffectation>[];
  update?: { id: string; data: Partial<TrameAffectation> }[];
  delete?: string[];
}> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ create = [], update = [], delete: deleteIds = [] }) => {
      const response = await axios.post(
        buildApiUrl(TRAME_ENDPOINTS.AFFECTATIONS_BATCH(trameId)),
        { create, update, delete: deleteIds }
      );
      return response.data;
    },
    onMutate: async ({ create = [], update = [], delete: deleteIds = [] }) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: TRAME_QUERY_KEYS.affectations(trameId) });

      // Sauvegarder l'état précédent
      const previousAffectations = queryClient.getQueryData(TRAME_QUERY_KEYS.affectations(trameId));

      // Mise à jour optimiste
      queryClient.setQueryData(TRAME_QUERY_KEYS.affectations(trameId), (old: TrameAffectation[] | undefined) => {
        if (!old) return old;

        let updated = [...old];

        // Supprimer les affectations
        updated = updated.filter(a => !deleteIds.includes(a.id));

        // Mettre à jour les affectations existantes
        update.forEach(({ id, data }) => {
          const index = updated.findIndex(a => a.id === id);
          if (index !== -1) {
            updated[index] = { ...updated[index], ...data };
          }
        });

        // Ajouter les nouvelles affectations avec des IDs temporaires
        create.forEach((newAffectation, index) => {
          updated.push({
            ...newAffectation,
            id: `temp-${Date.now()}-${index}`,
            trameModeleId: trameId,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as TrameAffectation);
        });

        return updated;
      });

      return { previousAffectations };
    },
    onError: (err, variables, context) => {
      // Rollback en cas d'erreur
      if (context?.previousAffectations) {
        queryClient.setQueryData(TRAME_QUERY_KEYS.affectations(trameId), context.previousAffectations);
      }
      toastManager.error('Erreur lors de la modification des affectations');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAME_QUERY_KEYS.affectations(trameId) });
      queryClient.invalidateQueries({ queryKey: TRAME_QUERY_KEYS.detail(trameId) });
      toastManager.success('Affectations mises à jour avec succès');
    },
  });
}

/**
 * Hook pour précharger les données de trames
 */
export function usePrefetchTrames() {
  const queryClient = useQueryClient();

  const prefetchTrameModeles = async () => {
    await queryClient.prefetchQuery({
      queryKey: TRAME_QUERY_KEYS.lists(),
      queryFn: async () => {
        const response = await axios.get(buildApiUrl(TRAME_ENDPOINTS.TRAME_MODELES));
        return response.data;
      },
      ...trameQueryConfig,
    });
  };

  const prefetchTrameDetail = async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: TRAME_QUERY_KEYS.detail(id),
      queryFn: async () => {
        const response = await axios.get(buildApiUrl(TRAME_ENDPOINTS.TRAME_MODELE_BY_ID(id)));
        return response.data;
      },
      ...trameQueryConfig,
    });
  };

  return {
    prefetchTrameModeles,
    prefetchTrameDetail,
  };
}