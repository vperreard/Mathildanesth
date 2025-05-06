import {
    simulateQuotaTransfer,
    simulateCarryOverCalculation,
    isTransferRuleApplicable,
    isInSpecialPeriod
} from './quotaService';
import {
    QuotaTransferRequest,
    QuotaTransferRule,
    QuotaTransferRuleType,
    QuotaCarryOverCalculationRequest,
    QuotaCarryOverRuleType,
    SpecialPeriodRule,
    SpecialPeriodRuleType
} from '../types/quota';
import { LeaveType } from '../types/leave';
import { fetchLeaveBalance } from './leaveService';

// Mock du service de balance
jest.mock('./leaveService', () => ({
    fetchLeaveBalance: jest.fn(),
}));

describe('quotaService', () => {
    // Réinitialiser les mocks entre les tests
    beforeEach(() => {
        jest.resetAllMocks();

        // Mock par défaut pour fetchLeaveBalance
        (fetchLeaveBalance as jest.Mock).mockResolvedValue({
            userId: 'user1',
            year: 2023,
            initialAllowance: 25,
            additionalAllowance: 10,
            used: 10,
            pending: 2,
            remaining: 18,
            detailsByType: {
                [LeaveType.ANNUAL]: { used: 8, pending: 2 },
                [LeaveType.RECOVERY]: { used: 2, pending: 0 },
                [LeaveType.TRAINING]: { used: 0, pending: 0 }
            },
            lastUpdated: new Date()
        });
    });

    describe('simulateQuotaTransfer', () => {
        it('calcule correctement un transfert simple (1:1)', async () => {
            const request: QuotaTransferRequest = {
                userId: 'user1',
                sourceType: LeaveType.RECOVERY,
                targetType: LeaveType.ANNUAL,
                sourceAmount: 2
            };

            const result = await simulateQuotaTransfer(request);

            expect(result.success).toBe(true);
            expect(result.sourceAmount).toBe(2);
            expect(result.targetAmount).toBe(2); // Ratio 1:1
            expect(result.message).toContain('Transfert de 2 jours de');
            expect(fetchLeaveBalance).toHaveBeenCalledWith('user1');
        });

        it('calcule correctement un transfert avec ratio personnalisé', async () => {
            const request: QuotaTransferRequest = {
                userId: 'user1',
                sourceType: LeaveType.RECOVERY,
                targetType: LeaveType.ANNUAL,
                sourceAmount: 4
            };

            const rules: QuotaTransferRule[] = [
                {
                    id: '1',
                    fromType: LeaveType.RECOVERY,
                    toType: LeaveType.ANNUAL,
                    ruleType: QuotaTransferRuleType.STANDARD,
                    conversionRate: 0.5,
                    isActive: true,
                    maxTransferDays: undefined,
                    maxTransferPercentage: undefined,
                    requiresApproval: false,
                    authorizedRoles: undefined,
                    departmentId: undefined,
                    applicableUserRoles: undefined,
                    minimumRemainingDays: undefined,
                    metadata: undefined,
                }
            ];

            const result = await simulateQuotaTransfer(request, rules);

            expect(result.success).toBe(true);
            expect(result.sourceAmount).toBe(4);
            expect(result.targetAmount).toBe(2); // 4 * 0.5
            expect(result.appliedRule).toBeDefined();
            expect(result.appliedRule?.conversionRate).toBe(0.5);
        });

        it('refuse le transfert si le montant est insuffisant', async () => {
            // Mock spécifique pour ce test
            (fetchLeaveBalance as jest.Mock).mockResolvedValue({
                userId: 'user1',
                year: 2023,
                initialAllowance: 25,
                additionalAllowance: 5,
                used: 28,
                pending: 0,
                remaining: 2,
                detailsByType: {
                    [LeaveType.ANNUAL]: { used: 24, pending: 0 },
                    [LeaveType.RECOVERY]: { used: 4, pending: 0 },
                    [LeaveType.TRAINING]: { used: 0, pending: 0 }
                },
                lastUpdated: new Date()
            });

            const request: QuotaTransferRequest = {
                userId: 'user1',
                sourceType: LeaveType.RECOVERY,
                targetType: LeaveType.ANNUAL,
                sourceAmount: 3 // Supérieur au solde disponible (1)
            };

            const result = await simulateQuotaTransfer(request);

            expect(result.success).toBe(false);
            expect(result.message).toContain('Montant insuffisant');
        });
    });

    describe('simulateCarryOverCalculation', () => {
        it('calcule correctement un report en pourcentage (50%)', async () => {
            const request: QuotaCarryOverCalculationRequest = {
                userId: 'user1',
                leaveType: LeaveType.ANNUAL,
                fromYear: 2023,
                toYear: 2024
            };

            const rules = [
                {
                    id: '1',
                    name: 'Report congés annuels 50%',
                    leaveType: LeaveType.ANNUAL,
                    ruleType: QuotaCarryOverRuleType.PERCENTAGE,
                    value: 50, // 50%
                    expiryMonths: 6,
                    deadlineMonth: 6,
                    deadlineDay: 30,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            const result = await simulateCarryOverCalculation(request, rules);

            expect(result.originalRemaining).toBe(15); // 25 - 8 - 2
            expect(result.eligibleForCarryOver).toBe(7.5); // 50% de 15
            expect(result.carryOverAmount).toBe(7.5);
            expect(result.expiryDate).toBeDefined();
        });

        it('calcule correctement un report avec un montant fixe', async () => {
            const request: QuotaCarryOverCalculationRequest = {
                userId: 'user1',
                leaveType: LeaveType.ANNUAL,
                fromYear: 2023,
                toYear: 2024
            };

            const rules = [
                {
                    id: '1',
                    name: 'Report congés annuels max 5 jours',
                    leaveType: LeaveType.ANNUAL,
                    ruleType: QuotaCarryOverRuleType.FIXED,
                    value: 5, // 5 jours maximum
                    expiryMonths: 6,
                    deadlineMonth: 6,
                    deadlineDay: 30,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            const result = await simulateCarryOverCalculation(request, rules);

            expect(result.originalRemaining).toBe(15); // 25 - 8 - 2
            expect(result.eligibleForCarryOver).toBe(5); // Maximum 5 jours
            expect(result.carryOverAmount).toBe(5);
        });

        it('calcule correctement un report de tous les jours restants', async () => {
            const request: QuotaCarryOverCalculationRequest = {
                userId: 'user1',
                leaveType: LeaveType.ANNUAL,
                fromYear: 2023,
                toYear: 2024
            };

            const rules = [
                {
                    id: '1',
                    name: 'Report intégral des congés annuels',
                    leaveType: LeaveType.ANNUAL,
                    ruleType: QuotaCarryOverRuleType.ALL,
                    value: 100, // N'est pas utilisé en mode ALL
                    expiryMonths: 3,
                    deadlineMonth: 3,
                    deadlineDay: 31,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            const result = await simulateCarryOverCalculation(request, rules);

            expect(result.originalRemaining).toBe(15); // 25 - 8 - 2
            expect(result.eligibleForCarryOver).toBe(15); // Tous les jours
            expect(result.carryOverAmount).toBe(15);
        });
    });

    describe('isTransferRuleApplicable', () => {
        it('retourne false si la règle est inactive', () => {
            const rule: QuotaTransferRule = {
                id: '1',
                name: 'Règle inactive',
                sourceType: LeaveType.RECOVERY,
                targetType: LeaveType.ANNUAL,
                ruleType: QuotaTransferRuleType.STANDARD,
                ratio: 1,
                isActive: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(isTransferRuleApplicable(rule)).toBe(false);
        });

        it('retourne false si la date de début est future', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            const rule: QuotaTransferRule = {
                id: '1',
                name: 'Règle future',
                sourceType: LeaveType.RECOVERY,
                targetType: LeaveType.ANNUAL,
                ruleType: QuotaTransferRuleType.STANDARD,
                ratio: 1,
                startDate: tomorrow,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(isTransferRuleApplicable(rule)).toBe(false);
        });

        it('retourne false si la date de fin est passée', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const rule: QuotaTransferRule = {
                id: '1',
                name: 'Règle expirée',
                sourceType: LeaveType.RECOVERY,
                targetType: LeaveType.ANNUAL,
                ruleType: QuotaTransferRuleType.STANDARD,
                ratio: 1,
                endDate: yesterday,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(isTransferRuleApplicable(rule)).toBe(false);
        });

        it('retourne true pour une règle active sans restrictions de date', () => {
            const rule: QuotaTransferRule = {
                id: '1',
                name: 'Règle active',
                sourceType: LeaveType.RECOVERY,
                targetType: LeaveType.ANNUAL,
                ruleType: QuotaTransferRuleType.STANDARD,
                ratio: 1,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(isTransferRuleApplicable(rule)).toBe(true);
        });
    });

    describe('isInSpecialPeriod', () => {
        it('identifie correctement une date dans une période simple', () => {
            const period: SpecialPeriodRule = {
                id: '1',
                name: 'Été 2023',
                description: 'Période estivale',
                periodType: SpecialPeriodRuleType.SUMMER,
                startDay: 1,
                startMonth: 7, // Juillet
                endDay: 31,
                endMonth: 8, // Août
                specificYear: 2023,
                minimumQuotaGuaranteed: 10,
                priorityRules: [],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Date à l'intérieur de la période
            const dateInPeriod = new Date(2023, 6, 15); // 15 juillet 2023
            expect(isInSpecialPeriod(dateInPeriod, period)).toBe(true);

            // Date en dehors de la période
            const dateOutsidePeriod = new Date(2023, 5, 15); // 15 juin 2023
            expect(isInSpecialPeriod(dateOutsidePeriod, period)).toBe(false);

            // Date d'une autre année
            const dateWrongYear = new Date(2022, 7, 15); // 15 août 2022
            expect(isInSpecialPeriod(dateWrongYear, period)).toBe(false);
        });

        it('gère correctement une période chevauchant deux années', () => {
            const period: SpecialPeriodRule = {
                id: '1',
                name: 'Fêtes fin d\'année',
                description: 'Période des fêtes',
                periodType: SpecialPeriodRuleType.WINTER,
                startDay: 15,
                startMonth: 12, // Décembre
                endDay: 15,
                endMonth: 1, // Janvier
                minimumQuotaGuaranteed: 10,
                priorityRules: [],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Date en décembre (première partie de la période)
            const dateInDecember = new Date(2023, 11, 20); // 20 décembre 2023
            expect(isInSpecialPeriod(dateInDecember, period)).toBe(true);

            // Date en janvier (seconde partie de la période)
            const dateInJanuary = new Date(2024, 0, 10); // 10 janvier 2024
            expect(isInSpecialPeriod(dateInJanuary, period)).toBe(true);

            // Date en dehors de la période
            const dateOutsidePeriod = new Date(2023, 10, 15); // 15 novembre 2023
            expect(isInSpecialPeriod(dateOutsidePeriod, period)).toBe(false);
        });

        it('gère correctement une période récurrente (sans année spécifique)', () => {
            const period: SpecialPeriodRule = {
                id: '1',
                name: 'Été (récurrent)',
                description: 'Période estivale chaque année',
                periodType: SpecialPeriodRuleType.SUMMER,
                startDay: 1,
                startMonth: 7, // Juillet
                endDay: 31,
                endMonth: 8, // Août
                minimumQuotaGuaranteed: 10,
                priorityRules: [],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Date de l'année courante
            const dateCurrentYear = new Date();
            dateCurrentYear.setMonth(6); // Juillet
            dateCurrentYear.setDate(15);
            expect(isInSpecialPeriod(dateCurrentYear, period)).toBe(true);

            // Date d'une année passée mais dans la période
            const datePastYear = new Date(2020, 6, 15); // 15 juillet 2020
            expect(isInSpecialPeriod(datePastYear, period)).toBe(true);
        });
    });
}); 