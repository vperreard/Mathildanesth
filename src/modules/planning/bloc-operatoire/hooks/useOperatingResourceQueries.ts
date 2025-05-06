import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OperatingRoom, OperatingSector, OperatingSupervisionRule } from '../types';
import { operatingRoomService } from '../services/OperatingRoomService';
import { operatingSectorService } from '../services/OperatingSectorService';
import { supervisionRulesService } from '../services/SupervisionRulesService';

// Keys pour le cache React Query
const QUERY_KEYS = {
    OPERATING_ROOMS: 'operatingRooms',
    OPERATING_SECTORS: 'operatingSectors',
    SUPERVISION_RULES: 'supervisionRules',
};

// --- Clés de Query ---

export const operatingSectorKeys = {
    all: ['operatingSectors'] as const,
    lists: () => [...operatingSectorKeys.all, 'list'] as const,
    list: (params: Record<string, any> = {}) => [...operatingSectorKeys.lists(), params] as const,
    details: () => [...operatingSectorKeys.all, 'detail'] as const,
    detail: (id: string) => [...operatingSectorKeys.details(), id] as const,
};

export const operatingRoomKeys = {
    all: ['operatingRooms'] as const,
    lists: () => [...operatingRoomKeys.all, 'list'] as const,
    list: (params: Record<string, any> = {}) => [...operatingRoomKeys.lists(), params] as const,
    details: () => [...operatingRoomKeys.all, 'detail'] as const,
    detail: (id: string) => [...operatingRoomKeys.details(), id] as const,
};

// --- Hooks pour les Secteurs Opératoires ---

/**
 * Récupère la liste des secteurs opératoires.
 */
export const useOperatingSectorsQuery = () => {
    return useQuery({
        queryKey: [QUERY_KEYS.OPERATING_SECTORS],
        queryFn: () => operatingSectorService.getAll(),
    });
};

/**
 * Crée un nouveau secteur opératoire.
 */
export const useCreateSectorMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (sector: Omit<OperatingSector, 'id'>) => {
            return operatingSectorService.create(sector);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OPERATING_SECTORS] });
        },
    });
};

/**
 * Met à jour un secteur opératoire existant.
 */
export const useUpdateSectorMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<OperatingSector> }) => {
            return operatingSectorService.update(id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OPERATING_SECTORS] });
        },
    });
};

/**
 * Supprime un secteur opératoire.
 */
export const useDeleteSectorMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => {
            const result = operatingSectorService.delete(id);
            return Promise.resolve(result);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OPERATING_SECTORS] });
            // Invalider aussi les salles car elles peuvent référencer des secteurs
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OPERATING_ROOMS] });
        },
    });
};

// --- Hooks pour les Salles Opératoires ---

/**
 * Récupère la liste des salles opératoires.
 */
export const useOperatingRoomsQuery = () => {
    return useQuery({
        queryKey: [QUERY_KEYS.OPERATING_ROOMS],
        queryFn: () => operatingRoomService.getAll(),
    });
};

/**
 * Crée une nouvelle salle opératoire.
 */
export const useCreateRoomMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (room: Omit<OperatingRoom, 'id'>) => {
            return operatingRoomService.create(room);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OPERATING_ROOMS] });
        },
    });
};

/**
 * Met à jour une salle opératoire existante.
 */
export const useUpdateRoomMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<OperatingRoom> }) => {
            return operatingRoomService.update(id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OPERATING_ROOMS] });
        },
    });
};

/**
 * Supprime une salle opératoire.
 */
export const useDeleteRoomMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => {
            const result = operatingRoomService.delete(id);
            return Promise.resolve(result);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OPERATING_ROOMS] });
        },
    });
};

// --- Hooks pour les Règles de Supervision ---

/**
 * Récupère les règles de supervision.
 */
export const useSupervisionRulesQuery = (type?: 'BASIQUE' | 'SPECIFIQUE' | 'EXCEPTION') => {
    return useQuery({
        queryKey: [QUERY_KEYS.SUPERVISION_RULES, type],
        queryFn: () => type ? supervisionRulesService.getByType(type) : supervisionRulesService.getAll(),
    });
};

/**
 * Crée une nouvelle règle de supervision.
 */
export const useCreateSupervisionRuleMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (rule: Omit<OperatingSupervisionRule, 'id'>) => {
            return supervisionRulesService.create(rule);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUPERVISION_RULES] });
        },
    });
};

/**
 * Met à jour une règle de supervision existante.
 */
export const useUpdateSupervisionRuleMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<OperatingSupervisionRule> }) => {
            return supervisionRulesService.update(id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUPERVISION_RULES] });
        },
    });
};

/**
 * Supprime une règle de supervision.
 */
export const useDeleteSupervisionRuleMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => {
            const result = supervisionRulesService.delete(id);
            return Promise.resolve(result);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUPERVISION_RULES] });
        },
    });
}; 