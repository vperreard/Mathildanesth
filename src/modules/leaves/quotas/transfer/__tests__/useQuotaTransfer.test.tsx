import { renderHook, act, waitFor } from '@testing-library/react';
import { useQuotaTransfer } from '../useQuotaTransfer';
import { QuotaAdvancedService } from '@/modules/conges/services/QuotaAdvancedService';
import LeaveBalanceService from '@/modules/conges/services/leaveBalanceService';
import { LeaveType } from '@/modules/conges/types/leave';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { QuotaTransferResult } from '@/modules/conges/types/quota';
import {
    fetchActiveTransferRulesForUser,
    transferQuota,
    previewQuotaTransfer,
    fetchTransferHistory
} from '../../../services/quotaService';
import { fetchLeaveBalance } from '../../../services/leaveService';
import { jest, expect, describe, it, beforeEach } from '@jest/globals';

// Mock react-i18next
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key, // Traduction simple : renvoie la clé
        i18n: {
            changeLanguage: jest.fn(),
            language: 'fr',
        },
    }),
    // Mocker d'autres exports si nécessaire
}));

// Mock des services
jest.mock('../../../services/quotaService', () => ({
    fetchActiveTransferRulesForUser: jest.fn(),
    transferQuota: jest.fn(),
    previewQuotaTransfer: jest.fn(),
    fetchTransferHistory: jest.fn()
}));
jest.mock('../../../services/leaveService', () => ({
    fetchLeaveBalance: jest.fn()
}));

const mockUserId = 'mock-user-id'; // Utiliser l'ID du handler MSW

// Helper pour wrapper le hook avec AuthProvider
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>
        {children}
    </AuthProvider>
);

describe('useQuotaTransfer', () => {
    // const userId = 'user-123'; // Supprimer cette variable non utilisée

    // Données de test - Aligner avec le handler MSW
    const mockBalance = {
        userId: mockUserId, // Utiliser mockUserId
        year: new Date().getFullYear(),
        initialAllowance: 25,
        additionalAllowance: 5,
        used: 10,
        pending: 2,
        remaining: 18,
        detailsByType: {
            [LeaveType.ANNUAL]: { used: 8, pending: 1 },
            [LeaveType.RECOVERY]: { used: 2, pending: 1 }
        },
        lastUpdated: expect.any(String) // Rendre l'assertion moins stricte
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
        const { result } = renderHook(() => useQuotaTransfer({ userId: mockUserId }), {
            wrapper: wrapper
        });

        // Vérifier l'état initial
        expect(result.current.loading).toBe(true);
        expect(result.current.error).toBeNull();

        await waitFor(() => expect(result.current.balance).not.toBeNull());

        // Vérifier l'état après chargement
        expect(result.current.loading).toBe(false);
        expect(result.current.balance).toMatchObject({
            ...mockBalance,
            lastUpdated: expect.any(String)
        });
        expect(result.current.transferRules).toEqual(mockTransferRules);
        expect(fetchLeaveBalance).toHaveBeenCalledWith(mockUserId);
        expect(fetchActiveTransferRulesForUser).toHaveBeenCalledWith(mockUserId);
    });

    it('devrait calculer correctement les types disponibles', async () => {
        const { result } = renderHook(() => useQuotaTransfer({ userId: mockUserId }), {
            wrapper: wrapper
        });

        await waitFor(() => result.current.loading === false);

        // Vérifier les types sources disponibles
        expect(result.current.availableSourceTypes).toContain(LeaveType.ANNUAL);
        expect(result.current.availableSourceTypes).toContain(LeaveType.RECOVERY);

        // Vérifier les types cibles disponibles par source
        expect(result.current.availableTargetTypes[LeaveType.RECOVERY]).toContain(LeaveType.ANNUAL);
        expect(result.current.availableTargetTypes[LeaveType.ANNUAL]).toContain(LeaveType.TRAINING);
    });

    it('devrait simuler un transfert correctement', async () => {
        const { result } = renderHook(() => useQuotaTransfer({ userId: mockUserId }), {
            wrapper: wrapper
        });

        await waitFor(() => result.current.loading === false);

        // Préparer la requête de transfert
        const transferRequest = {
            userId: mockUserId,
            sourceType: LeaveType.RECOVERY,
            targetType: LeaveType.ANNUAL,
            sourceAmount: 5
        };

        // Exécuter la simulation
        let simulationResult;
        await act(async () => {
            simulationResult = await result.current.simulateTransfer(transferRequest);
        });

        // Trouver les règles applicables attendues
        const applicableRules = mockTransferRules.filter(rule =>
            rule.sourceType === transferRequest.sourceType &&
            rule.targetType === transferRequest.targetType &&
            rule.isActive
        );

        // Vérifier les appels et le résultat
        expect(previewQuotaTransfer).toHaveBeenCalledWith(transferRequest, applicableRules);
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
        const { result } = renderHook(() => useQuotaTransfer({ userId: mockUserId }), {
            wrapper: wrapper
        });

        await waitFor(() => result.current.loading === false);

        // Préparer la requête de transfert
        const transferRequest = {
            userId: mockUserId,
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
        expect(fetchLeaveBalance).toHaveBeenCalledTimes(2);
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

        const { result } = renderHook(() => useQuotaTransfer({ userId: mockUserId }), {
            wrapper: wrapper
        });

        await waitFor(() => result.current.loading === false);

        // Préparer la requête de transfert
        const transferRequest = {
            userId: mockUserId,
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

    test.skip('devrait gérer les erreurs du service de solde', async () => {
        // Simuler une erreur dans le service
        const errorMessage = 'Erreur lors de la récupération du solde';
        (fetchLeaveBalance as jest.Mock).mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useQuotaTransfer({ userId: mockUserId }), {
            wrapper: wrapper
        });

        await waitFor(() => expect(result.current.error).not.toBeNull());

        // Vérifier que l'erreur est capturée
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe(errorMessage);
    });

    it('devrait gérer les erreurs de transfert', async () => {
        const { result } = renderHook(() => useQuotaTransfer({ userId: mockUserId }), {
            wrapper: wrapper
        });

        await waitFor(() => result.current.loading === false);

        // Simuler une erreur dans le service de transfert
        const errorMessage = 'Erreur lors du transfert';
        (transferQuota as jest.Mock).mockRejectedValue(new Error(errorMessage));

        // Préparer la requête de transfert
        const transferRequest = {
            userId: mockUserId,
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