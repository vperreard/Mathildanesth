import { useState, useEffect, useCallback } from 'react';
import {
    Leave,
    LeaveStatus,
    LeaveType,
    LeaveAllowanceCheckResult,
    LeaveFilters
} from '../types/leave';
import {
    ConflictCheckResult
} from '../types/conflict';
import {
    fetchLeaves,
    fetchLeaveById,
    saveLeave,
    submitLeaveRequest,
    approveLeave,
    rejectLeave,
    cancelLeave,
    checkLeaveConflicts,
    checkLeaveAllowance,
    calculateLeaveDays
} from '../services/leaveService';
import {
    WorkSchedule
} from '../../profiles/types/workSchedule';

interface UseLeaveProps {
    userId?: string;
    initialLeave?: Partial<Leave>;
    userSchedule?: WorkSchedule;
}

interface UseLeaveReturn {
    leave: Partial<Leave> | null;
    leaves: Leave[];
    loading: boolean;
    error: Error | null;
    conflictCheckResult: ConflictCheckResult | null;
    allowanceCheckResult: LeaveAllowanceCheckResult | null;
    setLeave: (leave: Partial<Leave> | null) => void;
    updateLeaveField: <K extends keyof Leave>(field: K, value: Leave[K]) => void;
    saveLeaveAsDraft: () => Promise<Leave>;
    submitLeave: () => Promise<Leave>;
    approveLeaveRequest: (comment?: string) => Promise<Leave>;
    rejectLeaveRequest: (comment?: string) => Promise<Leave>;
    cancelLeaveRequest: (comment?: string) => Promise<Leave>;
    calculateLeaveDuration: () => number;
    checkConflicts: () => Promise<ConflictCheckResult>;
    checkAllowance: () => Promise<LeaveAllowanceCheckResult>;
    fetchUserLeaves: (filters?: LeaveFilters) => Promise<void>;
    fetchLeaveDetails: (leaveId: string) => Promise<void>;
}

