import { renderHook, act, waitFor } from '@testing-library/react'; // Utiliser react-hooks si ancienne version
import { cleanup } from '@testing-library/react';
import { useLeave } from '../useLeave';
import {
    fetchLeaves,
    fetchLeaveById,
    saveLeave,
    submitLeaveRequest,
    approveLeave,
    rejectLeave,
    cancelLeave,
    checkLeaveConflicts,
    checkLeaveAllowance,
    calculateLeaveDays
} from '../../services/leaveService';
import {
    Leave,
    LeaveStatus,
    LeaveType,
    LeaveAllowanceCheckResult,
    LeaveBalance // Importé pour créer des mocks
} from '../../types/leave';
import { ConflictCheckResult, LeaveConflict, ConflictType, ConflictSeverity } from '../../types/conflict';
import { WorkSchedule, WorkFrequency, Weekday } from '../../../profiles/types/workSchedule';
import { ErrorDetails } from '@/hooks/useErrorHandler'; // Importé pour le typage des mocks

// Récupérer la référence mockée de useErrorHandler.setError pour les vérifications
const mockedSetError = jest.fn();
const mockedHasError = jest.fn(() => false);
const mockedClearError = jest.fn();

// Mocker le module useErrorHandler
jest.mock('@/hooks/useErrorHandler', () => ({
    useErrorHandler: () => ({
        setError: mockedSetError,
        errorState: { hasError: false, errors: {}, globalError: null },
        hasError: mockedHasError,
        clearError: mockedClearError
    })
}));

// Mocker le module useAuth 
jest.mock('@/context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'user123' }
    })
}));

// Mocker complètement le module leaveService
jest.mock('../../services/leaveService');

// Recréer les types des fonctions mockées pour TypeScript
const mockedFetchLeaves = fetchLeaves as jest.MockedFunction<typeof fetchLeaves>;
const mockedFetchLeaveById = fetchLeaveById as jest.MockedFunction<typeof fetchLeaveById>;
const mockedSaveLeave = saveLeave as jest.MockedFunction<typeof saveLeave>;
const mockedSubmitLeaveRequest = submitLeaveRequest as jest.MockedFunction<typeof submitLeaveRequest>;
const mockedApproveLeave = approveLeave as jest.MockedFunction<typeof approveLeave>;
const mockedRejectLeave = rejectLeave as jest.MockedFunction<typeof rejectLeave>;
const mockedCancelLeave = cancelLeave as jest.MockedFunction<typeof cancelLeave>;
const mockedCheckLeaveConflicts = checkLeaveConflicts as jest.MockedFunction<typeof checkLeaveConflicts>;
const mockedCheckLeaveAllowance = checkLeaveAllowance as jest.MockedFunction<typeof checkLeaveAllowance>;
const mockedCalculateLeaveDays = calculateLeaveDays as jest.MockedFunction<typeof calculateLeaveDays>;

// --- Mocks de Données Utiles --- 
const mockUserId = 'user123';
const d = (year: number, month: number, day: number) => new Date(year, month - 1, day);

const mockFullTimeSchedule: WorkSchedule = {
    id: 'sched-ft',
    userId: mockUserId,
    frequency: WorkFrequency.FULL_TIME,
    workingDays: [Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY],
    annualLeaveAllowance: 25,
    validFrom: d(2024, 1, 1),
    isActive: true,
    createdAt: d(2024, 1, 1),
    updatedAt: d(2024, 1, 1),
};

const mockInitialLeave: Leave = {
    id: 'leave-initial',
    userId: mockUserId,
    startDate: d(2024, 9, 2),
    endDate: d(2024, 9, 6),
    type: LeaveType.ANNUAL,
    status: LeaveStatus.DRAFT,
    countedDays: 5,
    requestDate: d(2024, 8, 1),
    createdAt: d(2024, 8, 1),
    updatedAt: d(2024, 8, 1),
};

// Mock de résultat pour conflits vide
const mockConflictResultEmpty: ConflictCheckResult = {
    hasBlockingConflicts: false,
    conflicts: []
};

// Mock de conflit non bloquant (warning)
const mockConflictWarning: LeaveConflict = {
    id: 'conflict-1',
    leaveId: 'other-leave-1',
    type: ConflictType.TEAM_CAPACITY,
    severity: ConflictSeverity.WARNING,
    description: 'Équipe à effectif réduit (non bloquant)',
    startDate: d(2024, 9, 2),
    endDate: d(2024, 9, 3),
    resolved: false,
    createdAt: d(2024, 8, 1),
    updatedAt: d(2024, 8, 1)
};

// Mock de conflit bloquant (erreur)
const mockConflictBlocking: LeaveConflict = {
    id: 'conflict-2',
    leaveId: 'other-leave-2',
    type: ConflictType.USER_LEAVE_OVERLAP,
    severity: ConflictSeverity.ERROR,
    description: 'Chevauchement avec un autre congé (bloquant)',
    startDate: d(2024, 9, 4),
    endDate: d(2024, 9, 5),
    resolved: false,
    createdAt: d(2024, 8, 1),
    updatedAt: d(2024, 8, 1)
};

// Mock de résultat pour conflits non bloquants
const mockConflictResultWarning: ConflictCheckResult = {
    hasBlockingConflicts: false,
    conflicts: [mockConflictWarning]
};

