import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { headers } from 'next/headers';

jest.mock('@/lib/prisma');


const prisma = prisma;

// Fonction utilitaire pour l'authentification (similaire à celle des secteurs)
function checkAuth(requestHeaders: Headers): { userId: string; userRole: string } | null {
    const userId = requestHeaders.get('x-user-id');
    const userRole = requestHeaders.get('x-user-role');
    if (!userId || !userRole) {
        return null;
    }
    return { userId, userRole };
}

// GET /api/sites - Lister tous les sites
export async function GET(request: NextRequest) {
    console.log("\\n--- GET /api/sites START ---");
    try {
        const requestHeaders = await headers();
        const auth = checkAuth(requestHeaders);

        // Note: Pour lister les sites, on peut autoriser plus de rôles si nécessaire,
        // mais pour l'instant, on garde la logique admin pour la cohérence avec la création/modif/suppression.
        // Si tous les utilisateurs connectés peuvent voir les sites, ajuster cette vérification.
        if (!auth) {
            console.error("GET /api/sites: Unauthorized (Middleware headers missing)");
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }
        // Pour l'instant, on autorise tous les utilisateurs connectés à voir les sites
        console.log(`GET /api/sites: Auth check passed (Middleware)! User ID: ${auth.userId}, Role: ${auth.userRole}`);


        console.log("GET /api/sites: Retrieving all sites from DB...");
        const sites = await prisma.site.findMany({
            orderBy: [
                { displayOrder: { sort: 'asc', nulls: 'last' } }, // Gérer les nulls explicitement
                { name: 'asc' } // Tri secondaire par nom pour la cohérence
            ],
            // Ajouter la sélection de champs si nécessaire, sinon tous les champs sont renvoyés
            // select: { id: true, name: true, description: true, isActive: true, displayOrder: true }
        });

        console.log(`GET /api/sites: ${sites.length} sites retrieved successfully.`);
        console.log("--- GET /api/sites END ---\\n");
        return NextResponse.json(sites);

    } catch (error) {
        console.error("Error during GET /api/sites:", error);
        console.log("--- GET /api/sites END (with error) ---\\n");
        return NextResponse.json({ error: 'Erreur lors de la récupération des sites' }, { status: 500 });
    }
}

// POST /api/sites - Créer un nouveau site
export async function POST(request: NextRequest) {
    console.log("\\n--- POST /api/sites START ---");
    try {
        const requestHeaders = await headers();
        const auth = checkAuth(requestHeaders);

        if (!auth) {
            console.error("POST /api/sites: Unauthorized (Middleware headers missing)");
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }
        if (auth.userRole !== 'ADMIN_TOTAL' && auth.userRole !== 'ADMIN_PARTIEL') {
            console.error(`POST /api/sites: Forbidden (Role '${auth.userRole}' not allowed)`);
            return NextResponse.json({ error: 'Accès interdit pour créer un site' }, { status: 403 });
        }
        console.log(`POST /api/sites: Auth check passed (Middleware)! User ID: ${auth.userId}, Role: ${auth.userRole}`);

        const data = await request.json();
        console.log("POST /api/sites - Received data:", data);

        if (!data || typeof data.name !== 'string' || !data.name.trim()) {
            console.warn("POST /api/sites: Validation failed - Name is required.");
            return NextResponse.json({ error: 'Le nom du site est requis' }, { status: 400 });
        }

        // Calculer le prochain displayOrder
        const lastSite = await prisma.site.findFirst({
            orderBy: { displayOrder: 'desc' },
        });
        const nextDisplayOrder = (lastSite?.displayOrder ?? -1) + 1;
        console.log(`POST /api/sites - Calculated next displayOrder: ${nextDisplayOrder}`);

        console.log("POST /api/sites: Creating new site in DB...");

        const createData: Prisma.SiteCreateInput = {
            name: data.name.trim(),
            isActive: data.isActive !== undefined ? data.isActive : true,
            displayOrder: nextDisplayOrder,
        };

        if (data.description !== undefined) {
            // Utiliser 'as any' pour contourner le linter si le type Prisma est trop strict
            (createData as any).description = data.description;
        }

        const newSite = await prisma.site.create({
            data: createData,
        });

        console.log("POST /api/sites: Site created successfully:", newSite);
        console.log("--- POST /api/sites END ---\\n");
        return NextResponse.json(newSite, { status: 201 }); // 201 Created status

    } catch (error) {
        console.error("Error during POST /api/sites:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            const target = error.meta?.target as string[] | undefined;
            if (target && target.includes('name')) {
                console.error("Prisma Error P2002: Unique constraint violation on field 'name'.");
                return NextResponse.json({ error: 'Un site avec ce nom existe déjà.' }, { status: 409 }); // 409 Conflict
            }
            console.error("Prisma Error P2002: Unique constraint violation on fields:", target);
            return NextResponse.json({ error: 'Erreur de base de données: Contrainte unique violée.' }, { status: 409 });
        }
        console.log("--- POST /api/sites END (with error) ---\\n");
        return NextResponse.json({ error: 'Erreur lors de la création du site' }, { status: 500 });
    }
} 