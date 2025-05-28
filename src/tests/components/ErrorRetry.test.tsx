import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorRetry from '../../components/ErrorRetry';

// Mock du hook useErrorHandler
jest.mock('../../hooks/useErrorHandler', () => ({
    useErrorHandler: () => ({
        setError: jest.fn(),
        error: null,
        clearError: jest.fn(),
        handleError: jest.fn(),
        isLoading: false,
    }),
}));

// Composant enfant pour les tests simplifiés
const SuccessComponent = ({ result }) => <div data-testid="success">Succès: {result}</div>;
const DefaultChildren = <div data-testid="default-children">Contenu réussi</div>;

describe('ErrorRetry Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Utiliser de vrais timers pour éviter les problèmes de synchronisation
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('devrait afficher les enfants après une action réussie', async () => {
        const mockAction = jest.fn().mockResolvedValue('Action réussie');

        render(
            <ErrorRetry action={mockAction} maxRetries={0}>
                {(result) => <SuccessComponent result={result} />}
            </ErrorRetry>
        );

        // Avancer dans le temps pour permettre à l'action de se terminer
        await act(async () => {
            jest.runAllTimers();
        });

        // Après l'action réussie, le contenu devrait être affiché
        await waitFor(() => {
            expect(screen.getByTestId('success')).toBeInTheDocument();
        });

        // Vérifier que l'action a été appelée
        expect(mockAction).toHaveBeenCalledTimes(1);
    });

    test('devrait réessayer automatiquement après une erreur', async () => {
        // Action qui échoue la première fois puis réussit
        const mockAction = jest.fn()
            .mockRejectedValueOnce(new Error('Échec temporaire'))
            .mockResolvedValueOnce('success');

        render(
            <ErrorRetry action={mockAction} maxRetries={2} retryDelay={100}>
                {DefaultChildren}
            </ErrorRetry>
        );

        // Attendre que les retries s'exécutent
        await waitFor(() => {
            expect(mockAction).toHaveBeenCalledTimes(2);
        }, { timeout: 3000 });

        // Après la réussite, le contenu devrait être affiché
        await waitFor(() => {
            expect(screen.getByTestId('default-children')).toBeInTheDocument();
        }, { timeout: 2000 });
    });

    test('devrait afficher un message d\'erreur après avoir épuisé les tentatives', async () => {
        // Action qui échoue systématiquement
        const mockAction = jest.fn().mockRejectedValue(new Error('Échec permanent'));
        const onFinalFailure = jest.fn();

        render(
            <ErrorRetry
                action={mockAction}
                maxRetries={2}
                retryDelay={1000}
                onFinalFailure={onFinalFailure}
            >
                <div>Contenu qui ne sera jamais affiché</div>
            </ErrorRetry>
        );

        // Première tentative au montage
        expect(mockAction).toHaveBeenCalledTimes(1);

        // Première nouvelle tentative
        await act(async () => {
            await waitFor(() => {
                expect(screen.getByText(/Nouvelle tentative 1\/2/i)).toBeInTheDocument();
            });
            jest.advanceTimersByTime(1000);
        });

        // Deuxième tentative
        expect(mockAction).toHaveBeenCalledTimes(2);

        // Deuxième nouvelle tentative
        await act(async () => {
            await waitFor(() => {
                expect(screen.getByText(/Nouvelle tentative 2\/2/i)).toBeInTheDocument();
            });
            jest.advanceTimersByTime(1000);
        });

        // Dernière tentative
        expect(mockAction).toHaveBeenCalledTimes(3);

        // Après avoir épuisé les tentatives, un message d'erreur devrait s'afficher
        await waitFor(() => {
            expect(screen.getByText('Échec permanent')).toBeInTheDocument();
            expect(screen.getByText(/Échec après 2 tentatives/)).toBeInTheDocument();
        });

        // Le callback d'échec final devrait être appelé
        expect(onFinalFailure).toHaveBeenCalledWith(expect.any(Error));
    });

    test('devrait permettre une nouvelle tentative manuelle après un échec final', async () => {
        // Action qui échoue systématiquement
        const mockAction = jest.fn()
            .mockRejectedValueOnce(new Error('Échec 1'))
            .mockRejectedValueOnce(new Error('Échec 2'))
            .mockRejectedValueOnce(new Error('Échec 3'))
            .mockResolvedValueOnce('success');

        render(
            <ErrorRetry action={mockAction} maxRetries={1} retryDelay={1000}>
                <div>Contenu réussi</div>
            </ErrorRetry>
        );

        // Permettre les tentatives automatiques d'échouer
        await act(async () => {
            jest.advanceTimersByTime(1000); // Première nouvelle tentative
            jest.advanceTimersByTime(1000); // Attendre que la dernière tentative échoue
        });

        // Après avoir épuisé les tentatives, un bouton de nouvelle tentative devrait être affiché
        const retryButton = await screen.findByText('Réessayer');

        // Cliquer sur le bouton de nouvelle tentative
        await act(async () => {
            await userEvent.click(retryButton);
        });

        // L'action devrait être appelée à nouveau
        expect(mockAction).toHaveBeenCalledTimes(4);

        // Avancer dans le temps pour permettre à l'action de se terminer
        await act(async () => {
            jest.runAllTimers();
        });

        // Après la réussite, le contenu devrait être affiché
        await waitFor(() => {
            expect(screen.getByText('Contenu réussi')).toBeInTheDocument();
        });
    });

    test('devrait utiliser un fallback personnalisé en cas d\'erreur', async () => {
        const mockAction = jest.fn().mockRejectedValue(new Error('Échec'));
        const fallback = <div>Fallback personnalisé</div>;

        render(
            <ErrorRetry action={mockAction} maxRetries={0} fallback={fallback}>
                <div>Contenu qui ne sera jamais affiché</div>
            </ErrorRetry>
        );

        // Avancer dans le temps pour permettre à l'action d'échouer
        await act(async () => {
            jest.runAllTimers();
        });

        // Le fallback personnalisé devrait être affiché
        await waitFor(() => {
            expect(screen.getByText('Fallback personnalisé')).toBeInTheDocument();
        });
    });
}); 