import { Server as NetServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { NextApiResponse } from 'next';
import { verifyAuthToken } from './auth-server-utils';

export type NextApiResponseWithSocket = NextApiResponse & {
    socket: {
        server: NetServer & {
            io?: SocketIOServer;
        };
    };
};

export let io: SocketIOServer | null = null;

interface ClientToServerEvents {
    USER_AUTHENTICATION_WEBSOCKET: (payload: { userId: number; token?: string }) => void;
    join_room: (room: string) => void;
    leave_room: (room: string) => void;
}

interface ServerToClientEvents {
    new_notification: (notification: any) => void;
    notifications_read_update: (data: { count: number; all: boolean }) => void;
    new_contextual_message: (message: any) => void;
    updated_contextual_message: (message: any) => void;
    deleted_contextual_message: (messageId: string) => void;
    auth_error: (message: string) => void;
}

interface InterServerEvents { }
interface SocketData {
    userId?: number;
    rooms?: string[];
    authenticated?: boolean;
    authToken?: string;
}

export const initSocket = (res: NextApiResponseWithSocket) => {
    if (!res.socket?.server) {
        console.error('Le serveur WebSocket n\'est pas disponible sur res.socket.server');
        return null;
    }

    if (!res.socket.server.io) {
        try {
            const newIo = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
                res.socket.server,
                {
                    path: '/api/ws',
                    addTrailingSlash: false,
                    cors: {
                        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
                        methods: ['GET', 'POST'],
                        credentials: true
                    }
                }
            );

            // Middleware d'authentification
            newIo.use(async (socket, next) => {
                try {
                    const token = socket.handshake.auth.token;
                    const userId = socket.handshake.auth.userId;

                    // Si aucun token ou userId n'est fourni, on continue sans authentifier
                    // L'authentification pourra être effectuée plus tard avec USER_AUTHENTICATION_WEBSOCKET
                    if (!token || !userId) {
                        socket.data.authenticated = false;
                        return next();
                    }

                    // Vérifier le token
                    const authResult = await verifyAuthToken(token);

                    if (authResult.authenticated && authResult.userId === parseInt(userId.toString(), 10)) {
                        socket.data.userId = authResult.userId;
                        socket.data.authenticated = true;
                        socket.data.authToken = token;

                        // Rejoindre automatiquement la room utilisateur
                        const roomName = `user_${authResult.userId}`;
                        socket.join(roomName);

                        // Initialiser la liste des rooms
                        socket.data.rooms = [roomName];

                        console.log(`Socket ${socket.id}: Authentifié automatiquement pour l'utilisateur ${authResult.userId}`);
                        return next();
                    } else {
                        // Le token est invalide, mais on permet quand même la connexion
                        // L'authentification pourra être effectuée plus tard
                        socket.data.authenticated = false;
                        return next();
                    }
                } catch (error) {
                    console.error('Erreur dans le middleware d\'authentification WebSocket:', error);
                    socket.data.authenticated = false;
                    return next();
                }
            });

            newIo.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
                console.log(`Socket connecté: ${socket.id}, Authentifié: ${socket.data.authenticated || false}`);

                // Initialiser la liste des rooms du socket si non définie
                if (!socket.data.rooms) {
                    socket.data.rooms = [];
                }

                socket.on('USER_AUTHENTICATION_WEBSOCKET', async (payload) => {
                    if (!payload || !payload.userId) {
                        console.warn(`Socket ${socket.id}: USER_AUTHENTICATION_WEBSOCKET reçu sans userId valide.`);
                        socket.emit('auth_error', 'Identifiant utilisateur manquant');
                        return;
                    }

                    try {
                        // Si un token est fourni, vérifier son authenticité
                        if (payload.token) {
                            const authResult = await verifyAuthToken(payload.token);

                            if (authResult.authenticated && authResult.userId === payload.userId) {
                                // Authentification réussie avec token
                                socket.data.userId = payload.userId;
                                socket.data.authenticated = true;
                                socket.data.authToken = payload.token;

                                const roomName = `user_${payload.userId}`;

                                // Rejoindre la room utilisateur si pas déjà fait
                                if (!socket.data.rooms?.includes(roomName)) {
                                    socket.join(roomName);
                                    socket.data.rooms?.push(roomName);
                                }

                                console.log(`Socket ${socket.id}: Authentification réussie avec token pour l'utilisateur ${payload.userId}`);
                                return;
                            }

                            console.warn(`Socket ${socket.id}: Token invalide pour l'utilisateur ${payload.userId}`);
                            socket.emit('auth_error', 'Token invalide');
                            return;
                        }

                        // Authentification sans token (à éviter en production)
                        if (process.env.NODE_ENV === 'development') {
                            console.warn(`Socket ${socket.id}: Authentification sans token en mode développement pour l'utilisateur ${payload.userId}`);
                            socket.data.userId = payload.userId;
                            socket.data.authenticated = true;

                            const roomName = `user_${payload.userId}`;

                            // Rejoindre la room utilisateur si pas déjà fait
                            if (!socket.data.rooms?.includes(roomName)) {
                                socket.join(roomName);
                                socket.data.rooms?.push(roomName);
                            }
                        } else {
                            console.warn(`Socket ${socket.id}: Tentative d'authentification sans token rejetée en production`);
                            socket.emit('auth_error', 'Token d\'authentification requis');
                        }
                    } catch (error) {
                        console.error(`Socket ${socket.id}: Erreur lors de l'authentification:`, error);
                        socket.emit('auth_error', 'Erreur lors de l\'authentification');
                    }
                });

                // Gestion des abonnements aux rooms
                socket.on('join_room', (room) => {
                    // Vérifier si l'utilisateur est authentifié
                    if (!socket.data.authenticated) {
                        console.warn(`Socket ${socket.id}: Tentative non authentifiée de rejoindre la room ${room}`);
                        socket.emit('auth_error', 'Authentification requise pour rejoindre une room');
                        return;
                    }

                    // Validation basique pour éviter les abus
                    if (typeof room !== 'string' || room.length > 100) {
                        console.warn(`Socket ${socket.id}: Tentative de rejoindre une room invalide.`);
                        return;
                    }

                    socket.join(room);

                    // Ajouter à la liste des rooms du socket
                    if (socket.data.rooms) {
                        if (!socket.data.rooms.includes(room)) {
                            socket.data.rooms.push(room);
                        }
                    } else {
                        socket.data.rooms = [room];
                    }

                    console.log(`Socket ${socket.id}: A rejoint la room ${room}`);
                });

                socket.on('leave_room', (room) => {
                    socket.leave(room);

                    // Mettre à jour la liste des rooms du socket
                    if (socket.data.rooms) {
                        socket.data.rooms = socket.data.rooms.filter(r => r !== room);
                    }

                    console.log(`Socket ${socket.id}: A quitté la room ${room}`);
                });

                socket.on('disconnect', () => {
                    console.log(`Socket déconnecté: ${socket.id}`);
                });
            });

            res.socket.server.io = newIo;
            io = newIo;
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du serveur WebSocket:', error);
            io = null;
            return null;
        }
    } else {
        if (!io) {
            io = res.socket.server.io;
        } else if (io !== res.socket.server.io) {
            console.warn('Instances io multiples détectées. Synchronisation avec res.socket.server.io.');
            io = res.socket.server.io;
        }
    }
    return io;
};

