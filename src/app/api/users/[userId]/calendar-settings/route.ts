import { NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/utilisateurs/[userId]/calendrier-settings
export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur a le droit d'accéder à ces paramètres
    const userId = parseInt(params.userId);
    if (session.user.id !== userId && session.user.role !== 'ADMIN_TOTAL') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Récupérer les paramètres de l'utilisateur
    const settings = await prisma.userCalendarSettings.findUnique({
      where: {
        userId: userId,
      },
    });

    // Si aucun paramètre n'existe, retourner les valeurs par défaut
    if (!settings) {
      return NextResponse.json({
        defaultView: 'month',
        showWeekends: true,
        showHolidays: true,
        showRejectedLeaves: false,
        colorScheme: 'default',
        startWeekOn: 'monday',
        timeFormat: '24h',
        notifications: {
          email: true,
          browser: true,
          sound: false,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    logger.error('Erreur lors de la récupération des paramètres:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    );
  }
}

// PUT /api/utilisateurs/[userId]/calendrier-settings
export async function PUT(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur a le droit de modifier ces paramètres
    const userId = parseInt(params.userId);
    if (session.user.id !== userId && session.user.role !== 'ADMIN_TOTAL') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const body = await request.json();

    // Mettre à jour ou créer les paramètres
    const settings = await prisma.userCalendarSettings.upsert({
      where: {
        userId: userId,
      },
      update: {
        defaultView: body.defaultView,
        showWeekends: body.showWeekends,
        showHolidays: body.showHolidays,
        showRejectedLeaves: body.showRejectedLeaves,
        colorScheme: body.colorScheme,
        startWeekOn: body.startWeekOn,
        timeFormat: body.timeFormat,
        notifications: body.notifications,
      },
      create: {
        userId: userId,
        defaultView: body.defaultView,
        showWeekends: body.showWeekends,
        showHolidays: body.showHolidays,
        showRejectedLeaves: body.showRejectedLeaves,
        colorScheme: body.colorScheme,
        startWeekOn: body.startWeekOn,
        timeFormat: body.timeFormat,
        notifications: body.notifications,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    logger.error('Erreur lors de la mise à jour des paramètres:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des paramètres' },
      { status: 500 }
    );
  }
}
