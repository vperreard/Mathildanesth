import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VariationConfigPanel from '../VariationConfigPanel';
import { ConfigurationVariation } from '../../types/template';

// Mock pour les Date Pickers (qui nécessitent habituellement un contexte LocalizationProvider)
jest.mock('@mui/x-date-pickers/DatePicker', () => ({
    DatePicker: ({ label, onChange }: { label: string; onChange: (date: Date | null) => void }) => (
        <input
            data-testid={`datepicker-${label}`}
            onChange={(e) => onChange(new Date(e.target.value))}
        />
    ),
}));

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
    LocalizationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../AssignmentConfigPanel', () => ({
    __esModule: true,
    default: () => <div data-testid="mock-assignment-config">Configuration d'affectation mockée</div>,
}));

describe('VariationConfigPanel', () => {
    const mockVariation: ConfigurationVariation = {
        id: 'var-123',
        affectationId: 'aff-456',
        nom: 'Variation Test',
        priorite: 5,
        configuration: {
            id: 'conf-789',
            postes: [
                {
                    id: 'poste-1',
                    nom: 'Médecin',
                    quantite: 1,
                    status: 'REQUIS'
                }
            ]
        },
        typeVariation: 'ETE',
        actif: true,
        dateDebut: '2025-06-01',
        dateFin: '2025-09-30'
    };

    const mockAvailablePostes = ['Médecin', 'Infirmier', 'Aide-soignant'];
    const mockOnChange = jest.fn();
    const mockOnDelete = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly with initial variation data', () => {
        render(
            <VariationConfigPanel
                variation={mockVariation}
                onChange={mockOnChange}
                onDelete={mockOnDelete}
                availablePostes={mockAvailablePostes}
            />
        );

        screen.debug();

        expect(screen.getByText('Configuration de la variation')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Variation Test')).toBeInTheDocument();
        expect(screen.getByText('Période estivale')).toBeInTheDocument();
    });

    it('calls onChange when fields are modified', () => {
        render(
            <VariationConfigPanel
                variation={mockVariation}
                onChange={mockOnChange}
                onDelete={mockOnDelete}
                availablePostes={mockAvailablePostes}
            />
        );

        const nameInput = screen.getByLabelText('Nom de la variation *');
        fireEvent.change(nameInput, { target: { value: 'Variation Modifiée' } });

        expect(mockOnChange).toHaveBeenCalled();
        expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
            ...mockVariation,
            nom: 'Variation Modifiée'
        }));
    });

    it('calls onDelete when delete button is clicked', () => {
        render(
            <VariationConfigPanel
                variation={mockVariation}
                onChange={mockOnChange}
                onDelete={mockOnDelete}
                availablePostes={mockAvailablePostes}
            />
        );

        const deleteButton = screen.getByRole('button', { name: /supprimer/i });
        fireEvent.click(deleteButton);

        expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('handles toggle of recurring option', () => {
        render(
            <VariationConfigPanel
                variation={mockVariation}
                onChange={mockOnChange}
                onDelete={mockOnDelete}
                availablePostes={mockAvailablePostes}
            />
        );

        const recurringSwitch = screen.getByLabelText('Récurrent (se répète chaque année)');
        fireEvent.click(recurringSwitch);

        expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
            ...mockVariation,
            estRecurrent: !mockVariation.estRecurrent
        }));
    });

    it('shows error messages for required fields', () => {
        const invalidVariation = { ...mockVariation, nom: '' };
        render(
            <VariationConfigPanel
                variation={invalidVariation}
                onChange={mockOnChange}
                onDelete={mockOnDelete}
                availablePostes={mockAvailablePostes}
            />
        );

        const nameInput = screen.getByLabelText('Nom de la variation *');
        const saveButton = screen.getByRole('button', { name: /^Enregistrer$/i });
        fireEvent.click(saveButton);

        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('renders in loading state when isLoading is true', () => {
        render(
            <VariationConfigPanel
                variation={mockVariation}
                onChange={mockOnChange}
                onDelete={mockOnDelete}
                availablePostes={mockAvailablePostes}
                isLoading={true}
            />
        );

        const saveButton = screen.getByRole('button', { name: /^Enregistrer$/i });
        expect(saveButton).toBeDisabled();

        const deleteButton = screen.getByRole('button', { name: /supprimer la variation/i });
        expect(deleteButton).toBeDisabled();
    });
}); 