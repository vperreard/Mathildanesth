import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useAuth } from '@/context/AuthContext';
import Header from './Header';

// Mock des dépendances externes
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}));

jest.mock('next/link', () => {
    return ({ children, href }) => {
        return <a href={href}>{children}</a>;
    };
});

jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
        nav: ({ children, ...props }) => <nav {...props}>{children}</nav>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
}));

jest.mock('@/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('./AdminRequestsBanner', () => {
    return function DummyAdminRequestsBanner() {
        return <div data-testid="admin-requests-banner">Admin Requests Banner</div>;
    };
});

describe('Header Component', () => {
    // Configuration avant chaque test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('affiche le logo correctement', () => {
        useAuth.mockReturnValue({
            user: null,
            isLoading: false,
            login: jest.fn(),
            logout: jest.fn(),
        });

        render(<Header />);
        expect(screen.getByText('Mathildanesth')).toBeInTheDocument();
        expect(screen.getByText('M')).toBeInTheDocument();
    });

    test('affiche le formulaire de connexion quand non connecté', () => {
        useAuth.mockReturnValue({
            user: null,
            isLoading: false,
            login: jest.fn(),
            logout: jest.fn(),
        });

        render(<Header />);
        expect(screen.getByLabelText('Login')).toBeInTheDocument();
        expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
        expect(screen.getByLabelText('Se connecter')).toBeInTheDocument();
    });

    test('affiche le profil utilisateur quand connecté', () => {
        useAuth.mockReturnValue({
            user: { prenom: 'Jean', nom: 'Dupont', role: 'USER' },
            isLoading: false,
            login: jest.fn(),
            logout: jest.fn(),
        });

        render(<Header />);
        expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
        expect(screen.getByText('JD')).toBeInTheDocument();
    });

    test('gère la connexion avec succès', async () => {
        const loginMock = jest.fn().mockResolvedValue(undefined);

        useAuth.mockReturnValue({
            user: null,
            isLoading: false,
            login: loginMock,
            logout: jest.fn(),
        });

        render(<Header />);

        fireEvent.change(screen.getByLabelText('Login'), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'password123' } });
        fireEvent.click(screen.getByLabelText('Se connecter'));

        await waitFor(() => {
            expect(loginMock).toHaveBeenCalledWith({ login: 'testuser', password: 'password123' });
        });
    });

    test('gère l\'erreur de connexion', async () => {
        const loginError = new Error('Identifiants incorrects');
        const loginMock = jest.fn().mockRejectedValue(loginError);

        useAuth.mockReturnValue({
            user: null,
            isLoading: false,
            login: loginMock,
            logout: jest.fn(),
        });

        render(<Header />);

        fireEvent.change(screen.getByLabelText('Login'), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'wrongpassword' } });
        fireEvent.click(screen.getByLabelText('Se connecter'));

        await waitFor(() => {
            expect(screen.getByText('Identifiants incorrects')).toBeInTheDocument();
        });
    });

    test('affiche la navigation pour utilisateur connecté', () => {
        useAuth.mockReturnValue({
            user: { prenom: 'Jean', nom: 'Dupont', role: 'USER' },
            isLoading: false,
            login: jest.fn(),
            logout: jest.fn(),
        });

        render(<Header />);

        expect(screen.getByText('Accueil')).toBeInTheDocument();
        expect(screen.getByText('Planning')).toBeInTheDocument();
        expect(screen.getByText('Calendrier')).toBeInTheDocument();
        expect(screen.getByText('Congés')).toBeInTheDocument();
        expect(screen.getByText('Statistiques')).toBeInTheDocument();
        expect(screen.queryByText('Paramètres')).not.toBeInTheDocument(); // Pas visible pour un USER
    });

    test('affiche l\'option Paramètres pour admin', () => {
        useAuth.mockReturnValue({
            user: { prenom: 'Admin', nom: 'User', role: 'ADMIN_TOTAL' },
            isLoading: false,
            login: jest.fn(),
            logout: jest.fn(),
        });

        render(<Header />);

        expect(screen.getByText('Paramètres')).toBeInTheDocument();
    });

    test('affiche la bannière admin pour les administrateurs', () => {
        useAuth.mockReturnValue({
            user: { prenom: 'Admin', nom: 'User', role: 'ADMIN_TOTAL' },
            isLoading: false,
            login: jest.fn(),
            logout: jest.fn(),
        });

        render(<Header />);

        expect(screen.getByTestId('admin-requests-banner')).toBeInTheDocument();
    });

    test('n\'affiche pas la bannière admin pour les utilisateurs standards', () => {
        useAuth.mockReturnValue({
            user: { prenom: 'Jean', nom: 'Dupont', role: 'USER' },
            isLoading: false,
            login: jest.fn(),
            logout: jest.fn(),
        });

        render(<Header />);

        expect(screen.queryByTestId('admin-requests-banner')).not.toBeInTheDocument();
    });

    test('affiche l\'indicateur de chargement', () => {
        useAuth.mockReturnValue({
            user: null,
            isLoading: true,
            login: jest.fn(),
            logout: jest.fn(),
        });

        render(<Header />);

        expect(screen.getByClassName('animate-pulse')).toBeInTheDocument();
    });

    test('bascule le menu mobile à l\'aide du bouton', () => {
        useAuth.mockReturnValue({
            user: { prenom: 'Jean', nom: 'Dupont', role: 'USER' },
            isLoading: false,
            login: jest.fn(),
            logout: jest.fn(),
        });

        render(<Header />);

        // Le menu mobile est fermé initialement
        expect(screen.queryByRole('navigation', { hidden: true })).not.toBeVisible();

        // Cliquer sur le bouton du menu
        fireEvent.click(screen.getByRole('button', { name: /menu/i }));

        // Le menu mobile est maintenant visible
        expect(screen.getByRole('navigation')).toBeVisible();

        // Cliquer à nouveau sur le bouton du menu
        fireEvent.click(screen.getByRole('button', { name: /fermer/i }));

        // Le menu est à nouveau fermé
        expect(screen.queryByRole('navigation', { hidden: true })).not.toBeVisible();
    });
}); 