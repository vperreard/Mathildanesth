import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test-utils/renderWithProviders';
import { LeaveRequestForm } from '../LeaveRequestForm';
import { useLeave } from '../../hooks/useLeave';
import { useConflictDetection } from '../../hooks/useConflictDetection';
import { format } from 'date-fns';
import { WorkSchedule, WorkFrequency, Weekday, WeekType } from '../../../profiles/types/workSchedule';
import { useLeaveValidation } from '../../hooks/useLeaveValidation';
import { useLeaveQuota } from '../../hooks/useLeaveQuota';

// Mock des hooks
jest.mock('../../hooks/useLeave');
jest.mock('../../hooks/useConflictDetection');
jest.mock('../../hooks/useLeaveValidation');
jest.mock('../../hooks/useLeaveQuota');
jest.mock('../../hooks/useRecurringLeaveValidation');
jest.mock('../../utils/recurringLeavesUtils');
jest.mock('@/hooks/useWorkSchedule');

// Mock de date-fns simplifié
jest.mock('date-fns', () => {
    const actual = jest.requireActual('date-fns');
    return {
        ...actual,
        format: jest.fn((date, formatStr) => {
            if (date instanceof Date) {
                return actual.format(date, formatStr);
            }
            return String(date);
        })
    };
});

// Données mock pour les tests
const userIdMock = 'user-123';
const userScheduleMock: WorkSchedule = {
    id: 'schedule-123',
    userId: 123,
    frequency: WorkFrequency.FULL_TIME,
    weekType: WeekType.BOTH,
    workingDays: [Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY],
    workingTimePercentage: 100,
    annualLeaveAllowance: 25,
    validFrom: new Date('2023-01-01'),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
};

