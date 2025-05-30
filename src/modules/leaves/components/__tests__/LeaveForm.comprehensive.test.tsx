/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaveForm } from '../LeaveForm';
import { LeaveType, LeaveStatus } from '../../types/leave';

// Mock dependencies
jest.mock('../../hooks/useConflictDetection', () => ({
  useConflictDetection: jest.fn(() => ({
    conflicts: [],
    hasBlockingConflicts: false,
    loading: false,
    error: null,
    checkConflicts: jest.fn(),
    validateDates: jest.fn(() => true),
    resetConflicts: jest.fn(),
  })),
}));

jest.mock('../../services/leaveService', () => ({
  submitLeaveRequest: jest.fn(),
  calculateLeaveDays: jest.fn(() => 5),
}));

jest.mock('../../../../hooks/useDateValidation', () => ({
  useDateValidation: jest.fn(() => ({
    validateDate: jest.fn(() => true),
    validateDateRange: jest.fn(() => true),
    hasError: jest.fn(() => false),
    getErrorMessage: jest.fn(() => null),
    resetErrors: jest.fn(),
  })),
}));

// Mock fetch to provide leave types
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([
      { id: 'annual', code: 'ANNUAL', label: 'Congé annuel' },
      { id: 'sick', code: 'SICK', label: 'Maladie' },
      { id: 'training', code: 'TRAINING', label: 'Formation' },
    ])
  })
) as jest.Mock;

const mockProps = {
  userId: 123, // Should be number according to component interface
  onSuccess: jest.fn(),
};

