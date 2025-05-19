import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { LeaveStatus, Role as UserRole } from '@prisma/client';
import { LeaveQueryCacheService } from '@/modules/leaves/services/LeaveQueryCacheService';
import { LeaveEvent } from '@/modules/leaves/types/cache';

// TODO: Importer une fonction pour récupérer l'ID et le rôle de l'utilisateur connecté
// import { getSessionUser } from '@/lib/auth'; // Exemple

interface RejectBody {
    rejectionReason?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const { leaveId } = req.query;
    if (typeof leaveId !== 'string') {
        return res.status(400).json({ error: 'Leave ID must be a string.' });
    }

    const { rejectionReason } = req.body as RejectBody;

    // const sessionUser = await getSessionUser(req);
    // if (!sessionUser) {
    //     return res.status(401).json({ error: 'Unauthorized' });
    // }
    // const isAdmin = sessionUser.role === UserRole.ADMIN_TOTAL || sessionUser.role === UserRole.ADMIN_PARTIEL;
    // if (!isAdmin) {
    //     return res.status(403).json({ error: 'Forbidden: Insufficient permissions to reject leave.' });
    // }
    // const mockRejectorId = sessionUser.id; // Pour l'audit log si besoin

    try {
        const leaveToReject = await prisma.leave.findUnique({
            where: { id: leaveId },
            select: { status: true, userId: true, startDate: true, endDate: true }
        });

        if (!leaveToReject) {
            return res.status(404).json({ error: 'Leave not found.' });
        }

        if (leaveToReject.status !== LeaveStatus.PENDING) {
            return res.status(400).json({ error: `Leave is not in PENDING status (current: ${leaveToReject.status}). Cannot reject.` });
        }

        const updateData: { status: LeaveStatus; comment?: string } = {
            status: LeaveStatus.REJECTED,
        };
        if (rejectionReason) {
            // On pourrait stocker rejectionReason dans un champ dédié ou l'ajouter au champ 'comment' existant.
            // Pour l'instant, ajoutons-le au commentaire.
            updateData.comment = `Rejeté: ${rejectionReason}`;
        }

        const rejectedLeave = await prisma.leave.update({
            where: { id: leaveId },
            data: updateData,
        });

        // Invalidation du cache
        const cacheService = LeaveQueryCacheService.getInstance();
        const affectedYears = new Set<number>();
        affectedYears.add(new Date(leaveToReject.startDate).getFullYear());
        affectedYears.add(new Date(leaveToReject.endDate).getFullYear());
        affectedYears.forEach(year => {
            cacheService.invalidateCache(LeaveEvent.BALANCE_UPDATED, { userId: leaveToReject.userId.toString(), year });
        });

        // TODO: Créer une notification pour l'utilisateur (C.Q2)
        // await prisma.notification.create({ data: { ... } });

        return res.status(200).json(rejectedLeave);

    } catch (error) {
        logger.error('Error rejecting leave', { error, leaveId });
        return res.status(500).json({ error: 'Internal server error rejecting leave.' });
    }
} 