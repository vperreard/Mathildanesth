import { useState, useEffect, useCallback } from 'react';
import { logger } from "../../../../lib/logger";
import { leaveStatisticsService, LeaveStatistics, LeaveStatisticsFilters } from '../services/leaveStatisticsService';
import { Department } from '@/modules/organization/types';
import { LeaveType, LeaveStatus } from '@/modules/leaves/types/leave';
import { useEventListener } from '@/core/events/useEvents';
import { EventType } from '@/core/events/EventTypes';

interface UseLeaveDashboardOptions {
    /**
     * Filtres initiaux
     */
    initialFilters?: LeaveStatisticsFilters;

    /**
     * Si true, charge les données au montage du composant
     */
    autoLoad?: boolean;

    /**
     * ID du département à analyser pour la disponibilité d'équipe
     */
    departmentId?: Department['id'];
}

/**
 * Hook pour gérer l'état et le chargement des statistiques de congés
 */
export function useLeaveStatistics({
    initialFilters = {},
    autoLoad = true,
    departmentId
}: UseLeaveDashboardOptions = {}) {
    // État des statistiques générales
    const [statistics, setStatistics] = useState<LeaveStatistics | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);
    const [statsError, setStatsError] = useState<string | null>(null);

    // État pour la disponibilité de l'équipe
    const [teamAvailability, setTeamAvailability] = useState<Array<{
        date: string;
        availabilityPercentage: number;
        totalTeamMembers: number;
        availableMembers: number;
    }> | null>(null);
    const [isLoadingAvailability, setIsLoadingAvailability] = useState<boolean>(false);
    const [availabilityError, setAvailabilityError] = useState<string | null>(null);

    // État pour les tendances
    const [trends, setTrends] = useState<Array<{
        date: string;
        count: number;
        byType: Record<LeaveType, number>;
    }> | null>(null);
    const [isLoadingTrends, setIsLoadingTrends] = useState<boolean>(false);
    const [trendsError, setTrendsError] = useState<string | null>(null);

    // État pour les périodes de pointe
    const [peakPeriods, setPeakPeriods] = useState<Array<{
        startDate: string;
        endDate: string;
        count: number;
        impactScore: number;
        affectedDepartments: { id: string; name: string }[];
    }> | null>(null);
    const [isLoadingPeaks, setIsLoadingPeaks] = useState<boolean>(false);
    const [peaksError, setPeaksError] = useState<string | null>(null);

    // État pour les filtres
    const [filters, setFilters] = useState<LeaveStatisticsFilters>(initialFilters);

    /**
     * Charge les statistiques générales
     */
    const loadStatistics = useCallback(async (customFilters?: LeaveStatisticsFilters) => {
        const filtersToUse = customFilters || filters;
        setIsLoadingStats(true);
        setStatsError(null);

        try {
            const data = await leaveStatisticsService.getLeaveStatistics(filtersToUse);
            setStatistics(data);
        } catch (error: unknown) {
            logger.error('Erreur lors du chargement des statistiques:', error instanceof Error ? error : new Error(String(error)));
            setStatsError('Impossible de charger les statistiques');
        } finally {
            setIsLoadingStats(false);
        }
    }, [filters]);

    /**
     * Charge les données de disponibilité d'équipe
     */
    const loadTeamAvailability = useCallback(async (
        deptId?: string,
        startDate?: string,
        endDate?: string
    ) => {
        if (!deptId && !departmentId) {
            setTeamAvailability([]);
            return;
        }

        const deptIdToUse = deptId || departmentId;
        const startDateToUse = startDate || filters.startDate;
        const endDateToUse = endDate || filters.endDate;

        if (!deptIdToUse || !startDateToUse || !endDateToUse) {
            setTeamAvailability([]);
            return;
        }

        setIsLoadingAvailability(true);
        setAvailabilityError(null);

        try {
            const data = await leaveStatisticsService.getTeamAvailabilityForecast(
                deptIdToUse,
                startDateToUse,
                endDateToUse
            );
            setTeamAvailability(data);
        } catch (error: unknown) {
            logger.error('Erreur lors du chargement de la disponibilité d\'équipe:', error instanceof Error ? error : new Error(String(error)));
            setAvailabilityError('Impossible de charger les données de disponibilité');
        } finally {
            setIsLoadingAvailability(false);
        }
    }, [departmentId, filters]);

    /**
     * Charge les tendances de congés
     */
    const loadTrends = useCallback(async (
        aggregation: 'daily' | 'weekly' | 'monthly' = 'monthly',
        customFilters?: LeaveStatisticsFilters
    ) => {
        const filtersToUse = customFilters || filters;
        setIsLoadingTrends(true);
        setTrendsError(null);

        try {
            const data = await leaveStatisticsService.getLeaveTrends(aggregation, filtersToUse);
            setTrends(data);
        } catch (error: unknown) {
            logger.error('Erreur lors du chargement des tendances:', error instanceof Error ? error : new Error(String(error)));
            setTrendsError('Impossible de charger les tendances');
        } finally {
            setIsLoadingTrends(false);
        }
    }, [filters]);

    /**
     * Charge les périodes de pointe
     */
    const loadPeakPeriods = useCallback(async (threshold: number = 3) => {
        setIsLoadingPeaks(true);
        setPeaksError(null);

        try {
            const data = await leaveStatisticsService.getPeakPeriods(threshold);
            setPeakPeriods(data);
        } catch (error: unknown) {
            logger.error('Erreur lors du chargement des périodes de pointe:', error instanceof Error ? error : new Error(String(error)));
            setPeaksError('Impossible de charger les périodes de pointe');
        } finally {
            setIsLoadingPeaks(false);
        }
    }, []);

    /**
     * Génère un rapport exportable
     */
    const generateReport = useCallback(async (
        customFilters?: LeaveStatisticsFilters,
        format: 'pdf' | 'csv' | 'excel' = 'pdf'
    ) => {
        const filtersToUse = customFilters || filters;

        try {
            const blob = await leaveStatisticsService.generateReport(filtersToUse, format);

            // Créer un URL pour le téléchargement
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rapport_conges_${format}_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            return true;
        } catch (error: unknown) {
            logger.error('Erreur lors de la génération du rapport:', error instanceof Error ? error : new Error(String(error)));
            return false;
        }
    }, [filters]);

    /**
     * Met à jour les filtres et recharge les données
     */
    const updateFilters = useCallback((newFilters: Partial<LeaveStatisticsFilters>) => {
        setFilters(prevFilters => {
            const updatedFilters = { ...prevFilters, ...newFilters };
            return updatedFilters;
        });
    }, []);

    /**
     * Recharge toutes les données
     */
    const refreshAll = useCallback(() => {
        loadStatistics();
        loadTeamAvailability();
        loadTrends('monthly');
        loadPeakPeriods();
    }, [loadStatistics, loadTeamAvailability, loadTrends, loadPeakPeriods]);

    // Écouter les événements qui devraient déclencher une actualisation
    useEventListener(EventType.LEAVE_CREATED, refreshAll);
    useEventListener(EventType.LEAVE_UPDATED, refreshAll);
    useEventListener(EventType.LEAVE_STATUS_CHANGED, refreshAll);
    useEventListener(EventType.DASHBOARD_REFRESH, refreshAll);

    // Charger les données au montage du composant
    useEffect(() => {
        if (autoLoad) {
            refreshAll();
        }
    }, [autoLoad, refreshAll]);

    // Recharger les données lorsque les filtres changent
    useEffect(() => {
        if (autoLoad) {
            loadStatistics();
            loadTrends('monthly');
            loadTeamAvailability();
        }
    }, [filters, autoLoad, loadStatistics, loadTrends, loadTeamAvailability]);

    return {
        // Statistiques générales
        statistics,
        isLoadingStats,
        statsError,
        loadStatistics,

        // Disponibilité d'équipe
        teamAvailability,
        isLoadingAvailability,
        availabilityError,
        loadTeamAvailability,

        // Tendances
        trends,
        isLoadingTrends,
        trendsError,
        loadTrends,

        // Périodes de pointe
        peakPeriods,
        isLoadingPeaks,
        peaksError,
        loadPeakPeriods,

        // Rapports
        generateReport,

        // Filtres
        filters,
        updateFilters,

        // Utilitaires
        refreshAll,

        // État de chargement global
        isLoading: isLoadingStats || isLoadingAvailability || isLoadingTrends || isLoadingPeaks
    };
}