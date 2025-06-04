import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { LeaveStatus } from '@prisma/client';
import { logger } from '@/lib/logger';
import { auditService, AuditAction } from '@/services/OptimizedAuditService';

/**
 * POST /api/conges/[leaveId]/reject
 * Rejeter une demande de congé - ADMIN uniquement
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ leaveId: string }> }) {
  try {
    const { leaveId: leaveIdStr } = await params;
    const leaveId = parseInt(leaveIdStr);

    // Vérification de l'authentification
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authResult = await verifyAuthToken(token);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: authResult.error || 'Invalid token' }, { status: 401 });
    }

    // Vérifier le rôle
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: {
        id: true,
        role: true,
        actif: true,
        nom: true,
        prenom: true,
      },
    });

    if (!user || !user.actif) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 403 });
    }

    if (user.role !== 'ADMIN_TOTAL' && user.role !== 'ADMIN_PARTIEL') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { reason } = await req.json();

    // Vérifier que le congé existe
    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
      include: { user: true },
    });

    if (!leave) {
      return NextResponse.json({ error: 'Congé non trouvé' }, { status: 404 });
    }

    // Vérifier que le congé est en attente
    if (leave.status !== LeaveStatus.PENDING) {
      return NextResponse.json(
        { error: 'Seuls les congés en attente peuvent être rejetés' },
        { status: 400 }
      );
    }

    // Rejeter le congé
    const updatedLeave = await prisma.leave.update({
      where: { id: leaveId },
      data: {
        status: LeaveStatus.REJECTED,
        rejectionReason: reason,
        reviewedAt: new Date(),
        reviewedBy: user.id,
      },
    });

    // Logger l'action
    await auditService.logAction({
      action: AuditAction.LEAVE_REJECTED,
      entityType: 'leave',
      entityId: leaveId.toString(),
      userId: user.id,
      details: {
        leaveType: leave.type,
        userName:
          leave.user?.nom && leave.user?.prenom
            ? `${leave.user.prenom} ${leave.user.nom}`
            : `User ${leave.userId}`,
        startDate: leave.startDate,
        endDate: leave.endDate,
        reason: reason,
      },
    });

    logger.info('Leave rejected', {
      leaveId,
      rejectedBy: user.id,
      reason,
    });

    // Créer une notification pour l'utilisateur
    if (leave.userId) {
      await prisma.notification.create({
        data: {
          userId: leave.userId,
          type: 'LEAVE_REQUEST_STATUS_CHANGED',
          title: 'Demande de congé rejetée',
          message: `Votre demande de congé du ${leave.startDate.toLocaleDateString('fr-FR')} au ${leave.endDate.toLocaleDateString('fr-FR')} a été rejetée. Raison: ${reason}`,
          contextId: leaveId.toString(),
          metadata: {
            leaveId,
            status: 'REJECTED',
            rejectedBy: user.id,
            reason,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      leave: updatedLeave,
    });
  } catch (error) {
    logger.error('Error rejecting leave', error);
    return NextResponse.json({ error: 'Erreur lors du rejet du congé' }, { status: 500 });
  }
}
