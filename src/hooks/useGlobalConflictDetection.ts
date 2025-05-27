import { useState, useCallback, useMemo } from 'react';
import {
    conflictDetectionFacade,
    ConflictCheckOptions,
    GlobalConflictCheckResult
} from '@/services/conflictDetection';
import {
    ConflictType,
    ConflictSeverity,
    LeaveConflict
} from '@/modules/conges/types/conflict';

export interface UseGlobalConflictDetectionProps {
    userId?: string;
    teamId?: string;
}

export interface UseGlobalConflictDetectionReturn {
    // État des conflits
    globalResult: GlobalConflictCheckResult | null;
    loading: boolean;
    error: Error | null;

    // Méthodes de vérification
    checkConflicts: (
        startDate: Date,
        endDate: Date,
        options?: Partial<ConflictCheckOptions>
    ) => Promise<GlobalConflictCheckResult>;

    // Méthodes de filtrage
    getConflictsByType: (type: ConflictType) => LeaveConflict[];
    getConflictsBySeverity: (severity: ConflictSeverity) => LeaveConflict[];
    getBlockingConflicts: () => LeaveConflict[];
    getWarningConflicts: () => LeaveConflict[];
    getInfoConflicts: () => LeaveConflict[];

    // Méthodes de gestion
    resetConflicts: () => void;

    // Méthodes d'information
    getSupportedConflictTypes: () => ConflictType[];
    hasConflictsByType: (type: ConflictType) => boolean;
}

/**
 * Hook pour la détection globale des conflits à travers tous les modules
 * Utilise la façade de détection de conflits pour centraliser les vérifications
 * @param props Propriétés du hook
 * @returns Méthodes et état pour la détection de conflits
 */
export const useGlobalConflictDetection = ({
    userId,
    teamId
}: UseGlobalConflictDetectionProps = {}): UseGlobalConflictDetectionReturn => {
    const [globalResult, setGlobalResult] = useState<GlobalConflictCheckResult | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    // Liste des types de conflits supportés
    const supportedConflictTypes = useMemo(() => {
        return conflictDetectionFacade.getSupportedConflictTypes();
    }, []);

    /**
     * Vérifie les conflits sur une période donnée à travers tous les modules
     * @param startDate Date de début
     * @param endDate Date de fin
     * @param options Options supplémentaires
     * @returns Résultat global de la vérification
     */
    const checkConflicts = useCallback(async (
        startDate: Date,
        endDate: Date,
        options: Partial<ConflictCheckOptions> = {}
    ): Promise<GlobalConflictCheckResult> => {
        setLoading(true);
        setError(null);

        try {
            // Fusionner les options par défaut avec celles fournies
            const mergedOptions: ConflictCheckOptions = {
                userId: userId || options.userId,
                teamId: teamId || options.teamId,
                includeLeaveConflicts: options.includeLeaveConflicts ?? true,
                includeShiftConflicts: options.includeShiftConflicts ?? true,
                includeMeetingConflicts: options.includeMeetingConflicts ?? true,
                includeDeadlineConflicts: options.includeDeadlineConflicts ?? true,
                checkCriticalRoles: options.checkCriticalRoles ?? true,
                severityThreshold: options.severityThreshold,
                context: options.context || {}
            };

            // Vérifier la présence d'un utilisateur
            if (!mergedOptions.userId) {
                throw new Error('ID utilisateur requis pour la vérification des conflits');
            }

            // Exécuter la détection de conflits
            const result = await conflictDetectionFacade.checkConflicts(
                startDate,
                endDate,
                mergedOptions
            );

            // Mettre à jour l'état
            setGlobalResult(result);
            return result;
        } catch (err) {
            const errorObj = err instanceof Error ? err : new Error('Erreur inconnue lors de la détection des conflits');
            setError(errorObj);
            console.error('Erreur dans la détection des conflits:', err);

            // Retourner un résultat vide en cas d'erreur
            const emptyResult: GlobalConflictCheckResult = {
                hasConflicts: false,
                conflicts: [],
                hasBlockers: false,
                canAutoApprove: true,
                requiresManagerReview: false,
                conflictsByType: {} as Record<ConflictType, LeaveConflict[]>,
                metadata: {
                    sources: [],
                    executionTime: 0,
                    conflictCounts: {
                        total: 0,
                        byType: {} as Record<ConflictType, number>,
                        bySeverity: {
                            [ConflictSeverity.INFORMATION]: 0,
                            [ConflictSeverity.AVERTISSEMENT]: 0,
                            [ConflictSeverity.BLOQUANT]: 0
                        }
                    }
                }
            };

            return emptyResult;
        } finally {
            setLoading(false);
        }
    }, [userId, teamId]);

    /**
     * Récupère les conflits par type
     * @param type Type de conflit à filtrer
     * @returns Liste des conflits du type spécifié
     */
    const getConflictsByType = useCallback((type: ConflictType): LeaveConflict[] => {
        if (!globalResult) {
            return [];
        }

        return globalResult.conflictsByType[type] || [];
    }, [globalResult]);

    /**
     * Récupère les conflits par sévérité
     * @param severity Niveau de sévérité à filtrer
     * @returns Liste des conflits de la sévérité spécifiée
     */
    const getConflictsBySeverity = useCallback((severity: ConflictSeverity): LeaveConflict[] => {
        if (!globalResult) {
            return [];
        }

        return globalResult.conflicts.filter(conflict => conflict.severity === severity);
    }, [globalResult]);

    /**
     * Récupère les conflits bloquants
     * @returns Liste des conflits bloquants
     */
    const getBlockingConflicts = useCallback((): LeaveConflict[] => {
        return getConflictsBySeverity(ConflictSeverity.BLOQUANT);
    }, [getConflictsBySeverity]);

    /**
     * Récupère les conflits d'avertissement
     * @returns Liste des conflits d'avertissement
     */
    const getWarningConflicts = useCallback((): LeaveConflict[] => {
        return getConflictsBySeverity(ConflictSeverity.AVERTISSEMENT);
    }, [getConflictsBySeverity]);

    /**
     * Récupère les conflits d'information
     * @returns Liste des conflits d'information
     */
    const getInfoConflicts = useCallback((): LeaveConflict[] => {
        return getConflictsBySeverity(ConflictSeverity.INFORMATION);
    }, [getConflictsBySeverity]);

    /**
     * Réinitialise l'état des conflits
     */
    const resetConflicts = useCallback((): void => {
        setGlobalResult(null);
        setError(null);
    }, []);

    /**
     * Récupère les types de conflits supportés
     * @returns Liste des types de conflits supportés
     */
    const getSupportedConflictTypes = useCallback((): ConflictType[] => {
        return supportedConflictTypes;
    }, [supportedConflictTypes]);

    /**
     * Vérifie s'il y a des conflits d'un type spécifique
     * @param type Type de conflit à vérifier
     * @returns Vrai s'il y a des conflits du type spécifié
     */
    const hasConflictsByType = useCallback((type: ConflictType): boolean => {
        if (!globalResult) {
            return false;
        }

        return !!globalResult.conflictsByType[type]?.length;
    }, [globalResult]);

    return {
        globalResult,
        loading,
        error,
        checkConflicts,
        getConflictsByType,
        getConflictsBySeverity,
        getBlockingConflicts,
        getWarningConflicts,
        getInfoConflicts,
        resetConflicts,
        getSupportedConflictTypes,
        hasConflictsByType
    };
}; 