import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { LeaveStatus } from '@prisma/client';

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

// Type pour les congés depuis Prisma
interface Leave {
    id: string;
    startDate: Date;
    endDate: Date;
    status: LeaveStatus;
    type: string;
    typeCode: string;
    reason: string | null;
    createdAt: Date;
    userId: number;
    user?: {
        id: number;
        nom: string;
        prenom: string;
    };
}

// Cache pour les données
let cache: {
    data: PendingLeaveWithUser[] | null;
    timestamp: number;
    userId: number | null;
} = {
    data: null,
    timestamp: 0,
    userId: null
};

const CACHE_DURATION = 30 * 1000; // 30 secondes

/**
 * GET /api/admin/conges/pending
 * Récupère les deux plus anciennes demandes de congé en attente pour les administrateurs
 */
export async function GET(request: NextRequest) {
    try {
        // Vérifier l'authentification via Next-Auth
        const session = await getServerSession(authOptions);

        let userIdForRequest: number | null = null;

        if (session && session.user && session.user.id) {
            const userId = typeof session.user.id === 'string'
                ? parseInt(session.user.id, 10)
                : session.user.id as number;
            if (!isNaN(userId)) {
                userIdForRequest = userId;
            }
        } else {
            // Fallback sur l'ancien système d'authentification si NextAuth échoue ou n'est pas utilisé
            const authToken = request.headers.get('Authorization')?.replace('Bearer ', '');
            if (!authToken) {
                return NextResponse.json({
                    error: 'Non authentifié',
                    message: 'Token manquant'
                }, { status: 401 });
            }

            const authResult = await verifyAuthToken(authToken);

            if (!authResult.authenticated || !authResult.userId) {
                return NextResponse.json({
                    error: 'Non authentifié',
                    message: authResult.error || 'Token invalide ou expiré'
                }, { status: 401 });
            }

            userIdForRequest = authResult.userId;
        }

        if (userIdForRequest === null) {
            return NextResponse.json({
                error: 'ID utilisateur invalide ou non authentifié'
            }, { status: 400 });
        }

        return handleAuthorizedRequest(userIdForRequest);
    } catch (error) {
        logger.error('[API /api/admin/conges/pending] Erreur:', error);
        return NextResponse.json(
            {
                error: 'Erreur serveur lors de la récupération des demandes en attente',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

/**
 * Gère la requête une fois l'utilisateur authentifié
 */
async function handleAuthorizedRequest(userId: number) {
    try {
        // Vérifier si l'utilisateur est un administrateur
        const user = await prisma.user.findUnique({
            where: { id: Number(userId) },
            select: { role: true }
        });

        if (!user || (user.role !== 'ADMIN_TOTAL' && user.role !== 'ADMIN_PARTIEL')) {
            return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
        }

        // Vérifier le cache
        const now = Date.now();
        if (cache.data &&
            (now - cache.timestamp) < CACHE_DURATION &&
            cache.userId === userId) {
            return NextResponse.json(cache.data);
        }

        // Récupérer les deux plus anciennes demandes en attente
        const pendingLeaves = await prisma.leave.findMany({
            where: {
                status: 'PENDING' as LeaveStatus
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
        const formattedLeaves: PendingLeaveWithUser[] = pendingLeaves.map((leave: Leave) => {
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

        // Mettre à jour le cache
        cache = {
            data: formattedLeaves,
            timestamp: now,
            userId: userId
        };

        return NextResponse.json(formattedLeaves);
    } catch (error) {
        logger.error('[API /api/admin/conges/pending] Erreur lors du traitement:', error);
        throw error;
    }
} 