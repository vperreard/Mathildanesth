import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotificationsWebSocket } from '../useNotificationsWebSocket';
import { useSession } from 'next-auth/react';
import { io } from 'socket.io-client';

// Mock des dépendances
jest.mock('next-auth/react', () => ({
    useSession: jest.fn()
}));

jest.mock('socket.io-client', () => ({
    io: jest.fn(() => mockSocket)
}));

// Mock de la fonction fetch
global.fetch = jest.fn() as jest.Mock;

// Mock de l'objet Socket.io
const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: true
};

describe('useNotificationsWebSocket', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock de session par défaut
        (useSession as jest.Mock).mockReturnValue({
            data: {
                user: {
                    id: 1,
                    name: 'Test User',
                    accessToken: 'fake-token'
                }
            },
            status: 'authenticated'
        });

        // Mock du fetch pour retourner des notifications par défaut
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                notifications: [
                    {
                        id: '1',
                        userId: 1,
                        type: 'INFO',
                        message: 'Test notification',
                        isRead: false,
                        createdAt: new Date().toISOString()
                    }
                ],
                unreadCount: 1
            })
        });

        // Configurer les handlers d'événements socket
        mockSocket.on.mockImplementation((event, callback) => {
            if (event === 'connect') {
                // Simuler une connexion immédiate
                setTimeout(() => callback(), 0);
            }
        });
    });

    test('initialise correctement la connexion WebSocket', async () => {
        const { result } = renderHook(() => useNotificationsWebSocket());

        await waitFor(() => {
            expect(io).toHaveBeenCalled();
            expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
            expect(mockSocket.on).toHaveBeenCalledWith('new_notification', expect.any(Function));
            expect(mockSocket.on).toHaveBeenCalledWith('notifications_read_update', expect.any(Function));
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.unreadCount).toBe(1);
        expect(result.current.notifications).toHaveLength(1);
    });

    test('charge les notifications correctement au démarrage', async () => {
        renderHook(() => useNotificationsWebSocket());

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/notifications'));
        });
    });

    test('marque une notification comme lue', async () => {
        const { result } = renderHook(() => useNotificationsWebSocket());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                updatedCount: 1,
                unreadCount: 0
            })
        });

        act(() => {
            result.current.markAsRead('1');
        });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/notifications/mark-as-read',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ notificationIds: ['1'] })
                })
            );
        });
    });

    test('marque toutes les notifications comme lues', async () => {
        const { result } = renderHook(() => useNotificationsWebSocket());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                updatedCount: 1,
                unreadCount: 0
            })
        });

        act(() => {
            result.current.markAllAsRead();
        });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/notifications/mark-as-read',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ all: true })
                })
            );
        });
    });

    test('gère les mises à jour en temps réel des notifications', async () => {
        const { result } = renderHook(() => useNotificationsWebSocket());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const newNotification = {
            id: '2',
            userId: 1,
            type: 'SUCCESS',
            message: 'Nouvelle notification',
            isRead: false,
            createdAt: new Date().toISOString()
        };

        // Simuler la réception d'une nouvelle notification
        act(() => {
            // Récupérer le callback onNew et l'exécuter
            const onNewCb = mockSocket.on.mock.calls.find(call => call[0] === 'new_notification')[1];
            onNewCb(newNotification);
        });

        expect(result.current.notifications).toHaveLength(2);
        expect(result.current.unreadCount).toBe(2);
        expect(result.current.notifications[0]).toEqual(newNotification);
    });

    test('gère les déconnexions et reconnexions', async () => {
        const { result } = renderHook(() => useNotificationsWebSocket());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Simuler une déconnexion
        act(() => {
            const onDisconnectCb = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
            onDisconnectCb();
        });

        expect(result.current.isConnected).toBe(false);

        // Simuler une reconnexion
        act(() => {
            result.current.connect();
        });

        expect(mockSocket.connect).toHaveBeenCalled();
    });

    test('nettoie les ressources lors de la déconnexion', () => {
        const { unmount } = renderHook(() => useNotificationsWebSocket());

        unmount();

        expect(mockSocket.off).toHaveBeenCalledWith('connect');
        expect(mockSocket.off).toHaveBeenCalledWith('disconnect');
        expect(mockSocket.off).toHaveBeenCalledWith('connect_error');
        expect(mockSocket.off).toHaveBeenCalledWith('new_notification');
        expect(mockSocket.off).toHaveBeenCalledWith('notifications_read_update');
        expect(mockSocket.disconnect).toHaveBeenCalled();
    });
}); 