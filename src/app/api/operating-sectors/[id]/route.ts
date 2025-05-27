import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

jest.mock('@/lib/prisma');


// Helper pour vérifier les rôles admin
const hasRequiredRole = async (): Promise<boolean> => {
    const headersList = await headers();
    const userRoleString = headersList.get('x-user-role');
    return !!userRoleString && ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(userRoleString);
};

interface Context {
    params: {
        id: string;
    };
}

// GET : Récupérer un secteur spécifique
export async function GET(request: Request, context: Context) {
    const { id } = context.params;
    const sectorId = parseInt(id);

    if (isNaN(sectorId)) {
        return new NextResponse(JSON.stringify({ message: 'ID invalide' }), { status: 400 });
    }

    try {
        // Vérifier si la table existe
        const tableExists = await checkIfTableExists('OperatingSector');

        // Si la table n'existe pas, mais qu'il s'agit d'un ID de secteur par défaut, on le renvoie
        if (!tableExists && sectorId >= 1 && sectorId <= 5) {
            const defaultSectors = [
                { id: 1, name: 'Hyperaseptique', colorCode: '#3B82F6', isActive: true, description: 'Salles 1-4', rules: { maxRoomsPerSupervisor: 2 } },
                { id: 2, name: 'Secteur 5-8', colorCode: '#10B981', isActive: true, description: 'Salles 5-8 et Césarienne', rules: { maxRoomsPerSupervisor: 2 } },
                { id: 3, name: 'Secteur 9-12B', colorCode: '#F97316', isActive: true, description: 'Salles 9-12 et 12bis', rules: { maxRoomsPerSupervisor: 2 } },
                { id: 4, name: 'Ophtalmologie', colorCode: '#EC4899', isActive: true, description: 'Salles Ophta 1-4', rules: { maxRoomsPerSupervisor: 3 } },
                { id: 5, name: 'Endoscopie', colorCode: '#4F46E5', isActive: true, description: 'Salles Endo 1-4', rules: { maxRoomsPerSupervisor: 2 } }
            ];

            const defaultSector = defaultSectors.find(s => s.id === sectorId);
            if (defaultSector) {
                return NextResponse.json(defaultSector);
            }
        }

        if (tableExists) {
            const sector = await prisma.$queryRawUnsafe(
                `SELECT * FROM "OperatingSector" WHERE id = $1`,
                sectorId
            );

            if (Array.isArray(sector) && sector.length > 0) {
                return NextResponse.json(sector[0]);
            }
        }

        return new NextResponse(JSON.stringify({ message: 'Secteur non trouvé' }), { status: 404 });
    } catch (error) {
        console.error(`Erreur GET /api/operating-sectors/${id}:`, error);
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
}

// PUT : Mettre à jour un secteur spécifique
export async function PUT(request: Request, context: Context) {
    // Vérifier les permissions
    if (!await hasRequiredRole()) {
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 });
    }

    const { id } = context.params;
    const sectorId = parseInt(id);

    if (isNaN(sectorId)) {
        return new NextResponse(JSON.stringify({ message: 'ID invalide' }), { status: 400 });
    }

    try {
        const body = await request.json();
        const { name, colorCode, isActive, description, rules } = body;

        // Vérifications de base
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return new NextResponse(JSON.stringify({ message: 'Le nom du secteur est obligatoire.' }), { status: 400 });
        }

        // Vérifier si la table existe
        const tableExists = await checkIfTableExists('OperatingSector');

        if (!tableExists) {
            return new NextResponse(JSON.stringify({ message: 'Table des secteurs non trouvée' }), { status: 404 });
        }

        // Vérifier si le secteur existe
        const existingSector = await prisma.$queryRawUnsafe(
            `SELECT * FROM "OperatingSector" WHERE id = $1`,
            sectorId
        );

        if (!Array.isArray(existingSector) || existingSector.length === 0) {
            return new NextResponse(JSON.stringify({ message: 'Secteur non trouvé' }), { status: 404 });
        }

        // Vérifier si le nom est déjà utilisé par un autre secteur
        if (name !== existingSector[0].name) {
            const sectorWithSameName = await prisma.$queryRawUnsafe(
                `SELECT * FROM "OperatingSector" WHERE name = $1 AND id != $2`,
                name.trim(),
                sectorId
            );

            if (Array.isArray(sectorWithSameName) && sectorWithSameName.length > 0) {
                return new NextResponse(JSON.stringify({ message: 'Un autre secteur avec ce nom existe déjà.' }), { status: 409 });
            }
        }

        // Mettre à jour le secteur
        const updatedSector = await prisma.$queryRawUnsafe(
            `UPDATE "OperatingSector" SET 
             name = $1, 
             "colorCode" = $2, 
             "isActive" = $3, 
             description = $4, 
             rules = $5, 
             "updatedAt" = NOW() 
             WHERE id = $6 
             RETURNING *`,
            name.trim(),
            colorCode || '#000000',
            isActive === undefined ? true : isActive,
            description || '',
            JSON.stringify(rules || {}),
            sectorId
        );

        if (Array.isArray(updatedSector) && updatedSector.length > 0) {
            return NextResponse.json(updatedSector[0]);
        }

        return new NextResponse(JSON.stringify({ message: 'Erreur lors de la mise à jour du secteur' }), { status: 500 });
    } catch (error) {
        console.error(`Erreur PUT /api/operating-sectors/${id}:`, error);
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
}

