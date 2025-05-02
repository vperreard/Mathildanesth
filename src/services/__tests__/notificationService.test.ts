import { notificationService } from '../notificationService';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

// Mock de socket.io-client
jest.mock('socket.io-client', () => ({
    io: jest.fn(() => ({
        on: jest.fn(),
        emit: jest.fn(),
        connected: true
    }))
}));

// Mock de react-toastify
jest.mock('react-toastify', () => ({
    toast: {
        info: jest.fn(),
        success: jest.fn(),
        warning: jest.fn(),
        error: jest.fn()
    }
}));

describe('NotificationService', () => {
    let socketMock: any;
    let socketOnHandler: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        // Configuration des mocks avec une implémentation plus robuste
        socketOnHandler = jest.fn();

        socketMock = {
            on: jest.fn((event, callback) => {
                socketOnHandler.mockImplementation((testEvent, data) => {
                    if (event === testEvent) {
                        callback(data);
                    }
                });
            }),
            emit: jest.fn(),
            connected: true
        };

        (io as jest.Mock).mockReturnValue(socketMock);

        // Réinitialiser l'état de l'objet notificationService (trick pour réinitialiser un singleton)
        // @ts-ignore - Accès à une propriété privée pour les tests
        notificationService.socket = socketMock;
        // @ts-ignore - Accès à une propriété privée pour les tests
        notificationService.listeners = new Map();

        // Déclencher l'initialisation qui va enregistrer les listeners
        notificationService.resetForTesting?.();
    });

    test('doit s\'abonner et recevoir des notifications', () => {
        // Définir un callback de notification
        const mockCallback = jest.fn();
        const unsubscribe = notificationService.subscribe('info', mockCallback);

        // Simuler une notification entrante
        const testNotification = {
            id: 'test-id',
            type: 'info' as const,
            title: 'Test',
            message: 'Ceci est un test',
            createdAt: new Date()
        };

        // Déclencher l'événement de notification via notre handler mock
        socketOnHandler('notification', testNotification);

        // Vérifier que le callback a été appelé
        expect(mockCallback).toHaveBeenCalledWith(testNotification);

        // Vérifier que toast a été appelé
        expect(toast.info).toHaveBeenCalledWith('Ceci est un test', expect.any(Object));
    });

    test('doit se désabonner correctement', () => {
        // Définir un callback de notification
        const mockCallback = jest.fn();
        const unsubscribe = notificationService.subscribe('warning', mockCallback);

        // Se désabonner
        unsubscribe();

        // Simuler une notification entrante
        const testNotification = {
            id: 'test-id',
            type: 'warning' as const,
            title: 'Test',
            message: 'Ceci est un avertissement',
            createdAt: new Date()
        };

        // Déclencher l'événement de notification
        socketOnHandler('notification', testNotification);

        // Vérifier que le callback n'a pas été appelé
        expect(mockCallback).not.toHaveBeenCalled();

        // Vérifier que toast a été appelé (même si désabonné, le toast est affiché)
        expect(toast.warning).toHaveBeenCalledWith('Ceci est un avertissement', expect.any(Object));
    });

    test('doit envoyer une notification via WebSocket', () => {
        // Envoyer une notification
        const notificationData = {
            type: 'success' as const,
            title: 'Succès',
            message: 'Opération réussie'
        };

        notificationService.sendNotification(notificationData);

        // Vérifier que emit a été appelé
        expect(socketMock.emit).toHaveBeenCalledWith(
            'sendNotification',
            expect.objectContaining({
                type: 'success',
                title: 'Succès',
                message: 'Opération réussie',
                id: expect.any(String),
                createdAt: expect.any(Date)
            })
        );
    });

    test('doit gérer différents types de notifications', () => {
        // Définir des callbacks pour différents types
        const infoCallback = jest.fn();
        const successCallback = jest.fn();
        const warningCallback = jest.fn();
        const errorCallback = jest.fn();

        notificationService.subscribe('info', infoCallback);
        notificationService.subscribe('success', successCallback);
        notificationService.subscribe('warning', warningCallback);
        notificationService.subscribe('error', errorCallback);

        // Simuler des notifications entrantes de différents types
        const infoNotification = {
            id: 'info-id',
            type: 'info' as const,
            title: 'Info',
            message: 'Information',
            createdAt: new Date()
        };

        const errorNotification = {
            id: 'error-id',
            type: 'error' as const,
            title: 'Erreur',
            message: 'Une erreur est survenue',
            createdAt: new Date()
        };

        // Déclencher les événements de notification
        socketOnHandler('notification', infoNotification);
        socketOnHandler('notification', errorNotification);

        // Vérifier que les callbacks ont été appelés
        expect(infoCallback).toHaveBeenCalledWith(infoNotification);
        expect(infoCallback).not.toHaveBeenCalledWith(errorNotification);

        expect(errorCallback).toHaveBeenCalledWith(errorNotification);
        expect(errorCallback).not.toHaveBeenCalledWith(infoNotification);

        expect(successCallback).not.toHaveBeenCalled();
        expect(warningCallback).not.toHaveBeenCalled();

        // Vérifier que toast a été appelé avec le bon type
        expect(toast.info).toHaveBeenCalledWith('Information', expect.any(Object));
        expect(toast.error).toHaveBeenCalledWith('Une erreur est survenue', expect.any(Object));
    });

    test('doit gérer la désabonnement via unsubscribe', () => {
        // Définir un callback de notification
        const mockCallback = jest.fn();

        // S'abonner puis se désabonner avec la méthode explicite
        notificationService.subscribe('error', mockCallback);
        notificationService.unsubscribe('error', mockCallback);

        // Simuler une notification entrante
        const testNotification = {
            id: 'test-id',
            type: 'error' as const,
            title: 'Test',
            message: 'Erreur test',
            createdAt: new Date()
        };

        // Déclencher l'événement de notification
        socketOnHandler('notification', testNotification);

        // Vérifier que le callback n'a pas été appelé
        expect(mockCallback).not.toHaveBeenCalled();
    });
}); 