import { jest as vi, describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { format } from 'date-fns';

// Importer d'abord le hook à tester
import { useOperatingRoomPlanning } from '@/hooks/useOperatingRoomPlanning';
import { BlocDayPlanning, ValidationResult } from '@/types/bloc-planning-types';

// Importer le type de l'instance du service depuis le hook (si exporté) ou le définir ici
// Supposons que BlocPlanningServiceInstance est défini dans le hook ou importable.
// Si ce n'est pas le cas, il faudra le copier/coller ici.
// Pour cet exemple, je vais le redéfinir pour la clarté.
interface ServiceCallOptions {
    signal?: AbortSignal;
}
type BlocPlanningServiceInstanceForTest = {
    getDayPlanning: vi.Mock<(date: string, options?: ServiceCallOptions) => Promise<BlocDayPlanning | null>>;
    saveDayPlanning: vi.Mock<(planning: BlocDayPlanning, options?: ServiceCallOptions) => Promise<BlocDayPlanning>>;
    validateDayPlanning: vi.Mock<(planning: BlocDayPlanning, options?: ServiceCallOptions) => Promise<ValidationResult>>;
    deleteDayPlanning: vi.Mock<(date: string, options?: ServiceCallOptions) => Promise<boolean>>;
    getOperatingRooms: vi.Mock<() => any>;
    createOperatingRoom: vi.Mock<(data: any) => any>;
    updateOperatingRoom: vi.Mock<(id: string, data: any) => any>;
    deleteOperatingRoomFromService: vi.Mock<(id: string) => any>;
    getOperatingSectors: vi.Mock<() => any>;
    createOperatingSector: vi.Mock<(data: any) => any>;
    updateOperatingSector: vi.Mock<(id: string, data: any) => any>;
    deleteOperatingSector: vi.Mock<(id: string) => any>;
    getAllSupervisionRules: vi.Mock<() => any>;
    getSupervisionRuleById: vi.Mock<(id: string) => any>;
    createSupervisionRule: vi.Mock<(data: any) => any>;
    updateSupervisionRule: vi.Mock<(id: string, data: any) => any>;
    deleteSupervisionRule: vi.Mock<(id: string) => any>;
    resetForTesting: vi.Mock<() => void>;
    getAvailableSupervisors: vi.Mock<() => any>;
    checkPlanningCompatibility: vi.Mock<(userId: string, date: string, periods: any[]) => any>;
    periodsOverlap: vi.Mock<(a: any, b: any) => any>;
    getAllOperatingRoomsForSector: vi.Mock<(sectorId: string) => any>;
};

const mockBlocPlanningService: BlocPlanningServiceInstanceForTest = {
    getDayPlanning: vi.fn(),
    saveDayPlanning: vi.fn(),
    validateDayPlanning: vi.fn(),
    deleteDayPlanning: vi.fn(),
    getOperatingRooms: vi.fn(),
    createOperatingRoom: vi.fn(),
    updateOperatingRoom: vi.fn(),
    deleteOperatingRoomFromService: vi.fn(),
    getOperatingSectors: vi.fn(),
    createOperatingSector: vi.fn(),
    updateOperatingSector: vi.fn(),
    deleteOperatingSector: vi.fn(),
    getAllSupervisionRules: vi.fn(),
    getSupervisionRuleById: vi.fn(),
    createSupervisionRule: vi.fn(),
    updateSupervisionRule: vi.fn(),
    deleteSupervisionRule: vi.fn(),
    resetForTesting: vi.fn(),
    getAvailableSupervisors: vi.fn(),
    checkPlanningCompatibility: vi.fn(),
    periodsOverlap: vi.fn(),
    getAllOperatingRoomsForSector: vi.fn(),
};

describe("Tests d'intégration des hooks de planification du bloc opératoire", () => {
    // Date de test
    const testDate = new Date();
    const formattedDate = format(testDate, 'yyyy-MM-dd');

    // Planning de test
    const mockPlanning: BlocDayPlanning = {
        id: 'planning-1',
        date: formattedDate,
        salles: [
            {
                id: 'assignment-1',
                salleId: 'salle-1',
                superviseurs: []
            }
        ],
        validationStatus: 'BROUILLON'
    };

    beforeEach(() => {
        vi.resetAllMocks(); // Réinitialise tous les mocks (y compris ceux du mockBlocPlanningService)

        // Configurer les fonctions mockées
        mockBlocPlanningService.getDayPlanning.mockResolvedValue(mockPlanning);
        mockBlocPlanningService.saveDayPlanning.mockImplementation(async (planning: BlocDayPlanning) => ({
            ...planning,
            id: planning.id || 'new-planning-id',
            updatedAt: new Date()
        } as BlocDayPlanning));
        mockBlocPlanningService.validateDayPlanning.mockResolvedValue({
            isValid: true, errors: [], warnings: [], infos: []
        } as ValidationResult);
        mockBlocPlanningService.deleteDayPlanning.mockResolvedValue(true);
    });

    describe('useOperatingRoomPlanning', () => {
        it('devrait charger un planning existant', async () => {
            // Injecter le service mocké
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));
            await act(async () => {
                await result.current.loadDayPlanning(formattedDate);
            });
            expect(mockBlocPlanningService.getDayPlanning).toHaveBeenCalledWith(formattedDate, expect.anything());
            expect(result.current.isLoading).toBe(false);
            expect(result.current.dayPlanning).toEqual(mockPlanning);
            expect(result.current.error).toBeNull();
        });

        it('devrait gérer les erreurs de chargement', async () => {
            const errorMessage = 'Erreur de chargement du service';
            mockBlocPlanningService.getDayPlanning.mockRejectedValue(new Error(errorMessage));
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));
            await act(async () => {
                await result.current.loadDayPlanning(formattedDate);
            });
            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).not.toBeNull();
            expect(result.current.error?.message).toBe(errorMessage);
            expect(result.current.dayPlanning).toBeNull();
        });

        it('devrait créer un nouveau planning via save', async () => {
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));
            const newPlanningData: BlocDayPlanning = {
                id: '', date: formattedDate, salles: [], validationStatus: 'BROUILLON'
            };
            await act(async () => {
                await result.current.saveDayPlanning(newPlanningData);
            });
            expect(mockBlocPlanningService.saveDayPlanning).toHaveBeenCalledWith(
                expect.objectContaining({ date: formattedDate, validationStatus: 'BROUILLON' }),
                expect.anything()
            );
            expect(result.current.isSaving).toBe(false);
            expect(result.current.dayPlanning).not.toBeNull();
            expect(result.current.dayPlanning?.id).toBe('new-planning-id');
        });

        it('devrait mettre à jour un planning existant via save', async () => {
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));
            await act(async () => { await result.current.loadDayPlanning(formattedDate); });
            await waitFor(() => expect(result.current.dayPlanning).not.toBeNull());
            const updatedPlanning: BlocDayPlanning = {
                ...result.current.dayPlanning!,
                salles: [...result.current.dayPlanning!.salles, { id: 'assignment-2', salleId: 'salle-2', superviseurs: [] }],
                validationStatus: 'VALIDE'
            };
            await act(async () => { await result.current.saveDayPlanning(updatedPlanning); });
            expect(mockBlocPlanningService.saveDayPlanning).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'planning-1', validationStatus: 'VALIDE' }),
                expect.anything()
            );
            expect(result.current.isSaving).toBe(false);
            expect(result.current.dayPlanning?.salles.length).toBe(2);
            expect(result.current.dayPlanning?.validationStatus).toBe('VALIDE');
        });

        it('devrait valider un planning', async () => {
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));
            await act(async () => { await result.current.loadDayPlanning(formattedDate); });
            await waitFor(() => expect(result.current.dayPlanning).not.toBeNull());
            await act(async () => { await result.current.validatePlanning(result.current.dayPlanning!); });
            expect(mockBlocPlanningService.validateDayPlanning).toHaveBeenCalledWith(result.current.dayPlanning, expect.anything());
            expect(result.current.isValidating).toBe(false);
            expect(result.current.validationResult).not.toBeNull();
            expect(result.current.validationResult?.isValid).toBe(true);
        });

        it('devrait gérer les conflits de validation', async () => {
            const validationErrorResult: ValidationResult = {
                isValid: false,
                errors: [{ id: 'error-1', type: 'REGLE_SUPERVISION', description: 'Conflit de supervision', severite: 'ERREUR', entitesAffectees: [{ type: 'SUPERVISEUR', id: 'user-1' }], estResolu: false }],
                warnings: [], infos: []
            };
            mockBlocPlanningService.validateDayPlanning.mockResolvedValue(validationErrorResult);
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));
            await act(async () => { await result.current.loadDayPlanning(formattedDate); });
            await waitFor(() => expect(result.current.dayPlanning).not.toBeNull());
            await act(async () => { await result.current.validatePlanning(result.current.dayPlanning!); });
            expect(mockBlocPlanningService.validateDayPlanning).toHaveBeenCalledWith(result.current.dayPlanning, expect.anything());
            expect(result.current.isValidating).toBe(false);
            expect(result.current.validationResult).toEqual(validationErrorResult);
        });
    });
}); 