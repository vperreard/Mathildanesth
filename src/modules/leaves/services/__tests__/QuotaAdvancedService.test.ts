import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { server, http } from '@/tests/mocks/server';
import { HttpResponse } from 'msw';
import { QuotaAdvancedService, quotaAdvancedService } from '../QuotaAdvancedService';

// MODIFIÉ: Imports spécifiques pour le mock manuel
import * as quotaService from '../quotaService';
import * as leaveService from '../leaveService';

import AuditService from '@/services/AuditService';
import EventBusService from '@/services/eventBusService';
import { LeaveType, LeaveBalance } from '@/modules/leaves/types/leave';
import {
    QuotaTransferRule,
    QuotaCarryOverRule,
    QuotaTransferRuleType,
    QuotaCarryOverRuleType
} from '@/modules/leaves/types/quota';
import { addMonths } from '@/utils/dateUtils';
import { QuotaTransactionStatus } from '@/modules/leaves/types/quota';
import { QuotaCarryOverCalculationResult } from '@/modules/leaves/types/quota';

// Mock des services externes
// Supprimé: jest.mock('../leaveService');
// Supprimé: jest.mock('../quotaService');

// --- Mocks manuels --- 
// Pour leaveService
const mockFetchLeaveBalance = jest.fn<typeof leaveService.fetchLeaveBalance>();
jest.mock('../leaveService', () => ({
    __esModule: true,
    fetchLeaveBalance: mockFetchLeaveBalance,
    // Ajoutez d'autres exports de leaveService ici si nécessaire, mockés avec jest.fn()
}));

// Pour quotaService
const mockFetchActiveTransferRulesForUser = jest.fn<typeof quotaService.fetchActiveTransferRulesForUser>();
const mockFetchActiveCarryOverRulesForUser = jest.fn<typeof quotaService.fetchActiveCarryOverRulesForUser>();
const mockFetchTransferHistory = jest.fn<typeof quotaService.fetchTransferHistory>();
const mockFetchCarryOverHistory = jest.fn<typeof quotaService.fetchCarryOverHistory>();
jest.mock('../quotaService', () => ({
    __esModule: true,
    fetchActiveTransferRulesForUser: mockFetchActiveTransferRulesForUser,
    fetchActiveCarryOverRulesForUser: mockFetchActiveCarryOverRulesForUser,
    fetchTransferHistory: mockFetchTransferHistory,
    fetchCarryOverHistory: mockFetchCarryOverHistory,
}));

// Mocker AuditService explicitement pour contrôler getInstance et logAction
const mockLogActionGlobal = jest.fn<() => Promise<void>>();
jest.mock('@/services/AuditService', () => ({
    __esModule: true,
    default: {
        getInstance: jest.fn().mockReturnValue({
            logAction: mockLogActionGlobal
        })
    }
}));

jest.mock('@/services/eventBusService', () => ({
    __esModule: true,
    default: {
        getInstance: jest.fn().mockReturnValue({
            publish: jest.fn(),
            subscribe: jest.fn()
        })
    }
}));
// Simplification des mocks dateUtils (types inférés)
jest.mock('@/utils/dateUtils', () => ({
    formatDate: jest.fn((date: string | number | Date): string => new Date(date).toLocaleDateString()),
    addMonths: jest.fn((date: string | number | Date, months: number): Date => {
        const newDate = new Date(date);
        newDate.setMonth(newDate.getMonth() + months);
        return newDate;
    }),
    getDaysUntil: jest.fn((): number => 15),
    isDateInFuture: jest.fn().mockImplementation(() => true)
}));

// Configuration globale pour les mocks fetch - SUPPRIMER
// global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Données mock pour les tests
const mockUserId = 'user-123';
const mockYear = 2024;

// Revenir à la structure originale de mockLeaveBalance qui correspond à la 1ère définition dans le fichier de types
// et utiliser l'assertion de type pour passer le linter.
const mockLeaveBalance = {
    userId: mockUserId,
    year: mockYear,
    balances: { // Utiliser la propriété 'balances'
        [LeaveType.ANNUAL]: {
            initial: 25,
            used: 5,
            pending: 2,
            remaining: 18,
            acquired: 25,
        },
        [LeaveType.RECOVERY]: {
            initial: 10,
            used: 3,
            pending: 0,
            remaining: 7,
            acquired: 10,
        },
        // Ajouter d'autres types si nécessaire
    },
    lastUpdated: new Date().toISOString(),
} as unknown as LeaveBalance; // Garder l'assertion de type

