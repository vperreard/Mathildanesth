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

        // Vérifier que les champs affichent correctement les données initiales
        expect(screen.getByDisplayValue('Variation Test')).toBeInTheDocument();
        expect(screen.getByText('Période estivale')).toBeInTheDocument();
        expect(screen.getByTestId('mock-assignment-config')).toBeInTheDocument();
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

        // Modifier le nom de la variation
        const nameInput = screen.getByDisplayValue('Variation Test');
        fireEvent.change(nameInput, { target: { value: 'Variation Modifiée' } });

        // Vérifier que onChange a été appelé avec les données mises à jour
        expect(mockOnChange).toHaveBeenCalledTimes(1);
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

        // Trouver et cliquer sur le bouton de suppression
        const deleteButton = screen.getByTitle('Supprimer la variation');
        fireEvent.click(deleteButton);

        // Vérifier que onDelete a été appelé
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

        // Trouver et cliquer sur le switch "Récurrent"
        const recurringSwitch = screen.getByLabelText('Récurrent (se répète chaque année)');
        fireEvent.click(recurringSwitch);

        // Vérifier que onChange a été appelé avec estRecurrent mis à jour
        expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
            ...mockVariation,
            estRecurrent: !mockVariation.estRecurrent
        }));
    });

    it('shows error messages for required fields', () => {
        // Créer une variation sans nom (champ requis)
        const invalidVariation = {
            ...mockVariation,
            nom: ''
        };

        render(
            <VariationConfigPanel
                variation={invalidVariation}
                onChange={mockOnChange}
                onDelete={mockOnDelete}
                availablePostes={mockAvailablePostes}
            />
        );

        // Vérifier que le message d'erreur est affiché
        const nameInput = screen.getByLabelText('Nom de la variation *');
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

        // Vérifier que le bouton de suppression est désactivé en état de chargement
        const deleteButton = screen.getByTitle('Supprimer la variation');
        expect(deleteButton).toBeDisabled();
    });
}); 