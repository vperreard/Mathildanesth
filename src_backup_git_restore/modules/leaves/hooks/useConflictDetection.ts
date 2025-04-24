import { useState, useCallback } from 'react';
import {
    LeaveConflict,
    ConflictCheckResult,
    ConflictType,
    ConflictSeverity
} from '../types/conflict';
import { checkLeaveConflicts } from '../services/leaveService';

interface UseConflictDetectionProps {
    userId: string;
}

interface UseConflictDetectionReturn {
    conflicts: LeaveConflict[];
    hasBlockingConflicts: boolean;
    loading: boolean;
    error: Error | null;
    checkConflicts: (startDate: Date, endDate: Date, leaveId?: string) => Promise<ConflictCheckResult>;
    getConflictsByType: (type: ConflictType) => LeaveConflict[];
    getBlockingConflicts: () => LeaveConflict[];
    getWarningConflicts: () => LeaveConflict[];
    getInfoConflicts: () => LeaveConflict[];
    resolveConflict: (conflictId: string, comment: string) => void;
    resetConflicts: () => void;
}

export const useConflictDetection = ({
    userId
}: UseConflictDetectionProps): UseConflictDetectionReturn => {
    const [conflicts, setConflicts] = useState<LeaveConflict[]>([]);
    const [hasBlockingConflicts, setHasBlockingConflicts] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    // Vérifier les conflits
    const checkConflicts = useCallback(async (
        startDate: Date,
        endDate: Date,
        leaveId?: string
    ): Promise<ConflictCheckResult> => {
        setLoading(true);
        setError(null);

        try {
            const result = await checkLeaveConflicts(startDate, endDate, userId, leaveId);

            setConflicts(result.conflicts);
            setHasBlockingConflicts(result.hasBlockingConflicts);

            return result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la vérification des conflits'));
            console.error('Erreur dans checkConflicts:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Obtenir les conflits par type
    const getConflictsByType = useCallback((type: ConflictType): LeaveConflict[] => {
        return conflicts.filter(conflict => conflict.type === type);
    }, [conflicts]);

    // Obtenir les conflits bloquants
    const getBlockingConflicts = useCallback((): LeaveConflict[] => {
        return conflicts.filter(conflict => conflict.severity === ConflictSeverity.ERROR);
    }, [conflicts]);

    // Obtenir les conflits d'avertissement
    const getWarningConflicts = useCallback((): LeaveConflict[] => {
        return conflicts.filter(conflict => conflict.severity === ConflictSeverity.WARNING);
    }, [conflicts]);

    // Obtenir les conflits d'information
    const getInfoConflicts = useCallback((): LeaveConflict[] => {
        return conflicts.filter(conflict => conflict.severity === ConflictSeverity.INFO);
    }, [conflicts]);

    // Marquer un conflit comme résolu
    const resolveConflict = useCallback((conflictId: string, comment: string): void => {
        setConflicts(prevConflicts => {
            const updatedConflicts = prevConflicts.map(conflict => {
                if (conflict.id === conflictId) {
                    return {
                        ...conflict,
                        resolved: true,
                        resolutionComment: comment,
                        resolvedAt: new Date()
                    };
                }
                return conflict;
            });

            // Vérifier s'il reste des conflits bloquants non résolus
            const hasBlockingUnresolvedConflicts = updatedConflicts.some(
                conflict => conflict.severity === ConflictSeverity.ERROR && !conflict.resolved
            );

            setHasBlockingConflicts(hasBlockingUnresolvedConflicts);

            return updatedConflicts;
        });
    }, []);

    // Réinitialiser les conflits
    const resetConflicts = useCallback((): void => {
        setConflicts([]);
        setHasBlockingConflicts(false);
    }, []);

    return {
        conflicts,
        hasBlockingConflicts,
        loading,
        error,
        checkConflicts,
        getConflictsByType,
        getBlockingConflicts,
        getWarningConflicts,
        getInfoConflicts,
        resolveConflict,
        resetConflicts
    };
}; 