import { useState, useEffect, useCallback } from 'react';
import { logger } from "../../../lib/logger";
import { Leave, LeaveFilters, LeaveType, LeaveStatus } from '../types/leave';

interface UseLeaveDataReturn {
    leaves: Leave[];
    loading: boolean;
    error: Error | null;
    fetchLeaves: (filters?: LeaveFilters) => Promise<Leave[]>;
    refreshLeaves: () => Promise<void>;
    leaveCount: number;
}

/**
 * Hook pour récupérer et gérer les données de congés
 * @returns État et fonctions pour gérer les congés
 */
export function useLeaveData(): UseLeaveDataReturn {
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [currentFilters, setCurrentFilters] = useState<LeaveFilters | undefined>();

    /**
     * Récupère les congés selon les filtres fournis
     * @param filters Filtres à appliquer
     * @returns Liste des congés
     */
    const fetchLeaves = useCallback(async (filters?: LeaveFilters): Promise<Leave[]> => {
        setLoading(true);
        setError(null);
        setCurrentFilters(filters);

        try {
            // Simuler un appel API (remplacer par un vrai appel API en production)
            await new Promise(resolve => setTimeout(resolve, 500));

            // Données simulées
            const mockLeaves: Leave[] = [
                {
                    id: '1',
                    userId: 'user1',
                    requestDate: new Date('2023-01-10'),
                    type: LeaveType.ANNUAL,
                    status: LeaveStatus.APPROVED,
                    startDate: new Date('2023-02-01'),
                    endDate: new Date('2023-02-05'),
                    countedDays: 5,
                    comment: 'Vacances d\'hiver',
                    isRecurring: false,
                    createdAt: new Date('2023-01-10'),
                    updatedAt: new Date('2023-01-12'),
                    user: {
                        id: 'user1',
                        prenom: 'Jean',
                        nom: 'Dupont',
                        email: 'jean.dupont@example.com',
                        role: 'UTILISATEUR'
                    }
                },
                {
                    id: '2',
                    userId: 'user2',
                    requestDate: new Date('2023-03-15'),
                    type: LeaveType.SICK,
                    status: LeaveStatus.APPROVED,
                    startDate: new Date('2023-03-20'),
                    endDate: new Date('2023-03-25'),
                    countedDays: 6,
                    isRecurring: false,
                    createdAt: new Date('2023-03-15'),
                    updatedAt: new Date('2023-03-16'),
                    user: {
                        id: 'user2',
                        prenom: 'Marie',
                        nom: 'Martin',
                        email: 'marie.martin@example.com',
                        role: 'MÉDECIN'
                    }
                },
                {
                    id: '3',
                    userId: 'user1',
                    requestDate: new Date('2023-04-10'),
                    type: LeaveType.TRAINING,
                    status: LeaveStatus.PENDING,
                    startDate: new Date('2023-05-01'),
                    endDate: new Date('2023-05-03'),
                    countedDays: 3,
                    comment: 'Formation professionnelle',
                    isRecurring: false,
                    createdAt: new Date('2023-04-10'),
                    updatedAt: new Date('2023-04-10'),
                    user: {
                        id: 'user1',
                        prenom: 'Jean',
                        nom: 'Dupont',
                        email: 'jean.dupont@example.com',
                        role: 'UTILISATEUR'
                    }
                }
            ];

            // Appliquer les filtres si fournis
            let filteredLeaves = [...mockLeaves];

            if (filters) {
                if (filters.userId) {
                    filteredLeaves = filteredLeaves.filter(leave => leave.userId === filters.userId);
                }

                if (filters.departmentId) {
                    // Simuler un filtre par département (dans un vrai cas, cela serait fait côté serveur)
                    // Pour la simulation, on considère que user1 appartient au département 'dept1'
                    if (filters.departmentId === 'dept1') {
                        filteredLeaves = filteredLeaves.filter(leave => leave.userId === 'user1');
                    }
                }

                if (filters.startDate) {
                    const startDate = new Date(filters.startDate);
                    filteredLeaves = filteredLeaves.filter(leave => new Date(leave.startDate) >= startDate);
                }

                if (filters.endDate) {
                    const endDate = new Date(filters.endDate);
                    filteredLeaves = filteredLeaves.filter(leave => new Date(leave.endDate) <= endDate);
                }

                if (filters.types && filters.types.length > 0) {
                    filteredLeaves = filteredLeaves.filter(leave => filters.types?.includes(leave.type));
                }

                if (filters.statuses && filters.statuses.length > 0) {
                    filteredLeaves = filteredLeaves.filter(leave => filters.statuses?.includes(leave.status));
                }

                if (filters.searchTerm) {
                    const searchTerm = filters.searchTerm.toLowerCase();
                    filteredLeaves = filteredLeaves.filter(leave =>
                        leave.user?.nom.toLowerCase().includes(searchTerm) ||
                        leave.user?.prenom.toLowerCase().includes(searchTerm) ||
                        leave.comment?.toLowerCase().includes(searchTerm)
                    );
                }

                if (filters.isRecurring !== undefined) {
                    filteredLeaves = filteredLeaves.filter(leave => leave.isRecurring === filters.isRecurring);
                }
            }

            setLeaves(filteredLeaves);
            setLoading(false);
            return filteredLeaves;
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error('Erreur lors de la récupération des congés');
            setError(error);
            setLoading(false);
            logger.error('Erreur lors de la récupération des congés:', error instanceof Error ? error : new Error(String(error)));
            return [];
        }
    }, []);

    /**
     * Rafraîchit les congés avec les derniers filtres utilisés
     */
    const refreshLeaves = useCallback(async (): Promise<void> => {
        await fetchLeaves(currentFilters);
    }, [fetchLeaves, currentFilters]);

    // Charger les congés au montage du composant
    useEffect(() => {
        fetchLeaves();
    }, [fetchLeaves]);

    return {
        leaves,
        loading,
        error,
        fetchLeaves,
        refreshLeaves,
        leaveCount: leaves.length
    };
} 