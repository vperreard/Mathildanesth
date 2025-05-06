import { renderHook, act, waitFor } from '@testing-library/react';
import { useConflictDetection } from './useConflictDetection';
import { checkLeaveConflicts } from '../services/leaveService';
import { ConflictSeverity, ConflictType, LeaveConflict } from '../types/conflict';
import { useDateValidation } from '../../../hooks/useDateValidation';

// Mock du service de vérification des conflits
jest.mock('../services/leaveService', () => ({
    checkLeaveConflicts: jest.fn()
}));

// Mock du hook de validation de dates
jest.mock('../../../hooks/useDateValidation', () => ({
    useDateValidation: jest.fn()
}));

// Fonction utilitaire pour créer une date
const createDate = (year: number, month: number, day: number): Date => new Date(year, month - 1, day);

// Données de test
const userId = 'user-123';
// Utiliser des dates futures pour éviter les problèmes de validation "allowPastDates: false"
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 10); // 10 jours dans le futur
const mockStartDate = new Date(futureDate);
futureDate.setDate(futureDate.getDate() + 5);
const mockEndDate = new Date(futureDate);

const mockLeaveId = 'leave-123';

// Conflits factices pour les tests (adapter les dates si nécessaire)
const mockBlockingConflict: LeaveConflict = {
    id: 'conflict-1',
    type: ConflictType.USER_LEAVE_OVERLAP,
    severity: ConflictSeverity.BLOQUANT,
    message: 'Conflit avec une autre absence',
    description: 'Conflit avec une autre absence',
    startDate: new Date(mockStartDate), // Utiliser les dates futures
    endDate: new Date(mockStartDate), // Utiliser les dates futures
    resolved: false,
    createdAt: new Date(),
    updatedAt: new Date()
};

const mockWarningConflict: LeaveConflict = {
    id: 'conflict-2',
    type: ConflictType.SPECIAL_PERIOD,
    severity: ConflictSeverity.AVERTISSEMENT,
    message: 'Jour férié pendant l\'absence',
    description: 'Jour férié pendant l\'absence',
    startDate: createDate(2023, 5, 11),
    endDate: createDate(2023, 5, 11),
    resolved: false,
    createdAt: new Date(),
    updatedAt: new Date()
};

const mockInfoConflict: LeaveConflict = {
    id: 'conflict-3',
    type: ConflictType.TEAM_CAPACITY,
    severity: ConflictSeverity.INFORMATION,
    message: 'Capacité d\'équipe réduite',
    description: 'Capacité d\'équipe réduite',
    startDate: createDate(2023, 5, 13),
    endDate: createDate(2023, 5, 13),
    resolved: false,
    createdAt: new Date(),
    updatedAt: new Date()
};

// Mock des résultats de validation de dates
const mockDateValidation = {
    validateDate: jest.fn().mockReturnValue(true),
    validateDateRange: jest.fn().mockReturnValue(true),
    hasError: jest.fn().mockReturnValue(false),
    getErrorMessage: jest.fn().mockReturnValue(null),
    resetErrors: jest.fn()
};

