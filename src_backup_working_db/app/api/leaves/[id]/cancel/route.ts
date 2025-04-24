import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LeaveStatus } from '@prisma/client';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const leaveId = params.id;
        const { comment } = await request.json();

        console.log(`[API POST /api/leaves/${leaveId}/cancel] Requête d'annulation reçue`);

        // Vérifier que la demande existe
        // @ts-ignore - Le type de l'ID est bien une string selon le schéma mais TS se plaint
        const leave = await prisma.leave.findUnique({
            where: {
                id: leaveId
            },
        });

        if (!leave) {
            return NextResponse.json(
                { error: 'Demande de congé introuvable' },
                { status: 404 }
            );
        }

        // Vérifier que la demande peut être annulée
        // Généralement, on peut annuler uniquement les demandes en attente ou approuvées
        if (leave.status !== LeaveStatus.PENDING && leave.status !== LeaveStatus.APPROVED) {
            return NextResponse.json(
                { error: 'Cette demande de congé ne peut pas être annulée dans son état actuel' },
                { status: 400 }
            );
        }

        // Annuler la demande
        // @ts-ignore - Le type de l'ID est bien une string selon le schéma mais TS se plaint
        const updatedLeave = await prisma.leave.update({
            where: {
                id: leaveId
            },
            data: {
                status: LeaveStatus.CANCELLED,
                updatedAt: new Date(),
            }
        });

        return NextResponse.json({
            id: updatedLeave.id,
            status: updatedLeave.status,
            message: 'Demande de congé annulée avec succès'
        });
    } catch (error: any) {
        console.error('Erreur lors de l\'annulation de la demande de congé:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de l\'annulation de la demande de congé', details: error.message },
            { status: 500 }
        );
    }
} 