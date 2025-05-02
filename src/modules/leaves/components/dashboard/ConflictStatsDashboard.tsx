import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import {
    AlertCircle,
    AlertTriangle,
    Info,
    Calendar,
    Users,
    TrendingUp,
    Clock
} from 'lucide-react';
import { LeaveConflict } from '../../types/conflict';
import { ConflictType, ConflictSeverity } from '../../types/conflict';
import { RiskPeriod, RiskLevel } from '../../services/riskPeriodDetectionService';
import { formatDate } from '@/utils/dateUtils';
import { addDays, format, eachMonthOfInterval, subMonths, addMonths, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ConflictStatsDashboardProps {
    conflicts?: LeaveConflict[];
    riskPeriods?: RiskPeriod[];
    timeRange?: '30days' | '90days' | '180days' | '365days';
    onRiskPeriodClick?: (period: RiskPeriod) => void;
    onConflictTypeClick?: (type: ConflictType) => void;
    loading?: boolean;
}

export const ConflictStatsDashboard: React.FC<ConflictStatsDashboardProps> = ({
    conflicts = [],
    riskPeriods = [],
    timeRange = '90days',
    onRiskPeriodClick,
    onConflictTypeClick,
    loading = false
}) => {
    const { t } = useTranslation('leaves');
    const [selectedTimeRange, setSelectedTimeRange] = useState<string>(timeRange);
    const [activeTab, setActiveTab] = useState<string>('overview');

    // Données transformées pour les graphiques
    const [severityStats, setSeverityStats] = useState<any[]>([]);
    const [typeStats, setTypeStats] = useState<any[]>([]);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [riskDistribution, setRiskDistribution] = useState<any[]>([]);
    const [upcomingRisks, setUpcomingRisks] = useState<RiskPeriod[]>([]);

    // Calculer les statistiques lors du chargement ou changement de données
    useEffect(() => {
        if (conflicts.length > 0) {
            calculateSeverityStats();
            calculateTypeStats();
            calculateTrendData();
        }

        if (riskPeriods.length > 0) {
            calculateRiskDistribution();
            identifyUpcomingRisks();
        }
    }, [conflicts, riskPeriods, selectedTimeRange]);

    // Calculer les statistiques par sévérité
    const calculateSeverityStats = () => {
        const stats = [
            {
                name: t('conflit.severite.bloquant'),
                value: conflicts.filter(c => c.severity === ConflictSeverity.BLOQUANT).length,
                color: '#ef4444' // Rouge pour bloquant
            },
            {
                name: t('conflit.severite.avertissement'),
                value: conflicts.filter(c => c.severity === ConflictSeverity.AVERTISSEMENT).length,
                color: '#f59e0b' // Orange pour avertissement
            },
            {
                name: t('conflit.severite.information'),
                value: conflicts.filter(c => c.severity === ConflictSeverity.INFORMATION).length,
                color: '#3b82f6' // Bleu pour information
            }
        ];

        setSeverityStats(stats);
    };

    // Calculer les statistiques par type de conflit
    const calculateTypeStats = () => {
        // Créer un objet avec tous les types de conflit initialisés à 0
        const typeCount: Record<string, number> = {};

        // Initialiser les compteurs pour chaque type de conflit trouvé
        conflicts.forEach(conflict => {
            if (!typeCount[conflict.type]) {
                typeCount[conflict.type] = 0;
            }
            typeCount[conflict.type]++;
        });

        const stats = Object.entries(typeCount).map(([type, count]) => ({
            name: t(`conflit.type.${type.toLowerCase()}`),
            value: count,
            type: type
        }));

        setTypeStats(stats.sort((a, b) => b.value - a.value));
    };

    // Calculer les données de tendance sur la période
    const calculateTrendData = () => {
        const now = new Date();
        let startDate;

        // Déterminer la période de temps
        switch (selectedTimeRange) {
            case '30days':
                startDate = subMonths(now, 1);
                break;
            case '180days':
                startDate = subMonths(now, 6);
                break;
            case '365days':
                startDate = subMonths(now, 12);
                break;
            case '90days':
            default:
                startDate = subMonths(now, 3);
        }

        // Générer les mois de l'intervalle
        const months = eachMonthOfInterval({ start: startDate, end: now });

        // Initialiser les données de tendance
        const trend = months.map(month => {
            const monthStr = format(month, 'yyyy-MM');
            return {
                month: format(month, 'MMM yyyy', { locale: fr }),
                bloquant: 0,
                avertissement: 0,
                information: 0,
                total: 0,
                monthKey: monthStr
            };
        });

        // Remplir avec les données réelles
        conflicts.forEach(conflict => {
            const conflictDate = new Date(conflict.startDate);
            const monthStr = format(conflictDate, 'yyyy-MM');

            const monthData = trend.find(item => item.monthKey === monthStr);
            if (monthData) {
                switch (conflict.severity) {
                    case ConflictSeverity.BLOQUANT:
                        monthData.bloquant++;
                        break;
                    case ConflictSeverity.AVERTISSEMENT:
                        monthData.avertissement++;
                        break;
                    case ConflictSeverity.INFORMATION:
                        monthData.information++;
                        break;
                }
                monthData.total++;
            }
        });

        setTrendData(trend);
    };

    // Calculer la distribution des risques
    const calculateRiskDistribution = () => {
        const distribution = [
            {
                name: t('alerte.risque.niveau.critical'),
                value: riskPeriods.filter(rp => rp.riskLevel === RiskLevel.CRITICAL).length,
                color: '#ef4444' // Rouge pour critique
            },
            {
                name: t('alerte.risque.niveau.high'),
                value: riskPeriods.filter(rp => rp.riskLevel === RiskLevel.HIGH).length,
                color: '#f59e0b' // Orange pour élevé
            },
            {
                name: t('alerte.risque.niveau.medium'),
                value: riskPeriods.filter(rp => rp.riskLevel === RiskLevel.MEDIUM).length,
                color: '#f97316' // Ambre pour moyen
            },
            {
                name: t('alerte.risque.niveau.low'),
                value: riskPeriods.filter(rp => rp.riskLevel === RiskLevel.LOW).length,
                color: '#6b7280' // Gris pour faible
            }
        ];

        setRiskDistribution(distribution);
    };

    // Identifier les périodes à risque à venir
    const identifyUpcomingRisks = () => {
        const today = new Date();
        const futureDate = addDays(today, 60); // Regarder 60 jours en avant

        const upcoming = riskPeriods
            .filter(period => {
                const startDate = parseISO(period.startDate);
                return startDate > today && startDate <= futureDate && period.isActive;
            })
            .sort((a, b) => {
                // Trier d'abord par date de début
                const dateA = parseISO(a.startDate);
                const dateB = parseISO(b.startDate);
                const dateDiff = dateA.getTime() - dateB.getTime();

                if (dateDiff !== 0) return dateDiff;

                // En cas d'égalité, trier par niveau de risque (du plus élevé au plus faible)
                const riskLevelValues = {
                    [RiskLevel.CRITICAL]: 4,
                    [RiskLevel.HIGH]: 3,
                    [RiskLevel.MEDIUM]: 2,
                    [RiskLevel.LOW]: 1
                };

                return riskLevelValues[b.riskLevel] - riskLevelValues[a.riskLevel];
            });

        setUpcomingRisks(upcoming.slice(0, 5)); // Limiter aux 5 prochaines périodes
    };

    // Obtenir la couleur d'un badge selon le niveau de risque
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

    // Formater une plage de dates
    const formatDateRange = (startDate: string, endDate: string): string => {
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        return `${format(start, 'dd MMM', { locale: fr })} - ${format(end, 'dd MMM yyyy', { locale: fr })}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{t('dashboard.titre')}</h2>

                <div className="flex gap-2">
                    <Select
                        value={selectedTimeRange}
                        onValueChange={setSelectedTimeRange}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t('dashboard.periode')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30days">{t('dashboard.periode_30jours')}</SelectItem>
                            <SelectItem value="90days">{t('dashboard.periode_90jours')}</SelectItem>
                            <SelectItem value="180days">{t('dashboard.periode_180jours')}</SelectItem>
                            <SelectItem value="365days">{t('dashboard.periode_365jours')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Carte de statistiques sur les conflits */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            {t('dashboard.total_conflits')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{conflicts.length}</div>
                        <div className="flex gap-2 mt-2">
                            <Badge className="bg-destructive">{severityStats.find(s => s.name === t('conflit.severite.bloquant'))?.value || 0} {t('conflit.severite.bloquant')}</Badge>
                            <Badge className="bg-warning">{severityStats.find(s => s.name === t('conflit.severite.avertissement'))?.value || 0} {t('conflit.severite.avertissement')}</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Carte de statistiques sur les périodes à risque */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-warning" />
                            {t('dashboard.periodes_risque')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{riskPeriods.filter(rp => rp.isActive).length}</div>
                        <div className="flex gap-2 mt-2">
                            <Badge className="bg-destructive">{riskDistribution.find(r => r.name === t('alerte.risque.niveau.critical'))?.value || 0} {t('alerte.risque.niveau.critical')}</Badge>
                            <Badge className="bg-warning">{riskDistribution.find(r => r.name === t('alerte.risque.niveau.high'))?.value || 0} {t('alerte.risque.niveau.high')}</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Carte du taux de résolution */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            {t('dashboard.taux_resolution')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {Math.round((conflicts.filter(c => c.resolved).length / (conflicts.length || 1)) * 100)}%
                        </div>
                        <Progress
                            className="h-2 mt-2"
                            value={(conflicts.filter(c => c.resolved).length / (conflicts.length || 1)) * 100}
                        />
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                    <TabsTrigger value="overview">{t('dashboard.vue_ensemble')}</TabsTrigger>
                    <TabsTrigger value="details">{t('dashboard.details')}</TabsTrigger>
                    <TabsTrigger value="upcoming">{t('dashboard.periodes_venir')}</TabsTrigger>
                </TabsList>

                {/* Onglet Vue d'ensemble */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Répartition des conflits par sévérité */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('dashboard.repartition_severite')}</CardTitle>
                            </CardHeader>
                            <CardContent className="h-72">
                                {severityStats.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={severityStats}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {severityStats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        {t('dashboard.aucune_donnee')}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Tendance des conflits sur la période */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('dashboard.tendance_conflits')}</CardTitle>
                            </CardHeader>
                            <CardContent className="h-72">
                                {trendData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={trendData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="total"
                                                stroke="#6b7280"
                                                strokeWidth={2}
                                                name={t('dashboard.total')}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="bloquant"
                                                stroke="#ef4444"
                                                name={t('conflit.severite.bloquant')}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="avertissement"
                                                stroke="#f59e0b"
                                                name={t('conflit.severite.avertissement')}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        {t('dashboard.aucune_donnee')}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Distribution des types de conflits */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('dashboard.types_conflits')}</CardTitle>
                        </CardHeader>
                        <CardContent className="h-72">
                            {typeStats.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={typeStats}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar
                                            dataKey="value"
                                            fill="#3b82f6"
                                            name={t('dashboard.nombre_conflits')}
                                            onClick={(data) => onConflictTypeClick && onConflictTypeClick(data.type as ConflictType)}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    {t('dashboard.aucune_donnee')}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Onglet Détails */}
                <TabsContent value="details" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('dashboard.distribution_risques')}</CardTitle>
                        </CardHeader>
                        <CardContent className="h-72">
                            {riskDistribution.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={riskDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {riskDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    {t('dashboard.aucune_donnee')}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Table détaillée des conflits récents */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('dashboard.conflits_recents')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t('dashboard.type')}</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t('dashboard.severite')}</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t('dashboard.date')}</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t('dashboard.statut')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {conflicts.slice(0, 5).map((conflict, index) => (
                                            <tr key={index} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <td className="p-4 align-middle">{t(`conflit.type.${conflict.type.toLowerCase()}`)}</td>
                                                <td className="p-4 align-middle">
                                                    <Badge className={
                                                        conflict.severity === ConflictSeverity.BLOQUANT ? 'bg-destructive' :
                                                            conflict.severity === ConflictSeverity.AVERTISSEMENT ? 'bg-warning' : 'bg-blue-500'
                                                    }>
                                                        {t(`conflit.severite.${conflict.severity.toLowerCase()}`)}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {formatDateRange(conflict.startDate, conflict.endDate)}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant={conflict.resolved ? "outline" : "secondary"}>
                                                        {conflict.resolved ? t('dashboard.resolu') : t('dashboard.actif')}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                        {conflicts.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-4 text-center text-muted-foreground">
                                                    {t('dashboard.aucun_conflit')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Onglet Périodes à venir */}
                <TabsContent value="upcoming" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('dashboard.periodes_risque_venir')}</CardTitle>
                            <CardDescription>
                                {t('dashboard.periodes_risque_venir_description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {upcomingRisks.length > 0 ? (
                                <div className="space-y-4">
                                    {upcomingRisks.map((period, index) => (
                                        <div
                                            key={period.id}
                                            className="flex justify-between items-start p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                            onClick={() => onRiskPeriodClick && onRiskPeriodClick(period)}
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge className={getRiskLevelColor(period.riskLevel)}>
                                                        {t(`alerte.risque.niveau.${period.riskLevel.toLowerCase()}`)}
                                                    </Badge>
                                                    <span className="text-sm font-medium">
                                                        {formatDateRange(period.startDate, period.endDate)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{period.reason}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {period.conflictTypes.map(type => (
                                                        <Badge key={type} variant="outline" className="text-xs">
                                                            {t(`conflit.type.${type.toLowerCase()}`)}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end">
                                                <div className="text-sm font-medium">
                                                    Score: {Math.round(period.riskScore)}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDistanceToNow(period.startDate)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-6 text-muted-foreground">
                                    {t('dashboard.aucune_periode_risque')}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('dashboard.prevention_conflits')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="rounded-lg border p-4">
                                    <h3 className="font-medium mb-2">{t('dashboard.conseils_prevention')}</h3>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-start gap-2">
                                            <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                                            <span>{t('dashboard.conseil_1')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                                            <span>{t('dashboard.conseil_2')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                                            <span>{t('dashboard.conseil_3')}</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full">
                                {t('dashboard.voir_documentation')}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

// Fonction auxiliaire pour formater la distance jusqu'à une date
const formatDistanceToNow = (dateStr: string): string => {
    const date = parseISO(dateStr);
    const now = new Date();

    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        return "Demain";
    } else if (diffDays < 7) {
        return `Dans ${diffDays} jours`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `Dans ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    } else {
        const months = Math.floor(diffDays / 30);
        return `Dans ${months} mois`;
    }
}; 