describe('useConflictDetection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useDateValidation as jest.Mock).mockReturnValue(mockDateValidation);
    });

    it('devrait initialiser correctement le hook', () => {
        const { result } = renderHook(() => useConflictDetection({ userId }));

        expect(result.current.conflicts).toEqual([]);
        expect(result.current.hasBlockingConflicts).toBe(false);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    describe('validateDates', () => {
        it('devrait valider correctement des dates valides', () => {
            const { result } = renderHook(() => useConflictDetection({ userId }));
            const isValid = result.current.validateDates(mockStartDate, mockEndDate);
            expect(isValid).toBe(true);
            expect(mockDateValidation.resetErrors).toHaveBeenCalled();
            expect(mockDateValidation.validateDate).toHaveBeenCalledWith(mockStartDate, 'startDate', expect.any(Object));
            expect(mockDateValidation.validateDate).toHaveBeenCalledWith(mockEndDate, 'endDate', expect.any(Object));
            expect(mockDateValidation.validateDateRange).toHaveBeenCalled();
        });

        it('devrait rejeter des dates invalides - startDate null', () => {
            const { result } = renderHook(() => useConflictDetection({ userId }));
            const isValid = result.current.validateDates(null as any, mockEndDate);
            expect(isValid).toBe(false);
            expect(mockDateValidation.resetErrors).toHaveBeenCalled();
        });

        it('devrait rejeter des dates invalides - endDate null', () => {
            const { result } = renderHook(() => useConflictDetection({ userId }));
            const isValid = result.current.validateDates(mockStartDate, null as any);
            expect(isValid).toBe(false);
            expect(mockDateValidation.resetErrors).toHaveBeenCalled();
        });

        it('devrait rejeter des dates invalides - date de début après date de fin', () => {
            const { result } = renderHook(() => useConflictDetection({ userId }));
            const laterDate = new Date(mockStartDate);
            laterDate.setDate(laterDate.getDate() + 10);
            const isValid = result.current.validateDates(laterDate, mockStartDate);
            expect(isValid).toBe(false);
            expect(mockDateValidation.resetErrors).toHaveBeenCalled();
        });

        it('devrait rejeter des dates lorsque la validation échoue', () => {
            mockDateValidation.validateDate.mockReturnValueOnce(false);
            const { result } = renderHook(() => useConflictDetection({ userId }));
            const isValid = result.current.validateDates(mockStartDate, mockEndDate);
            expect(isValid).toBe(false);
            expect(mockDateValidation.resetErrors).toHaveBeenCalled();
            expect(mockDateValidation.validateDate).toHaveBeenCalled();
        });
    });

    describe('checkConflicts', () => {
        beforeEach(() => {
            mockDateValidation.validateDate.mockReturnValue(true);
            mockDateValidation.validateDateRange.mockReturnValue(true);
            mockDateValidation.hasError.mockReturnValue(false);
        });

        it('devrait vérifier les conflits et mettre à jour l\'état - sans conflits', async () => {
            (checkLeaveConflicts as jest.Mock).mockResolvedValue({ conflicts: [], hasBlockingConflicts: false, hasBlockers: false, hasConflicts: false });
            const { result } = renderHook(() => useConflictDetection({ userId }));
            await result.current.checkConflicts(mockStartDate, mockEndDate);
            await waitFor(() => { expect(result.current.loading).toBe(false); });
            expect(result.current.conflicts).toEqual([]);
            expect(result.current.hasBlockingConflicts).toBe(false);
        });

        it('devrait vérifier les conflits et mettre à jour l\'état - avec conflits', async () => {
            const mockResult = { conflicts: [mockBlockingConflict], hasBlockingConflicts: true, hasBlockers: true, hasConflicts: true };
            (checkLeaveConflicts as jest.Mock).mockResolvedValue(mockResult);
            const { result } = renderHook(() => useConflictDetection({ userId }));
            await result.current.checkConflicts(mockStartDate, mockEndDate, mockLeaveId);
            await waitFor(() => { expect(result.current.loading).toBe(false); });
            expect(result.current.conflicts).toEqual(mockResult.conflicts);
            expect(result.current.hasBlockingConflicts).toBe(true);
        });

        it('devrait gérer les erreurs lors de la vérification des conflits', async () => {
            const mockError = new Error('Erreur test');
            (checkLeaveConflicts as jest.Mock).mockRejectedValue(mockError);
            const { result } = renderHook(() => useConflictDetection({ userId }));
            await expect(result.current.checkConflicts(mockStartDate, mockEndDate)).rejects.toEqual(mockError);
        });

        it('devrait rejeter avec une erreur si les dates sont invalides', async () => {
            mockDateValidation.validateDate.mockReturnValueOnce(false);
            const { result } = renderHook(() => useConflictDetection({ userId }));
            await expect(result.current.checkConflicts(mockStartDate, mockEndDate)).rejects.toThrow('Dates invalides');
        });

        it('ne devrait pas appeler checkLeaveConflicts si les dates sont invalides', async () => {
            mockDateValidation.validateDate.mockReturnValue(false);
            const { result } = renderHook(() => useConflictDetection({ userId }));
            try { await result.current.checkConflicts(mockStartDate, mockEndDate); } catch (e) { }
            expect(checkLeaveConflicts).not.toHaveBeenCalled();
        });

        it('devrait mettre à jour les conflits lorsque le service renvoie des conflits', async () => {
            const mockConflicts = [mockBlockingConflict];
            (checkLeaveConflicts as jest.Mock).mockResolvedValue({ conflicts: mockConflicts, hasBlockingConflicts: true, hasBlockers: true, hasConflicts: true });
            const { result } = renderHook(() => useConflictDetection({ userId }));
            await result.current.checkConflicts(mockStartDate, mockEndDate);
            await waitFor(() => { expect(result.current.loading).toBe(false); });
            expect(result.current.conflicts).toEqual(mockConflicts);
            expect(result.current.hasBlockingConflicts).toBe(true);
        });

        it('devrait gérer les erreurs du service', async () => {
            const mockError = new Error('Erreur test');
            (checkLeaveConflicts as jest.Mock).mockRejectedValue(mockError);
            const { result } = renderHook(() => useConflictDetection({ userId }));
            await expect(result.current.checkConflicts(mockStartDate, mockEndDate)).rejects.toEqual(mockError);
        });

        it('ne devrait pas appeler le service si les dates sont invalides', async () => {
            mockDateValidation.validateDate.mockReturnValue(false);
            const { result } = renderHook(() => useConflictDetection({ userId }));
            try { await result.current.checkConflicts(mockStartDate, mockEndDate); } catch (e) { }
            expect(checkLeaveConflicts).not.toHaveBeenCalled();
        });
    });

    describe('getConflictsByType', () => {
        it('devrait filtrer les conflits par type', async () => {
            const mockConflictsResult = {
                conflicts: [mockBlockingConflict, mockWarningConflict, mockInfoConflict],
                hasBlockingConflicts: true,
                hasBlockers: true,
                hasConflicts: true
            };
            (checkLeaveConflicts as jest.Mock).mockResolvedValue(mockConflictsResult);
            const { result } = renderHook(() => useConflictDetection({ userId }));
            await result.current.checkConflicts(mockStartDate, mockEndDate);
            await waitFor(() => {
                expect(result.current.loading).toBe(false);
                expect(result.current.conflicts).toHaveLength(3);
            });
            expect(result.current.getConflictsByType(ConflictType.USER_LEAVE_OVERLAP)).toEqual([mockBlockingConflict]);
            expect(result.current.getConflictsByType(ConflictType.SPECIAL_PERIOD)).toEqual([mockWarningConflict]);
            expect(result.current.getConflictsByType(ConflictType.TEAM_CAPACITY)).toEqual([mockInfoConflict]);
        });
    });

    describe('resolveConflict', () => {
        it('devrait supprimer un conflit et mettre à jour l\'état des conflits bloquants', async () => {
            const mockConflictsResult = {
                conflicts: [mockBlockingConflict, mockWarningConflict, mockInfoConflict],
                hasBlockingConflicts: true,
                hasBlockers: true,
                hasConflicts: true
            };
            (checkLeaveConflicts as jest.Mock).mockResolvedValue(mockConflictsResult);
            const { result } = renderHook(() => useConflictDetection({ userId }));
            await result.current.checkConflicts(mockStartDate, mockEndDate);
            await waitFor(() => { expect(result.current.conflicts).toHaveLength(3); });

            act(() => {
                result.current.resolveConflict(mockBlockingConflict.id);
            });

            await waitFor(() => {
                expect(result.current.conflicts).toHaveLength(2);
                expect(result.current.conflicts).not.toContainEqual(expect.objectContaining({ id: mockBlockingConflict.id }));
                expect(result.current.hasBlockingConflicts).toBe(false);
            });
        });
    });

    describe('resetConflicts', () => {
        it('devrait réinitialiser l\'état des conflits', async () => {
            const mockConflictsResult = { conflicts: [mockBlockingConflict], hasBlockingConflicts: true, hasBlockers: true, hasConflicts: true };
            (checkLeaveConflicts as jest.Mock).mockResolvedValue(mockConflictsResult);
            const { result } = renderHook(() => useConflictDetection({ userId }));
            await result.current.checkConflicts(mockStartDate, mockEndDate);
            await waitFor(() => { expect(result.current.conflicts).toHaveLength(1); });
            act(() => { result.current.resetConflicts(); });
            expect(result.current.conflicts).toEqual([]);
            expect(result.current.hasBlockingConflicts).toBe(false);
            expect(result.current.error).toBeNull();
        });
    });
});

