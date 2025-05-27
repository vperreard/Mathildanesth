import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { headers } from 'next/headers';

jest.mock('@/lib/prisma');


const prisma = prisma;

// Fonction utilitaire partagée (identique à l'autre fichier)
function parseRules(rulesJson: Prisma.JsonValue): { maxRoomsPerSupervisor: number } {
    const defaultRules = { maxRoomsPerSupervisor: 2 };
    if (typeof rulesJson === 'object' && rulesJson !== null && 'maxRoomsPerSupervisor' in rulesJson && typeof rulesJson.maxRoomsPerSupervisor === 'number') {
        return { maxRoomsPerSupervisor: rulesJson.maxRoomsPerSupervisor };
    }
    if (typeof rulesJson === 'string') {
        try {
            const parsed = JSON.parse(rulesJson);
            if (typeof parsed === 'object' && parsed !== null && 'maxRoomsPerSupervisor' in parsed && typeof parsed.maxRoomsPerSupervisor === 'number') {
                return { maxRoomsPerSupervisor: parsed.maxRoomsPerSupervisor };
            }
        } catch (e) {
            console.warn("Failed to parse rules JSON string:", rulesJson, e);
        }
    }
    console.warn("Invalid or missing rules JSON, returning default:", rulesJson);
    return defaultRules;
}

// Fonction utilitaire pour l'authentification (identique à l'autre fichier)
function checkAuth(requestHeaders: Headers): { userId: string; userRole: string } | null {
    const userId = requestHeaders.get('x-user-id');
    const userRole = requestHeaders.get('x-user-role');
    if (!userId || !userRole) {
        return null;
    }
    return { userId, userRole };
}

// --- GET /api/sectors/[id] (Prisma - JSON Rules) ---
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    console.log(`\n--- GET /api/sectors/${params.id} START (Prisma - JSON Rules) ---`);
    try {
        const requestHeaders = await headers();
        const auth = checkAuth(requestHeaders);

        if (!auth) {
            console.error(`GET /api/sectors/${params.id}: Unauthorized (Middleware headers missing)`);
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }
        console.log(`GET /api/sectors/${params.id}: Auth check passed (Middleware)! User ID: ${auth.userId}, Role: ${auth.userRole}`);

        const id = parseInt(params.id);
        if (isNaN(id)) {
            console.warn(`GET /api/sectors/${params.id}: Invalid ID format.`);
            return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
        }

        console.log(`GET /api/sectors/${id}: Retrieving sector from DB...`);
        const sector = await prisma.operatingSector.findUnique({
            where: { id },
            select: { // Sélectionner les champs incluant `rules`
                id: true,
                name: true,
                colorCode: true,
                isActive: true,
                description: true,
                rules: true, // Sélectionner le champ JSON
            }
        });

        if (!sector) {
            console.warn(`GET /api/sectors/${id}: Sector not found in DB.`);
            return NextResponse.json({ error: 'Secteur non trouvé' }, { status: 404 });
        }

        // Mapper la réponse, en parsant le JSON `rules`
        const parsedRules = parseRules(sector.rules);
        const responseData = {
            id: sector.id,
            name: sector.name,
            colorCode: sector.colorCode,
            color: sector.colorCode,
            isActive: sector.isActive,
            description: sector.description,
            rules: parsedRules
        };

        console.log(`GET /api/sectors/${id}: Sector retrieved successfully.`);
        console.log(`--- GET /api/sectors/${id} END (Prisma - JSON Rules) ---\n`);
        return NextResponse.json(responseData);

    } catch (error) {
        console.error(`Error during GET /api/sectors/${params.id} (Prisma - JSON Rules):`, error);
        console.log(`--- GET /api/sectors/${params.id} END (Prisma - with error) ---\n`);
        return NextResponse.json({ error: 'Erreur lors de la récupération du secteur' }, { status: 500 });
    }
}

