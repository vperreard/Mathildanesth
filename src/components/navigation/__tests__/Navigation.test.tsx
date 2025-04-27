import { render, screen, fireEvent } from '@testing-library/react';
import Navigation from '../Navigation';
import { usePathname } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    usePathname: jest.fn()
}));

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

        const desktopNav = screen.getByRole('navigation', { hidden: true });
        expect(desktopNav).toHaveClass('hidden md:flex');
        expect(desktopNav).toBeInTheDocument();
        expect(screen.getAllByText('Accueil')).toHaveLength(1);
        expect(screen.getAllByText('Planning')).toHaveLength(1);
        expect(screen.queryByText('Paramètres')).not.toBeInTheDocument();
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

        const desktopNav = screen.getByRole('navigation', { hidden: true });
        expect(desktopNav).toBeInTheDocument();
        expect(screen.getAllByText('Accueil')).toHaveLength(1);
        expect(screen.getAllByText('Planning')).toHaveLength(1);
        expect(screen.getAllByText('Paramètres')).toHaveLength(1);
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