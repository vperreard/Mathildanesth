import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LeaveStatus } from '@prisma/client';

/**
 * DELETE /api/leaves/[id]
 * Annule une demande de congé existante.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = params.id;

    console.log(`[API DELETE /api/leaves/${id}] Requête d'annulation reçue`);

    if (!id) {
        return NextResponse.json({ error: 'ID de congé manquant' }, { status: 400 });
    }

    try {
        // Vérifier si la demande existe
        // @ts-ignore - Le type de l'ID est bien une string selon le schéma mais TS se plaint
        const leave = await prisma.leave.findUnique({
            where: {
                id: id
            }
        });

        if (!leave) {
            return NextResponse.json({ error: 'Demande de congé non trouvée' }, { status: 404 });
        }

        // Vérification du statut - on ne peut annuler que des demandes en attente ou approuvées
        if (leave.status !== LeaveStatus.PENDING && leave.status !== LeaveStatus.APPROVED) {
            return NextResponse.json(
                { error: 'Seules les demandes en attente ou approuvées peuvent être annulées' },
                { status: 400 }
            );
        }

        // Mise à jour du statut à CANCELLED
        // @ts-ignore - Le type de l'ID est bien une string selon le schéma mais TS se plaint
        const updatedLeave = await prisma.leave.update({
            where: {
                id: id
            },
            data: {
                status: LeaveStatus.CANCELLED
            }
        });

        return NextResponse.json(
            {
                id: updatedLeave.id,
                status: updatedLeave.status,
                message: 'Demande de congé annulée avec succès'
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(`[API DELETE /api/leaves/${id}] Erreur lors de l'annulation:`, error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de l\'annulation de la demande de congé' },
            { status: 500 }
        );
    }
} 