import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/migration-shim';
import { authOptions } from '@/lib/auth/migration-shim';
import { formatDate, ISO_DATE_FORMAT } from '@/utils/dateUtils';

/**
 * GET /api/leaves/user-leaves?userId=123&year=2025
 * Récupère les congés d'un utilisateur pour une année donnée
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const year = searchParams.get('year');

    logger.info(`[API /api/leaves/user-leaves] Requête GET reçue`, { userId, year });

    if (!userId) {
      return NextResponse.json({ error: 'Le paramètre userId est manquant' }, { status: 400 });
    }

    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      logger.warn("Tentative d'accès sans authentification", { path: '/api/leaves/user-leaves', userId });
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authenticatedUser = {
      id: session.user.id,
      role: session.user.role,
    };

    // Vérifier les permissions : l'utilisateur peut voir ses propres congés ou être admin
    const targetUserId = parseInt(userId, 10);
    if (
      authenticatedUser.id !== targetUserId &&
      authenticatedUser.role !== 'ADMIN_TOTAL' &&
      authenticatedUser.role !== 'ADMIN_PARTIEL'
    ) {
      logger.warn('Accès non autorisé aux congés', {
        authenticatedUserId: authenticatedUser.id,
        targetUserId,
        role: authenticatedUser.role,
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      return NextResponse.json(
        { error: 'Le paramètre userId doit être un nombre valide' },
        { status: 400 }
      );
    }

    // Construire la requête
    const where: any = { userId: userIdInt };

    // Filtrer par année si spécifiée
    if (year) {
      const yearInt = parseInt(year, 10);
      if (!isNaN(yearInt)) {
        const startOfYear = new Date(yearInt, 0, 1);
        const endOfYear = new Date(yearInt, 11, 31, 23, 59, 59, 999);

        where.OR = [
          { startDate: { gte: startOfYear, lte: endOfYear } },
          { endDate: { gte: startOfYear, lte: endOfYear } },
          {
            AND: [
              { startDate: { lte: startOfYear } },
              { endDate: { gte: endOfYear } }
            ]
          }
        ];
      }
    }

    // Récupérer les congés
    const leaves = await prisma.leave.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            department: {
              select: {
                id: true,
                name: true,
              }
            }
          },
        },
      },
      orderBy: { startDate: 'desc' }
    });

    // Mapper les résultats au format attendu
    const formattedLeaves = leaves.map(leave => ({
      id: leave.id,
      userId: String(leave.userId),
      userName: `${leave.user.prenom} ${leave.user.nom}`,
      userEmail: leave.user.email,
      departmentId: leave.user.department?.id || '',
      departmentName: leave.user.department?.name || '',
      startDate: formatDate(leave.startDate, ISO_DATE_FORMAT),
      endDate: formatDate(leave.endDate, ISO_DATE_FORMAT),
      halfDayStart: (leave as any).halfDayStart ?? undefined,
      halfDayEnd: (leave as any).halfDayEnd ?? undefined,
      workingDaysCount: leave.countedDays ?? 0,
      type: leave.type,
      reason: leave.reason ?? undefined,
      status: leave.status,
      requestDate: formatDate(leave.requestDate, ISO_DATE_FORMAT),
      approverId: leave.approvedById ? String(leave.approvedById) : undefined,
      approvalDate: leave.approvalDate
        ? formatDate(leave.approvalDate, ISO_DATE_FORMAT)
        : undefined,
      rejectionReason: (leave as any).rejectionReason ?? undefined,
      cancellationReason: (leave as any).cancellationReason ?? undefined,
      isRecurring: leave.isRecurring ?? undefined,
      recurrencePattern: leave.recurrencePattern
        ? JSON.parse(JSON.stringify(leave.recurrencePattern))
        : undefined,
      parentId: leave.parentId ?? undefined,
      createdAt: formatDate(leave.createdAt, ISO_DATE_FORMAT),
      updatedAt: formatDate(leave.updatedAt, ISO_DATE_FORMAT),
    }));

    logger.info(`[API /api/leaves/user-leaves] ${formattedLeaves.length} congés trouvés`, { userId, year });

    return NextResponse.json(formattedLeaves);
  } catch (error: unknown) {
    logger.error(`[API /api/leaves/user-leaves] Erreur lors de la récupération des congés:`, { error });
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des congés.' },
      { status: 500 }
    );
  }
}