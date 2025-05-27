import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, AssignmentSwapStatus } from '@prisma/client';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { AssignmentSwapEventType, sendAssignmentSwapNotification } from '@/lib/assignment-notification-utils';

jest.mock('@/lib/prisma');


const prisma = prisma;

/**
 * GET /api/affectations/echange/[id]
 * Récupère les détails d'une demande d'échange spécifique
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = await Promise.resolve(params);
    console.log(`\n--- GET /api/affectations/echange/${id} START ---`);

    // Authentification
    const token = request.cookies.get('token')?.value ||
        (request.headers.get('Authorization')?.startsWith('Bearer ') ?
            request.headers.get('Authorization')?.substring(7) : null);

    if (!token) {
        console.error(`GET /api/affectations/echange/${id}: Token manquant`);
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const authResult = await verifyAuthToken(token);
    if (!authResult.authenticated) {
        console.error(`GET /api/affectations/echange/${id}: Token invalide`);
        return NextResponse.json({ error: authResult.error || 'Non autorisé' }, { status: 401 });
    }

    const userId = authResult.userId;

    try {
        // Récupérer la demande d'échange avec toutes les relations nécessaires
        const swapRequest = await prisma.assignmentSwapRequest.findUnique({
            where: { id },
            include: {
                initiator: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        profileImageUrl: true
                    }
                },
                targetUser: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        profileImageUrl: true
                    }
                },
                proposedAssignment: {
                    include: {
                        user: true
                    }
                },
                requestedAssignment: {
                    include: {
                        user: true
                    }
                }
            }
        });

        // Vérifier que la demande existe
        if (!swapRequest) {
            console.warn(`GET /api/affectations/echange/${id}: Demande introuvable`);
            return NextResponse.json({ error: 'Demande d\'échange introuvable' }, { status: 404 });
        }

        // Vérifier que l'utilisateur est autorisé à voir cette demande
        // (il doit être l'initiateur, la cible ou un administrateur)
        const isAdmin = authResult.role === 'ADMIN_TOTAL' || authResult.role === 'ADMIN_PARTIEL';
        const isInvolved = swapRequest.initiatorUserId === userId || swapRequest.targetUserId === userId;

        if (!isAdmin && !isInvolved) {
            console.warn(`GET /api/affectations/echange/${id}: Accès non autorisé pour l'utilisateur ${userId}`);
            return NextResponse.json({ error: 'Vous n\'êtes pas autorisé à voir cette demande d\'échange' }, { status: 403 });
        }

        console.log(`GET /api/affectations/echange/${id}: Demande récupérée avec succès`);
        console.log(`--- GET /api/affectations/echange/${id} END ---\n`);

        return NextResponse.json(swapRequest);

    } catch (error: any) {
        console.error(`GET /api/affectations/echange/${id}: Erreur serveur`, error);
        return NextResponse.json({
            error: 'Erreur lors de la récupération de la demande d\'échange',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * PUT /api/affectations/echange/[id]
 * Met à jour une demande d'échange (accepter, refuser, annuler)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    console.log(`\n--- PUT /api/affectations/echange/${id} START ---`);

    // Authentification
    const token = request.cookies.get('token')?.value ||
        (request.headers.get('Authorization')?.startsWith('Bearer ') ?
            request.headers.get('Authorization')?.substring(7) : null);

    if (!token) {
        console.error(`PUT /api/affectations/echange/${id}: Token manquant`);
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const authResult = await verifyAuthToken(token);
    if (!authResult.authenticated) {
        console.error(`PUT /api/affectations/echange/${id}: Token invalide`);
        return NextResponse.json({ error: authResult.error || 'Non autorisé' }, { status: 401 });
    }

    const userId = authResult.userId;
    const isAdmin = authResult.role === 'ADMIN_TOTAL' || authResult.role === 'ADMIN_PARTIEL';

    try {
        const body = await request.json();
        const { status, responseMessage } = body;

        // Validation des données
        if (!status || !Object.values(AssignmentSwapStatus).includes(status)) {
            console.warn(`PUT /api/affectations/echange/${id}: Statut invalide - ${status}`);
            return NextResponse.json({
                error: 'Le statut fourni est invalide'
            }, { status: 400 });
        }

        // Récupérer la demande d'échange actuelle
        const currentSwapRequest = await prisma.assignmentSwapRequest.findUnique({
            where: { id },
            include: {
                initiator: true,
                targetUser: true
            }
        });

        // Vérifier que la demande existe
        if (!currentSwapRequest) {
            console.warn(`PUT /api/affectations/echange/${id}: Demande introuvable`);
            return NextResponse.json({ error: 'Demande d\'échange introuvable' }, { status: 404 });
        }

        // Vérifier les autorisations pour cette action
        const isInitiator = currentSwapRequest.initiatorUserId === userId;
        const isTarget = currentSwapRequest.targetUserId === userId;
        const isInvolved = isInitiator || isTarget;

        // Règles pour les différentes transitions de statut
        let authorized = false;
        let eventType: AssignmentSwapEventType | null = null;
        let notificationTargetId: number | null = null;

        // ACCEPTATION: Seul l'utilisateur cible peut accepter une demande en attente
        if (status === AssignmentSwapStatus.ACCEPTED && currentSwapRequest.status === AssignmentSwapStatus.PENDING) {
            authorized = isTarget;
            eventType = AssignmentSwapEventType.SWAP_ACCEPTED;
            notificationTargetId = currentSwapRequest.initiatorUserId;
        }
        // REFUS: Seul l'utilisateur cible peut refuser une demande en attente
        else if (status === AssignmentSwapStatus.REJECTED && currentSwapRequest.status === AssignmentSwapStatus.PENDING) {
            authorized = isTarget;
            eventType = AssignmentSwapEventType.SWAP_REJECTED;
            notificationTargetId = currentSwapRequest.initiatorUserId;
        }
        // ANNULATION: Seul l'initiateur peut annuler une demande en attente
        else if (status === AssignmentSwapStatus.CANCELLED && currentSwapRequest.status === AssignmentSwapStatus.PENDING) {
            authorized = isInitiator;
            eventType = AssignmentSwapEventType.SWAP_CANCELLED;
            notificationTargetId = currentSwapRequest.targetUserId || null;
        }
        // ADMIN: Certaines actions sont réservées aux administrateurs
        else if (isAdmin) {
            // Les admins peuvent approuver les demandes acceptées, rejeter n'importe quelle demande, etc.
            authorized = true;

            if (status === AssignmentSwapStatus.ACCEPTED && currentSwapRequest.status === AssignmentSwapStatus.PENDING) {
                // Admin approuve une demande directement (sans que la cible n'accepte)
                eventType = AssignmentSwapEventType.SWAP_ADMIN_APPROVED;
                notificationTargetId = currentSwapRequest.targetUserId || null;
            } else if (status === AssignmentSwapStatus.REJECTED) {
                // Admin rejette une demande
                eventType = AssignmentSwapEventType.SWAP_ADMIN_REJECTED;
                notificationTargetId = isInitiator ? currentSwapRequest.targetUserId : currentSwapRequest.initiatorUserId;
            }
        }

        // Si l'action n'est pas autorisée
        if (!authorized) {
            console.warn(`PUT /api/affectations/echange/${id}: Transition non autorisée de ${currentSwapRequest.status} à ${status} par l'utilisateur ${userId}`);
            return NextResponse.json({
                error: 'Vous n\'êtes pas autorisé à effectuer cette action sur la demande d\'échange'
            }, { status: 403 });
        }

        // Mettre à jour la demande dans une transaction
        const result = await prisma.$transaction(async (tx) => {
            // Mise à jour du statut de la demande
            const updatedSwapRequest = await tx.assignmentSwapRequest.update({
                where: { id },
                data: {
                    status,
                    responseMessage: responseMessage || undefined,
                    updatedAt: new Date()
                },
                include: {
                    initiator: true,
                    targetUser: true,
                    proposedAssignment: true,
                    requestedAssignment: true
                }
            });

            // Si la demande est acceptée, effectuer l'échange des affectations
            let swappedAssignments = null;
            if (status === AssignmentSwapStatus.ACCEPTED && !isAdmin) {
                // Récupérer les affectations à échanger
                const proposedAssignment = await tx.assignment.findUnique({
                    where: { id: updatedSwapRequest.proposedAssignmentId }
                });

                const requestedAssignment = updatedSwapRequest.requestedAssignmentId
                    ? await tx.assignment.findUnique({
                        where: { id: updatedSwapRequest.requestedAssignmentId }
                    })
                    : null;

                if (proposedAssignment) {
                    // Mettre à jour l'affectation proposée (maintenant assignée à la cible)
                    await tx.assignment.update({
                        where: { id: proposedAssignment.id },
                        data: {
                            userId: updatedSwapRequest.targetUserId || undefined
                        }
                    });

                    // Si une affectation est demandée en retour, l'assigner à l'initiateur
                    if (requestedAssignment && updatedSwapRequest.requestedAssignmentId) {
                        await tx.assignment.update({
                            where: { id: updatedSwapRequest.requestedAssignmentId },
                            data: {
                                userId: updatedSwapRequest.initiatorUserId
                            }
                        });
                    }

                    swappedAssignments = { proposedAssignment, requestedAssignment };

                    // Envoyer une notification supplémentaire pour confirmer l'échange complet
                    if (updatedSwapRequest.initiatorUserId) {
                        await sendAssignmentSwapNotification(
                            updatedSwapRequest.initiatorUserId,
                            AssignmentSwapEventType.SWAP_COMPLETED,
                            updatedSwapRequest.id,
                            updatedSwapRequest.targetUserId || undefined
                        );
                    }
                }
            }

            // Envoyer la notification appropriée
            let notification = null;
            if (eventType && notificationTargetId) {
                notification = await sendAssignmentSwapNotification(
                    notificationTargetId,
                    eventType,
                    updatedSwapRequest.id,
                    userId
                );
            }

            return {
                swapRequest: updatedSwapRequest,
                notification,
                swappedAssignments
            };
        });

        console.log(`PUT /api/affectations/echange/${id}: Demande mise à jour avec statut ${status}`);
        if (result.notification) {
            console.log(`PUT /api/affectations/echange/${id}: Notification envoyée: ${result.notification.id}`);
        }
        if (result.swappedAssignments) {
            console.log(`PUT /api/affectations/echange/${id}: Affectations échangées avec succès`);
        }
        console.log(`--- PUT /api/affectations/echange/${id} END ---\n`);

        return NextResponse.json(result.swapRequest);

    } catch (error: any) {
        console.error(`PUT /api/affectations/echange/${id}: Erreur serveur`, error);
        return NextResponse.json({
            error: 'Erreur lors de la mise à jour de la demande d\'échange',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * DELETE /api/affectations/echange/[id]
 * Supprime une demande d'échange (seulement si elle est en statut CANCELLED, REJECTED ou expirée)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    console.log(`\n--- DELETE /api/affectations/echange/${id} START ---`);

    // Authentification
    const token = request.cookies.get('token')?.value ||
        (request.headers.get('Authorization')?.startsWith('Bearer ') ?
            request.headers.get('Authorization')?.substring(7) : null);

    if (!token) {
        console.error(`DELETE /api/affectations/echange/${id}: Token manquant`);
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const authResult = await verifyAuthToken(token);
    if (!authResult.authenticated) {
        console.error(`DELETE /api/affectations/echange/${id}: Token invalide`);
        return NextResponse.json({ error: authResult.error || 'Non autorisé' }, { status: 401 });
    }

    const userId = authResult.userId;
    const isAdmin = authResult.role === 'ADMIN_TOTAL' || authResult.role === 'ADMIN_PARTIEL';

    try {
        // Récupérer la demande d'échange
        const swapRequest = await prisma.assignmentSwapRequest.findUnique({
            where: { id }
        });

        // Vérifier que la demande existe
        if (!swapRequest) {
            console.warn(`DELETE /api/affectations/echange/${id}: Demande introuvable`);
            return NextResponse.json({ error: 'Demande d\'échange introuvable' }, { status: 404 });
        }

        // Vérifier les autorisations (seul l'initiateur ou un admin peut supprimer)
        const isInitiator = swapRequest.initiatorUserId === userId;

        if (!isAdmin && !isInitiator) {
            console.warn(`DELETE /api/affectations/echange/${id}: Utilisateur ${userId} non autorisé à supprimer`);
            return NextResponse.json({
                error: 'Vous n\'êtes pas autorisé à supprimer cette demande d\'échange'
            }, { status: 403 });
        }

        // Vérifier que la demande est dans un état supprimable
        const deletableStatuses = [
            AssignmentSwapStatus.CANCELLED,
            AssignmentSwapStatus.REJECTED,
            AssignmentSwapStatus.EXPIRED
        ];

        const isExpired = swapRequest.expiresAt ? new Date() > swapRequest.expiresAt : false;

        if (!isAdmin && !deletableStatuses.includes(swapRequest.status) && !isExpired) {
            console.warn(`DELETE /api/affectations/echange/${id}: Statut ${swapRequest.status} non supprimable`);
            return NextResponse.json({
                error: 'Impossible de supprimer une demande d\'échange active. Vous devez d\'abord l\'annuler.'
            }, { status: 400 });
        }

        // Supprimer la demande
        await prisma.assignmentSwapRequest.delete({
            where: { id }
        });

        console.log(`DELETE /api/affectations/echange/${id}: Demande supprimée avec succès`);
        console.log(`--- DELETE /api/affectations/echange/${id} END ---\n`);

        return NextResponse.json({
            message: 'Demande d\'échange supprimée avec succès'
        });

    } catch (error: any) {
        console.error(`DELETE /api/affectations/echange/${id}: Erreur serveur`, error);
        return NextResponse.json({
            error: 'Erreur lors de la suppression de la demande d\'échange',
            details: error.message
        }, { status: 500 });
    }
} 