import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoginForm } from '../LoginForm';
import { useAuth } from '@/hooks/useAuth';

// Mock du hook useAuth
jest.mock('@/hooks/useAuth', () => ({
    useAuth: jest.fn(),
}));

// Mock pour localStorage
const mockLocalStorage = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
});

describe('LoginForm', () => {
    const mockLogin = jest.fn();
    const mockOnLoginSuccess = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        // Configuration par défaut du mock useAuth
        (useAuth as jest.Mock).mockReturnValue({
            login: mockLogin,
            isLoading: false,
        });
    });

    test('rend correctement le formulaire de connexion', () => {
        render(<LoginForm />);

        // Vérifier que les champs et le bouton sont présents
        expect(screen.getByLabelText(/identifiant/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/se souvenir de moi/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
    });

    test('soumet les identifiants correctement', async () => {
        render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />);

        // Remplir le formulaire
        fireEvent.change(screen.getByLabelText(/identifiant/i), { target: { value: 'utilisateur@test.fr' } });
        fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'motdepasse123' } });
        fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

        // Vérifier que la fonction login a été appelée avec les bons paramètres
        expect(mockLogin).toHaveBeenCalledWith({
            login: 'utilisateur@test.fr',
            password: 'motdepasse123',
        });

        // Vérifier que la fonction de callback n'a pas encore été appelée
        expect(mockOnLoginSuccess).not.toHaveBeenCalled();

        // Simuler une connexion réussie
        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledTimes(1);
        });

        // La fonction de callback devrait être appelée après une connexion réussie
        expect(mockOnLoginSuccess).toHaveBeenCalledTimes(1);
    });

    test('affiche une erreur en cas d\'échec de connexion', async () => {
        // Configurer le mock pour simuler une erreur
        (useAuth as jest.Mock).mockReturnValue({
            login: jest.fn().mockRejectedValue(new Error('Identifiants incorrects')),
            isLoading: false,
        });

        render(<LoginForm />);

        // Remplir et soumettre le formulaire
        fireEvent.change(screen.getByLabelText(/identifiant/i), { target: { value: 'utilisateur@test.fr' } });
        fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'motdepasse_incorrect' } });
        fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

        // Vérifier que le message d'erreur s'affiche
        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('Identifiants incorrects');
        });
    });

    test('affiche l\'état de chargement pendant la connexion', () => {
        // Configurer le mock pour simuler un chargement
        (useAuth as jest.Mock).mockReturnValue({
            login: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100))),
            isLoading: true,
        });

        render(<LoginForm />);

        // Remplir et soumettre le formulaire
        fireEvent.change(screen.getByLabelText(/identifiant/i), { target: { value: 'utilisateur@test.fr' } });
        fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'motdepasse123' } });

        // Le bouton indique déjà un chargement car isLoading est à true
        expect(screen.getByRole('button')).toHaveTextContent('Connexion en cours...');
        expect(screen.getByRole('button')).toBeDisabled();
        expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    test('sauvegarde les identifiants quand "Se souvenir de moi" est coché', async () => {
        // Simuler une connexion réussie
        mockLogin.mockResolvedValue(undefined);

        render(<LoginForm />);

        // Remplir le formulaire avec "Se souvenir de moi" coché
        fireEvent.change(screen.getByLabelText(/identifiant/i), { target: { value: 'utilisateur@test.fr' } });
        fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'motdepasse123' } });
        fireEvent.click(screen.getByLabelText(/se souvenir de moi/i));
        fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledTimes(1);
        });

        // Vérifier que localStorage.setItem a été appelé
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            'saved_credentials',
            JSON.stringify({ login: 'utilisateur@test.fr', password: 'motdepasse123' })
        );
    });

    test('utilise le préfixe ID personnalisé si fourni', () => {
        render(<LoginForm idPrefix="header_" />);

        // Vérifier que les ID des éléments contiennent le préfixe
        expect(screen.getByLabelText(/identifiant/i)).toHaveAttribute('id', 'header_email');
        expect(screen.getByLabelText(/mot de passe/i)).toHaveAttribute('id', 'header_password');
        expect(screen.getByLabelText(/se souvenir de moi/i)).toHaveAttribute('id', 'header_rememberMe');
    });
}); 