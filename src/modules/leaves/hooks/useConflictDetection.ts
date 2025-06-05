import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { logger } from "../../../lib/logger";
import {
    LeaveConflict,
    ConflictCheckResult,
    ConflictType,
    ConflictSeverity
} from '../types/conflict';
import { checkLeaveConflicts } from '../services/leaveService';
import { useDateValidation } from './useDateValidation';

export interface UseConflictDetectionProps {
    userId: string;
    enablePerformanceTracking?: boolean;
}

export interface UseConflictDetectionReturn {
    conflicts: LeaveConflict[];
    hasBlockingConflicts: boolean;
    loading: boolean;
    error: Error | null;
    checkConflicts: (startDate: Date | string | null, endDate: Date | string | null, leaveId?: string, skipDebounce?: boolean) => Promise<ConflictCheckResult>;
    getConflictsByType: (type: ConflictType) => LeaveConflict[];
    getBlockingConflicts: () => LeaveConflict[];
    getWarningConflicts: () => LeaveConflict[];
    getInfoConflicts: () => LeaveConflict[];
    resolveConflict: (conflictId: string) => void;
    resetConflicts: () => void;
    validateDates: (startDate: Date | null, endDate: Date | null) => boolean;
    performanceStats: {
        lastCheckTimeMs: number | null;
        averageCheckTimeMs: number | null;
        checkCount: number;
        cacheHitCount: number;
    };
}

/**
 * Hook pour la détection des conflits de congés
 * Utilise le service de détection des conflits et gère l'état des conflits détectés
 * Version optimisée avec suivi des performances
 */
