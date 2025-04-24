import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

// Helper pour vérifier les rôles admin
const hasRequiredRole = (): boolean => {
    const headersList = headers();
    const userRoleString = headersList.get('x-user-role');
    return !!userRoleString && ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(userRoleString);
};

interface Context {
    params: {
        id: string;
    };
}

// GET : Récupérer une salle opératoire spécifique
export async function GET(request: Request, context: Context) {
    const { id } = context.params;
    const roomId = parseInt(id);

    if (isNaN(roomId)) {
        return new NextResponse(JSON.stringify({ message: 'ID invalide' }), { status: 400 });
    }

    try {
        const room = await prisma.operatingRoomConfig.findUnique({
            where: { id: roomId }
        });

        if (!room) {
            return new NextResponse(JSON.stringify({ message: 'Salle opératoire non trouvée' }), { status: 404 });
        }

        return NextResponse.json(room);
    } catch (error) {
        console.error(`Erreur GET /api/operating-rooms/${id}:`, error);
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
}

// PUT : Mettre à jour une salle opératoire spécifique
export async function PUT(request: Request, context: Context) {
    // Vérifier les permissions
    if (!hasRequiredRole()) {
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 });
    }

    const { id } = context.params;
    const roomId = parseInt(id);

    if (isNaN(roomId)) {
        return new NextResponse(JSON.stringify({ message: 'ID invalide' }), { status: 400 });
    }

    try {
        const body = await request.json();
        const { name, number, sector, colorCode, isActive, supervisionRules } = body;

        // Vérifications de base
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return new NextResponse(JSON.stringify({ message: 'Le nom de la salle est obligatoire.' }), { status: 400 });
        }

        if (!number || typeof number !== 'string' || number.trim() === '') {
            return new NextResponse(JSON.stringify({ message: 'Le numéro de la salle est obligatoire.' }), { status: 400 });
        }

        if (!sector || typeof sector !== 'string' || sector.trim() === '') {
            return new NextResponse(JSON.stringify({ message: 'Le secteur de la salle est obligatoire.' }), { status: 400 });
        }

        // Vérifier si la salle existe
        const existingRoom = await prisma.operatingRoomConfig.findUnique({
            where: { id: roomId }
        });

        if (!existingRoom) {
            return new NextResponse(JSON.stringify({ message: 'Salle opératoire non trouvée' }), { status: 404 });
        }

        // Vérifier si le numéro est déjà utilisé par une autre salle
        if (number !== existingRoom.number) {
            const roomWithSameNumber = await prisma.operatingRoomConfig.findFirst({
                where: {
                    number: number.trim(),
                    id: { not: roomId }
                }
            });

            if (roomWithSameNumber) {
                return new NextResponse(JSON.stringify({ message: 'Une autre salle avec ce numéro existe déjà.' }), { status: 409 });
            }
        }

        // Mettre à jour la salle
        const updatedRoom = await prisma.operatingRoomConfig.update({
            where: { id: roomId },
            data: {
                name: name.trim(),
                number: number.trim(),
                sector: sector.trim(),
                colorCode: colorCode || null,
                isActive: isActive === undefined ? true : isActive,
                supervisionRules: supervisionRules || existingRoom.supervisionRules,
            }
        });

        return NextResponse.json(updatedRoom);
    } catch (error) {
        console.error(`Erreur PUT /api/operating-rooms/${id}:`, error);
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
}

// DELETE : Supprimer une salle opératoire spécifique
export async function DELETE(request: Request, context: Context) {
    // Vérifier les permissions (seul un admin total peut supprimer)
    const headersList = headers();
    const userRoleString = headersList.get('x-user-role');
    if (userRoleString !== 'ADMIN_TOTAL') {
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé. Seul un administrateur total peut supprimer une salle.' }), { status: 403 });
    }

    const { id } = context.params;
    const roomId = parseInt(id);

    if (isNaN(roomId)) {
        return new NextResponse(JSON.stringify({ message: 'ID invalide' }), { status: 400 });
    }

    try {
        // Vérifier si la salle existe
        const room = await prisma.operatingRoomConfig.findUnique({
            where: { id: roomId }
        });

        if (!room) {
            return new NextResponse(JSON.stringify({ message: 'Salle opératoire non trouvée' }), { status: 404 });
        }

        // TODO: Vérifier si la salle est utilisée dans des plannings existants
        // Si c'est le cas, on pourrait renvoyer une erreur ou proposer une solution alternative

        // Supprimer la salle
        await prisma.operatingRoomConfig.delete({
            where: { id: roomId }
        });

        return new NextResponse(JSON.stringify({ message: 'Salle supprimée avec succès' }), { status: 200 });
    } catch (error) {
        console.error(`Erreur DELETE /api/operating-rooms/${id}:`, error);
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
} 