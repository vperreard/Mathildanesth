import React from 'react';
import { renderWithProviders as render, screen, fireEvent } from '@/test-utils/renderWithProviders';
import { ThemeSwitcher } from '../ThemeSwitcher';
import { useTheme } from '@/context/ThemeContext';

// Mock du contexte de thème
jest.mock('@/context/ThemeContext');
const mockUseTheme = useTheme as jest.Mock;

// Mock Lucide icons
        <svg data-testid="sun-icon" className={className}>
            <circle />
        </svg>
    ),
    Moon: ({ className }: { className: string }) => (
        <svg data-testid="moon-icon" className={className}>
            <path />
        </svg>
    ),
}));

// Mock Button component
jest.mock('@/components/ui/button', () => ({
    __esModule: true,
    default: ({ children, onClick, className, ...props }: any) => (
        <button onClick={onClick} className={className} {...props}>
            {children}
        </button>
    ),
}));

describe('ThemeSwitcher', () => {
    const mockSetTheme = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('affiche une icône de lune avec la bonne taille en mode light', () => {
        mockUseTheme.mockReturnValue({
            theme: 'light',
            setTheme: mockSetTheme
        });

        render(<ThemeSwitcher />);

        const button = screen.getByRole('button', { name: /passer au thème sombre/i });
        expect(button).toBeInTheDocument();

        // Vérifier que le bouton a la bonne taille
        expect(button).toHaveClass('h-10', 'w-10');

        // Vérifier que l'icône de lune est présente avec la bonne taille
        const moonIcon = screen.getByTestId('moon-icon');
        expect(moonIcon).toBeInTheDocument();
        expect(moonIcon).toHaveClass('h-7', 'w-7');
    });

    it('affiche une icône de soleil avec la bonne taille en mode dark', () => {
        mockUseTheme.mockReturnValue({
            theme: 'dark',
            setTheme: mockSetTheme
        });

        render(<ThemeSwitcher />);

        const button = screen.getByRole('button', { name: /passer au thème clair/i });
        expect(button).toBeInTheDocument();

        // Vérifier que le bouton a la bonne taille
        expect(button).toHaveClass('h-10', 'w-10');

        // Vérifier que l'icône de soleil est présente avec la bonne taille
        const sunIcon = screen.getByTestId('sun-icon');
        expect(sunIcon).toBeInTheDocument();
        expect(sunIcon).toHaveClass('h-7', 'w-7');
    });

    it('change de thème quand on clique sur le bouton', () => {
        mockUseTheme.mockReturnValue({
            theme: 'light',
            setTheme: mockSetTheme
        });

        render(<ThemeSwitcher />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('a une apparence visible et accessible', () => {
        mockUseTheme.mockReturnValue({
            theme: 'light',
            setTheme: mockSetTheme
        });

        render(<ThemeSwitcher />);

        const button = screen.getByRole('button');

        // Vérifier l'accessibilité
        expect(button).toHaveAttribute('aria-label', 'Passer au thème sombre');

        // Vérifier les styles pour la visibilité
        expect(button).toHaveClass('rounded-full', 'transition-colors');
    });
}); 
