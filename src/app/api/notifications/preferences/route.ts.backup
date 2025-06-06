import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/authOptions';

/**
 * GET /api/notifications/preferences
 * Récupère les préférences de notifications de l'utilisateur
 */
export async function GET(request: NextRequest) {
  logger.info('\n--- GET /api/notifications/preferences START ---');

  // Authentification
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    logger.error('GET /api/notifications/preferences: Utilisateur non authentifié');
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const userId = parseInt(session.user.id.toString(), 10);

  try {
    // Récupérer les préférences de l'utilisateur
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Si aucune préférence n'existe, en créer une avec les valeurs par défaut
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: { userId },
      });
    }

    logger.info(
      `GET /api/notifications/preferences: Préférences récupérées pour l'utilisateur ${userId}`
    );
    logger.info('--- GET /api/notifications/preferences END ---\n');

    return NextResponse.json(preferences);
  } catch (error: unknown) {
    logger.error('GET /api/notifications/preferences: Erreur serveur', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération des préférences de notifications',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/preferences
 * Met à jour les préférences de notifications de l'utilisateur
 */
export async function PUT(request: NextRequest) {
  logger.info('\n--- PUT /api/notifications/preferences START ---');

  // Authentification
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    logger.error('PUT /api/notifications/preferences: Utilisateur non authentifié');
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const userId = parseInt(session.user.id.toString(), 10);

  try {
    const body = await request.json();
    logger.info('PUT /api/notifications/preferences - Body:', body);

    // Nettoyer les données reçues pour ne garder que les champs valides
    const validFields = [
      'assignmentReminders',
      'assignmentSwapRequests',
      'assignmentSwapResponses',
      'assignmentSwapAdminActions',
      'contextualMessages',
      'mentionsInMessages',
      'planningUpdates',
      'leaveRequestStatusChanges',
      'openShifts',
      'teamPlanningPublished',
      'emailEnabled',
      'inAppEnabled',
      'pushEnabled',
      'quietHoursEnabled',
      'quietHoursStart',
      'quietHoursEnd',
      'quietHoursDays',
    ];

    const updateData: Record<string, unknown> = {};
    Object.keys(body).forEach(key => {
      if (validFields.includes(key)) {
        updateData[key] = body[key];
      }
    });

    // Vérifier si des données valides ont été fournies
    if (Object.keys(updateData).length === 0) {
      logger.warn('PUT /api/notifications/preferences: Aucune donnée valide fournie');
      return NextResponse.json(
        {
          error: 'Aucune donnée valide fournie pour la mise à jour',
        },
        { status: 400 }
      );
    }

    // Mettre à jour ou créer les préférences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
      },
    });

    logger.info(
      `PUT /api/notifications/preferences: Préférences mises à jour pour l'utilisateur ${userId}`
    );
    logger.info('--- PUT /api/notifications/preferences END ---\n');

    return NextResponse.json(preferences);
  } catch (error: unknown) {
    logger.error('PUT /api/notifications/preferences: Erreur serveur', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      {
        error: 'Erreur lors de la mise à jour des préférences de notifications',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
