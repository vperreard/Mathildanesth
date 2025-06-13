import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { TRAME_ENDPOINTS, buildApiUrl, getApiHeaders } from '@/config/api-endpoints';
import { TrameAffectation } from '@/types/trame-affectations';

// Query key factory
export const affectationKeys = {
  all: ['affectations'] as const,
  byTrame: (trameId: string) => [...affectationKeys.all, 'trame', trameId] as const,
  byId: (trameId: string, id: string) => [...affectationKeys.byTrame(trameId), id] as const,
};

// Fetch affectations for a trame
export function useTrameAffectations(trameId: string, enabled = true) {
  return useQuery({
    queryKey: affectationKeys.byTrame(trameId),
    queryFn: async () => {
      const response = await fetch(buildApiUrl(TRAME_ENDPOINTS.AFFECTATIONS(trameId)), {
        headers: getApiHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des affectations');
      }

      return response.json() as Promise<TrameAffectation[]>;
    },
    enabled: enabled && !!trameId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Create affectation
export function useCreateAffectation(trameId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<TrameAffectation, 'id'>) => {
      const response = await fetch(buildApiUrl(TRAME_ENDPOINTS.AFFECTATIONS(trameId)), {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création de l'affectation");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: affectationKeys.byTrame(trameId) });
      toast.success('Affectation créée avec succès');
    },
    onError: () => {
      toast.error("Erreur lors de la création de l'affectation");
    },
  });
}

// Update affectation
export function useUpdateAffectation(trameId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: TrameAffectation) => {
      const response = await fetch(buildApiUrl(`${TRAME_ENDPOINTS.AFFECTATIONS(trameId)}/${id}`), {
        method: 'PUT',
        headers: getApiHeaders(),
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de l'affectation");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: affectationKeys.byTrame(trameId) });
      toast.success('Affectation mise à jour avec succès');
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour de l'affectation");
    },
  });
}

// Delete affectation
export function useDeleteAffectation(trameId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(buildApiUrl(`${TRAME_ENDPOINTS.AFFECTATIONS(trameId)}/${id}`), {
        method: 'DELETE',
        headers: getApiHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de l'affectation");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: affectationKeys.byTrame(trameId) });
      toast.success('Affectation supprimée avec succès');
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de l'affectation");
    },
  });
}
