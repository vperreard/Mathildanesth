import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

// Helper pour vérifier les rôles admin
const hasRequiredRole = (): boolean => {
    const headersList = headers();
    const userRoleString = headersList.get('x-user-role');
    return !!userRoleString && ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(userRoleString);
};

// --- GET : Lister toutes les salles opératoires ---
export async function GET() {
    try {
        const operatingRooms = await prisma.operatingRoomConfig.findMany({
            orderBy: [
                { sector: 'asc' },
                { number: 'asc' }
            ]
        });
        return NextResponse.json(operatingRooms);
    } catch (error) {
        console.error("Erreur GET /api/operating-rooms:", error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur lors de la récupération des salles opératoires.' },
            { status: 500 }
        );
    }
}

// --- POST : Créer une nouvelle salle opératoire ---
export async function POST(request: Request) {
    // Seul un admin peut créer
    if (!hasRequiredRole()) {
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 });
    }

    try {
        const body = await request.json();
        const { name, number, sector, colorCode, isActive, supervisionRules } = body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return new NextResponse(JSON.stringify({ message: 'Le nom de la salle est obligatoire.' }), { status: 400 });
        }

        if (!number || typeof number !== 'string' || number.trim() === '') {
            return new NextResponse(JSON.stringify({ message: 'Le numéro de la salle est obligatoire.' }), { status: 400 });
        }

        if (!sector || typeof sector !== 'string' || sector.trim() === '') {
            return new NextResponse(JSON.stringify({ message: 'Le secteur de la salle est obligatoire.' }), { status: 400 });
        }

        // Vérifier si une salle avec ce numéro existe déjà
        const existingRoom = await prisma.operatingRoomConfig.findFirst({
            where: {
                number: number.trim()
            }
        });

        if (existingRoom) {
            return new NextResponse(JSON.stringify({ message: 'Une salle avec ce numéro existe déjà.' }), { status: 409 });
        }

        const newRoom = await prisma.operatingRoomConfig.create({
            data: {
                name: name.trim(),
                number: number.trim(),
                sector: sector.trim(),
                colorCode: colorCode || null,
                isActive: isActive === undefined ? true : isActive,
                supervisionRules: supervisionRules || {},
            },
        });
        return new NextResponse(JSON.stringify(newRoom), { status: 201 });

    } catch (error) {
        console.error("Erreur POST /api/operating-rooms:", error);
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
} 