import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LeaveStatus } from '@prisma/client';
import { verifyAuthToken } from '@/lib/auth-utils';

/**
 * POST /api/admin/leaves/[id]/reject
 * Rejette une demande de congé
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const leaveId = params.id;
        if (!leaveId) {
            return NextResponse.json({ error: 'ID de congé manquant' }, { status: 400 });
        }

        // Récupérer le motif du refus s'il est fourni
        let comment = null;
        try {
            const body = await request.json();
            comment = body.comment || null;
        } catch (e) {
            // Ignorer l'erreur si le corps n'est pas un JSON valide
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
                error: 'Seules les demandes en attente peuvent être rejetées',
                currentStatus: leave.status
            }, { status: 400 });
        }

        // Rejeter la demande
        const updatedLeave = await prisma.leave.update({
            where: { id: leaveId },
            data: {
                status: LeaveStatus.REJECTED,
                approvalDate: new Date(),
                approvedById: Number(adminId),
                comment: comment
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

        // Préparer la réponse
        const userName = leave.user ? `${leave.user.prenom} ${leave.user.nom}` : `Utilisateur #${leave.userId}`;
        const adminName = `${admin.prenom} ${admin.nom}`;

        return NextResponse.json({
            success: true,
            message: `Demande de congé de ${userName} rejetée par ${adminName}`,
            leave: {
                id: updatedLeave.id,
                status: updatedLeave.status,
                startDate: updatedLeave.startDate,
                endDate: updatedLeave.endDate,
                type: updatedLeave.type,
                userId: updatedLeave.userId,
                userName: updatedLeave.user ? `${updatedLeave.user.prenom} ${updatedLeave.user.nom}` : null,
                comment: updatedLeave.comment
            }
        });

    } catch (error) {
        console.error('[API /api/admin/leaves/reject] Erreur:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors du rejet de la demande de congé' },
            { status: 500 }
        );
    }
} 