import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/migration-shim';
import { authOptions } from '@/lib/auth/migration-shim';
import { headers } from 'next/headers';


interface SectorOrder {
    id: number;
    displayOrder: number;
}

export async function POST(request: NextRequest) {
    try {
        // Vérifier l'authentification
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Récupérer les données
        const body = await request.json();
        const { sectors } = body;

        if (!sectors || !Array.isArray(sectors)) {
            return NextResponse.json({ error: 'Les données sont invalides' }, { status: 400 });
        }

        logger.info('Mise à jour de l\'ordre des secteurs:', sectors);

        // Traiter chaque secteur
        const updatePromises = sectors.map((sector: SectorOrder) => {
            return prisma.operatingSector.update({
                where: { id: sector.id },
                data: { displayOrder: sector.displayOrder }
            });
        });

        const results = await Promise.all(updatePromises);
        logger.info(`${results.length} secteurs mis à jour`);

        return NextResponse.json({
            success: true,
            message: `${results.length} secteurs mis à jour`
        });
    } catch (error: unknown) {
        logger.error('Erreur lors de la mise à jour de l\'ordre des secteurs:', { error: error });
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour de l\'ordre des secteurs' },
            { status: 500 }
        );
    }
} 