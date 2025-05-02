import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../Header';
import { useAuth } from '@/hooks/useAuth';

// Mock des dépendances
jest.mock('@/hooks/useAuth', () => ({
    useAuth: jest.fn(),
}));

jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        nav: ({ children, ...props }: any) => <nav {...props}>{children}</nav>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock('../AdminRequestsBanner', () => ({
    __esModule: true,
    default: () => <div data-testid="admin-requests-banner" />,
}));

jest.mock('../navigation/Navigation', () => ({
    __esModule: true,
    default: ({ links, isAdmin }: any) => (
        <div data-testid="navigation">
            {links.map((link: any) => (
                <span key={link.href} data-testid={`nav-link-${link.href.replace('/', '')}`}>
                    {link.label}
                </span>
            ))}
            {isAdmin && <span data-testid="admin-indicator">Admin</span>}
        </div>
    ),
}));

jest.mock('../user/UserProfile', () => ({
    __esModule: true,
    default: ({ user, onLogout }: any) => (
        <div data-testid="user-profile">
            <span data-testid="user-name">{user.firstName} {user.lastName}</span>
            <button onClick={onLogout} data-testid="logout-button">
                Déconnexion
            </button>
        </div>
    ),
}));

jest.mock('../auth/LoginForm', () => ({
    LoginForm: ({ idPrefix }: any) => (
        <div data-testid="login-form" data-prefix={idPrefix}>
            Formulaire de connexion
        </div>
    ),
}));

describe('Header', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('affiche le logo correctement', () => {
        (useAuth as jest.Mock).mockReturnValue({
            user: null,
            isLoading: false,
            logout: jest.fn(),
        });

        render(<Header />);

        expect(screen.getByText('M')).toBeInTheDocument();
        expect(screen.getByText('Mathildanesth')).toBeInTheDocument();
        expect(screen.getByLabelText('Accueil Mathildanesth')).toBeInTheDocument();
    });

    test('affiche le formulaire de connexion quand l\'utilisateur n\'est pas connecté', () => {
        (useAuth as jest.Mock).mockReturnValue({
            user: null,
            isLoading: false,
            logout: jest.fn(),
        });

        render(<Header />);

        expect(screen.getByTestId('login-form')).toBeInTheDocument();
        expect(screen.getByTestId('login-form')).toHaveAttribute('data-prefix', 'header-');
    });

    test('affiche un indicateur de chargement pendant le chargement de l\'authentification', () => {
        (useAuth as jest.Mock).mockReturnValue({
            user: null,
            isLoading: true,
            logout: jest.fn(),
        });

        render(<Header />);

        expect(screen.getByLabelText('Chargement du profil')).toBeInTheDocument();
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('affiche le profil utilisateur quand l\'utilisateur est connecté', () => {
        const mockLogout = jest.fn();
        (useAuth as jest.Mock).mockReturnValue({
            user: { firstName: 'Jean', lastName: 'Dupont', role: 'USER' },
            isLoading: false,
            logout: mockLogout,
        });

        render(<Header />);

        expect(screen.getByTestId('user-profile')).toBeInTheDocument();
        expect(screen.getByTestId('user-name')).toHaveTextContent('Jean Dupont');
    });

    test('affiche la navigation quand l\'utilisateur est connecté', () => {
        (useAuth as jest.Mock).mockReturnValue({
            user: { firstName: 'Jean', lastName: 'Dupont', role: 'USER' },
            isLoading: false,
            logout: jest.fn(),
        });

        render(<Header />);

        expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });

    test('n\'affiche pas la navigation quand l\'utilisateur n\'est pas connecté', () => {
        (useAuth as jest.Mock).mockReturnValue({
            user: null,
            isLoading: false,
            logout: jest.fn(),
        });

        render(<Header />);

        expect(screen.queryByTestId('navigation')).not.toBeInTheDocument();
    });

    test('définit correctement les droits d\'admin pour un utilisateur avec rôle admin', () => {
        (useAuth as jest.Mock).mockReturnValue({
            user: { firstName: 'Admin', lastName: 'User', role: 'ADMIN_TOTAL' },
            isLoading: false,
            logout: jest.fn(),
        });

        render(<Header />);

        expect(screen.getByTestId('admin-indicator')).toBeInTheDocument();
    });

    test('n\'accorde pas de droits d\'admin aux utilisateurs standard', () => {
        (useAuth as jest.Mock).mockReturnValue({
            user: { firstName: 'Jean', lastName: 'Dupont', role: 'USER' },
            isLoading: false,
            logout: jest.fn(),
        });

        render(<Header />);

        expect(screen.queryByTestId('admin-indicator')).not.toBeInTheDocument();
    });
}); 