import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../../components/ErrorBoundary';
import { logError } from '../../services/errorLoggingService';
import { CustomErrorFallback } from '../../components/Calendar/ErrorFallbacks';

// Mock du service de logging
jest.mock('../../services/errorLoggingService', () => ({
    logError: jest.fn(),
}));

// Composant qui génère une erreur à l'affichage
const ErrorComponent = ({ shouldError = true }) => {
    if (shouldError) {
        throw new Error('Test error');
    }
    return <div>Composant sans erreur</div>;
};

// Créer un composant fallback personnalisé pour les tests
const TestFallbackComponent: React.FC<{ error: Error; resetError: () => void }> = ({
    error,
    resetError
}) => (
    <div>
        <p>Message personnalisé: {error.message}</p>
        <button onClick={resetError}>Reset personnalisé</button>
    </div>
);

// Écraser console.error pour éviter les logs d'erreur React
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});

afterAll(() => {
    console.error = originalConsoleError;
});

describe('ErrorBoundary Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('devrait afficher les enfants quand il n\'y a pas d\'erreur', () => {
        render(
            <ErrorBoundary>
                <div>Contenu normal</div>
            </ErrorBoundary>
        );

        expect(screen.getByText('Contenu normal')).toBeInTheDocument();
    });

    test('devrait capturer les erreurs et afficher un fallback par défaut', () => {
        // Supprimer temporairement les erreurs de la console pour ce test
        jest.spyOn(console, 'error').mockImplementation(() => { });

        render(
            <ErrorBoundary>
                <ErrorComponent />
            </ErrorBoundary>
        );

        // Vérifier que le ErrorDisplay par défaut est rendu
        expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();
        expect(screen.getByText('Test error')).toBeInTheDocument();
        expect(screen.getByText('Réessayer')).toBeInTheDocument();

        // Vérifier que logError a été appelé avec les bons arguments
        expect(logError).toHaveBeenCalledWith('react_error_boundary', expect.objectContaining({
            message: 'Test error',
            severity: 'error',
        }));
    });

    test('devrait afficher un fallback personnalisé sous forme de nœud React', () => {
        // Supprimer temporairement les erreurs de la console pour ce test
        jest.spyOn(console, 'error').mockImplementation(() => { });

        const fallback = <div>Fallback personnalisé</div>;

        render(
            <ErrorBoundary fallback={fallback}>
                <ErrorComponent />
            </ErrorBoundary>
        );

        expect(screen.getByText('Fallback personnalisé')).toBeInTheDocument();
    });

    test('devrait appeler onError quand une erreur se produit', () => {
        // Supprimer temporairement les erreurs de la console pour ce test
        jest.spyOn(console, 'error').mockImplementation(() => { });

        const handleError = jest.fn();

        render(
            <ErrorBoundary onError={handleError}>
                <ErrorComponent />
            </ErrorBoundary>
        );

        expect(handleError).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Test error' }),
            expect.objectContaining({ componentStack: expect.any(String) })
        );
    });

    test('devrait afficher un composant fallback personnalisé', () => {
        // Supprimer temporairement les erreurs de la console pour ce test
        jest.spyOn(console, 'error').mockImplementation(() => { });

        render(
            <ErrorBoundary fallbackComponent={TestFallbackComponent}>
                <ErrorComponent />
            </ErrorBoundary>
        );

        expect(screen.getByText('Message personnalisé: Test error')).toBeInTheDocument();
        expect(screen.getByText('Reset personnalisé')).toBeInTheDocument();
    });

    test('devrait utiliser un composant fallback avec des props personnalisées', () => {
        // Supprimer temporairement les erreurs de la console pour ce test
        jest.spyOn(console, 'error').mockImplementation(() => { });

        render(
            <ErrorBoundary
                fallbackComponent={(props) => (
                    <CustomErrorFallback
                        {...props}
                        message="Message de test"
                        buttonText="Réinitialiser"
                    />
                )}
            >
                <ErrorComponent />
            </ErrorBoundary>
        );

        expect(screen.getByText('Message de test: Test error')).toBeInTheDocument();
        expect(screen.getByText('Réinitialiser')).toBeInTheDocument();
    });
}); 