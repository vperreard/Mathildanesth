import { NextRequest, NextResponse } from 'next/server';

import { logger } from "@/lib/logger";
export async function GET(req: NextRequest) {
    try {
        // Pour l'instant, retourner des stats simulées
        // Dans un environnement de production, ces données viendraient de Redis
        const stats = {
            auth: {
                tokens: 42,
                users: 38,
                permissions: 76
            },
            prisma: {
                queries: 234,
                planning: 56,
                sectors: 12,
                rooms: 28,
                leaveBalances: 89
            }
        };

        return NextResponse.json(stats);
    } catch (error) {
        logger.error('Failed to fetch cache stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch cache stats' },
            { status: 500 }
        );
    }
}