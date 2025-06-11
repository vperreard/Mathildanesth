import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { LeaveStatus } from '@prisma/client';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { withSensitiveRateLimit } from '@/lib/rateLimit';
import { auditService, AuditAction } from '@/services/OptimizedAuditService';

/**
 * POST /api/leaves/[leaveId]/cancel
 * Annule une demande de congé
 */
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ leaveId: string }> }
) {
  try {
    // Await params as required by Next.js 15
    const { leaveId } = await params;

    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      logger.warn("Tentative d'annulation de congé sans token", {
        path: `/api/leaves/${leaveId}/cancel`,
      });
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authResult = await verifyAuthToken(token);
    if (!authResult.authenticated) {
      logger.warn('Token invalide pour annulation de congé', {
        path: `/api/leaves/${leaveId}/cancel`,
      });
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Récupérer l'utilisateur authentifié
    const authenticatedUser = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { id: true, role: true },
    });

    if (!authenticatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 403 });
    }

    // Récupérer la demande de congé
    const leaveRequest = await prisma.leave.findUnique({
      where: { id: leaveId },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    if (!leaveRequest) {
      logger.warn('Demande de congé non trouvée pour annulation', {
        leaveId: leaveId,
        userId: authenticatedUser.id,
      });
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    // Vérifier les permissions
    const canCancel =
      authenticatedUser.id === leaveRequest.userId || // Propriétaire
      authenticatedUser.role === 'ADMIN_TOTAL' ||
      authenticatedUser.role === 'ADMIN_PARTIEL';

    if (!canCancel) {
      logger.warn("Tentative d'annulation non autorisée", {
        authenticatedUserId: authenticatedUser.id,
        leaveUserId: leaveRequest.userId,
        role: authenticatedUser.role,
        leaveId: leaveId,
      });
      return NextResponse.json(
        { error: 'Forbidden - Vous ne pouvez annuler que vos propres demandes' },
        { status: 403 }
      );
    }

    // Vérifier que la demande peut être annulée
    if (leaveRequest.status === LeaveStatus.CANCELLED) {
      return NextResponse.json({ error: 'Cette demande est déjà annulée' }, { status: 400 });
    }

    // Récupérer le commentaire d'annulation (optionnel)
    let comment: string | undefined;
    try {
      const body = await request.json();
      comment = body?.comment;
    } catch {
      // Pas de corps ou corps invalide, commentaire restera undefined
    }

    // Logger l'action
    logger.info('Annulation de congé', {
      action: 'CANCEL_LEAVE',
      authenticatedUserId: authenticatedUser.id,
      leaveId: leaveId,
      leaveUserId: leaveRequest.userId,
      previousStatus: leaveRequest.status,
      role: authenticatedUser.role,
      comment,
    });

    // Annuler la demande
    const cancelledLeave = await prisma.leave.update({
      where: { id: leaveId },
      data: {
        status: LeaveStatus.CANCELLED,
        updatedAt: new Date(),
        // Ajouter le commentaire d'annulation si fourni
        reason: comment
          ? `${leaveRequest.reason || ''}\n\nAnnulation: ${comment}`.trim()
          : leaveRequest.reason,
      },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    // Adapter les données utilisateur
    const adaptUserFields = (user: unknown) => {
      if (!user) return null;

      return {
        ...user,
        firstName: user.firstName || user.prenom,
        lastName: user.lastName || user.nom,
        prenom: user.prenom || user.firstName,
        nom: user.nom || user.lastName,
      };
    };

    const adaptedUser = adaptUserFields(cancelledLeave.user);
    const firstName = adaptedUser?.prenom || adaptedUser?.firstName || '(Prénom non défini)';
    const lastName = adaptedUser?.nom || adaptedUser?.lastName || '(Nom non défini)';

    // Formater la réponse
    const formattedLeave = {
      id: cancelledLeave.id,
      startDate: cancelledLeave.startDate.toISOString(),
      endDate: cancelledLeave.endDate.toISOString(),
      status: cancelledLeave.status,
      type: cancelledLeave.type,
      typeCode: cancelledLeave.typeCode,
      reason: cancelledLeave.reason,
      createdAt: cancelledLeave.createdAt.toISOString(),
      updatedAt: cancelledLeave.updatedAt.toISOString(),
      userId: cancelledLeave.userId,
      user: {
        id: adaptedUser?.id || cancelledLeave.userId,
        firstName,
        lastName,
        prenom: firstName,
        nom: lastName,
      },
    };

    // Log d'audit pour l'annulation
    try {
      await auditService.logDataModification(
        AuditAction.LEAVE_CANCELLED,
        'Leave',
        leaveId,
        authenticatedUser.id,
        leaveRequest, // Valeur précédente
        formattedLeave, // Nouvelle valeur
        {
          ipAddress:
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          targetUserId:
            leaveRequest.userId !== authenticatedUser.id ? leaveRequest.userId : undefined,
          metadata: {
            previousStatus: leaveRequest.status,
            cancellationComment: comment,
            cancelledBy:
              authenticatedUser.role === 'ADMIN_TOTAL' || authenticatedUser.role === 'ADMIN_PARTIEL'
                ? 'admin'
                : 'user',
          },
        }
      );
    } catch (auditError) {
      logger.error("Erreur lors du log d'audit de l'annulation", {
        auditError,
        leaveId,
        action: 'LEAVE_CANCELLED',
      });
      // Continue execution even if audit fails
    }

    logger.info('Congé annulé avec succès', {
      leaveId: leaveId,
      userId: authenticatedUser.id,
      targetUserId: leaveRequest.userId,
      previousStatus: leaveRequest.status,
      newStatus: cancelledLeave.status,
    });

    return NextResponse.json(formattedLeave, { status: 200 });
  } catch (error: unknown) {
    // Need to await params again in catch block
    const { leaveId } = await params;

    logger.error("Erreur lors de l'annulation du congé", {
      error: error,
      leaveId: leaveId,
    });

    // Log d'audit pour l'échec
    try {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      if (token) {
        const authResult = await verifyAuthToken(token);
        if (authResult.authenticated) {
          await auditService.logAction({
            action: AuditAction.ERROR_OCCURRED,
            entityId: leaveId,
            entityType: 'Leave',
            userId: authResult.userId,
            severity: 'ERROR',
            success: false,
            details: {
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              operation: 'cancel_leave',
            },
          });
        }
      }
    } catch (auditError) {
      logger.error("Erreur lors du log d'audit", { auditError });
    }

    return NextResponse.json(
      { error: "Erreur serveur lors de l'annulation de la demande de congé" },
      { status: 500 }
    );
  }
}

// Export du handler avec rate limiting
export const POST = withSensitiveRateLimit(postHandler);
