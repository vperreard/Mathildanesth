import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LeaveRequestForm } from './LeaveRequestForm';
import { useLeave } from '../hooks/useLeave';
import { useConflictDetection } from '../hooks/useConflictDetection';
import { useDateValidation } from '../../../hooks/useDateValidation';
import { format } from 'date-fns';
import { WorkSchedule, WorkFrequency, Weekday } from '../../profiles/types/workSchedule';

// Mock des hooks
jest.mock('../hooks/useLeave');
jest.mock('../hooks/useConflictDetection');
jest.mock('../../../hooks/useDateValidation');

// Données mock pour les tests
const userIdMock = 'user-123';
const userScheduleMock: WorkSchedule = {
    id: 'schedule-123',
    userId: 'user-123',
    frequency: WorkFrequency.FULL_TIME,
    workingDays: [Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY],
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
    const mockValidateDate = jest.fn().mockReturnValue(true);
    const mockValidateDateRange = jest.fn().mockReturnValue(true);
    const mockGetErrorMessage = jest.fn().mockReturnValue('');
    const mockHasError = jest.fn().mockReturnValue(false);
    const mockResetDateErrors = jest.fn();

    beforeEach(() => {
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

        // Configuration des mocks pour useDateValidation
        (useDateValidation as jest.Mock).mockReturnValue({
            validateDate: mockValidateDate,
            validateDateRange: mockValidateDateRange,
            getErrorMessage: mockGetErrorMessage,
            hasError: mockHasError,
            resetErrors: mockResetDateErrors
        });

        // Réinitialiser les mocks
        jest.clearAllMocks();
    });

    it('should render form correctly', () => {
        render(
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

    it('should call validateDate when date fields change', async () => {
        render(
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

        // Vérifier que validateDate a été appelé
        await waitFor(() => {
            expect(mockValidateDate).toHaveBeenCalled();
            expect(mockUpdateLeaveField).toHaveBeenCalledWith('startDate', expect.any(Date));
        });
    });

    it('should call validateDateRange when both dates are set', async () => {
        // Mock du hook useLeave avec des dates déjà définies
        (useLeave as jest.Mock).mockReturnValue({
            leave: {
                id: null,
                userId: userIdMock,
                type: 'ANNUAL',
                startDate: new Date(2023, 5, 1),
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

        render(
            <LeaveRequestForm
                userId={userIdMock}
                userSchedule={userScheduleMock}
            />
        );

        const endDateInput = screen.getByLabelText(/Date de fin/i);
        const endDate = new Date(2023, 5, 5);
        const formattedEndDate = format(endDate, 'yyyy-MM-dd');

        // Modifier la date de fin
        fireEvent.change(endDateInput, { target: { value: formattedEndDate } });

        // Vérifier que validateDateRange a été appelé
        await waitFor(() => {
            expect(mockValidateDateRange).toHaveBeenCalled();
        });
    });

    it('should check conflicts when both dates are set', async () => {
        // Mock du hook useLeave avec des dates déjà définies
        (useLeave as jest.Mock).mockReturnValue({
            leave: {
                id: null,
                userId: userIdMock,
                type: 'ANNUAL',
                startDate: new Date(2023, 5, 1),
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

        render(
            <LeaveRequestForm
                userId={userIdMock}
                userSchedule={userScheduleMock}
            />
        );

        const endDateInput = screen.getByLabelText(/Date de fin/i);
        const endDate = new Date(2023, 5, 5);
        const formattedEndDate = format(endDate, 'yyyy-MM-dd');

        // Modifier la date de fin
        fireEvent.change(endDateInput, { target: { value: formattedEndDate } });

        // Vérifier que checkConflicts a été appelé
        await waitFor(() => {
            expect(mockCheckConflicts).toHaveBeenCalled();
        });
    });

    it('should display field error messages when validation fails', async () => {
        // Simuler une erreur de validation pour la date de début
        mockHasError.mockImplementation((field) => field === 'startDate');
        mockGetErrorMessage.mockImplementation((field) => {
            if (field === 'startDate') return 'La date de début doit être dans le futur';
            return '';
        });

        // Mock du hook useLeave avec une date de début invalide
        (useLeave as jest.Mock).mockReturnValue({
            leave: {
                id: null,
                userId: userIdMock,
                type: 'ANNUAL',
                startDate: new Date(2020, 0, 1), // Date dans le passé
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

        render(
            <LeaveRequestForm
                userId={userIdMock}
                userSchedule={userScheduleMock}
            />
        );

        // Vérifier la soumission du formulaire
        const submitButton = screen.getByText(/Soumettre la demande/i);
        fireEvent.click(submitButton);

        // Vérifier que le message d'erreur est affiché
        await waitFor(() => {
            expect(mockValidateDate).toHaveBeenCalled();
            expect(mockResetDateErrors).toHaveBeenCalled();
            expect(screen.getByText(/La date de début doit être dans le futur/i)).toBeInTheDocument();
        });
    });
}); 