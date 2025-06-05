import { useState, useEffect, useCallback } from 'react';
import { logger } from "../../../../lib/logger";
import leaveAnalyticsService, {
    LeaveAnalyticsFilter,
    AggregationType,
    DepartmentLeaveStats,
    PeriodLeaveStats,
    TeamAbsenceRate,
    UserLeaveStats,
    PaginatedResult
} from '../services/leaveAnalyticsService';
import { useDebounce } from '@/hooks/useDebounce';

/**
 * Type des données d'analyse pouvant être chargées
 */
export type AnalyticsDataType = 'department' | 'period' | 'team' | 'user' | 'trend' | 'prediction';

/**
 * État de chargement pour chaque type de données
 */
export interface AnalyticsLoadingState {
    department: boolean;
    period: boolean;
    team: boolean;
    user: boolean;
    trend: boolean;
    prediction: boolean;
    [key: string]: boolean;
}

/**
 * État d'erreur pour chaque type de données
 */
export interface AnalyticsErrorState {
    department: Error | null;
    period: Error | null;
    team: Error | null;
    user: Error | null;
    trend: Error | null;
    prediction: Error | null;
    [key: string]: Error | null;
}

/**
 * Options pour le hook useLeaveAnalytics
 */
export interface LeaveAnalyticsOptions {
    filter?: LeaveAnalyticsFilter;
    aggregation?: AggregationType;
    autoLoad?: boolean | AnalyticsDataType[];
    debounceMs?: number;
}

/**
 * Hook personnalisé pour gérer les analyses de congés
 */
