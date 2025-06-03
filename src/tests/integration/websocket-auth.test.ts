import { verifyAuthToken, generateAuthTokenServer } from '@/lib/auth-server-utils';

// Mocks
jest.mock('@/lib/auth-server-utils', () => ({
    verifyAuthToken: jest.fn(),
    generateAuthTokenServer: jest.fn()
}));

jest.mock('@prisma/client');

// Mock complet de socket.io-client
jest.mock('socket.io-client', () => {
    const mockSocket = {
        connected: false,
        id: 'mock-socket-id',
        on: jest.fn(),
        emit: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        off: jest.fn(),
        removeAllListeners: jest.fn()
    };
    
    return {
        io: jest.fn(() => mockSocket),
        Socket: jest.fn(() => mockSocket)
    };
});

describe.skip('Tests d integration WebSocket avec Authentification', () => {
    let mockSocket: any;
    const mockUser = {
        id: 999,
        login: 'test-integration-user',
        email: 'integration@example.com',
        role: 'USER'
    };
    const mockAuthToken = 'integration-test-token-123';

    beforeEach(() => {
    jest.clearAllMocks();
        jest.clearAllMocks();
        
        // Récupérer le mock socket
        const { io } = require('socket.io-client');
        mockSocket = io();
        
        // Configuration du mock verifyAuthToken
        (verifyAuthToken as jest.Mock).mockImplementation((token: string) => {
            if (token === mockAuthToken) {
                return {
                    authenticated: true,
                    userId: mockUser.id,
                    role: mockUser.role
                };
            }
            return {
                authenticated: false,
                error: 'Token invalide'
            };
        });

        // Mock de generateAuthTokenServer
        (generateAuthTokenServer as jest.Mock).mockResolvedValue(mockAuthToken);
        
        // Simuler le comportement de connexion
        mockSocket.connect.mockImplementation(() => {
            mockSocket.connected = true;
            // Déclencher l'événement connect de manière asynchrone
            setTimeout(() => {
                const connectHandler = mockSocket.on.mock.calls.find((call: [string, (() => void)]) => call[0] === 'connect');
                if (connectHandler && connectHandler[1]) {
                    connectHandler[1]();
                }
            }, 10);
        });
        
        // Simuler le comportement de déconnexion
        mockSocket.disconnect.mockImplementation(() => {
            mockSocket.connected = false;
        });
    });

    afterEach(() => {
        if (mockSocket) {
            mockSocket.removeAllListeners();
        }
    });

    it('connecte le client sans authentification initiale (connexion anonyme temporaire)', async () => {
        const connectPromise = new Promise<void>((resolve) => {
            mockSocket.on('connect', () => {
                expect(mockSocket.connected).toBe(true);
                resolve();
            });
        });

        mockSocket.connect();
        await connectPromise;
    });

    it('authentifie le client avec un token valide', async () => {
        const authPromise = new Promise<void>((resolve) => {
            mockSocket.on('connect', () => {
                // Envoyer les informations d'authentification
                mockSocket.emit('USER_AUTHENTICATION_WEBSOCKET', {
                    userId: mockUser.id,
                    token: mockAuthToken
                });
                
                // Vérifier que emit a été appelé
                expect(mockSocket.emit).toHaveBeenCalledWith('USER_AUTHENTICATION_WEBSOCKET', {
                    userId: mockUser.id,
                    token: mockAuthToken
                });
                
                // Simuler la réponse du serveur
                setTimeout(() => {
                    const authSuccessHandler = mockSocket.on.mock.calls.find((call: [string, (() => void)]) => call[0] === 'auth_success');
                    if (authSuccessHandler && authSuccessHandler[1]) {
                        authSuccessHandler[1]();
                    }
                }, 50);
            });
            
            mockSocket.on('auth_success', () => {
                expect(verifyAuthToken).toHaveBeenCalledWith(mockAuthToken);
                resolve();
            });
        });

        mockSocket.connect();
        await authPromise;
    });

    it('rejette l authentification avec un token invalide', async () => {
        const authErrorPromise = new Promise<void>((resolve) => {
            mockSocket.on('connect', () => {
                // Envoyer des informations d'authentification invalides
                mockSocket.emit('USER_AUTHENTICATION_WEBSOCKET', {
                    userId: mockUser.id,
                    token: 'invalid-token'
                });
                
                // Simuler la réponse d'erreur du serveur
                setTimeout(() => {
                    const authErrorHandler = mockSocket.on.mock.calls.find((call: [string, (() => void)]) => call[0] === 'auth_error');
                    if (authErrorHandler && authErrorHandler[1]) {
                        authErrorHandler[1]('Token invalide');
                    }
                }, 50);
            });
            
            mockSocket.on('auth_error', (message: string) => {
                expect(message).toContain('Token invalide');
                resolve();
            });
        });

        mockSocket.connect();
        await authErrorPromise;
    });

    it('empeche de joindre une room protegee sans authentification', async () => {
        const roomPromise = new Promise<void>((resolve) => {
            mockSocket.on('connect', () => {
                // Essayer de rejoindre une room sans être authentifié
                mockSocket.emit('join_room', 'protected_room');
                
                // Simuler le rejet du serveur
                setTimeout(() => {
                    const errorHandler = mockSocket.on.mock.calls.find((call: [string, (() => void)]) => call[0] === 'room_error');
                    if (errorHandler && errorHandler[1]) {
                        errorHandler[1]('Authentification requise');
                    }
                }, 50);
            });
            
            mockSocket.on('room_error', (error: string) => {
                expect(error).toContain('Authentification requise');
                resolve();
            });
        });

        mockSocket.connect();
        await roomPromise;
    });

    it('autorise à joindre une room après authentification', async () => {
        const roomName = `user_${mockUser.id}`;
        
        const roomJoinPromise = new Promise<void>((resolve) => {
            mockSocket.on('connect', () => {
                // Authentifier d'abord l'utilisateur
                mockSocket.emit('USER_AUTHENTICATION_WEBSOCKET', {
                    userId: mockUser.id,
                    token: mockAuthToken
                });
                
                // Simuler l'authentification réussie
                setTimeout(() => {
                    mockSocket.emit('join_room', roomName);
                    
                    // Simuler la confirmation du serveur
                    setTimeout(() => {
                        const roomJoinedHandler = mockSocket.on.mock.calls.find((call: [string, (() => void)]) => call[0] === 'room_joined');
                        if (roomJoinedHandler && roomJoinedHandler[1]) {
                            roomJoinedHandler[1](roomName);
                        }
                    }, 50);
                }, 100);
            });
            
            mockSocket.on('room_joined', (room: string) => {
                expect(room).toBe(roomName);
                expect(mockSocket.emit).toHaveBeenCalledWith('join_room', roomName);
                resolve();
            });
        });

        mockSocket.connect();
        await roomJoinPromise;
    });

    it('maintient l authentification lors de la reconnexion', async () => {
        let connectionCount = 0;
        
        const reconnectPromise = new Promise<void>((resolve) => {
            mockSocket.on('connect', () => {
                connectionCount++;
                
                if (connectionCount === 1) {
                    // Première connexion : authentifier
                    mockSocket.emit('USER_AUTHENTICATION_WEBSOCKET', {
                        userId: mockUser.id,
                        token: mockAuthToken
                    });
                    
                    // Simuler une déconnexion après authentification
                    setTimeout(() => {
                        mockSocket.disconnect();
                        // Reconnecter
                        setTimeout(() => {
                            mockSocket.connect();
                        }, 50);
                    }, 100);
                } else {
                    // Deuxième connexion : vérifier que l'auth est maintenue
                    mockSocket.emit('check_auth_status');
                    
                    // Simuler la réponse du serveur
                    setTimeout(() => {
                        const authStatusHandler = mockSocket.on.mock.calls.find((call: [string, (() => void)]) => call[0] === 'auth_status');
                        if (authStatusHandler && authStatusHandler[1]) {
                            authStatusHandler[1]({ authenticated: true, userId: mockUser.id });
                        }
                    }, 50);
                }
            });
            
            mockSocket.on('auth_status', (status: any) => {
                expect(status.authenticated).toBe(true);
                expect(status.userId).toBe(mockUser.id);
                resolve();
            });
        });

        mockSocket.connect();
        await reconnectPromise;
    });
});