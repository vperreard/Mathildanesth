import { NextRequest, NextResponse } from 'next/server';
import { Prisma, NotificationType, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createNotification } from '@/lib/notifications';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || typeof session.user.id !== 'number') {
        return NextResponse.json({ error: 'Non autorisé ou session invalide' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const filter = searchParams.get('filter');

    const skip = (page - 1) * limit;

    let whereClause: Prisma.NotificationWhereInput = { userId };
    if (filter === 'read') {
        whereClause.isRead = true;
    } else if (filter === 'unread') {
        whereClause.isRead = false;
    }

    try {
        const notifications = await prisma.notification.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc',
            },
            skip: skip,
            take: limit,
            include: {
                triggeredByUser: { select: { id: true, login: true } },
            }
        });

        const totalNotifications = await prisma.notification.count({
            where: whereClause,
        });

        const unreadCount = await prisma.notification.count({
            where: {
                userId,
                isRead: false,
            }
        });

        return NextResponse.json({
            notifications,
            totalPages: Math.ceil(totalNotifications / limit),
            currentPage: page,
            totalNotifications,
            unreadCount,
        }, { status: 200 });

    } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}

interface NotificationCreationRequest {
    recipientIds: number[];
    type: string;
    title?: string;
    message: string;
    link?: string;
    relatedData?: Prisma.InputJsonValue;
    relatedLeaveId?: number;
    relatedAssignmentId?: string;
    relatedRequestId?: string;
    relatedContextualMessageId?: string;
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user ||
        typeof session.user.id !== 'number' ||
        typeof session.user.role !== 'string') {
        return NextResponse.json({ error: 'Non autorisé ou session invalide' }, { status: 401 });
    }

    if (session.user.role !== Role.ADMIN_TOTAL) {
        return NextResponse.json({ error: 'Action non autorisée. Droits administrateur requis.' }, { status: 403 });
    }
    const adminUserId = session.user.id;

    try {
        const body = await req.json() as NotificationCreationRequest;
        const {
            recipientIds,
            type,
            message,
            link,
            relatedLeaveId,
            relatedAssignmentId,
            relatedRequestId,
            relatedContextualMessageId
        } = body;

        if (!Array.isArray(recipientIds) || recipientIds.some(id => typeof id !== 'number' || isNaN(id)) || recipientIds.length === 0) {
            return NextResponse.json({ error: 'recipientIds doit être un tableau de nombres valide et non vide.' }, { status: 400 });
        }
        if (!type || !message) {
            return NextResponse.json({ error: 'Les champs type et message sont requis.' }, { status: 400 });
        }

        if (!(type in NotificationType)) {
            return NextResponse.json({ error: `Type de notification invalide: ${type}. Types valides: ${Object.keys(NotificationType).join(', ')}` }, { status: 400 });
        }
        const notificationTypeValidated = type as NotificationType;

        const creationPromises = recipientIds.map(userId => createNotification({
            userId,
            type: notificationTypeValidated,
            message,
            link,
            triggeredByUserId: adminUserId,
            relatedAssignmentId,
            relatedRequestId,
            relatedContextualMessageId
        }));

        const results = await Promise.all(creationPromises);
        const createdCount = results.filter(Boolean).length;

        return NextResponse.json({
            message: `${createdCount} notification(s) créée(s) avec succès.`,
            failedCount: recipientIds.length - createdCount
        }, { status: 201 });

    } catch (error) {
        console.error("API Notifications POST: Erreur lors de la création des notifications:", error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: 'Données JSON invalides' }, { status: 400 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003' || error.code === 'P2025') {
                return NextResponse.json({ error: 'Erreur de référence: Un des IDs fournis (utilisateur, etc.) n\'existe pas.' }, { status: 400 });
            }
        }
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
} 