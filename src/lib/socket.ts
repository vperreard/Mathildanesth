import { Server as NetServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { NextApiResponse } from 'next';

export type NextApiResponseWithSocket = NextApiResponse & {
    socket: {
        server: NetServer & {
            io?: SocketIOServer;
        };
    };
};

export let io: SocketIOServer | null = null;

interface ClientToServerEvents {
    USER_AUTHENTICATION_WEBSOCKET: (payload: { userId: number }) => void;
}

interface ServerToClientEvents {
    new_notification: (notification: any) => void;
}

interface InterServerEvents { }
interface SocketData { userId?: number; }

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

            newIo.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
                socket.on('USER_AUTHENTICATION_WEBSOCKET', (payload) => {
                    if (payload && payload.userId) {
                        const userIdStr = payload.userId.toString();
                        socket.join(`user_${userIdStr}`);
                        socket.data.userId = payload.userId;
                    } else {
                        console.warn(`Socket ${socket.id}: USER_AUTHENTICATION_WEBSOCKET reçu sans userId valide.`);
                    }
                });

                socket.on('disconnect', () => {
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