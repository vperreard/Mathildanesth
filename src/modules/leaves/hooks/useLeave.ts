import { useState, useEffect, useCallback } from 'react';
import {
    Leave,
    LeaveStatus,
    LeaveType,
    LeaveAllowanceCheckResult,
    LeaveFilters
} from '../types/leave';
import {
    ConflictCheckResult,
    ConflictSeverity
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
import { ErrorDetails, useErrorHandler } from '@/hooks/useErrorHandler';
import { useAuth } from '@/context/AuthContext';

interface UseLeaveProps {
    userId?: string;
    initialLeave?: Partial<Leave>;
    userSchedule?: WorkSchedule;
}

interface UseLeaveReturn {
    leave: Partial<Leave> | null;
    leaves: Leave[];
    loading: boolean;
    error: ErrorDetails | null;
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
    checkConflicts: (startDate?: string | Date, endDate?: string | Date, leaveIdToExclude?: string) => Promise<ConflictCheckResult | null>;
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
    // Utilisation du hook de gestion d'erreurs
    const { setError, errorState, hasError, clearError } = useErrorHandler();
    // État pour le chargement (à gérer)
    const [loading, setLoading] = useState<boolean>(false);
    // État pour les résultats de vérification
    const [conflictCheckResult, setConflictCheckResult] = useState<ConflictCheckResult | null>(null);
    const [allowanceCheckResult, setAllowanceCheckResult] = useState<LeaveAllowanceCheckResult | null>(null);
    // État d'erreur local (pour les tests qui vérifient result.current.error)
    const [error, setLocalError] = useState<ErrorDetails | null>(null);

    const authContext = useAuth();
    // Utiliser une référence locale pour éviter les problèmes de test mock
    const { user } = authContext;

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
                    // Ne recalculer que si la date a changé et si l'ordre est correct
                    const countedDays = calculateLeaveDays(startDate, endDate, userSchedule);
                    return { ...prev, [field]: value, countedDays };
                }
            }

            // Pour tous les autres champs ou si les dates ne sont pas valides
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

    // Vérifier les conflits de congés
    const checkConflicts = useCallback(async (
        startDateParam?: string | Date,
        endDateParam?: string | Date,
        leaveIdToExclude?: string
    ): Promise<ConflictCheckResult | null> => {
        clearError('conflicts');
        setLocalError(null);

        // Pas de référence à authContext.user ici pour les tests où authContext est mocké
        const currentUser = user;

        // Utiliser les dates fournies ou celles du congé en cours
        const startDate = startDateParam || leave?.startDate;
        const endDate = endDateParam || leave?.endDate;
        const leaveId = leaveIdToExclude || leave?.id;

        if (!currentUser?.id) {
            setError('conflicts', { message: 'Utilisateur non connecté.', severity: 'warning' });
            return null;
        }

        if (!startDate || !endDate) {
            setError('conflicts', { message: 'Dates de début et de fin requises.', severity: 'warning' });
            return null;
        }

        setLoading(true);
        try {
            // S'assurer que nous avons des objets Date
            const dateStartDate = typeof startDate === 'string' ? new Date(startDate) : startDate;
            const dateEndDate = typeof endDate === 'string' ? new Date(endDate) : endDate;

            // Vérifier si les dates sont valides après conversion éventuelle
            if (!dateStartDate || isNaN(dateStartDate.getTime()) || !dateEndDate || isNaN(dateEndDate.getTime())) {
                setError('conflicts', { message: 'Dates invalides fournies.', severity: 'warning' });
                setLoading(false);
                return null;
            }

            // Appeler le service avec les objets Date
            const conflictResult = await checkLeaveConflicts(
                dateStartDate,
                dateEndDate,
                currentUser.id,
                leaveId
            );

            if (conflictResult.conflicts && conflictResult.conflicts.length > 0) {
                setConflictCheckResult(conflictResult);

                // Vérifier si les conflits sont bloquants ou non
                if (conflictResult.hasBlockingConflicts) {
                    setError('conflicts', {
                        message: 'Conflit bloquant détecté avec une autre demande.',
                        severity: 'error',
                        context: { conflicts: conflictResult.conflicts }
                    });
                } else {
                    setError('conflicts', {
                        message: 'Conflit détecté avec une autre demande.',
                        severity: 'warning',
                        context: { conflicts: conflictResult.conflicts }
                    });
                }
            } else {
                clearError('conflicts');
                setConflictCheckResult(null);
            }

            setLoading(false);
            return conflictResult;

        } catch (error: any) {
            setConflictCheckResult(null);
            setError('conflicts', { message: error.message, severity: 'error' });
            // Convertir l'erreur au format ErrorDetails pour les tests
            setLocalError({
                message: error.message,
                severity: 'error',
                timestamp: new Date()
            });
            setLoading(false);
            return null;
        }
    }, [user, leave?.startDate, leave?.endDate, leave?.id, setError, clearError]);

    // Vérifier les droits à congés
    const checkAllowance = useCallback(async (): Promise<LeaveAllowanceCheckResult> => {
        setLoading(true);
        setLocalError(null);

        if (!leave?.type || !userId || leave.countedDays === undefined) {
            throw new Error('Informations manquantes pour vérifier les droits à congés');
        }

        try {
            const result = await checkLeaveAllowance(
                userId,
                leave.type as LeaveType,
                leave.countedDays
            );

            setAllowanceCheckResult(result);
            setLoading(false);
            return result;
        } catch (err: any) {
            console.error('Erreur dans checkAllowance:', err);
            // Convertir l'erreur au format ErrorDetails
            setLocalError({
                message: err.message,
                severity: 'error',
                timestamp: new Date()
            });
            setLoading(false);
            throw err;
        }
    }, [leave?.type, leave?.countedDays, userId]);

    // Enregistrer le congé comme brouillon
    const saveLeaveAsDraft = useCallback(async (): Promise<Leave> => {
        setLoading(true);
        setLocalError(null);

        if (!leave) {
            throw new Error('Aucun congé à enregistrer');
        }

        if (!userId && !leave.userId) {
            throw new Error('ID utilisateur manquant');
        }

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
            setLoading(false);
            return savedLeave;
        } catch (err: any) {
            console.error('Erreur dans saveLeaveAsDraft:', err);
            // Convertir l'erreur au format ErrorDetails
            setLocalError({
                message: err.message,
                severity: 'error',
                timestamp: new Date()
            });
            setLoading(false);
            throw err;
        }
    }, [leave, userId]);

    // Soumettre le congé pour approbation
    const submitLeave = useCallback(async (): Promise<Leave> => {
        setLoading(true);
        setLocalError(null);

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
            setLoading(false);
            return submittedLeave;
        } catch (err: any) {
            console.error('Erreur dans submitLeave:', err);
            // Convertir l'erreur au format ErrorDetails
            setLocalError({
                message: err.message,
                severity: 'error',
                timestamp: new Date()
            });
            setLoading(false);
            throw err;
        }
    }, [leave, userId]);

    // Approuver une demande de congés
    const approveLeaveRequest = useCallback(async (comment?: string): Promise<Leave> => {
        setLoading(true);
        setLocalError(null);

        if (!leave?.id) {
            throw new Error('ID de congé manquant pour l\'approbation');
        }

        try {
            const approvedLeave = await approveLeave(leave.id, comment);

            // Mettre à jour l'état
            setLeave(approvedLeave);
            setLoading(false);
            return approvedLeave;
        } catch (err: any) {
            console.error('Erreur dans approveLeaveRequest:', err);
            // Convertir l'erreur au format ErrorDetails
            setLocalError({
                message: err.message,
                severity: 'error',
                timestamp: new Date()
            });
            setLoading(false);
            throw err;
        }
    }, [leave?.id]);

    // Rejeter une demande de congés
    const rejectLeaveRequest = useCallback(async (comment?: string): Promise<Leave> => {
        setLoading(true);
        setLocalError(null);

        if (!leave?.id) {
            throw new Error('ID de congé manquant pour le rejet');
        }

        try {
            const rejectedLeave = await rejectLeave(leave.id, comment);

            // Mettre à jour l'état
            setLeave(rejectedLeave);
            setLoading(false);
            return rejectedLeave;
        } catch (err: any) {
            console.error('Erreur dans rejectLeaveRequest:', err);
            // Convertir l'erreur au format ErrorDetails
            setLocalError({
                message: err.message,
                severity: 'error',
                timestamp: new Date()
            });
            setLoading(false);
            throw err;
        }
    }, [leave?.id]);

    // Annuler une demande de congés
    const cancelLeaveRequest = useCallback(async (comment?: string): Promise<Leave> => {
        setLoading(true);
        setLocalError(null);

        if (!leave?.id) {
            throw new Error('ID de congé manquant pour l\'annulation');
        }

        try {
            const cancelledLeave = await cancelLeave(leave.id, comment);

            // Mettre à jour l'état
            setLeave(cancelledLeave);
            setLoading(false);
            return cancelledLeave;
        } catch (err: any) {
            console.error('Erreur dans cancelLeaveRequest:', err);
            // Convertir l'erreur au format ErrorDetails
            setLocalError({
                message: err.message,
                severity: 'error',
                timestamp: new Date()
            });
            setLoading(false);
            throw err;
        }
    }, [leave?.id]);

    // Récupérer les congés d'un utilisateur
    const fetchUserLeaves = useCallback(async (filters: LeaveFilters = {}): Promise<void> => {
        setLoading(true);
        setLocalError(null);

        // Réinitialiser les congés pour garantir un état propre
        setLeaves([]);

        if (!userId && !filters.userId && !filters.userIds) {
            throw new Error('ID utilisateur manquant');
        }

        try {
            // Si l'utilisateur n'est pas spécifié dans les filtres, l'ajouter
            const combinedFilters = { ...filters };
            if (!combinedFilters.userId && !combinedFilters.userIds && userId) {
                combinedFilters.userId = userId;
            }

            const fetchedLeaves = await fetchLeaves(combinedFilters);
            setLeaves(fetchedLeaves);
            setLoading(false);
        } catch (err: any) {
            console.error('Erreur dans fetchUserLeaves:', err);
            // Convertir l'erreur au format ErrorDetails
            setLocalError({
                message: err.message,
                severity: 'error',
                timestamp: new Date()
            });
            setLoading(false);
            throw err;
        }
    }, [userId]);

    // Récupérer les détails d'un congé
    const fetchLeaveDetails = useCallback(async (leaveId: string): Promise<void> => {
        setLoading(true);
        setLocalError(null);

        try {
            const fetchedLeave = await fetchLeaveById(leaveId);
            setLeave(fetchedLeave);
            setLoading(false);
        } catch (err: any) {
            console.error('Erreur dans fetchLeaveDetails:', err);
            // Convertir l'erreur au format ErrorDetails
            setLocalError({
                message: err.message,
                severity: 'error',
                timestamp: new Date()
            });
            setLoading(false);
            throw err;
        }
    }, []);

    // Charger les congés de l'utilisateur au montage
    useEffect(() => {
        if (userId && !initialLeave) {
            fetchUserLeaves();
        }
    }, [userId, fetchUserLeaves, initialLeave]);

    // Empêcher le recalcul automatique des jours dans useEffect
    // On ne recalcule que lors des mises à jour explicites via updateLeaveField

    return {
        leave,
        leaves,
        loading,
        error: error || errorState.globalError || Object.values(errorState.errors)[0] || null,
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