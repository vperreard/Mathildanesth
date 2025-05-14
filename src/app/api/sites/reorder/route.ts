import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !["ADMIN_TOTAL", "ADMIN_PARTIEL"].includes(session.user?.role || '')) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { siteOrders } = await request.json();

        if (!Array.isArray(siteOrders) || siteOrders.length === 0) {
            return NextResponse.json({ error: 'Format invalide' }, { status: 400 });
        }

        // Valider chaque élément du tableau
        for (const order of siteOrders) {
            if (!order.id || typeof order.displayOrder !== 'number') {
                return NextResponse.json({
                    error: 'Chaque élément doit contenir un id et un displayOrder',
                    details: order
                }, { status: 400 });
            }
        }

        // Mettre à jour les sites en une seule transaction
        const result = await prisma.$transaction(
            siteOrders.map(order =>
                prisma.site.update({
                    where: { id: order.id },
                    data: { displayOrder: order.displayOrder }
                })
            )
        );

        return NextResponse.json({
            message: 'Ordre mis à jour avec succès',
            updatedCount: result.length
        });

    } catch (error) {
        console.error('Erreur lors de la réorganisation des sites:', error);
        return NextResponse.json({
            error: 'Erreur lors de la réorganisation des sites',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        }, { status: 500 });
    }
} 