export const useConflictDetection = ({
    userId,
    enablePerformanceTracking = false
}: UseConflictDetectionProps): UseConflictDetectionReturn => {
    const [conflicts, setConflicts] = useState<LeaveConflict[]>([]);
    const [hasBlockingConflicts, setHasBlockingConflicts] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    // Statistiques de performance
    const [performanceStats, setPerformanceStats] = useState({
        lastCheckTimeMs: null as number | null,
        averageCheckTimeMs: null as number | null,
        checkCount: 0,
        cacheHitCount: 0
    });

    // Débounce pour les vérifications fréquentes
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Utiliser le hook de validation de dates
    const dateValidation = useDateValidation();

    // Nettoyage des timers lors du démontage du composant
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // Valider les dates avant de vérifier les conflits
    const validateDates = (startDate: Date | null, endDate: Date | null): boolean => {
        dateValidation.resetErrors();

        // Vérifications de base des dates
        if (!startDate || !endDate) {
            logger.info('useConflictDetection: validateDates - dates nulles');
            return false;
        }

        // Vérifier que ce sont bien des objets Date valides
        if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
            logger.info('useConflictDetection: validateDates - startDate n\'est pas une date valide');
            return false;
        }

        if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
            logger.info('useConflictDetection: validateDates - endDate n\'est pas une date valide');
            return false;
        }

        // Vérifier que la date de début est bien avant la date de fin
        if (startDate > endDate) {
            logger.info('useConflictDetection: validateDates - startDate est après endDate');
            return false;
        }

        try {
            // Vérifications avancées avec le validateur de dates
            const startValid = dateValidation.validateDate(startDate, 'startDate', {
                required: true,
                allowPastDates: false
            });

            const endValid = dateValidation.validateDate(endDate, 'endDate', {
                required: true,
                allowPastDates: false
            });

            const rangeValid = dateValidation.validateDateRange(
                startDate,
                endDate,
                'startDate',
                'endDate',
                {
                    minDuration: 1,
                    businessDaysOnly: true
                }
            );

            return startValid && endValid && rangeValid;
        } catch (error) {
            logger.error('useConflictDetection: validateDates - erreur lors de la validation', error);
            return false;
        }
    };

    // Fonction pour réinitialiser tous les conflits
    const resetConflicts = useCallback((): void => {
        setConflicts([]);
        setHasBlockingConflicts(false);
        setError(null);
    }, []);

    // Mettre à jour les statistiques de performance
    const updatePerformanceStats = useCallback((result: ConflictCheckResult): void => {
        if (!enablePerformanceTracking || !result.performanceStats) return;

        setPerformanceStats(prev => {
            const totalTime = (prev.averageCheckTimeMs || 0) * prev.checkCount +
                (result.performanceStats?.totalTimeMs || 0);
            const newCount = prev.checkCount + 1;
            const newCacheHitCount = prev.cacheHitCount + (result.performanceStats?.cacheHit ? 1 : 0);

            return {
                lastCheckTimeMs: result.performanceStats?.totalTimeMs || null,
                averageCheckTimeMs: newCount ? totalTime / newCount : null,
                checkCount: newCount,
                cacheHitCount: newCacheHitCount
            };
        });
    }, [enablePerformanceTracking]);

    // Vérifier les conflits avec un système de debounce pour éviter les appels trop fréquents
    const checkConflicts = useCallback(async (
        startDate: Date | string | null,
        endDate: Date | string | null,
        leaveId?: string,
        skipDebounce: boolean = false
    ): Promise<ConflictCheckResult> => {
        // Réinitialiser l'état avant de commencer
        setLoading(true);
        setError(null);

        // Ne pas réinitialiser les conflits immédiatement pour éviter un clignotement dans l'UI
        // au cas où on recevrait rapidement le même résultat du cache

        // Fonction qui effectue la vérification réelle
        const performCheck = async (): Promise<ConflictCheckResult> => {
            try {
                // Convertir les dates si elles sont fournies en tant que chaînes
                const startDateObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
                const endDateObj = typeof endDate === 'string' ? new Date(endDate) : endDate;

                // Valider les dates d'entrée avec le hook useDateValidation
                const datesValid = validateDates(startDateObj, endDateObj);

                if (!datesValid) {
                    logger.error('useConflictDetection: checkConflicts - Dates invalides pour la vérification des conflits', { startDate, endDate });
                    throw new Error('Dates invalides pour la vérification des conflits');
                }

                if (!userId) {
                    logger.error('useConflictDetection: checkConflicts - ID utilisateur requis');
                    throw new Error('ID utilisateur requis');
                }

                // Appeler le service de vérification des conflits
                // À ce stade, on sait que startDateObj et endDateObj sont des objets Date valides
                const result = await checkLeaveConflicts(startDateObj as Date, endDateObj as Date, userId, leaveId);

                // Mettre à jour l'état avec les résultats
                setConflicts(result.conflicts || []);
                setHasBlockingConflicts(result.hasBlockers || false);

                // Mettre à jour les statistiques de performance
                updatePerformanceStats(result);

                return result;
            } catch (err) {
                const errorObj = err instanceof Error ? err : new Error('Erreur lors de la vérification des conflits');
                logger.error('Erreur dans checkConflicts:', err);

                // Réinitialiser l'état des conflits AVANT de définir l'erreur
                resetConflicts();
                // Mettre à jour l'état error
                setError(errorObj);

                throw errorObj;
            } finally {
                setLoading(false);
            }
        };

        // Si on doit ignorer le debounce, exécuter immédiatement
        if (skipDebounce) {
            return performCheck();
        }

        // Sinon utiliser le debounce pour éviter les appels trop fréquents
        return new Promise((resolve, reject) => {
            // Annuler toute vérification en cours
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            // Programmer une nouvelle vérification
            debounceTimerRef.current = setTimeout(async () => {
                try {
                    const result = await performCheck();
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            }, 300); // 300ms de délai de debounce
        });
    }, [userId, validateDates, resetConflicts, updatePerformanceStats]);

    // Obtenir les conflits par type - utilisation d'un useMemo pour la mise en cache
    const getConflictsByType = useCallback((type: ConflictType): LeaveConflict[] => {
        return conflicts.filter(conflict => conflict.type === type);
    }, [conflicts]);

    // Obtenir les conflits par sévérité - utilisation d'un useMemo pour la mise en cache
    const getConflictsBySeverity = useCallback((severity: ConflictSeverity): LeaveConflict[] => {
        return conflicts.filter(conflict => conflict.severity === severity);
    }, [conflicts]);

    // Obtenir les conflits bloquants
    const getBlockingConflicts = useCallback((): LeaveConflict[] => {
        return getConflictsBySeverity(ConflictSeverity.BLOQUANT);
    }, [getConflictsBySeverity]);

    // Obtenir les conflits d'avertissement
    const getWarningConflicts = useCallback((): LeaveConflict[] => {
        return getConflictsBySeverity(ConflictSeverity.AVERTISSEMENT);
    }, [getConflictsBySeverity]);

    // Obtenir les conflits d'information
    const getInfoConflicts = useCallback((): LeaveConflict[] => {
        return getConflictsBySeverity(ConflictSeverity.INFORMATION);
    }, [getConflictsBySeverity]);

    // Marquer un conflit comme résolu
    const resolveConflict = useCallback((conflictId: string): void => {
        setConflicts(prev => prev.filter(conflict => conflict.id !== conflictId));

        // Mettre à jour l'état des conflits bloquants après résolution
        setHasBlockingConflicts(prev => {
            const remainingConflicts = conflicts.filter(conflict => conflict.id !== conflictId);
            return remainingConflicts.some(conflict => conflict.severity === ConflictSeverity.BLOQUANT);
        });
    }, [conflicts]);

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
        resetConflicts,
        validateDates,
        performanceStats
    };
}; 