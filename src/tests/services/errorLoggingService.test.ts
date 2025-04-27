import { logError, flushErrorQueue, configureErrorLogging } from '../../services/errorLoggingService';
import { ErrorDetails } from '../../hooks/useErrorHandler';

// Mock de fetch global
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        text: () => Promise.resolve('success')
    })
) as jest.Mock;

// Mock de console.error
const originalConsoleError = console.error;

describe('errorLoggingService', () => {
    beforeEach(() => {
        // Réinitialiser tous les mocks
        jest.clearAllMocks();
        console.error = jest.fn();
        (global.fetch as jest.Mock).mockClear();
    });

    afterAll(() => {
        console.error = originalConsoleError;
    });

    const mockError: ErrorDetails = {
        message: 'Test error message',
        severity: 'error',
        timestamp: new Date(),
        context: { test: 'context' }
    };

    test('devrait logger une erreur dans la console par défaut', () => {
        logError('test_error', mockError);

        expect(console.error).toHaveBeenCalledWith(
            '[ERROR] test_error:',
            expect.objectContaining({
                message: 'Test error message',
                context: { test: 'context' },
                timestamp: expect.any(Date)
            })
        );
    });

    test('devrait envoyer des erreurs au serveur lorsque la file d\'attente atteint la taille du batch', () => {
        // Configurer le service pour envoyer au serveur avec une taille de batch de 2
        configureErrorLogging({
            enableServerLogging: true,
            batchSize: 2
        });

        // Loguer deux erreurs pour atteindre la taille du batch
        logError('error1', mockError);
        logError('error2', mockError);

        // Vérifier que fetch a été appelé
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('error1')
            })
        );
    });

    test('devrait forcer l\'envoi de la file d\'attente', async () => {
        // Configurer le service avec une taille de batch élevée
        configureErrorLogging({
            enableServerLogging: true,
            batchSize: 10
        });

        // Loguer une erreur (pas assez pour atteindre la taille du batch)
        logError('error_flush', mockError);

        // Vérifier que fetch n'a pas encore été appelé
        expect(global.fetch).not.toHaveBeenCalled();

        // Forcer l'envoi
        await flushErrorQueue();

        // Vérifier que fetch a été appelé
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('error_flush')
            })
        );
    });

    test('devrait gérer les erreurs lors de l\'envoi au serveur', async () => {
        // Configurer le fetch pour qu'il échoue
        (global.fetch as jest.Mock).mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
                text: () => Promise.resolve('error')
            })
        );

        // Configurer le service
        configureErrorLogging({
            enableServerLogging: true,
            batchSize: 1
        });

        // Loguer une erreur
        logError('failed_error', mockError);

        // Vérifier que console.error a été appelé pour l'échec de l'envoi ou pour l'erreur
        expect(console.error).toHaveBeenCalled();

        // Forcer un nouvel envoi pour vérifier que l'erreur a été remise dans la file d'attente
        (global.fetch as jest.Mock).mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                text: () => Promise.resolve('success')
            })
        );

        await flushErrorQueue();

        // Vérifier que fetch a été appelé au moins une fois
        expect(global.fetch).toHaveBeenCalled();
        // Vérifier que le dernier appel contient l'erreur
        expect(global.fetch).toHaveBeenLastCalledWith(
            expect.any(String),
            expect.objectContaining({
                body: expect.stringContaining('failed_error')
            })
        );
    });

    test('devrait ne pas envoyer au serveur si la configuration désactive cette option', () => {
        // Désactiver l'envoi au serveur
        configureErrorLogging({
            enableServerLogging: false
        });

        // Loguer une erreur
        logError('disabled_server_logging', mockError);

        // Vérifier que fetch n'a pas été appelé
        expect(global.fetch).not.toHaveBeenCalled();
    });
}); 