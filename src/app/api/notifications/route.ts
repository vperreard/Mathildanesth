import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, getAuthTokenServer } from '@/lib/auth-server-utils';
import type { AuthResult } from '@/lib/auth-client-utils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); // Instance Prisma globale pour ce module

async function fetchNotifications(userId: number) {
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
    return NextResponse.json(notifications);
}

export async function GET(req: NextRequest) {
    try {
        const tokenFromHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
        const tokenFromCookie = await getAuthTokenServer();
        const authToken = tokenFromHeader || tokenFromCookie;

        if (!authToken) {
            console.log("API Notifications GET: Aucun token trouvé.");
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const authResult = await verifyAuthToken(authToken);
        if (!authResult.authenticated || !authResult.userId) {
            return NextResponse.json({ error: authResult.error || 'Session invalide' }, { status: 401 });
        }
        return fetchNotifications(authResult.userId);
    } catch (error) {
        console.error("API Notifications GET: Erreur:", error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

async function clearUserNotifications(userId: number): Promise<NextResponse> {
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

    await Promise.all(notifications.map((notification) =>
        prisma.notification.update({
            where: {
                id: notification.id
            },
            data: {
                read: true
            }
        })
    ));

    return NextResponse.json({ message: 'Notifications supprimées avec succès' });
}

export async function POST(req: NextRequest) {
    try {
        const tokenFromHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
        const tokenFromCookie = await getAuthTokenServer();
        const authToken = tokenFromHeader || tokenFromCookie;

        if (!authToken) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const authResult = await verifyAuthToken(authToken);
        if (!authResult.authenticated || !authResult.userId) {
            return NextResponse.json({ error: authResult.error || 'Session invalide' }, { status: 401 });
        }

        const creatorUserId = authResult.userId;
        const { type, title, message, recipientIds } = await req.json();

        if (!Array.isArray(recipientIds) || recipientIds.some(id => typeof id !== 'number' || isNaN(id))) {
            return NextResponse.json({ error: 'recipientIds doit être un tableau de nombres valides.' }, { status: 400 });
        }
        if (!type || !title || !message) {
            return NextResponse.json({ error: 'Les champs type, title, message sont requis.' }, { status: 400 });
        }

        const createdNotifications = await Promise.all(
            recipientIds.map((recipientId: number) =>
                prisma.notification.create({
                    data: {
                        type: String(type),
                        title: String(title),
                        message: String(message),
                        userId: recipientId,
                        createdBy: creatorUserId,
                        read: false // Par défaut, non lue
                    }
                })
            )
        );
        return NextResponse.json({ notifications: createdNotifications }, { status: 201 });
    } catch (error) {
        console.error("API Notifications POST: Erreur lors de la création des notifications:", error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
} 