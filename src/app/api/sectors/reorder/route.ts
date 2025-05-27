import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth-utils';
import { headers } from 'next/headers';

jest.mock('@/lib/prisma');


const prisma = prisma;

interface SectorOrder {
    id: number;
    displayOrder: number;
}

export async function POST(request: NextRequest) {
    try {
        // Vérifier l'authentification
        const authResult = await verifyAuthToken();

        if (!authResult.authenticated) {
            // Vérifier si l'en-tête x-user-role est présent (pour le développement)
            const headersList = await headers();
            const userRole = headersList.get('x-user-role');

            if (process.env.NODE_ENV !== 'development' || userRole !== 'ADMIN_TOTAL') {
                return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
            }
            console.log('[DEV MODE] Authentification par en-tête uniquement pour POST /api/sectors/reorder');
        }

        // Récupérer les données
        const body = await request.json();
        const { sectors } = body;

        if (!sectors || !Array.isArray(sectors)) {
            return NextResponse.json({ error: 'Les données sont invalides' }, { status: 400 });
        }

        console.log('Mise à jour de l\'ordre des secteurs:', sectors);

        // Traiter chaque secteur
        const updatePromises = sectors.map((sector: SectorOrder) => {
            return prisma.operatingSector.update({
                where: { id: sector.id },
                data: { displayOrder: sector.displayOrder }
            });
        });

        const results = await Promise.all(updatePromises);
        console.log(`${results.length} secteurs mis à jour`);

        return NextResponse.json({
            success: true,
            message: `${results.length} secteurs mis à jour`
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'ordre des secteurs:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour de l\'ordre des secteurs' },
            { status: 500 }
        );
    }
} 