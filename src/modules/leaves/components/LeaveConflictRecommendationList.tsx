import React, { useState, useCallback } from 'react';
import { logger } from "../../../lib/logger";
import { useTranslation } from 'react-i18next';
import { LeaveConflictWithRecommendation } from '../hooks/useConflictRecommendation';
import { LeaveConflictRecommendation } from './LeaveConflictRecommendation';
import { Alert, Badge, Button, Card, CardBody, CardHeader } from '../../ui/components';
import { Icon } from '../../ui/components/Icon';
import { ConflictPriority } from '../types/recommendation';

interface LeaveConflictRecommendationListProps {
    conflicts: LeaveConflictWithRecommendation[];
    onApplyStrategy: (conflictId: string, strategyIndex: number) => Promise<boolean>;
    onRejectRecommendation: (conflictId: string, reason?: string) => void;
    onApplyAllAutomatic?: () => Promise<number>;
    onDismiss?: () => void;
    loading?: boolean;
    error?: string | null;
    showTitle?: boolean;
    className?: string;
}

/**
 * Composant qui affiche une liste de conflits avec leurs recommandations
 * et permet d'appliquer des résolutions automatiques
 */
export const LeaveConflictRecommendationList: React.FC<LeaveConflictRecommendationListProps> = ({
    conflicts,
    onApplyStrategy,
    onRejectRecommendation,
    onApplyAllAutomatic,
    onDismiss,
    loading = false,
    error = null,
    showTitle = true,
    className = ''
}) => {
    const { t } = useTranslation();
    const [isApplyingAll, setIsApplyingAll] = useState<boolean>(false);
    const [applyResults, setApplyResults] = useState<{ success: number; total: number } | null>(null);

    // Vérifier si des conflits ont des recommandations
    const hasRecommendations = conflicts.some(conflict => !!conflict.recommendation);

    // Vérifier s'il y a des recommandations automatiques
    const hasAutomaticRecommendations = conflicts.some(
        conflict => conflict.recommendation?.automaticResolution &&
            conflict.recommendation.resolutionStatus === 'PENDING'
    );

    // Nombre de recommandations automatiques
    const automaticRecommendationsCount = conflicts.filter(
        conflict => conflict.recommendation?.automaticResolution &&
            conflict.recommendation.resolutionStatus === 'PENDING'
    ).length;

    // Obtenir la priorité maximale des recommandations
    const getMaxPriority = useCallback(() => {
        let maxPriority = ConflictPriority.VERY_LOW;

        for (const conflict of conflicts) {
            if (conflict.recommendation && conflict.recommendation.priority > maxPriority) {
                maxPriority = conflict.recommendation.priority;
            }
        }

        return maxPriority;
    }, [conflicts]);

    // Priorité maximale des recommandations
    const maxPriority = getMaxPriority();

    // Obtenir la couleur de la priorité maximale
    const getPriorityColor = (priority: ConflictPriority): string => {
        switch (priority) {
            case ConflictPriority.VERY_HIGH:
                return 'danger';
            case ConflictPriority.HIGH:
                return 'warning';
            case ConflictPriority.MEDIUM:
                return 'primary';
            case ConflictPriority.LOW:
                return 'info';
            case ConflictPriority.VERY_LOW:
                return 'secondary';
            default:
                return 'secondary';
        }
    };

    // Obtenir le libellé de la priorité
    const getPriorityLabel = (priority: ConflictPriority): string => {
        switch (priority) {
            case ConflictPriority.VERY_HIGH:
                return t('leaves.recommendations.priority.very_high');
            case ConflictPriority.HIGH:
                return t('leaves.recommendations.priority.high');
            case ConflictPriority.MEDIUM:
                return t('leaves.recommendations.priority.medium');
            case ConflictPriority.LOW:
                return t('leaves.recommendations.priority.low');
            case ConflictPriority.VERY_LOW:
                return t('leaves.recommendations.priority.very_low');
            default:
                return '';
        }
    };

    // Gérer l'application de toutes les recommandations automatiques
    const handleApplyAllAutomatic = async () => {
        if (!onApplyAllAutomatic) return;

        setIsApplyingAll(true);
        setApplyResults(null);

        try {
            const successCount = await onApplyAllAutomatic();
            setApplyResults({
                success: successCount,
                total: automaticRecommendationsCount
            });
        } catch (error) {
            logger.error('Erreur lors de l\'application des recommandations automatiques:', error);
        } finally {
            setIsApplyingAll(false);
        }
    };

    // Si pas de conflits, ne rien afficher
    if (conflicts.length === 0) {
        return null;
    }

    return (
        <Card className={`leave-conflict-recommendation-list ${className}`}>
            {showTitle && (
                <CardHeader className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                        <Icon name="alert-triangle" className="me-2 text-warning" />
                        <h5 className="mb-0">
                            {t('leaves.recommendations.list_title', {
                                count: conflicts.length
                            })}
                        </h5>
                        {maxPriority >= ConflictPriority.HIGH && (
                            <Badge
                                color={getPriorityColor(maxPriority)}
                                className="ms-2"
                            >
                                {getPriorityLabel(maxPriority)}
                            </Badge>
                        )}
                    </div>

                    <div className="d-flex">
                        {hasAutomaticRecommendations && onApplyAllAutomatic && (
                            <Button
                                color="success"
                                size="sm"
                                className="me-2"
                                disabled={isApplyingAll || loading}
                                onClick={handleApplyAllAutomatic}
                            >
                                {isApplyingAll ? (
                                    <>
                                        <Icon name="loader" className="spin me-1" />
                                        {t('leaves.recommendations.applying')}
                                    </>
                                ) : (
                                    <>
                                        <Icon name="zap" className="me-1" />
                                        {t('leaves.recommendations.apply_all_auto', {
                                            count: automaticRecommendationsCount
                                        })}
                                    </>
                                )}
                            </Button>
                        )}

                        {onDismiss && (
                            <Button
                                color="outline-secondary"
                                size="sm"
                                onClick={onDismiss}
                            >
                                <Icon name="x" />
                            </Button>
                        )}
                    </div>
                </CardHeader>
            )}

            <CardBody>
                {/* Message d'erreur */}
                {error && (
                    <Alert color="danger" className="mb-3">
                        <Icon name="alert-circle" className="me-2" />
                        {error}
                    </Alert>
                )}

                {/* Résultats de l'application automatique */}
                {applyResults && (
                    <Alert
                        color={applyResults.success === applyResults.total ? 'success' : 'warning'}
                        className="mb-3"
                    >
                        <Icon
                            name={applyResults.success === applyResults.total ? 'check-circle' : 'alert-triangle'}
                            className="me-2"
                        />
                        {t('leaves.recommendations.auto_apply_results', {
                            success: applyResults.success,
                            total: applyResults.total
                        })}
                    </Alert>
                )}

                {/* Message de chargement */}
                {loading && (
                    <div className="text-center py-3">
                        <Icon name="loader" className="spin mb-2" size={32} />
                        <p>{t('leaves.recommendations.loading')}</p>
                    </div>
                )}

                {/* Pas de recommandations */}
                {!loading && !hasRecommendations && (
                    <Alert color="info">
                        <Icon name="info" className="me-2" />
                        {t('leaves.recommendations.no_recommendations_available')}
                    </Alert>
                )}

                {/* Liste des conflits avec recommandations */}
                {!loading && conflicts.map(conflict => (
                    <LeaveConflictRecommendation
                        key={conflict.id}
                        conflict={conflict}
                        onApplyStrategy={onApplyStrategy}
                        onRejectRecommendation={onRejectRecommendation}
                        showDetails={true}
                        showActions={true}
                    />
                ))}
            </CardBody>
        </Card>
    );
}; 