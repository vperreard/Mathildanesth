import { QuotaAdvancedService, quotaAdvancedService } from '../QuotaAdvancedService';
import { fetchLeaveBalance } from '../leaveService';
import {
    fetchActiveTransferRulesForUser,
    fetchActiveCarryOverRulesForUser,
    fetchTransferHistory,
    fetchCarryOverHistory
} from '../quotaService';
import { AuditService } from '../AuditService';
import { eventBus } from '../../../integration/services/EventBusService';
import { LeaveType } from '../../types/leave';
import {
    QuotaTransferRule,
    QuotaTransferRuleType,
    QuotaCarryOverRule,
    QuotaCarryOverRuleType
} from '../../types/quota';
import { addMonths } from '../../../../utils/dateUtils';

// Mock des services externes
jest.mock('../leaveService');
jest.mock('../quotaService');
jest.mock('../AuditService');
jest.mock('../../../integration/services/EventBusService', () => ({
    eventBus: {
        publish: jest.fn()
    },
    IntegrationEventType: {
        QUOTA_TRANSFERRED: 'QUOTA_TRANSFERRED',
        QUOTA_CARRIED_OVER: 'QUOTA_CARRIED_OVER'
    }
}));
jest.mock('../../../../utils/dateUtils', () => ({
    formatDate: jest.fn().mockImplementation(date => new Date(date).toLocaleDateString()),
    addMonths: jest.fn().mockImplementation((date, months) => {
        const newDate = new Date(date);
        newDate.setMonth(newDate.getMonth() + months);
        return newDate;
    }),
    getDaysUntil: jest.fn().mockImplementation(() => 15),
    isDateInFuture: jest.fn().mockImplementation(() => true)
}));

// Configuration globale pour les mocks fetch
global.fetch = jest.fn() as jest.Mock;

// Données mock pour les tests
const userId = 'user-123';
const currentYear = new Date().getFullYear();

const mockLeaveBalance = {
    userId: 'user-123',
    year: currentYear,
    balances: {
        [LeaveType.CONGE_PAYE]: {
            initial: 25,
            used: 10,
            pending: 2,
            remaining: 13,
            acquired: 25
        },
        [LeaveType.RTT]: {
            initial: 12,
            used: 5,
            pending: 0,
            remaining: 7,
            acquired: 12
        }
    },
    lastUpdated: new Date().toISOString()
};

const mockTransferRules: QuotaTransferRule[] = [
    {
        id: 'rule-1',
        sourceType: LeaveType.RTT,
        targetType: LeaveType.CONGE_PAYE,
        ratio: 0.8,
        minAmount: 1,
        maxAmount: 10,
        bidirectional: false,
        type: QuotaTransferRuleType.STANDARD,
        description: 'Conversion RTT vers Congés Payés'
    },
    {
        id: 'rule-2',
        sourceType: LeaveType.CONGE_PAYE,
        targetType: LeaveType.RTT,
        ratio: 1.2,
        minAmount: 1,
        maxAmount: 5,
        bidirectional: false,
        type: QuotaTransferRuleType.STANDARD,
        description: 'Conversion Congés Payés vers RTT'
    }
];

const mockCarryOverRules: QuotaCarryOverRule[] = [
    {
        id: 'co-rule-1',
        name: 'Report CP standard',
        description: 'Report standard de 5 jours maximum',
        leaveType: LeaveType.CONGE_PAYE,
        ruleType: QuotaCarryOverRuleType.MAX_DAYS,
        value: 5,
        expiryMonths: 3,
        deadlineMonth: 3,
        deadlineDay: 31,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'co-rule-2',
        name: 'Report RTT',
        description: 'Report de 30% des RTT',
        leaveType: LeaveType.RTT,
        ruleType: QuotaCarryOverRuleType.PERCENTAGE,
        value: 30,
        expiryMonths: 6,
        deadlineMonth: 6,
        deadlineDay: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

const mockTransferHistory = [
    {
        id: 'transfer-1',
        userId: 'user-123',
        sourceType: LeaveType.RTT,
        targetType: LeaveType.CONGE_PAYE,
        sourceAmount: 2,
        targetAmount: 1.6,
        ratio: 0.8,
        ruleApplied: 'rule-1',
        createdAt: new Date(),
        createdBy: 'user-123',
        comment: 'Transfert test'
    }
];

const mockCarryOverHistory = [
    {
        id: 'carryover-1',
        userId: 'user-123',
        leaveType: LeaveType.CONGE_PAYE,
        fromYear: currentYear - 1,
        toYear: currentYear,
        originalAmount: 4,
        carriedAmount: 4,
        expiryDate: addMonths(new Date(currentYear, 0, 1), 3),
        ruleApplied: 'co-rule-1',
        createdAt: new Date(),
        createdBy: 'user-123',
        status: 'completed'
    }
];

// Configurer les mocks avant chaque test
beforeEach(() => {
    jest.clearAllMocks();

    // Mock des services importés
    (fetchLeaveBalance as jest.Mock).mockResolvedValue(mockLeaveBalance);
    (fetchActiveTransferRulesForUser as jest.Mock).mockResolvedValue(mockTransferRules);
    (fetchActiveCarryOverRulesForUser as jest.Mock).mockResolvedValue(mockCarryOverRules);
    (fetchTransferHistory as jest.Mock).mockResolvedValue(mockTransferHistory);
    (fetchCarryOverHistory as jest.Mock).mockResolvedValue(mockCarryOverHistory);

    // Mock de l'API fetch
    (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/transfer')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ transferId: 'new-transfer-id', status: 'completed' })
            });
        } else if (url.includes('/carry-over')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ id: 'new-carryover-id', status: 'completed' })
            });
        }

        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({})
        });
    });

    // Mock du service d'audit
    (AuditService.getInstance as jest.Mock).mockReturnValue({
        createAuditEntry: jest.fn().mockResolvedValue({})
    });
});

