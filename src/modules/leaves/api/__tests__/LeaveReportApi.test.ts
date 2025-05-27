import {
    LeaveReportApi,
    ExportFormat,
    ReportType,
    LeaveReportFilter
} from '../leaveReportApi';
import axios from 'axios';
import { format } from 'date-fns';
import { performanceTracker } from '../../utils/performanceMonitoring';

// Mock des dépendances
jest.mock('axios');
jest.mock('../../utils/performanceMonitoring', () => ({
    performanceTracker: {
        measure: jest.fn(),
        recordMetric: jest.fn()
    }
}));

describe('LeaveReportApi', () => {
    let reportApi: LeaveReportApi;

    // Données de test
    const mockReportData = {
        data: [
            { userId: 'user1', days: 10, type: 'ANNUAL' },
            { userId: 'user2', days: 5, type: 'SICK' }
        ],
        totalCount: 2,
        metadata: {
            generatedAt: new Date(),
            filters: {},
            reportType: ReportType.LEAVE_USAGE
        }
    };

    const mockFilters: LeaveReportFilter = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        userIds: ['user1', 'user2'],
        departmentIds: ['dept1'],
        leaveTypes: ['ANNUAL', 'SICK'],
        sortBy: 'date',
        sortOrder: 'asc',
        limit: 100
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Réinitialiser l'instance singleton
        const reportApiAny = LeaveReportApi as any;
        reportApiAny.instance = undefined;

        // Mock des réponses axios par défaut
        (axios.get as jest.Mock).mockResolvedValue({ data: mockReportData });
        (axios.post as jest.Mock).mockResolvedValue({ data: { id: 'export-task-1' } });

        // Obtenir une nouvelle instance
        reportApi = LeaveReportApi.getInstance();
    });

    describe('getInstance', () => {
        it('devrait retourner une instance singleton', () => {
            // Act
            const instance1 = LeaveReportApi.getInstance();
            const instance2 = LeaveReportApi.getInstance();

            // Assert
            expect(instance1).toBe(instance2);
        });
    });

    describe('normalizeDateParam', () => {
        it('devrait formater correctement les dates', () => {
            // Arrange
            const dateObj = new Date('2023-05-15');
            const dateStr = '2023-05-15';
            const invalidDateStr = 'not-a-date';

            // Act & Assert
            expect((reportApi as any).normalizeDateParam(dateObj)).toBe('2023-05-15');
            expect((reportApi as any).normalizeDateParam(dateStr)).toBe('2023-05-15');
            expect((reportApi as any).normalizeDateParam(invalidDateStr)).toBeUndefined();
            expect((reportApi as any).normalizeDateParam(undefined)).toBeUndefined();
        });
    });

    describe('getReportData', () => {
        it('devrait récupérer des données de rapport correctement', async () => {
            // Act
            const result = await reportApi.getReportData(ReportType.LEAVE_USAGE, mockFilters);

            // Assert
            expect(axios.get).toHaveBeenCalledWith(
                '/api/conges/reports/leave_usage',
                expect.objectContaining({
                    headers: expect.any(Object),
                    params: expect.objectContaining({
                        startDate: format(mockFilters.startDate as Date, 'yyyy-MM-dd'),
                        endDate: format(mockFilters.endDate as Date, 'yyyy-MM-dd'),
                        userIds: mockFilters.userIds,
                        departmentIds: mockFilters.departmentIds,
                        leaveTypes: mockFilters.leaveTypes
                    })
                })
            );
            expect(result).toEqual(mockReportData);
            expect(performanceTracker.measure).toHaveBeenCalledWith(
                'LeaveReportApi.getReportData',
                expect.any(Number)
            );
        });

        it('devrait gérer les erreurs lors de la récupération de rapports', async () => {
            // Arrange
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const mockError = new Error('Erreur API');
            (axios.get as jest.Mock).mockRejectedValue(mockError);

            // Act & Assert
            await expect(reportApi.getReportData(ReportType.LEAVE_USAGE, mockFilters))
                .rejects.toThrow(mockError);

            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });
    });

    describe('méthodes de rapport spécifiques', () => {
        beforeEach(() => {
    jest.clearAllMocks();
            jest.spyOn(reportApi, 'getReportData').mockResolvedValue(mockReportData);
        });

        it('devrait appeler getReportData avec le bon type pour getLeaveUsageReport', async () => {
            // Act
            await reportApi.getLeaveUsageReport(mockFilters);

            // Assert
            expect(reportApi.getReportData).toHaveBeenCalledWith(
                ReportType.LEAVE_USAGE,
                mockFilters
            );
        });

        it('devrait appeler getReportData avec le bon type pour getLeaveBalanceReport', async () => {
            // Act
            await reportApi.getLeaveBalanceReport(mockFilters);

            // Assert
            expect(reportApi.getReportData).toHaveBeenCalledWith(
                ReportType.LEAVE_BALANCE,
                mockFilters
            );
        });

        it('devrait appeler getReportData avec le bon type pour getLeaveDistributionReport', async () => {
            // Act
            await reportApi.getLeaveDistributionReport(mockFilters);

            // Assert
            expect(reportApi.getReportData).toHaveBeenCalledWith(
                ReportType.LEAVE_DISTRIBUTION,
                mockFilters
            );
        });

        it('devrait appeler getReportData avec le bon type pour getDepartmentComparisonReport', async () => {
            // Act
            await reportApi.getDepartmentComparisonReport(mockFilters);

            // Assert
            expect(reportApi.getReportData).toHaveBeenCalledWith(
                ReportType.DEPARTMENT_COMPARISON,
                mockFilters
            );
        });

        it('devrait appeler getReportData avec le bon type pour getLeaveHistoryReport', async () => {
            // Act
            await reportApi.getLeaveHistoryReport(mockFilters);

            // Assert
            expect(reportApi.getReportData).toHaveBeenCalledWith(
                ReportType.LEAVE_HISTORY,
                mockFilters
            );
        });

        it('devrait appeler getReportData avec le bon type pour getApprovalTimeReport', async () => {
            // Act
            await reportApi.getApprovalTimeReport(mockFilters);

            // Assert
            expect(reportApi.getReportData).toHaveBeenCalledWith(
                ReportType.APPROVAL_TIME,
                mockFilters
            );
        });

        it('devrait appeler getReportData avec le bon type pour getQuotaTransfersReport', async () => {
            // Act
            await reportApi.getQuotaTransfersReport(mockFilters);

            // Assert
            expect(reportApi.getReportData).toHaveBeenCalledWith(
                ReportType.QUOTA_TRANSFERS,
                mockFilters
            );
        });
    });

    describe('getCustomReport', () => {
        it('devrait appeler l\'API avec une requête personnalisée', async () => {
            // Arrange
            const customQuery = {
                groupBy: 'department',
                metrics: ['count', 'average'],
                dimensions: ['leaveType', 'status']
            };

            // Act
            await reportApi.getCustomReport(customQuery);

            // Assert
            expect(axios.post).toHaveBeenCalledWith(
                '/api/conges/reports/custom',
                customQuery,
                expect.any(Object)
            );
            expect(performanceTracker.measure).toHaveBeenCalledWith(
                'LeaveReportApi.getCustomReport',
                expect.any(Number)
            );
        });
    });

    describe('exportReport', () => {
        it('devrait lancer une tâche d\'exportation', async () => {
            // Arrange
            const mockExportOptions = {
                format: ExportFormat.CSV,
                fileName: 'rapport-conges-2023.csv',
                includeHeaders: true
            };

            // Act
            const taskId = await reportApi.exportReport(
                ReportType.LEAVE_USAGE,
                mockFilters,
                mockExportOptions
            );

            // Assert
            expect(axios.post).toHaveBeenCalledWith(
                `/api/conges/reports/leave_usage/export`,
                expect.objectContaining({
                    filters: {
                        ...mockFilters,
                        startDate: format(mockFilters.startDate as Date, 'yyyy-MM-dd'),
                        endDate: format(mockFilters.endDate as Date, 'yyyy-MM-dd'),
                    },
                    exportOptions: mockExportOptions
                }),
                expect.any(Object) // Pour les headers
            );
            expect(taskId).toBe('export-task-1');
            expect(performanceTracker.measure).toHaveBeenCalledWith(
                'LeaveReportApi.exportReport',
                expect.any(Number)
            );
        });
    });

    describe('getExportStatus', () => {
        it('devrait récupérer le statut d\'une tâche d\'exportation', async () => {
            const taskId = 'export-task-123'; // Définir une valeur test
            const mockStatus = { status: 'COMPLETED', url: '/exports/report.csv' };
            axios.get.mockResolvedValue({ data: mockStatus });

            // Act
            const status = await reportApi.getExportStatus(taskId);

            // Assert
            expect(axios.get).toHaveBeenCalledWith(
                `/api/conges/reports/export/${taskId}/status`,
                expect.any(Object) // headers
            );
            expect(status).toEqual(mockStatus);
        });
    });

    describe('downloadExportedFile', () => {
        it('devrait télécharger un fichier exporté', async () => {
            // Arrange
            const mockBlob = new Blob(['test data'], { type: 'text/csv' });

            (axios.get as jest.Mock).mockResolvedValue({
                data: mockBlob,
                headers: {
                    'content-type': 'text/csv',
                    'content-disposition': 'attachment; filename="report.csv"'
                }
            });

            // Act
            const blob = await reportApi.downloadExportedFile('export-task-1');

            // Assert
            expect(axios.get).toHaveBeenCalledWith(
                '/api/conges/reports/export/export-task-1/download',
                expect.objectContaining({
                    responseType: 'blob'
                })
            );
            expect(blob).toBe(mockBlob);
        });
    });
}); 