import { renderHook, act } from '@testing-library/react';
import { useQuotaTransfer } from '../useQuotaTransfer';
import { LeaveType } from '../../../types/leave';
import {
    fetchLeaveBalance,
    fetchActiveTransferRulesForUser,
    transferQuota,
    previewQuotaTransfer,
    fetchTransferHistory
} from '../../../services/quotaService';

// Mock des services
jest.mock('../../../services/quotaService', () => ({
    fetchLeaveBalance: jest.fn(),
    fetchActiveTransferRulesForUser: jest.fn(),
    transferQuota: jest.fn(),
    previewQuotaTransfer: jest.fn(),
    fetchTransferHistory: jest.fn()
}));

describe('useQuotaTransfer', () => {
    const userId = 'user-123';

    // Données de test
    const mockBalance = {
        userId: 'user-123',
        year: 2023,
        initialAllowance: 25,
        additionalAllowance: 10,
        used: 15,
        pending: 3,
        remaining: 17,
        detailsByType: {
            [LeaveType.ANNUAL]: { used: 12, pending: 2 },
            [LeaveType.RECOVERY]: { used: 3, pending: 1 }
        },
        lastUpdated: new Date()
    };

    const mockTransferRules = [
        {
            id: 'rule-1',
            name: 'Récupération vers Congés Annuels',
            sourceType: LeaveType.RECOVERY,
            targetType: LeaveType.ANNUAL,
            ruleType: 'STANDARD',
            ratio: 1.0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: 'rule-2',
            name: 'Congés Annuels vers Formation',
            sourceType: LeaveType.ANNUAL,
            targetType: LeaveType.TRAINING,
            ruleType: 'RATIO',
            ratio: 2.0, // 2 jours de congés annuels = 1 jour de formation
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];

    const mockTransferResult = {
        success: true,
        transferId: 'transfer-123',
        sourceAmount: 5,
        targetAmount: 5,
        sourceRemaining: 6,
        targetTotal: 10,
        message: 'Transfert effectué avec succès'
    };

    const mockPreviewResult = {
        success: true,
        sourceAmount: 5,
        targetAmount: 5,
        sourceRemaining: 6,
        targetTotal: 10,
        message: 'Simulation réussie'
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Configuration des mocks
        (fetchLeaveBalance as jest.Mock).mockResolvedValue(mockBalance);
        (fetchActiveTransferRulesForUser as jest.Mock).mockResolvedValue(mockTransferRules);
        (transferQuota as jest.Mock).mockResolvedValue(mockTransferResult);
        (previewQuotaTransfer as jest.Mock).mockResolvedValue(mockPreviewResult);
        (fetchTransferHistory as jest.Mock).mockResolvedValue([]);
    });

    it('devrait charger les données initiales', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useQuotaTransfer({ userId }));

        // Vérifier l'état initial
        expect(result.current.loading).toBe(true);
        expect(result.current.error).toBeNull();

        await waitForNextUpdate();

        // Vérifier l'état après chargement
        expect(result.current.loading).toBe(false);
        expect(result.current.balance).toEqual(mockBalance);
        expect(result.current.transferRules).toEqual(mockTransferRules);
        expect(fetchLeaveBalance).toHaveBeenCalledWith(userId);
        expect(fetchActiveTransferRulesForUser).toHaveBeenCalledWith(userId);
    });

    it('devrait calculer correctement les types disponibles', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useQuotaTransfer({ userId }));

        await waitForNextUpdate();

        // Vérifier les types sources disponibles
        expect(result.current.availableSourceTypes).toContain(LeaveType.ANNUAL);
        expect(result.current.availableSourceTypes).toContain(LeaveType.RECOVERY);

        // Vérifier les types cibles disponibles par source
        expect(result.current.availableTargetTypes[LeaveType.RECOVERY]).toContain(LeaveType.ANNUAL);
        expect(result.current.availableTargetTypes[LeaveType.ANNUAL]).toContain(LeaveType.TRAINING);
    });

    it('devrait simuler un transfert correctement', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useQuotaTransfer({ userId }));

        await waitForNextUpdate();

        // Préparer la requête de transfert
        const transferRequest = {
            userId,
            sourceType: LeaveType.RECOVERY,
            targetType: LeaveType.ANNUAL,
            sourceAmount: 5
        };

        // Exécuter la simulation
        let simulationResult;
        await act(async () => {
            simulationResult = await result.current.simulateTransfer(transferRequest);
        });

        // Vérifier les appels et le résultat
        expect(previewQuotaTransfer).toHaveBeenCalledWith(transferRequest);
        expect(simulationResult).toMatchObject({
            success: true,
            sourceAmount: 5,
            targetAmount: 5,
            sourceLabel: 'Récupération',
            targetLabel: 'Congés annuels',
            isAllowed: true
        });
    });

    it('devrait exécuter un transfert correctement', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useQuotaTransfer({ userId }));

        await waitForNextUpdate();

        // Préparer la requête de transfert
        const transferRequest = {
            userId,
            sourceType: LeaveType.RECOVERY,
            targetType: LeaveType.ANNUAL,
            sourceAmount: 5
        };

        // Exécuter le transfert
        let transferResult;
        await act(async () => {
            transferResult = await result.current.executeTransfer(transferRequest);
        });

        // Vérifier les appels et le résultat
        expect(transferQuota).toHaveBeenCalledWith(transferRequest);
        expect(fetchLeaveBalance).toHaveBeenCalledTimes(2); // Initial + After transfer
        expect(transferResult).toEqual(mockTransferResult);
    });

    it('devrait retourner une erreur si le transfert n\'est pas autorisé', async () => {
        // Modifier les règles pour rendre le transfert impossible
        (fetchActiveTransferRulesForUser as jest.Mock).mockResolvedValue([
            {
                ...mockTransferRules[0],
                isActive: false // Désactiver la règle
            }
        ]);

        const { result, waitForNextUpdate } = renderHook(() => useQuotaTransfer({ userId }));

        await waitForNextUpdate();

        // Préparer la requête de transfert
        const transferRequest = {
            userId,
            sourceType: LeaveType.RECOVERY,
            targetType: LeaveType.ANNUAL,
            sourceAmount: 5
        };

        // Exécuter le transfert
        let transferResult;
        await act(async () => {
            transferResult = await result.current.executeTransfer(transferRequest);
        });

        // Vérifier que le transfert a échoué
        expect(transferResult.success).toBe(false);
        expect(transferQuota).not.toHaveBeenCalled();
    });

    it('devrait gérer les erreurs du service de solde', async () => {
        // Simuler une erreur dans le service
        const errorMessage = 'Erreur lors de la récupération du solde';
        (fetchLeaveBalance as jest.Mock).mockRejectedValue(new Error(errorMessage));

        const { result, waitForNextUpdate } = renderHook(() => useQuotaTransfer({ userId }));

        await waitForNextUpdate();

        // Vérifier que l'erreur est capturée
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe(errorMessage);
    });

    it('devrait gérer les erreurs de transfert', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useQuotaTransfer({ userId }));

        await waitForNextUpdate();

        // Simuler une erreur dans le service de transfert
        const errorMessage = 'Erreur lors du transfert';
        (transferQuota as jest.Mock).mockRejectedValue(new Error(errorMessage));

        // Préparer la requête de transfert
        const transferRequest = {
            userId,
            sourceType: LeaveType.RECOVERY,
            targetType: LeaveType.ANNUAL,
            sourceAmount: 5
        };

        // Exécuter le transfert
        let transferResult;
        await act(async () => {
            transferResult = await result.current.executeTransfer(transferRequest);
        });

        // Vérifier que l'erreur est capturée
        expect(transferResult.success).toBe(false);
        expect(result.current.transferError).toBeInstanceOf(Error);
        expect(result.current.transferError?.message).toBe(errorMessage);
    });
}); 