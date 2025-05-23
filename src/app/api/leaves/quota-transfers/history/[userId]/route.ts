import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
    params: {
        userId: string;
    };
}

export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { userId } = await Promise.resolve(params);

        if (!userId) {
            return NextResponse.json(
                { error: "L'identifiant de l'utilisateur est requis" },
                { status: 400 }
            );
        }

        // Convertir l'ID utilisateur en nombre
        const userIdInt = parseInt(userId, 10);
        if (isNaN(userIdInt)) {
            return NextResponse.json(
                { error: "L'identifiant d'utilisateur doit être un nombre valide" },
                { status: 400 }
            );
        }

        // Récupérer les transferts de l'utilisateur
        const transferHistory = await prisma.quotaTransfer.findMany({
            where: {
                userId: userIdInt
            },
            orderBy: {
                transferDate: 'desc'
            },
            include: {
                approvedBy: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true
                    }
                }
            }
        });

        // Formater les dates pour une meilleure lisibilité
        const formattedHistory = transferHistory.map(transfer => ({
            ...transfer,
            transferDate: transfer.transferDate.toISOString(),
            createdAt: transfer.createdAt.toISOString(),
            updatedAt: transfer.updatedAt.toISOString(),
            approvalDate: transfer.approvalDate ? transfer.approvalDate.toISOString() : null
        }));

        return NextResponse.json(formattedHistory);

    } catch (error) {
        console.error("Erreur lors de la récupération de l'historique des transferts:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de la récupération de l'historique des transferts" },
            { status: 500 }
        );
    }
} 