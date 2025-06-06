import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { redis } from '@/lib/redis';

export async function POST(req: NextRequest) {
    try {
        const { type } = await req.json();
        
        let clearedKeys = 0;
        
        switch (type) {
            case 'auth':
                // Vider le cache d'authentification
                const authKeys = await redis.keys('auth:*');
                if (authKeys && authKeys.length > 0) {
                    await redis.del(...authKeys);
                    clearedKeys = authKeys.length;
                }
                break;
                
            case 'prisma':
                // Vider le cache Prisma
                const prismaKeys = await redis.keys('query:*');
                const planningKeys = await redis.keys('planning:*');
                const sectorKeys = await redis.keys('sector:*');
                const roomKeys = await redis.keys('room:*');
                const leaveKeys = await redis.keys('leave:*');
                
                const allPrismaKeys = [
                    ...(prismaKeys || []),
                    ...(planningKeys || []),
                    ...(sectorKeys || []),
                    ...(roomKeys || []),
                    ...(leaveKeys || [])
                ];
                
                if (allPrismaKeys.length > 0) {
                    await redis.del(...allPrismaKeys);
                    clearedKeys = allPrismaKeys.length;
                }
                break;
                
            case 'all':
                // Vider tout le cache
                await redis.flushdb();
                clearedKeys = -1; // Indique que tout a été vidé
                break;
                
            default:
                return NextResponse.json(
                    { error: 'Invalid cache type' },
                    { status: 400 }
                );
        }
        
        return NextResponse.json({ 
            success: true,
            clearedKeys,
            message: `Cache ${type} cleared successfully`
        });
    } catch (error: unknown) {
        logger.error('Failed to clear cache:', { error: error });
        return NextResponse.json(
            { error: 'Failed to clear cache' },
            { status: 500 }
        );
    }
}