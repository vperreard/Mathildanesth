import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { format, formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Alert,
    AlertTitle,
    AlertDescription
} from '@/components/ui/alert';
import {
    AlertTriangle,
    AlertCircle,
    Calendar,
    ChevronDown,
    ChevronUp,
    X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    RiskPeriodDetectionService,
    RiskPeriod,
    RiskLevel
} from '../../services/riskPeriodDetectionService';
import { ConflictType } from '../../types/conflict';
import { parseDate } from '@/utils/dateUtils';

interface RiskPeriodAlertProps {
    onDismiss?: (periodId: string) => void;
    onShowDetails?: (period: RiskPeriod) => void;
    maxAlerts?: number;
    showCurrent?: boolean;
    showUpcoming?: boolean;
    daysAhead?: number;
    minRiskLevel?: RiskLevel;
}

export const RiskPeriodAlert: React.FC<RiskPeriodAlertProps> = ({
    onDismiss,
    onShowDetails,
    maxAlerts = 3,
    showCurrent = true,
    showUpcoming = true,
    daysAhead = 30,
    minRiskLevel = RiskLevel.MEDIUM
}) => {
    const { t } = useTranslation('leaves');
    const [currentPeriods, setCurrentPeriods] = useState<RiskPeriod[]>([]);
    const [upcomingPeriods, setUpcomingPeriods] = useState<RiskPeriod[]>([]);
    const [expandedPeriods, setExpandedPeriods] = useState<Record<string, boolean>>({});

    // Récupérer les périodes à risque
    useEffect(() => {
        const riskService = RiskPeriodDetectionService.getInstance();

        // Lancer une analyse pour s'assurer d'avoir les données les plus récentes
        riskService.analyzeRiskPeriods();

        // Récupérer les périodes à risque actuelles et à venir
        if (showCurrent) {
            const currentRiskPeriods = riskService.getCurrentRiskPeriods()
                .filter(period => getRiskLevelValue(period.riskLevel) >= getRiskLevelValue(minRiskLevel))
                .sort((a, b) => getRiskLevelValue(b.riskLevel) - getRiskLevelValue(a.riskLevel));

            setCurrentPeriods(currentRiskPeriods.slice(0, maxAlerts));
        }

        if (showUpcoming) {
            const upcomingRiskPeriods = riskService.getUpcomingRiskPeriods(daysAhead)
                .filter(period => getRiskLevelValue(period.riskLevel) >= getRiskLevelValue(minRiskLevel))
                .sort((a, b) => {
                    // Trier par date de début puis par niveau de risque
                    const dateComparison = parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime();
                    if (dateComparison !== 0) return dateComparison;
                    return getRiskLevelValue(b.riskLevel) - getRiskLevelValue(a.riskLevel);
                });

            setUpcomingPeriods(upcomingRiskPeriods.slice(0, maxAlerts));
        }
    }, [showCurrent, showUpcoming, maxAlerts, daysAhead, minRiskLevel]);

    // Obtenir la valeur numérique d'un niveau de risque
    const getRiskLevelValue = (level: RiskLevel): number => {
        switch (level) {
            case RiskLevel.CRITICAL:
                return 4;
            case RiskLevel.HIGH:
                return 3;
            case RiskLevel.MEDIUM:
                return 2;
            case RiskLevel.LOW:
            default:
                return 1;
        }
    };

    // Obtenir la couleur en fonction du niveau de risque
    const getRiskLevelColor = (level: RiskLevel): string => {
        switch (level) {
            case RiskLevel.CRITICAL:
                return 'bg-destructive text-destructive-foreground';
            case RiskLevel.HIGH:
                return 'bg-warning text-warning-foreground';
            case RiskLevel.MEDIUM:
                return 'bg-amber-500 text-white';
            case RiskLevel.LOW:
            default:
                return 'bg-secondary text-secondary-foreground';
        }
    };

    // Obtenir l'icône en fonction du niveau de risque
    const getRiskLevelIcon = (level: RiskLevel) => {
        switch (level) {
            case RiskLevel.CRITICAL:
            case RiskLevel.HIGH:
                return <AlertCircle className="h-5 w-5" />;
            case RiskLevel.MEDIUM:
            case RiskLevel.LOW:
            default:
                return <AlertTriangle className="h-5 w-5" />;
        }
    };

    // Gérer l'expansion des détails d'une période
    const toggleExpand = (periodId: string) => {
        setExpandedPeriods(prev => ({
            ...prev,
            [periodId]: !prev[periodId]
        }));
    };

    // Gérer le rejet d'une alerte
    const handleDismiss = (periodId: string) => {
        // Mettre à jour l'état local pour masquer l'alerte
        setCurrentPeriods(prev => prev.filter(p => p.id !== periodId));
        setUpcomingPeriods(prev => prev.filter(p => p.id !== periodId));

        // Appeler le callback onDismiss si fourni
        if (onDismiss) {
            onDismiss(periodId);
        }

        // Désactiver la période dans le service
        RiskPeriodDetectionService.getInstance().deactivateRiskPeriod(periodId);
    };

    // Obtenir le texte localisé pour un type de conflit
    const getConflictTypeText = (type: ConflictType): string => {
        return t(`conflit.type.${type.toLowerCase()}`, type);
    };

    // Formater la période de dates
    const formatDateRange = (startDate: string, endDate: string): string => {
        const start = parseDate(startDate);
        const end = parseDate(endDate);

        return `${format(start, 'dd MMM', { locale: fr })} - ${format(end, 'dd MMM yyyy', { locale: fr })}`;
    };

    // Formater la distance jusqu'à une date
    const formatDistanceToDate = (date: string): string => {
        const targetDate = parseDate(date);
        return formatDistance(targetDate, new Date(), { addSuffix: true, locale: fr });
    };

    // Calculer le pourcentage du score de risque
    const getRiskScorePercentage = (score: number): number => {
        return Math.min(100, Math.max(0, score));
    };

    // Rendre les alertes pour les périodes actuelles
    const renderCurrentAlerts = () => {
        if (!showCurrent || currentPeriods.length === 0) {
            return null;
        }

        return (
            <div className="space-y-3">
                <h4 className="text-sm font-medium">{t('alerte.risque.periodes_actuelles')}</h4>
                {currentPeriods.map(period => renderPeriodAlert(period, true))}
            </div>
        );
    };

    // Rendre les alertes pour les périodes à venir
    const renderUpcomingAlerts = () => {
        if (!showUpcoming || upcomingPeriods.length === 0) {
            return null;
        }

        return (
            <div className="space-y-3">
                <h4 className="text-sm font-medium">{t('alerte.risque.periodes_futures')}</h4>
                {upcomingPeriods.map(period => renderPeriodAlert(period, false))}
            </div>
        );
    };

    // Rendre une alerte pour une période à risque
    const renderPeriodAlert = (period: RiskPeriod, isCurrent: boolean) => {
        const isExpanded = !!expandedPeriods[period.id];

        return (
            <Alert
                key={period.id}
                variant="default"
                className={`border-l-4 border-${getRiskLevelColor(period.riskLevel).split(' ')[0].slice(3)}`}
            >
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2">
                        <div className={`p-1 rounded-full ${getRiskLevelColor(period.riskLevel)}`}>
                            {getRiskLevelIcon(period.riskLevel)}
                        </div>
                        <div>
                            <AlertTitle className="text-sm font-semibold flex items-center gap-2">
                                {isCurrent
                                    ? t('alerte.risque.periode_active')
                                    : t('alerte.risque.periode_future', { date: formatDistanceToDate(period.startDate) })}
                                <Badge className={getRiskLevelColor(period.riskLevel)}>
                                    {t(`alerte.risque.niveau.${period.riskLevel.toLowerCase()}`)}
                                </Badge>
                            </AlertTitle>
                            <AlertDescription className="text-xs mt-1">
                                <span className="font-medium">{formatDateRange(period.startDate, period.endDate)}</span> - {period.reason}
                            </AlertDescription>
                        </div>
                    </div>

                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleExpand(period.id)}
                        >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDismiss(period.id)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {isExpanded && (
                    <div className="mt-3 pt-2 border-t">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">{t('alerte.risque.score')}</span>
                                <div className="flex items-center gap-2">
                                    <Progress
                                        value={getRiskScorePercentage(period.riskScore)}
                                        className="h-2 w-24"
                                        indicatorClassName={getRiskLevelColor(period.riskLevel).split(' ')[0]}
                                    />
                                    <span className="text-xs font-medium">{Math.round(period.riskScore)}%</span>
                                </div>
                            </div>

                            <div>
                                <span className="text-xs text-muted-foreground">{t('alerte.risque.conflits_attendus')}</span>
                                <div className="mt-1 text-sm font-medium">
                                    {Math.round(period.expectedConflictCount)} {period.expectedConflictCount > 1
                                        ? t('alerte.risque.conflits')
                                        : t('alerte.risque.conflit')}
                                </div>
                            </div>

                            <div>
                                <span className="text-xs text-muted-foreground">{t('alerte.risque.types_conflits')}</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {period.conflictTypes.map(type => (
                                        <Badge key={type} variant="outline" className="text-xs">
                                            {getConflictTypeText(type)}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {period.affectedTeams.length > 0 && (
                                <div>
                                    <span className="text-xs text-muted-foreground">{t('alerte.risque.equipes_affectees')}</span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {period.affectedTeams.map(team => (
                                            <Badge key={team} variant="secondary" className="text-xs">
                                                {team}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => onShowDetails && onShowDetails(period)}
                                >
                                    {t('alerte.risque.voir_details')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Alert>
        );
    };

    // Si aucune période à risque n'est trouvée, ne rien afficher
    if (currentPeriods.length === 0 && upcomingPeriods.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            {renderCurrentAlerts()}
            {currentPeriods.length > 0 && upcomingPeriods.length > 0 && <Separator />}
            {renderUpcomingAlerts()}
        </div>
    );
}; 