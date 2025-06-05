import { useState, useCallback, useEffect } from 'react';
import { logger } from "../../../lib/logger";
import {
    QuotaTransferReportOptions,
    QuotaTransferReportResult,
} from '../types/quota';
import { quotaAdvancedService } from '../services/QuotaAdvancedService';

export interface UseQuotaTransferReportOptions {
    initialFilters?: Partial<QuotaTransferReportOptions>;
    autoLoad?: boolean;
}

export interface UseQuotaTransferReportReturn {
    loading: boolean;
    exportLoading: boolean;
    error: Error | null;
    report: QuotaTransferReportResult | null;
    filters: QuotaTransferReportOptions;
    setFilters: (filters: Partial<QuotaTransferReportOptions>) => void;
    generateReport: () => Promise<QuotaTransferReportResult | null>;
    exportReport: (format: 'pdf' | 'csv' | 'excel') => Promise<boolean>;
    resetFilters: () => void;
}

/**
 * Hook pour la génération et l'exportation de rapports de transferts de quotas
 */
export function useQuotaTransferReport(options: UseQuotaTransferReportOptions = {}): UseQuotaTransferReportReturn {
    const { initialFilters = {}, autoLoad = false } = options;

    // États
    const [loading, setLoading] = useState<boolean>(false);
    const [exportLoading, setExportLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [report, setReport] = useState<QuotaTransferReportResult | null>(null);

    // Filtres par défaut: derniers 12 mois
    const defaultStartDate = new Date();
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 12);

    const defaultFilters: QuotaTransferReportOptions = {
        startDate: defaultStartDate.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        groupBy: 'leaveType'
    };

    const [filters, setFiltersState] = useState<QuotaTransferReportOptions>({
        ...defaultFilters,
        ...initialFilters
    });

    /**
     * Met à jour les filtres
     */
    const setFilters = useCallback((newFilters: Partial<QuotaTransferReportOptions>) => {
        setFiltersState(prevFilters => ({
            ...prevFilters,
            ...newFilters
        }));
    }, []);

    /**
     * Réinitialise les filtres aux valeurs par défaut
     */
    const resetFilters = useCallback(() => {
        setFiltersState(defaultFilters);
    }, [defaultFilters]);

    /**
     * Génère un rapport basé sur les filtres actuels
     */
    const generateReport = useCallback(async (): Promise<QuotaTransferReportResult | null> => {
        setLoading(true);
        setError(null);

        try {
            const result = await quotaAdvancedService.generateTransferReport(filters);
            setReport(result);
            return result;
        } catch (err: any) {
            const errorMessage = err?.message || 'Erreur lors de la génération du rapport';
            setError(new Error(errorMessage));
            logger.error('Erreur dans useQuotaTransferReport.generateReport:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, [filters]);

    /**
     * Exporte un rapport au format spécifié
     */
    const exportReport = useCallback(async (format: 'pdf' | 'csv' | 'excel'): Promise<boolean> => {
        setExportLoading(true);
        setError(null);

        try {
            const exportOptions = {
                ...filters,
                format
            };

            const blob = await quotaAdvancedService.exportTransferReport(exportOptions);

            // Créer un URL pour le téléchargement
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transferts_quotas_${format}_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            return true;
        } catch (err: any) {
            const errorMessage = err?.message || `Erreur lors de l'exportation au format ${format}`;
            setError(new Error(errorMessage));
            logger.error('Erreur dans useQuotaTransferReport.exportReport:', err);
            return false;
        } finally {
            setExportLoading(false);
        }
    }, [filters]);

    // Chargement automatique si demandé
    useEffect(() => {
        if (autoLoad) {
            generateReport();
        }
    }, [autoLoad, generateReport]);

    return {
        loading,
        exportLoading,
        error,
        report,
        filters,
        setFilters,
        generateReport,
        exportReport,
        resetFilters
    };
}



