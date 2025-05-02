import {
    useQuery,
    useMutation,
    useQueryClient,
    QueryKey,
    UseQueryOptions
} from '@tanstack/react-query';
import {
    Leave,
    LeaveFilters,
    PaginatedLeaveResults,
    LeaveStatus,
    LeaveType,
    LeaveBalance
} from '../types/leave';
import * as leaveService from '../services/leaveService';
import { ConflictCheckResult } from '../types/conflict';
import { LeaveAllowanceCheckResult } from '../types/leave';
import { logger } from '@/lib/logger';

// Clés de query pour React Query
export const leaveKeys = {
    all: ['leaves'] as const,
    lists: () => [...leaveKeys.all, 'list'] as const,
    list: (filters: LeaveFilters = {}) => [...leaveKeys.lists(), filters] as const,
    details: () => [...leaveKeys.all, 'detail'] as const,
    detail: (id: string) => [...leaveKeys.details(), id] as const,
    userLeaves: (userId: string, year?: number) => [...leaveKeys.all, 'user', userId, year] as const,
    balance: (userId: string) => [...leaveKeys.all, 'balance', userId] as const,
    conflicts: (startDate: string, endDate: string, userId: string, excludeId?: string) =>
        [...leaveKeys.all, 'conflicts', startDate, endDate, userId, excludeId] as const,
    statistics: (filters: Record<string, any> = {}) => [...leaveKeys.all, 'stats', filters] as const
};

// Durées de cache optimisées pour différents types de données
const STALE_TIMES = {
    LIST: 1000 * 60 * 5,        // 5 minutes
    DETAIL: 1000 * 60 * 15,     // 15 minutes
    USER_LEAVES: 1000 * 60 * 3, // 3 minutes
    BALANCE: 1000 * 60 * 5,     // 5 minutes
    CONFLICTS: 1000 * 30,       // 30 secondes
    STATISTICS: 1000 * 60 * 10  // 10 minutes
};

// Temps de cache en mémoire (pour les mutations rapides)
const CACHE_TIMES = {
    LIST: 1000 * 60 * 30,        // 30 minutes
    DETAIL: 1000 * 60 * 60,      // 1 heure
    USER_LEAVES: 1000 * 60 * 15, // 15 minutes
    BALANCE: 1000 * 60 * 15,     // 15 minutes
    CONFLICTS: 1000 * 60 * 5,    // 5 minutes
    STATISTICS: 1000 * 60 * 30   // 30 minutes
};

/**
 * Hook pour récupérer une liste de congés avec filtrage
 * @param filters Paramètres de filtrage pour la liste des congés
 * @param options Options supplémentaires pour la requête React Query
 */
export const useLeavesList = (
    filters: LeaveFilters = {},
    options?: UseQueryOptions<PaginatedLeaveResults, Error, PaginatedLeaveResults, QueryKey>
) => {
    return useQuery({
        queryKey: leaveKeys.list(filters),
        queryFn: () => leaveService.fetchLeaves(filters),
        staleTime: STALE_TIMES.LIST,
        gcTime: CACHE_TIMES.LIST,
        retry: 2,
        keepPreviousData: true,
        ...options
    });
};

/**
 * Hook pour récupérer les détails d'un congé
 * @param leaveId ID du congé à récupérer
 * @param options Options supplémentaires pour la requête React Query
 */
export const useLeaveDetails = (
    leaveId: string,
    options?: UseQueryOptions<Leave, Error, Leave, QueryKey>
) => {
    return useQuery({
        queryKey: leaveKeys.detail(leaveId),
        queryFn: () => leaveService.fetchLeaveById(leaveId),
        staleTime: STALE_TIMES.DETAIL,
        gcTime: CACHE_TIMES.DETAIL,
        enabled: !!leaveId,
        ...options
    });
};

/**
 * Hook pour récupérer les congés d'un utilisateur
 * @param userId ID de l'utilisateur dont on récupère les congés
 * @param year Année optionnelle pour filtrer les congés
 * @param options Options supplémentaires pour la requête React Query
 */