// Mock de résultat pour conflits bloquants
const mockConflictResultBlocking: ConflictCheckResult = {
    hasBlockingConflicts: true,
    conflicts: [mockConflictBlocking]
};

// Mock de résultat pour les deux types de conflits
const mockConflictResultMixed: ConflictCheckResult = {
    hasBlockingConflicts: true,
    conflicts: [mockConflictWarning, mockConflictBlocking]
};

const mockAllowanceResultOK: LeaveAllowanceCheckResult = { isAllowed: true, remainingDays: 10, requestedDays: 5, exceededDays: 0 };

// --- Fin Mocks Données ---

describe('useLeave Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });


    beforeEach(() => {
    jest.clearAllMocks();
        // Réinitialiser tous les mocks avant chaque test
        jest.clearAllMocks();
        mockedSetError.mockClear();

        // Configurer des retours par défaut pour éviter les erreurs
        // (peuvent être surchargés dans les tests spécifiques)
        mockedCalculateLeaveDays.mockReturnValue(0);
        mockedFetchLeaveById.mockResolvedValue(mockInitialLeave);
        mockedSaveLeave.mockImplementation(async (leave) => ({ ...mockInitialLeave, ...leave, id: leave.id || 'saved-id' }));
        mockedSubmitLeaveRequest.mockImplementation(async (leave) => ({ ...mockInitialLeave, ...leave, id: leave.id || 'submit-id', status: LeaveStatus.PENDING }));
        mockedApproveLeave.mockImplementation(async (id) => ({ ...mockInitialLeave, id, status: LeaveStatus.APPROVED }));
        mockedRejectLeave.mockImplementation(async (id) => ({ ...mockInitialLeave, id, status: LeaveStatus.REJECTED }));
        mockedCancelLeave.mockImplementation(async (id) => ({ ...mockInitialLeave, id, status: LeaveStatus.CANCELLED }));
        mockedCheckLeaveConflicts.mockResolvedValue(mockConflictResultEmpty);
        mockedCheckLeaveAllowance.mockResolvedValue(mockAllowanceResultOK);
        mockedFetchLeaves.mockResolvedValue([mockInitialLeave]);
    });

    it('should initialize with null leave and starts loading when no initialLeave provided', () => {
        const { result } = renderHook(() => useLeave({ userId: mockUserId, userSchedule: mockFullTimeSchedule }));

        // Test the initial state
        expect(result.current.leave).toBeNull();
        expect(result.current.conflictCheckResult).toBeNull();
        expect(result.current.allowanceCheckResult).toBeNull();
        
        // Since useLeave automatically calls fetchUserLeaves when userId is provided and no initialLeave,
        // loading should be true initially (fetchLeaves is called in useEffect)
        expect(result.current.loading).toBe(true);
        
        // Error should be null initially
        expect(result.current.error).toBeNull();
    });

    it('should initialize with initialLeave when provided', () => {
        const { result } = renderHook(() => useLeave({
            userId: mockUserId,
            userSchedule: mockFullTimeSchedule,
            initialLeave: mockInitialLeave
        }));

        expect(result.current.leave).toEqual(mockInitialLeave);
        expect(result.current.leaves).toEqual([]); // La liste n'est pas chargée initialement
    });

    // --- Tests pour updateLeaveField ---
    describe('updateLeaveField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        it('should update a simple field like reason', () => {
            const { result } = renderHook(() => useLeave({ initialLeave: mockInitialLeave, userId: mockUserId }));
            const newReason = 'Updated reason';

            act(() => {
                result.current.updateLeaveField('reason', newReason);
            });

            expect(result.current.leave?.reason).toBe(newReason);
            // Vérifier qu'un autre champ n'a pas changé
            expect(result.current.leave?.type).toBe(mockInitialLeave.type);
        });

        it('should update startDate and recalculate countedDays if schedule exists', () => {
            const initialLeaveForCalc: Partial<Leave> = {
                startDate: d(2024, 9, 2), // Lundi 
                endDate: d(2024, 9, 6)  // Vendredi
            };
            const { result } = renderHook(() => useLeave({
                initialLeave: initialLeaveForCalc,
                userId: mockUserId,
                userSchedule: mockFullTimeSchedule // Fournir le schedule !
            }));

            const newStartDate = d(2024, 9, 3); // Mardi
            // Simuler le retour de calculateLeaveDays pour la nouvelle période (Mardi-Vendredi)
            mockedCalculateLeaveDays.mockReturnValue(4);

            act(() => {
                result.current.updateLeaveField('startDate', newStartDate);
            });

            expect(result.current.leave?.startDate).toEqual(newStartDate);
            // Vérifier que calculateLeaveDays a été appelé avec les bonnes dates
            expect(mockedCalculateLeaveDays).toHaveBeenCalledWith(newStartDate, initialLeaveForCalc.endDate, mockFullTimeSchedule);
            // Vérifier que countedDays a été mis à jour (selon le mock)
            expect(result.current.leave?.countedDays).toBe(4);
        });

        it('should update endDate and recalculate countedDays if schedule exists', () => {
            const initialLeaveForCalc: Partial<Leave> = {
                startDate: d(2024, 9, 2), // Lundi 
                endDate: d(2024, 9, 6)  // Vendredi
            };
            const { result } = renderHook(() => useLeave({
                initialLeave: initialLeaveForCalc,
                userId: mockUserId,
                userSchedule: mockFullTimeSchedule
            }));

            const newEndDate = d(2024, 9, 5); // Jeudi
            mockedCalculateLeaveDays.mockReturnValue(4); // Lundi-Jeudi

            act(() => {
                result.current.updateLeaveField('endDate', newEndDate);
            });

            expect(result.current.leave?.endDate).toEqual(newEndDate);
            expect(mockedCalculateLeaveDays).toHaveBeenCalledWith(initialLeaveForCalc.startDate, newEndDate, mockFullTimeSchedule);
            expect(result.current.leave?.countedDays).toBe(4);
        });

        it('should NOT recalculate countedDays if schedule is missing', () => {
            const initialLeaveForCalc: Partial<Leave> = {
                startDate: d(2024, 9, 2),
                endDate: d(2024, 9, 6),
                countedDays: 5 // Valeur initiale
            };
            // Ne pas fournir de userSchedule
            const { result } = renderHook(() => useLeave({ initialLeave: initialLeaveForCalc, userId: mockUserId }));

            const newStartDate = d(2024, 9, 3);

            act(() => {
                result.current.updateLeaveField('startDate', newStartDate);
            });

            expect(result.current.leave?.startDate).toEqual(newStartDate);
            expect(mockedCalculateLeaveDays).not.toHaveBeenCalled();
            expect(result.current.leave?.countedDays).toBe(5); // Doit rester la valeur initiale
        });

        it('should NOT recalculate countedDays if start date becomes after end date', () => {
            const initialLeaveForCalc: Partial<Leave> = {
                startDate: d(2024, 9, 2),
                endDate: d(2024, 9, 6),
                countedDays: 5
            };
            const { result } = renderHook(() => useLeave({
                initialLeave: initialLeaveForCalc,
                userId: mockUserId,
                userSchedule: mockFullTimeSchedule
            }));

            const newStartDate = d(2024, 9, 10); // Après la date de fin

            act(() => {
                result.current.updateLeaveField('startDate', newStartDate);
            });

            expect(result.current.leave?.startDate).toEqual(newStartDate);
            expect(mockedCalculateLeaveDays).not.toHaveBeenCalled();
            expect(result.current.leave?.countedDays).toBe(5); // Doit rester la valeur initiale
        });

        it('should update type without recalculating days', () => {
            const { result } = renderHook(() => useLeave({
                initialLeave: mockInitialLeave,
                userId: mockUserId,
                userSchedule: mockFullTimeSchedule
            }));
            const initialDays = result.current.leave?.countedDays;

            act(() => {
                result.current.updateLeaveField('type', LeaveType.SICK);
            });

            expect(result.current.leave?.type).toBe(LeaveType.SICK);
            expect(mockedCalculateLeaveDays).not.toHaveBeenCalled();
            expect(result.current.leave?.countedDays).toBe(initialDays);
        });
    });

    // --- Tests pour calculateLeaveDuration ---
    describe('calculateLeaveDuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        it('should call calculateLeaveDays with correct dates and schedule', () => {
            const { result } = renderHook(() => useLeave({
                initialLeave: mockInitialLeave,
                userId: mockUserId,
                userSchedule: mockFullTimeSchedule
            }));
            mockedCalculateLeaveDays.mockReturnValue(5);

            let duration = 0;
            act(() => {
                duration = result.current.calculateLeaveDuration();
            });

            expect(mockedCalculateLeaveDays).toHaveBeenCalledWith(
                new Date(mockInitialLeave.startDate),
                new Date(mockInitialLeave.endDate),
                mockFullTimeSchedule
            );
            expect(duration).toBe(5);
        });

        it('should return 0 if schedule is missing', () => {
            const { result } = renderHook(() => useLeave({
                initialLeave: mockInitialLeave,
                userId: mockUserId
                // Pas de schedule
            }));

            let duration = 0;
            act(() => {
                duration = result.current.calculateLeaveDuration();
            });

            expect(mockedCalculateLeaveDays).not.toHaveBeenCalled();
            expect(duration).toBe(0);
        });

        it('should return 0 if dates are missing', () => {
            const { result } = renderHook(() => useLeave({
                initialLeave: { type: LeaveType.ANNUAL }, // Pas de dates
                userId: mockUserId,
                userSchedule: mockFullTimeSchedule
            }));

            let duration = 0;
            act(() => {
                duration = result.current.calculateLeaveDuration();
            });

            expect(mockedCalculateLeaveDays).not.toHaveBeenCalled();
            expect(duration).toBe(0);
        });
    });

    // --- Tests pour checkConflicts ---
    describe('checkConflicts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        it('should correctly call checkLeaveConflicts with Date objects when passed ISO strings', async () => {
            // Réinitialiser et simplifier le mock
            jest.clearAllMocks();
            mockedCheckLeaveConflicts.mockResolvedValueOnce(mockConflictResultEmpty);

            const { result } = renderHook(() => useLeave({
                userId: mockUserId
            }));

            // Dates au format ISO string
            const isoStartDate = '2024-10-01T00:00:00.000Z';
            const isoEndDate = '2024-10-05T00:00:00.000Z';

            await act(async () => {
                await result.current.checkConflicts(isoStartDate, isoEndDate);
            });

            // Vérifier que checkLeaveConflicts a été appelé avec des objets Date
            expect(mockedCheckLeaveConflicts).toHaveBeenCalledWith(
                expect.any(Date),  // s'assurer que c'est bien un objet Date
                expect.any(Date),  // s'assurer que c'est bien un objet Date
                mockUserId,
                undefined  // leaveIdToExclude optionnel
            );

            // Vérifier que les dates ont été correctement converties
            const dateArgs = mockedCheckLeaveConflicts.mock.calls[0];
            expect(dateArgs[0].toISOString()).toBe(isoStartDate);
            expect(dateArgs[1].toISOString()).toBe(isoEndDate);
        });

        it('should handle invalid dates and set error without calling the service', async () => {
            jest.clearAllMocks();

            const { result } = renderHook(() => useLeave({
                userId: mockUserId
            }));

            const invalidDate = 'not-a-date';

            await act(async () => {
                await result.current.checkConflicts(invalidDate, '2024-10-05');
            });

            // Vérifier que le service n'a pas été appelé
            expect(mockedCheckLeaveConflicts).not.toHaveBeenCalled();

            // Vérifier que setError a été appelé
            expect(mockedSetError).toHaveBeenCalledWith(
                'conflicts',
                expect.objectContaining({
                    severity: 'warning'
                })
            );
        });

        it('should call checkLeaveConflicts service with Date objects and update state on success', async () => {
            const { result } = renderHook(() => useLeave({
                initialLeave: mockInitialLeave,
                userId: mockUserId
            }));

            mockedCheckLeaveConflicts.mockResolvedValueOnce(mockConflictResultEmpty);

            // Vérifier l'état initial
            expect(result.current.conflictCheckResult).toBeNull();
            expect(result.current.loading).toBe(false);

            // Capture la valeur de retour pour la vérifier
            let returnedResult: any = null;
            await act(async () => {
                returnedResult = await result.current.checkConflicts();
            });

            // Vérifier l'appel au service mocké
            expect(mockedCheckLeaveConflicts).toHaveBeenCalledWith(
                expect.any(Date), // Vérifier que c'est bien un objet Date
                expect.any(Date), // Vérifier que c'est bien un objet Date
                mockUserId,
                mockInitialLeave.id
            );

            // Vérifier les états après l'appel
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.conflictCheckResult).toEqual(mockConflictResultEmpty);
            expect(mockedSetError).not.toHaveBeenCalled(); // Pas d'erreur ou de conflit

            // Vérifier la valeur de retour
            expect(returnedResult).toEqual(mockConflictResultEmpty);
        });

        it('should call setError with warning when conflicts are present but not blocking', async () => {
            // Configurer le mock pour retourner un résultat avec conflits non bloquants
            mockedCheckLeaveConflicts.mockResolvedValueOnce(mockConflictResultWarning);

            const { result } = renderHook(() => useLeave({
                initialLeave: mockInitialLeave,
                userId: mockUserId
            }));

            let returnedResult: any = null;
            await act(async () => {
                returnedResult = await result.current.checkConflicts();
            });

            // Vérifier que setError a été appelé avec severity 'warning'
            expect(mockedSetError).toHaveBeenCalledWith(
                'conflicts',
                expect.objectContaining({
                    message: expect.stringContaining('Conflit détecté'),
                    severity: 'warning',
                    context: { conflicts: mockConflictResultWarning.conflicts }
                })
            );

            // Vérifier que conflictCheckResult a été mis à jour
            expect(result.current.conflictCheckResult).toEqual(mockConflictResultWarning);

            // Vérifier la valeur de retour
            expect(returnedResult).toEqual(mockConflictResultWarning);
        });

        it('should call setError with error severity when conflicts are blocking', async () => {
            // Configurer le mock pour retourner un résultat avec conflits bloquants
            mockedCheckLeaveConflicts.mockResolvedValueOnce(mockConflictResultBlocking);

            const { result } = renderHook(() => useLeave({
                initialLeave: mockInitialLeave,
                userId: mockUserId
            }));

            let returnedResult: any = null;
            await act(async () => {
                returnedResult = await result.current.checkConflicts();
            });

            // Vérifier que setError a été appelé avec severity 'error'
            expect(mockedSetError).toHaveBeenCalledWith(
                'conflicts',
                expect.objectContaining({
                    message: expect.stringContaining('Conflit bloquant'),
                    severity: 'error',
                    context: { conflicts: mockConflictResultBlocking.conflicts }
                })
            );

            // Vérifier que conflictCheckResult a été mis à jour
            expect(result.current.conflictCheckResult).toEqual(mockConflictResultBlocking);

            // Vérifier la valeur de retour
            expect(returnedResult).toEqual(mockConflictResultBlocking);
        });

        it('should set error state if checkLeaveConflicts service fails', async () => {
            const mockError = new Error('Conflict check failed');
            mockedCheckLeaveConflicts.mockRejectedValueOnce(mockError);

            const { result } = renderHook(() => useLeave({
                initialLeave: mockInitialLeave,
                userId: mockUserId
            }));

            let returnedResult: any = null;
            await act(async () => {
                returnedResult = await result.current.checkConflicts();
            });

            expect(mockedCheckLeaveConflicts).toHaveBeenCalledTimes(1);

            // Vérifier que loading est false à la fin
            expect(result.current.loading).toBe(false);

            // Vérifier que setError a été appelé avec les informations d'erreur
            expect(mockedSetError).toHaveBeenCalledWith(
                'conflicts',
                expect.objectContaining({
                    message: 'Conflict check failed',
                    severity: 'error'
                })
            );

            // Vérifier que conflictCheckResult est null
            expect(result.current.conflictCheckResult).toBeNull();

            // Vérifier que la fonction retourne null en cas d'erreur
            expect(returnedResult).toBeNull();
        });

        it('should work normally when userId is available from auth context', async () => {
            // Ce test vérifie que même sans userId explicite, le hook fonctionne grâce au contexte d'auth
            mockedCheckLeaveConflicts.mockResolvedValue(mockConflictResultEmpty);

            const { result } = renderHook(() => useLeave({
                initialLeave: mockInitialLeave,
                // Pas de userId ici, on dépend de useAuth
            }));

            let returnedResult: any = null;
            await act(async () => {
                returnedResult = await result.current.checkConflicts();
            });

            // Vérifier que le service A été appelé avec l'userId du contexte d'auth
            expect(mockedCheckLeaveConflicts).toHaveBeenCalledWith(
                expect.any(Date),
                expect.any(Date),
                'user123', // userId from auth context
                mockInitialLeave.id
            );

            // Vérifier que la fonction retourne le résultat du service
            expect(returnedResult).toBe(mockConflictResultEmpty);
        });

        test('should handle errors correctly', async () => {
            // Configurer une erreur à renvoyer
            mockedCheckLeaveConflicts.mockRejectedValueOnce(
                new Error('Conflict check failed')
            );

            const { result } = renderHook(() => useLeave({
                userId: mockUserId
            }));

            // Appel de la fonction
            await act(async () => {
                try {
                    await result.current.checkConflicts('2023-10-10', '2023-10-15');
                } catch (error) {
                    // L'erreur est gérée à l'intérieur de checkConflicts
                }
            });

            // Vérifier l'état d'erreur
            expect(mockedSetError).toHaveBeenCalledWith(
                'conflicts',
                expect.objectContaining({
                    message: 'Conflict check failed',
                    severity: 'error'
                })
            );
            // Vérifier que l'erreur locale est également définie (pour la compatibilité des tests)
            expect(result.current.error).toEqual(expect.objectContaining({
                message: 'Conflict check failed',
                severity: 'error'
            }));
        });
    });

    // --- Tests pour checkAllowance ---
    describe('checkAllowance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        it('should call checkLeaveAllowance service and update state on success', async () => {
            const { result } = renderHook(() => useLeave({
                initialLeave: mockInitialLeave, // contient type et countedDays
                userId: mockUserId
            }));

            // Vérifier l'état initial
            expect(result.current.allowanceCheckResult).toBeNull();

            await act(async () => {
                await result.current.checkAllowance();
            });

            // Vérifier l'appel au service mocké
            expect(mockedCheckLeaveAllowance).toHaveBeenCalledWith(
                mockUserId,
                mockInitialLeave.type,
                mockInitialLeave.countedDays
            );
            // Vérifier les états loading/error
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
            // Vérifier la mise à jour du résultat
            expect(result.current.allowanceCheckResult).toEqual(mockAllowanceResultOK);
        });

        it('should set error state if checkLeaveAllowance service fails', async () => {
            const mockError = new Error('Allowance check failed');
            mockedCheckLeaveAllowance.mockRejectedValueOnce(mockError);

            const { result } = renderHook(() => useLeave({
                initialLeave: mockInitialLeave,
                userId: mockUserId
            }));

            await act(async () => {
                try {
                    await result.current.checkAllowance();
                } catch (e) {
                    expect(e).toBe(mockError);
                }
            });

            expect(mockedCheckLeaveAllowance).toHaveBeenCalledTimes(1);
            expect(result.current.loading).toBe(false);
            // Modification pour vérifier le format ErrorDetails
            expect(result.current.error).toMatchObject({
                message: 'Allowance check failed',
                severity: 'error'
            });
            expect(result.current.allowanceCheckResult).toBeNull();
        });

        test('should handle errors correctly', async () => {
            // Configurer une erreur à renvoyer
            mockedCheckLeaveAllowance.mockRejectedValueOnce(
                new Error('Allowance check failed')
            );

            const { result } = renderHook(() => useLeave({
                userId: mockUserId,
                initialLeave: { ...mockInitialLeave, type: LeaveType.ANNUAL, countedDays: 5 }
            }));

            // Appel de la fonction
            await act(async () => {
                try {
                    await result.current.checkAllowance();
                } catch (error: any) {
                    expect(error.message).toBe('Allowance check failed');
                }
            });

            // Vérifier que l'erreur locale est définie (pour la compatibilité des tests)
            expect(result.current.error).toEqual(expect.objectContaining({
                message: 'Allowance check failed',
                severity: 'error'
            }));
        });

        it('should throw an error if required data (type) is missing', async () => {
            const { result } = renderHook(() => useLeave({
                initialLeave: { countedDays: 5 }, // Pas de type
                userId: mockUserId
            }));

            await act(async () => {
                await expect(result.current.checkAllowance()).rejects.toThrow(
                    'Informations manquantes pour vérifier les droits à congés'
                );
            });
            expect(mockedCheckLeaveAllowance).not.toHaveBeenCalled();
        });
        it('should throw an error if required data (countedDays) is missing', async () => {
            const { result } = renderHook(() => useLeave({
                initialLeave: { type: LeaveType.ANNUAL }, // Pas de countedDays
                userId: mockUserId
            }));

            await act(async () => {
                await expect(result.current.checkAllowance()).rejects.toThrow(
                    'Informations manquantes pour vérifier les droits à congés'
                );
            });
            expect(mockedCheckLeaveAllowance).not.toHaveBeenCalled();
        });
    });

    // --- Tests pour saveLeaveAsDraft ---
    describe('saveLeaveAsDraft', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        it('should call saveLeave service with DRAFT status and update state', async () => {
            const { result } = renderHook(() => useLeave({
                initialLeave: mockInitialLeave,
                userId: mockUserId
            }));
            const draftLeaveData = {
                ...mockInitialLeave,
                status: LeaveStatus.DRAFT,
                updatedAt: expect.any(Date), // updatedAt sera mis à jour
                createdAt: mockInitialLeave.createdAt // createdAt ne devrait pas changer si déjà existant
            };
            // Le mock de saveLeave retournera un congé avec un ID et les champs mis à jour
            const returnedSavedLeave = { ...draftLeaveData, id: 'saved-draft-id' };
            mockedSaveLeave.mockResolvedValueOnce(returnedSavedLeave);

            await act(async () => {
                await result.current.saveLeaveAsDraft();
            });

            // Vérifier l'appel à saveLeave (pas submitLeaveRequest)
            expect(mockedSaveLeave).toHaveBeenCalledWith(expect.objectContaining({
                ...mockInitialLeave,
                status: LeaveStatus.DRAFT,
                userId: mockUserId,
                updatedAt: expect.any(Date)
            }));
            expect(mockedSubmitLeaveRequest).not.toHaveBeenCalled();

            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
            // Vérifier que l'état interne `leave` est mis à jour avec le résultat du service
            expect(result.current.leave).toEqual(returnedSavedLeave);
        });

        it('should set error state if saveLeave service fails', async () => {
            const mockError = new Error('Save draft failed');
            mockedSaveLeave.mockRejectedValueOnce(mockError);

            const { result } = renderHook(() => useLeave({ initialLeave: mockInitialLeave, userId: mockUserId }));

            await act(async () => {
                try {
                    await result.current.saveLeaveAsDraft();
                } catch (e) {
                    expect(e).toBe(mockError);
                }
            });

            expect(mockedSaveLeave).toHaveBeenCalledTimes(1);
            expect(result.current.loading).toBe(false);
            // Modification pour vérifier le format ErrorDetails
            expect(result.current.error).toMatchObject({
                message: 'Save draft failed',
                severity: 'error'
            });
            // L'état `leave` ne devrait pas changer en cas d'erreur
            expect(result.current.leave).toEqual(mockInitialLeave);
        });

        it('should throw an error if leave state is null', async () => {
            const { result } = renderHook(() => useLeave({ userId: mockUserId })); // Pas d'initialLeave

            await act(async () => {
                await expect(result.current.saveLeaveAsDraft()).rejects.toThrow(
                    'Aucun congé à enregistrer'
                );
            });
            expect(mockedSaveLeave).not.toHaveBeenCalled();
        });
    });

    // --- Tests pour submitLeave ---
    describe('submitLeave', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        it('should call submitLeaveRequest service with PENDING status and update state', async () => {
            const { result } = renderHook(() => useLeave({
                initialLeave: mockInitialLeave,
                userId: mockUserId
            }));
            // Le mock retournera un congé avec le statut PENDING et un ID
            const returnedSubmittedLeave = { ...mockInitialLeave, id: 'submitted-id', status: LeaveStatus.PENDING, requestDate: expect.any(Date), updatedAt: expect.any(Date) };
            mockedSubmitLeaveRequest.mockResolvedValueOnce(returnedSubmittedLeave);

            await act(async () => {
                await result.current.submitLeave();
            });

            // Vérifier l'appel à submitLeaveRequest
            expect(mockedSubmitLeaveRequest).toHaveBeenCalledWith(expect.objectContaining({
                ...mockInitialLeave,
                status: LeaveStatus.PENDING,
                userId: mockUserId,
                requestDate: expect.any(Date), // requestDate est ajoutée
                updatedAt: expect.any(Date)   // updatedAt est mis à jour
            }));
            expect(mockedSaveLeave).not.toHaveBeenCalled(); // Ne doit pas appeler saveLeave directement

            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
            // Vérifier la mise à jour de l'état interne `leave`
            expect(result.current.leave).toEqual(returnedSubmittedLeave);
        });

        it('should set error state if submitLeaveRequest service fails', async () => {
            const mockError = new Error('Submit failed');
            mockedSubmitLeaveRequest.mockRejectedValueOnce(mockError);

            const { result } = renderHook(() => useLeave({ initialLeave: mockInitialLeave, userId: mockUserId }));

            await act(async () => {
                try {
                    await result.current.submitLeave();
                } catch (e) {
                    expect(e).toBe(mockError);
                }
            });

            expect(mockedSubmitLeaveRequest).toHaveBeenCalledTimes(1);
            expect(result.current.loading).toBe(false);
            // Modification pour vérifier le format ErrorDetails
            expect(result.current.error).toMatchObject({
                message: 'Submit failed',
                severity: 'error'
            });
            expect(result.current.leave).toEqual(mockInitialLeave); // État inchangé
        });

        it('should throw an error if required data (type) is missing', async () => {
            const { result } = renderHook(() => useLeave({
                initialLeave: { startDate: d(2024, 1, 1), endDate: d(2024, 1, 2) }, // Pas de type 
                userId: mockUserId
            }));

            await act(async () => {
                await expect(result.current.submitLeave()).rejects.toThrow(
                    'Informations manquantes (dates ou type de congé)'
                );
            });
            expect(mockedSubmitLeaveRequest).not.toHaveBeenCalled();
        });
    });

    // --- Tests pour approveLeaveRequest ---
    describe('approveLeaveRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        it('should call approveLeave service and update state on success', async () => {
            const { result } = renderHook(() => useLeave({
                initialLeave: mockInitialLeave, // Assure que leave.id existe
                userId: mockUserId
            }));
            const comment = 'Looks good';
            const returnedApprovedLeave = { ...mockInitialLeave, status: LeaveStatus.APPROVED };
            mockedApproveLeave.mockResolvedValueOnce(returnedApprovedLeave);

            await act(async () => {
                await result.current.approveLeaveRequest(comment);
            });

            expect(mockedApproveLeave).toHaveBeenCalledWith(mockInitialLeave.id, comment);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.leave).toEqual(returnedApprovedLeave);
        });

        it('should set error state if approveLeave service fails', async () => {
            const mockError = new Error('Approve failed');
            mockedApproveLeave.mockRejectedValueOnce(mockError);

            const { result } = renderHook(() => useLeave({ initialLeave: mockInitialLeave, userId: mockUserId }));

            await act(async () => {
                try {
                    await result.current.approveLeaveRequest();
                } catch (e) {
                    expect(e).toBe(mockError);
                }
            });

            expect(mockedApproveLeave).toHaveBeenCalledTimes(1);
            expect(result.current.loading).toBe(false);
            // Modification pour vérifier le format ErrorDetails
            expect(result.current.error).toMatchObject({
                message: 'Approve failed',
                severity: 'error'
            });
            expect(result.current.leave).toEqual(mockInitialLeave); // État inchangé
        });

        it('should throw an error if leave id is missing', async () => {
            const { result } = renderHook(() => useLeave({
                initialLeave: { type: LeaveType.ANNUAL }, // Pas d'ID
                userId: mockUserId
            }));

            await act(async () => {
                await expect(result.current.approveLeaveRequest()).rejects.toThrow(
                    'ID de congé manquant pour l\'approbation'
                );
            });
            expect(mockedApproveLeave).not.toHaveBeenCalled();
        });
    });

    // --- Tests pour rejectLeaveRequest ---
    describe('rejectLeaveRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        it('should call rejectLeave service and update state on success', async () => {
            const { result } = renderHook(() => useLeave({ initialLeave: mockInitialLeave, userId: mockUserId }));
            const comment = 'Reason for rejection';
            const returnedRejectedLeave = { ...mockInitialLeave, status: LeaveStatus.REJECTED };
            mockedRejectLeave.mockResolvedValueOnce(returnedRejectedLeave);

            await act(async () => {
                await result.current.rejectLeaveRequest(comment);
            });

            expect(mockedRejectLeave).toHaveBeenCalledWith(mockInitialLeave.id, comment);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.leave).toEqual(returnedRejectedLeave);
        });

        it('should set error state if rejectLeave service fails', async () => {
            const mockError = new Error('Reject failed');
            mockedRejectLeave.mockRejectedValueOnce(mockError);

            const { result } = renderHook(() => useLeave({ initialLeave: mockInitialLeave, userId: mockUserId }));

            await act(async () => {
                try {
                    await result.current.rejectLeaveRequest();
                } catch (e) {
                    expect(e).toBe(mockError);
                }
            });

            expect(mockedRejectLeave).toHaveBeenCalledTimes(1);
            expect(result.current.loading).toBe(false);
            // Modification pour vérifier le format ErrorDetails
            expect(result.current.error).toMatchObject({
                message: 'Reject failed',
                severity: 'error'
            });
            expect(result.current.leave).toEqual(mockInitialLeave);
        });

        it('should throw an error if leave id is missing', async () => {
            const { result } = renderHook(() => useLeave({ initialLeave: { type: LeaveType.ANNUAL }, userId: mockUserId }));

            await act(async () => {
                await expect(result.current.rejectLeaveRequest()).rejects.toThrow(
                    'ID de congé manquant pour le rejet'
                );
            });
            expect(mockedRejectLeave).not.toHaveBeenCalled();
        });
    });

    // --- Tests pour cancelLeaveRequest ---
    describe('cancelLeaveRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        it('should call cancelLeave service and update state on success', async () => {
            const { result } = renderHook(() => useLeave({ initialLeave: mockInitialLeave, userId: mockUserId }));
            const comment = 'User cancelled';
            const returnedCancelledLeave = { ...mockInitialLeave, status: LeaveStatus.CANCELLED };
            mockedCancelLeave.mockResolvedValueOnce(returnedCancelledLeave);

            await act(async () => {
                await result.current.cancelLeaveRequest(comment);
            });

            expect(mockedCancelLeave).toHaveBeenCalledWith(mockInitialLeave.id, comment);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.leave).toEqual(returnedCancelledLeave);
        });

        it('should set error state if cancelLeave service fails', async () => {
            const mockError = new Error('Cancel failed');
            mockedCancelLeave.mockRejectedValueOnce(mockError);

            const { result } = renderHook(() => useLeave({ initialLeave: mockInitialLeave, userId: mockUserId }));

            await act(async () => {
                try {
                    await result.current.cancelLeaveRequest();
                } catch (e) {
                    expect(e).toBe(mockError);
                }
            });

            expect(mockedCancelLeave).toHaveBeenCalledTimes(1);
            expect(result.current.loading).toBe(false);
            // Modification pour vérifier le format ErrorDetails
            expect(result.current.error).toMatchObject({
                message: 'Cancel failed',
                severity: 'error'
            });
            expect(result.current.leave).toEqual(mockInitialLeave);
        });

        it('should throw an error if leave id is missing', async () => {
            const { result } = renderHook(() => useLeave({ initialLeave: { type: LeaveType.ANNUAL }, userId: mockUserId }));

            await act(async () => {
                await expect(result.current.cancelLeaveRequest()).rejects.toThrow(
                    'ID de congé manquant pour l\'annulation'
                );
            });
            expect(mockedCancelLeave).not.toHaveBeenCalled();
        });
    });

    // --- Tests pour fetchUserLeaves ---
    describe('fetchUserLeaves', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        it('should call fetchLeaves service and update leaves state on success', async () => {
            const mockFetchedLeaves = [mockInitialLeave];
            mockedFetchLeaves.mockResolvedValueOnce(mockFetchedLeaves);

            const { result } = renderHook(() => useLeave({ userId: mockUserId }));

            expect(result.current.leaves).toEqual([]); // Initial state

            await act(async () => {
                await result.current.fetchUserLeaves();
            });

            expect(mockedFetchLeaves).toHaveBeenCalledWith({ userId: mockUserId }); // Default filter
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.leaves).toEqual(mockFetchedLeaves);
        });

        it('should call fetchLeaves service with provided filters', async () => {
            const filters = { status: LeaveStatus.APPROVED, type: LeaveType.SICK };
            const mockFilteredLeaves = [mockInitialLeave]; // Utiliser la même structure pour simplifier
            mockedFetchLeaves.mockResolvedValueOnce(mockFilteredLeaves);

            const { result } = renderHook(() => useLeave({ userId: mockUserId }));

            await act(async () => {
                await result.current.fetchUserLeaves(filters);
            });

            // Vérifie que les filtres fournis sont utilisés, en plus du userId par défaut du hook
            expect(mockedFetchLeaves).toHaveBeenCalledWith({ ...filters, userId: mockUserId });
            expect(result.current.leaves).toEqual(mockFilteredLeaves);
        });

        it('should set error state if fetchLeaves service fails', async () => {
            const mockError = new Error('Fetch leaves failed');
            mockedFetchLeaves.mockRejectedValueOnce(mockError);

            // Utiliser initialLeave pour éviter le chargement automatique au montage
            const { result } = renderHook(() => useLeave({ 
                userId: mockUserId, 
                initialLeave: mockInitialLeave 
            }));

            await act(async () => {
                try {
                    await result.current.fetchUserLeaves();
                } catch (e) {
                    expect(e).toBe(mockError);
                }
            });

            expect(mockedFetchLeaves).toHaveBeenCalledTimes(1);
            expect(result.current.loading).toBe(false);
            // Modification pour vérifier le format ErrorDetails
            expect(result.current.error).toMatchObject({
                message: 'Fetch leaves failed',
                severity: 'error'
            });
            expect(result.current.leaves).toEqual([]); // Liste réinitialisée après échec
        });
    });

    // --- Tests pour fetchLeaveDetails ---
    describe('fetchLeaveDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        it('should call fetchLeaveById service and update leave state on success', async () => {
            const specificLeaveId = 'leave-detailed';
            const mockDetailedLeave = { ...mockInitialLeave, id: specificLeaveId, reason: 'Specific detail' };
            mockedFetchLeaveById.mockResolvedValueOnce(mockDetailedLeave);

            // Initialiser sans initialLeave pour voir la mise à jour
            const { result } = renderHook(() => useLeave({ userId: mockUserId }));
            expect(result.current.leave).toBeNull();

            await act(async () => {
                await result.current.fetchLeaveDetails(specificLeaveId);
            });

            expect(mockedFetchLeaveById).toHaveBeenCalledWith(specificLeaveId);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.leave).toEqual(mockDetailedLeave);
        });

        it('should set error state if fetchLeaveById service fails', async () => {
            const specificLeaveId = 'leave-fail';
            const mockError = new Error('Fetch details failed');
            mockedFetchLeaveById.mockRejectedValueOnce(mockError);

            // Utiliser initialLeave pour éviter le chargement automatique au montage
            const { result } = renderHook(() => useLeave({ 
                userId: mockUserId, 
                initialLeave: mockInitialLeave 
            }));

            await act(async () => {
                try {
                    await result.current.fetchLeaveDetails(specificLeaveId);
                } catch (e) {
                    expect(e).toBe(mockError);
                }
            });

            expect(mockedFetchLeaveById).toHaveBeenCalledWith(specificLeaveId);
            expect(result.current.loading).toBe(false);
            // Modification pour vérifier le format ErrorDetails
            expect(result.current.error).toMatchObject({
                message: 'Fetch details failed',
                severity: 'error'
            });
            expect(result.current.leave).toBe(mockInitialLeave); // leave reste l'initial
        });
    });

    // TODO: Ajouter des tests pour les autres fonctions :
    // - fetchUserLeaves
    // - fetchLeaveDetails
    // Ces tests devront vérifier les appels aux mocks, les états loading/error, et les mises à jour de l'état.

}); 