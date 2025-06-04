/**
 * API pour exposer les données de congés au module de statistiques et rapports
 * Centralise l'accès aux données des congés pour la génération de rapports
 */

import axios from 'axios';
import { format, parse, isValid } from 'date-fns';
import { Leave, LeaveStatus, LeaveType } from '../types/leave';
import { QuotaTransfer } from '../types/quota';
import { performanceTracker } from '../utils/performanceMonitoring';

/**
 * Format des données à exporter
 */
export enum ExportFormat {
    CSV = 'csv',
    JSON = 'json',
    EXCEL = 'excel',
    PDF = 'pdf'
}

/**
 * Types de rapports prédéfinis
 */
export enum ReportType {
    LEAVE_USAGE = 'leave_usage',             // Utilisation des congés
    LEAVE_BALANCE = 'leave_balance',         // Solde des congés
    LEAVE_DISTRIBUTION = 'leave_distribution', // Distribution par type/statut
    DEPARTMENT_COMPARISON = 'department_comparison', // Comparaison entre départements
    LEAVE_HISTORY = 'leave_history',         // Historique des congés
    APPROVAL_TIME = 'approval_time',         // Temps d'approbation
    QUOTA_TRANSFERS = 'quota_transfers',     // Transferts de quotas
    CUSTOM = 'custom'                        // Rapport personnalisé
}

/**
 * Paramètres de filtrage pour les rapports
 */
export interface LeaveReportFilter {
    startDate?: Date | string;
    endDate?: Date | string;
    userIds?: string[];
    departmentIds?: string[];
    leaveTypes?: LeaveType[];
    leaveStatuses?: LeaveStatus[];
    includeRecurring?: boolean;
    groupBy?: 'user' | 'department' | 'type' | 'status' | 'month' | 'year';
    sortBy?: 'date' | 'duration' | 'user' | 'type' | 'status';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}

/**
 * Résultat d'un rapport de congés
 */
export interface LeaveReportResult<T = any> {
    data: T;
    totalCount: number;
    metadata: {
        generatedAt: Date;
        filters: LeaveReportFilter;
        reportType: ReportType;
    };
}

/**
 * Options d'exportation
 */
export interface ExportOptions {
    format: ExportFormat;
    fileName?: string;
    includeHeaders?: boolean;
    locale?: string;
    timezone?: string;
    customFields?: string[];
    customMapping?: Record<string, string>;
}

/**
 * Statut d'une tâche d'export
 */
export interface ExportStatus {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    startedAt: Date;
    completedAt?: Date;
    fileUrl?: string;
    error?: string;
}

/**
 * Classe principale pour l'API de rapports de congés
 */
export class LeaveReportApi {
    private static instance: LeaveReportApi;
    private readonly apiBaseUrl: string;
    private readonly defaultHeaders: Record<string, string>;

    /**
     * Obtenir l'instance de l'API (Singleton)
     */
    public static getInstance(): LeaveReportApi {
        if (!LeaveReportApi.instance) {
            LeaveReportApi.instance = new LeaveReportApi();
        }
        return LeaveReportApi.instance;
    }