// DELETE : Supprimer un secteur spécifique
export async function DELETE(request: Request, context: Context) {
    // Vérifier les permissions (seul un admin total peut supprimer)
    const headersList = await headers();
    const userRoleString = headersList.get('x-user-role');
    if (userRoleString !== 'ADMIN_TOTAL') {
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé. Seul un administrateur total peut supprimer un secteur.' }), { status: 403 });
    }

    const { id } = context.params;
    const sectorId = parseInt(id);

    if (isNaN(sectorId)) {
        return new NextResponse(JSON.stringify({ message: 'ID invalide' }), { status: 400 });
    }

    try {
        // Vérifier si la table existe
        const tableExists = await checkIfTableExists('OperatingSector');

        if (!tableExists) {
            return new NextResponse(JSON.stringify({ message: 'Table des secteurs non trouvée' }), { status: 404 });
        }

        // Vérifier si le secteur existe
        const sector = await prisma.$queryRawUnsafe(
            `SELECT * FROM "OperatingSector" WHERE id = $1`,
            sectorId
        );

        if (!Array.isArray(sector) || sector.length === 0) {
            return new NextResponse(JSON.stringify({ message: 'Secteur non trouvé' }), { status: 404 });
        }

        // 🔐 CORRECTION TODO CRITIQUE : Vérifier si le secteur est utilisé dans des salles existantes
        const connectedRooms = await prisma.$queryRawUnsafe(
            `SELECT id, name FROM "OperatingRoom" WHERE "operatingSectorId" = $1 LIMIT 10`,
            sectorId
        );

        if (Array.isArray(connectedRooms) && connectedRooms.length > 0) {
            const roomNames = (connectedRooms as any[]).map(room => room.name).join(', ');
            return new NextResponse(JSON.stringify({
                message: 'Impossible de supprimer ce secteur car il est utilisé par des salles existantes.',
                details: `Salles connectées: ${roomNames}${connectedRooms.length === 10 ? ' (et d\'autres...)' : ''}`,
                connectedRoomsCount: connectedRooms.length
            }), { status: 409 });
        }

        // Supprimer le secteur
        await prisma.$queryRawUnsafe(
            `DELETE FROM "OperatingSector" WHERE id = $1`,
            sectorId
        );

        return new NextResponse(JSON.stringify({ message: 'Secteur supprimé avec succès' }), { status: 200 });
    } catch (error) {
        console.error(`Erreur DELETE /api/operating-sectors/${id}:`, error);
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
}

// Helper pour vérifier si une table existe dans la base de données
async function checkIfTableExists(tableName: string): Promise<boolean> {
    try {
        // On essaye de récupérer un enregistrement, s'il y a une erreur PrismaClientKnownRequestError
        // avec le code P2010, cela signifie que la table n'existe pas
        await prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}" LIMIT 1`);
        return true;
    } catch (error: any) {
        if (error.code === 'P2010') {
            return false;
        }
        // Une autre erreur s'est produite
        throw error;
    }
} 