import { NextRequest } from 'next/server';
import { logger } from "@/lib/logger";
import { initSocket } from '@/lib/socket';

export async function GET(req: NextRequest) {
    try {
        const res = new Response();
        const io = initSocket(res as any);
        return new Response('WebSocket server initialized', { status: 200 });
    } catch (error: unknown) {
        logger.error('Erreur lors de l\'initialisation du serveur WebSocket:', { error: error });
        return new Response('Erreur serveur', { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    return GET(req);
} 