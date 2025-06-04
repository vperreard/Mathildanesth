import { NextRequest, NextResponse } from 'next/server';
import {
  analyticsService,
  LeavePeakAggregationUnit,
} from '@/modules/analytics/services/analyticsService';
import { LeaveType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { getLeavePeakAnalysis } from '@/services/analyticsService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDateString = searchParams.get('startDate');
  const endDateString = searchParams.get('endDate');
  const aggregationUnitString = searchParams.get('aggregationUnit');
  const leaveTypesString = searchParams.get('leaveTypes');
  const siteId = searchParams.get('siteId') || undefined;

  if (!startDateString || !endDateString || !aggregationUnitString) {
    return NextResponse.json(
      { error: 'startDate, endDate, and aggregationUnit are required' },
      { status: 400 }
    );
  }

  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json(
      { error: 'Invalid date format for startDate or endDate' },
      { status: 400 }
    );
  }

  const aggregationUnit = aggregationUnitString.toUpperCase() as LeavePeakAggregationUnit;
  if (!['DAY', 'WEEK', 'MONTH'].includes(aggregationUnit)) {
    return NextResponse.json(
      { error: 'Invalid aggregationUnit. Must be DAY, WEEK, or MONTH' },
      { status: 400 }
    );
  }

  let leaveTypes: LeaveType[] | undefined = undefined;
  if (leaveTypesString) {
    leaveTypes = leaveTypesString.split(',') as LeaveType[];
    const validLeaveTypes = Object.values(LeaveType);
    if (leaveTypes.some(lt => !validLeaveTypes.includes(lt))) {
      return NextResponse.json(
        { error: 'Invalid leaveType provided. Valid types are: ' + validLeaveTypes.join(', ') },
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

    const stats = await analyticsService.getLeavePeakAnalysis({
      startDate,
      endDate,
      aggregationUnit,
      leaveTypes,
      siteId,
    });

    // Récupérer l'analyse des pics de demandes de congés
    const peakAnalysis = await getLeavePeakAnalysis();

    // Ajouter des métadonnées à la réponse
    const metadata = {
      timeRange: '12 derniers mois',
      generatedAt: new Date().toISOString(),
      correlationFactors: ['Vacances scolaires', 'Jours fériés', 'Périodes de forte activité'],
    };

    // Structurer la réponse
    return NextResponse.json({
      success: true,
      data: stats,
      metadata,
    });
  } catch (error) {
    console.error("Erreur lors de l'analyse des pics de congés:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de l'analyse des pics de congés",
      },
      { status: 500 }
    );
  }
}