// Tests d'intégration
describe('Integration useConflictDetection avec useDateValidation', () => {
    const createDate = (year: number, month: number, day: number): Date => new Date(year, month - 1, day);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('devrait vérifier les conflits et gérer la validation des dates', async () => {
        // 1. Cas de test avec des dates valides
        (useDateValidation as jest.Mock).mockImplementation(() => ({
            validateDate: jest.fn(() => true),
            validateDateRange: jest.fn(() => true),
            hasError: jest.fn(() => false),
            getErrorMessage: jest.fn(() => null),
            resetErrors: jest.fn()
        }));
        (checkLeaveConflicts as jest.Mock).mockResolvedValue({ conflicts: [], hasBlockingConflicts: false });
        const { result } = renderHook(() => useConflictDetection({ userId }));
        await result.current.checkConflicts(mockStartDate, mockEndDate);
        expect(checkLeaveConflicts).toHaveBeenCalledWith(mockStartDate, mockEndDate, userId, undefined);

        // 2. Tester la fonction validateDates directement
        jest.clearAllMocks();
        (useDateValidation as jest.Mock).mockImplementation(() => ({
            validateDate: jest.fn().mockReturnValueOnce(false),
            validateDateRange: jest.fn(),
            hasError: jest.fn().mockReturnValue(true),
            getErrorMessage: jest.fn().mockReturnValue('Date invalide'),
            resetErrors: jest.fn()
        }));
        const { result: result2 } = renderHook(() => useConflictDetection({ userId }));
        const isValid = result2.current.validateDates(mockStartDate, mockEndDate);
        expect(isValid).toBe(false);
    });
});