// Fonctions utilitaires pour émettre des événements

/**
 * Émet un événement de notification à un utilisateur spécifique
 */
export function emitNotification(userId: number, notification: any) {
    if (!io) {
        console.warn('Émission de notification impossible: instance io non initialisée');
        return false;
    }

    const roomName = `user_${userId}`;
    io.to(roomName).emit('new_notification', notification);
    return true;
}

/**
 * Émet un événement de mise à jour des notifications lues
 */
export function emitNotificationsReadUpdate(userId: number, count: number, all: boolean = false) {
    if (!io) {
        console.warn('Émission de mise à jour impossible: instance io non initialisée');
        return false;
    }

    const roomName = `user_${userId}`;
    io.to(roomName).emit('notifications_read_update', { count, all });
    return true;
}

/**
 * Émet un événement de nouveau message contextuel
 */
export function emitNewContextualMessage(message: any) {
    if (!io) {
        console.warn('Émission de message impossible: instance io non initialisée');
        return false;
    }

    const rooms = [];

    // Déterminer les rooms concernées par le message
    if (message.assignmentId) {
        rooms.push(`assignment_${message.assignmentId}`);
    }
    if (message.contextDate) {
        // Formater la date au format YYYY-MM-DD pour la room
        const date = new Date(message.contextDate);
        const formattedDate = date.toISOString().split('T')[0];
        rooms.push(`date_${formattedDate}`);
    }
    if (message.requestId) {
        rooms.push(`request_${message.requestId}`);
    }

    // Émettre vers toutes les rooms concernées
    rooms.forEach(room => {
        io?.to(room).emit('new_contextual_message', message);
    });

    return true;
}

/**
 * Émet un événement de mise à jour de message contextuel
 */
export function emitUpdatedContextualMessage(message: any) {
    if (!io) {
        console.warn('Émission de mise à jour de message impossible: instance io non initialisée');
        return false;
    }

    const rooms = [];

    // Déterminer les rooms concernées par le message
    if (message.assignmentId) {
        rooms.push(`assignment_${message.assignmentId}`);
    }
    if (message.contextDate) {
        // Formater la date au format YYYY-MM-DD pour la room
        const date = new Date(message.contextDate);
        const formattedDate = date.toISOString().split('T')[0];
        rooms.push(`date_${formattedDate}`);
    }
    if (message.requestId) {
        rooms.push(`request_${message.requestId}`);
    }

    // Émettre vers toutes les rooms concernées
    rooms.forEach(room => {
        io?.to(room).emit('updated_contextual_message', message);
    });

    return true;
}

/**
 * Émet un événement de suppression de message contextuel
 */
export function emitDeletedContextualMessage(messageId: string, contextInfo: {
    assignmentId?: string,
    contextDate?: Date | string,
    requestId?: string
}) {
    if (!io) {
        console.warn('Émission de suppression de message impossible: instance io non initialisée');
        return false;
    }

    const rooms = [];

    // Déterminer les rooms concernées par le message
    if (contextInfo.assignmentId) {
        rooms.push(`assignment_${contextInfo.assignmentId}`);
    }
    if (contextInfo.contextDate) {
        // Formater la date au format YYYY-MM-DD pour la room
        const date = new Date(contextInfo.contextDate);
        const formattedDate = date.toISOString().split('T')[0];
        rooms.push(`date_${formattedDate}`);
    }
    if (contextInfo.requestId) {
        rooms.push(`request_${contextInfo.requestId}`);
    }

    // Émettre vers toutes les rooms concernées
    rooms.forEach(room => {
        io?.to(room).emit('deleted_contextual_message', messageId);
    });

    return true;
} 