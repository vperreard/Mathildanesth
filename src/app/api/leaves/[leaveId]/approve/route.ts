import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, SecurityChecks } from '@/middleware/authorization';
import { LeaveStatus } from '@prisma/client';
import { logger } from '@/lib/logger';

/**
 * POST /api/conges/[leaveId]/approve
 * Approuver une demande de congé - ADMIN uniquement
 */
export const POST = withAuth({
    requireAuth: true,
    allowedRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL'],
    resourceType: 'leave',
    action: 'approve'
})(async (req: NextRequest, context: { params: { leaveId: string } }) => {
    try {
        const leaveId = parseInt(context.params.leaveId);
        const userId = parseInt(req.headers.get('x-user-id') || '0');

        // Vérifier que le congé existe
        const leave = await prisma.leave.findUnique({
            where: { id: leaveId },
            include: { user: true }
        });

        if (!leave) {
            return NextResponse.json(
                { error: 'Leave request not found' },
                { status: 404 }
            );
        }

        // Vérifier que le congé est en attente
        if (leave.status !== LeaveStatus.PENDING) {
            return NextResponse.json(
                { error: 'Leave request is not pending' },
                { status: 400 }
            );
        }

        // Mettre à jour le statut
        const updatedLeave = await prisma.leave.update({
            where: { id: leaveId },
            data: {
                status: LeaveStatus.APPROVED,
                approvedById: userId,
                approvedAt: new Date()
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        email: true
                    }
                }
            }
        });

        // Logger l'action
        logger.info('Leave request approved', {
            leaveId,
            userId: leave.userId,
            approvedBy: userId
        });

        // Créer une notification pour l'utilisateur
        await prisma.notification.create({
            data: {
                userId: leave.userId,
                type: 'LEAVE_APPROVED',
                title: 'Demande de congé approuvée',
                message: `Votre demande de congé du ${leave.startDate.toLocaleDateString()} au ${leave.endDate.toLocaleDateString()} a été approuvée.`,
                link: `/conges/${leaveId}`,
                isRead: false
            }
        });

        return NextResponse.json({
            success: true,
            data: updatedLeave
        });

    } catch (error) {
        logger.error('Error approving leave', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
});