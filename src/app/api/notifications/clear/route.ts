import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
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
        await prisma.notification.deleteMany({
            where: {
                userId: payload.userId
            }
        });

        await prisma.$disconnect();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur lors de la suppression des notifications:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
} 