import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { withAuth } from '@/middleware/authorization';
import { logger } from '@/lib/logger';
import { requirePlanningPermission, AuthenticationError, AuthorizationError, logSecurityAction } from '@/lib/auth/authorization';
import { auditService, AuditAction } from '@/services/auditService';

// PUT /api/affectation-modeles/{affectationModeleId} - Mettre à jour une AffectationModele
export const PUT = withAuth({
    requireAuth: true,
    allowedRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL'],
    resourceType: 'affectation_modele',
    action: 'update'
})(async (
    request: NextRequest,
    { params }: { params: { affectationModeleId: string } }
) => {
    try {
        const userId = parseInt(request.headers.get('x-user-id') || '0');

        const { affectationModeleId } = await Promise.resolve(params);
        if (!affectationModeleId || isNaN(parseInt(affectationModeleId))) {
            console.warn("PUT /api/affectation-modeles/[id]: Invalid affectationModeleId");
            return NextResponse.json({ error: 'ID de l\'affectation template invalide' }, { status: 400 });
        }
        const idToUpdate = parseInt(affectationModeleId);

        const body = await request.json();
        console.log(`PUT /api/affectation-modeles/${idToUpdate} - Received data:`, body);

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
        const personnelRequisCreateData = personnelRequis?.map((pr: any) => ({
            roleGenerique: pr.roleGenerique,
            nombreRequis: pr.nombreRequis !== undefined ? parseInt(pr.nombreRequis) : 1,
            notes: pr.notes || undefined,
            ...(pr.professionalRoleId && { professionalRoleConfig: { connect: { code: pr.professionalRoleId } } }),
            ...(pr.specialtyId && { specialty: { connect: { id: parseInt(pr.specialtyId) } } }),
            ...(pr.personnelHabituelUserId && { userHabituel: { connect: { id: parseInt(pr.personnelHabituelUserId) } } }),
            ...(pr.personnelHabituelSurgeonId && { surgeonHabituel: { connect: { id: parseInt(pr.personnelHabituelSurgeonId) } } }),
            personnelHabituelNomExterne: pr.personnelHabituelNomExterne || undefined,
        })) || [];

        const updateData: Prisma.AffectationModeleUpdateInput = {
            ...(activityTypeId && { activityType: { connect: { id: activityTypeId } } }),
            ...(jourSemaine && { jourSemaine }),
            ...(periode && { periode }),
            ...(typeSemaine && { typeSemaine }),
            ...(operatingRoomId !== undefined && { operatingRoom: operatingRoomId ? { connect: { id: parseInt(operatingRoomId) } } : { disconnect: true } }),
            ...(priorite !== undefined && { priorite: parseInt(priorite) }),
            ...(isActive !== undefined && { isActive }),
            ...(detailsJson !== undefined && { detailsJson }),
            // Gestion des personnelRequis : supprimer les existants et créer les nouveaux
            // Prisma ne supporte pas directement une "synchronisation" simple des relations to-many dans une seule opération d'update sur le parent
            // La meilleure approche est souvent de gérer cela en plusieurs étapes dans une transaction si la complexité augmente.
            // Pour cet exemple, on va utiliser `deleteMany` et `create` sur la relation `personnelRequis`.
            // Cela nécessite que la mise à jour se fasse dans une transaction pour assurer l'atomicité.
        };

        const updatedAffectationModele = await prisma.$transaction(async (tx) => {
            // 1. Mettre à jour les champs simples de AffectationModele
            const partiallyUpdated = await tx.affectationModele.update({
                where: { id: idToUpdate },
                data: {
                    ...(activityTypeId && { activityType: { connect: { id: activityTypeId } } }),
                    ...(jourSemaine && { jourSemaine }),
                    ...(periode && { periode }),
                    ...(typeSemaine && { typeSemaine }),
                    ...(operatingRoomId !== undefined && { operatingRoom: operatingRoomId ? { connect: { id: parseInt(operatingRoomId) } } : { disconnect: true } }),
                    ...(priorite !== undefined && { priorite: parseInt(priorite) }),
                    ...(isActive !== undefined && { isActive }),
                    ...(detailsJson !== undefined && { detailsJson }),
                },
            });

            // 2. Gérer personnelRequis: supprimer les anciens, créer les nouveaux
            if (personnelRequis !== undefined) { // Si personnelRequis est fourni (même un tableau vide pour tout supprimer)
                await tx.personnelRequisModele.deleteMany({
                    where: { affectationModeleId: idToUpdate }
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

        console.log(`PUT /api/affectation-modeles/${idToUpdate}: AffectationModele updated successfully:`, updatedAffectationModele);
        console.log("--- PUT /api/affectation-modeles/[affectationModeleId] END ---\n");
        return NextResponse.json(updatedAffectationModele);

    } catch (error) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        if (error instanceof AuthorizationError) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        console.error(`Error during PUT /api/affectation-modeles/${affectationModeleId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                console.error("Prisma Error P2025 (update): Record to update not found or related record not found.", error.meta);
                return NextResponse.json({ error: `Enregistrement à mettre à jour non trouvé ou référence invalide: ${error.meta?.cause || 'non trouvé'}` }, { status: 404 });
            }
        }
        console.log("--- PUT /api/affectation-modeles/[affectationModeleId] END (with error) ---\n");
        return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'affectation template' }, { status: 500 });
    }
});

// DELETE /api/affectation-modeles/{affectationModeleId} - Supprimer une AffectationModele
export const DELETE = withAuth({
    requireAuth: true,
    allowedRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL'],
    resourceType: 'affectation_modele',
    action: 'delete'
})(async (
    request: NextRequest,
    { params }: { params: { affectationModeleId: string } }
) => {
    try {
        const userId = parseInt(request.headers.get('x-user-id') || '0');
        const userRole = request.headers.get('x-user-role') || '';
        
        const { affectationModeleId } = params;
        console.log(`[API DELETE /affectation-modeles/${affectationModeleId}] Début du traitement.`);
        console.log("\n--- DELETE /api/affectation-modeles/[affectationModeleId] START ---");

        // 🔐 CORRECTION DU TODO CRITIQUE : Vérification de rôle admin pour suppression (déjà fait via withAuth)
        // Logger l'action de suppression
        await auditService.logAction({
            action: 'DELETE_AFFECTATION_MODELE' as any,
            userId: userId.toString(),
            entityId: affectationModeleId,
            entityType: 'affectation_modele',
            details: {
                userRole,
                method: 'DELETE'
            }
        });

        if (!affectationModeleId || isNaN(parseInt(affectationModeleId))) {
            console.warn("DELETE /api/affectation-modeles/[id]: Invalid affectationModeleId");
            return NextResponse.json({ error: 'ID de l\'affectation template invalide' }, { status: 400 });
        }
        const idToDelete = parseInt(affectationModeleId);

        console.log(`DELETE /api/affectation-modeles/${idToDelete}: Attempting to delete...`);

        // La suppression en cascade devrait s'occuper des PersonnelRequisModele grâce à onDelete: Cascade dans le schéma
        await prisma.affectationModele.delete({
            where: { id: idToDelete },
        });

        console.log(`DELETE /api/affectation-modeles/${idToDelete}: AffectationModele deleted successfully.`);
        console.log("--- DELETE /api/affectation-modeles/[affectationModeleId] END ---\n");
        return NextResponse.json({ message: "Affectation template supprimée avec succès" }, { status: 200 }); // ou 204 No Content

    } catch (error: any) {
        console.error(`DELETE /api/affectation-modeles/${params.affectationModeleId}: Error - ${error.message}`, { stack: error.stack });
        console.log("--- DELETE /api/affectation-modeles/[affectationModeleId] END (with error) ---\n");
        return NextResponse.json({ error: 'Erreur lors de la suppression de l\'affectation template', details: error.message }, { status: 500 });
    }
}); 