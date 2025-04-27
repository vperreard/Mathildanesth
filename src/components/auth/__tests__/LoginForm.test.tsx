import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../LoginForm';
import { useAuth } from '@/context/AuthContext';

// Mock du contexte d'authentification
jest.mock('@/context/AuthContext');

describe('LoginForm', () => {
    const mockLogin = jest.fn();
    const mockOnLoginSuccess = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useAuth as jest.Mock).mockReturnValue({
            login: mockLogin,
            isLoading: false,
            user: null
        });
    });

    it('renders login form correctly', () => {
        render(<LoginForm />);

        expect(screen.getByLabelText(/identifiant/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
    });

    it('handles form submission correctly', async () => {
        mockLogin.mockResolvedValueOnce(undefined);

        render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />);

        fireEvent.change(screen.getByLabelText(/identifiant/i), {
            target: { value: 'admin' }
        });

        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: 'admin' }
        });

        fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({ login: 'admin', password: 'admin' });
            expect(mockOnLoginSuccess).toHaveBeenCalled();
        });
    });

    it('handles error during login', async () => {
        const errorMessage = 'Identifiants invalides';
        mockLogin.mockRejectedValueOnce(new Error(errorMessage));

        render(<LoginForm />);

        fireEvent.change(screen.getByLabelText(/identifiant/i), {
            target: { value: 'admin' }
        });

        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: 'wrong' }
        });

        fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    it('disables submit button during loading', () => {
        (useAuth as jest.Mock).mockReturnValue({
            login: mockLogin,
            isLoading: true,
            user: null
        });

        render(<LoginForm />);

        expect(screen.getByRole('button', { name: /connexion en cours/i })).toBeDisabled();
    });
}); 