import { renderHook, act, waitFor } from '@testing-library/react';
import { useContextualMessagesWebSocket } from '../useContextualMessagesWebSocket';
import { useSession } from 'next-auth/react';
import { io } from 'socket.io-client';
import * as authHelpers from '@/lib/auth-helpers';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

// Mocks
jest.mock('next-auth/react');
jest.mock('socket.io-client');
jest.mock('@/lib/auth-helpers');

// Mock de fetch sera géré par MSW dans jest.setup.js
const fetchSpy = jest.spyOn(global, 'fetch');

describe('useContextualMessagesWebSocket', () => {
    // Mocks globaux
    const mockSession = {
        user: {
            id: 123,
            login: 'test-user',
            email: 'test@example.com',
            role: 'USER'
        }
    };
    
    const mockUseSession = {
        data: mockSession,
        status: 'authenticated'
    };

    const mockSocket = {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        id: 'socket-123'
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Configuration des mocks par défaut
        (useSession as jest.Mock).mockReturnValue(mockUseSession);
        (io as jest.Mock).mockReturnValue(mockSocket);

        // Réinitialiser le spy de fetch (les réponses sont gérées par MSW)
        fetchSpy.mockClear();
        
        // Mock fetch response pour les appels par défaut
        fetchSpy.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ messages: [] }),
        } as any);

        (authHelpers.getAuthToken as jest.Mock).mockReturnValue('mocked-auth-token');
        (authHelpers.createAuthHeaders as jest.Mock).mockReturnValue({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mocked-auth-token'
        });

        // Reset socket mock methods
        mockSocket.on.mockClear();
        mockSocket.off.mockClear();
        mockSocket.emit.mockClear();
        mockSocket.disconnect.mockClear();
    });

    it('initialise le socket avec les options d\'authentification correctes', async () => {
        // Simuler un token d'authentification
        (authHelpers.getAuthToken as jest.Mock).mockReturnValue('test-auth-token');

        // Rendu du hook
        renderHook(() => useContextualMessagesWebSocket({
            autoConnect: true,
            assignmentId: 'attribution-123'
        }));

        // Vérifier que Socket.IO est initialisé avec les bonnes options d'authentification
        expect(io).toHaveBeenCalledWith(expect.any(String), {
            path: '/api/ws',
            autoConnect: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 5000,
            withCredentials: true,
            auth: {
                userId: 123,
                token: 'test-auth-token'
            }
        });
    });

    it('charge les messages avec les en-têtes d\'authentification', async () => {
        // Configurer les mocks d'authentification
        const expectedHeaders = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-auth-token'
        };
        (authHelpers.createAuthHeaders as jest.Mock).mockReturnValue(expectedHeaders);

        // Rendu du hook
        const { result } = renderHook(() => useContextualMessagesWebSocket({
            assignmentId: 'attribution-456'
        }));
        
        // Attendre que l'effet se déclenche et fasse l'appel
        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledWith(
                expect.stringContaining('/api/contextual-messages?assignmentId=attribution-456'),
                expect.objectContaining({
                    headers: expectedHeaders,
                    credentials: 'include'
                })
            );
        }, { timeout: 5000 });
    });

    it('gère l\'erreur d\'authentification 401 dans fetch', async () => {
        // Simuler une réponse 401 Unauthorized
        fetchSpy.mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
                status: 401,
                json: () => Promise.resolve({ error: 'Non autorisé' })
            }) as any
        );

        // Configurer les headers pour que l'appel soit fait
        (authHelpers.createAuthHeaders as jest.Mock).mockReturnValue({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-auth-token'
        });

        // Rendu du hook
        const { result } = renderHook(() => useContextualMessagesWebSocket({
            assignmentId: 'attribution-789'
        }));

        // Attendre que l'état d'erreur d'authentification soit défini
        await waitFor(() => {
            expect(result.current.authError).toBe(true);
        }, { timeout: 5000 });
    });

    it('rejoint une room spécifique lorsque authentifié', async () => {
        // Rendu du hook avec des paramètres valides
        renderHook(() => useContextualMessagesWebSocket({
            assignmentId: 'attribution-123',
            contextDate: '2023-05-15'
        }));

        // Simuler une authentification réussie (extrait du code interne du hook)
        mockSocket.on.mock.calls.forEach(call => {
            if (call[0] === 'connect') {
                call[1](); // Appeler l'event handler 'connect'
            }
        });

        // Vérifier que le socket émet l'événement d'authentification
        expect(mockSocket.emit).toHaveBeenCalledWith(
            'USER_AUTHENTICATION_WEBSOCKET',
            expect.objectContaining({
                userId: 123,
                token: 'mocked-auth-token'
            })
        );

        // Vérifier que le socket a rejoint la room appropriée
        expect(mockSocket.emit).toHaveBeenCalledWith(
            'join_room',
            expect.stringMatching(/assignment_assignment-123|contextDate_2023-05-15/)
        );
    });

    it('envoie un message avec authentification', async () => {
        // Configurer les mocks d'authentification
        const expectedHeaders = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mocked-auth-token'
        };
        (authHelpers.createAuthHeaders as jest.Mock).mockReturnValue(expectedHeaders);

        // Configuration du mock fetch pour les messages - deux appels attendus
        fetchSpy
            .mockImplementationOnce(() => // Premier appel pour loadMessages
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ messages: [] })
                }) as any
            )
            .mockImplementationOnce(() => // Deuxième appel pour sendMessage
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        id: 'message-123',
                        content: 'Test message',
                        createdAt: new Date().toISOString(),
                        authorId: 123,
                        author: {
                            id: 123,
                            login: 'test-user'
                        }
                    })
                }) as any
            );

        // Rendu du hook
        const { result } = renderHook(() => useContextualMessagesWebSocket({
            assignmentId: 'attribution-123'
        }));

        // Attendre que le hook soit chargé
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Appeler la fonction sendMessage
        await act(async () => {
            await result.current.sendMessage('Test message');
        });

        // Vérifier que fetch a été appelé avec les bons en-têtes d'authentification pour sendMessage
        expect(fetchSpy).toHaveBeenCalledWith(
            '/api/contextual-messages',
            expect.objectContaining({
                method: 'POST',
                headers: expectedHeaders,
                credentials: 'include'
            })
        );
    });

    it('gère les événements socket entrants lorsque authentifié', async () => {
        // Rendu du hook
        const { result } = renderHook(() => useContextualMessagesWebSocket({
            assignmentId: 'attribution-123'
        }));

        // Simuler la réception d'un nouveau message par WebSocket
        const newMessage = {
            id: 'message-456',
            content: 'Message from WebSocket',
            createdAt: new Date().toISOString(),
            authorId: 456,
            author: {
                id: 456,
                login: 'other-user'
            }
        };

        // Trouver le gestionnaire d'événement 'new_contextual_message'
        mockSocket.on.mock.calls.forEach(call => {
            if (call[0] === 'new_contextual_message') {
                // Simuler la réception d'un message
                act(() => {
                    call[1](newMessage);
                });
            }
        });

        // Attendre la mise à jour de l'état
        await waitFor(() => {
            expect(result.current.messages).toContainEqual(
                expect.objectContaining({
                    id: 'message-456',
                    content: 'Message from WebSocket'
                })
            );
        });
    });

    it('gère les erreurs d\'authentification WebSocket', async () => {
        // Rendu du hook
        const { result } = renderHook(() => useContextualMessagesWebSocket({
            assignmentId: 'attribution-123'
        }));

        // Simuler une erreur d'authentification WebSocket
        mockSocket.on.mock.calls.forEach(call => {
            if (call[0] === 'auth_error') {
                // Simuler l'événement d'erreur d'authentification
                act(() => {
                    call[1]('Token WebSocket invalide');
                });
            }
        });

        // Vérifier que l'état d'erreur d'authentification est défini
        await waitFor(() => {
            expect(result.current.authError).toBe(true);
        });
    });

    it('déconnecte le socket lors du démontage du composant', async () => {
        // Rendu du hook
        const { unmount } = renderHook(() => useContextualMessagesWebSocket({
            assignmentId: 'attribution-123'
        }));

        // Simuler le démontage du composant
        unmount();

        // Vérifier que le socket est déconnecté
        expect(mockSocket.disconnect).toHaveBeenCalled();
    });
}); 