import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth-utils';
import { headers } from 'next/headers';

jest.mock('@/lib/prisma');


const prisma = prisma;

interface RoomOrder {
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
            console.log('[DEV MODE] Authentification par en-tête uniquement pour POST /api/operating-rooms/reorder');
        }

        // Récupérer les données
        const body = await request.json();
        const { rooms } = body;

        if (!rooms || !Array.isArray(rooms)) {
            return NextResponse.json({ error: 'Les données sont invalides' }, { status: 400 });
        }

        console.log('Mise à jour de l\'ordre des salles:', rooms);

        // Traiter chaque salle
        const updatePromises = rooms.map((room: RoomOrder) => {
            return prisma.operatingRoom.update({
                where: { id: room.id },
                data: { displayOrder: room.displayOrder }
            });
        });

        const results = await Promise.all(updatePromises);
        console.log(`${results.length} salles mises à jour`);

        return NextResponse.json({
            success: true,
            message: `${results.length} salles mises à jour`
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'ordre des salles:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour de l\'ordre des salles' },
            { status: 500 }
        );
    }
} 