describe('LeaveRequestForm Component', () => {
    // Mock des fonctions et des états retournés par les hooks
    const mockUpdateLeaveField = jest.fn();
    const mockSaveLeaveAsDraft = jest.fn().mockResolvedValue({ id: 'leave-123' });
    const mockSubmitLeave = jest.fn().mockResolvedValue({ id: 'leave-123' });
    const mockCalculateLeaveDuration = jest.fn().mockReturnValue(5);
    const mockCheckConflicts = jest.fn().mockResolvedValue({ hasBlockingConflicts: false, conflicts: [] });
    const mockGetBlockingConflicts = jest.fn().mockReturnValue([]);
    const mockGetWarningConflicts = jest.fn().mockReturnValue([]);
    const mockValidateLeaveRequest = jest.fn().mockReturnValue(true);
    const mockGetErrorMessage = jest.fn().mockReturnValue('');
    const mockHasError = jest.fn().mockReturnValue(false);
    const mockResetDateErrors = jest.fn();
    const mockSetContext = jest.fn();
    // Mocks pour useLeaveQuota
    const mockCheckQuota = jest.fn().mockResolvedValue({ isValid: true, message: '' });
    const mockRefreshQuotas = jest.fn().mockResolvedValue(undefined);
    const mockGetQuotaForType = jest.fn().mockReturnValue({ total: 10, used: 2, pending: 1, available: 7 });

    beforeEach(() => {
    jest.clearAllMocks();
        // Configuration des mocks pour useLeave
        (useLeave as jest.Mock).mockReturnValue({
            leave: {
                id: null,
                userId: userIdMock,
                type: '',
                startDate: null,
                endDate: null,
                status: 'DRAFT',
                reason: '',
                countedDays: 0
            },
            loading: false,
            error: null,
            updateLeaveField: mockUpdateLeaveField,
            saveLeaveAsDraft: mockSaveLeaveAsDraft,
            submitLeave: mockSubmitLeave,
            calculateLeaveDuration: mockCalculateLeaveDuration
        });

        // Configuration des mocks pour useConflictDetection
        (useConflictDetection as jest.Mock).mockReturnValue({
            conflicts: [],
            hasBlockingConflicts: false,
            loading: false,
            error: null,
            checkConflicts: mockCheckConflicts,
            getBlockingConflicts: mockGetBlockingConflicts,
            getWarningConflicts: mockGetWarningConflicts
        });

        // Configuration des mocks pour useLeaveValidation
        (useLeaveValidation as jest.Mock).mockReturnValue({
            validateLeaveRequest: mockValidateLeaveRequest,
            getErrorMessage: mockGetErrorMessage,
            getErrorType: jest.fn(),
            hasError: mockHasError,
            resetErrors: mockResetDateErrors,
            context: {},
            setContext: mockSetContext
        });

        // Configuration des mocks pour useRecurringLeaveValidation
        require('../../hooks/useRecurringLeaveValidation').useRecurringLeaveValidation = jest.fn().mockReturnValue({
            validateRecurringLeaveRequest: jest.fn().mockReturnValue(true),
            hasError: false,
            getErrorMessage: jest.fn().mockReturnValue(''),
            generationResult: null,
            isGenerating: false,
            generateRecurringLeaves: jest.fn()
        });

        // Configuration des mocks pour useWorkSchedule
        require('@/hooks/useWorkSchedule').useWorkSchedule = jest.fn().mockReturnValue({
            schedule: userScheduleMock,
            loading: false,
            error: null,
            getWorkingDaysCount: jest.fn().mockReturnValue(5),
            isWorkingDay: jest.fn().mockReturnValue(true)
        });

        // Configuration des mocks pour useLeaveQuota
        (useLeaveQuota as jest.Mock).mockReturnValue({
            loading: false,
            error: null,
            quotasByType: [mockGetQuotaForType()],
            totalBalance: 7,
            checkQuota: mockCheckQuota,
            refreshQuotas: mockRefreshQuotas,
            getQuotaForType: mockGetQuotaForType
        });

        // Réinitialiser les mocks
        jest.clearAllMocks();
    });

    it('should render form correctly', () => {
        renderWithProviders(
            <LeaveRequestForm
                userId={userIdMock}
                userSchedule={userScheduleMock}
            />
        );

        // Vérifier que le formulaire est rendu correctement
        expect(screen.getByText(/Nouvelle demande de congé/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Type de congé/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Date de début/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Date de fin/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Motif/i)).toBeInTheDocument();
    });

    it('should validate dates when date fields change', async () => {
        // Mock du hook useLeave avec une date de fin future
        const futureEndDate = new Date();
        futureEndDate.setDate(futureEndDate.getDate() + 10); // Mettre la date de fin 10 jours dans le futur

        (useLeave as jest.Mock).mockReturnValue({
            leave: {
                id: null,
                userId: userIdMock,
                type: 'ANNUAL',
                startDate: null,
                endDate: futureEndDate, // Utiliser la date future
                status: 'DRAFT',
                reason: '',
                countedDays: 0
            },
            loading: false,
            error: null,
            updateLeaveField: mockUpdateLeaveField,
            saveLeaveAsDraft: mockSaveLeaveAsDraft,
            submitLeave: mockSubmitLeave,
            calculateLeaveDuration: mockCalculateLeaveDuration
        });

        renderWithProviders(
            <LeaveRequestForm
                userId={userIdMock}
                userSchedule={userScheduleMock}
            />
        );

        const startDateInput = screen.getByLabelText(/Date de début/i);
        const today = new Date();
        const formattedDate = format(today, 'yyyy-MM-dd');

        // Modifier la date de début
        fireEvent.change(startDateInput, { target: { value: formattedDate } });

        // Vérifier que updateLeaveField a été appelé
        await waitFor(() => {
            expect(mockUpdateLeaveField).toHaveBeenCalledWith('startDate', expect.any(Date));
        });

        // Vérifier que checkConflicts a été appelé (car les deux dates sont valides et le type est défini)
        await waitFor(() => {
            expect(mockCheckConflicts).toHaveBeenCalled();
        });
    });

    it('should validate the leave request when both dates are set and form is submitted', async () => {
        // Mock minimal pour ce test - on veut juste voir si submitLeave est appelé
        const specificMockSubmitLeave = jest.fn().mockResolvedValue({ id: 'submitted-leave' });
        (useLeave as jest.Mock).mockReturnValue({
            leave: {
                id: null,
                userId: userIdMock,
                type: 'ANNUAL', // Type défini
                startDate: new Date(2023, 5, 1), // Date définie
                endDate: new Date(2023, 5, 5), // Date définie
                status: 'DRAFT',
                reason: '',
                countedDays: 5
            },
            loading: false,
            error: null,
            updateLeaveField: jest.fn(), // Mock simple
            saveLeaveAsDraft: jest.fn(), // Mock simple
            submitLeave: specificMockSubmitLeave, // Notre cible
            calculateLeaveDuration: jest.fn().mockReturnValue(5) // Mock simple
        });
        // Assurer que la validation et les conflits passent
        mockValidateLeaveRequest.mockReturnValue(true);
        mockCheckConflicts.mockResolvedValue({ hasBlockingConflicts: false, conflicts: [] });

        // S'assurer que le hook de quota est aussi simple
        (useLeaveQuota as jest.Mock).mockReturnValue({
            loading: false,
            error: null,
            quotasByType: [{ type: 'ANNUAL', total: 10, used: 2, pending: 1, available: 7 }],
            totalBalance: 7,
            checkQuota: jest.fn().mockResolvedValue({ isValid: true, message: '' }),
            refreshQuotas: jest.fn().mockResolvedValue(undefined),
            getQuotaForType: jest.fn().mockReturnValue({ total: 10, used: 2, pending: 1, available: 7 })
        });

        renderWithProviders(
            <LeaveRequestForm
                userId={userIdMock}
                userSchedule={userScheduleMock}
            />
        );

        // ----> MODIFICATION: Utiliser fireEvent.click sur le bouton Soumettre
        const submitButton = screen.getByRole('button', { name: /Soumettre la demande/i });
        fireEvent.click(submitButton);
        // <---- FIN MODIFICATION

        // Attendre la fin des mises à jour
        await waitFor(() => { });

        // Vérifier UNIQUEMENT si submitLeave a été appelé
        expect(specificMockSubmitLeave).toHaveBeenCalled();
    });

    it('should display field error messages when validation fails on submit', async () => {
        // Surcharger le mock useLeaveValidation pour simuler une erreur de date
        (useLeaveValidation as jest.Mock).mockReturnValueOnce({
            validateLeaveRequest: jest.fn().mockReturnValue(false), // <- Retourne false
            getErrorMessage: jest.fn((field) => field === `leave_start_${userIdMock}` ? 'La date de début doit être dans le futur' : ''), // <- Retourne le message d'erreur
            getErrorType: jest.fn(),
            hasError: jest.fn((field) => field === `leave_start_${userIdMock}`), // <- Indique qu'il y a une erreur sur startDate
            resetErrors: jest.fn(),
            context: {},
            setContext: jest.fn()
        });
        // Garder le mock de useLeave simple
        (useLeave as jest.Mock).mockReturnValue({
            leave: { startDate: null, endDate: null, type: 'ANNUAL' }, // Fournir un type initial
            updateLeaveField: jest.fn(),
            saveLeaveAsDraft: jest.fn(),
            submitLeave: mockSubmitLeave, // Utiliser le mock global
            calculateLeaveDuration: jest.fn()
        });

        renderWithProviders(
            <LeaveRequestForm
                userId={userIdMock}
                userSchedule={userScheduleMock}
            />
        );

        // Entrer des dates invalides (date de début passée)
        fireEvent.change(screen.getByLabelText(/Date de début/i), { target: { value: '2020-01-01' } });
        fireEvent.change(screen.getByLabelText(/Date de fin/i), { target: { value: '2020-01-05' } });

        // Soumettre le formulaire
        fireEvent.click(screen.getByRole('button', { name: /Soumettre/i }));

        // Vérifier que le message d'erreur est affiché (prendre le premier s'il y en a plusieurs)
        const errorMessages = await screen.findAllByText('La date de début doit être dans le futur');
        expect(errorMessages[0]).toBeInTheDocument();

        // Vérifier que submitLeave N'A PAS été appelé car la validation a échoué
        expect(mockSubmitLeave).not.toHaveBeenCalled();
    });
}); 