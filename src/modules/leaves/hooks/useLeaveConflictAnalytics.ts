/**
 * Il devrait être révisé complètement pour corriger les erreurs TypeScript.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLeaveApi } from './useLeaveApi';
import { useUserApi } from '../../users/hooks/useUserApi';
import { useDepartmentApi } from '../../organization/hooks/useDepartmentApi';
import {
    LeaveConflictAnalyticsService,
    ConflictAnalyticsReport,
    AnalyticsFilter,
    ConflictStats,
    ConflictTrend,
    TeamConflictAnalytics,
    ConflictRecommendation,
    ConflictAnalyticsFilters
} from '../services/leaveConflictAnalyticsService';
import { LeaveConflict, ConflictType, ConflictSeverity } from '../types/conflict';
import { Leave, LeaveType } from '../types/leave';
import { User } from '../../../types/user';
import { Department } from '../../../types/department';

interface UseLeaveConflictAnalyticsProps {
    initialFilter?: AnalyticsFilter;
}

// L'interface corrigée
interface UseLeaveConflictAnalyticsReturn {
    // Données et états
    report: ConflictAnalyticsReport | null;
    conflicts: LeaveConflict[];
    leaves: Leave[];
    users: User[];
    departments: Department[];
    loading: boolean;
    error: Error | null;

    // Filtrage et chargement
    filter: AnalyticsFilter;
    setFilter: (filter: AnalyticsFilter) => void;
    loadData: () => Promise<void>;
    refreshReport: () => void;

    // Analyse
    getConflictRatio: (departmentId?: string) => number;
    getConflictTrendForPeriod: (startDate: Date, endDate: Date) => any[];
    getTopConflictTypes: (limit?: number) => Array<{ type: ConflictType, count: number }>;
    getMostCriticalPeriod: () => string | null;

    // Export
    exportReportAsCSV: () => string;

    // Nouvelles données
    stats: ConflictStats | null;
    trends: ConflictTrend[];
    teamAnalytics: Record<string, TeamConflictAnalytics>;
    recommendations: ConflictRecommendation[];
    highRiskPeriods: any[];
    approvalTimeImpact: any | null;

    // Nouvelles fonctions
    fetchStats: (newFilters?: ConflictAnalyticsFilters) => Promise<ConflictStats | null>;
    fetchTrends: (period?: 'daily' | 'weekly' | 'monthly', newFilters?: ConflictAnalyticsFilters) => Promise<ConflictTrend[]>;
    fetchTeamAnalytics: (teamIds: string[], newFilters?: ConflictAnalyticsFilters) => Promise<Record<string, TeamConflictAnalytics>>;
    fetchRecommendations: (newFilters?: ConflictAnalyticsFilters) => Promise<ConflictRecommendation[]>;
    fetchHighRiskPeriods: (year: number) => Promise<any[]>;
    fetchApprovalTimeImpact: (newFilters?: ConflictAnalyticsFilters) => Promise<any | null>;
    loadAllAnalytics: (newFilters?: ConflictAnalyticsFilters) => Promise<{ statsResult: ConflictStats, trendsResult: ConflictTrend[], recommendationsResult: ConflictRecommendation[], approvalTimeResult: any | null }>;
    exportToCSV: () => Promise<string>;

    // Nouvelles analyses
    calculateAverageConflictRateByTeam: () => Record<string, number>;
    getMostFrequentConflictTypes: (limit?: number) => Array<{ type: ConflictType, count: number }>;
    calculateTrendVariation: (currentPeriod: string, previousPeriod: string) => { absolute: number, percentage: number } | null;
    analyzeLeaveTypeConflictCorrelation: () => Record<LeaveType, number> | null;
    calculateBlockingConflictPercentage: () => number;

    // Nouvelles fonctions de gestion des filtres
    setFilters: (newFilters: ConflictAnalyticsFilters) => void;
    resetFilters: () => void;
}

/**
 * Hook pour l'analyse des conflits de congés
 * Permet de récupérer, filtrer et analyser les données de conflits
 */
