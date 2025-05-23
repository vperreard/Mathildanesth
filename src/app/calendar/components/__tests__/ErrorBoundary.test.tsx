/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Composant qui va lancer une erreur intentionnellement
const ErrorThrowingComponent = () => {
    throw new Error('Test error');
    // return <div>Ce texte ne sera jamais rendu</div>; // Inutile car throw au-dessus
};

// Mock pour console.error pour éviter les logs d'erreur dans les tests
// const originalConsoleError = console.error; // Déjà défini globalement ou via spyOn plus bas
beforeAll(() => {
    // jest.spyOn(console, 'error').mockImplementation(() => {}); // Peut être fait par test si besoin
});

afterAll(() => {
    // console.error = originalConsoleError; // Rétablir si modifié globalement
    // jest.restoreAllMocks(); // Si on utilise jest.spyOn
});

describe('ErrorBoundary', () => {
    // Restaurer les mocks après chaque test pour éviter les interférences
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('affiche le fallback quand un enfant lance une erreur', () => {
        const fallback = <div data-testid="error-fallback">Une erreur est survenue</div>;

        // Capture de l'erreur attendue dans le test pour éviter qu'elle n'échoue le test
        jest.spyOn(console, 'error').mockImplementation(() => { });

        render(
            <ErrorBoundary fallback={fallback}>
                <ErrorThrowingComponent />
            </ErrorBoundary>
        );

        // Vérifier que le fallback est affiché
        expect(screen.getByTestId('error-fallback')).toBeTruthy();
        expect(screen.getByText('Une erreur est survenue')).toBeTruthy();
    });

    test('rend les enfants normalement quand aucune erreur n\'est lancée', () => {
        const fallback = <div>Une erreur est survenue</div>;

        render(
            <ErrorBoundary fallback={fallback}>
                <div data-testid="normal-child">Contenu normal</div>
            </ErrorBoundary>
        );

        // Vérifier que le contenu normal est affiché
        expect(screen.getByTestId('normal-child')).toBeTruthy();
        expect(screen.getByText('Contenu normal')).toBeTruthy();

        // Vérifier que le fallback n'est pas affiché
        expect(screen.queryByText('Une erreur est survenue')).toBeNull();
    });
}); 