import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { analyticsService } from '@/modules/analytics/services/analyticsService';
import { ActivityCategory, ProfessionalRole } from '@prisma/client'; // Import enums
import { getServerSession } from '@/lib/auth/migration-shim';
import { authOptions } from '@/lib/auth/migration-shim';
import { getGuardDutyDistributionStats } from '@/services/analyticsService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDateString = searchParams.get('startDate');
  const endDateString = searchParams.get('endDate');
  const siteId = searchParams.get('siteId') || undefined;
  const rolesString = searchParams.get('roles');

  if (!startDateString || !endDateString) {
    return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
  }

  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json(
      { error: 'Invalid date format for startDate or endDate' },
      { status: 400 }
    );
  }

  let roles: ProfessionalRole[] | undefined = undefined;
  if (rolesString) {
    roles = rolesString.split(',') as ProfessionalRole[];
    // Basic validation if roles are valid ProfessionalRole enum values
    const validRoles = Object.values(ProfessionalRole);
    if (roles.some(role => !validRoles.includes(role))) {
      return NextResponse.json(
        { error: 'Invalid role provided. Valid roles are: ' + validRoles.join(', ') },
        { status: 400 }
      );
    }
  }

  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const stats = await analyticsService.getGuardDutyDistributionStats(
      startDate,
      endDate,
      siteId,
      roles
    );
    return NextResponse.json(stats);
  } catch (error: unknown) {
    logger.error('Erreur lors de la récupération des statistiques de distribution:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des statistiques',
      },
      { status: 500 }
    );
  }
}
