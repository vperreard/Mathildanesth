import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-utils';
import { PrismaClient } from '@prisma/client';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
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

        const prisma = new PrismaClient();
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
    } catch (error) {
        console.error('Erreur lors du marquage de la notification:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
} 