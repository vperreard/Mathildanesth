import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { PrismaClient, NotificationType } from '@prisma/client';
import { getServerSession } from '@/lib/auth/migration-shim';
import { authOptions } from '@/lib/auth/migration-shim';

import { prisma } from '@/lib/prisma';

/**
 * Interface pour les paramètres de requête
 */
interface ReadNotificationsRequest {
  id?: string; // ID d'une notification spécifique
  relatedRequestId?: string; // ID d'une demande/ressource associée (ex: AssignmentSwapRequest)
  types?: NotificationType[]; // Types de notifications à marquer comme lues
  all?: boolean; // Si true, marque toutes les notifications de l'utilisateur comme lues
}

/**
 * POST /api/notifications/read
 * Marque des notifications comme lues en fonction de différents critères
 */
export async function POST(request: NextRequest) {
  logger.info('\n--- POST /api/notifications/read START ---');

  // Authentification
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    logger.error('POST /api/notifications/read: Utilisateur non authentifié');
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const userId = parseInt(session.user.id.toString(), 10);

  try {
    const body: ReadNotificationsRequest = await request.json();
    logger.info('POST /api/notifications/read - Body:', body);

    // Construire la requête WHERE
    const whereClause: any = {
      userId,
      isRead: false, // On ne marque que celles qui ne sont pas déjà lues
    };

    // Filtrer par ID spécifique
    if (body.id) {
      whereClause.id = body.id;
    }

    // Filtrer par ID de demande associée
    if (body.relatedRequestId) {
      whereClause.relatedRequestId = body.relatedRequestId;
    }

    // Filtrer par types
    if (body.types && body.types.length > 0) {
      whereClause.type = {
        in: body.types,
      };
    }

    // Si aucun critère n'est spécifié et "all" n'est pas true, c'est une erreur
    if (
      !body.id &&
      !body.relatedRequestId &&
      (!body.types || body.types.length === 0) &&
      !body.all
    ) {
      logger.warn('POST /api/notifications/read: Aucun critère spécifié');
      return NextResponse.json(
        {
          error: 'Au moins un critère (id, relatedRequestId, types) ou all=true doit être spécifié',
        },
        { status: 400 }
      );
    }

    // Si "all" est true, ne garder que userId et isRead
    if (body.all) {
      delete whereClause.id;
      delete whereClause.relatedRequestId;
      delete whereClause.type;
    }

    // Récupérer les notifications correspondantes pour vérification
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      select: { id: true },
    });

    if (notifications.length === 0) {
      logger.info('POST /api/notifications/read: Aucune notification trouvée avec les critères');
      return NextResponse.json({
        message: 'Aucune notification à marquer comme lue',
        updatedCount: 0,
      });
    }

    // Mettre à jour les notifications
    const notificationIds = notifications.map(n => n.id);
    const result = await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
      },
      data: {
        isRead: true,
      },
    });

    logger.info(
      `POST /api/notifications/read: ${result.count} notification(s) marquée(s) comme lue(s)`
    );

    // Récupérer le nombre de notifications non lues restantes
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    logger.info(
      `POST /api/notifications/read: Il reste ${unreadCount} notification(s) non lue(s) pour l'utilisateur`
    );
    logger.info('--- POST /api/notifications/read END ---\n');

    return NextResponse.json({
      message: `${result.count} notification(s) marquée(s) comme lue(s)`,
      updatedCount: result.count,
      unreadCount,
    });
  } catch (error: unknown) {
    logger.error('POST /api/notifications/read: Erreur serveur', { error: error });
    return NextResponse.json(
      {
        error: 'Erreur lors du marquage des notifications comme lues',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
