import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LeaveStatus } from '@prisma/client';
import { verifyAuthToken } from '@/lib/auth-utils';

// Interface pour le format de réponse attendu
interface PendingLeaveWithUser {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    type: string;
    typeCode: string;
    reason: string | null;
    createdAt: string;
    userId: number;
    user: {
        id: number;
        firstName: string;
        lastName: string;
        prenom: string;
        nom: string;
    };
}

/**
 * GET /api/admin/leaves/pending
 * Récupère les deux plus anciennes demandes de congé en attente pour les administrateurs
 */
export async function GET(request: NextRequest) {
    try {
        // Vérifier l'authentification via la fonction existante
        const authResult = await verifyAuthToken();

        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({
                error: 'Non authentifié',
                message: authResult.error
            }, { status: 401 });
        }

        // Vérifier si l'utilisateur est un administrateur
        const userId = authResult.user.id;
        const user = await prisma.user.findUnique({
            where: { id: Number(userId) },
            select: { role: true }
        });

        if (!user || (user.role !== 'ADMIN_TOTAL' && user.role !== 'ADMIN_PARTIEL')) {
            return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
        }

        // Récupérer les deux plus anciennes demandes en attente
        const pendingLeaves = await prisma.leave.findMany({
            where: {
                status: LeaveStatus.PENDING
            },
            orderBy: {
                createdAt: 'asc'
            },
            take: 2,
            include: {
                user: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true
                    }
                }
            }
        });

        // Adapter les données pour le format attendu par le frontend
        const formattedLeaves: PendingLeaveWithUser[] = pendingLeaves.map(leave => {
            const firstName = leave.user?.prenom || '(Prénom non défini)';
            const lastName = leave.user?.nom || '(Nom non défini)';

            return {
                id: String(leave.id),
                startDate: leave.startDate.toISOString(),
                endDate: leave.endDate.toISOString(),
                status: leave.status,
                type: leave.type,
                typeCode: leave.typeCode,
                reason: leave.reason,
                createdAt: leave.createdAt.toISOString(),
                userId: leave.userId,
                user: {
                    id: leave.user?.id || leave.userId,
                    firstName: firstName,
                    lastName: lastName,
                    prenom: firstName,
                    nom: lastName
                }
            };
        });

        return NextResponse.json(formattedLeaves);

    } catch (error) {
        console.error('[API /api/admin/leaves/pending] Erreur:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la récupération des demandes en attente' },
            { status: 500 }
        );
    }
} 