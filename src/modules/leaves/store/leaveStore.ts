import { create } from 'zustand';
import { logger } from "../../../lib/logger";
import { devtools, persist } from 'zustand/middleware';
import axios from 'axios';
import {
    Leave,
    LeaveWithUser,
    LeaveStatus,
    LeaveType,
    LeaveFilters,
    LeaveBalance,
    LeaveAllowanceCheckResult
} from '../types/leave';
import { ConflictCheckResult } from '../types/conflict';

interface LeaveState {
    // Données
    leaves: LeaveWithUser[];
    leaveBalance: LeaveBalance | null;
    selectedLeave: LeaveWithUser | null;

    // États UI
    isLoading: boolean;
    error: string | null;
    isSubmitting: boolean;

    // Filtres et tri
    filters: LeaveFilters;
    searchTerm: string;
    currentSort: { field: string; direction: 'asc' | 'desc' };

    // Actions
    fetchLeaves: (userId: string) => Promise<void>;
    fetchLeaveBalance: (userId: string, year: number) => Promise<void>;
    createLeave: (leaveData: Partial<Leave>) => Promise<Leave>;
    updateLeave: (id: string, leaveData: Partial<Leave>) => Promise<Leave>;
    cancelLeave: (id: string, comment?: string) => Promise<Leave>;
    approveLeave: (id: string, comment?: string) => Promise<Leave>;
    rejectLeave: (id: string, comment?: string) => Promise<Leave>;

    // Sélection
    setSelectedLeave: (leave: LeaveWithUser | null) => void;

    // Filtres et tri
    setSearchTerm: (term: string) => void;
    setFilter: (key: keyof LeaveFilters, value: unknown) => void;
    resetFilters: () => void;
    setSort: (field: string, direction?: 'asc' | 'desc') => void;

    // Vérifications
    checkConflicts: (startDate: Date, endDate: Date, userId: string, leaveId?: string) => Promise<ConflictCheckResult>;
    checkAllowance: (userId: string, type: LeaveType, days: number) => Promise<LeaveAllowanceCheckResult>;
}

