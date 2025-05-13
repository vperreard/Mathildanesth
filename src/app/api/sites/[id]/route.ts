import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

// Fonction utilitaire pour l'authentification (similaire à celle des autres routes)
function checkAuth(requestHeaders: Headers): { userId: string; userRole: string } | null {
    const userId = requestHeaders.get('x-user-id');
    const userRole = requestHeaders.get('x-user-role');
    if (!userId || !userRole) {
        return null;
    }
    return { userId, userRole };
}

// GET /api/sites/[id] - Récupérer un site par ID
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    console.log(`\\n--- GET /api/sites/${params.id} START ---`);
    try {
        const requestHeaders = await headers();
        const auth = checkAuth(requestHeaders);

        if (!auth) {
            console.error(`GET /api/sites/${params.id}: Unauthorized (Middleware headers missing)`);
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }
        console.log(`GET /api/sites/${params.id}: Auth check passed (Middleware)! User ID: ${auth.userId}, Role: ${auth.userRole}`);

        const id = params.id; // L'ID est une chaîne (cuid)

        console.log(`GET /api/sites/${id}: Retrieving site from DB...`);
        const site = await prisma.site.findUnique({
            where: { id },
            // Inclure les champs nécessaires, par exemple :
            // select: { id: true, name: true, description: true, isActive: true, displayOrder: true }
        });

        if (!site) {
            console.warn(`GET /api/sites/${id}: Site not found in DB.`);
            return NextResponse.json({ error: 'Site non trouvé' }, { status: 404 });
        }

        console.log(`GET /api/sites/${id}: Site retrieved successfully.`);
        console.log(`--- GET /api/sites/${id} END ---\\n`);
        return NextResponse.json(site);

    } catch (error) {
        console.error(`Error during GET /api/sites/${params.id}:`, error);
        console.log(`--- GET /api/sites/${params.id} END (with error) ---\\n`);
        return NextResponse.json({ error: 'Erreur lors de la récupération du site' }, { status: 500 });
    }
}

// PUT /api/sites/[id] - Mettre à jour un site par ID
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    console.log(`\\n--- PUT /api/sites/${params.id} START ---`);
    try {
        const requestHeaders = await headers();
        const auth = checkAuth(requestHeaders);

        if (!auth) {
            console.error(`PUT /api/sites/${params.id}: Unauthorized (Middleware headers missing)`);
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }
        if (auth.userRole !== 'ADMIN_TOTAL' && auth.userRole !== 'ADMIN_PARTIEL') {
            console.error(`PUT /api/sites/${params.id}: Forbidden (Role '${auth.userRole}' not allowed)`);
            return NextResponse.json({ error: 'Accès interdit pour modifier un site' }, { status: 403 });
        }
        console.log(`PUT /api/sites/${params.id}: Auth check passed (Middleware)! User ID: ${auth.userId}, Role: ${auth.userRole}`);

        const id = params.id;
        const data = await request.json();
        console.log(`PUT /api/sites/${id} - Received data:`, data);

        if (!data || typeof data.name !== 'string' || !data.name.trim()) {
            console.warn(`PUT /api/sites/${id}: Validation failed - Name is required.`);
            return NextResponse.json({ error: 'Le nom du site est requis' }, { status: 400 });
        }

        console.log(`PUT /api/sites/${id}: Updating site in DB...`);
        const updatedSite = await prisma.site.update({
            where: { id },
            data: {
                name: data.name.trim(),
                description: data.description,
                isActive: data.isActive, // Assumer que le frontend envoie toujours une valeur booléenne
                // displayOrder n'est pas mis à jour ici, géré par une route dédiée /reorder si nécessaire
            },
        });

        console.log(`PUT /api/sites/${id}: Site updated successfully.`);
        console.log(`--- PUT /api/sites/${id} END ---\\n`);
        return NextResponse.json(updatedSite);

    } catch (error) {
        console.error(`Error during PUT /api/sites/${params.id}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                console.error(`Prisma Error P2025: Record to update not found (ID: ${params.id})`);
                return NextResponse.json({ error: 'Site non trouvé pour la mise à jour.' }, { status: 404 });
            }
            if (error.code === 'P2002') {
                const target = error.meta?.target as string[] | undefined;
                if (target && target.includes('name')) {
                    console.error("Prisma Error P2002: Unique constraint violation on field 'name'.");
                    return NextResponse.json({ error: 'Un site avec ce nom existe déjà.' }, { status: 409 });
                }
                console.error("Prisma Error P2002: Unique constraint violation on fields:", target);
                return NextResponse.json({ error: 'Erreur de base de données: Contrainte unique violée.' }, { status: 409 });
            }
        }
        console.log(`--- PUT /api/sites/${params.id} END (with error) ---\\n`);
        return NextResponse.json({ error: 'Erreur lors de la mise à jour du site' }, { status: 500 });
    }
}

// DELETE /api/sites/[id] - Supprimer un site par ID
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    console.log(`\\n--- DELETE /api/sites/${params.id} START ---`);
    try {
        const requestHeaders = await headers();
        const auth = checkAuth(requestHeaders);

        if (!auth) {
            console.error(`DELETE /api/sites/${params.id}: Unauthorized (Middleware headers missing)`);
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }
        if (auth.userRole !== 'ADMIN_TOTAL' && auth.userRole !== 'ADMIN_PARTIEL') {
            console.error(`DELETE /api/sites/${params.id}: Forbidden (Role '${auth.userRole}' not allowed)`);
            return NextResponse.json({ error: 'Accès interdit pour supprimer un site' }, { status: 403 });
        }
        console.log(`DELETE /api/sites/${params.id}: Auth check passed (Middleware)! User ID: ${auth.userId}, Role: ${auth.userRole}`);

        const id = params.id;

        console.log(`DELETE /api/sites/${id}: Attempting to delete site... (Sectors will be detached)`);
        // Supprimer le site. Grâce à onDelete: SetNull, Prisma va mettre siteId à NULL dans OperatingSector
        await prisma.site.delete({
            where: { id },
        });

        console.log(`DELETE /api/sites/${id}: Site deleted successfully.`);
        console.log(`--- DELETE /api/sites/${id} END ---\\n`);
        return NextResponse.json({ message: 'Site supprimé avec succès' });

    } catch (error) {
        console.error(`Error during DELETE /api/sites/${params.id}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            console.error(`Prisma Error P2025: Record to delete not found (ID: ${params.id})`);
            return NextResponse.json({ error: 'Site non trouvé pour la suppression.' }, { status: 404 });
        }
        // D'autres erreurs Prisma pourraient survenir, mais P2003 (FK violation) ne devrait plus arriver pour les secteurs.
        // S'il y a d'autres relations obligatoires vers Site, il faudrait les gérer.
        console.log(`--- DELETE /api/sites/${params.id} END (with error) ---\\n`);
        return NextResponse.json({ error: 'Erreur lors de la suppression du site' }, { status: 500 });
    }
} 