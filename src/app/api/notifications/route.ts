import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, UserJWTPayload, getAuthToken } from '@/lib/auth-utils';
import { PrismaClient } from '@prisma/client';

export async function GET(req: NextRequest) {
    try {
        const token = await getAuthToken();
        if (!token) {
            console.log("API Notifications: Aucun token trouvé via getAuthToken.");
            return NextResponse.json({ error: 'Non authentifié - Aucun token' }, { status: 401 });
        }

        const authResult = await verifyAuthToken(token);

        if (!authResult.authenticated || !authResult.user) {
            console.log("API Notifications: Token invalide ou utilisateur non authentifié via verifyAuthToken.", authResult);
            return NextResponse.json({ error: 'Non authentifié - Token invalide' }, { status: 401 });
        }

        // Utiliser UserJWTPayload pour un typage plus sûr
        const payload = authResult.user as Partial<UserJWTPayload>;
        let userIdNumber: number | undefined;

        if (payload.userId !== undefined) {
            userIdNumber = typeof payload.userId === 'string'
                ? parseInt(payload.userId, 10)
                : payload.userId;
        }

        if (userIdNumber === undefined || isNaN(userIdNumber)) {
            console.error("API Notifications: userId invalide dans le token après vérification:", payload);
            return NextResponse.json({ error: 'ID utilisateur invalide dans le token' }, { status: 400 });
        }

        console.log(`API Notifications: Utilisateur authentifié avec userId: ${userIdNumber}`);
        return fetchNotifications(userIdNumber);

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
        const token = await getAuthToken();
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

        const userPayload = authResult.user as Partial<UserJWTPayload>;
        let creatorUserIdNumber: number | undefined;

        if (userPayload.userId !== undefined) {
            creatorUserIdNumber = typeof userPayload.userId === 'string'
                ? parseInt(userPayload.userId, 10)
                : userPayload.userId;
        }

        if (creatorUserIdNumber === undefined || isNaN(creatorUserIdNumber)) {
            console.error("API Notifications POST: creatorUserId invalide dans le token:", userPayload);
            return NextResponse.json({ error: 'ID utilisateur créateur invalide dans le token' }, { status: 400 });
        }

        const { type, title, message, recipientIds } = await req.json();

        if (!Array.isArray(recipientIds) || recipientIds.some(id => typeof id !== 'number' || isNaN(id))) {
            return NextResponse.json({ error: 'recipientIds doit être un tableau de nombres valides.' }, { status: 400 });
        }

        const prisma = new PrismaClient();
        const notifications = await Promise.all(
            recipientIds.map((recipientId: number) =>
                prisma.notification.create({
                    data: {
                        type,
                        title,
                        message,
                        userId: recipientId,
                        createdBy: creatorUserIdNumber
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