    /**
     * Constructeur privé
     */
    private constructor() {
        this.apiBaseUrl = '/api/conges/reports';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Normaliser les paramètres de date
     */
    private normalizeDateParam(date: Date | string | undefined): string | undefined {
        if (!date) return undefined;

        if (typeof date === 'string') {
            // Tenter de parser la date si c'est une chaîne
            const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
            return isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd') : undefined;
        }

        return format(date, 'yyyy-MM-dd');
    }

    /**
     * Obtenir les données pour un rapport prédéfini
     * @param reportType Type de rapport
     * @param filters Filtres à appliquer
     * @returns Données du rapport
     */
    public async getReportData<T = any>(reportType: ReportType, filters: LeaveReportFilter = {}): Promise<LeaveReportResult<T>> {
        const startTime = performance.now();

        try {
            // Normaliser les dates
            const normalizedFilters = {
                ...filters,
                startDate: this.normalizeDateParam(filters.startDate),
                endDate: this.normalizeDateParam(filters.endDate)
            };

            const response = await axios.get(`${this.apiBaseUrl}/${reportType}`, {
                headers: this.defaultHeaders,
                params: normalizedFilters
            });

            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération du rapport ${reportType}:`, error);
            throw error;
        } finally {
            const duration = performance.now() - startTime;
            performanceTracker.measure('LeaveReportApi.getReportData', duration);
        }
    }

    /**
     * Obtenir un rapport d'utilisation des congés
     * @param filters Filtres à appliquer
     * @returns Données d'utilisation des congés
     */
    public async getLeaveUsageReport(filters: LeaveReportFilter = {}): Promise<LeaveReportResult> {
        return this.getReportData(ReportType.LEAVE_USAGE, filters);
    }

    /**
     * Obtenir un rapport de solde des congés
     * @param filters Filtres à appliquer
     * @returns Données de solde des congés
     */
    public async getLeaveBalanceReport(filters: LeaveReportFilter = {}): Promise<LeaveReportResult> {
        return this.getReportData(ReportType.LEAVE_BALANCE, filters);
    }

    /**
     * Obtenir un rapport de distribution des congés
     * @param filters Filtres à appliquer
     * @returns Données de distribution des congés
     */
    public async getLeaveDistributionReport(filters: LeaveReportFilter = {}): Promise<LeaveReportResult> {
        return this.getReportData(ReportType.LEAVE_DISTRIBUTION, filters);
    }

    /**
     * Obtenir un rapport de comparaison entre départements
     * @param filters Filtres à appliquer
     * @returns Données de comparaison
     */
    public async getDepartmentComparisonReport(filters: LeaveReportFilter = {}): Promise<LeaveReportResult> {
        return this.getReportData(ReportType.DEPARTMENT_COMPARISON, filters);
    }

    /**
     * Obtenir un rapport d'historique des congés
     * @param filters Filtres à appliquer
     * @returns Données d'historique
     */
    public async getLeaveHistoryReport(filters: LeaveReportFilter = {}): Promise<LeaveReportResult> {
        return this.getReportData(ReportType.LEAVE_HISTORY, filters);
    }

    /**
     * Obtenir un rapport de temps d'approbation
     * @param filters Filtres à appliquer
     * @returns Données de temps d'approbation
     */
    public async getApprovalTimeReport(filters: LeaveReportFilter = {}): Promise<LeaveReportResult> {
        return this.getReportData(ReportType.APPROVAL_TIME, filters);
    }

    /**
     * Obtenir un rapport de transferts de quotas
     * @param filters Filtres à appliquer
     * @returns Données de transferts
     */
    public async getQuotaTransfersReport(filters: LeaveReportFilter = {}): Promise<LeaveReportResult<QuotaTransfer[]>> {
        return this.getReportData<QuotaTransfer[]>(ReportType.QUOTA_TRANSFERS, filters);
    }

    /**
     * Obtenir un rapport personnalisé
     * @param customQuery Configuration personnalisée
     * @returns Données personnalisées
     */
    public async getCustomReport(customQuery: any): Promise<LeaveReportResult> {
        const startTime = performance.now();

        try {
            const response = await axios.post(`${this.apiBaseUrl}/custom`, customQuery, {
                headers: this.defaultHeaders
            });

            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération du rapport personnalisé:', error);
            throw error;
        } finally {
            const duration = performance.now() - startTime;
            performanceTracker.measure('LeaveReportApi.getCustomReport', duration);
        }
    }

    /**
     * Lancer l'exportation d'un rapport
     * @param reportType Type de rapport
     * @param filters Filtres à appliquer
     * @param exportOptions Options d'exportation
     * @returns ID de la tâche d'exportation
     */
    public async exportReport(
        reportType: ReportType,
        filters: LeaveReportFilter = {},
        exportOptions: ExportOptions
    ): Promise<string> {
        const startTime = performance.now();

        try {
            // Normaliser les dates
            const normalizedFilters = {
                ...filters,
                startDate: this.normalizeDateParam(filters.startDate),
                endDate: this.normalizeDateParam(filters.endDate)
            };

            const response = await axios.post(
                `${this.apiBaseUrl}/${reportType}/export`,
                {
                    filters: normalizedFilters,
                    exportOptions
                },
                { headers: this.defaultHeaders }
            );

            // Retourner l'ID de la tâche d'exportation
            return response.data.id || response.data.exportTaskId;
        } catch (error) {
            console.error(`Erreur lors de l'exportation du rapport ${reportType}:`, error);
            throw error;
        } finally {
            const duration = performance.now() - startTime;
            performanceTracker.measure('LeaveReportApi.exportReport', duration);
        }
    }

    /**
     * Vérifier le statut d'une tâche d'exportation
     * @param exportTaskId ID de la tâche d'exportation
     * @returns Statut de la tâche
     */
    public async getExportStatus(exportTaskId: string): Promise<ExportStatus> {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/export/${exportTaskId}/status`, {
                headers: this.defaultHeaders
            });

            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la vérification du statut d'exportation ${exportTaskId}:`, error);
            throw error;
        }
    }

    /**
     * Télécharger un fichier exporté
     * @param exportTaskId ID de la tâche d'exportation
     * @returns Blob du fichier
     */
    public async downloadExportedFile(exportTaskId: string): Promise<Blob> {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/export/${exportTaskId}/download`, {
                headers: this.defaultHeaders,
                responseType: 'blob'
            });

            return response.data;
        } catch (error) {
            console.error(`Erreur lors du téléchargement du fichier d'exportation ${exportTaskId}:`, error);
            throw error;
        }
    }
}

// Exporter l'instance singleton
export const leaveReportApi = LeaveReportApi.getInstance(); 