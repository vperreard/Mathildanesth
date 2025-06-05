declare module 'socket.io-client' {
    import { Socket as SocketIOClient } from 'socket.io-client';
    export const io: (url: string, opts?: unknown) => SocketIOClient;
    export type Socket = SocketIOClient;
} 