import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { LeaveStatus, Role as UserRolePrisma } from '@prisma/client';
import { LeaveQueryCacheService } from '@/modules/leaves/services/LeaveQueryCacheService';
import { LeaveEvent } from '@/modules/leaves/types/cache';

/**
 * @api {post} /api/leaves/[leaveId]/approve Approuve une demande de congé
 * @apiName ApproveLeave
 * @apiGroup Leaves
 * @apiVersion 1.0.0
 * 
 * @apiParam {string} leaveId ID unique du congé à approuver.
 * 
 * @apiSuccess {Object} leave Le congé mis à jour avec le statut APPROVED.
 * 
 * @apiError (400) BadRequest Le congé n'est pas dans un état qui permet l'approbation.
 * @apiError (403) Forbidden L'utilisateur n'est pas autorisé à approuver des congés.
 * @apiError (404) NotFound Le congé n'a pas été trouvé.
 * @apiError (500) ServerError Erreur serveur interne.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const { leaveId } = req.query;

    if (typeof leaveId !== 'string') {
        return res.status(400).json({ error: 'Leave ID must be a string.' });
    }

    try {
        // TODO: Vérifier l'authentification et l'autorisation
        // const session = await getSession({ req });
        // if (!session) {
        //     return res.status(401).json({ error: 'Unauthorized' });
        // }

        // Vérifier si l'utilisateur a le droit d'approuver des congés
        // Par exemple, seuls les admins et certains rôles (managers, RH) peuvent approuver
        // if (session.user.role !== UserRolePrisma.ADMIN && session.user.role !== UserRolePrisma.ADMIN_PARTIEL) {
        //     return res.status(403).json({ error: 'Forbidden: You are not authorized to approve leave requests.' });
        // }

        // Récupérer le congé
        const leave = await prisma.leave.findUnique({
            where: { id: leaveId },
            include: {
                user: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        email: true,
                    },
                },
            },
        });

        if (!leave) {
            return res.status(404).json({ error: 'Leave not found.' });
        }

        // Vérifier si le congé peut être approuvé (doit être en statut PENDING)
        if (leave.status !== LeaveStatus.PENDING) {
            return res.status(400).json({
                error: `Cannot approve leave with status ${leave.status}. Only PENDING leaves can be approved.`,
            });
        }

        // Vérifier les contraintes métier supplémentaires si nécessaire
        // Par exemple, vérifier s'il y a suffisamment de solde disponible
        // ou s'il n'y a pas de conflits avec d'autres congés approuvés

        // Approuver le congé
        const approvedLeave = await prisma.leave.update({
            where: { id: leaveId },
            data: {
                status: LeaveStatus.APPROVED,
                approvalDate: new Date(),
                // approvedById: session.user.id,
            },
        });

        // Invalider le cache
        const cacheService = LeaveQueryCacheService.getInstance();
        const yearStart = leave.startDate.getFullYear();
        const yearEnd = leave.endDate.getFullYear();
        const years = new Set([yearStart, yearEnd]);

        for (const year of years) {
            cacheService.invalidateCache(LeaveEvent.BALANCE_UPDATED, {
                userId: leave.userId.toString(),
                year
            });
        }

        // TODO: Envoyer une notification à l'utilisateur

        return res.status(200).json({
            message: 'Leave request approved successfully.',
            leave: approvedLeave,
        });
    } catch (error: any) {
        logger.error(`Error approving leave ${leaveId}:`, { error });
        return res.status(500).json({ error: 'Internal server error approving leave.' });
    }
} 