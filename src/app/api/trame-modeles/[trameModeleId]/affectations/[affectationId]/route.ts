import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { checkUserRole } from '@/lib/auth-server-utils';
import type { UserRole } from '@/lib/auth-client-utils';
import { AuditService } from '@/services/AuditService';

const ALLOWED_ROLES_DELETE: UserRole[] = ['ADMIN_TOTAL', 'ADMIN_PARTIEL'];
const ALLOWED_ROLES_UPDATE: UserRole[] = ['ADMIN_TOTAL', 'ADMIN_PARTIEL'];

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ trameModeleId: string; affectationId: string }> }
) {
  try {
    // Vérifier l'authentification et les rôles
    const authCheck = await checkUserRole(ALLOWED_ROLES_DELETE);
    if (!authCheck.hasRequiredRole) {
      return NextResponse.json(
        { error: authCheck.error || 'Authentification requise' },
        { status: 401 }
      );
    }

    const userId = authCheck.user?.id || 0;
    const userRole = authCheck.user?.role || '';

    const { trameModeleId, affectationId } = await params;
    logger.info(
      `[API DELETE /trame-modeles/${trameModeleId}/affectations/${affectationId}] Début du traitement.`
    );
    logger.info(
      '\n--- DELETE /api/trame-modeles/[trameModeleId]/affectations/[affectationId] START ---'
    );
    logger.info(`[API DELETE] Auth check passed, userId: ${userId}, role: ${userRole}`);
    logger.info(`[API DELETE] trameModeleId: ${trameModeleId}, affectationId: ${affectationId}`);

    // Validation des paramètres
    if (!trameModeleId || isNaN(parseInt(trameModeleId))) {
      logger.warn('DELETE: Invalid trameModeleId');
      return NextResponse.json(
        { error: 'ID du template de trameModele invalide' },
        { status: 400 }
      );
    }

    if (!affectationId || isNaN(parseInt(affectationId))) {
      logger.warn('DELETE: Invalid affectationId');
      return NextResponse.json({ error: "ID de l'affectation invalide" }, { status: 400 });
    }

    const trameId = parseInt(trameModeleId);
    const affectationIdNum = parseInt(affectationId);

    // Vérifier l'existence du TrameModele parent
    const parentTrame = await prisma.trameModele.findUnique({ where: { id: trameId } });
    if (!parentTrame) {
      logger.warn(`DELETE: TrameModele with id ${trameId} not found.`);
      return NextResponse.json(
        { error: 'Modèle de trameModele parent non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier l'existence de l'affectation
    const existingAffectation = await prisma.affectationModele.findUnique({
      where: { id: affectationIdNum },
      include: {
        personnelRequis: true,
      },
    });

    if (!existingAffectation) {
      logger.warn(`DELETE: AffectationModele with id ${affectationIdNum} not found.`);
      return NextResponse.json({ error: 'Affectation non trouvée' }, { status: 404 });
    }

    // Vérifier que l'affectation appartient bien au bon trameModele
    if (existingAffectation.trameModeleId !== trameId) {
      logger.warn(
        `DELETE: AffectationModele ${affectationIdNum} does not belong to TrameModele ${trameId}`
      );
      return NextResponse.json(
        { error: 'Affectation ne correspond pas au modèle de trameModele' },
        { status: 400 }
      );
    }

    logger.info(
      `DELETE: Found affectation with ${existingAffectation.personnelRequis.length} personnel requis`
    );

    // Supprimer l'affectation (et ses PersonnelRequisModele en cascade grâce à onDelete: Cascade)
    await prisma.affectationModele.delete({
      where: { id: affectationIdNum },
    });

    logger.info('DELETE: AffectationModele deleted successfully');

    // Logger l'action de suppression
    const auditService = new AuditService();
    await auditService.logAction({
      action: 'DELETE_TRAME_AFFECTATION' as any,
      userId: userId.toString(),
      entityId: affectationId,
      entityType: 'trame_affectation',
      details: {
        userRole,
        method: 'DELETE',
        trameModeleId,
        affectationDetails: {
          activityTypeId: existingAffectation.activityTypeId,
          jourSemaine: existingAffectation.jourSemaine,
          periode: existingAffectation.periode,
          operatingRoomId: existingAffectation.operatingRoomId,
        },
      },
    });

    logger.info(
      '--- DELETE /api/trame-modeles/[trameModeleId]/affectations/[affectationId] END ---\n'
    );
    return NextResponse.json(
      { success: true, message: 'Affectation supprimée avec succès' },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error(
      'Error during DELETE /api/trame-modeles/[trameModeleId]/affectations/[affectationId]:',
      { error }
    );

    if (error instanceof Error) {
      logger.error("Message d'erreur:", error.message);
      logger.error('Stack trace:', error.stack);
    }

    logger.info(
      '--- DELETE /api/trame-modeles/[trameModeleId]/affectations/[affectationId] END (with error) ---\n'
    );
    return NextResponse.json(
      {
        error: "Erreur lors de la suppression de l'affectation template",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ trameModeleId: string; affectationId: string }> }
) {
  try {
    // Vérifier l'authentification et les rôles
    const authCheck = await checkUserRole(ALLOWED_ROLES_UPDATE);
    if (!authCheck.hasRequiredRole) {
      return NextResponse.json(
        { error: authCheck.error || 'Authentification requise' },
        { status: 401 }
      );
    }

    const userId = authCheck.user?.id || 0;
    const userRole = authCheck.user?.role || '';

    const { trameModeleId, affectationId } = await params;
    const body = await request.json();

    logger.info(
      `[API PUT /trame-modeles/${trameModeleId}/affectations/${affectationId}] Début du traitement.`
    );
    logger.info(
      '\n--- PUT /api/trame-modeles/[trameModeleId]/affectations/[affectationId] START ---'
    );
    logger.info(`[API PUT] Auth check passed, userId: ${userId}, role: ${userRole}`);
    logger.info(`[API PUT] trameModeleId: ${trameModeleId}, affectationId: ${affectationId}`);
    logger.info(`[API PUT] Request body:`, body);

    // Validation des paramètres
    if (!trameModeleId || isNaN(parseInt(trameModeleId))) {
      logger.warn('PUT: Invalid trameModeleId');
      return NextResponse.json(
        { error: 'ID du template de trameModele invalide' },
        { status: 400 }
      );
    }

    if (!affectationId || isNaN(parseInt(affectationId))) {
      logger.warn('PUT: Invalid affectationId');
      return NextResponse.json({ error: "ID de l'affectation invalide" }, { status: 400 });
    }

    const trameId = parseInt(trameModeleId);
    const affectationIdNum = parseInt(affectationId);

    // Vérifier l'existence du TrameModele parent
    const parentTrame = await prisma.trameModele.findUnique({ where: { id: trameId } });
    if (!parentTrame) {
      logger.warn(`PUT: TrameModele with id ${trameId} not found.`);
      return NextResponse.json(
        { error: 'Modèle de trameModele parent non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier l'existence de l'affectation
    const existingAffectation = await prisma.affectationModele.findUnique({
      where: { id: affectationIdNum },
      include: {
        personnelRequis: true,
      },
    });

    if (!existingAffectation) {
      logger.warn(`PUT: AffectationModele with id ${affectationIdNum} not found.`);
      return NextResponse.json({ error: 'Affectation non trouvée' }, { status: 404 });
    }

    // Vérifier que l'affectation appartient bien au bon trameModele
    if (existingAffectation.trameModeleId !== trameId) {
      logger.warn(
        `PUT: AffectationModele ${affectationIdNum} does not belong to TrameModele ${trameId}`
      );
      return NextResponse.json(
        { error: 'Affectation ne correspond pas au modèle de trameModele' },
        { status: 400 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    // Support pour la bascule active/inactive
    if (typeof body.active !== 'undefined') {
      updateData.isActive = Boolean(body.active);
      logger.info(`PUT: Updating active status to ${updateData.isActive}`);
    }

    // Support pour d'autres champs si nécessaire
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    // Support pour la mise à jour complète des champs principaux
    if (body.activityTypeId) {
      updateData.activityTypeId = body.activityTypeId;
    }

    if (body.jourSemaine) {
      updateData.jourSemaine = body.jourSemaine;
    }

    if (body.periode) {
      updateData.periode = body.periode;
    }

    if (body.typeSemaine) {
      updateData.typeSemaine = body.typeSemaine;
    }

    if (body.operatingRoomId) {
      updateData.operatingRoomId = parseInt(body.operatingRoomId.toString());
    }

    if (body.priorite !== undefined) {
      updateData.priorite = parseInt(body.priorite.toString());
    }

    if (typeof body.isActive !== 'undefined') {
      updateData.isActive = Boolean(body.isActive);
    }

    logger.info(`PUT: Update data prepared:`, updateData);

    // Gérer la mise à jour du personnel requis si fourni
    let personnelRequisUpdate = {};
    if (body.personnelRequis && Array.isArray(body.personnelRequis)) {
      // Supprimer l'ancien personnel requis et créer le nouveau
      personnelRequisUpdate = {
        personnelRequis: {
          deleteMany: {},
          create: body.personnelRequis.map((pr: any) => {
            const personnel: any = {
              roleGenerique: pr.roleGenerique,
              nombreRequis: pr.nombreRequis || 1,
              notes: pr.notes || '',
            };

            // Priorité 1: userId directement dans l'objet personnel requis
            if (pr.userId && pr.userId !== 'none') {
              // Vérifier si c'est un chirurgien (préfixé avec "surgeon-")
              if (pr.userId.startsWith('surgeon-')) {
                const surgeonId = parseInt(pr.userId.replace('surgeon-', ''));
                personnel.personnelHabituelSurgeonId = surgeonId;
                logger.info(`PUT: Direct surgeon assignment: ${surgeonId}`);
              } else {
                personnel.personnelHabituelUserId = parseInt(pr.userId);
                logger.info(`PUT: Direct user assignment: ${pr.userId}`);
              }
            }
            // Priorité 2: Si on a un userId dans les notes (compatibilité arrière)
            else if (pr.notes && pr.notes.includes('Utilisateur assigné:')) {
              const userIdMatch = pr.notes.match(/Utilisateur assigné: (\w+)/);
              if (userIdMatch && userIdMatch[1]) {
                const userId = userIdMatch[1];
                // Vérifier si c'est un ID numérique ou un nom d'utilisateur
                if (!isNaN(parseInt(userId))) {
                  personnel.personnelHabituelUserId = parseInt(userId);
                  logger.info(`PUT: Legacy user assignment from notes: ${userId}`);
                  // Nettoyer les notes en supprimant la référence utilisateur
                  personnel.notes = pr.notes.replace(/Utilisateur assigné: \w+/, '').trim();
                } else {
                  logger.info(`PUT: Keeping user reference in notes: ${userId}`);
                }
              }
            }

            return personnel;
          }),
        },
      };
    }

    // Effectuer la mise à jour
    const updatedAffectation = await prisma.affectationModele.update({
      where: { id: affectationIdNum },
      data: {
        ...updateData,
        ...personnelRequisUpdate,
      },
      include: {
        personnelRequis: {
          include: {
            userHabituel: true,
            surgeonHabituel: true,
            professionalRoleConfig: true,
            specialty: true,
          },
        },
        activityType: true,
        operatingRoom: true,
      },
    });

    logger.info('PUT: AffectationModele updated successfully');

    // Logger l'action de mise à jour
    const auditService = new AuditService();
    await auditService.logAction({
      action: 'UPDATE_TRAME_AFFECTATION' as any,
      userId: userId.toString(),
      entityId: affectationId,
      entityType: 'trame_affectation',
      details: {
        userRole,
        method: 'PUT',
        trameModeleId,
        updateData,
        affectationDetails: {
          activityTypeId: updatedAffectation.activityTypeId,
          jourSemaine: updatedAffectation.jourSemaine,
          periode: updatedAffectation.periode,
          operatingRoomId: updatedAffectation.operatingRoomId,
          active: updatedAffectation.active,
        },
      },
    });

    logger.info(
      '--- PUT /api/trame-modeles/[trameModeleId]/affectations/[affectationId] END ---\n'
    );
    return NextResponse.json(
      {
        success: true,
        message: 'Affectation mise à jour avec succès',
        affectation: updatedAffectation,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error(
      'Error during PUT /api/trame-modeles/[trameModeleId]/affectations/[affectationId]:',
      { error }
    );

    if (error instanceof Error) {
      logger.error("Message d'erreur:", error.message);
      logger.error('Stack trace:', error.stack);
    }

    logger.info(
      '--- PUT /api/trame-modeles/[trameModeleId]/affectations/[affectationId] END (with error) ---\n'
    );
    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jour de l'affectation template",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