export const useLeaveConflictAnalytics = (
    { initialFilter = {} }: UseLeaveConflictAnalyticsProps = {}
): UseLeaveConflictAnalyticsReturn => {
    // États
    const [filter, setFilter] = useState<AnalyticsFilter>(initialFilter);
    const [conflicts, setConflicts] = useState<LeaveConflict[]>([]);
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [report, setReport] = useState<ConflictAnalyticsReport | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    // Nouvelles données
    const [stats, setStats] = useState<ConflictStats | null>(null);
    const [trends, setTrends] = useState<ConflictTrend[]>([]);
    const [teamAnalytics, setTeamAnalytics] = useState<Record<string, TeamConflictAnalytics>>({});
    const [recommendations, setRecommendations] = useState<ConflictRecommendation[]>([]);
    const [highRiskPeriods, setHighRiskPeriods] = useState<any[]>([]);
    const [approvalTimeImpact, setApprovalTimeImpact] = useState<any | null>(null);

    // Nouvelles filtres
    const [filters, setFilters] = useState<ConflictAnalyticsFilters>({});

    // Services
    const leaveApi = useLeaveApi();
    const userApi = useUserApi();
    const departmentApi = useDepartmentApi();
    const analyticsService = useMemo(() => new LeaveConflictAnalyticsService(), []);

    // Chargement des données
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Charger les données nécessaires
            const [
                conflictsData,
                leavesData,
                usersData,
                departmentsData
            ] = await Promise.all([
                leaveApi.getConflicts(filter),
                leaveApi.getLeaves(filter),
                userApi.getAllUsers(),
                departmentApi.getAllDepartments()
            ]);

            setConflicts(conflictsData);
            setLeaves(leavesData);
            setUsers(usersData);
            setDepartments(departmentsData);

            // Générer le rapport
            generateReport(conflictsData, leavesData, usersData, departmentsData);
        } catch (err) {
            const errorObj = err instanceof Error ? err : new Error('Erreur lors du chargement des données d\'analyse');
            setError(errorObj);
            console.error('Erreur dans useLeaveConflictAnalytics.loadData:', err);
        } finally {
            setLoading(false);
        }
    }, [filter, leaveApi, userApi, departmentApi]);

    // Générer le rapport
    const generateReport = useCallback((
        conflictsData: LeaveConflict[],
        leavesData: Leave[],
        usersData: User[],
        departmentsData: Department[]
    ) => {
        try {
            const newReport = analyticsService.generateAnalyticsReport(
                conflictsData,
                leavesData,
                usersData,
                departmentsData,
                filter
            );

            setReport(newReport);
        } catch (err) {
            const errorObj = err instanceof Error ? err : new Error('Erreur lors de la génération du rapport');
            setError(errorObj);
            console.error('Erreur dans useLeaveConflictAnalytics.generateReport:', err);
        }
    }, [analyticsService, filter]);

    // Rafraîchir le rapport avec les données actuelles
    const refreshReport = useCallback(() => {
        if (conflicts.length > 0 && leaves.length > 0 && users.length > 0 && departments.length > 0) {
            generateReport(conflicts, leaves, users, departments);
        }
    }, [conflicts, leaves, users, departments, generateReport]);

    // Effet pour charger les données initiales
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Calculer le ratio de conflits par rapport aux congés
    const getConflictRatio = useCallback((departmentId?: string): number => {
        if (!conflicts.length || !leaves.length) return 0;

        let filteredLeaves = leaves;
        let filteredConflicts = conflicts;

        // Filtrer par département si spécifié
        if (departmentId) {
            filteredLeaves = leaves.filter(leave => leave.departmentId === departmentId);
            filteredConflicts = conflicts.filter(conflict => {
                const leave = leaves.find(l => l.id === conflict.leaveId);
                return leave && leave.departmentId === departmentId;
            });
        }

        if (!filteredLeaves.length) return 0;

        return filteredConflicts.length / filteredLeaves.length;
    }, [conflicts, leaves]);

    // Obtenir les tendances de conflits pour une période
    const getConflictTrendForPeriod = useCallback((startDate: Date, endDate: Date): any[] => {
        if (!report) return [];

        return report.trends.filter(trend => {
            const [year, month] = trend.period.split('-').map(num => parseInt(num));
            const trendDate = new Date(year, month - 1, 1);
            return trendDate >= startDate && trendDate <= endDate;
        });
    }, [report]);

    // Obtenir les types de conflits les plus fréquents
    const getTopConflictTypes = useCallback((limit: number = 5): Array<{ type: ConflictType, count: number }> => {
        if (!report || !report.byType) return [];

        return Object.entries(report.byType)
            .map(([type, count]) => ({
                type: type as ConflictType,
                count: count || 0
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }, [report]);

    // Déterminer la période la plus critique
    const getMostCriticalPeriod = useCallback((): string | null => {
        if (!report || !report.trends || !report.trends.length) return null;

        return report.trends.reduce((mostCritical, current) => {
            return current.blocking > (mostCritical?.blocking || 0) ? current : mostCritical;
        }, report.trends[0]).period;
    }, [report]);

    // Exporter le rapport en CSV
    const exportReportAsCSV = useCallback((): string => {
        if (!report) return '';
        return analyticsService.exportReportAsCSV(report);
    }, [analyticsService, report]);

    // Nouvelles fonctions
    const fetchStats = useCallback(async (newFilters?: ConflictAnalyticsFilters) => {
        try {
            setLoading(true);
            setError(null);

            const appliedFilters = newFilters || filters;
            const result = await analyticsService.getConflictStats(appliedFilters);

            setStats(result);
            if (newFilters) {
                setFilters(newFilters);
            }

            return result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la récupération des statistiques'));
            return null;
        } finally {
            setLoading(false);
        }
    }, [analyticsService, filters]);

    const fetchTrends = useCallback(async (
        period: 'daily' | 'weekly' | 'monthly' = 'monthly',
        newFilters?: ConflictAnalyticsFilters
    ) => {
        try {
            setLoading(true);
            setError(null);

            const appliedFilters = newFilters || filters;
            const result = await analyticsService.getConflictTrends(period, appliedFilters);

            setTrends(result);
            if (newFilters) {
                setFilters(newFilters);
            }

            return result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la récupération des tendances'));
            return [];
        } finally {
            setLoading(false);
        }
    }, [analyticsService, filters]);

    const fetchTeamAnalytics = useCallback(async (
        teamIds: string[],
        newFilters?: ConflictAnalyticsFilters
    ) => {
        try {
            setLoading(true);
            setError(null);

            const appliedFilters = newFilters || filters;
            const results: Record<string, TeamConflictAnalytics> = {};

            for (const teamId of teamIds) {
                results[teamId] = await analyticsService.getTeamConflictAnalytics(teamId, appliedFilters);
            }

            setTeamAnalytics(prev => ({ ...prev, ...results }));
            if (newFilters) {
                setFilters(newFilters);
            }

            return results;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la récupération des analyses d\'équipe'));
            return {};
        } finally {
            setLoading(false);
        }
    }, [analyticsService, filters]);

    const fetchRecommendations = useCallback(async (newFilters?: ConflictAnalyticsFilters) => {
        try {
            setLoading(true);
            setError(null);

            const appliedFilters = newFilters || filters;
            const result = await analyticsService.generateRecommendations(appliedFilters);

            setRecommendations(result);
            if (newFilters) {
                setFilters(newFilters);
            }

            return result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la récupération des recommandations'));
            return [];
        } finally {
            setLoading(false);
        }
    }, [analyticsService, filters]);

    const fetchHighRiskPeriods = useCallback(async (year: number) => {
        try {
            setLoading(true);
            setError(null);

            const result = await analyticsService.identifyHighRiskPeriods(year);

            setHighRiskPeriods(result);

            return result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de l\'identification des périodes à risque'));
            return [];
        } finally {
            setLoading(false);
        }
    }, [analyticsService]);

    const fetchApprovalTimeImpact = useCallback(async (newFilters?: ConflictAnalyticsFilters) => {
        try {
            setLoading(true);
            setError(null);

            const appliedFilters = newFilters || filters;
            const result = await analyticsService.analyzeConflictImpactOnApprovalTime(appliedFilters);

            setApprovalTimeImpact(result);
            if (newFilters) {
                setFilters(newFilters);
            }

            return result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de l\'analyse de l\'impact sur les temps d\'approbation'));
            return null;
        } finally {
            setLoading(false);
        }
    }, [analyticsService, filters]);

    const loadAllAnalytics = useCallback(async (newFilters?: ConflictAnalyticsFilters) => {
        try {
            setLoading(true);
            setError(null);

            const appliedFilters = newFilters || filters;

            const [statsResult, trendsResult, recommendationsResult, approvalTimeResult] = await Promise.all([
                analyticsService.getConflictStats(appliedFilters),
                analyticsService.getConflictTrends('monthly', appliedFilters),
                analyticsService.generateRecommendations(appliedFilters),
                analyticsService.analyzeConflictImpactOnApprovalTime(appliedFilters)
            ]);

            setStats(statsResult);
            setTrends(trendsResult);
            setRecommendations(recommendationsResult);
            setApprovalTimeImpact(approvalTimeResult);

            if (newFilters) {
                setFilters(newFilters);
            }

            return { statsResult, trendsResult, recommendationsResult, approvalTimeResult };
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors du chargement des analyses'));
            return null;
        } finally {
            setLoading(false);
        }
    }, [analyticsService, filters]);

    const exportToCSV = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await analyticsService.exportAnalyticsToCSV(filters);

            // Dans un environnement réel, on déclencherait le téléchargement
            // Exemple simpliste:
            const link = document.createElement('a');
            link.href = result;
            link.download = 'conflict-analytics-export.csv';
            link.click();

            return result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de l\'export des données'));
            return null;
        } finally {
            setLoading(false);
        }
    }, [analyticsService, filters]);

    // Nouvelles analyses
    const calculateAverageConflictRateByTeam = useCallback(() => {
        if (!stats) return {};

        const teamConflicts = stats.byTeam;
        const totalConflicts = stats.totalConflicts;

        return Object.entries(teamConflicts).reduce((acc, [team, count]) => {
            acc[team] = count / totalConflicts;
            return acc;
        }, {} as Record<string, number>);
    }, [stats]);

    const getMostFrequentConflictTypes = useCallback((limit: number = 3) => {
        if (!stats) return [];

        return Object.entries(stats.byType)
            .map(([type, count]) => ({ type: type as ConflictType, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }, [stats]);

    const calculateTrendVariation = useCallback((currentPeriod: string, previousPeriod: string) => {
        if (!trends || trends.length < 2) return null;

        const current = trends.find(t => t.period === currentPeriod);
        const previous = trends.find(t => t.period === previousPeriod);

        if (!current || !previous) return null;

        const absolute = current.count - previous.count;
        const percentage = (absolute / previous.count) * 100;

        return { absolute, percentage };
    }, [trends]);

    const analyzeLeaveTypeConflictCorrelation = useCallback(() => {
        if (!stats) return null;

        const correlations: Record<LeaveType, number> = {} as Record<LeaveType, number>;

        // Très simpliste, dans un cas réel, nous ferions une véritable analyse statistique
        for (const [leaveType, count] of Object.entries(stats.byLeaveType)) {
            const conflictPercentage = count / stats.totalConflicts;
            correlations[leaveType as LeaveType] = conflictPercentage;
        }

        return correlations;
    }, [stats]);

    const calculateBlockingConflictPercentage = useCallback(() => {
        if (!stats) return 0;

        const blockingCount = stats.bySeverity[ConflictSeverity.BLOQUANT] || 0;
        return (blockingCount / stats.totalConflicts) * 100;
    }, [stats]);

    return {
        report,
        conflicts,
        leaves,
        users,
        departments,
        loading,
        error,
        filter,
        setFilter,
        loadData,
        refreshReport,
        getConflictRatio,
        getConflictTrendForPeriod,
        getTopConflictTypes,
        getMostCriticalPeriod,
        exportReportAsCSV,
        stats,
        trends,
        teamAnalytics,
        recommendations,
        highRiskPeriods,
        approvalTimeImpact,
        filters,
        fetchStats,
        fetchTrends,
        fetchTeamAnalytics,
        fetchRecommendations,
        fetchHighRiskPeriods,
        fetchApprovalTimeImpact,
        loadAllAnalytics,
        exportToCSV,
        calculateAverageConflictRateByTeam,
        getMostFrequentConflictTypes,
        calculateTrendVariation,
        analyzeLeaveTypeConflictCorrelation,
        calculateBlockingConflictPercentage,
        setFilters,
        resetFilters: () => setFilters({}),
    };
}; 