export function useLeaveAnalytics(options: LeaveAnalyticsOptions = {}) {
    // État des filtres
    const [filter, setFilter] = useState<LeaveAnalyticsFilter>(options.filter || {});
    const debouncedFilter = useDebounce(filter, options.debounceMs || 300);

    // Type d'agrégation
    const [aggregation, setAggregation] = useState<AggregationType>(
        options.aggregation || AggregationType.MONTH
    );

    // Pagination
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);

    // État des données
    const [departmentStats, setDepartmentStats] = useState<DepartmentLeaveStats[]>([]);
    const [periodStats, setPeriodStats] = useState<PeriodLeaveStats[]>([]);
    const [teamAbsenceRates, setTeamAbsenceRates] = useState<TeamAbsenceRate[]>([]);
    const [userStatsResult, setUserStatsResult] = useState<PaginatedResult<UserLeaveStats>>({
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
        hasMore: false
    });
    const [predictedPeaks, setPredictedPeaks] = useState<{ period: string, predictedRate: number }[]>([]);

    // Performance métriques
    const [performanceMetrics, setPerformanceMetrics] = useState<Record<string, { time: number, cached: boolean }>>({});

    // État des chargements en cours
    const [loading, setLoading] = useState<AnalyticsLoadingState>({
        department: false,
        period: false,
        team: false,
        user: false,
        trend: false,
        prediction: false
    });

    // État des erreurs
    const [errors, setErrors] = useState<AnalyticsErrorState>({
        department: null,
        period: null,
        team: null,
        user: null,
        trend: null,
        prediction: null
    });

    // Helper pour mettre à jour l'état de chargement
    const setLoadingState = useCallback((dataType: AnalyticsDataType, isLoading: boolean) => {
        setLoading(prev => ({ ...prev, [dataType]: isLoading }));
    }, []);

    // Helper pour mettre à jour l'état des erreurs
    const setErrorState = useCallback((dataType: AnalyticsDataType, error: Error | null) => {
        setErrors(prev => ({ ...prev, [dataType]: error }));
    }, []);

    // Charger les statistiques par département
    const loadDepartmentStats = useCallback(async (customFilter?: LeaveAnalyticsFilter) => {
        setLoadingState('department', true);
        setErrorState('department', null);

        try {
            const startTime = performance.now();
            const data = await leaveAnalyticsService.getDepartmentStats(customFilter || debouncedFilter);
            const endTime = performance.now();

            setDepartmentStats(data);
            // Mettre à jour les métriques de performance
            setPerformanceMetrics(prev => ({
                ...prev,
                department: {
                    time: endTime - startTime,
                    cached: endTime - startTime < 50 // Considérer comme mise en cache si temps < 50ms
                }
            }));
        } catch (error: unknown) {
            logger.error("Erreur lors du chargement des stats par département:", error instanceof Error ? error : new Error(String(error)));
            setErrorState('department', error as Error);
        } finally {
            setLoadingState('department', false);
        }
    }, [debouncedFilter, setLoadingState, setErrorState]);

    // Charger les statistiques par période
    const loadPeriodStats = useCallback(async (
        customAggregation?: AggregationType,
        customFilter?: LeaveAnalyticsFilter
    ) => {
        setLoadingState('period', true);
        setErrorState('period', null);

        try {
            const startTime = performance.now();
            const data = await leaveAnalyticsService.getPeriodStats(
                customAggregation || aggregation,
                customFilter || debouncedFilter
            );
            const endTime = performance.now();

            setPeriodStats(data);
            // Mettre à jour les métriques de performance
            setPerformanceMetrics(prev => ({
                ...prev,
                period: {
                    time: endTime - startTime,
                    cached: endTime - startTime < 50
                }
            }));
        } catch (error: unknown) {
            logger.error("Erreur lors du chargement des stats par période:", error instanceof Error ? error : new Error(String(error)));
            setErrorState('period', error as Error);
        } finally {
            setLoadingState('period', false);
        }
    }, [aggregation, debouncedFilter, setLoadingState, setErrorState]);

    // Charger les taux d'absence par équipe
    const loadTeamAbsenceRates = useCallback(async (customFilter?: LeaveAnalyticsFilter) => {
        setLoadingState('team', true);
        setErrorState('team', null);

        try {
            const startTime = performance.now();
            const data = await leaveAnalyticsService.getTeamAbsenceRates(customFilter || debouncedFilter);
            const endTime = performance.now();

            setTeamAbsenceRates(data);
            // Mettre à jour les métriques de performance
            setPerformanceMetrics(prev => ({
                ...prev,
                team: {
                    time: endTime - startTime,
                    cached: endTime - startTime < 50
                }
            }));
        } catch (error: unknown) {
            logger.error("Erreur lors du chargement des taux d'absence par équipe:", error instanceof Error ? error : new Error(String(error)));
            setErrorState('team', error as Error);
        } finally {
            setLoadingState('team', false);
        }
    }, [debouncedFilter, setLoadingState, setErrorState]);

    // Charger les statistiques par utilisateur
    const loadUserStats = useCallback(async (customFilter?: LeaveAnalyticsFilter, page: number = currentPage, size: number = pageSize) => {
        setLoadingState('user', true);
        setErrorState('user', null);

        try {
            const startTime = performance.now();
            const data = await leaveAnalyticsService.getUserStats({
                ...customFilter || debouncedFilter,
                page,
                pageSize: size
            });
            const endTime = performance.now();

            setUserStatsResult(data);
            // Mettre à jour les métriques de performance
            setPerformanceMetrics(prev => ({
                ...prev,
                user: {
                    time: endTime - startTime,
                    cached: endTime - startTime < 50
                }
            }));
        } catch (error: unknown) {
            logger.error("Erreur lors du chargement des stats par utilisateur:", error instanceof Error ? error : new Error(String(error)));
            setErrorState('user', error as Error);
        } finally {
            setLoadingState('user', false);
        }
    }, [debouncedFilter, currentPage, pageSize, setLoadingState, setErrorState]);

    // Charger les tendances par type de congé
    const loadLeaveTypeTrends = useCallback(async (
        customAggregation?: AggregationType,
        customFilter?: LeaveAnalyticsFilter
    ) => {
        setLoadingState('trend', true);
        setErrorState('trend', null);

        try {
            const startTime = performance.now();
            const data = await leaveAnalyticsService.getLeaveTypeTrends(
                customAggregation || aggregation,
                customFilter || debouncedFilter
            );
            const endTime = performance.now();

            // Mettre à jour les métriques de performance
            setPerformanceMetrics(prev => ({
                ...prev,
                trend: {
                    time: endTime - startTime,
                    cached: endTime - startTime < 50
                }
            }));
        } catch (error: unknown) {
            logger.error("Erreur lors du chargement des tendances:", error instanceof Error ? error : new Error(String(error)));
            setErrorState('trend', error as Error);
        } finally {
            setLoadingState('trend', false);
        }
    }, [aggregation, debouncedFilter, setLoadingState, setErrorState]);

    // Prédire les périodes de pic
    const predictPeakPeriods = useCallback(async (departmentId?: string) => {
        setLoadingState('prediction', true);
        setErrorState('prediction', null);

        try {
            const startTime = performance.now();
            const data = await leaveAnalyticsService.predictPeakPeriods(departmentId);
            const endTime = performance.now();

            setPredictedPeaks(data);
            // Mettre à jour les métriques de performance
            setPerformanceMetrics(prev => ({
                ...prev,
                prediction: {
                    time: endTime - startTime,
                    cached: endTime - startTime < 50
                }
            }));
        } catch (error: unknown) {
            logger.error("Erreur lors de la prédiction des périodes de pic:", error instanceof Error ? error : new Error(String(error)));
            setErrorState('prediction', error as Error);
        } finally {
            setLoadingState('prediction', false);
        }
    }, [setLoadingState, setErrorState]);

    // Exporter les données au format CSV
    const exportToCSV = useCallback(async (
        dataType: 'department' | 'period' | 'user' | 'team',
        customFilter?: LeaveAnalyticsFilter
    ): Promise<string> => {
        setLoadingState(dataType, true);

        try {
            return await leaveAnalyticsService.exportAnalyticsToCSV(dataType, customFilter || debouncedFilter);
        } catch (error: unknown) {
            logger.error(`Erreur lors de l'export des données ${dataType}:`, error instanceof Error ? error : new Error(String(error)));
            setErrorState(dataType, error as Error);
            throw error;
        } finally {
            setLoadingState(dataType, false);
        }
    }, [debouncedFilter, setLoadingState, setErrorState]);

    // Fonction pour rafraîchir toutes les données
    const refreshAll = useCallback(() => {
        loadDepartmentStats();
        loadPeriodStats();
        loadTeamAbsenceRates();
        loadUserStats();
        loadLeaveTypeTrends();
        predictPeakPeriods();
    }, [
        loadDepartmentStats,
        loadPeriodStats,
        loadTeamAbsenceRates,
        loadUserStats,
        loadLeaveTypeTrends,
        predictPeakPeriods
    ]);

    // Invalider le cache
    const invalidateCache = useCallback(() => {
        leaveAnalyticsService.invalidateCache();
        refreshAll();
    }, [refreshAll]);

    // Récupérer les statistiques du cache
    const getCacheStats = useCallback(() => {
        return leaveAnalyticsService.getCacheStats();
    }, []);

    // Charger les données initiales
    useEffect(() => {
        const autoLoadTypes = options.autoLoad === true
            ? ['department', 'period', 'team', 'user', 'trend', 'prediction']
            : (Array.isArray(options.autoLoad) ? options.autoLoad : []);

        if (autoLoadTypes.includes('department')) loadDepartmentStats();
        if (autoLoadTypes.includes('period')) loadPeriodStats();
        if (autoLoadTypes.includes('team')) loadTeamAbsenceRates();
        if (autoLoadTypes.includes('user')) loadUserStats();
        if (autoLoadTypes.includes('trend')) loadLeaveTypeTrends();
        if (autoLoadTypes.includes('prediction')) predictPeakPeriods();

    }, [
        options.autoLoad,
        loadDepartmentStats,
        loadPeriodStats,
        loadTeamAbsenceRates,
        loadUserStats,
        loadLeaveTypeTrends,
        predictPeakPeriods
    ]);

    // Rafraîchir les données quand les filtres changent
    useEffect(() => {
        // Ne pas charger lors de la première initialisation, laissé à la charge du useEffect ci-dessus
        if (JSON.stringify(filter) !== JSON.stringify(options.filter || {})) {
            refreshAll();
        }
    }, [debouncedFilter, refreshAll, filter, options.filter]);

    // Gérer le changement de page pour les utilisateurs
    const goToPage = useCallback((page: number) => {
        setCurrentPage(page);
        loadUserStats(undefined, page, pageSize);
    }, [loadUserStats, pageSize]);

    // Changer la taille de page
    const changePageSize = useCallback((size: number) => {
        setPageSize(size);
        setCurrentPage(1); // Revenir à la première page
        loadUserStats(undefined, 1, size);
    }, [loadUserStats]);

    return {
        // États
        filter,
        aggregation,
        departmentStats,
        periodStats,
        teamAbsenceRates,
        userStats: userStatsResult.data,
        userStatsPagination: {
            currentPage,
            pageSize,
            totalItems: userStatsResult.total,
            totalPages: Math.ceil(userStatsResult.total / userStatsResult.pageSize),
            hasMore: userStatsResult.hasMore
        },
        predictedPeaks,
        loading,
        errors,
        performanceMetrics,

        // Helpers
        isAnyLoading: Object.values(loading).some(Boolean),

        // Actions
        setFilter,
        setAggregation,
        loadDepartmentStats,
        loadPeriodStats,
        loadTeamAbsenceRates,
        loadUserStats,
        loadLeaveTypeTrends,
        predictPeakPeriods,
        exportToCSV,
        refreshAll,
        invalidateCache,
        getCacheStats,

        // Pagination
        goToPage,
        changePageSize
    };
}

export default useLeaveAnalytics; 