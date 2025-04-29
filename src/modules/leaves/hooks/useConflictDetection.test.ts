import { renderHook, act } from '@testing-library/react';
import { useConflictDetection } from './useConflictDetection';
import { checkLeaveConflicts } from '../services/leaveService';
import { ConflictSeverity, ConflictType } from '../types/conflict';
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
const mockStartDate = createDate(2023, 5, 10);
const mockEndDate = createDate(2023, 5, 15);
const mockLeaveId = 'leave-123';

// Conflits factices pour les tests
const mockBlockingConflict = {
    id: 'conflict-1',
    type: ConflictType.USER_LEAVE_OVERLAP, // Type existant dans l'énumération
    severity: ConflictSeverity.ERROR,
    message: 'Conflit avec une autre absence',
    description: 'Conflit avec une autre absence',
    startDate: createDate(2023, 5, 12),
    endDate: createDate(2023, 5, 12),
    resolved: false,
    createdAt: new Date(),
    updatedAt: new Date()
};

const mockWarningConflict = {
    id: 'conflict-2',
    type: ConflictType.SPECIAL_PERIOD, // Type existant dans l'énumération
    severity: ConflictSeverity.WARNING,
    message: 'Jour férié pendant l\'absence',
    description: 'Jour férié pendant l\'absence',
    startDate: createDate(2023, 5, 11),
    endDate: createDate(2023, 5, 11),
    resolved: false,
    createdAt: new Date(),
    updatedAt: new Date()
};

