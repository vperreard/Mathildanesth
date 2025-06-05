import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { PrismaClient, AssignmentSwapStatus } from '@prisma/client';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { AssignmentSwapEventType, sendAssignmentSwapNotification } from '@/lib/assignment-notification-utils';

import { prisma } from "@/lib/prisma";

/**
 * PUT /api/affectations/echange/[id]/admin
 * Validation administrative d'une demande d'échange déjà acceptée par les utilisateurs
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    logger.info(`\n--- PUT /api/affectations/echange/${id}/admin START ---`);

    // Authentification
    const token = request.cookies.get('token')?.value ||
        (request.headers.get('Authorization')?.startsWith('Bearer ') ?
            request.headers.get('Authorization')?.substring(7) : null);

    if (!token) {
        logger.error(`PUT /api/affectations/echange/${id}/admin: Token manquant`);
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const authResult = await verifyAuthToken(token);
    if (!authResult.authenticated) {
        logger.error(`PUT /api/affectations/echange/${id}/admin: Token invalide`);
        return NextResponse.json({ error: authResult.error || 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est administrateur
    const userId = authResult.userId;
    const isAdmin = authResult.role === 'ADMIN_TOTAL' || authResult.role === 'ADMIN_PARTIEL';

    if (!isAdmin) {
        logger.warn(`PUT /api/affectations/echange/${id}/admin: Utilisateur ${userId} n'est pas administrateur`);
        return NextResponse.json({ error: 'Action réservée aux administrateurs' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { action, reason } = body;

        // Validation des paramètres
        if (!action || !['approve', 'reject'].includes(action)) {
            logger.warn(`PUT /api/affectations/echange/${id}/admin: Action invalide - ${action}`);
            return NextResponse.json({
                error: 'L\'action doit être "approve" ou "reject"'
            }, { status: 400 });
        }

        // Récupérer la demande d'échange
        const swapRequest = await prisma.assignmentSwapRequest.findUnique({
            where: { id },
            include: {
                initiator: true,
                targetUser: true,
                proposedAssignment: true,
                requestedAssignment: true
            }
        });

        // Vérifier que la demande existe
        if (!swapRequest) {
            logger.warn(`PUT /api/affectations/echange/${id}/admin: Demande introuvable`);
            return NextResponse.json({ error: 'Demande d\'échange introuvable' }, { status: 404 });
        }

        // Exécuter l'action dans une transaction
        const result = await prisma.$transaction(async (tx) => {
            if (action === 'approve') {
                // Approuver l'échange

                // Pour une approbation, nous devons effectuer l'échange des affectations
                // 1. Mettre à jour l'affectation proposée (maintenant assignée à la cible)
                if (swapRequest.proposedAssignmentId && swapRequest.targetUserId) {
                    await tx.attribution.update({
                        where: { id: swapRequest.proposedAssignmentId },
                        data: {
                            userId: swapRequest.targetUserId
                        }
                    });
                }

                // 2. Si une affectation est demandée en retour, l'assigner à l'initiateur
                if (swapRequest.requestedAssignmentId && swapRequest.initiatorUserId) {
                    await tx.attribution.update({
                        where: { id: swapRequest.requestedAssignmentId },
                        data: {
                            userId: swapRequest.initiatorUserId
                        }
                    });
                }

                // 3. Mettre à jour le statut de la demande
                const updatedSwapRequest = await tx.assignmentSwapRequest.update({
                    where: { id },
                    data: {
                        status: 'ACCEPTED', // On utilise ACCEPTED au lieu d'un statut spécifique APPROVED
                        responseMessage: `Échange approuvé par l'administrateur. ${reason ? 'Motif: ' + reason : ''}`,
                        updatedAt: new Date()
                    }
                });

                // 4. Envoyer des notifications aux deux utilisateurs
                const notifications = [];

                // Notification pour l'initiateur
                if (swapRequest.initiatorUserId) {
                    const notif1 = await sendAssignmentSwapNotification(
                        swapRequest.initiatorUserId,
                        AssignmentSwapEventType.SWAP_ADMIN_APPROVED,
                        id,
                        userId
                    );
                    if (notif1) notifications.push(notif1);
                }

                // Notification pour la cible
                if (swapRequest.targetUserId) {
                    const notif2 = await sendAssignmentSwapNotification(
                        swapRequest.targetUserId,
                        AssignmentSwapEventType.SWAP_ADMIN_APPROVED,
                        id,
                        userId
                    );
                    if (notif2) notifications.push(notif2);
                }

                logger.info(`PUT /api/affectations/echange/${id}/admin: Échange approuvé`);
                return { updatedSwapRequest, notifications };

            } else {
                // Rejeter l'échange
                const updatedSwapRequest = await tx.assignmentSwapRequest.update({
                    where: { id },
                    data: {
                        status: 'REJECTED',
                        responseMessage: `Échange rejeté par l'administrateur. ${reason ? 'Motif: ' + reason : ''}`,
                        updatedAt: new Date()
                    }
                });

                // Envoyer des notifications aux deux utilisateurs
                const notifications = [];

                // Notification pour l'initiateur
                if (swapRequest.initiatorUserId) {
                    const notif1 = await sendAssignmentSwapNotification(
                        swapRequest.initiatorUserId,
                        AssignmentSwapEventType.SWAP_ADMIN_REJECTED,
                        id,
                        userId,
                        reason ? `Demande d'échange rejetée. Motif: ${reason}` : undefined
                    );
                    if (notif1) notifications.push(notif1);
                }

                // Notification pour la cible
                if (swapRequest.targetUserId) {
                    const notif2 = await sendAssignmentSwapNotification(
                        swapRequest.targetUserId,
                        AssignmentSwapEventType.SWAP_ADMIN_REJECTED,
                        id,
                        userId,
                        reason ? `Demande d'échange rejetée. Motif: ${reason}` : undefined
                    );
                    if (notif2) notifications.push(notif2);
                }

                logger.info(`PUT /api/affectations/echange/${id}/admin: Échange rejeté`);
                return { updatedSwapRequest, notifications };
            }
        });

        logger.info(`PUT /api/affectations/echange/${id}/admin: Action "${action}" terminée avec succès`);
        logger.info(`PUT /api/affectations/echange/${id}/admin: ${result.notifications.length} notifications envoyées`);
        logger.info(`--- PUT /api/affectations/echange/${id}/admin END ---\n`);

        return NextResponse.json(result.updatedSwapRequest);

    } catch (error: any) {
        logger.error(`PUT /api/affectations/echange/${id}/admin: Erreur serveur`, error);
        return NextResponse.json({
            error: 'Erreur lors du traitement administratif de la demande d\'échange',
            details: error.message
        }, { status: 500 });
    }
} 