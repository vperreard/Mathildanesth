import React from 'react';
import { renderWithProviders, screen, fireEvent, waitFor } from '@/test-utils/renderWithProviders';
import LoginForm from '../LoginForm';

// Mock des hooks nécessaires
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    login: jest.fn(),
    loading: false,
    error: null,
  })),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form correctly', () => {
    renderWithProviders(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    const mockLogin = jest.fn();
    const { useAuth } = require('@/hooks/useAuth');
    useAuth.mockReturnValue({
      login: mockLogin,
      loading: false,
      error: null,
    });

    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /se connecter/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should display loading state during submission', () => {
    const { useAuth } = require('@/hooks/useAuth');
    useAuth.mockReturnValue({
      login: jest.fn(),
      loading: true,
      error: null,
    });

    renderWithProviders(<LoginForm />);

    expect(screen.getByRole('button', { name: /connexion/i })).toBeDisabled();
  });

  it('should display error message when login fails', () => {
    const { useAuth } = require('@/hooks/useAuth');
    useAuth.mockReturnValue({
      login: jest.fn(),
      loading: false,
      error: 'Invalid credentials',
    });

    renderWithProviders(<LoginForm />);

    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
