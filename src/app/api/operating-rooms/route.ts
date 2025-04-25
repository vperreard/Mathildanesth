import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { Prisma } from '@prisma/client';

// Helper pour vérifier les rôles admin
const hasRequiredRole = (): boolean => {
    const headersList = headers();
    const userRoleString = headersList.get('x-user-role');
    return !!userRoleString && ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(userRoleString);
};

// --- GET : Lister toutes les salles opératoires ---
export async function GET() {
    try {
        const operatingRooms = await prisma.operatingRoom.findMany({
            include: {
                sector: true // Inclure les informations du secteur lié
            },
            orderBy: {
                // Optionnel: trier par nom de secteur puis par nom de salle?
                // sector: {
                //     name: 'asc'
                // },
                name: 'asc'
            },
        });

        // Mapper les résultats pour inclure le nom du secteur directement
        const formattedRooms = operatingRooms.map(room => ({
            ...room,
            sector: room.sector.name, // Remplacer l'objet secteur par son nom
            sectorId: room.sectorId // Garder l'ID si besoin ailleurs
        }));

        return NextResponse.json(formattedRooms);
    } catch (error) {
        console.error("Erreur GET /api/operating-rooms:", error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur lors de la récupération des salles opératoires.' },
            { status: 500 }
        );
    }
}

// --- POST : Créer une nouvelle salle opératoire ---
export async function POST(request: NextRequest) {
    // Seul un admin peut créer
    if (!hasRequiredRole()) {
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 });
    }

    let data: any;

    try {
        data = await request.json();

        if (!data.name || !data.number || !data.sectorId) {
            return NextResponse.json({ error: 'Nom, numéro et ID de secteur requis' }, { status: 400 });
        }

        const existingRoom = await prisma.operatingRoom.findFirst({
            where: { number: data.number }
        });

        if (existingRoom) {
            return NextResponse.json({ error: `Une salle avec le numéro ${data.number} existe déjà.` }, { status: 409 });
        }

        const newRoom = await prisma.operatingRoom.create({
            data: {
                name: data.name,
                number: data.number,
                sectorId: data.sectorId,
                colorCode: data.colorCode,
                isActive: data.isActive !== undefined ? data.isActive : true,
                supervisionRules: data.supervisionRules || {},
            },
        });
        return new NextResponse(JSON.stringify(newRoom), { status: 201 });

    } catch (error: any) {
        console.error('Erreur lors de la création de la salle:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return NextResponse.json({ error: `Une salle avec ce numéro existe déjà.` }, { status: 409 });
            } else if (error.code === 'P2003') {
                let fieldName = error.meta?.field_name;
                let failedValue = 'inconnue';
                if (typeof fieldName === 'string' && data && data[fieldName]) {
                    failedValue = data[fieldName];
                }
                return NextResponse.json({ error: `La valeur fournie pour le champ '${fieldName || 'inconnu'}' (valeur: ${failedValue}) n'est pas valide ou n'existe pas.` }, { status: 400 });
            }
        }
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
} 