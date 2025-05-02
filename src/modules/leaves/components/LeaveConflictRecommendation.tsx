import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    LeaveConflict,
    ConflictSeverity,
    ConflictType
} from '../types/conflict';
import {
    ConflictRecommendation,
    ConflictPriority,
    ResolutionStrategy
} from '../types/recommendation';
import {
    Alert,
    Badge,
    Button,
    Card,
    CardBody,
    Collapse,
    Tooltip,
    ListGroup,
    ListGroupItem,
    Progress
} from '../../ui/components';
import { Icon } from '../../ui/components/Icon';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { parseDate } from '../../../utils/dateUtils';
import { Tag } from '../../ui/components/Tag';

interface ConflictWithRecommendation extends LeaveConflict {
    recommendation?: ConflictRecommendation;
}

interface LeaveConflictRecommendationProps {
    conflict: ConflictWithRecommendation;
    onApplyStrategy: (conflictId: string, strategyIndex: number) => Promise<boolean>;
    onRejectRecommendation: (conflictId: string, reason?: string) => void;
    showDetails?: boolean;
    showActions?: boolean;
    className?: string;
}

/**
 * Composant qui affiche les recommandations pour un conflit de congés
 * Permet d'appliquer une stratégie de résolution recommandée
 */
export const LeaveConflictRecommendation: React.FC<LeaveConflictRecommendationProps> = ({
    conflict,
    onApplyStrategy,
    onRejectRecommendation,
    showDetails = true,
    showActions = true,
    className = ''
}) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [isApplying, setIsApplying] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState<string>('');
    const [showRejectForm, setShowRejectForm] = useState<boolean>(false);

    // Vérifier si le conflit a une recommandation
    const hasRecommendation = !!conflict.recommendation;

    // Obtenir la couleur de la sévérité du conflit
    const getSeverityColor = (severity: ConflictSeverity): string => {
        switch (severity) {
            case ConflictSeverity.BLOQUANT:
                return 'danger';
            case ConflictSeverity.AVERTISSEMENT:
                return 'warning';
            case ConflictSeverity.INFORMATION:
                return 'info';
            default:
                return 'secondary';
        }
    };

    // Obtenir la couleur de la priorité de la recommandation
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
                return t('leaves.recommendations.priority.unknown');
        }
    };

    // Obtenir l'icône pour la stratégie de résolution
    const getStrategyIcon = (strategy: ResolutionStrategy): string => {
        switch (strategy) {
            case ResolutionStrategy.APPROVE:
                return 'check-circle';
            case ResolutionStrategy.REJECT:
                return 'x-circle';
            case ResolutionStrategy.RESCHEDULE_BEFORE:
                return 'arrow-left';
            case ResolutionStrategy.RESCHEDULE_AFTER:
                return 'arrow-right';
            case ResolutionStrategy.SHORTEN:
                return 'minimize-2';
            case ResolutionStrategy.SPLIT:
                return 'scissors';
            case ResolutionStrategy.SWAP:
                return 'repeat';
            case ResolutionStrategy.REASSIGN:
                return 'user-plus';
            case ResolutionStrategy.MANUAL:
                return 'edit';
            default:
                return 'help-circle';
        }
    };

    // Obtenir le libellé de la stratégie
    const getStrategyLabel = (strategy: ResolutionStrategy): string => {
        switch (strategy) {
            case ResolutionStrategy.APPROVE:
                return t('leaves.recommendations.strategy.approve');
            case ResolutionStrategy.REJECT:
                return t('leaves.recommendations.strategy.reject');
            case ResolutionStrategy.RESCHEDULE_BEFORE:
                return t('leaves.recommendations.strategy.reschedule_before');
            case ResolutionStrategy.RESCHEDULE_AFTER:
                return t('leaves.recommendations.strategy.reschedule_after');
            case ResolutionStrategy.SHORTEN:
                return t('leaves.recommendations.strategy.shorten');
            case ResolutionStrategy.SPLIT:
                return t('leaves.recommendations.strategy.split');
            case ResolutionStrategy.SWAP:
                return t('leaves.recommendations.strategy.swap');
            case ResolutionStrategy.REASSIGN:
                return t('leaves.recommendations.strategy.reassign');
            case ResolutionStrategy.MANUAL:
                return t('leaves.recommendations.strategy.manual');
            default:
                return t('leaves.recommendations.strategy.unknown');
        }
    };

    // Gérer l'application d'une stratégie
    const handleApplyStrategy = async (strategyIndex: number) => {
        setIsApplying(true);
        setErrorMessage(null);

        try {
            const success = await onApplyStrategy(conflict.id, strategyIndex);
            if (!success) {
                setErrorMessage(t('leaves.recommendations.error.apply_failed'));
            }
        } catch (error) {
            console.error('Erreur lors de l\'application de la stratégie:', error);
            setErrorMessage(t('leaves.recommendations.error.apply_failed'));
        } finally {
            setIsApplying(false);
        }
    };

    // Gérer le rejet d'une recommandation
    const handleRejectRecommendation = () => {
        onRejectRecommendation(conflict.id, rejectReason);
        setShowRejectForm(false);
        setRejectReason('');
    };

    // Obtenir la meilleure stratégie recommandée
    const bestStrategy = useMemo(() => {
        if (!conflict.recommendation || conflict.recommendation.strategies.length === 0) {
            return null;
        }

        // Trier par confiance et prendre la meilleure
        return [...conflict.recommendation.strategies]
            .sort((a, b) => b.confidence - a.confidence)[0];
    }, [conflict.recommendation]);

    // Si pas de recommandation, ne rien afficher ou un message
    if (!hasRecommendation && !showDetails) {
        return null;
    }

    // Couleur du conflit basée sur sa sévérité
    const conflictColor = getSeverityColor(conflict.severity);

    return (
        <Card className={`mb-3 conflict-recommendation ${className}`}>
            <CardBody>
                {/* En-tête du conflit avec description et bouton d'expansion */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                        <Icon name="alert-circle" className={`text-${conflictColor} me-2`} />
                        <h5 className="mb-0">{conflict.description}</h5>
                    </div>
                    <div className="d-flex align-items-center">
                        {hasRecommendation && (
                            <Badge
                                color={getPriorityColor(conflict.recommendation!.priority)}
                                className="me-2"
                            >
                                {getPriorityLabel(conflict.recommendation!.priority)}
                            </Badge>
                        )}
                        <Button
                            color="link"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} />
                        </Button>
                    </div>
                </div>

                {/* Informations basiques toujours visibles */}
                <div className="d-flex flex-wrap mb-2">
                    <div className="me-3 mb-1">
                        <strong>{t('leaves.conflicts.details.period')}:</strong>{' '}
                        {format(parseDate(conflict.startDate), 'dd/MM/yyyy', { locale: fr })} - {format(parseDate(conflict.endDate), 'dd/MM/yyyy', { locale: fr })}
                    </div>
                    <div className="me-3 mb-1">
                        <strong>{t('leaves.conflicts.type')}:</strong>{' '}
                        <Tag color={conflictColor}>{conflict.type}</Tag>
                    </div>
                    {hasRecommendation && conflict.recommendation!.automaticResolution && (
                        <div className="mb-1">
                            <Tag color="success">{t('leaves.recommendations.automatic_resolution')}</Tag>
                        </div>
                    )}
                </div>

                {/* Message d'erreur */}
                {errorMessage && (
                    <Alert color="danger" className="mt-2 mb-2">
                        {errorMessage}
                    </Alert>
                )}

                {/* Contenu détaillé en mode expansion */}
                <Collapse isOpen={isExpanded}>
                    <div className="mt-3 border-top pt-3">
                        {/* Détails du conflit */}
                        {showDetails && (
                            <div className="mb-3">
                                <h6>{t('leaves.conflicts.details.title')}</h6>
                                <div className="mb-1">
                                    <strong>{t('leaves.conflicts.details.severity')}:</strong>{' '}
                                    <Badge color={conflictColor}>{conflict.severity}</Badge>
                                </div>
                                {conflict.affectedUserIds && conflict.affectedUserIds.length > 0 && (
                                    <div className="mb-1">
                                        <strong>{t('leaves.conflicts.details.affected_users')}:</strong>{' '}
                                        {conflict.affectedUserIds.length}
                                    </div>
                                )}
                                {conflict.metadata && Object.keys(conflict.metadata).length > 0 && (
                                    <div className="mb-1">
                                        <strong>{t('leaves.conflicts.details.additional_info')}:</strong>
                                        <ul className="mt-1 mb-0">
                                            {Object.entries(conflict.metadata).map(([key, value]) => (
                                                <li key={key}>{key}: {JSON.stringify(value)}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Section des recommandations */}
                        {hasRecommendation && (
                            <div className="mb-3">
                                <h6>{t('leaves.recommendations.title')}</h6>
                                <p>{conflict.recommendation!.explanation}</p>

                                {/* Liste des stratégies recommandées */}
                                <ListGroup className="mt-3">
                                    {conflict.recommendation!.strategies.map((strategy, index) => (
                                        <ListGroupItem
                                            key={index}
                                            className={`d-flex justify-content-between align-items-center ${index === 0 ? 'border-primary' : ''}`}
                                            style={{ borderLeftWidth: index === 0 ? '3px' : '1px' }}
                                        >
                                            <div>
                                                <div className="d-flex align-items-center">
                                                    <Icon
                                                        name={getStrategyIcon(strategy.strategy)}
                                                        className="me-2 text-primary"
                                                    />
                                                    <strong>{getStrategyLabel(strategy.strategy)}</strong>
                                                    {index === 0 && (
                                                        <Badge color="primary" pill className="ms-2">
                                                            {t('leaves.recommendations.recommended')}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="mb-1 text-muted">{strategy.description}</p>

                                                {/* Dates alternatives */}
                                                {strategy.alternativeDates && strategy.alternativeDates.length > 0 && (
                                                    <div className="mt-1 small">
                                                        <strong>{t('leaves.recommendations.alternative_dates')}:</strong>
                                                        <ul className="list-unstyled ms-3 mb-0">
                                                            {strategy.alternativeDates.map((dates, dateIndex) => (
                                                                <li key={dateIndex}>
                                                                    {format(parseDate(dates.startDate), 'dd/MM/yyyy', { locale: fr })} - {format(parseDate(dates.endDate), 'dd/MM/yyyy', { locale: fr })}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Actions supplémentaires */}
                                                {strategy.additionalActions && strategy.additionalActions.length > 0 && (
                                                    <div className="mt-1 small">
                                                        <strong>{t('leaves.recommendations.additional_actions')}:</strong>
                                                        <ul className="list-unstyled ms-3 mb-0">
                                                            {strategy.additionalActions.map((action, actionIndex) => (
                                                                <li key={actionIndex}>{action}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="d-flex flex-column align-items-end">
                                                {/* Niveau de confiance */}
                                                <div className="mb-2 text-end">
                                                    <Tooltip
                                                        title={t('leaves.recommendations.confidence_tooltip')}
                                                        placement="top"
                                                    >
                                                        <div className="d-flex align-items-center">
                                                            <small className="me-2">{t('leaves.recommendations.confidence')}: {strategy.confidence}%</small>
                                                            <Progress
                                                                value={strategy.confidence}
                                                                max={100}
                                                                color={strategy.confidence > 80 ? 'success' :
                                                                    strategy.confidence > 50 ? 'primary' : 'warning'}
                                                                style={{ width: '80px', height: '8px' }}
                                                            />
                                                        </div>
                                                    </Tooltip>
                                                </div>

                                                {/* Bouton d'application */}
                                                {showActions && conflict.recommendation!.resolutionStatus !== 'APPLIED' && (
                                                    <Button
                                                        color="primary"
                                                        size="sm"
                                                        disabled={isApplying}
                                                        onClick={() => handleApplyStrategy(index)}
                                                    >
                                                        {isApplying ? (
                                                            <>
                                                                <Icon name="loader" className="spin me-1" />
                                                                {t('common.loading')}
                                                            </>
                                                        ) : (
                                                            t('leaves.recommendations.apply')
                                                        )}
                                                    </Button>
                                                )}

                                                {/* État de la résolution */}
                                                {conflict.recommendation!.resolutionStatus === 'APPLIED' &&
                                                    conflict.recommendation!.appliedStrategy === strategy.strategy && (
                                                        <Badge color="success">
                                                            <Icon name="check" className="me-1" />
                                                            {t('leaves.recommendations.applied')}
                                                        </Badge>
                                                    )}
                                            </div>
                                        </ListGroupItem>
                                    ))}
                                </ListGroup>

                                {/* Actions pour la recommandation */}
                                {showActions && conflict.recommendation!.resolutionStatus === 'PENDING' && (
                                    <div className="mt-3 d-flex justify-content-between">
                                        {/* Bouton d'application rapide de la meilleure stratégie */}
                                        {bestStrategy && (
                                            <Button
                                                color="success"
                                                disabled={isApplying}
                                                onClick={() => handleApplyStrategy(0)}
                                            >
                                                <Icon name="check-circle" className="me-1" />
                                                {t('leaves.recommendations.apply_recommended')}
                                            </Button>
                                        )}

                                        {/* Bouton de rejet */}
                                        <Button
                                            color="outline-danger"
                                            onClick={() => setShowRejectForm(!showRejectForm)}
                                        >
                                            <Icon name="x-circle" className="me-1" />
                                            {t('leaves.recommendations.reject')}
                                        </Button>
                                    </div>
                                )}

                                {/* Formulaire de rejet */}
                                {showRejectForm && (
                                    <div className="mt-3 p-3 border rounded">
                                        <h6>{t('leaves.recommendations.reject_reason')}</h6>
                                        <textarea
                                            className="form-control mb-2"
                                            rows={2}
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            placeholder={t('leaves.recommendations.reject_reason_placeholder')}
                                        />
                                        <div className="d-flex justify-content-end">
                                            <Button
                                                color="secondary"
                                                size="sm"
                                                className="me-2"
                                                onClick={() => setShowRejectForm(false)}
                                            >
                                                {t('common.cancel')}
                                            </Button>
                                            <Button
                                                color="danger"
                                                size="sm"
                                                onClick={handleRejectRecommendation}
                                            >
                                                {t('leaves.recommendations.confirm_reject')}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* État de la recommandation */}
                                {conflict.recommendation!.resolutionStatus === 'APPLIED' && (
                                    <Alert color="success" className="mt-3">
                                        <Icon name="check-circle" className="me-2" />
                                        {t('leaves.recommendations.status.applied')}
                                    </Alert>
                                )}

                                {conflict.recommendation!.resolutionStatus === 'REJECTED' && (
                                    <Alert color="danger" className="mt-3">
                                        <Icon name="x-circle" className="me-2" />
                                        {t('leaves.recommendations.status.rejected')}
                                    </Alert>
                                )}
                            </div>
                        )}

                        {/* Message si pas de recommandation */}
                        {!hasRecommendation && showDetails && (
                            <Alert color="info">
                                <Icon name="info" className="me-2" />
                                {t('leaves.recommendations.no_recommendations')}
                            </Alert>
                        )}
                    </div>
                </Collapse>

                {/* Bouton rapide si non-expanded mais avec recommandations automatiques */}
                {!isExpanded && hasRecommendation && conflict.recommendation!.automaticResolution &&
                    conflict.recommendation!.resolutionStatus === 'PENDING' && showActions && (
                        <div className="mt-2">
                            <Button
                                color="primary"
                                size="sm"
                                disabled={isApplying}
                                onClick={() => handleApplyStrategy(0)}
                            >
                                <Icon name="zap" className="me-1" />
                                {t('leaves.recommendations.apply_auto_resolution')}
                            </Button>
                        </div>
                    )}
            </CardBody>
        </Card>
    );
}; 