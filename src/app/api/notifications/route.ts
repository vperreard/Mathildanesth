import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-utils';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        // Utiliser Next-Auth pour l'authentification
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        // S'assurer que userId est un nombre
        const userId = typeof session.user.id === 'string'
            ? parseInt(session.user.id, 10)
            : session.user.id as number;

        // Fallback sur l'ancien système de token si nécessaire
        if (isNaN(userId)) {
            const token = req.cookies.get('auth_token')?.value;
            if (!token) {
                return NextResponse.json(
                    { error: 'Non authentifié' },
                    { status: 401 }
                );
            }

            const authResult = await verifyAuthToken(token);
            if (!authResult.authenticated || !authResult.user) {
                return NextResponse.json(
                    { error: 'Token invalide' },
                    { status: 401 }
                );
            }

            // S'assurer que l'ID est un nombre
            const tokenUserId = typeof authResult.user.id === 'string'
                ? parseInt(authResult.user.id, 10)
                : authResult.user.id as number;

            if (isNaN(tokenUserId)) {
                return NextResponse.json(
                    { error: 'ID utilisateur invalide' },
                    { status: 400 }
                );
            }

            return fetchNotifications(tokenUserId);
        }

        return fetchNotifications(userId);
    } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

async function fetchNotifications(userId: number) {
    const prisma = new PrismaClient();

    try {
        const notifications = await prisma.notification.findMany({
            where: {
                userId: userId,
                read: false
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        });

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error('Erreur lors de la récupération des notifications de la base de données:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get('auth_token')?.value;
        if (!token) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        const authResult = await verifyAuthToken(token);
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json(
                { error: 'Token invalide' },
                { status: 401 }
            );
        }

        // S'assurer que l'ID est un nombre
        const userId = typeof authResult.user.id === 'string'
            ? parseInt(authResult.user.id, 10)
            : authResult.user.id as number;

        const { type, title, message, recipientIds } = await req.json();

        const prisma = new PrismaClient();
        const notifications = await Promise.all(
            recipientIds.map((recipientId: number) =>
                prisma.notification.create({
                    data: {
                        type,
                        title,
                        message,
                        userId: recipientId,
                        createdBy: userId
                    }
                })
            )
        );

        await prisma.$disconnect();

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error('Erreur lors de la création des notifications:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
} 