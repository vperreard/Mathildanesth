import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { io } from '@/lib/socket';

interface MarkAsReadRequest {
    notificationIds?: string[];  // IDs spécifiques à marquer comme lus, null/undefined pour marquer tout
    all?: boolean;               // Si true, marque toutes les notifications de l'utilisateur comme lues
}

/**
 * POST /api/notifications/mark-as-read
 * Marque une ou plusieurs notifications comme lues
 */
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || typeof session.user.id !== 'number') {
        return NextResponse.json({ error: 'Non autorisé ou session invalide' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json() as MarkAsReadRequest;
        const { notificationIds, all } = body;

        // Validation des paramètres
        if (!all && (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0)) {
            return NextResponse.json({
                error: 'Paramètres invalides. Fournissez soit "all: true" pour marquer toutes les notifications comme lues, soit un tableau "notificationIds" non vide.'
            }, { status: 400 });
        }

        let updatedCount = 0;

        // Marquer toutes les notifications non lues de l'utilisateur comme lues
        if (all) {
            const result = await prisma.notification.updateMany({
                where: {
                    userId,
                    isRead: false
                },
                data: {
                    isRead: true
                }
            });
            updatedCount = result.count;
        }
        // Marquer des notifications spécifiques comme lues
        else if (notificationIds && notificationIds.length > 0) {
            // D'abord vérifier que les notifications appartiennent bien à l'utilisateur
            const userNotifications = await prisma.notification.findMany({
                where: {
                    id: { in: notificationIds },
                    userId,
                    isRead: false  // On ne compte que celles qui n'étaient pas déjà lues
                },
                select: { id: true }
            });

            if (userNotifications.length > 0) {
                const userNotificationIds = userNotifications.map(n => n.id);
                const result = await prisma.notification.updateMany({
                    where: {
                        id: { in: userNotificationIds }
                    },
                    data: {
                        isRead: true
                    }
                });
                updatedCount = result.count;
            }
        }

        // Si des WebSockets sont utilisés, émettre un événement pour mettre à jour l'interface
        if (io && updatedCount > 0) {
            const roomName = `user_${userId}`;
            io.to(roomName).emit('notifications_read_update', {
                count: updatedCount,
                all
            });
        }

        // Récupérer le compte des notifications non lues qui restent
        const unreadCount = await prisma.notification.count({
            where: {
                userId,
                isRead: false
            }
        });

        return NextResponse.json({
            message: `${updatedCount} notification(s) marquée(s) comme lue(s).`,
            updatedCount,
            unreadCount
        }, { status: 200 });

    } catch (error) {
        console.error('Erreur lors du marquage des notifications comme lues:', error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: 'Données JSON invalides' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
} 