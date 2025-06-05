import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { AuditService } from '@/services/AuditService';

// PUT /api/affectation-modeles/{affectationModeleId} - Mettre à jour une AffectationModele
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ affectationModeleId: string }> }
) {
  try {
    const { affectationModeleId } = await params;

    // Vérification de l'authentification
    const authHeader = request.headers.get('authorization');
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
      },
    });

    if (!user || !user.actif) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 403 });
    }

    if (user.role !== 'ADMIN_TOTAL' && user.role !== 'ADMIN_PARTIEL') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    if (!affectationModeleId || isNaN(parseInt(affectationModeleId))) {
      logger.warn('PUT /api/affectation-modeles/[id]: Invalid affectationModeleId');
      return NextResponse.json({ error: "ID de l'affectation template invalide" }, { status: 400 });
    }
    const idToUpdate = parseInt(affectationModeleId);

    const body = await request.json();
    logger.info(`PUT /api/affectation-modeles/${idToUpdate} - Received data:`, body);

    const {
      activityTypeId,
      jourSemaine,
      periode,
      typeSemaine,
      operatingRoomId,
      priorite,
      isActive,
      detailsJson,
      personnelRequis, // Tableau de PersonnelRequisModele pour mise à jour
    } = body;

    // Logique de mise à jour pour personnelRequis (deleteMany + createMany or upsert)
    // C'est plus simple de supprimer les anciens et de recréer les nouveaux pour les besoins de personnel.
    const personnelRequisCreateData =
      personnelRequis?.map((pr: unknown) => ({
        roleGenerique: pr.roleGenerique,
        nombreRequis: pr.nombreRequis !== undefined ? parseInt(pr.nombreRequis) : 1,
        notes: pr.notes || undefined,
        ...(pr.professionalRoleId && {
          professionalRoleConfig: { connect: { code: pr.professionalRoleId } },
        }),
        ...(pr.specialtyId && { specialty: { connect: { id: parseInt(pr.specialtyId) } } }),
        ...(pr.personnelHabituelUserId && {
          userHabituel: { connect: { id: parseInt(pr.personnelHabituelUserId) } },
        }),
        ...(pr.personnelHabituelSurgeonId && {
          surgeonHabituel: { connect: { id: parseInt(pr.personnelHabituelSurgeonId) } },
        }),
        personnelHabituelNomExterne: pr.personnelHabituelNomExterne || undefined,
      })) || [];

    const updateData: Prisma.AffectationModeleUpdateInput = {
      ...(activityTypeId && { activityType: { connect: { id: activityTypeId } } }),
      ...(jourSemaine && { jourSemaine }),
      ...(periode && { periode }),
      ...(typeSemaine && { typeSemaine }),
      ...(operatingRoomId !== undefined && {
        operatingRoom: operatingRoomId
          ? { connect: { id: parseInt(operatingRoomId) } }
          : { disconnect: true },
      }),
      ...(priorite !== undefined && { priorite: parseInt(priorite) }),
      ...(isActive !== undefined && { isActive }),
      ...(detailsJson !== undefined && { detailsJson }),
    };

    const updatedAffectationModele = await prisma.$transaction(async tx => {
      // 1. Mettre à jour les champs simples de AffectationModele
      const partiallyUpdated = await tx.affectationModele.update({
        where: { id: idToUpdate },
        data: {
          ...(activityTypeId && { activityType: { connect: { id: activityTypeId } } }),
          ...(jourSemaine && { jourSemaine }),
          ...(periode && { periode }),
          ...(typeSemaine && { typeSemaine }),
          ...(operatingRoomId !== undefined && {
            operatingRoom: operatingRoomId
              ? { connect: { id: parseInt(operatingRoomId) } }
              : { disconnect: true },
          }),
          ...(priorite !== undefined && { priorite: parseInt(priorite) }),
          ...(isActive !== undefined && { isActive }),
          ...(detailsJson !== undefined && { detailsJson }),
        },
      });

      // 2. Gérer personnelRequis: supprimer les anciens, créer les nouveaux
      if (personnelRequis !== undefined) {
        // Si personnelRequis est fourni (même un tableau vide pour tout supprimer)
        await tx.personnelRequisModele.deleteMany({
          where: { affectationModeleId: idToUpdate },
        });
        if (personnelRequisCreateData.length > 0) {
          await tx.affectationModele.update({
            where: { id: idToUpdate },
            data: {
              personnelRequis: {
                create: personnelRequisCreateData,
              },
            },
          });
        }
      }
      // 3. Récupérer l'enregistrement complet mis à jour
      return tx.affectationModele.findUniqueOrThrow({
        where: { id: idToUpdate },
        include: {
          personnelRequis: true,
          activityType: true,
          operatingRoom: true,
        },
      });
    });

    logger.info(
      `PUT /api/affectation-modeles/${idToUpdate}: AffectationModele updated successfully:`,
      updatedAffectationModele
    );
    logger.info('--- PUT /api/affectation-modeles/[affectationModeleId] END ---\n');
    return NextResponse.json(updatedAffectationModele);
  } catch (error: unknown) {
    logger.error(`Error during PUT /api/affectation-modeles:`, error instanceof Error ? error : new Error(String(error)));
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        logger.error(
          'Prisma Error P2025 (update): Record to update not found or related record not found.',
          error.meta
        );
        return NextResponse.json(
          {
            error: `Enregistrement à mettre à jour non trouvé ou référence invalide: ${error.meta?.cause || 'non trouvé'}`,
          },
          { status: 404 }
        );
      }
    }
    logger.info('--- PUT /api/affectation-modeles/[affectationModeleId] END (with error) ---\n');
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'affectation template" },
      { status: 500 }
    );
  }
}

