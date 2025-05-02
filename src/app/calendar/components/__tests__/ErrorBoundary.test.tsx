import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Composant qui va lancer une erreur intentionnellement
const ErrorThrowingComponent = () => {
    throw new Error('Test error');
    return <div>Ce texte ne sera jamais rendu</div>;
};

// Mock pour console.error pour éviter les logs d'erreur dans les tests
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});

afterAll(() => {
    console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
    test('affiche le fallback quand un enfant lance une erreur', () => {
        const fallback = <div data-testid="error-fallback">Une erreur est survenue</div>;

        // Capture de l'erreur attendue dans le test
        jest.spyOn(console, 'error').mockImplementation(() => { });

        render(
            <ErrorBoundary fallback={fallback}>
                <ErrorThrowingComponent />
            </ErrorBoundary>
        );

        // Vérifier que le fallback est affiché
        expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
        expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();
    });

    test('rend les enfants normalement quand aucune erreur n\'est lancée', () => {
        const fallback = <div>Une erreur est survenue</div>;

        render(
            <ErrorBoundary fallback={fallback}>
                <div data-testid="normal-child">Contenu normal</div>
            </ErrorBoundary>
        );

        // Vérifier que le contenu normal est affiché
        expect(screen.getByTestId('normal-child')).toBeInTheDocument();
        expect(screen.getByText('Contenu normal')).toBeInTheDocument();

        // Vérifier que le fallback n'est pas affiché
        expect(screen.queryByText('Une erreur est survenue')).not.toBeInTheDocument();
    });
}); 