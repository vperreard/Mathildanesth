import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

// Helper pour vérifier les rôles autorisés (ADMIN_TOTAL ou ADMIN_PARTIEL)
const hasRequiredRole = async (): Promise<boolean> => {
    const headersList = await headers();
    const userRoleString = headersList.get('x-user-role');
    console.log(`[Helper hasRequiredRole] Header 'x-user-role': ${userRoleString}`);
    return !!userRoleString && ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(userRoleString);
};

// --- GET : Lister tous les chirurgiens ---
export async function GET(request: Request) {
    const headersList = await headers();
    const receivedRole = headersList.get('x-user-role');
    console.log(`[GET /api/chirurgiens] Rôle reçu dans l'API : ${receivedRole}`);

    if (!await hasRequiredRole()) {
        console.log(`[GET /api/chirurgiens] Accès refusé (403) pour le rôle : ${receivedRole}`);
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 });
    }
    console.log(`[GET /api/chirurgiens] Accès autorisé pour le rôle : ${receivedRole}`);

    try {
        const { searchParams } = new URL(request.url);
        const includeInactive = searchParams.get('includeInactive') === 'true';

        let whereClause = {};
        if (!includeInactive) {
            whereClause = { status: 'ACTIF' };
        }

        const surgeons = await prisma.surgeon.findMany({
            where: whereClause,
            orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
            include: {
                specialties: {
                    select: { id: true, name: true }
                },
                sites: {
                    select: { id: true, name: true }
                }
            }
        });
        return NextResponse.json(surgeons);
    } catch (error) {
        console.error("Erreur GET /api/chirurgiens:", error);
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
}

// --- POST : Créer un nouveau chirurgien ---
export async function POST(request: Request) {
    if (!await hasRequiredRole()) {
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 });
    }

    try {
        const body = await request.json();
        const { nom, prenom, status, userId, specialtyIds, email, phoneNumber, siteIds } = body;

        if (!nom || !prenom) {
            return new NextResponse(JSON.stringify({ message: 'Nom et prénom sont obligatoires.' }), { status: 400 });
        }
        if (specialtyIds && (!Array.isArray(specialtyIds) || !specialtyIds.every(id => Number.isInteger(id)))) {
            return new NextResponse(JSON.stringify({ message: 'Le format des spécialités est invalide (doit être un tableau d\'IDs numériques).' }), { status: 400 });
        }
        if (siteIds && (!Array.isArray(siteIds) || !siteIds.every(id => typeof id === 'string'))) {
            return new NextResponse(JSON.stringify({ message: 'Le format des sites est invalide (doit être un tableau d\'IDs string).' }), { status: 400 });
        }

        const newSurgeon = await prisma.surgeon.create({
            data: {
                nom,
                prenom,
                status: status || 'ACTIF',
                userId: userId && !isNaN(parseInt(userId)) ? parseInt(userId) : null,
                email: email || null,
                phoneNumber: phoneNumber || null,
                specialties: specialtyIds && specialtyIds.length > 0
                    ? { connect: specialtyIds.map((id: number) => ({ id })) }
                    : undefined,
                sites: siteIds && siteIds.length > 0
                    ? { connect: siteIds.map((id: string) => ({ id })) }
                    : undefined,
            },
            include: {
                specialties: { select: { id: true, name: true } },
                sites: { select: { id: true, name: true } }
            }
        });

        return new NextResponse(JSON.stringify(newSurgeon), { status: 201 });

    } catch (error: any) {
        console.error("Erreur POST /api/chirurgiens:", error);
        // Gérer les erreurs potentielles (ex: contrainte unique si on en ajoute)
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
} 