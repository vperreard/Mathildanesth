import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { server, http } from '@/tests/mocks/server';
import { HttpResponse } from 'msw';
import { QuotaAdvancedService, quotaAdvancedService } from '../QuotaAdvancedService';

// MODIFIÉ: Plus besoin d'importer les types pour les mocks de fonctions ici
// import * as quotaServiceTypes from '../quotaService';
// import * as leaveServiceTypes from '../leaveService';

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

// --- Mocks manuels --- 
// Pour leaveService
jest.mock('../leaveService', () => ({
    __esModule: true,
    fetchLeaveBalance: jest.fn(),
}));

// Pour quotaService
jest.mock('../quotaService', () => ({
    __esModule: true,
    fetchActiveTransferRulesForUser: jest.fn(),
    fetchActiveCarryOverRulesForUser: jest.fn(),
    fetchTransferHistory: jest.fn(),
    fetchCarryOverHistory: jest.fn(),
}));

import { fetchLeaveBalance } from '../leaveService';
import {
    fetchActiveTransferRulesForUser,
    fetchActiveCarryOverRulesForUser,
    fetchTransferHistory,
    fetchCarryOverHistory
} from '../quotaService';

const mockFetchLeaveBalanceRef = fetchLeaveBalance as jest.MockedFunction<typeof fetchLeaveBalance>;
const mockFetchActiveTransferRulesForUserRef = fetchActiveTransferRulesForUser as jest.MockedFunction<typeof fetchActiveTransferRulesForUser>;
const mockFetchActiveCarryOverRulesForUserRef = fetchActiveCarryOverRulesForUser as jest.MockedFunction<typeof fetchActiveCarryOverRulesForUser>;
const mockFetchTransferHistoryRef = fetchTransferHistory as jest.MockedFunction<typeof fetchTransferHistory>;
const mockFetchCarryOverHistoryRef = fetchCarryOverHistory as jest.MockedFunction<typeof fetchCarryOverHistory>;

