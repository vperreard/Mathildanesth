import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { LeaveStatus, Role as UserRole } from '@prisma/client'; // Assumer que Role est l'enum pour les rôles utilisateurs
import { LeaveQueryCacheService } from '@/modules/leaves/services/LeaveQueryCacheService';
import { LeaveEvent } from '@/modules/leaves/types/cache';

// TODO: Importer une fonction pour récupérer l'ID et le rôle de l'utilisateur connecté
// import { getSessionUser } from '@/lib/auth'; // Exemple

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const { leaveId } = req.query;
    if (typeof leaveId !== 'string') {
        return res.status(400).json({ error: 'Leave ID must be a string.' });
    }

    // const sessionUser = await getSessionUser(req); // { id: number, role: UserRole } | null
    // if (!sessionUser) {
    //     return res.status(401).json({ error: 'Unauthorized' });
    // }

    // Exemple simplifié pour les permissions - À AFFINER SELON C.Q1
    // const isAdmin = sessionUser.role === UserRole.ADMIN_TOTAL || sessionUser.role === UserRole.ADMIN_PARTIEL;
    // if (!isAdmin) {
    //     return res.status(403).json({ error: 'Forbidden: Insufficient permissions to approve leave.' });
    // }
    const mockApproverId = 999; // Remplacer par sessionUser.id

    try {
        const leaveToApprove = await prisma.leave.findUnique({
            where: { id: leaveId },
            select: { status: true, userId: true, startDate: true, endDate: true }
        });

        if (!leaveToApprove) {
            return res.status(404).json({ error: 'Leave not found.' });
        }

        if (leaveToApprove.status !== LeaveStatus.PENDING) {
            return res.status(400).json({ error: `Leave is not in PENDING status (current: ${leaveToApprove.status}). Cannot approve.` });
        }

        const approvedLeave = await prisma.leave.update({
            where: { id: leaveId },
            data: {
                status: LeaveStatus.APPROVED,
                approvalDate: new Date(),
                approvedById: mockApproverId, // Utiliser l'ID de l'utilisateur qui approuve
            },
        });

        // Invalidation du cache
        const cacheService = LeaveQueryCacheService.getInstance();
        const affectedYears = new Set<number>();
        affectedYears.add(new Date(leaveToApprove.startDate).getFullYear());
        affectedYears.add(new Date(leaveToApprove.endDate).getFullYear());
        affectedYears.forEach(year => {
            cacheService.invalidateCache(LeaveEvent.BALANCE_UPDATED, { userId: leaveToApprove.userId.toString(), year });
        });

        // TODO: Créer une notification pour l'utilisateur (C.Q2)
        // await prisma.notification.create({ data: { ... } });

        return res.status(200).json(approvedLeave);

    } catch (error) {
        logger.error('Error approving leave', { error, leaveId });
        return res.status(500).json({ error: 'Internal server error approving leave.' });
    }
} 