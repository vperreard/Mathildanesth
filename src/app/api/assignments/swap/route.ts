import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, AssignmentSwapStatus } from '@prisma/client';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { AssignmentSwapEventType, sendAssignmentSwapNotification } from '@/lib/assignment-notification-utils';

const prisma = new PrismaClient();

/**
 * GET /api/assignments/swap
 * Récupère les demandes d'échange d'affectations pour l'utilisateur authentifié
 */
export async function GET(request: NextRequest) {
    console.log("\n--- GET /api/assignments/swap START ---");

    // Authentification
    const token = request.cookies.get('token')?.value ||
        (request.headers.get('Authorization')?.startsWith('Bearer ') ?
            request.headers.get('Authorization')?.substring(7) : null);

    if (!token) {
        console.error("GET /api/assignments/swap: Token manquant");
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const authResult = await verifyAuthToken(token);
    if (!authResult.authenticated) {
        console.error("GET /api/assignments/swap: Token invalide");
        return NextResponse.json({ error: authResult.error || 'Non autorisé' }, { status: 401 });
    }

    const userId = authResult.userId;
    const { searchParams } = new URL(request.url);

    try {
        // Différents filtres possibles
        const status = searchParams.get('status') as AssignmentSwapStatus | null;
        const role = searchParams.get('role'); // 'initiator', 'target', 'all'
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

        // Construction de la requête
        const whereClause: any = {};

        // Filtre par statut
        if (status) {
            whereClause.status = status;
        }

        // Filtre par rôle (initiateur ou cible)
        if (role === 'initiator') {
            whereClause.initiatorUserId = userId;
        } else if (role === 'target') {
            whereClause.targetUserId = userId;
        } else {
            // Par défaut, récupérer toutes les demandes liées à l'utilisateur
            whereClause.OR = [
                { initiatorUserId: userId },
                { targetUserId: userId }
            ];
        }

        // Exécution de la requête avec pagination
        const swapRequests = await prisma.assignmentSwapRequest.findMany({
            where: whereClause,
            include: {
                initiator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        profileImageUrl: true
                    }
                },
                targetUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
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
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: offset,
            take: limit
        });

        // Compter le nombre total de demandes (pour la pagination)
        const totalCount = await prisma.assignmentSwapRequest.count({
            where: whereClause
        });

        console.log(`GET /api/assignments/swap: Récupéré ${swapRequests.length} demandes sur ${totalCount} au total`);
        console.log("--- GET /api/assignments/swap END ---\n");

        return NextResponse.json({
            items: swapRequests,
            total: totalCount,
            offset,
            limit
        });

    } catch (error: any) {
        console.error("GET /api/assignments/swap: Erreur serveur", error);
        return NextResponse.json({
            error: 'Erreur lors de la récupération des demandes d\'échange',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * POST /api/assignments/swap
 * Crée une nouvelle demande d'échange d'affectation
 */
export async function POST(request: NextRequest) {
    console.log("\n--- POST /api/assignments/swap START ---");

    // Authentification
    const token = request.cookies.get('token')?.value ||
        (request.headers.get('Authorization')?.startsWith('Bearer ') ?
            request.headers.get('Authorization')?.substring(7) : null);

    if (!token) {
        console.error("POST /api/assignments/swap: Token manquant");
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const authResult = await verifyAuthToken(token);
    if (!authResult.authenticated) {
        console.error("POST /api/assignments/swap: Token invalide");
        return NextResponse.json({ error: authResult.error || 'Non autorisé' }, { status: 401 });
    }

    const initiatorUserId = authResult.userId;

    try {
        const body = await request.json();
        const {
            proposedAssignmentId,
            targetUserId,
            requestedAssignmentId,
            message,
            expiresAt
        } = body;

        // Validation des données
        if (!proposedAssignmentId) {
            console.warn("POST /api/assignments/swap: proposedAssignmentId manquant");
            return NextResponse.json({
                error: 'L\'ID de l\'affectation proposée est requis'
            }, { status: 400 });
        }

        if (!targetUserId) {
            console.warn("POST /api/assignments/swap: targetUserId manquant");
            return NextResponse.json({
                error: 'L\'ID de l\'utilisateur cible est requis'
            }, { status: 400 });
        }

        // Vérifier que l'affectation proposée appartient bien à l'initiateur
        const proposedAssignment = await prisma.assignment.findUnique({
            where: { id: proposedAssignmentId }
        });

        if (!proposedAssignment) {
            console.warn(`POST /api/assignments/swap: Affectation ${proposedAssignmentId} introuvable`);
            return NextResponse.json({
                error: 'L\'affectation proposée n\'existe pas'
            }, { status: 404 });
        }

        if (proposedAssignment.userId !== initiatorUserId) {
            console.warn(`POST /api/assignments/swap: L'affectation ${proposedAssignmentId} n'appartient pas à l'utilisateur ${initiatorUserId}`);
            return NextResponse.json({
                error: 'Vous ne pouvez proposer que vos propres affectations en échange'
            }, { status: 403 });
        }

        // Vérifier que l'affectation demandée (si spécifiée) appartient bien à la cible
        if (requestedAssignmentId) {
            const requestedAssignment = await prisma.assignment.findUnique({
                where: { id: requestedAssignmentId }
            });

            if (!requestedAssignment) {
                console.warn(`POST /api/assignments/swap: Affectation demandée ${requestedAssignmentId} introuvable`);
                return NextResponse.json({
                    error: 'L\'affectation demandée n\'existe pas'
                }, { status: 404 });
            }

            if (requestedAssignment.userId !== targetUserId) {
                console.warn(`POST /api/assignments/swap: L'affectation ${requestedAssignmentId} n'appartient pas à l'utilisateur ${targetUserId}`);
                return NextResponse.json({
                    error: 'L\'affectation demandée n\'appartient pas à l\'utilisateur cible'
                }, { status: 400 });
            }
        }

        // Création de la demande d'échange dans une transaction pour garantir l'atomicité
        const result = await prisma.$transaction(async (tx) => {
            // Créer la demande d'échange
            const swapRequest = await tx.assignmentSwapRequest.create({
                data: {
                    initiatorUserId,
                    proposedAssignmentId,
                    targetUserId,
                    requestedAssignmentId,
                    status: AssignmentSwapStatus.PENDING,
                    message,
                    expiresAt: expiresAt ? new Date(expiresAt) : undefined
                },
                include: {
                    initiator: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    },
                    targetUser: true,
                    proposedAssignment: true,
                    requestedAssignment: true
                }
            });

            // Envoyer la notification au destinataire
            const notification = await sendAssignmentSwapNotification(
                targetUserId,
                AssignmentSwapEventType.SWAP_REQUESTED,
                swapRequest.id,
                initiatorUserId
            );

            return { swapRequest, notification };
        });

        console.log(`POST /api/assignments/swap: Créé la demande d'échange ${result.swapRequest.id}`);
        console.log(`POST /api/assignments/swap: Envoyé la notification ${result.notification?.id}`);
        console.log("--- POST /api/assignments/swap END ---\n");

        return NextResponse.json(result.swapRequest, { status: 201 });

    } catch (error: any) {
        console.error("POST /api/assignments/swap: Erreur serveur", error);
        return NextResponse.json({
            error: 'Erreur lors de la création de la demande d\'échange',
            details: error.message
        }, { status: 500 });
    }
} 