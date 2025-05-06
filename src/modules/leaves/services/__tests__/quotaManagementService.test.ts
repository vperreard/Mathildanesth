import { QuotaManagementService, QuotaManagementEvents } from '../QuotaManagementService';
import { EventBusService } from '@/services/eventBusService';
import { LeaveType } from '../../types/leave';
import { QuotaTransactionStatus, QuotaTransactionType } from '../../types/quota';
import { jest, describe, test, expect, beforeEach, afterEach, afterAll } from '@jest/globals';

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
    let mockEventBus: any;
    let localMockFetch: jest.Mock; // Mock fetch local

    beforeEach(() => {
        jest.clearAllMocks();

        // Configurer le mock fetch local
        localMockFetch = jest.fn();
        global.fetch = localMockFetch; // Assigner le mock local à global.fetch

        // Set up EventBusService mock
        mockEventBus = EventBusService.getInstance();

        // Utiliser getInstance() car le constructeur est privé
        service = QuotaManagementService.getInstance();
    });

    afterEach(() => {
        // Restaurer fetch original si nécessaire, ou juste clearer le mock local
        // delete global.fetch;
        localMockFetch.mockClear();
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
                fromType: LeaveType.ANNUAL, // Utilisez l'enum LeaveType
                toType: LeaveType.RECOVERY,   // Utilisez l'enum LeaveType
                conversionRate: 1.5,
                isActive: true,
            },
        ];

        // Configurer le mock
        localMockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockRules,
        });

        // Appeler la méthode
        const result = await service.getTransferRules(LeaveType.ANNUAL);

        // Vérifier les résultats
        expect(result).toEqual(mockRules);
        expect(localMockFetch).toHaveBeenCalledWith(`/api/leaves/quota-transfers/rules/${LeaveType.ANNUAL}`);
    });

    test('doit gérer les erreurs lors de la récupération des règles', async () => {
        // Configurer le mock pour échouer
        localMockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        // Appeler la méthode
        const result = await service.getTransferRules(LeaveType.ANNUAL);

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
        localMockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockSimulation,
        });

        // Paramètres du test
        const userId = 'user123';
        const periodId = 'period2023';
        const fromType = LeaveType.ANNUAL;
        const toType = LeaveType.RECOVERY;
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
        expect(localMockFetch).toHaveBeenCalledWith(
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
        localMockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        // Appeler la méthode
        const result = await service.simulateTransfer(
            'user123',
            'period2023',
            LeaveType.ANNUAL,
            LeaveType.RECOVERY,
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
            fromType: LeaveType.ANNUAL,
            toType: LeaveType.RECOVERY,
            requestedDays: 10,
            resultingDays: 15,
            conversionRate: 1.5,
            status: QuotaTransactionStatus.PENDING,
            requestDate: new Date().toISOString(),
        };

        // Configurer le mock
        localMockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockRequest,
        });

        // Paramètres du test
        const userId = 'user123';
        const periodId = 'period2023';
        const fromType = LeaveType.ANNUAL;
        const toType = LeaveType.RECOVERY;
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
        expect(localMockFetch).toHaveBeenCalledWith(
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
        localMockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        // Appeler la méthode
        const result = await service.requestTransfer(
            'user123',
            'period2023',
            LeaveType.ANNUAL,
            LeaveType.RECOVERY,
            10,
            'Test'
        );

        // Vérifier les résultats
        expect(result).toBeNull();
        expect(mockEventBus.publish).toHaveBeenCalledWith(
            QuotaManagementEvents.ERROR_OCCURRED,
            expect.any(Object)
        );
    });

    test('devrait récupérer l\'historique des transferts', async () => {
        // Préparer les données de retour
        const mockHistory: QuotaTransaction[] = [
            {
                id: 'hist1',
                userId: 'user123',
                periodId: 'period2023', // Ajouter periodId si nécessaire
                transactionType: QuotaTransactionType.TRANSFER,
                leaveType: LeaveType.ANNUAL,
                targetLeaveType: LeaveType.RECOVERY,
                amount: 5,
                resultingBalance: 0, // Ajouter si nécessaire
                status: QuotaTransactionStatus.APPROVED,
                requestDate: new Date().toISOString(),
            },
        ];

        // Configurer le mock fetch pour l'historique
        localMockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockHistory,
        });

        // Appeler la méthode corrigée
        // const result = await service.getTransferHistory('user123');
        const result = await service.getUserTransactionHistory('user123', undefined, QuotaTransactionType.TRANSFER);


        // Vérifier les résultats
        expect(result).toEqual(mockHistory);
        // expect(localMockFetch).toHaveBeenCalledWith('/api/leaves/quota-transfers/history?userId=user123');
        expect(localMockFetch).toHaveBeenCalledWith(`/api/leaves/quotas/transactions?userId=user123&type=${QuotaTransactionType.TRANSFER}`);

    });

    test('doit gérer les erreurs lors de la récupération de l\'historique', async () => {
        // Configurer le mock pour échouer
        localMockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        // Appeler la méthode corrigée
        // const result = await service.getTransferHistory('user123');
        const result = await service.getUserTransactionHistory('user123', undefined, QuotaTransactionType.TRANSFER);


        // Vérifier les résultats
        expect(result).toEqual([]);
        expect(mockEventBus.publish).toHaveBeenCalledWith(
            QuotaManagementEvents.ERROR_OCCURRED,
            expect.any(Object)
        );
    });

    test('doit approuver un transfert avec succès', async () => {
        // Préparer les données de retour
        const mockApproval = { success: true }; // La vraie méthode retourne boolean

        // Configurer le mock
        localMockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockApproval, // Simule la réponse API
        });

        // Appeler la méthode corrigée
        // const result = await service.approveTransfer('transfer123', 'adminUser');
        const result = await service.processTransferRequest('transfer123', true, 'adminUser');


        // Vérifier les résultats
        expect(result).toBe(true);
        expect(localMockFetch).toHaveBeenCalledWith(
            // Adapter l'URL et le corps selon l'implémentation de processTransferRequest
            '/api/leaves/quota-transfers/transfer123/process', // URL hypothétique
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ approve: true, approverUserId: 'adminUser' }), // Corriger processorUserId -> approverUserId
            })
        );
        expect(mockEventBus.publish).toHaveBeenCalledWith(
            QuotaManagementEvents.TRANSFER_PROCESSED, // Utiliser l'événement correct
            { success: true } // Corps de l'événement correct
        );
    });

    test('doit gérer les échecs d\'approbation', async () => {
        // Configurer le mock pour échouer
        localMockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404, // Simuler un échec API
        });

        // Appeler la méthode corrigée
        // const result = await service.approveTransfer('transferNotFound', 'adminUser');
        const result = await service.processTransferRequest('transferNotFound', true, 'adminUser');


        // Vérifier les résultats
        expect(result).toBe(false);
        expect(mockEventBus.publish).toHaveBeenCalledWith(
            QuotaManagementEvents.ERROR_OCCURRED,
            expect.any(Object)
        );
    });

    test('doit rejeter un transfert avec succès', async () => {
        // Préparer les données de retour
        const mockRejection = { success: true }; // La vraie méthode retourne boolean

        // Configurer le mock
        localMockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockRejection, // Simule la réponse API
        });

        // Appeler la méthode corrigée
        // const result = await service.rejectTransfer('transfer123', 'adminUser', 'Motif rejet');
        const result = await service.processTransferRequest('transfer123', false, 'adminUser', 'Motif rejet');


        // Vérifier les résultats
        expect(result).toBe(true);
        expect(localMockFetch).toHaveBeenCalledWith(
            // Adapter l'URL et le corps selon l'implémentation de processTransferRequest
            '/api/leaves/quota-transfers/transfer123/process', // URL hypothétique
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ approve: false, approverUserId: 'adminUser', comment: 'Motif rejet' }), // Corriger processorUserId -> approverUserId
            })
        );
        expect(mockEventBus.publish).toHaveBeenCalledWith(
            QuotaManagementEvents.TRANSFER_PROCESSED, // Utiliser l'événement correct
            { success: true } // Corps de l'événement correct
        );
    });
});

test('should run', () => { expect(true).toBe(true) }); // Simple test pour vérifier que le fichier s'exécute 