export const useUserLeaves = (
    userId: string,
    year?: number,
    options?: UseQueryOptions<Leave[], Error, Leave[], QueryKey>
) => {
    return useQuery({
        queryKey: leaveKeys.userLeaves(userId, year),
        queryFn: () => leaveService.fetchUserLeaves(userId, year),
        staleTime: STALE_TIMES.USER_LEAVES,
        gcTime: CACHE_TIMES.USER_LEAVES,
        enabled: !!userId,
        ...options
    });
};

/**
 * Hook pour récupérer le solde de congés d'un utilisateur
 * @param userId ID de l'utilisateur dont on récupère le solde
 * @param options Options supplémentaires pour la requête React Query
 */
export const useLeaveBalance = (
    userId: string,
    options?: UseQueryOptions<LeaveBalance, Error, LeaveBalance, QueryKey>
) => {
    return useQuery({
        queryKey: leaveKeys.balance(userId),
        queryFn: () => leaveService.fetchLeaveBalance(userId),
        staleTime: STALE_TIMES.BALANCE,
        gcTime: CACHE_TIMES.BALANCE,
        enabled: !!userId,
        ...options
    });
};

/**
 * Hook pour vérifier les conflits de congés
 * @param startDate Date de début
 * @param endDate Date de fin
 * @param userId ID de l'utilisateur
 * @param excludeLeaveId ID du congé à exclure (en cas de modification)
 * @param options Options supplémentaires pour la requête React Query
 */
export const useLeaveConflicts = (
    startDate: Date | string | undefined,
    endDate: Date | string | undefined,
    userId: string,
    excludeLeaveId?: string,
    options?: UseQueryOptions<ConflictCheckResult, Error, ConflictCheckResult, QueryKey>
) => {
    const startDateStr = startDate ? new Date(startDate).toISOString().split('T')[0] : '';
    const endDateStr = endDate ? new Date(endDate).toISOString().split('T')[0] : '';

    return useQuery({
        queryKey: leaveKeys.conflicts(startDateStr, endDateStr, userId, excludeLeaveId),
        queryFn: () => {
            if (!startDate || !endDate) {
                return Promise.resolve({ conflicts: [], hasBlockingConflicts: false });
            }

            return leaveService.checkLeaveConflicts(
                new Date(startDate),
                new Date(endDate),
                userId,
                excludeLeaveId
            );
        },
        staleTime: STALE_TIMES.CONFLICTS,
        gcTime: CACHE_TIMES.CONFLICTS,
        enabled: !!startDate && !!endDate && !!userId,
        ...options
    });
};

/**
 * Hook pour vérifier les droits à congés
 */
export const useLeaveAllowance = (
    userId: string,
    leaveType: LeaveType | undefined,
    countedDays: number | undefined,
    options?: UseQueryOptions<LeaveAllowanceCheckResult, Error, LeaveAllowanceCheckResult, QueryKey>
) => {
    return useQuery({
        queryKey: [...leaveKeys.all, 'allowance', userId, leaveType, countedDays],
        queryFn: () => {
            if (!leaveType || countedDays === undefined) {
                return Promise.resolve({ allowed: false, reason: 'Données manquantes' });
            }

            return leaveService.checkLeaveAllowance(userId, leaveType, countedDays);
        },
        staleTime: STALE_TIMES.BALANCE, // Utilise le même staleTime que le solde
        gcTime: CACHE_TIMES.BALANCE,
        enabled: !!userId && !!leaveType && countedDays !== undefined && countedDays > 0,
        ...options
    });
};

/**
 * Hook de mutation pour créer ou mettre à jour un congé
 */
export const useSaveLeave = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (leave: Partial<Leave>) => leaveService.saveLeave(leave),
        onSuccess: (updatedLeave) => {
            // Invalider et mettre à jour le cache
            queryClient.invalidateQueries(leaveKeys.lists());
            queryClient.invalidateQueries(leaveKeys.userLeaves(updatedLeave.userId, new Date(updatedLeave.startDate).getFullYear()));
            queryClient.invalidateQueries(leaveKeys.balance(updatedLeave.userId));

            // Mettre à jour la donnée dans le cache pour le détail
            queryClient.setQueryData(leaveKeys.detail(updatedLeave.id), updatedLeave);

            logger.info(`Congé ${updatedLeave.id} mis à jour avec succès`);
        }
    });
};

/**
 * Hook de mutation pour soumettre un congé
 */