jest.mock('@/services/AuditService', () => ({
    __esModule: true,
    default: {
        getInstance: jest.fn().mockReturnValue({
            logAction: jest.fn<() => Promise<void>>()
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

const mockUserId = 'user-123';
const mockYear = 2024;

const mockLeaveBalance = {
    userId: mockUserId,
    year: mockYear,
    balances: {
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
    },
    lastUpdated: new Date().toISOString(),
} as unknown as LeaveBalance;

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

const mockTransferHistoryData = [
    {
        id: 'transfer-1',
        userId: 'user-123',
        sourceType: LeaveType.RECOVERY,
        targetType: LeaveType.ANNUAL,
        sourceAmount: 2,
        targetAmount: 1.6,
        ratio: 0.8,
        ruleApplied: 'rule-1',
        createdAt: new Date(),
        createdBy: 'user-123',
        comment: 'Transfert test'
    }
];

const mockCarryOverHistoryData = [
    {
        id: 'carryover-1',
        userId: 'user-123',
        leaveType: LeaveType.ANNUAL,
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

const quotaHandlers = [
    http.post('/api/leaves/quotas/transfer', async ({ request }) => {
        return HttpResponse.json({
            success: true,
            transferId: 'mock-transfer-id-from-msw',
        }, { status: 200 });
    }),
    http.post('/api/leaves/quotas/carry-over', async ({ request }) => {
        return HttpResponse.json({
            success: true,
            id: 'mock-carryover-id-from-msw',
        }, { status: 200 });
    }),
    http.post('/api/leaves/audit/entries', async ({ request }) => {
        return HttpResponse.json({ id: 'mock-audit-entry-id', success: true }, { status: 201 });
    }),
    http.get('/api/leaves/quotas/transfer/history', () => {
        return HttpResponse.json(mockTransferHistoryData, { status: 200 });
    }),
    http.get('/api/leaves/quotas/carry-over/history', () => {
        return HttpResponse.json(mockCarryOverHistoryData, { status: 200 });
    }),
];

let mockLogActionAuditService: jest.MockedFunction<any>;

beforeEach(() => {
    jest.clearAllMocks();
    
    const auditServiceInstance = AuditService.getInstance();
    mockLogActionAuditService = auditServiceInstance.logAction as jest.MockedFunction<any>;
    mockLogActionAuditService.mockClear();
    mockLogActionAuditService.mockResolvedValue(undefined);

    server.use(...quotaHandlers);

    mockFetchLeaveBalanceRef.mockResolvedValue(mockLeaveBalance);
    mockFetchActiveTransferRulesForUserRef.mockResolvedValue(mockTransferRules);
    mockFetchActiveCarryOverRulesForUserRef.mockResolvedValue(mockCarryOverRules);
    mockFetchTransferHistoryRef.mockResolvedValue(mockTransferHistoryData);
    mockFetchCarryOverHistoryRef.mockResolvedValue(mockCarryOverHistoryData);
});

describe('QuotaAdvancedService', () => {
    describe('getActiveTransferRules', () => {
        it('devrait récupérer les règles de transfert actives', async () => {
            const rules = await quotaAdvancedService.getActiveTransferRules(mockUserId);
            expect(mockFetchActiveTransferRulesForUserRef).toHaveBeenCalledWith(mockUserId);
            expect(rules).toEqual(mockTransferRules);
        });

        it('devrait gérer les erreurs lors de la récupération des règles', async () => {
            mockFetchActiveTransferRulesForUserRef.mockRejectedValue(new Error('Test error'));
            await expect(quotaAdvancedService.getActiveTransferRules(mockUserId)).rejects.toThrow('Test error');
        });
    });

    describe('getActiveCarryOverRules', () => {
        it('devrait récupérer les règles de report actives', async () => {
            const rules = await quotaAdvancedService.getActiveCarryOverRules(mockUserId);
            expect(mockFetchActiveCarryOverRulesForUserRef).toHaveBeenCalledWith(mockUserId);
            expect(rules).toEqual(mockCarryOverRules);
        });

        it('devrait gérer les erreurs lors de la récupération des règles', async () => {
            mockFetchActiveCarryOverRulesForUserRef.mockRejectedValue(new Error('Test error'));
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
            expect(mockLogActionAuditService).toHaveBeenCalled();
        });

        it('devrait rejeter un transfert si la simulation échoue', async () => {
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
                sourceAmount: 10
            } as any, mockUserId)).rejects.toThrow('Quota insuffisant simulé');

            expect(simulateTransferSpy).toHaveBeenCalled();
            expect(mockLogActionAuditService).not.toHaveBeenCalled();

            simulateTransferSpy.mockRestore();
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
            mockFetchActiveCarryOverRulesForUserRef.mockResolvedValueOnce([
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
            expect(mockLogActionAuditService).toHaveBeenCalled();
        });

        it('devrait rejeter un report si la simulation échoue', async () => {
            mockFetchLeaveBalanceRef.mockResolvedValueOnce({ ...mockLeaveBalance, balances: { ...mockLeaveBalance.balances, [LeaveType.ANNUAL]: { ...mockLeaveBalance.balances[LeaveType.ANNUAL], remaining: 0 } } } as LeaveBalance);

            await expect(quotaAdvancedService.executeCarryOver({
                userId: mockUserId,
                leaveType: LeaveType.ANNUAL,
                fromYear: mockYear,
                toYear: mockYear + 1
            }, mockUserId)).rejects.toThrow('Aucun jour à reporter');

            expect(mockLogActionAuditService).not.toHaveBeenCalled();
        });
    });

    describe('getEnhancedQuotaState', () => {
        it('devrait récupérer et combiner les informations de quotas, transferts et reports', async () => {
            const enhancedQuotas = await quotaAdvancedService.getEnhancedQuotaState(mockUserId, mockYear);

            expect(mockFetchLeaveBalanceRef).toHaveBeenCalledWith(mockUserId);

            expect(enhancedQuotas).toBeDefined();
            expect(Array.isArray(enhancedQuotas)).toBe(true);

            const cpQuota = enhancedQuotas.find(q => q.type === LeaveType.ANNUAL);
            expect(cpQuota).toBeDefined();
            if (cpQuota) {
                expect(cpQuota.total).toBe(mockLeaveBalance.balances[LeaveType.ANNUAL].initial);
                expect(cpQuota.used).toBe(mockLeaveBalance.balances[LeaveType.ANNUAL].used);
                expect(cpQuota.remaining).toBe(mockLeaveBalance.balances[LeaveType.ANNUAL].remaining);
                expect(cpQuota.transferItems).toBeDefined();
                expect(cpQuota.carriedOverItems).toBeDefined();
            }

            const rttQuota = enhancedQuotas.find(q => q.type === LeaveType.RECOVERY);
            expect(rttQuota).toBeDefined();
        });

        it('devrait gérer une erreur lors de la récupération des données', async () => {
            mockFetchLeaveBalanceRef.mockRejectedValueOnce(new Error('Network Error'));

            await expect(quotaAdvancedService.getEnhancedQuotaState(mockUserId, mockYear))
                .rejects.toThrow('Network Error');
        });
    });
}); 