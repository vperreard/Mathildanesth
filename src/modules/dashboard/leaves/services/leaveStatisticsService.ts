import { API_ENDPOINTS } from '@/config/api';
import { fetchWithAuth } from '@/lib/fetch';
import { LeaveStatus, LeaveType } from '@/modules/conges/types/leave';
import { Department } from '@/modules/organization/types';

export interface LeaveStatistics {
    totalCount: number;
    byStatus: Record<LeaveStatus, number>;
    byType: Record<LeaveType, number>;
    byDepartment: Record<string, number>;
    byMonth: Record<string, number>;
    averageDuration: number;
    peakPeriods: Array<{
        startDate: string;
        endDate: string;
        count: number;
    }>;
    totalDays: number;
}

export interface LeaveStatisticsFilters {
    startDate?: string;
    endDate?: string;
    department?: Department['id'];
    leaveType?: LeaveType;
    leaveStatus?: LeaveStatus;
}

export const leaveStatisticsService = {
    /**
     * Récupère les statistiques des congés avec filtres optionnels
     */
    async getLeaveStatistics(filters?: LeaveStatisticsFilters): Promise<LeaveStatistics> {
        const queryParams = new URLSearchParams();

        if (filters?.startDate) {
            queryParams.append('startDate', filters.startDate);
        }

        if (filters?.endDate) {
            queryParams.append('endDate', filters.endDate);
        }

        if (filters?.department) {
            queryParams.append('department', filters.department);
        }

        if (filters?.leaveType) {
            queryParams.append('leaveType', filters.leaveType);
        }

        if (filters?.leaveStatus) {
            queryParams.append('leaveStatus', filters.leaveStatus);
        }

        const endpoint = `${API_ENDPOINTS.LEAVE_STATISTICS}?${queryParams.toString()}`;
        return fetchWithAuth(endpoint);
    },

    /**
     * Récupère les données pour prévoir la disponibilité de l'équipe
     */
    async getTeamAvailabilityForecast(departmentId: string, startDate: string, endDate: string): Promise<{
        date: string;
        availabilityPercentage: number;
        totalTeamMembers: number;
        availableMembers: number;
    }[]> {
        const queryParams = new URLSearchParams({
            departmentId,
            startDate,
            endDate
        });

        const endpoint = `${API_ENDPOINTS.TEAM_AVAILABILITY}?${queryParams.toString()}`;
        return fetchWithAuth(endpoint);
    },

    /**
     * Récupère les périodes de pointe identifiées pour les congés
     */
    async getPeakPeriods(threshold: number = 3): Promise<{
        startDate: string;
        endDate: string;
        count: number;
        impactScore: number;
        affectedDepartments: { id: string; name: string }[];
    }[]> {
        const endpoint = `${API_ENDPOINTS.PEAK_PERIODS}?threshold=${threshold}`;
        return fetchWithAuth(endpoint);
    },

    /**
     * Récupère les tendances de congés sur une période
     */
    async getLeaveTrends(aggregation: 'daily' | 'weekly' | 'monthly' = 'monthly', filters?: LeaveStatisticsFilters): Promise<{
        date: string;
        count: number;
        byType: Record<LeaveType, number>;
    }[]> {
        const queryParams = new URLSearchParams({ aggregation });

        if (filters?.startDate) {
            queryParams.append('startDate', filters.startDate);
        }

        if (filters?.endDate) {
            queryParams.append('endDate', filters.endDate);
        }

        if (filters?.department) {
            queryParams.append('department', filters.department);
        }

        const endpoint = `${API_ENDPOINTS.LEAVE_TRENDS}?${queryParams.toString()}`;
        return fetchWithAuth(endpoint);
    },

    /**
     * Génère et télécharge un rapport exportable
     */
    async generateReport(filters: LeaveStatisticsFilters, format: 'pdf' | 'csv' | 'excel' = 'pdf'): Promise<Blob> {
        const queryParams = new URLSearchParams();

        if (filters?.startDate) {
            queryParams.append('startDate', filters.startDate);
        }

        if (filters?.endDate) {
            queryParams.append('endDate', filters.endDate);
        }

        if (filters?.department) {
            queryParams.append('department', filters.department);
        }

        if (filters?.leaveType) {
            queryParams.append('leaveType', filters.leaveType);
        }

        if (filters?.leaveStatus) {
            queryParams.append('leaveStatus', filters.leaveStatus);
        }

        queryParams.append('format', format);

        const endpoint = `${API_ENDPOINTS.LEAVE_REPORTS}?${queryParams.toString()}`;
        return fetchWithAuth(endpoint, { responseType: 'blob' });
    }
} 