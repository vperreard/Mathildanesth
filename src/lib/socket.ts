import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';

export type NextApiResponseWithSocket = NextApiResponse & {
    socket: {
        server: NetServer & {
            io?: SocketIOServer;
        };
    };
};

let io: SocketIOServer | null = null;

export const initSocket = (res: NextApiResponseWithSocket) => {
    if (!res.socket?.server) {
        console.error('Le serveur WebSocket n\'est pas disponible');
        return null;
    }

    if (!io) {
        try {
            io = new SocketIOServer(res.socket.server, {
                path: '/api/ws',
                addTrailingSlash: false,
                cors: {
                    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
                    methods: ['GET', 'POST'],
                    credentials: true
                }
            });

            io.on('connection', socket => {
                console.log('Client connecté');

                socket.on('sendNotification', (notification) => {
                    io?.emit('notification', notification);
                });

                socket.on('disconnect', () => {
                    console.log('Client déconnecté');
                });
            });

            console.log('Serveur WebSocket initialisé avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du serveur WebSocket:', error);
            return null;
        }
    }

    return io;
}; 