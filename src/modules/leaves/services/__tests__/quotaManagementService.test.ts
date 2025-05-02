import { QuotaManagementService, QuotaManagementEvents } from '../quotaManagementService';
import { EventBusService } from '@/services/eventBusService';
import { LeaveType } from '../../types/leave';
import { QuotaTransactionStatus, QuotaTransactionType } from '../../types/quota';

// Mock global fetch
global.fetch = jest.fn();

// Mock EventBusService
jest.mock('@/services/eventBusService', () => {
    return {
        EventBusService: {
            getInstance: jest.fn().mockReturnValue({
                publish: jest.fn(),
                subscribe: jest.fn().mockReturnValue(jest.fn()),
                unsubscribe: jest.fn(),
            }),
        },
    };
});

describe('QuotaManagementService', () => {
    let service: QuotaManagementService;
    let mockFetch: jest.Mock;
    let mockEventBus: any;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Set up fetch mock
        mockFetch = global.fetch as jest.Mock;

        // Set up EventBusService mock
        mockEventBus = EventBusService.getInstance();

        // Get service instance
        service = QuotaManagementService.getInstance();
    });

    test('doit être un singleton', () => {
        const instance1 = QuotaManagementService.getInstance();
        const instance2 = QuotaManagementService.getInstance();
        expect(instance1).toBe(instance2);
    });

    test('doit récupérer les règles de transfert', async () => {
        // Préparer les données de retour
        const mockRules = [
            {
                id: '1',
                fromType: LeaveType.CONGE_PAYE,
                toType: LeaveType.RTT,
                conversionRate: 1.5,
                isActive: true,
            },
        ];

        // Configurer le mock
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockRules,
        });

        // Appeler la méthode
        const result = await service.getTransferRules(LeaveType.CONGE_PAYE);

        // Vérifier les résultats
        expect(result).toEqual(mockRules);
        expect(mockFetch).toHaveBeenCalledWith(`/api/leaves/quota-transfers/rules/${LeaveType.CONGE_PAYE}`);
    });

    test('doit gérer les erreurs lors de la récupération des règles', async () => {
        // Configurer le mock pour échouer
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        // Appeler la méthode
        const result = await service.getTransferRules(LeaveType.CONGE_PAYE);

        // Vérifier les résultats
        expect(result).toEqual([]);
        expect(mockEventBus.publish).toHaveBeenCalledWith(
            QuotaManagementEvents.ERROR_OCCURRED,
            expect.objectContaining({
                message: expect.stringContaining('règles de transfert'),
            })
        );
    });

    test('devrait simuler un transfert de quota avec succès', async () => {
        // Préparer les données de retour
        const mockSimulation = {
            isValid: true,
            sourceRemaining: 10,
            resultingDays: 15,
            conversionRate: 1.5,
            requiresApproval: false,
        };

        // Configurer le mock
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockSimulation,
        });

        // Paramètres du test
        const userId = 'user123';
        const periodId = 'period2023';
        const fromType = LeaveType.CONGE_PAYE;
        const toType = LeaveType.RTT;
        const days = 10;

        // Appeler la méthode
        const result = await service.simulateTransfer(
            userId,
            periodId,
            fromType,
            toType,
            days
        );

        // Vérifier les résultats
        expect(result).toEqual(mockSimulation);
        expect(mockFetch).toHaveBeenCalledWith(
            '/api/leaves/quota-transfers/simulate',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    userId,
                    periodId,
                    fromType,
                    toType,
                    days,
                }),
            })
        );
    });

    test('doit gérer les erreurs lors de la simulation de transfert', async () => {
        // Configurer le mock pour échouer
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        // Appeler la méthode
        const result = await service.simulateTransfer(
            'user123',
            'period2023',
            LeaveType.CONGE_PAYE,
            LeaveType.RTT,
            10
        );

        // Vérifier les résultats
        expect(result).toEqual(expect.objectContaining({
            isValid: false,
            message: expect.stringContaining('erreur'),
        }));
        expect(mockEventBus.publish).toHaveBeenCalledWith(
            QuotaManagementEvents.ERROR_OCCURRED,
            expect.any(Object)
        );
    });

    test('doit demander un transfert avec succès', async () => {
        // Préparer les données de retour
        const mockRequest = {
            id: 'transfer123',
            userId: 'user123',
            periodId: 'period2023',
            fromType: LeaveType.CONGE_PAYE,
            toType: LeaveType.RTT,
            requestedDays: 10,
            resultingDays: 15,
            conversionRate: 1.5,
            status: QuotaTransactionStatus.PENDING,
            requestDate: new Date().toISOString(),
        };

        // Configurer le mock
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockRequest,
        });

        // Paramètres du test
        const userId = 'user123';
        const periodId = 'period2023';
        const fromType = LeaveType.CONGE_PAYE;
        const toType = LeaveType.RTT;
        const days = 10;
        const comment = 'Test transfer';

        // Appeler la méthode
        const result = await service.requestTransfer(
            userId,
            periodId,
            fromType,
            toType,
            days,
            comment
        );

        // Vérifier les résultats
        expect(result).toEqual(mockRequest);
        expect(mockFetch).toHaveBeenCalledWith(
            '/api/leaves/quota-transfers/request',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    userId,
                    periodId,
                    fromType,
                    toType,
                    requestedDays: days,
                    comment,
                }),
            })
        );
        expect(mockEventBus.publish).toHaveBeenCalledWith(
            QuotaManagementEvents.TRANSFER_REQUESTED,
            mockRequest
        );
    });

    test('doit gérer les erreurs lors de la demande de transfert', async () => {
        // Configurer le mock pour échouer
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        // Appeler la méthode
        const result = await service.requestTransfer(
            'user123',
            'period2023',
            LeaveType.CONGE_PAYE,
            LeaveType.RTT,
            10
        );

        // Vérifier les résultats
        expect(result).toBeNull();
        expect(mockEventBus.publish).toHaveBeenCalledWith(
            QuotaManagementEvents.ERROR_OCCURRED,
            expect.any(Object)
        );
    });

    test('doit traiter une demande de transfert avec succès', async () => {
        // Préparer les données de retour
        const mockResult = {
            id: 'transfer123',
            status: QuotaTransactionStatus.APPROVED,
            processDate: new Date().toISOString(),
        };

        // Configurer le mock
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResult,
        });

        // Paramètres du test
        const transferRequestId = 'transfer123';
        const approve = true;
        const approverUserId = 'admin123';
        const comment = 'Approved transfer';

        // Appeler la méthode
        const result = await service.processTransferRequest(
            transferRequestId,
            approve,
            approverUserId,
            comment
        );

        // Vérifier les résultats
        expect(result).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
            `/api/leaves/quota-transfers/${transferRequestId}/process`,
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    approve,
                    approverUserId,
                    comment,
                }),
            })
        );
        expect(mockEventBus.publish).toHaveBeenCalledWith(
            QuotaManagementEvents.TRANSFER_PROCESSED,
            mockResult
        );
    });

    test('doit s\'abonner correctement aux événements', () => {
        const mockCallback = jest.fn();

        // S'abonner à un événement
        const unsubscribe = service.subscribe(QuotaManagementEvents.QUOTA_UPDATED, mockCallback);

        // Vérifier que l'abonnement a été effectué
        expect(mockEventBus.subscribe).toHaveBeenCalledWith(
            QuotaManagementEvents.QUOTA_UPDATED,
            mockCallback
        );

        // Désabonner
        unsubscribe();

        // Vérifier que le désabonnement a été effectué
        expect(mockEventBus.unsubscribe).toHaveBeenCalledWith(
            QuotaManagementEvents.QUOTA_UPDATED,
            mockCallback
        );
    });

    test('doit calculer la disponibilité du quota correctement', async () => {
        // Préparer les données de retour
        const mockCalculation = {
            eligible: true,
            availableDays: 20,
            requestedDays: 5,
            remaining: 15,
            requiresApproval: false,
            details: {
                initialBalance: 25,
                adjustments: 0,
                used: 5,
                pending: 0,
                carriedOver: 0,
                transferredIn: 0,
                transferredOut: 0,
            }
        };

        // Configurer le mock
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockCalculation,
        });

        // Paramètres du test
        const userId = 'user123';
        const leaveType = LeaveType.CONGE_PAYE;
        const periodId = 'period2023';
        const requestedDays = 5;

        // Appeler la méthode
        const result = await service.calculateQuotaAvailability(
            userId,
            leaveType,
            periodId,
            requestedDays
        );

        // Vérifier les résultats
        expect(result).toEqual(mockCalculation);
        expect(mockFetch).toHaveBeenCalledWith(
            '/api/leaves/quotas/calculate',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    userId,
                    leaveType,
                    periodId,
                    requestedDays,
                }),
            })
        );
    });

    test('doit ajuster un quota avec succès', async () => {
        // Préparer les données de retour
        const mockAdjustment = {
            id: 'adj123',
            userId: 'user123',
            leaveType: LeaveType.CONGE_PAYE,
            amount: 5,
            resultingBalance: 25,
        };

        // Configurer le mock
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockAdjustment,
        });

        // Paramètres du test
        const userId = 'user123';
        const leaveType = LeaveType.CONGE_PAYE;
        const periodId = 'period2023';
        const adjustmentDays = 5;
        const reason = 'Prime d\'ancienneté';
        const adminId = 'admin123';

        // Appeler la méthode
        const result = await service.adjustQuotaBalance(
            userId,
            leaveType,
            periodId,
            adjustmentDays,
            reason,
            adminId
        );

        // Vérifier les résultats
        expect(result).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
            '/api/leaves/quotas/adjust',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    userId,
                    leaveType,
                    periodId,
                    adjustmentDays,
                    reason,
                    adminId
                }),
            })
        );
        expect(mockEventBus.publish).toHaveBeenCalledWith(
            QuotaManagementEvents.QUOTA_UPDATED,
            mockAdjustment
        );
    });
}); 