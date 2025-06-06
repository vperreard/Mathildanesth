import { prisma } from '@/lib/prisma';
import { Widget } from '@/types/dashboard';
import { logError } from './errorLoggingService';
import { ErrorSeverity, ErrorDetails } from '@/hooks/useErrorHandler';


export interface DashboardData {
    id?: string;
    userId: number;
    name: string;
    widgets: Widget[];
    layout: 'grid' | 'free';
}

const buildErrorDetails = (error: unknown, context?: Record<string, unknown>): Omit<ErrorDetails, 'timestamp' | 'retry'> => {
    const status = error?.response?.status;
    const severity: ErrorSeverity = status && status >= 500 ? 'critical' : 'error';
    return {
        message: error?.response?.data?.message || error.message || 'Erreur inconnue dans le service dashboard.',
        code: error?.response?.data?.code || (status ? `API_${status}` : 'DASHBOARD_SERVICE_ERROR'),
        severity: severity,
        context: {
            ...(error?.config && { url: error.config.url, method: error.config.method }),
            ...(error?.response?.data?.details),
            ...context,
        },
    };
};

export const dashboardService = {
    async getDashboard(userId: number): Promise<DashboardData | null> {
        const operationKey = 'DashboardService.getDashboard';
        try {
            const dashboard = await prisma.dashboard.findFirst({
                where: { userId }
            });
            return dashboard ? {
                ...dashboard,
                layout: dashboard.layout as 'grid' | 'free',
                widgets: JSON.parse(dashboard.widgets as string)
            } : null;
        } catch (error: unknown) {
            const errorDetails = buildErrorDetails(error, { userId });
            logError(operationKey, { ...errorDetails, timestamp: new Date() });
            throw error;
        }
    },

    async createDashboard(data: DashboardData): Promise<DashboardData> {
        const operationKey = 'DashboardService.createDashboard';
        try {
            const dashboard = await prisma.dashboard.create({
                data: {
                    ...data,
                    widgets: JSON.stringify(data.widgets)
                }
            });
            return {
                ...dashboard,
                layout: dashboard.layout as 'grid' | 'free',
                widgets: JSON.parse(dashboard.widgets as string)
            };
        } catch (error: unknown) {
            const errorDetails = buildErrorDetails(error, { userId: data.userId });
            logError(operationKey, { ...errorDetails, timestamp: new Date() });
            throw error;
        }
    },

    async updateDashboard(id: string, data: Partial<DashboardData>): Promise<DashboardData> {
        const operationKey = 'DashboardService.updateDashboard';
        try {
            const dashboard = await prisma.dashboard.update({
                where: { id },
                data: {
                    ...data,
                    widgets: data.widgets ? JSON.stringify(data.widgets) : undefined
                }
            });
            return {
                ...dashboard,
                layout: dashboard.layout as 'grid' | 'free',
                widgets: JSON.parse(dashboard.widgets as string)
            };
        } catch (error: unknown) {
            const errorDetails = buildErrorDetails(error, { dashboardId: id });
            logError(operationKey, { ...errorDetails, timestamp: new Date() });
            throw error;
        }
    },

    async deleteDashboard(id: string): Promise<void> {
        const operationKey = 'DashboardService.deleteDashboard';
        try {
            await prisma.dashboard.delete({
                where: { id }
            });
        } catch (error: unknown) {
            const errorDetails = buildErrorDetails(error, { dashboardId: id });
            logError(operationKey, { ...errorDetails, timestamp: new Date() });
            throw error;
        }
    }
}; 