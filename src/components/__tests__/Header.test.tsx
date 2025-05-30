import React from 'react';
import { renderWithProviders as render, screen, fireEvent, waitFor } from '@/test-utils/renderWithProviders';
import '@testing-library/jest-dom';
import Header from '../Header';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { useAppearance } from '@/hooks/useAppearance';
import { usePathname } from 'next/navigation';

// Mocks des hooks
jest.mock('@/hooks/useAuth');
jest.mock('@/context/ThemeContext');
jest.mock('@/hooks/useAppearance');
jest.mock('next/navigation');

// Mock framer-motion
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons

// Mock des composants UI
jest.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
    DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-menu-content">{children}</div>,
    DropdownMenuItem: ({ children, ...props }: any) => <div data-testid="dropdown-menu-item" {...props}>{children}</div>,
    DropdownMenuLabel: ({ children }: any) => <div data-testid="dropdown-menu-label">{children}</div>,
    DropdownMenuSeparator: () => <div data-testid="dropdown-menu-separator" />,
    DropdownMenuTrigger: ({ children }: any) => <div data-testid="dropdown-menu-trigger">{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, ...props }: any) => (
        <button onClick={onClick} {...props} data-testid="button">
            {children}
        </button>
    ),
}));

// Mock des composants du Header
jest.mock('../AdminRequestsBanner', () => ({
    __esModule: true,
    default: () => <div data-testid="admin-requests-banner" />,
}));

jest.mock('../navigation/StreamlinedNavigation', () => ({
    StreamlinedNavigation: ({ userRole, navigation }: any) => (
        <div data-testid="streamlined-navigation">
            <div data-testid="user-role">{userRole}</div>
            {navigation && navigation.map((item: any, index: number) => (
                <div key={index} data-testid={`nav-item-${item.href}`}>{item.label}</div>
            ))}
        </div>
    ),
}));

jest.mock('../user/UserProfile', () => ({
    __esModule: true,
    default: ({ user, onLogout }: any) => (
        <div data-testid="user-profile">
            <div data-testid="user-name">{user?.prenom} {user?.nom}</div>
            <button onClick={onLogout} data-testid="logout-button">Logout</button>
        </div>
    ),
}));

jest.mock('../auth/HeaderLoginForm', () => ({
    HeaderLoginForm: () => <div data-testid="header-login-form">Login Form</div>,
}));

jest.mock('../ThemeSwitcher', () => ({
    ThemeSwitcher: () => <div data-testid="theme-switcher">Theme Switcher</div>,
}));

jest.mock('../notifications/NotificationBell', () => ({
    NotificationBell: () => <div data-testid="notification-bell">Notification Bell</div>,
}));

jest.mock('../UniversalSearch', () => ({
    UniversalSearch: () => <div data-testid="universal-search">Universal Search</div>,
}));

jest.mock('../navigation/MedicalBreadcrumbs', () => ({
    MedicalBreadcrumbs: () => <div data-testid="medical-breadcrumbs">Medical Breadcrumbs</div>,
}));

jest.mock('@/utils/navigationConfig', () => ({
    getNavigationByRole: jest.fn().mockReturnValue([
        { href: '/dashboard', label: 'Dashboard', icon: 'Activity' },
        { href: '/planning', label: 'Planning', icon: 'Calendar' },
    ]),
    hasAccess: jest.fn().mockReturnValue(true),
}));

