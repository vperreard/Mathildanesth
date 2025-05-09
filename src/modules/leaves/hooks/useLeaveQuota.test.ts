import { renderHook, act } from '@testing-library/react';
import { useLeaveQuota } from './useLeaveQuota';
import { fetchLeaveBalance, checkLeaveAllowance } from '../services/leaveService';
import { LeaveType } from '../types/leave';
import { addDays } from 'date-fns';
import { QuotaCalculationResult } from './useLeaveQuota';
import { calculateLeaveCountedDays } from '../services/leaveCalculator';

// Mocks pour les services
jest.mock('../services/leaveService', () => ({
    fetchLeaveBalance: jest.fn(),
    checkLeaveAllowance: jest.fn()
}));

// Mock pour calculateLeaveCountedDays
jest.mock('../services/leaveCalculator', () => ({
    calculateLeaveCountedDays: jest.fn()
}));

describe('useLeaveQuota', () => {
    const today = new Date();
    const userId = 'user123';
    const mockUserSchedule = {
        id: 'schedule123',
        workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        workingTimePercentage: 100
    };

    const mockLeaveBalance = {
        userId,
        year: 2023,
        initialAllowance: 30,
        additionalAllowance: 5,
        used: 10,
        pending: 5,
        remaining: 20,
        detailsByType: {
            [LeaveType.ANNUAL]: {
                used: 8,
                pending: 4
            },
            [LeaveType.TRAINING]: {
                used: 2,
                pending: 1
            }
        },
        lastUpdated: new Date()
    };

    const mockAllowanceCheckResult = {
        isAllowed: true,
        remainingDays: 20,
        requestedDays: 3,
        exceededDays: 0,
        message: 'Demande valide'
    };

    const mockCalculationDetails = {
        countedDays: 3,
        naturalDays: 3,
        workDays: 3,
        publicHolidays: [],
        weekends: [],
        detail: []
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (fetchLeaveBalance as jest.Mock).mockResolvedValue(mockLeaveBalance);
        (checkLeaveAllowance as jest.Mock).mockResolvedValue(mockAllowanceCheckResult);
        (calculateLeaveCountedDays as jest.Mock).mockResolvedValue(mockCalculationDetails);
    });

    it('devrait initialiser correctement l\'état', () => {
        const { result } = renderHook(() => useLeaveQuota({ userId }));

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.quotasByType).toEqual([]);
        expect(result.current.totalBalance).toEqual({
            total: 0,
            used: 0,
            pending: 0,
            remaining: 0
        });
    });

    it('devrait charger les quotas de congés', async () => {
        const { result } = renderHook(() => useLeaveQuota({ userId }));

        await act(async () => {
            await result.current.refreshQuotas(userId);
        });

        expect(fetchLeaveBalance).toHaveBeenCalledWith(userId);
        expect(result.current.loading).toBe(false);
        expect(result.current.totalBalance.total).toBe(35); // 30 + 5
        expect(result.current.totalBalance.used).toBe(10);
        expect(result.current.totalBalance.pending).toBe(5);
        expect(result.current.totalBalance.remaining).toBe(20);
        expect(result.current.quotasByType.length).toBe(12); // Mise à jour pour tous les types incluant PATERNITY et PARENTAL
    });

    it('devrait récupérer le quota pour un type spécifique', async () => {
        const { result } = renderHook(() => useLeaveQuota({ userId }));

        await act(async () => {
            await result.current.refreshQuotas(userId);
        });

        const annualQuota = result.current.getQuotaForType(LeaveType.ANNUAL);
        expect(annualQuota).not.toBeNull();
        if (annualQuota) {
            expect(annualQuota.type).toBe(LeaveType.ANNUAL);
            expect(annualQuota.total).toBe(30); // Valeur par défaut dans processBalanceData
            expect(annualQuota.used).toBe(8);
            expect(annualQuota.pending).toBe(4);
            expect(annualQuota.remaining).toBe(18); // 30 - 8 - 4
        }
    });

    it('devrait vérifier si une demande respecte les quotas', async () => {
        const { result } = renderHook(() => useLeaveQuota({
            userId,
            userSchedule: mockUserSchedule as any
        }));

        // Charger d'abord les quotas
        await act(async () => {
            await result.current.refreshQuotas(userId);
        });

        // Vérifier une demande valide
        let quotaResult: QuotaCalculationResult | undefined;

        await act(async () => {
            quotaResult = await result.current.checkQuota({
                startDate: addDays(today, 1),
                endDate: addDays(today, 3),
                leaveType: LeaveType.ANNUAL,
                userId
            });
        });

        expect(calculateLeaveCountedDays).toHaveBeenCalled();
        expect(checkLeaveAllowance).toHaveBeenCalledWith(userId, LeaveType.ANNUAL, 3);
        expect(quotaResult).toBeDefined();
        if (quotaResult) {
            expect(quotaResult.isValid).toBe(true);
            expect(quotaResult.requestedDays).toBe(3);
            expect(quotaResult.leaveType).toBe(LeaveType.ANNUAL);
        }
    });

    it('devrait rejeter une demande qui dépasse les quotas', async () => {
        // Simuler un résultat négatif de vérification
        (checkLeaveAllowance as jest.Mock).mockResolvedValue({
            isAllowed: false,
            remainingDays: 2,
            requestedDays: 5,
            exceededDays: 3,
            message: 'Quota dépassé'
        });

        const { result } = renderHook(() => useLeaveQuota({
            userId,
            userSchedule: mockUserSchedule as any
        }));

        // Charger d'abord les quotas
        await act(async () => {
            await result.current.refreshQuotas(userId);
        });

        // Vérifier une demande qui dépasse le quota
        let quotaResult: QuotaCalculationResult | undefined;

        await act(async () => {
            quotaResult = await result.current.checkQuota({
                startDate: addDays(today, 1),
                endDate: addDays(today, 5),
                leaveType: LeaveType.ANNUAL,
                userId
            });
        });

        expect(quotaResult).toBeDefined();
        if (quotaResult) {
            expect(quotaResult.isValid).toBe(false);
            expect(quotaResult.message).toContain('Quota insuffisant');
        }
    });

    it('devrait gérer les erreurs lors du chargement des quotas', async () => {
        const errorMessage = 'Erreur de chargement des quotas';
        (fetchLeaveBalance as jest.Mock).mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useLeaveQuota({ userId }));

        await act(async () => {
            await result.current.refreshQuotas(userId);
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.error).not.toBeNull();
        if (result.current.error) {
            expect(result.current.error.message).toBe(errorMessage);
        }
    });
}); 