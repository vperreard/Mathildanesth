import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LeaveConflict, ConflictSeverity, ConflictType } from '../types/conflict';
import { Button, Alert, Badge, Collapse, Card, CardBody } from '../../ui/components';
import { Icon } from '../../ui/components/Icon';

interface LeaveConflictAlertProps {
    conflicts: LeaveConflict[];
    onResolve?: (conflictId: string) => void;
    onIgnore?: (conflictId: string) => void;
    showDetails?: boolean;
    showActions?: boolean;
    className?: string;
}

/**
 * Composant qui affiche les alertes pour les conflits de congés détectés
 * Permet différentes actions selon le type de conflit et les permissions de l'utilisateur
 */
export const LeaveConflictAlert: React.FC<LeaveConflictAlertProps> = ({
    conflicts,
    onResolve,
    onIgnore,
    showDetails = true,
    showActions = true,
    className = ''
}) => {
    const { t } = useTranslation();
    const [expandedConflicts, setExpandedConflicts] = useState<Record<string, boolean>>({});

    // Regrouper les conflits par sévérité
    const conflictsBySeverity = useMemo(() => {
        const grouped = {
            [ConflictSeverity.BLOQUANT]: [] as LeaveConflict[],
            [ConflictSeverity.AVERTISSEMENT]: [] as LeaveConflict[],
            [ConflictSeverity.INFORMATION]: [] as LeaveConflict[]
        };

        conflicts.forEach(conflict => {
            grouped[conflict.severity].push(conflict);
        });

        return grouped;
    }, [conflicts]);

    // Fonction pour basculer l'état d'expansion d'un conflit
    const toggleExpand = (conflictId: string) => {
        setExpandedConflicts(prev => ({
            ...prev,
            [conflictId]: !prev[conflictId]
        }));
    };

    // Fonction pour obtenir l'icône selon le type de conflit
    const getConflictIcon = (type: ConflictType): string => {
        switch (type) {
            case ConflictType.USER_LEAVE_OVERLAP:
                return 'calendar-x';
            case ConflictType.TEAM_ABSENCE:
                return 'users';
            case ConflictType.CRITICAL_ROLE:
                return 'shield-alert';
            case ConflictType.DEADLINE_PROXIMITY:
                return 'clock';
            case ConflictType.HOLIDAY_PROXIMITY:
                return 'calendar-days';
            case ConflictType.RECURRING_MEETING:
                return 'video';
            case ConflictType.HIGH_WORKLOAD:
                return 'trending-up';
            default:
                return 'alert-circle';
        }
    };

    // Obtenir la couleur de la sévérité
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

    // Obtenir le texte pour la sévérité
    const getSeverityText = (severity: ConflictSeverity): string => {
        switch (severity) {
            case ConflictSeverity.BLOQUANT:
                return t('leaves.conflicts.severity.blocking');
            case ConflictSeverity.AVERTISSEMENT:
                return t('leaves.conflicts.severity.warning');
            case ConflictSeverity.INFORMATION:
                return t('leaves.conflicts.severity.info');
            default:
                return '';
        }
    };

    // Rendu d'un groupe de conflits avec une sévérité spécifique
    const renderConflictGroup = (severity: ConflictSeverity, conflictList: LeaveConflict[]) => {
        if (conflictList.length === 0) return null;

        const color = getSeverityColor(severity);
        const severityTitle = getSeverityText(severity);

        return (
            <Alert
                key={severity}
                color={color}
                className={`mb-3 ${className}`}
            >
                <div className="d-flex align-items-center mb-2">
                    <h5 className="mb-0 me-2">
                        {t('leaves.conflicts.group.title', { severity: severityTitle })}
                    </h5>
                    <Badge color={color} pill>
                        {conflictList.length}
                    </Badge>
                </div>

                {conflictList.map(conflict => renderConflictItem(conflict, color))}
            </Alert>
        );
    };

    // Rendu d'un conflit individuel
    const renderConflictItem = (conflict: LeaveConflict, color: string) => {
        const isExpanded = expandedConflicts[conflict.id] || false;
        const icon = getConflictIcon(conflict.type);

        return (
            <Card
                key={conflict.id}
                className="mb-2 conflict-card"
                style={{ borderLeft: `3px solid var(--bs-${color})` }}
            >
                <CardBody className="py-2">
                    <div
                        className="d-flex justify-content-between align-items-center cursor-pointer"
                        onClick={() => toggleExpand(conflict.id)}
                    >
                        <div className="d-flex align-items-center">
                            <Icon name={icon} className={`text-${color} me-2`} />
                            <span>{conflict.description}</span>
                        </div>
                        <div className="d-flex align-items-center">
                            {showActions && (
                                <>
                                    {conflict.canOverride && onIgnore && (
                                        <Button
                                            color="link"
                                            size="sm"
                                            className="me-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onIgnore(conflict.id);
                                            }}
                                        >
                                            {t('leaves.conflicts.actions.ignore')}
                                        </Button>
                                    )}
                                    {onResolve && (
                                        <Button
                                            color="link"
                                            size="sm"
                                            className="me-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onResolve(conflict.id);
                                            }}
                                        >
                                            {t('leaves.conflicts.actions.resolve')}
                                        </Button>
                                    )}
                                </>
                            )}
                            <Icon
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                className="ms-2"
                            />
                        </div>
                    </div>

                    {showDetails && (
                        <Collapse isOpen={isExpanded}>
                            <div className="mt-3 border-top pt-2">
                                <div className="mb-1">
                                    <strong>{t('leaves.conflicts.details.period')}:</strong> {conflict.startDate} - {conflict.endDate}
                                </div>
                                {conflict.affectedUserIds && conflict.affectedUserIds.length > 0 && (
                                    <div className="mb-1">
                                        <strong>{t('leaves.conflicts.details.affected_users')}:</strong> {conflict.affectedUserIds.length}
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
                        </Collapse>
                    )}
                </CardBody>
            </Card>
        );
    };

    // Si aucun conflit, ne rien afficher
    if (conflicts.length === 0) {
        return null;
    }

    return (
        <div className="leave-conflict-alerts">
            {renderConflictGroup(ConflictSeverity.BLOQUANT, conflictsBySeverity[ConflictSeverity.BLOQUANT])}
            {renderConflictGroup(ConflictSeverity.AVERTISSEMENT, conflictsBySeverity[ConflictSeverity.AVERTISSEMENT])}
            {renderConflictGroup(ConflictSeverity.INFORMATION, conflictsBySeverity[ConflictSeverity.INFORMATION])}
        </div>
    );
}; 