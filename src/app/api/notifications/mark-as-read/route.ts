import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/authOptions';
import { emitNotificationsReadUpdate } from '@/lib/socket';

interface MarkAsReadRequest {
  notificationIds?: string[]; // IDs spécifiques à marquer comme lus, null/undefined pour marquer tout
  all?: boolean; // Si true, marque toutes les notifications de l'utilisateur comme lues
}

/**
 * POST /api/notifications/mark-as-read
 * Marque une ou plusieurs notifications comme lues
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || typeof session.user.id !== 'number') {
    return NextResponse.json(
      {
        error: 'Non autorisé: Vous devez être connecté pour gérer vos notifications',
        code: 'AUTH_REQUIRED',
      },
      { status: 401 }
    );
  }
  const userId = session.user.id;

  try {
    const body = (await req.json()) as MarkAsReadRequest;
    const { notificationIds, all } = body;

    // Validation: il faut spécifier soit une liste d'IDs, soit all=true
    if (!notificationIds?.length && !all) {
      return NextResponse.json(
        {
          error: 'Vous devez spécifier soit "notificationIds" soit "all=true"',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    let updatedCount = 0;

    if (all) {
      // Marquer toutes les notifications non lues de l'utilisateur comme lues
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });
      updatedCount = result.count;
    } else if (notificationIds && notificationIds.length > 0) {
      // Marquer uniquement les notifications spécifiées comme lues
      // En vérifiant qu'elles appartiennent bien à l'utilisateur
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          id: {
            in: notificationIds,
          },
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });
      updatedCount = result.count;
    }

    // Émettre un événement WebSocket pour mettre à jour les compteurs en temps réel
    emitNotificationsReadUpdate(userId, updatedCount, !!all);

    // Récupérer le nombre restant de notifications non lues
    const remainingUnreadCount = await prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      markedAsRead: updatedCount,
      remainingUnread: remainingUnreadCount,
    });
  } catch (error) {
    console.error('Erreur lors du marquage des notifications comme lues:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Données JSON invalides',
          code: 'INVALID_JSON',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Erreur interne du serveur',
        code: 'SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}
