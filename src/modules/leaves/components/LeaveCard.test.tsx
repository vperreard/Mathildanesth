import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LeaveCard } from './LeaveCard';
import { LeaveStatus, LeaveType } from '../types/leave';

// Mock des fonctions de rappel
const mockOnEdit = jest.fn();
const mockOnCancel = jest.fn();
const mockOnView = jest.fn();

// Mock de framer-motion pour éviter des erreurs dans les tests
// jest.mock('framer-motion', () => {
//     const actual = jest.requireActual('framer-motion');
//     return {
//         ...actual,
//         motion: {
//             div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
//         },
//     };
// });

// Mock framer-motion sans utiliser l'opérateur rest dans la factory
jest.mock('framer-motion', () => {
    const actual = jest.requireActual('framer-motion');
    return {
        ...actual,
        motion: {
            ...actual.motion,
            div: jest.fn().mockImplementation(props => {
                const { children } = props;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const _filteredProps = { ...props };
                delete _filteredProps.children;
                return <div {..._filteredProps}>{children}</div>;
            }),
            // Ajouter d'autres éléments motion si nécessaire
        },
        AnimatePresence: jest.fn().mockImplementation(({ children }) => <>{children}</>),
    };
});

// Mock de la date du congé
const mockLeave = {
    id: '123',
    userId: 'user1',
    startDate: new Date('2023-10-01'),
    endDate: new Date('2023-10-05'),
    type: LeaveType.ANNUAL,
    status: LeaveStatus.PENDING,
    countedDays: 5,
    requestDate: new Date('2023-09-15'),
    createdAt: new Date('2023-09-15'),
    updatedAt: new Date('2023-09-15'),
    user: {
        id: 'user1',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@example.com'
    }
};

describe.skip('LeaveCard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly with pending status', () => {
        render(<LeaveCard leave={mockLeave} onEdit={mockOnEdit} onCancel={mockOnCancel} onView={mockOnView} />);

        // Vérifier l'affichage du statut
        expect(screen.getByText('En attente')).toBeInTheDocument();

        // Vérifier l'affichage du type de congé
        expect(screen.getByText(LeaveType.ANNUAL)).toBeInTheDocument();

        // Vérifier l'affichage des dates
        expect(screen.getByText(/Du .* au .*/)).toBeInTheDocument();

        // Vérifier l'affichage du nom de l'utilisateur
        expect(screen.getByText('Jean Dupont')).toBeInTheDocument();

        // Vérifier la présence des boutons d'action pour un congé en attente
        expect(screen.getByText('Modifier')).toBeInTheDocument();
        expect(screen.getByText('Annuler')).toBeInTheDocument();
    });

    it('does not show action buttons when status is not PENDING', () => {
        const approvedLeave = { ...mockLeave, status: LeaveStatus.APPROVED };
        render(<LeaveCard leave={approvedLeave} onEdit={mockOnEdit} onCancel={mockOnCancel} onView={mockOnView} />);

        // Vérifier que les boutons ne sont pas affichés
        expect(screen.queryByText('Modifier')).not.toBeInTheDocument();
        expect(screen.queryByText('Annuler')).not.toBeInTheDocument();
    });

    it('calls onEdit when edit button is clicked', () => {
        render(<LeaveCard leave={mockLeave} onEdit={mockOnEdit} onCancel={mockOnCancel} onView={mockOnView} />);

        // Cliquer sur le bouton de modification
        fireEvent.click(screen.getByText('Modifier'));

        // Vérifier que la fonction de rappel a été appelée avec le bon congé
        expect(mockOnEdit).toHaveBeenCalledWith(mockLeave);
    });

    it('calls onCancel when cancel button is clicked', () => {
        render(<LeaveCard leave={mockLeave} onEdit={mockOnEdit} onCancel={mockOnCancel} onView={mockOnView} />);

        // Cliquer sur le bouton d'annulation
        fireEvent.click(screen.getByText('Annuler'));

        // Vérifier que la fonction de rappel a été appelée avec le bon congé
        expect(mockOnCancel).toHaveBeenCalledWith(mockLeave);
    });

    it('calls onView when the card is clicked', () => {
        render(<LeaveCard leave={mockLeave} onEdit={mockOnEdit} onCancel={mockOnCancel} onView={mockOnView} />);

        // Récupérer la div principale (le conteneur de la carte) et cliquer dessus
        const card = screen.getByText('En attente').closest('div')?.parentElement?.parentElement;
        if (card) {
            fireEvent.click(card);

            // Vérifier que la fonction de rappel a été appelée avec le bon congé
            expect(mockOnView).toHaveBeenCalledWith(mockLeave);
        } else {
            fail('Could not find the card container element');
        }
    });

    it('shows expanded content when isExpanded is true and content exists', () => {
        const leaveWithDetails = {
            ...mockLeave,
            reason: 'Vacances en famille',
            comment: 'Voyage prévu depuis longtemps'
        };

        render(<LeaveCard
            leave={leaveWithDetails}
            onEdit={mockOnEdit}
            onCancel={mockOnCancel}
            onView={mockOnView}
            isExpanded={true}
        />);

        // Vérifier l'affichage des détails supplémentaires
        expect(screen.getByText('Motif')).toBeInTheDocument();
        expect(screen.getByText('Vacances en famille')).toBeInTheDocument();
        expect(screen.getByText('Commentaire')).toBeInTheDocument();
        expect(screen.getByText('Voyage prévu depuis longtemps')).toBeInTheDocument();
    });

    it('does not show action buttons when showActions is false', () => {
        render(<LeaveCard
            leave={mockLeave}
            onEdit={mockOnEdit}
            onCancel={mockOnCancel}
            onView={mockOnView}
            showActions={false}
        />);

        // Vérifier que les boutons ne sont pas affichés
        expect(screen.queryByText('Modifier')).not.toBeInTheDocument();
        expect(screen.queryByText('Annuler')).not.toBeInTheDocument();
    });
}); 