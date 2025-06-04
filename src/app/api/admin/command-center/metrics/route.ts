import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminRateLimit } from '@/lib/rateLimit';
import { startOfDay, endOfDay, subWeeks, subDays } from 'date-fns';

async function handler(req: NextRequest) {
  try {
    const today = new Date();
    const startToday = startOfDay(today);
    const endToday = endOfDay(today);
    const weekAgo = subWeeks(today, 1);

    // Récupérer les absences du jour
    const absencesToday = await prisma.leave.count({
      where: {
        status: 'APPROVED',
        startDate: { lte: endToday },
        endDate: { gte: startToday }
      }
    });

    // Récupérer le personnel surchargé (>48h/semaine)
    const overloadedStaff = await prisma.user.count({
      where: {
        assignments: {
          some: {
            date: {
              gte: startOfDay(subDays(today, 7)),
              lte: endToday
            }
          }
        }
      }
    });

    // Récupérer les violations de règles actives (using RuleConflict model)
    const ruleViolations = await prisma.ruleConflict.count({
      where: {
        resolved: false,
        createdAt: { gte: subDays(today, 7) }
      }
    });

    // Récupérer les demandes en attente (using Leave model with PENDING status)
    const pendingRequests = await prisma.leave.count({
      where: {
        status: 'PENDING'
      }
    });

    // Récupérer les alertes critiques (using LeaveRequestAlert model)
    const leaveAlerts = await prisma.leaveRequestAlert.findMany({
      where: {
        generatedAt: { gte: subDays(today, 2) }
      },
      orderBy: {
        generatedAt: 'desc'
      },
      take: 10,
      include: {
        leave: {
          include: {
            user: {
              select: {
                nom: true,
                prenom: true
              }
            }
          }
        }
      }
    });

    // Transform to expected alert format
    const criticalAlerts = leaveAlerts.map(alert => ({
      id: alert.id.toString(),
      type: 'absence' as const,
      severity: alert.ruleCode.includes('CRITICAL') ? 'high' as const : 'medium' as const,
      title: `Alerte congé - ${alert.leave.user.nom} ${alert.leave.user.prenom}`,
      description: alert.messageDetails,
      timestamp: alert.generatedAt,
      actionRequired: true,
      actionType: 'validate' as const,
      relatedId: alert.leaveId
    }));

    // Calculer les tendances hebdomadaires
    const previousWeekAbsences = await prisma.leave.count({
      where: {
        status: 'APPROVED',
        startDate: { lte: endOfDay(subWeeks(today, 1)) },
        endDate: { gte: startOfDay(subWeeks(today, 2)) }
      }
    });

    const previousWeekViolations = await prisma.ruleConflict.count({
      where: {
        createdAt: {
          gte: subWeeks(today, 2),
          lte: subWeeks(today, 1)
        }
      }
    });

    // Calculer la charge de travail (exemple simplifié)
    const totalStaff = await prisma.user.count({
      where: { role: { in: ['MAR', 'IADE'] } }
    });
    
    const workloadPercentage = totalStaff > 0 
      ? Math.round((overloadedStaff / totalStaff) * 100)
      : 0;

    const weeklyTrends = {
      absences: absencesToday - previousWeekAbsences,
      violations: ruleViolations - previousWeekViolations,
      workload: workloadPercentage
    };

    return NextResponse.json({
      absencesToday,
      overloadedStaff,
      ruleViolations,
      pendingRequests,
      criticalAlerts,
      weeklyTrends
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des métriques:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export const GET = withAdminRateLimit(handler);