export const useLeaveStore = create<LeaveState>()(
    devtools(
        persist(
            (set, get) => ({
                // État initial
                leaves: [],
                leaveBalance: null,
                selectedLeave: null,
                isLoading: false,
                error: null,
                isSubmitting: false,
                filters: {
                    status: [LeaveStatus.PENDING, LeaveStatus.APPROVED],
                },
                searchTerm: '',
                currentSort: { field: 'startDate', direction: 'desc' },

                // Actions pour charger les données
                fetchLeaves: async (userId: string) => {
                    set({ isLoading: true, error: null });
                    try {
                        const response = await axios.get<LeaveWithUser[]>(`/api/conges?userId=${userId}`);
                        set({ leaves: response.data, isLoading: false });
                    } catch (error: unknown) {
                        logger.error('Erreur lors du chargement des congés:', { error: error });
                        set({
                            error: error.response?.data?.error || 'Impossible de charger les demandes de congés.',
                            isLoading: false
                        });
                    }
                },

                fetchLeaveBalance: async (userId: string, year: number) => {
                    set({ isLoading: true, error: null });
                    try {
                        const response = await axios.get<LeaveBalance>(`/api/conges/balance?userId=${userId}&year=${year}`);
                        set({ leaveBalance: response.data, isLoading: false });
                    } catch (error: unknown) {
                        logger.error('Erreur lors du chargement du solde de congés:', { error: error });
                        set({
                            error: error.response?.data?.error || 'Impossible de charger le solde de congés.',
                            isLoading: false
                        });
                    }
                },

                // Actions de mutation
                createLeave: async (leaveData: Partial<Leave>) => {
                    set({ isSubmitting: true, error: null });
                    try {
                        const response = await axios.post<Leave>('/api/conges', leaveData);
                        const newLeave = response.data;
                        set(state => ({
                            leaves: [...state.leaves, newLeave as LeaveWithUser],
                            isSubmitting: false
                        }));
                        return newLeave;
                    } catch (error: unknown) {
                        logger.error('Erreur lors de la création du congé:', { error: error });
                        set({
                            error: error.response?.data?.error || 'Impossible de créer la demande de congé.',
                            isSubmitting: false
                        });
                        throw error;
                    }
                },

                updateLeave: async (id: string, leaveData: Partial<Leave>) => {
                    set({ isSubmitting: true, error: null });
                    try {
                        const response = await axios.put<Leave>(`/api/conges/${id}`, leaveData);
                        const updatedLeave = response.data;
                        set(state => ({
                            leaves: state.leaves.map(leave =>
                                leave.id === id ? { ...leave, ...updatedLeave } : leave
                            ),
                            isSubmitting: false
                        }));
                        return updatedLeave;
                    } catch (error: unknown) {
                        logger.error('Erreur lors de la mise à jour du congé:', { error: error });
                        set({
                            error: error.response?.data?.error || 'Impossible de mettre à jour la demande de congé.',
                            isSubmitting: false
                        });
                        throw error;
                    }
                },

                cancelLeave: async (id: string, comment?: string) => {
                    set({ isSubmitting: true, error: null });
                    try {
                        const response = await axios.post<Leave>(`/api/conges/${id}/cancel`, { comment });
                        const cancelledLeave = response.data;
                        set(state => ({
                            leaves: state.leaves.map(leave =>
                                leave.id === id ? { ...leave, ...cancelledLeave } : leave
                            ),
                            isSubmitting: false
                        }));
                        return cancelledLeave;
                    } catch (error: unknown) {
                        logger.error('Erreur lors de l\'annulation du congé:', { error: error });
                        set({
                            error: error.response?.data?.error || 'Impossible d\'annuler la demande de congé.',
                            isSubmitting: false
                        });
                        throw error;
                    }
                },

                approveLeave: async (id: string, comment?: string) => {
                    set({ isSubmitting: true, error: null });
                    try {
                        const response = await axios.post<Leave>(`/api/conges/${id}/approve`, { comment });
                        const approvedLeave = response.data;
                        set(state => ({
                            leaves: state.leaves.map(leave =>
                                leave.id === id ? { ...leave, ...approvedLeave } : leave
                            ),
                            isSubmitting: false
                        }));
                        return approvedLeave;
                    } catch (error: unknown) {
                        logger.error('Erreur lors de l\'approbation du congé:', { error: error });
                        set({
                            error: error.response?.data?.error || 'Impossible d\'approuver la demande de congé.',
                            isSubmitting: false
                        });
                        throw error;
                    }
                },

                rejectLeave: async (id: string, comment?: string) => {
                    set({ isSubmitting: true, error: null });
                    try {
                        const response = await axios.post<Leave>(`/api/conges/${id}/reject`, { comment });
                        const rejectedLeave = response.data;
                        set(state => ({
                            leaves: state.leaves.map(leave =>
                                leave.id === id ? { ...leave, ...rejectedLeave } : leave
                            ),
                            isSubmitting: false
                        }));
                        return rejectedLeave;
                    } catch (error: unknown) {
                        logger.error('Erreur lors du rejet du congé:', { error: error });
                        set({
                            error: error.response?.data?.error || 'Impossible de rejeter la demande de congé.',
                            isSubmitting: false
                        });
                        throw error;
                    }
                },

                // Sélection
                setSelectedLeave: (leave: LeaveWithUser | null) => set({ selectedLeave: leave }),

                // Filtres et tri
                setSearchTerm: (term: string) => set({ searchTerm: term }),

                setFilter: (key: keyof LeaveFilters, value: unknown) => set(state => ({
                    filters: { ...state.filters, [key]: value }
                })),

                resetFilters: () => set({
                    filters: { status: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
                    searchTerm: '',
                    currentSort: { field: 'startDate', direction: 'desc' }
                }),

                setSort: (field: string, direction?: 'asc' | 'desc') => set(state => {
                    const newDirection = direction ||
                        (state.currentSort.field === field && state.currentSort.direction === 'asc')
                        ? 'desc'
                        : 'asc';

                    return {
                        currentSort: { field, direction: newDirection }
                    };
                }),

                // Vérifications
                checkConflicts: async (startDate: Date, endDate: Date, userId: string, leaveId?: string) => {
                    set({ isLoading: true, error: null });
                    try {
                        const response = await axios.post<ConflictCheckResult>('/api/conges/check-conflicts', {
                            startDate,
                            endDate,
                            userId,
                            leaveId
                        });
                        set({ isLoading: false });
                        return response.data;
                    } catch (error: unknown) {
                        logger.error('Erreur lors de la vérification des conflits:', { error: error });
                        set({
                            error: error.response?.data?.error || 'Impossible de vérifier les conflits.',
                            isLoading: false
                        });
                        throw error;
                    }
                },

                checkAllowance: async (userId: string, type: LeaveType, days: number) => {
                    set({ isLoading: true, error: null });
                    try {
                        const response = await axios.post<LeaveAllowanceCheckResult>('/api/conges/check-allowance', {
                            userId,
                            type,
                            days
                        });
                        set({ isLoading: false });
                        return response.data;
                    } catch (error: unknown) {
                        logger.error('Erreur lors de la vérification des droits:', { error: error });
                        set({
                            error: error.response?.data?.error || 'Impossible de vérifier les droits à congés.',
                            isLoading: false
                        });
                        throw error;
                    }
                }
            }),
            {
                name: 'leave-storage',
                partialize: (state) => ({
                    filters: state.filters,
                    currentSort: state.currentSort
                }),
            }
        )
    )
); 