// --- PUT /api/sectors/[id] (Prisma - JSON Rules) ---
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    console.log(`\n--- PUT /api/sectors/${params.id} START (Prisma - JSON Rules) ---`);
    try {
        const requestHeaders = await headers();
        const auth = checkAuth(requestHeaders);

        if (!auth) {
            console.error(`PUT /api/sectors/${params.id}: Unauthorized (Middleware headers missing)`);
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }
        if (auth.userRole !== 'ADMIN_TOTAL' && auth.userRole !== 'ADMIN_PARTIEL') {
            console.error(`PUT /api/sectors/${params.id}: Forbidden (Role '${auth.userRole}' not allowed)`);
            return NextResponse.json({ error: 'Accès interdit pour modifier' }, { status: 403 });
        }
        console.log(`PUT /api/sectors/${params.id}: Auth check passed (Middleware)! User ID: ${auth.userId}, Role: ${auth.userRole}`);

        const id = parseInt(params.id);
        if (isNaN(id)) {
            console.warn(`PUT /api/sectors/${params.id}: Invalid ID format.`);
            return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
        }

        const data = await request.json();
        console.log(`PUT /api/sectors/${id} - Received data:`, data);

        if (!data || typeof data.name !== 'string' || !data.name.trim()) {
            console.warn(`PUT /api/sectors/${id}: Validation failed - Name is required.`);
            return NextResponse.json({ error: 'Le nom du secteur est requis' }, { status: 400 });
        }

        // Préparer l'objet JSON pour le champ `rules`
        let maxRooms = 2; // Default value
        if (data.rules?.maxRoomsPerSupervisor !== undefined) {
            const parsedMax = parseInt(data.rules.maxRoomsPerSupervisor, 10);
            if (!isNaN(parsedMax)) {
                maxRooms = parsedMax;
            }
        }
        const rulesData: Prisma.InputJsonObject = {
            maxRoomsPerSupervisor: maxRooms
        };
        console.log(`PUT /api/sectors/${id} - Updating sector with rules:`, rulesData);

        // Mettre à jour le secteur
        const updatedSector = await prisma.operatingSector.update({
            where: { id },
            data: {
                name: data.name.trim(),
                colorCode: data.colorCode,
                isActive: data.isActive,
                description: data.description,
                rules: rulesData, // Mettre à jour le champ JSON
            },
        });

        // Mapper la réponse
        const parsedRules = parseRules(updatedSector.rules);
        const responseData = {
            id: updatedSector.id,
            name: updatedSector.name,
            colorCode: updatedSector.colorCode,
            color: updatedSector.colorCode,
            isActive: updatedSector.isActive,
            description: updatedSector.description,
            rules: parsedRules
        };

        console.log(`PUT /api/sectors/${id}: Sector updated successfully.`);
        console.log(`--- PUT /api/sectors/${id} END (Prisma - JSON Rules) ---\n`);
        return NextResponse.json(responseData);

    } catch (error) {
        console.error(`Error during PUT /api/sectors/${params.id} (Prisma - JSON Rules):`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                console.error(`Prisma Error P2025: Record to update not found (ID: ${params.id})`);
                return NextResponse.json({ error: 'Secteur non trouvé pour la mise à jour.' }, { status: 404 });
            }
            if (error.code === 'P2002') {
                const target = error.meta?.target as string[] | undefined;
                if (target && target.includes('name')) {
                    return NextResponse.json({ error: 'Un secteur avec ce nom existe déjà.' }, { status: 409 });
                }
                console.error("Prisma Error P2002: Unique constraint violation on fields:", target);
                return NextResponse.json({ error: 'Erreur de base de données: Contrainte unique violée.' }, { status: 409 });
            }
        }
        console.log(`--- PUT /api/sectors/${params.id} END (Prisma - with error) ---\n`);
        return NextResponse.json({ error: 'Erreur lors de la mise à jour du secteur' }, { status: 500 });
    }
}

// --- DELETE /api/sectors/[id] (Prisma - JSON Rules) ---
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    console.log(`\n--- DELETE /api/sectors/${params.id} START (Prisma - JSON Rules) ---`);
    try {
        const requestHeaders = await headers();
        const auth = checkAuth(requestHeaders);

        if (!auth) {
            console.error(`DELETE /api/sectors/${params.id}: Unauthorized (Middleware headers missing)`);
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }
        if (auth.userRole !== 'ADMIN_TOTAL' && auth.userRole !== 'ADMIN_PARTIEL') {
            console.error(`DELETE /api/sectors/${params.id}: Forbidden (Role '${auth.userRole}' not allowed)`);
            return NextResponse.json({ error: 'Accès interdit pour supprimer' }, { status: 403 });
        }
        console.log(`DELETE /api/sectors/${params.id}: Auth check passed (Middleware)! User ID: ${auth.userId}, Role: ${auth.userRole}`);

        const id = parseInt(params.id);
        if (isNaN(id)) {
            console.warn(`DELETE /api/sectors/${params.id}: Invalid ID format.`);
            return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
        }

        console.log(`DELETE /api/sectors/${id}: Attempting to delete sector...`);
        // Supprimer le secteur
        await prisma.operatingSector.delete({
            where: { id },
        });

        console.log(`DELETE /api/sectors/${id}: Sector deleted successfully.`);
        console.log(`--- DELETE /api/sectors/${id} END (Prisma - JSON Rules) ---\n`);
        return NextResponse.json({ message: 'Secteur supprimé avec succès' });

    } catch (error) {
        console.error(`Error during DELETE /api/sectors/${params.id} (Prisma - JSON Rules):`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                console.error(`Prisma Error P2025: Record to delete not found (ID: ${params.id})`);
                return NextResponse.json({ error: 'Secteur non trouvé pour la suppression.' }, { status: 404 });
            }
        }
        console.log(`--- DELETE /api/sectors/${params.id} END (Prisma - with error) ---\n`);
        return NextResponse.json({ error: 'Erreur lors de la suppression du secteur' }, { status: 500 });
    }
}