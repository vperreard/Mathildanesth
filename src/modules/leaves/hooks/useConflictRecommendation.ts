import { useState, useCallback, useMemo, useEffect } from 'react';
import { logger } from "../../../lib/logger";
import { useTranslation } from 'next-i18next';
import {
    LeaveConflict,
    ConflictType,
    ConflictSeverity,
    ConflictResolution
} from '../types/conflict';
import {
    ConflictRecommendation,
    ConflictAnalysisResult,
    ResolutionStrategy
} from '../types/recommendation';
import { useConflictDetection, UseConflictDetectionProps, UseConflictDetectionReturn } from './useConflictDetection';
import { ConflictRecommendationService } from '../services/conflictRecommendationService';
import { User } from '../../../types/user';
import { LeaveRequest } from '../types/leave';
import { EventBusService } from '@/services/eventBusService';
import { formatDate } from '@/utils/dateUtils';

interface LeaveConflictWithRecommendation extends LeaveConflict {
    recommendation?: ConflictRecommendation;
}

export interface UseConflictRecommendationProps extends UseConflictDetectionProps {
    enableRecommendations?: boolean;
    user?: User;
    departmentId?: string;
    conflicts: LeaveConflict[];
    leaveRequest: Partial<LeaveRequest>;
    userId: string;
    onRecommendationsGenerated?: (result: ConflictAnalysisResult) => void;
}

export interface UseConflictRecommendationReturn extends Omit<UseConflictDetectionReturn, 'conflicts'> {
    conflicts: LeaveConflictWithRecommendation[];
    analysisResult: ConflictAnalysisResult | null;
    hasAutomaticResolutions: boolean;
    pendingAutomaticResolutions: number;
    applyRecommendedStrategy: (conflictId: string, strategy: ResolutionStrategy, comment?: string) => Promise<ConflictResolution | null>;
    rejectRecommendation: (conflictId: string, reason?: string) => void;
    applyAllAutomaticResolutions: () => Promise<number>;
    getTopRecommendation: (conflictId: string) => ConflictRecommendation['strategies'][0] | null;
    recommendations: ConflictRecommendation[];
    automatedResolutionsCount: number;
    manualResolutionsCount: number;
    highestPriorityConflicts: ConflictRecommendation[];
    recommendationsLoading: boolean;
    recommendationsError: Error | null;
    generateRecommendations: () => Promise<void>;
    applyResolution: (resolution: ConflictResolution) => Promise<boolean>;
}

/**
 * Hook pour la détection des conflits de congés avec recommandations automatiques
 * Étend le hook useConflictDetection avec des fonctionnalités de recommandation
 */
