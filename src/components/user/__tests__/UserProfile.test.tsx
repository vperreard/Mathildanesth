import '@testing-library/jest-dom';
import { renderWithProviders as render, screen, fireEvent } from '@/test-utils/renderWithProviders';
import UserProfile from '../UserProfile';
import { ThemeProvider } from '@/context/ThemeContext';

// Mock du ThemeContext
jest.mock('@/context/ThemeContext', () => ({
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
    useTheme: () => ({
        theme: 'light',
        setTheme: jest.fn()
    })
}));

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

    const renderWithTheme = (ui: React.ReactElement) => {
        return render(<ThemeProvider>{ui}</ThemeProvider>);
    };

    it('affiche le nom et prénom de l\'utilisateur', () => {
        renderWithTheme(<UserProfile user={mockUser} onLogout={mockOnLogout} />);
        const userNameElements = screen.getAllByText('John Doe');
        expect(userNameElements.length).toBeGreaterThan(0);
        expect(userNameElements[0]).toBeInTheDocument();
    });

    it('affiche le menu déroulant au clic', () => {
        renderWithTheme(<UserProfile user={mockUser} onLogout={mockOnLogout} />);
        const profileButton = screen.getByRole('button', { name: new RegExp(`${mockUser.prenom}\\s+${mockUser.nom}`, 'i') });
        fireEvent.click(profileButton);
        expect(screen.getByText('Mon profil')).toBeInTheDocument();
    });

    it('appelle onLogout lors du clic sur le bouton de déconnexion', () => {
        renderWithTheme(<UserProfile user={mockUser} onLogout={mockOnLogout} />);
        const profileButton = screen.getByRole('button', { name: new RegExp(`${mockUser.prenom}\\s+${mockUser.nom}`, 'i') });
        fireEvent.click(profileButton); // Ouvrir d'abord le menu
        const logoutButton = screen.getByText('Déconnexion');
        fireEvent.click(logoutButton);
        expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });

    it('affiche le bon rôle utilisateur', () => {
        renderWithTheme(<UserProfile user={mockUser} onLogout={mockOnLogout} />);
        expect(screen.getByText('Administrateur')).toBeInTheDocument();
    });

    it('affiche le bon rôle pour un admin partiel', () => {
        renderWithTheme(<UserProfile user={partialAdminUser} onLogout={mockOnLogout} />);
        expect(screen.getByText('Admin Partiel')).toBeInTheDocument();
    });

    it('affiche le bon rôle pour un utilisateur normal', () => {
        renderWithTheme(<UserProfile user={normalUser} onLogout={mockOnLogout} />);
        expect(screen.getByText('Utilisateur')).toBeInTheDocument();
    });
}); 