describe('QuotaAdvancedService', () => {
    describe('getActiveTransferRules', () => {
        it('devrait récupérer les règles de transfert actives', async () => {
            const rules = await quotaAdvancedService.getActiveTransferRules(userId);

            expect(fetchActiveTransferRulesForUser).toHaveBeenCalledWith(userId);
            expect(rules).toEqual(mockTransferRules);
        });

        it('devrait gérer les erreurs lors de la récupération des règles', async () => {
            (fetchActiveTransferRulesForUser as jest.Mock).mockRejectedValue(new Error('Test error'));

            await expect(quotaAdvancedService.getActiveTransferRules(userId)).rejects.toThrow('Test error');
        });
    });

    describe('getActiveCarryOverRules', () => {
        it('devrait récupérer les règles de report actives', async () => {
            const rules = await quotaAdvancedService.getActiveCarryOverRules(userId);

            expect(fetchActiveCarryOverRulesForUser).toHaveBeenCalledWith(userId);
            expect(rules).toEqual(mockCarryOverRules);
        });

        it('devrait gérer les erreurs lors de la récupération des règles', async () => {
            (fetchActiveCarryOverRulesForUser as jest.Mock).mockRejectedValue(new Error('Test error'));

            await expect(quotaAdvancedService.getActiveCarryOverRules(userId)).rejects.toThrow('Test error');
        });
    });

    describe('simulateTransfer', () => {
        it('devrait simuler un transfert valide avec application des règles', async () => {
            const result = await quotaAdvancedService.simulateTransfer({
                userId,
                sourceType: LeaveType.RTT,
                targetType: LeaveType.CONGE_PAYE,
                amount: 2,
                applyRules: true
            });

            expect(result.isValid).toBe(true);
            expect(result.sourceRemaining).toBe(5); // 7 - 2
            expect(result.targetAmount).toBe(1.6); // 2 * 0.8
            expect(result.appliedRatio).toBe(0.8);
            expect(result.appliedRule).toEqual(mockTransferRules[0]);
        });

        it('devrait détecter un transfert invalide si le montant dépasse le quota disponible', async () => {
            const result = await quotaAdvancedService.simulateTransfer({
                userId,
                sourceType: LeaveType.RTT,
                targetType: LeaveType.CONGE_PAYE,
                amount: 10, // Plus que les 7 jours disponibles
                applyRules: true
            });

            expect(result.isValid).toBe(false);
            expect(result.messages.length).toBeGreaterThan(0);
            expect(result.messages[0]).toContain('Quota insuffisant');
        });
    });

    describe('executeTransfer', () => {
        it('devrait exécuter un transfert valide', async () => {
            const result = await quotaAdvancedService.executeTransfer({
                employeeId: userId,
                sourceType: LeaveType.RTT,
                targetType: LeaveType.CONGE_PAYE,
                amount: 2,
                notes: 'Test transfer'
            }, userId);

            // Vérifier que l'API a été appelée
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/transfer'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.any(Object),
                    body: expect.any(String)
                })
            );

            // Vérifier que l'audit a été journalisé
            expect(AuditService.getInstance().createAuditEntry).toHaveBeenCalled();

            // Vérifier que l'événement a été publié
            expect(eventBus.publish).toHaveBeenCalled();

            // Vérifier le résultat
            expect(result).toEqual({ transferId: 'new-transfer-id', status: 'completed' });
        });

        it('devrait rejeter un transfert invalide', async () => {
            // Simuler un transfert invalide
            jest.spyOn(quotaAdvancedService, 'simulateTransfer').mockResolvedValueOnce({
                sourceRemaining: 0,
                targetAmount: 0,
                appliedRatio: 1,
                isValid: false,
                messages: ['Quota insuffisant']
            });

            await expect(quotaAdvancedService.executeTransfer({
                employeeId: userId,
                sourceType: LeaveType.RTT,
                targetType: LeaveType.CONGE_PAYE,
                amount: 10
            }, userId)).rejects.toThrow('Quota insuffisant');

            // Vérifier que l'API n'a pas été appelée
            expect(global.fetch).not.toHaveBeenCalled();
        });
    });

    describe('simulateCarryOver', () => {
        it('devrait simuler un report valide', async () => {
            const result = await quotaAdvancedService.simulateCarryOver({
                userId,
                leaveType: LeaveType.CONGE_PAYE,
                fromYear: currentYear,
                toYear: currentYear + 1
            });

            expect(result.originalRemaining).toBe(13);
            expect(result.carryOverAmount).toBe(5); // Maximum 5 jours selon la règle
            expect(result.appliedRule).toEqual(mockCarryOverRules[0]);
            expect(result.expiryDate).toBeDefined();
        });

        it('devrait calculer correctement un report avec pourcentage', async () => {
            const result = await quotaAdvancedService.simulateCarryOver({
                userId,
                leaveType: LeaveType.RTT,
                fromYear: currentYear,
                toYear: currentYear + 1
            });

            expect(result.originalRemaining).toBe(7);
            expect(result.carryOverAmount).toBe(2); // 30% de 7 arrondi = 2
            expect(result.appliedRule).toEqual(mockCarryOverRules[1]);
        });
    });

    describe('executeCarryOver', () => {
        it('devrait exécuter un report valide', async () => {
            const result = await quotaAdvancedService.executeCarryOver({
                userId,
                leaveType: LeaveType.CONGE_PAYE,
                fromYear: currentYear,
                toYear: currentYear + 1
            }, userId);

            // Vérifier que l'API a été appelée
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/carry-over'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.any(Object),
                    body: expect.any(String)
                })
            );

            // Vérifier que l'audit a été journalisé
            expect(AuditService.getInstance().createAuditEntry).toHaveBeenCalled();

            // Vérifier que l'événement a été publié
            expect(eventBus.publish).toHaveBeenCalled();

            // Vérifier le résultat
            expect(result).toBe(true);
        });

        it('devrait rejeter un report avec montant nul', async () => {
            // Simuler un report avec montant nul
            jest.spyOn(quotaAdvancedService, 'simulateCarryOver').mockResolvedValueOnce({
                originalRemaining: 0,
                eligibleForCarryOver: 0,
                carryOverAmount: 0,
                expiryDate: new Date(),
                message: 'Aucun jour disponible'
            });

            await expect(quotaAdvancedService.executeCarryOver({
                userId,
                leaveType: LeaveType.CONGE_PAYE,
                fromYear: currentYear,
                toYear: currentYear + 1
            }, userId)).rejects.toThrow('Aucun jour à reporter');

            // Vérifier que l'API n'a pas été appelée
            expect(global.fetch).not.toHaveBeenCalled();
        });
    });

    describe('getEnhancedQuotaState', () => {
        it('devrait récupérer et combiner les informations de quotas, transferts et reports', async () => {
            const enhancedQuotas = await quotaAdvancedService.getEnhancedQuotaState(userId, currentYear);

            // Vérifier que tous les services nécessaires ont été appelés
            expect(fetchLeaveBalance).toHaveBeenCalledWith(userId);
            expect(fetchTransferHistory).toHaveBeenCalledWith(userId);
            expect(fetchCarryOverHistory).toHaveBeenCalledWith(userId);

            // Vérifier que le résultat contient les informations attendues
            expect(enhancedQuotas.length).toBeGreaterThan(0);

            // Vérifier le quota de congés payés
            const cpQuota = enhancedQuotas.find(q => q.type === LeaveType.CONGE_PAYE);
            expect(cpQuota).toBeDefined();
            if (cpQuota) {
                expect(cpQuota.total).toBe(25);
                expect(cpQuota.used).toBe(10);
                expect(cpQuota.remaining).toBe(13);
                expect(cpQuota.totalTransferredIn).toBeGreaterThan(0); // Doit avoir des transferts entrants
                expect(cpQuota.transferItems.length).toBeGreaterThan(0);
            }

            // Vérifier le quota de RTT
            const rttQuota = enhancedQuotas.find(q => q.type === LeaveType.RTT);
            expect(rttQuota).toBeDefined();
            if (rttQuota) {
                expect(rttQuota.total).toBe(12);
                expect(rttQuota.used).toBe(5);
                expect(rttQuota.remaining).toBe(7);
                expect(rttQuota.totalTransferredOut).toBeGreaterThan(0); // Doit avoir des transferts sortants
                expect(rttQuota.transferItems.length).toBeGreaterThan(0);
            }
        });
    });
}); 