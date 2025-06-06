import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma');


const prisma = prisma;

// Vérifier si nous sommes en environnement de test
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.CYPRESS === 'true';

/**
 * DELETE /api/test/clean-swap-requests
 * Supprime toutes les demandes d'échange entre deux utilisateurs pour les tests E2E
 * Cet endpoint est uniquement disponible en environnement de test
 */
export async function DELETE(request: NextRequest) {
    // Vérifier l'environnement
    if (!isTestEnv) {
        logger.error("Tentative d'accès à un endpoint de test en environnement de production");
        return NextResponse.json({ error: 'Endpoint disponible uniquement en environnement de test' }, { status: 403 });
    }

    // Récupérer les paramètres de la requête
    const { searchParams } = new URL(request.url);
    const initiatorId = searchParams.get('initiatorId');
    const targetId = searchParams.get('targetId');

    if (!initiatorId || !targetId) {
        return NextResponse.json({
            error: 'Les paramètres initiatorId et targetId sont requis'
        }, { status: 400 });
    }

    try {
        // Construire la clause where
        const whereClause = {
            OR: [
                {
                    AND: [
                        { initiatorUserId: parseInt(initiatorId) },
                        { targetUserId: parseInt(targetId) }
                    ]
                },
                {
                    AND: [
                        { initiatorUserId: parseInt(targetId) },
                        { targetUserId: parseInt(initiatorId) }
                    ]
                }
            ]
        };

        // Récupérer les IDs des demandes d'échange à supprimer
        const swapRequests = await prisma.assignmentSwapRequest.findMany({
            where: whereClause,
            select: { id: true }
        });

        const swapRequestIds = swapRequests.map(req => req.id);

        // Si aucune demande trouvée, retourner immédiatement
        if (swapRequestIds.length === 0) {
            return NextResponse.json({
                message: 'Aucune demande d\'échange à nettoyer',
                count: 0
            });
        }

        // Supprimer les notifications liées à ces demandes d'échange
        const deletedNotifications = await prisma.notification.deleteMany({
            where: {
                relatedRequestId: {
                    in: swapRequestIds
                }
            }
        });

        // Supprimer les demandes d'échange
        const deletedSwapRequests = await prisma.assignmentSwapRequest.deleteMany({
            where: {
                id: {
                    in: swapRequestIds
                }
            }
        });

        return NextResponse.json({
            message: 'Nettoyage effectué avec succès',
            deletedSwapRequests: deletedSwapRequests.count,
            deletedNotifications: deletedNotifications.count
        });

    } catch (error: unknown) {
        logger.error("Erreur lors du nettoyage des demandes d'échange de test:", { error: error });
        return NextResponse.json({
            error: 'Erreur lors du nettoyage des demandes d\'échange',
            details: error.message
        }, { status: 500 });
    }
} 