export const useConflictRecommendation = ({
    userId,
    enablePerformanceTracking = false,
    enableRecommendations = true,
    user,
    departmentId,
    conflicts,
    leaveRequest,
    onRecommendationsGenerated
}: UseConflictRecommendationProps): UseConflictRecommendationReturn => {
    const { t } = useTranslation('leaves');

    // Utiliser le hook de détection de conflits sous-jacent
    const conflictDetection = useConflictDetection({
        userId,
        enablePerformanceTracking
    });

    // État pour les recommandations
    const [conflictsWithRecommendations, setConflictsWithRecommendations] =
        useState<LeaveConflictWithRecommendation[]>([]);
    const [analysisResult, setAnalysisResult] = useState<ConflictAnalysisResult | null>(null);
    const [recommendations, setRecommendations] = useState<ConflictRecommendation[]>([]);
    const [automatedResolutionsCount, setAutomatedResolutionsCount] = useState<number>(0);
    const [manualResolutionsCount, setManualResolutionsCount] = useState<number>(0);
    const [highestPriorityConflicts, setHighestPriorityConflicts] = useState<ConflictRecommendation[]>([]);
    const [recommendationsLoading, setRecommendationsLoading] = useState<boolean>(false);
    const [recommendationsError, setRecommendationsError] = useState<Error | null>(null);

    // Référence au service de recommandation
    const recommendationService = useMemo(() =>
        ConflictRecommendationService.getInstance(), []);

    // Bus d'événements pour la communication
    const eventBus = useMemo(() => EventBusService.getInstance(), []);

    // Mettre à jour les conflits avec recommendations lorsque les conflits sous-jacents changent
    useEffect(() => {
        const updateRecommendations = async () => {
            if (!enableRecommendations || conflictDetection.conflicts.length === 0 || !leaveRequest) {
                // Si les recommandations sont désactivées ou pas de conflits, synchroniser simplement l'état
                setConflictsWithRecommendations(conflictDetection.conflicts.map(conflict => ({
                    ...conflict
                })));
                setAnalysisResult(null);
                return;
            }

            try {
                // Analyser les conflits pour obtenir des recommandations
                const result = recommendationService.analyzeConflicts(
                    conflictDetection.conflicts,
                    leaveRequest,
                    user,
                    departmentId
                );

                // Mettre à jour l'état avec les recommandations
                setAnalysisResult(result);

                // Associer chaque recommandation avec son conflit correspondant
                const enrichedConflicts = conflictDetection.conflicts.map(conflict => {
                    const recommendation = result.recommendations.find(
                        rec => rec.conflictId === conflict.id
                    );

                    return {
                        ...conflict,
                        recommendation
                    };
                });

                setConflictsWithRecommendations(enrichedConflicts);

                // Publier un événement pour informer d'autres composants des nouvelles recommandations
                eventBus.publish('conflict.recommendations.updated', {
                    count: result.recommendations.length,
                    automatedCount: result.automatedResolutionsCount,
                    manualCount: result.manualResolutionsCount
                });

                setRecommendations(result.recommendations);
                setAutomatedResolutionsCount(result.automatedResolutionsCount);
                setManualResolutionsCount(result.manualResolutionsCount);
                setHighestPriorityConflicts(result.highestPriorityConflicts);
            } catch (error) {
                logger.error('Erreur lors de l\'analyse des recommandations:', error);
                // En cas d'erreur, mettre à jour avec les conflits sans recommandations
                setConflictsWithRecommendations(conflictDetection.conflicts.map(conflict => ({
                    ...conflict
                })));
                setAnalysisResult(null);
            }
        };

        updateRecommendations();
    }, [
        conflictDetection.conflicts,
        enableRecommendations,
        leaveRequest,
        recommendationService,
        user,
        departmentId,
        eventBus
    ]);

    // Vérifier les conflits et mettre à jour l'état de la demande
    const checkConflicts = useCallback(async (
        startDate: Date,
        endDate: Date,
        leaveId?: string
    ) => {
        // Mettre à jour l'état de la demande pour les recommandations futures
        setLeaveRequest({
            id: leaveId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            userId
        });

        // Appeler la méthode de vérification de conflit sous-jacente
        return await conflictDetection.checkConflicts(startDate, endDate, leaveId);
    }, [conflictDetection, userId]);

    // Obtenir les conflits qui ont des recommandations automatiques
    const getConflictsWithAutomaticResolutions = useCallback(() => {
        return conflictsWithRecommendations.filter(
            conflict => conflict.recommendation?.automaticResolution
        );
    }, [conflictsWithRecommendations]);

    // Vérifier s'il y a des résolutions automatiques disponibles
    const hasAutomaticResolutions = useMemo(() =>
        getConflictsWithAutomaticResolutions().length > 0,
        [getConflictsWithAutomaticResolutions]
    );

    // Nombre de résolutions automatiques en attente
    const pendingAutomaticResolutions = useMemo(() =>
        getConflictsWithAutomaticResolutions().filter(
            conflict => conflict.recommendation?.resolutionStatus === 'PENDING'
        ).length,
        [getConflictsWithAutomaticResolutions]
    );

    // Appliquer une stratégie recommandée
    const applyRecommendedStrategy = useCallback(async (
        conflictId: string,
        strategy: ResolutionStrategy,
        comment: string = ''
    ): Promise<ConflictResolution | null> => {
        const conflict = conflictsWithRecommendations.find(c => c.id === conflictId);

        if (!conflict || !conflict.recommendation) {
            logger.error(`Aucune recommandation trouvée pour le conflit ${conflictId}`);
            return null;
        }

        // Créer un objet de résolution
        const resolution: ConflictResolution = {
            conflictId,
            resolvedBy: userId,
            resolvedAt: formatDate(new Date()),
            resolution: strategy === ResolutionStrategy.APPROVE
                ? 'APPROVED'
                : strategy === ResolutionStrategy.REJECT
                    ? 'REJECTED'
                    : 'MODIFIED',
            comment: comment || `${t('conflit.resolution_auto')}: ${strategy}`
        };

        // Si la stratégie implique des dates alternatives, les ajouter à la résolution
        const strategyDetails = conflict.recommendation.strategies.find(s => s.strategy === strategy);
        if (strategyDetails?.alternativeDates && strategyDetails.alternativeDates.length > 0) {
            resolution.alternativeDates = strategyDetails.alternativeDates[0];
        }

        try {
            // Publier un événement pour informer que le conflit a été résolu
            eventBus.publish('conflict.resolved', {
                conflictId,
                resolution
            });

            // Mettre à jour l'état local du conflit résolu
            setConflictsWithRecommendations(prev =>
                prev.map(c => {
                    if (c.id === conflictId) {
                        return {
                            ...c,
                            resolved: true,
                            resolutionComment: resolution.comment,
                            recommendation: c.recommendation ? {
                                ...c.recommendation,
                                resolutionStatus: 'APPLIED',
                                appliedStrategy: strategy,
                                resolutionData: resolution
                            } : undefined
                        };
                    }
                    return c;
                })
            );

            // Appeler la méthode de résolution du hook de détection de conflit
            conflictDetection.resolveConflict(conflictId);

            return resolution;
        } catch (error) {
            logger.error(`Erreur lors de l'application de la stratégie pour le conflit ${conflictId}:`, error);
            return null;
        }
    }, [conflictsWithRecommendations, userId, eventBus, t]);

    // Rejeter une recommandation
    const rejectRecommendation = useCallback((
        conflictId: string,
        reason?: string
    ): void => {
        // Mettre à jour l'état local pour marquer la recommandation comme rejetée
        setConflictsWithRecommendations(prev =>
            prev.map(c => {
                if (c.id === conflictId && c.recommendation) {
                    return {
                        ...c,
                        recommendation: {
                            ...c.recommendation,
                            resolutionStatus: 'REJECTED',
                            explanation: reason
                                ? `${c.recommendation.explanation}\nRejeté: ${reason}`
                                : c.recommendation.explanation
                        }
                    };
                }
                return c;
            })
        );

        // Publier un événement pour informer que la recommandation a été rejetée
        eventBus.publish('conflict.recommendation.rejected', {
            conflictId,
            reason
        });
    }, [eventBus]);

    // Appliquer toutes les résolutions automatiques disponibles
    const applyAllAutomaticResolutions = useCallback(async (): Promise<number> => {
        const automaticConflicts = getConflictsWithAutomaticResolutions();
        let appliedCount = 0;

        for (const conflict of automaticConflicts) {
            if (conflict.id && conflict.recommendation?.resolutionStatus === 'PENDING') {
                const success = await applyRecommendedStrategy(conflict.id, conflict.recommendation.strategies[0].strategy);
                if (success) {
                    appliedCount++;
                }
            }
        }

        return appliedCount;
    }, [getConflictsWithAutomaticResolutions, applyRecommendedStrategy]);

    // Obtenir la meilleure recommandation pour un conflit
    const getTopRecommendation = useCallback((conflictId: string) => {
        const conflict = conflictsWithRecommendations.find(c => c.id === conflictId);

        if (!conflict || !conflict.recommendation || conflict.recommendation.strategies.length === 0) {
            return null;
        }

        // Trier les stratégies par confiance décroissante et retourner la meilleure
        return [...conflict.recommendation.strategies].sort(
            (a, b) => b.confidence - a.confidence
        )[0];
    }, [conflictsWithRecommendations]);

    // Générer des recommandations pour les conflits
    const generateRecommendations = useCallback(async () => {
        if (!conflicts.length || !leaveRequest) {
            setRecommendations([]);
            setAutomatedResolutionsCount(0);
            setManualResolutionsCount(0);
            setHighestPriorityConflicts([]);
            return;
        }

        try {
            setRecommendationsLoading(true);
            setRecommendationsError(null);

            const service = recommendationService;
            const result = service.analyzeConflicts(conflicts, leaveRequest, user, departmentId);

            setRecommendations(result.recommendations);
            setAutomatedResolutionsCount(result.automatedResolutionsCount);
            setManualResolutionsCount(result.manualResolutionsCount);
            setHighestPriorityConflicts(result.highestPriorityConflicts);

            if (onRecommendationsGenerated) {
                onRecommendationsGenerated(result);
            }
        } catch (error) {
            logger.error('Erreur lors de la génération des recommandations:', error);
            setRecommendationsError(error instanceof Error ? error : new Error(String(error)));
        } finally {
            setRecommendationsLoading(false);
        }
    }, [conflicts, leaveRequest, user, departmentId, recommendationService, onRecommendationsGenerated]);

    // Appliquer une résolution de conflit
    const applyResolution = useCallback(async (resolution: ConflictResolution): Promise<boolean> => {
        try {
            // Dans une implémentation réelle, envoyer la résolution au backend
            logger.info('Applying resolution:', resolution);

            // Mettre à jour l'état local pour refléter la résolution
            setConflictsWithRecommendations(prevConflicts =>
                prevConflicts.map(c => {
                    if (c.id === resolution.conflictId) {
                        return {
                            ...c,
                            resolved: true,
                            resolutionComment: resolution.comment,
                            recommendation: c.recommendation ? {
                                ...c.recommendation,
                                resolutionStatus: 'APPLIED',
                                resolutionData: resolution,
                                appliedStrategy: resolution.resolution === 'APPROVED'
                                    ? ResolutionStrategy.APPROVE
                                    : resolution.resolution === 'REJECTED'
                                        ? ResolutionStrategy.REJECT
                                        : ResolutionStrategy.MANUAL
                            } : undefined
                        };
                    }
                    return c;
                })
            );

            return true;
        } catch (error) {
            logger.error('Erreur lors de l\'application de la résolution:', error);
            return false;
        }
    }, []);

    // Générer les recommandations lors du montage ou lorsque les conflits/demande changent
    useEffect(() => {
        generateRecommendations();
    }, [generateRecommendations]);

    return {
        ...conflictDetection,
        conflicts: conflictsWithRecommendations,
        checkConflicts,
        analysisResult,
        hasAutomaticResolutions,
        pendingAutomaticResolutions,
        applyRecommendedStrategy,
        rejectRecommendation,
        applyAllAutomaticResolutions,
        getTopRecommendation,
        recommendations,
        automatedResolutionsCount,
        manualResolutionsCount,
        highestPriorityConflicts,
        recommendationsLoading,
        recommendationsError,
        generateRecommendations,
        applyResolution
    };
}; 