import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import UserProfile from '../UserProfile';

describe('UserProfile', () => {
    const mockUser = {
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        role: 'ADMIN_TOTAL'
    };

    const partialAdminUser = {
        id: 2,
        prenom: 'John',
        nom: 'Doe',
        role: 'ADMIN_PARTIEL'
    };

    const normalUser = {
        id: 3,
        prenom: 'John',
        nom: 'Doe',
        role: 'USER'
    };

    const mockOnLogout = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('affiche le nom et prénom de l\'utilisateur', () => {
        render(<UserProfile user={mockUser} onLogout={mockOnLogout} />);
        const userNameElements = screen.getAllByText('John Doe');
        expect(userNameElements.length).toBeGreaterThan(0);
        expect(userNameElements[0]).toBeInTheDocument();
    });

    it('affiche le menu déroulant au clic', () => {
        render(<UserProfile user={mockUser} onLogout={mockOnLogout} />);
        const profileButton = screen.getByRole('button', { name: new RegExp(`${mockUser.prenom}\\s+${mockUser.nom}`, 'i') });
        fireEvent.click(profileButton);
        expect(screen.getByText('Mon profil')).toBeInTheDocument();
    });

    it('appelle onLogout lors du clic sur le bouton de déconnexion', () => {
        render(<UserProfile user={mockUser} onLogout={mockOnLogout} />);
        const profileButton = screen.getByRole('button', { name: new RegExp(`${mockUser.prenom}\\s+${mockUser.nom}`, 'i') });
        fireEvent.click(profileButton); // Ouvrir d'abord le menu
        const logoutButton = screen.getByText('Déconnexion');
        fireEvent.click(logoutButton);
        expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });

    it('affiche le bon rôle utilisateur', () => {
        render(<UserProfile user={mockUser} onLogout={mockOnLogout} />);
        expect(screen.getByText('Administrateur')).toBeInTheDocument();
    });

    it('affiche le bon rôle pour un admin partiel', () => {
        render(<UserProfile user={partialAdminUser} onLogout={mockOnLogout} />);
        expect(screen.getByText('Admin Partiel')).toBeInTheDocument();
    });

    it('affiche le bon rôle pour un utilisateur normal', () => {
        render(<UserProfile user={normalUser} onLogout={mockOnLogout} />);
        expect(screen.getByText('Utilisateur')).toBeInTheDocument();
    });
}); 