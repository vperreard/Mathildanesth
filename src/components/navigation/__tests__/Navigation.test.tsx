import { render, screen, fireEvent } from '@testing-library/react';
import Navigation from '../Navigation';
import { usePathname } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    usePathname: jest.fn()
}));

// Mock useTheme
jest.mock('@/context/ThemeContext', () => ({
    useTheme: jest.fn(() => ({ theme: 'light' }))
}));

// Mock navigationConfig
jest.mock('@/utils/navigationConfig', () => ({
    navigationGroups: [
        {
            name: 'Planning',
            links: [
                { href: '/planning', label: 'Planning' },
            ]
        },
        {
            name: 'Administration',
            links: [
                { href: '/parametres', label: 'Paramètres' },
            ]
        }
    ],
    isAdminGroup: (groupName: string) => groupName === 'Administration'
}));

// Mock framer-motion - déjà fait dans jest.setup.js mais on peut le remock localement si besoin
jest.mock('framer-motion', () => {
    const React = require('react');
    return {
        motion: {
            nav: React.forwardRef((props: any, ref: any) => {
                const { children, ...rest } = props;
                return React.createElement('nav', { ...rest, ref }, children);
            }),
            div: React.forwardRef((props: any, ref: any) => {
                const { children, ...rest } = props;
                return React.createElement('div', { ...rest, ref }, children);
            }),
            button: React.forwardRef((props: any, ref: any) => {
                const { children, ...rest } = props;
                return React.createElement('button', { ...rest, ref }, children);
            }),
        },
        AnimatePresence: ({ children }: any) => children,
    };
});

describe('Navigation', () => {
    const mockLinks = [
        { href: '/', label: 'Accueil' },
        { href: '/planning', label: 'Planning' },
        { href: '/parametres', label: 'Paramètres' }
    ];

    beforeEach(() => {
        (usePathname as jest.Mock).mockReturnValue('/');
    });

    it('renders desktop navigation links', () => {
        render(
            <Navigation
                links={mockLinks}
                isAdmin={false}
                mobileMenuOpen={false}
                onMobileMenuToggle={() => { }}
            />
        );

        // Le composant Navigation utilise des groupes, pas des liens directs
        // On devrait voir les groupes rendus
        expect(screen.getByText('Planning')).toBeInTheDocument();
        // Les liens d'admin ne devraient pas être visibles
        expect(screen.queryByText('Administration')).not.toBeInTheDocument();
    });

    it('renders all links for admin users', () => {
        render(
            <Navigation
                links={mockLinks}
                isAdmin={true}
                mobileMenuOpen={false}
                onMobileMenuToggle={() => { }}
            />
        );

        // Pour les admins, on devrait voir tous les groupes
        expect(screen.getByText('Planning')).toBeInTheDocument();
        expect(screen.getByText('Administration')).toBeInTheDocument();
    });

    it('toggles mobile menu when button is clicked', () => {
        const onMobileMenuToggle = jest.fn();
        render(
            <Navigation
                links={mockLinks}
                isAdmin={false}
                mobileMenuOpen={false}
                onMobileMenuToggle={onMobileMenuToggle}
            />
        );

        const menuButton = screen.getByRole('button', { name: /ouvrir le menu/i });
        fireEvent.click(menuButton);
        expect(onMobileMenuToggle).toHaveBeenCalledTimes(1);
    });

    it('shows mobile menu when mobileMenuOpen is true', () => {
        render(
            <Navigation
                links={mockLinks}
                isAdmin={false}
                mobileMenuOpen={true}
                onMobileMenuToggle={() => { }}
            />
        );

        const mobileNav = screen.getAllByRole('navigation')[1];
        expect(mobileNav).toHaveClass('md:hidden');
        expect(screen.getAllByText('Accueil')).toBeTruthy();
        expect(screen.getAllByText('Planning')).toBeTruthy();
    });

    it('highlights active link', () => {
        (usePathname as jest.Mock).mockReturnValue('/planning');

        render(
            <Navigation
                links={mockLinks}
                isAdmin={false}
                mobileMenuOpen={false}
                onMobileMenuToggle={() => { }}
            />
        );

        const activeLinks = screen.getAllByText('Planning');
        activeLinks.forEach(link => {
            expect(link.closest('a')).toHaveClass('text-primary-600');
            expect(link.closest('a')).toHaveClass('bg-primary-50');
        });
    });
}); 