describe('Header Component', () => {
    const mockUseAuth = useAuth as jest.Mock;
    const mockUseTheme = useTheme as jest.Mock;
    const mockUseAppearance = useAppearance as jest.Mock;
    const mockUsePathname = usePathname as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock par défaut pour les hooks
        mockUseAuth.mockReturnValue({
            user: null,
            isLoading: false,
            logout: jest.fn(),
        });
        
        mockUseTheme.mockReturnValue({
            theme: 'light',
            setTheme: jest.fn(),
        });
        
        mockUseAppearance.mockReturnValue({
            preferences: {
                compactMode: false,
                showBreadcrumbs: true,
            },
        });
        
        mockUsePathname.mockReturnValue('/dashboard');
    });

    it('should render correctly when authenticated', () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: 1,
                email: 'test@hospital.fr',
                role: 'USER',
                prenom: 'Test',
                nom: 'User'
            },
            isLoading: false,
            logout: jest.fn(),
        });

        render(<Header />);

        expect(screen.getByTestId('user-profile')).toBeInTheDocument();
        expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
        expect(screen.getByTestId('streamlined-navigation')).toBeInTheDocument();
    });

    it('should render login form when not authenticated', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            isLoading: false,
            logout: jest.fn(),
        });

        render(<Header />);

        expect(screen.getByTestId('header-login-form')).toBeInTheDocument();
    });

    it('affiche le menu Command Center pour les administrateurs', async () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: 1,
                email: 'admin@test.com',
                role: 'ADMIN_TOTAL',
                prenom: 'Admin',
                nom: 'Test'
            },
            isLoading: false,
            logout: jest.fn()
        });

        render(<Header />);

        // Vérifier que le bouton Admin est présent
        const adminButton = screen.getByTitle('Command Center - Configuration système');
        expect(adminButton).toBeInTheDocument();

        // Cliquer sur le bouton pour ouvrir le menu
        fireEvent.click(adminButton);

        await waitFor(() => {
            // Vérifier les sections du menu
            expect(screen.getByText('Configuration Médical')).toBeInTheDocument();
            expect(screen.getByText('Configuration Avancée')).toBeInTheDocument();
        });
    });

    it('ne affiche pas le menu Command Center pour les utilisateurs non-admin', () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: 1,
                email: 'user@test.com',
                role: 'USER',
                prenom: 'User',
                nom: 'Test'
            },
            isLoading: false,
            logout: jest.fn()
        });

        render(<Header />);

        // Vérifier que le bouton Admin n'est pas présent
        expect(screen.queryByTitle('Command Center - Configuration système')).not.toBeInTheDocument();
    });

    it('affiche le menu Command Center pour les admins partiels', () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: 1,
                email: 'admin@test.com',
                role: 'ADMIN_PARTIEL',
                prenom: 'Admin',
                nom: 'Test'
            },
            isLoading: false,
            logout: jest.fn()
        });

        render(<Header />);

        // Vérifier que le bouton Admin est présent pour admin partiel
        const adminButton = screen.getByTitle('Command Center - Configuration système');
        expect(adminButton).toBeInTheDocument();
    });

    it('organise le menu Command Center en sections logiques', async () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: 1,
                email: 'admin@test.com',
                role: 'ADMIN_TOTAL',
                prenom: 'Admin',
                nom: 'Test'
            },
            isLoading: false,
            logout: jest.fn()
        });

        render(<Header />);

        // Cliquer sur le bouton Admin
        const adminButton = screen.getByTitle('Command Center - Configuration système');
        fireEvent.click(adminButton);

        await waitFor(() => {
            // Vérifier les sections du menu
            expect(screen.getByText('Configuration Médical')).toBeInTheDocument();
            expect(screen.getByText('Configuration Avancée')).toBeInTheDocument();
        });
    });

    it('applique une opacité réduite pour une transparence minimale', () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: 1,
                email: 'admin@test.com',
                role: 'ADMIN_TOTAL',
                prenom: 'Admin',
                nom: 'Test'
            },
            isLoading: false,
            logout: jest.fn()
        });

        render(<Header />);

        const header = screen.getByRole('banner');

        // Vérifier que le header a une opacité réduite (98% au lieu de 95%)
        expect(header).toHaveClass('bg-white/98', 'dark:bg-slate-900/98');
    });

    it('should show admin menu with configuration options', async () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: 1,
                email: 'admin@test.com',
                role: 'ADMIN_TOTAL',
                prenom: 'Admin',
                nom: 'Test'
            },
            isLoading: false,
            logout: jest.fn()
        });

        render(<Header />);

        // Cliquer sur le bouton Command Center
        const commandCenterButton = screen.getByTitle('Command Center - Configuration système');
        fireEvent.click(commandCenterButton);

        // Vérifier que le menu administrateur est ouvert
        await waitFor(() => {
            expect(screen.getByTestId('dropdown-menu-content')).toBeInTheDocument();
        });
    });
});