const mockInfoConflict = {
    id: 'conflict-3',
    type: ConflictType.TEAM_CAPACITY, // Type existant dans l'énumération
    severity: ConflictSeverity.INFO,
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
            expect(mockDateValidation.validateDate).toHaveBeenCalledWith(
                mockStartDate, 'startDate', expect.any(Object)
            );
            expect(mockDateValidation.validateDate).toHaveBeenCalledWith(
                mockEndDate, 'endDate', expect.any(Object)
            );
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
        it('devrait vérifier les conflits et mettre à jour l\'état - sans conflits', async () => {
            (checkLeaveConflicts as jest.Mock).mockResolvedValue({
                conflicts: [],
                hasBlockingConflicts: false
            });

            const { result } = renderHook(() => useConflictDetection({ userId }));

            let promise: Promise<any> = Promise.resolve();
            act(() => {
                promise = result.current.checkConflicts(mockStartDate, mockEndDate);
            });

            expect(result.current.loading).toBe(true);

            // Utiliser une attente à la place de waitForNextUpdate
            await act(async () => {
                await promise;
            });

            expect(checkLeaveConflicts).toHaveBeenCalledWith(
                mockStartDate,
                mockEndDate,
                userId,
                undefined
            );
            expect(result.current.conflicts).toEqual([]);
            expect(result.current.hasBlockingConflicts).toBe(false);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();

            await expect(promise).resolves.toEqual({
                conflicts: [],
                hasBlockingConflicts: false
            });
        });

        it('devrait vérifier les conflits et mettre à jour l\'état - avec conflits', async () => {
            const mockResult = {
                conflicts: [mockBlockingConflict, mockWarningConflict, mockInfoConflict],
                hasBlockingConflicts: true
            };

            (checkLeaveConflicts as jest.Mock).mockResolvedValue(mockResult);

            const { result } = renderHook(() => useConflictDetection({ userId }));

            let promise: Promise<any> = Promise.resolve();
            act(() => {
                promise = result.current.checkConflicts(mockStartDate, mockEndDate, mockLeaveId);
            });

            // Utiliser une attente à la place de waitForNextUpdate
            await act(async () => {
                await promise;
            });

            expect(checkLeaveConflicts).toHaveBeenCalledWith(
                mockStartDate,
                mockEndDate,
                userId,
                mockLeaveId
            );
            expect(result.current.conflicts).toEqual(mockResult.conflicts);
            expect(result.current.hasBlockingConflicts).toBe(true);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
        });

        it('devrait gérer les erreurs lors de la vérification des conflits', async () => {
            const mockError = new Error('Erreur test');
            (checkLeaveConflicts as jest.Mock).mockRejectedValue(mockError);

            const { result } = renderHook(() => useConflictDetection({ userId }));

            let promise: Promise<any> = Promise.resolve();
            act(() => {
                promise = result.current.checkConflicts(mockStartDate, mockEndDate);
            });

            // Attraper et gérer l'erreur dans le test
            await act(async () => {
                try {
                    await promise;
                } catch (e) {
                    // L'erreur est attendue, ne rien faire
                }
            });

            expect(result.current.conflicts).toEqual([]);
            expect(result.current.hasBlockingConflicts).toBe(false);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toEqual(mockError);

            await expect(promise).rejects.toEqual(mockError);
        });

        it('devrait rejeter avec une erreur si les dates sont invalides', async () => {
            mockDateValidation.validateDate.mockReturnValueOnce(false);

            const { result } = renderHook(() => useConflictDetection({ userId }));

            let promise: Promise<any> = Promise.resolve();
            act(() => {
                promise = result.current.checkConflicts(mockStartDate, mockEndDate);
            });

            // Attraper et gérer l'erreur dans le test
            await act(async () => {
                try {
                    await promise;
                } catch (e) {
                    // L'erreur est attendue, ne rien faire
                }
            });

            expect(result.current.loading).toBe(false);
            expect(result.current.conflicts).toEqual([]);
            expect(result.current.hasBlockingConflicts).toBe(false);

            await expect(promise).rejects.toThrow('Dates invalides pour la vérification des conflits');
            expect(checkLeaveConflicts).not.toHaveBeenCalled();
        });

        it('devrait rejeter avec une erreur si l\'ID utilisateur est manquant', async () => {
            const { result } = renderHook(() => useConflictDetection({ userId: '' }));

            let promise: Promise<any> = Promise.resolve();
            act(() => {
                promise = result.current.checkConflicts(mockStartDate, mockEndDate);
            });

            // Attraper et gérer l'erreur dans le test
            await act(async () => {
                try {
                    await promise;
                } catch (e) {
                    // L'erreur est attendue, ne rien faire
                }
            });

            expect(result.current.loading).toBe(false);
            await expect(promise).rejects.toThrow('ID utilisateur requis');
            expect(checkLeaveConflicts).not.toHaveBeenCalled();
        });

        it('devrait initialiser les conflits à vide', async () => {
            let promise: Promise<any> = Promise.resolve();
            const { result } = renderHook(() => useConflictDetection({ userId }));

            // Configuration du mock pour renvoyer un tableau vide
            (checkLeaveConflicts as jest.Mock).mockResolvedValue({
                conflicts: [],
                hasBlockingConflicts: false
            });

            act(() => {
                promise = result.current.checkConflicts(mockStartDate, mockEndDate);
            });

            await act(async () => {
                await promise;
            });

            expect(result.current.conflicts).toEqual([]);
            expect(result.current.hasBlockingConflicts).toBe(false);
        });

        it('devrait mettre à jour les conflits lorsque le service renvoie des conflits', async () => {
            let promise: Promise<any> = Promise.resolve();
            const mockConflicts = [mockBlockingConflict, mockWarningConflict];
            (checkLeaveConflicts as jest.Mock).mockResolvedValue({
                conflicts: mockConflicts,
                hasBlockingConflicts: true
            });

            const { result } = renderHook(() => useConflictDetection({ userId }));

            act(() => {
                promise = result.current.checkConflicts(mockStartDate, mockEndDate);
            });

            await act(async () => {
                await promise;
            });

            expect(result.current.conflicts).toEqual(mockConflicts);
            expect(result.current.hasBlockingConflicts).toBe(true);
        });

        it('devrait gérer les erreurs du service', async () => {
            let promise: Promise<any> = Promise.resolve();
            const mockError = new Error('Erreur test');
            (checkLeaveConflicts as jest.Mock).mockRejectedValue(mockError);

            const { result } = renderHook(() => useConflictDetection({ userId }));

            act(() => {
                promise = result.current.checkConflicts(mockStartDate, mockEndDate);
            });

            await act(async () => {
                try {
                    await promise;
                } catch (e) {
                    // Erreur attendue
                }
            });

            expect(result.current.error).toEqual(mockError);
        });

        it('ne devrait pas appeler le service si les dates sont invalides', async () => {
            let promise: Promise<any> = Promise.resolve();
            mockDateValidation.validateDate.mockReturnValueOnce(false);

            const { result } = renderHook(() => useConflictDetection({ userId }));

            act(() => {
                promise = result.current.checkConflicts(mockStartDate, mockEndDate);
            });

            await act(async () => {
                try {
                    await promise;
                } catch (e) {
                    // Erreur attendue
                }
            });

            expect(checkLeaveConflicts).not.toHaveBeenCalled();
        });
    });

    describe('getConflictsByType', () => {
        it('devrait filtrer les conflits par type', async () => {
            const mockConflicts = [mockBlockingConflict, mockWarningConflict, mockInfoConflict];
            (checkLeaveConflicts as jest.Mock).mockResolvedValue({
                conflicts: mockConflicts,
                hasBlockingConflicts: true
            });

            const { result } = renderHook(() => useConflictDetection({ userId }));

            await act(async () => {
                await result.current.checkConflicts(mockStartDate, mockEndDate);
            });

            const userLeaveOverlapConflicts = result.current.getConflictsByType(ConflictType.USER_LEAVE_OVERLAP);
            const specialPeriodConflicts = result.current.getConflictsByType(ConflictType.SPECIAL_PERIOD);
            const teamCapacityConflicts = result.current.getConflictsByType(ConflictType.TEAM_CAPACITY);

            expect(userLeaveOverlapConflicts).toEqual([mockBlockingConflict]);
            expect(specialPeriodConflicts).toEqual([mockWarningConflict]);
            expect(teamCapacityConflicts).toEqual([mockInfoConflict]);
        });
    });

    describe('getBlockingConflicts, getWarningConflicts, getInfoConflicts', () => {
        it('devrait filtrer les conflits par niveau de sévérité', async () => {
            const mockConflicts = [mockBlockingConflict, mockWarningConflict, mockInfoConflict];
            (checkLeaveConflicts as jest.Mock).mockResolvedValue({
                conflicts: mockConflicts,
                hasBlockingConflicts: true
            });

            const { result } = renderHook(() => useConflictDetection({ userId }));

            await act(async () => {
                await result.current.checkConflicts(mockStartDate, mockEndDate);
            });

            const blockingConflicts = result.current.getBlockingConflicts();
            const warningConflicts = result.current.getWarningConflicts();
            const infoConflicts = result.current.getInfoConflicts();

            expect(blockingConflicts).toEqual([mockBlockingConflict]);
            expect(warningConflicts).toEqual([mockWarningConflict]);
            expect(infoConflicts).toEqual([mockInfoConflict]);
        });
    });

    describe('resolveConflict', () => {
        it('devrait supprimer un conflit et mettre à jour l\'état des conflits bloquants', async () => {
            const mockConflicts = [mockBlockingConflict, mockWarningConflict, mockInfoConflict];
            (checkLeaveConflicts as jest.Mock).mockResolvedValue({
                conflicts: mockConflicts,
                hasBlockingConflicts: true
            });

            const { result } = renderHook(() => useConflictDetection({ userId }));

            await act(async () => {
                await result.current.checkConflicts(mockStartDate, mockEndDate);
            });

            act(() => {
                result.current.resolveConflict(mockBlockingConflict.id);
            });

            expect(result.current.conflicts).toHaveLength(2);
            expect(result.current.conflicts).not.toContainEqual(expect.objectContaining({ id: mockBlockingConflict.id }));
            expect(result.current.hasBlockingConflicts).toBe(false);
        });
    });

    describe('resetConflicts', () => {
        it('devrait réinitialiser l\'état des conflits', async () => {
            const mockConflicts = [mockBlockingConflict, mockWarningConflict, mockInfoConflict];
            (checkLeaveConflicts as jest.Mock).mockResolvedValue({
                conflicts: mockConflicts,
                hasBlockingConflicts: true
            });

            const { result } = renderHook(() => useConflictDetection({ userId }));

            await act(async () => {
                await result.current.checkConflicts(mockStartDate, mockEndDate);
            });

            expect(result.current.conflicts).toHaveLength(3);

            act(() => {
                result.current.resetConflicts();
            });

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
        // Configurer le mock du hook useDateValidation pour renvoyer que les dates sont valides
        (useDateValidation as jest.Mock).mockImplementation(() => ({
            validateDate: jest.fn(() => true),
            validateDateRange: jest.fn(() => true),
            hasError: jest.fn(() => false),
            getErrorMessage: jest.fn(() => null),
            resetErrors: jest.fn()
        }));

        // Configurer le mock du service checkLeaveConflicts
        (checkLeaveConflicts as jest.Mock).mockResolvedValue({
            conflicts: [],
            hasBlockingConflicts: false
        });

        // Rendre le hook
        const { result } = renderHook(() => useConflictDetection({ userId }));

        // Appeler la fonction checkConflicts
        await act(async () => {
            await result.current.checkConflicts(mockStartDate, mockEndDate);
        });

        // Vérifier que le service a été appelé
        expect(checkLeaveConflicts).toHaveBeenCalledWith(
            mockStartDate,
            mockEndDate,
            userId,
            undefined
        );

        // 2. Tester la fonction validateDates directement
        // Réinitialiser tous les mocks
        jest.clearAllMocks();

        // Simuler que validateDate renvoie false
        (useDateValidation as jest.Mock).mockImplementation(() => ({
            validateDate: jest.fn().mockReturnValueOnce(false),
            validateDateRange: jest.fn(),
            hasError: jest.fn().mockReturnValue(true),
            getErrorMessage: jest.fn().mockReturnValue('Date invalide'),
            resetErrors: jest.fn()
        }));

        // Rendu d'un nouveau hook
        const { result: result2 } = renderHook(() => useConflictDetection({ userId }));

        // Tester la fonction validateDates directement
        const isValid = result2.current.validateDates(mockStartDate, mockEndDate);

        // Valider le résultat
        expect(isValid).toBe(false);
    });
}); 