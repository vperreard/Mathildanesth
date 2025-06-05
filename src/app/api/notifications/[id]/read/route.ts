import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { verifyAuthToken } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = req.cookies.get('auth_token')?.value;
        if (!token) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        const { authenticated, payload } = await verifyAuthToken(token);
        if (!authenticated) {
            return NextResponse.json(
                { error: 'Token invalide' },
                { status: 401 }
            );
        }

        const prisma = prisma;
        const notification = await prisma.notification.update({
            where: {
                id: parseInt(params.id),
                userId: payload.userId
            },
            data: {
                read: true
            }
        });

        await prisma.$disconnect();

        return NextResponse.json({ notification });
    } catch (error: unknown) {
        logger.error('Erreur lors du marquage de la notification:', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
} 