const mockTransferRules: QuotaTransferRule[] = [
    {
        id: 'rule-1',
        fromType: LeaveType.RECOVERY,
        toType: LeaveType.ANNUAL,
        conversionRate: 1,
        maxTransferDays: 5,
        requiresApproval: false,
        isActive: true,
        ruleType: QuotaTransferRuleType.STANDARD,
        maxTransferPercentage: undefined,
        authorizedRoles: undefined,
        departmentId: undefined,
        applicableUserRoles: undefined,
        minimumRemainingDays: undefined,
        metadata: undefined,
    },
    {
        id: 'rule-2',
        fromType: LeaveType.ANNUAL,
        toType: LeaveType.RECOVERY,
        conversionRate: 0.5,
        maxTransferPercentage: 10,
        requiresApproval: true,
        authorizedRoles: ['manager'],
        isActive: true,
        ruleType: QuotaTransferRuleType.ROLE_BASED,
        maxTransferDays: undefined,
        departmentId: undefined,
        applicableUserRoles: undefined,
        minimumRemainingDays: undefined,
        metadata: undefined,
    }
];

const mockCarryOverRules: QuotaCarryOverRule[] = [
    {
        id: 'carry-rule-1',
        leaveType: LeaveType.ANNUAL,
        ruleType: QuotaCarryOverRuleType.PERCENTAGE,
        value: 50,
        maxCarryOverDays: 10,
        expirationDays: 90,
        requiresApproval: false,
        isActive: true,
        authorizedRoles: undefined,
        departmentId: undefined,
        applicableUserRoles: undefined,
        metadata: undefined,
    }
];

// Correction des types dans mockTransferHistory
const mockTransferHistory = [
    {
        id: 'transfer-1',
        userId: 'user-123',
        sourceType: LeaveType.RECOVERY, // Utilisation de LeaveType.RECOVERY
        targetType: LeaveType.ANNUAL,   // Utilisation de LeaveType.ANNUAL
        sourceAmount: 2,
        targetAmount: 1.6,
        ratio: 0.8,
        ruleApplied: 'rule-1',
        createdAt: new Date(),
        createdBy: 'user-123',
        comment: 'Transfert test'
    }
];

// Correction des types dans mockCarryOverHistory
const mockCarryOverHistory = [
    {
        id: 'carryover-1',
        userId: 'user-123',
        leaveType: LeaveType.ANNUAL, // Utilisation de LeaveType.ANNUAL
        fromYear: mockYear - 1,
        toYear: mockYear,
        originalAmount: 4,
        carriedAmount: 4,
        expiryDate: addMonths(new Date(mockYear, 0, 1), 3),
        ruleApplied: 'co-rule-1',
        createdAt: new Date(),
        createdBy: 'user-123',
        status: 'completed'
    }
];

// Handlers MSW spécifiques à ce test - MIS À JOUR pour MSW v2 avec http et HttpResponse
const quotaHandlers = [
    http.post('/api/leaves/quotas/transfer', async ({ request }) => {
        // const body = await request.json(); // Décommentez si vous avez besoin du corps de la requête
        return HttpResponse.json({
            success: true,
            transferId: 'mock-transfer-id-from-msw',
            // ... autres champs attendus par QuotaTransferResult (si applicable pour ce mock)
        }, { status: 200 });
    }),
    http.post('/api/leaves/quotas/carry-over', async ({ request }) => {
        // const body = await request.json();
        return HttpResponse.json({
            success: true,
            id: 'mock-carryover-id-from-msw',
        }, { status: 200 });
    }),
    http.post('/api/leaves/audit/entries', async ({ request }) => {
        // const body = await request.json();
        return HttpResponse.json({ id: 'mock-audit-entry-id', success: true }, { status: 201 });
    }),
    http.get('/api/leaves/quotas/transfer/history', () => {
        return HttpResponse.json(mockTransferHistory, { status: 200 });
    }),
    http.get('/api/leaves/quotas/carry-over/history', () => {
        return HttpResponse.json(mockCarryOverHistory, { status: 200 });
    }),
];

// Configurer les mocks avant chaque test
beforeEach(() => {
    jest.clearAllMocks();
    mockLogActionGlobal.mockClear(); // Utiliser la variable globale du mock
    mockLogActionGlobal.mockResolvedValue(undefined); // Configurer la résolution pour Promise<void>
    server.use(...quotaHandlers);

    // MODIFIÉ: Utiliser les mocks manuels
    mockFetchLeaveBalance.mockResolvedValue(mockLeaveBalance);
    mockFetchActiveTransferRulesForUser.mockResolvedValue(mockTransferRules);
    mockFetchActiveCarryOverRulesForUser.mockResolvedValue(mockCarryOverRules);
    mockFetchTransferHistory.mockResolvedValue(mockTransferHistory);
    mockFetchCarryOverHistory.mockResolvedValue(mockCarryOverHistory);
});

