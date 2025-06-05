import { dashboardService, DashboardData } from '../dashboardService';
import { prisma } from '@/lib/prisma';
import { logError } from '../errorLoggingService';
import { Widget } from '@/types/dashboard';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        dashboard: {
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        }
    }
}));

jest.mock('../errorLoggingService', () => ({
    logError: jest.fn()
}));

describe('dashboardService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockWidget: Widget = {
        id: 'widget-1',
        type: 'chart',
        position: { x: 0, y: 0 },
        size: { width: 4, height: 3 },
        config: { title: 'Test Widget' }
    };

    const mockDashboardData: DashboardData = {
        id: 'dash-123',
        userId: 1,
        name: 'Test Dashboard',
        widgets: [mockWidget],
        layout: 'grid'
    };

    const mockDbDashboard = {
        id: 'dash-123',
        userId: 1,
        name: 'Test Dashboard',
        widgets: JSON.stringify([mockWidget]),
        layout: 'grid'
    };

    describe('getDashboard', () => {
        it('should return dashboard with parsed widgets', async () => {
            (prisma.dashboard.findFirst as jest.Mock).mockResolvedValue(mockDbDashboard);

            const result = await dashboardService.getDashboard(1);

            expect(prisma.dashboard.findFirst).toHaveBeenCalledWith({
                where: { userId: 1 }
            });
            expect(result).toEqual(mockDashboardData);
        });

        it('should return null if dashboard not found', async () => {
            (prisma.dashboard.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await dashboardService.getDashboard(1);

            expect(result).toBeNull();
        });

        it('should handle errors and log them', async () => {
            const error = new Error('Database error');
            (prisma.dashboard.findFirst as jest.Mock).mockRejectedValue(error);

            await expect(dashboardService.getDashboard(1)).rejects.toThrow('Database error');

            expect(logError).toHaveBeenCalledWith(
                'DashboardService.getDashboard',
                expect.objectContaining({
                    message: 'Database error',
                    code: 'DASHBOARD_SERVICE_ERROR',
                    severity: 'error',
                    context: { userId: 1 },
                    timestamp: expect.any(Date)
                })
            );
        });
    });

    describe('createDashboard', () => {
        it('should create dashboard with stringified widgets', async () => {
            (prisma.dashboard.create as jest.Mock).mockResolvedValue(mockDbDashboard);

            const result = await dashboardService.createDashboard(mockDashboardData);

            expect(prisma.dashboard.create).toHaveBeenCalledWith({
                data: {
                    ...mockDashboardData,
                    widgets: JSON.stringify(mockDashboardData.widgets)
                }
            });
            expect(result).toEqual(mockDashboardData);
        });

        it('should handle errors during creation', async () => {
            const error = new Error('Create failed');
            (prisma.dashboard.create as jest.Mock).mockRejectedValue(error);

            await expect(dashboardService.createDashboard(mockDashboardData)).rejects.toThrow('Create failed');

            expect(logError).toHaveBeenCalledWith(
                'DashboardService.createDashboard',
                expect.objectContaining({
                    message: 'Create failed',
                    code: 'DASHBOARD_SERVICE_ERROR',
                    severity: 'error',
                    context: { userId: 1 },
                    timestamp: expect.any(Date)
                })
            );
        });
    });

    describe('updateDashboard', () => {
        it('should update dashboard with new data', async () => {
            const updatedWidget: Widget = { ...mockWidget, config: { title: 'Updated Widget' } };
            const updateData = { widgets: [updatedWidget] };
            
            (prisma.dashboard.update as jest.Mock).mockResolvedValue({
                ...mockDbDashboard,
                widgets: JSON.stringify([updatedWidget])
            });

            const result = await dashboardService.updateDashboard('dash-123', updateData);

            expect(prisma.dashboard.update).toHaveBeenCalledWith({
                where: { id: 'dash-123' },
                data: {
                    widgets: JSON.stringify([updatedWidget])
                }
            });
            expect(result.widgets[0].config.title).toBe('Updated Widget');
        });

        it('should update dashboard without widgets', async () => {
            const updateData = { name: 'New Name' };
            
            (prisma.dashboard.update as jest.Mock).mockResolvedValue({
                ...mockDbDashboard,
                name: 'New Name'
            });

            const result = await dashboardService.updateDashboard('dash-123', updateData);

            expect(prisma.dashboard.update).toHaveBeenCalledWith({
                where: { id: 'dash-123' },
                data: {
                    name: 'New Name',
                    widgets: undefined
                }
            });
            expect(result.name).toBe('New Name');
        });

        it('should handle errors during update', async () => {
            const error = new Error('Update failed');
            (prisma.dashboard.update as jest.Mock).mockRejectedValue(error);

            await expect(dashboardService.updateDashboard('dash-123', {})).rejects.toThrow('Update failed');

            expect(logError).toHaveBeenCalledWith(
                'DashboardService.updateDashboard',
                expect.objectContaining({
                    message: 'Update failed',
                    code: 'DASHBOARD_SERVICE_ERROR',
                    severity: 'error',
                    context: { dashboardId: 'dash-123' },
                    timestamp: expect.any(Date)
                })
            );
        });
    });

    describe('deleteDashboard', () => {
        it('should delete dashboard successfully', async () => {
            (prisma.dashboard.delete as jest.Mock).mockResolvedValue({});

            await dashboardService.deleteDashboard('dash-123');

            expect(prisma.dashboard.delete).toHaveBeenCalledWith({
                where: { id: 'dash-123' }
            });
        });

        it('should handle errors during deletion', async () => {
            const error = new Error('Delete failed');
            (prisma.dashboard.delete as jest.Mock).mockRejectedValue(error);

            await expect(dashboardService.deleteDashboard('dash-123')).rejects.toThrow('Delete failed');

            expect(logError).toHaveBeenCalledWith(
                'DashboardService.deleteDashboard',
                expect.objectContaining({
                    message: 'Delete failed',
                    code: 'DASHBOARD_SERVICE_ERROR',
                    severity: 'error',
                    context: { dashboardId: 'dash-123' },
                    timestamp: expect.any(Date)
                })
            );
        });
    });

    describe('buildErrorDetails', () => {
        it('should handle API errors with response', async () => {
            const apiError = {
                response: {
                    status: 500,
                    data: {
                        message: 'Server error',
                        code: 'INTERNAL_ERROR',
                        details: { server: 'db-01' }
                    }
                },
                config: {
                    url: '/api/dashboard',
                    method: 'POST'
                }
            };

            (prisma.dashboard.create as jest.Mock).mockRejectedValue(apiError);

            await expect(dashboardService.createDashboard(mockDashboardData)).rejects.toThrow();

            expect(logError).toHaveBeenCalledWith(
                'DashboardService.createDashboard',
                expect.objectContaining({
                    message: 'Server error',
                    code: 'INTERNAL_ERROR',
                    severity: 'critical',
                    context: {
                        url: '/api/dashboard',
                        method: 'POST',
                        server: 'db-01',
                        userId: 1
                    }
                })
            );
        });

        it('should handle 4xx errors as non-critical', async () => {
            const apiError = {
                response: {
                    status: 400,
                    data: { message: 'Bad request' }
                }
            };

            (prisma.dashboard.create as jest.Mock).mockRejectedValue(apiError);

            await expect(dashboardService.createDashboard(mockDashboardData)).rejects.toThrow();

            expect(logError).toHaveBeenCalledWith(
                'DashboardService.createDashboard',
                expect.objectContaining({
                    severity: 'error' // Not critical for 4xx
                })
            );
        });
    });
});