// DELETE /api/affectation-modeles/{affectationModeleId} - Supprimer une AffectationModele
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ affectationModeleId: string }> }
) {
  try {
    const { affectationModeleId } = await params;

    // Vérification de l'authentification
    const authHeader = request.headers.get('authorization');
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
      },
    });

    if (!user || !user.actif) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 403 });
    }

    if (user.role !== 'ADMIN_TOTAL' && user.role !== 'ADMIN_PARTIEL') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    logger.info(`[API DELETE /affectation-modeles/${affectationModeleId}] Début du traitement.`);
    logger.info('\n--- DELETE /api/affectation-modeles/[affectationModeleId] START ---');

    // Logger l'action de suppression
    const auditService = new AuditService();
    await auditService.logAction({
      action: 'DELETE_AFFECTATION_MODELE' as any,
      userId: user.id.toString(),
      entityId: affectationModeleId,
      entityType: 'affectation_modele',
      details: {
        userRole: user.role,
        method: 'DELETE',
      },
    });

    if (!affectationModeleId || isNaN(parseInt(affectationModeleId))) {
      logger.warn('DELETE /api/affectation-modeles/[id]: Invalid affectationModeleId');
      return NextResponse.json({ error: "ID de l'affectation template invalide" }, { status: 400 });
    }
    const idToDelete = parseInt(affectationModeleId);

    logger.info(`DELETE /api/affectation-modeles/${idToDelete}: Attempting to delete...`);

    // La suppression en cascade devrait s'occuper des PersonnelRequisModele grâce à onDelete: Cascade dans le schéma
    await prisma.affectationModele.delete({
      where: { id: idToDelete },
    });

    logger.info(
      `DELETE /api/affectation-modeles/${idToDelete}: AffectationModele deleted successfully.`
    );
    logger.info('--- DELETE /api/affectation-modeles/[affectationModeleId] END ---\n');
    return NextResponse.json(
      { message: 'Affectation template supprimée avec succès' },
      { status: 200 }
    ); // ou 204 No Content
  } catch (error: unknown) {
    logger.error(
      `DELETE /api/affectation-modeles/${affectationModeleId}: Error - ${error.message}`,
      { stack: error.stack }
    );
    logger.info('--- DELETE /api/affectation-modeles/[affectationModeleId] END (with error) ---\n');
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'affectation template", details: error.message },
      { status: 500 }
    );
  }
}
