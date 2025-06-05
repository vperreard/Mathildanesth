import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { LeaveStatus, NotificationType } from '@prisma/client';
import { verifyAuthToken } from '@/lib/auth-utils';
import { createNotification } from '@/lib/notifications';

/**
 * POST /api/admin/conges/[id]/approve
 * Approuve une demande de congé
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: leaveId } = await params;
        if (!leaveId) {
            return NextResponse.json({ error: 'ID de congé manquant' }, { status: 400 });
        }

        // Vérifier l'authentification
        const authResult = await verifyAuthToken();

        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({
                error: 'Non authentifié',
                message: authResult.error
            }, { status: 401 });
        }

        // Vérifier si l'utilisateur est un administrateur
        const adminId = authResult.user.id;
        const admin = await prisma.user.findUnique({
            where: { id: Number(adminId) },
            select: { role: true, prenom: true, nom: true }
        });

        if (!admin || (admin.role !== 'ADMIN_TOTAL' && admin.role !== 'ADMIN_PARTIEL')) {
            return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
        }

        // Vérifier que la demande existe et est en attente
        const leave = await prisma.leave.findUnique({
            where: { id: leaveId },
            include: { user: { select: { id: true, prenom: true, nom: true } } }
        });

        if (!leave) {
            return NextResponse.json({ error: 'Demande de congé non trouvée' }, { status: 404 });
        }

        if (leave.status !== LeaveStatus.PENDING) {
            return NextResponse.json({
                error: 'Seules les demandes en attente peuvent être approuvées',
                currentStatus: leave.status
            }, { status: 400 });
        }

        // Approuver la demande
        const updatedLeave = await prisma.leave.update({
            where: { id: leaveId },
            data: {
                status: LeaveStatus.APPROVED,
                approvalDate: new Date(),
                approvedById: Number(adminId)
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                    }
                }
            }
        });

        // Envoyer une notification à l'utilisateur
        if (updatedLeave && updatedLeave.user) {
            const adminFullName = `${admin.prenom} ${admin.nom}`.trim();
            const notificationMessage = `Votre demande de congé du ${new Date(updatedLeave.startDate).toLocaleDateString('fr-FR')} au ${new Date(updatedLeave.endDate).toLocaleDateString('fr-FR')} a été approuvée par ${adminFullName}.`;
            // TODO: Déterminer le lien exact vers la demande de congé ou la liste des congés de l'utilisateur
            const linkToLeave = `/mes-conges?leaveId=${updatedLeave.id}`; // Exemple de lien

            await createNotification({
                userId: updatedLeave.userId, // C'est l'ID de l'utilisateur qui a fait la demande
                type: NotificationType.LEAVE_REQUEST_STATUS_CHANGED,
                message: notificationMessage,
                link: linkToLeave,
                triggeredByUserId: Number(adminId), // L'admin qui a approuvé
                // relatedLeaveId: updatedLeave.id // Si vous ajoutez une relation directe `relatedLeave` au template Notification
            });
        }

        // Préparer la réponse
        const userName = leave.user ? `${leave.user.prenom} ${leave.user.nom}` : `Utilisateur #${leave.userId}`;
        const adminName = `${admin.prenom} ${admin.nom}`;

        return NextResponse.json({
            success: true,
            message: `Demande de congé de ${userName} approuvée par ${adminName}`,
            leave: {
                id: updatedLeave.id,
                status: updatedLeave.status,
                startDate: updatedLeave.startDate,
                endDate: updatedLeave.endDate,
                type: updatedLeave.type,
                userId: updatedLeave.userId,
                userName: updatedLeave.user ? `${updatedLeave.user.prenom} ${updatedLeave.user.nom}` : null
            }
        });

    } catch (error) {
        logger.error('[API /api/admin/conges/approve] Erreur:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de l\'approbation de la demande de congé' },
            { status: 500 }
        );
    }
} 