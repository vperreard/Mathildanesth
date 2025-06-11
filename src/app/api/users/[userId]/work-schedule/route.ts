import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { WorkFrequency, WeekType } from '@/modules/profiles/types/workSchedule';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: userIdParam } = await params;
    const userId = parseInt(userIdParam, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Pour l'instant, retourner un emploi du temps par défaut
    // TODO: Récupérer l'emploi du temps réel depuis la base de données
    const defaultWorkSchedule = {
      id: `work-schedule-${userId}`,
      userId: userId,
      frequency: WorkFrequency.FULL_TIME,
      weekType: WeekType.BOTH,
      workingDays: [1, 2, 3, 4, 5], // Lundi à vendredi
      workingTimePercentage: 100,
      annualLeaveAllowance: 25, // 25 jours de congés par an par défaut
      isActive: true,
      validFrom: new Date('2025-01-01'),
    };

    logger.info(`Work schedule récupéré pour l'utilisateur ${userId}`);

    return NextResponse.json(defaultWorkSchedule);
  } catch (error: unknown) {
    logger.error("Erreur lors de la récupération de l'emploi du temps:", { error });
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération de l'emploi du temps" },
      { status: 500 }
    );
  }
}