describe('LeaveForm Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form fields correctly', () => {
    render(<LeaveForm {...mockProps} />);

    expect(screen.getByLabelText(/Type de congé/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date de début/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date de fin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Motif/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Soumettre/i })).toBeInTheDocument();
    // No cancel button in this component
  });

  it('should handle form submission with valid data', async () => {
    const user = userEvent.setup();
    render(<LeaveForm {...mockProps} />);

    // Wait for leave types to load
    await waitFor(() => {
      expect(screen.getByText('Congé annuel')).toBeInTheDocument();
    });

    // Fill form fields
    await user.selectOptions(screen.getByLabelText(/Type de congé/i), 'ANNUAL');
    await user.type(screen.getByLabelText(/Date de début/i), '2024-08-19');
    await user.type(screen.getByLabelText(/Date de fin/i), '2024-08-23');
    await user.type(screen.getByLabelText(/Motif/i), 'Vacances d\'été');

    // Submit form
    await user.click(screen.getByRole('button', { name: /Soumettre/i }));

    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('should display validation errors for invalid dates', async () => {
    const user = userEvent.setup();
    
    // Mock date validation to return false
    const { useDateValidation } = require('../../../../hooks/useDateValidation');
    useDateValidation.mockReturnValue({
      validateDate: jest.fn(() => false),
      validateDateRange: jest.fn(() => false),
      hasError: jest.fn(() => true),
      getErrorMessage: jest.fn(() => 'Date invalide'),
      resetErrors: jest.fn(),
    });

    render(<LeaveForm {...mockProps} />);

    await user.type(screen.getByLabelText(/Date de début/i), '2020-01-01');
    await user.type(screen.getByLabelText(/Date de fin/i), '2020-01-05');

    await waitFor(() => {
      expect(screen.getByText('Date invalide')).toBeInTheDocument();
    });
  });

  it('should display conflict warnings', async () => {
    const user = userEvent.setup();
    
    // Mock conflict detection with conflicts
    const { useConflictDetection } = require('../../hooks/useConflictDetection');
    useConflictDetection.mockReturnValue({
      conflicts: [
        {
          id: 'conflict-1',
          type: 'USER_LEAVE_OVERLAP',
          severity: 'AVERTISSEMENT',
          description: 'Chevauchement avec un autre congé',
        },
      ],
      hasBlockingConflicts: false,
      loading: false,
      error: null,
      checkConflicts: jest.fn(),
      validateDates: jest.fn(() => true),
      resetConflicts: jest.fn(),
    });

    render(<LeaveForm {...mockProps} />);

    await user.type(screen.getByLabelText(/Date de début/i), '2024-08-19');
    await user.type(screen.getByLabelText(/Date de fin/i), '2024-08-23');

    await waitFor(() => {
      expect(screen.getByText(/Chevauchement avec un autre congé/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button when there are blocking conflicts', async () => {
    const user = userEvent.setup();
    
    // Mock conflict detection with blocking conflicts
    const { useConflictDetection } = require('../../hooks/useConflictDetection');
    useConflictDetection.mockReturnValue({
      conflicts: [
        {
          id: 'conflict-1',
          type: 'USER_LEAVE_OVERLAP',
          severity: 'BLOQUANT',
          description: 'Conflit bloquant',
        },
      ],
      hasBlockingConflicts: true,
      loading: false,
      error: null,
      checkConflicts: jest.fn(),
      validateDates: jest.fn(() => true),
      resetConflicts: jest.fn(),
    });

    render(<LeaveForm {...mockProps} />);

    await user.type(screen.getByLabelText(/Date de début/i), '2024-08-19');
    await user.type(screen.getByLabelText(/Date de fin/i), '2024-08-23');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Soumettre/i })).toBeDisabled();
    });
  });

  // This component doesn't support initialData prop for editing

  it('should show loading state', () => {
    render(<LeaveForm {...mockProps} />);

    // The component shows loading states for leave types internally
    expect(screen.getByText(/Chargement.../i)).toBeInTheDocument();
  });

  it('should calculate leave days automatically', async () => {
    const user = userEvent.setup();
    const { calculateLeaveDays } = require('../../services/leaveService');
    calculateLeaveDays.mockReturnValue(3);

    render(<LeaveForm {...mockProps} />);

    await user.type(screen.getByLabelText(/Date de début/i), '2024-08-19');
    await user.type(screen.getByLabelText(/Date de fin/i), '2024-08-21');

    await waitFor(() => {
      expect(screen.getByText(/3 jours/i)).toBeInTheDocument();
    });
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<LeaveForm {...mockProps} />);

    // Try to submit without filling required fields
    await user.click(screen.getByRole('button', { name: /Soumettre/i }));

    await waitFor(() => {
      expect(screen.getByText(/Veuillez sélectionner un type de congé/i)).toBeInTheDocument();
      expect(screen.getByText(/Veuillez sélectionner une date de début/i)).toBeInTheDocument();
      expect(screen.getByText(/Veuillez sélectionner une date de fin/i)).toBeInTheDocument();
    });

    expect(mockProps.onSubmit).not.toHaveBeenCalled();
  });

  it('should handle leave type change', async () => {
    const user = userEvent.setup();
    render(<LeaveForm {...mockProps} />);

    await user.selectOptions(screen.getByLabelText(/Type de congé/i), LeaveType.SICK);

    expect(screen.getByDisplayValue(LeaveType.SICK)).toBeInTheDocument();
  });

  it('should handle date range validation', async () => {
    const user = userEvent.setup();
    render(<LeaveForm {...mockProps} />);

    // Enter end date before start date
    await user.type(screen.getByLabelText(/Date de début/i), '2024-08-23');
    await user.type(screen.getByLabelText(/Date de fin/i), '2024-08-19');

    await waitFor(() => {
      expect(screen.getByText(/La date de fin doit être postérieure à la date de début/i)).toBeInTheDocument();
    });
  });

  it('should reset conflicts when dates change', async () => {
    const user = userEvent.setup();
    const { useConflictDetection } = require('../../hooks/useConflictDetection');
    const mockResetConflicts = jest.fn();
    
    useConflictDetection.mockReturnValue({
      conflicts: [],
      hasBlockingConflicts: false,
      loading: false,
      error: null,
      checkConflicts: jest.fn(),
      validateDates: jest.fn(() => true),
      resetConflicts: mockResetConflicts,
    });

    render(<LeaveForm {...mockProps} />);

    await user.type(screen.getByLabelText(/Date de début/i), '2024-08-19');

    await waitFor(() => {
      expect(mockResetConflicts).toHaveBeenCalled();
    });
  });
});