export const useLeave = ({
    userId,
    initialLeave,
    userSchedule
}: UseLeaveProps = {}): UseLeaveReturn => {
    // État pour le congé en cours d'édition
    const [leave, setLeave] = useState<Partial<Leave> | null>(initialLeave || null);
    // État pour la liste des congés
    const [leaves, setLeaves] = useState<Leave[]>([]);
    // États de chargement et d'erreur
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    // État pour les résultats de vérification
    const [conflictCheckResult, setConflictCheckResult] = useState<ConflictCheckResult | null>(null);
    const [allowanceCheckResult, setAllowanceCheckResult] = useState<LeaveAllowanceCheckResult | null>(null);

    // Mettre à jour un champ du congé
    const updateLeaveField = useCallback(<K extends keyof Leave>(
        field: K,
        value: Leave[K]
    ) => {
        setLeave(prev => {
            if (!prev) return prev;

            // Si on modifie les dates de début ou de fin, recalculer le nombre de jours
            if ((field === 'startDate' || field === 'endDate') && userSchedule && prev.startDate && prev.endDate) {
                const startDate = field === 'startDate' ? new Date(value as string) : new Date(prev.startDate);
                const endDate = field === 'endDate' ? new Date(value as string) : new Date(prev.endDate);

                // Vérifier que les dates sont valides et dans le bon ordre
                if (startDate <= endDate) {
                    const countedDays = calculateLeaveDays(startDate, endDate, userSchedule);
                    return { ...prev, [field]: value, countedDays };
                }
            }

            return { ...prev, [field]: value };
        });
    }, [userSchedule]);

    // Calculer la durée du congé en jours décomptés
    const calculateLeaveDuration = useCallback((): number => {
        if (!leave?.startDate || !leave?.endDate || !userSchedule) {
            return 0;
        }

        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);

        return calculateLeaveDays(startDate, endDate, userSchedule);
    }, [leave?.startDate, leave?.endDate, userSchedule]);

    // Vérifier les conflits
    const checkConflicts = useCallback(async (): Promise<ConflictCheckResult> => {
        if (!leave?.startDate || !leave?.endDate || !userId) {
            throw new Error('Informations manquantes pour vérifier les conflits');
        }

        setLoading(true);
        setError(null);

        try {
            const startDate = new Date(leave.startDate);
            const endDate = new Date(leave.endDate);

            const result = await checkLeaveConflicts(
                startDate,
                endDate,
                userId,
                leave.id
            );

            setConflictCheckResult(result);
            return result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la vérification des conflits'));
            console.error('Erreur dans checkConflicts:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [leave?.startDate, leave?.endDate, leave?.id, userId]);

    // Vérifier les droits à congés
    const checkAllowance = useCallback(async (): Promise<LeaveAllowanceCheckResult> => {
        if (!leave?.type || !userId || leave.countedDays === undefined) {
            throw new Error('Informations manquantes pour vérifier les droits à congés');
        }

        setLoading(true);
        setError(null);

        try {
            const result = await checkLeaveAllowance(
                userId,
                leave.type as LeaveType,
                leave.countedDays
            );

            setAllowanceCheckResult(result);
            return result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la vérification des droits à congés'));
            console.error('Erreur dans checkAllowance:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [leave?.type, leave?.countedDays, userId]);

    // Enregistrer le congé comme brouillon
    const saveLeaveAsDraft = useCallback(async (): Promise<Leave> => {
        if (!leave) {
            throw new Error('Aucun congé à enregistrer');
        }

        if (!userId && !leave.userId) {
            throw new Error('ID utilisateur manquant');
        }

        setLoading(true);
        setError(null);

        try {
            // Préparer les données
            const leaveToSave: Partial<Leave> = {
                ...leave,
                userId: leave.userId || userId,
                status: LeaveStatus.DRAFT,
                createdAt: leave.createdAt || new Date(),
                updatedAt: new Date()
            };

            // Enregistrer
            const savedLeave = await saveLeave(leaveToSave);

            // Mettre à jour l'état
            setLeave(savedLeave);

            return savedLeave;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de l\'enregistrement'));
            console.error('Erreur dans saveLeaveAsDraft:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [leave, userId]);

    // Soumettre le congé pour approbation
    const submitLeave = useCallback(async (): Promise<Leave> => {
        if (!leave) {
            throw new Error('Aucun congé à soumettre');
        }

        if (!userId && !leave.userId) {
            throw new Error('ID utilisateur manquant');
        }

        // Vérifier que les informations nécessaires sont présentes
        if (!leave.startDate || !leave.endDate || !leave.type) {
            throw new Error('Informations manquantes (dates ou type de congé)');
        }

        setLoading(true);
        setError(null);

        try {
            // Préparer les données
            const leaveToSubmit: Partial<Leave> = {
                ...leave,
                userId: leave.userId || userId,
                status: LeaveStatus.PENDING,
                requestDate: new Date(),
                createdAt: leave.createdAt || new Date(),
                updatedAt: new Date()
            };

            // Soumettre
            const submittedLeave = await submitLeaveRequest(leaveToSubmit);

            // Mettre à jour l'état
            setLeave(submittedLeave);

            return submittedLeave;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la soumission'));
            console.error('Erreur dans submitLeave:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [leave, userId]);

    // Approuver une demande de congés
    const approveLeaveRequest = useCallback(async (comment?: string): Promise<Leave> => {
        if (!leave?.id) {
            throw new Error('ID de congé manquant');
        }

        setLoading(true);
        setError(null);

        try {
            const approvedLeave = await approveLeave(leave.id, comment);

            // Mettre à jour l'état
            setLeave(approvedLeave);

            return approvedLeave;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de l\'approbation'));
            console.error('Erreur dans approveLeaveRequest:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [leave?.id]);

    // Rejeter une demande de congés
    const rejectLeaveRequest = useCallback(async (comment?: string): Promise<Leave> => {
        if (!leave?.id) {
            throw new Error('ID de congé manquant');
        }

        setLoading(true);
        setError(null);

        try {
            const rejectedLeave = await rejectLeave(leave.id, comment);

            // Mettre à jour l'état
            setLeave(rejectedLeave);

            return rejectedLeave;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors du rejet'));
            console.error('Erreur dans rejectLeaveRequest:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [leave?.id]);

    // Annuler une demande de congés
    const cancelLeaveRequest = useCallback(async (comment?: string): Promise<Leave> => {
        if (!leave?.id) {
            throw new Error('ID de congé manquant');
        }

        setLoading(true);
        setError(null);

        try {
            const cancelledLeave = await cancelLeave(leave.id, comment);

            // Mettre à jour l'état
            setLeave(cancelledLeave);

            return cancelledLeave;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de l\'annulation'));
            console.error('Erreur dans cancelLeaveRequest:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [leave?.id]);

    // Récupérer les congés d'un utilisateur
    const fetchUserLeaves = useCallback(async (filters: LeaveFilters = {}): Promise<void> => {
        if (!userId && !filters.userId && !filters.userIds) {
            throw new Error('ID utilisateur manquant');
        }

        setLoading(true);
        setError(null);

        try {
            // Si l'utilisateur n'est pas spécifié dans les filtres, l'ajouter
            if (!filters.userId && !filters.userIds && userId) {
                filters.userId = userId;
            }

            const fetchedLeaves = await fetchLeaves(filters);
            setLeaves(fetchedLeaves);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la récupération des congés'));
            console.error('Erreur dans fetchUserLeaves:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Récupérer les détails d'un congé
    const fetchLeaveDetails = useCallback(async (leaveId: string): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            const fetchedLeave = await fetchLeaveById(leaveId);
            setLeave(fetchedLeave);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la récupération du congé'));
            console.error('Erreur dans fetchLeaveDetails:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Charger les congés de l'utilisateur au montage
    useEffect(() => {
        if (userId && !initialLeave) {
            fetchUserLeaves();
        }
    }, [userId, fetchUserLeaves, initialLeave]);

    // Calculer le nombre de jours décomptés quand les dates changent
    useEffect(() => {
        if (leave?.startDate && leave?.endDate && userSchedule) {
            const startDate = new Date(leave.startDate);
            const endDate = new Date(leave.endDate);

            if (startDate <= endDate) {
                const countedDays = calculateLeaveDays(startDate, endDate, userSchedule);

                // Mettre à jour le congé si le nombre de jours a changé
                if (leave.countedDays !== countedDays) {
                    setLeave(prev => prev ? { ...prev, countedDays } : null);
                }
            }
        }
    }, [leave?.startDate, leave?.endDate, userSchedule, calculateLeaveDays]);

    return {
        leave,
        leaves,
        loading,
        error,
        conflictCheckResult,
        allowanceCheckResult,
        setLeave,
        updateLeaveField,
        saveLeaveAsDraft,
        submitLeave,
        approveLeaveRequest,
        rejectLeaveRequest,
        cancelLeaveRequest,
        calculateLeaveDuration,
        checkConflicts,
        checkAllowance,
        fetchUserLeaves,
        fetchLeaveDetails
    };
}; 