describe('QuotaAdvancedService', () => {
    describe('getActiveTransferRules', () => {
        it('devrait récupérer les règles de transfert actives', async () => {
            const rules = await quotaAdvancedService.getActiveTransferRules(mockUserId);
            // MODIFIÉ: Vérifier l'appel sur le mock manuel
            expect(mockFetchActiveTransferRulesForUser).toHaveBeenCalledWith(mockUserId);
            expect(rules).toEqual(mockTransferRules);
        });

        it('devrait gérer les erreurs lors de la récupération des règles', async () => {
            // MODIFIÉ: Configurer le mock manuel
            mockFetchActiveTransferRulesForUser.mockRejectedValue(new Error('Test error'));
            await expect(quotaAdvancedService.getActiveTransferRules(mockUserId)).rejects.toThrow('Test error');
        });
    });

    describe('getActiveCarryOverRules', () => {
        it('devrait récupérer les règles de report actives', async () => {
            const rules = await quotaAdvancedService.getActiveCarryOverRules(mockUserId);
            // MODIFIÉ: Vérifier l'appel sur le mock manuel
            expect(mockFetchActiveCarryOverRulesForUser).toHaveBeenCalledWith(mockUserId);
            expect(rules).toEqual(mockCarryOverRules);
        });

        it('devrait gérer les erreurs lors de la récupération des règles', async () => {
            // MODIFIÉ: Configurer le mock manuel
            mockFetchActiveCarryOverRulesForUser.mockRejectedValue(new Error('Test error'));
            await expect(quotaAdvancedService.getActiveCarryOverRules(mockUserId)).rejects.toThrow('Test error');
        });
    });

    describe('simulateTransfer', () => {
        it('devrait simuler un transfert valide avec application des règles', async () => {
            const result = await quotaAdvancedService.simulateTransfer({
                userId: mockUserId,
                sourceType: LeaveType.RECOVERY,
                targetType: LeaveType.ANNUAL,
                amount: 2,
                applyRules: true
            });

            expect(result.isValid).toBe(true);
            expect(result.targetAmount).toBe(2);
            expect(result.sourceRemaining).toBe(7 - 2);
        });

        it('devrait détecter un transfert invalide si le montant dépasse le quota disponible', async () => {
            const result = await quotaAdvancedService.simulateTransfer({
                userId: mockUserId,
                sourceType: LeaveType.RECOVERY,
                targetType: LeaveType.ANNUAL,
                amount: 10,
                applyRules: true
            });

            expect(result.isValid).toBe(false);
            expect(result.messages).toContain('Quota insuffisant. Il vous reste 7 jours de RECOVERY.');
        });
    });

    describe('executeTransfer', () => {
        it('devrait exécuter un transfert valide', async () => {
            const result = await quotaAdvancedService.executeTransfer({
                userId: mockUserId,
                sourceType: LeaveType.RECOVERY,
                targetType: LeaveType.ANNUAL,
                sourceAmount: 2,
                comment: 'Test transfer'
            } as any, mockUserId);

            expect(result.success).toBe(true);
            expect(mockLogActionGlobal).toHaveBeenCalled();
        });

        it('devrait rejeter un transfert si la simulation échoue', async () => {
            // Mocker directement simulateTransfer pour retourner isValid: false
            const simulateTransferSpy = jest.spyOn(quotaAdvancedService as any, 'simulateTransfer')
                .mockResolvedValueOnce({
                    isValid: false,
                    messages: ['Quota insuffisant simulé'],
                    sourceRemaining: 0,
                    targetAmount: 0,
                    appliedRatio: 1
                });

            await expect(quotaAdvancedService.executeTransfer({
                userId: mockUserId,
                sourceType: LeaveType.RECOVERY,
                targetType: LeaveType.ANNUAL,
                sourceAmount: 10 // Montant qui déclencherait l'échec normalement
            } as any, mockUserId)).rejects.toThrow('Quota insuffisant simulé');

            expect(simulateTransferSpy).toHaveBeenCalled();
            expect(mockLogActionGlobal).not.toHaveBeenCalled();

            simulateTransferSpy.mockRestore(); // Nettoyer le spy
        });
    });

    describe('simulateCarryOver', () => {
        it('devrait simuler un report valide', async () => {
            const result = await quotaAdvancedService.simulateCarryOver({
                userId: mockUserId,
                leaveType: LeaveType.ANNUAL,
                fromYear: mockYear,
                toYear: mockYear + 1
            });

            expect(result.carryOverAmount).toBeGreaterThanOrEqual(0);
            expect(result.eligibleForCarryOver).toBe(18);
            expect(result.carryOverAmount).toBe(Math.min(18 * 0.5, 10));
        });

        it('devrait calculer correctement un report avec pourcentage', async () => {
            mockFetchActiveCarryOverRulesForUser.mockResolvedValueOnce([
                {
                    id: 'carry-rule-rtt', leaveType: LeaveType.RECOVERY, ruleType: QuotaCarryOverRuleType.PERCENTAGE,
                    value: 30,
                    maxCarryOverDays: 5, expirationDays: 180, requiresApproval: false, isActive: true,
                    authorizedRoles: undefined,
                    departmentId: undefined,
                    applicableUserRoles: undefined,
                    metadata: undefined,
                }
            ]);
            const result = await quotaAdvancedService.simulateCarryOver({
                userId: mockUserId,
                leaveType: LeaveType.RECOVERY,
                fromYear: mockYear,
                toYear: mockYear + 1
            });

            expect(result.carryOverAmount).toBeGreaterThanOrEqual(0);
            expect(result.eligibleForCarryOver).toBeCloseTo(7);
            expect(result.carryOverAmount).toBe(Math.floor(Math.min(7 * 0.3, 5)));
        });
    });

    describe('executeCarryOver', () => {
        it('devrait exécuter un report valide', async () => {
            const result = await quotaAdvancedService.executeCarryOver({
                userId: mockUserId,
                leaveType: LeaveType.ANNUAL,
                fromYear: mockYear,
                toYear: mockYear + 1,
                amount: 5
            }, mockUserId);

            expect(result).toBe(true);
            expect(mockLogActionGlobal).toHaveBeenCalled();
        });

        it('devrait rejeter un report si la simulation échoue', async () => {
            mockFetchLeaveBalance.mockResolvedValueOnce({ ...mockLeaveBalance, balances: { ...mockLeaveBalance.balances, [LeaveType.ANNUAL]: { ...mockLeaveBalance.balances[LeaveType.ANNUAL], remaining: 0 } } } as LeaveBalance);

            await expect(quotaAdvancedService.executeCarryOver({
                userId: mockUserId,
                leaveType: LeaveType.ANNUAL,
                fromYear: mockYear,
                toYear: mockYear + 1
            }, mockUserId)).rejects.toThrow('Aucun jour à reporter');

            expect(mockLogActionGlobal).not.toHaveBeenCalled();
        });
    });

    describe('getEnhancedQuotaState', () => {
        it('devrait récupérer et combiner les informations de quotas, transferts et reports', async () => {
            const enhancedQuotas = await quotaAdvancedService.getEnhancedQuotaState(mockUserId, mockYear);

            // MODIFIÉ: Vérifier l'appel sur le mock manuel
            expect(mockFetchLeaveBalance).toHaveBeenCalledWith(mockUserId);
            // expect(mockFetchTransferHistory).toHaveBeenCalledWith(mockUserId);
            // expect(mockFetchCarryOverHistory).toHaveBeenCalledWith(mockUserId);

            expect(enhancedQuotas).toBeDefined();
            expect(Array.isArray(enhancedQuotas)).toBe(true);

            // Vérifier la structure pour un type spécifique (ex: ANNUAL)
            const cpQuota = enhancedQuotas.find(q => q.type === LeaveType.ANNUAL);
            expect(cpQuota).toBeDefined();
            if (cpQuota) {
                expect(cpQuota.total).toBe(mockLeaveBalance.balances[LeaveType.ANNUAL].initial);
                expect(cpQuota.used).toBe(mockLeaveBalance.balances[LeaveType.ANNUAL].used);
                expect(cpQuota.remaining).toBe(mockLeaveBalance.balances[LeaveType.ANNUAL].remaining);
                // Vérifier que l'historique (mocké par MSW) est bien intégré (indirectement)
                expect(cpQuota.transferItems).toBeDefined();
                expect(cpQuota.carriedOverItems).toBeDefined();
                // On pourrait ajouter des vérifications plus précises sur le contenu de transferItems/carriedOverItems
                // en se basant sur mockTransferHistory et mockCarryOverHistory
            }

            // Optionnel: vérifier un autre type
            const rttQuota = enhancedQuotas.find(q => q.type === LeaveType.RECOVERY);
            expect(rttQuota).toBeDefined();
            // ... autres vérifications si nécessaire
        });

        it('devrait gérer une erreur lors de la récupération des données', async () => {
            // Faire échouer l'appel initial à fetchLeaveBalance
            // MODIFIÉ: Configurer le mock manuel
            mockFetchLeaveBalance.mockRejectedValueOnce(new Error('Network Error'));

            await expect(quotaAdvancedService.getEnhancedQuotaState(mockUserId, mockYear))
                .rejects.toThrow('Network Error');
        });
    });
}); 