export const useSubmitLeave = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (leave: Partial<Leave>) => leaveService.submitLeaveRequest(leave),
        onSuccess: (submittedLeave) => {
            // Invalider les données concernées
            queryClient.invalidateQueries(leaveKeys.lists());
            queryClient.invalidateQueries(leaveKeys.userLeaves(submittedLeave.userId, new Date(submittedLeave.startDate).getFullYear()));
            queryClient.invalidateQueries(leaveKeys.balance(submittedLeave.userId));

            // Mettre à jour la donnée dans le cache
            queryClient.setQueryData(leaveKeys.detail(submittedLeave.id), submittedLeave);

            logger.info(`Congé ${submittedLeave.id} soumis avec succès`);
        }
    });
};

/**
 * Hook de mutation pour annuler un congé
 */
export const useCancelLeave = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ leaveId, comment }: { leaveId: string; comment?: string }) =>
            leaveService.cancelLeave(leaveId, comment),
        onSuccess: (cancelledLeave) => {
            // Invalider les queries concernées
            queryClient.invalidateQueries(leaveKeys.lists());
            queryClient.invalidateQueries(leaveKeys.userLeaves(cancelledLeave.userId, new Date(cancelledLeave.startDate).getFullYear()));

            // Mettre à jour la donnée dans le cache
            queryClient.setQueryData(leaveKeys.detail(cancelledLeave.id), cancelledLeave);

            logger.info(`Congé ${cancelledLeave.id} annulé avec succès`);
        }
    });
};

/**
 * Hook de mutation pour approuver un congé
 */
export const useApproveLeave = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ leaveId, comment }: { leaveId: string; comment?: string }) =>
            leaveService.approveLeave(leaveId, comment),
        onSuccess: (approvedLeave) => {
            // Invalider les queries concernées
            queryClient.invalidateQueries(leaveKeys.lists());
            queryClient.invalidateQueries(leaveKeys.userLeaves(approvedLeave.userId, new Date(approvedLeave.startDate).getFullYear()));

            // Mettre à jour la donnée dans le cache
            queryClient.setQueryData(leaveKeys.detail(approvedLeave.id), approvedLeave);

            logger.info(`Congé ${approvedLeave.id} approuvé avec succès`);
        }
    });
};

/**
 * Hook de mutation pour rejeter un congé
 */
export const useRejectLeave = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ leaveId, comment }: { leaveId: string; comment?: string }) =>
            leaveService.rejectLeave(leaveId, comment),
        onSuccess: (rejectedLeave) => {
            // Invalider les queries concernées
            queryClient.invalidateQueries(leaveKeys.lists());
            queryClient.invalidateQueries(leaveKeys.userLeaves(rejectedLeave.userId, new Date(rejectedLeave.startDate).getFullYear()));

            // Mettre à jour la donnée dans le cache
            queryClient.setQueryData(leaveKeys.detail(rejectedLeave.id), rejectedLeave);

            logger.info(`Congé ${rejectedLeave.id} rejeté avec succès`);
        }
    });
};

/**
 * Fonction pour précharger les données de congés fréquemment consultées
 * @param queryClient Client React Query
 */
export const prefetchFrequentLeaveData = async (queryClient: any, userId?: string) => {
    logger.info("Préchargement des données de congés fréquentes");

    // Précharger la liste des congés à venir
    const currentDate = new Date().toISOString().split('T')[0];
    const filters: LeaveFilters = {
        startDate: currentDate,
        status: LeaveStatus.APPROUVE
    };

    await queryClient.prefetchQuery({
        queryKey: leaveKeys.list(filters),
        queryFn: () => leaveService.fetchLeaves(filters),
        staleTime: STALE_TIMES.LIST
    });

    // Précharger les congés de l'utilisateur connecté
    if (userId) {
        await queryClient.prefetchQuery({
            queryKey: leaveKeys.userLeaves(userId, new Date().getFullYear()),
            queryFn: () => leaveService.fetchUserLeaves(userId, new Date().getFullYear()),
            staleTime: STALE_TIMES.USER_LEAVES
        });

        // Précharger le solde de congés de l'utilisateur
        await queryClient.prefetchQuery({
            queryKey: leaveKeys.balance(userId),
            queryFn: () => leaveService.fetchLeaveBalance(userId),
            staleTime: STALE_TIMES.BALANCE
        });
    }
}; 