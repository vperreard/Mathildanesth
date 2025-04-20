import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

// Helper pour vérifier les rôles autorisés (ADMIN_TOTAL ou ADMIN_PARTIEL)
const hasRequiredRole = (): boolean => {
    const headersList = headers();
    const userRoleString = headersList.get('x-user-role');
    console.log(`[Helper hasRequiredRole] Header 'x-user-role': ${userRoleString}`);
    return !!userRoleString && ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(userRoleString);
};

// --- GET : Lister tous les chirurgiens ---
export async function GET(request: Request) {
    const receivedRole = headers().get('x-user-role');
    console.log(`[GET /api/chirurgiens] Rôle reçu dans l'API : ${receivedRole}`);

    if (!hasRequiredRole()) {
        console.log(`[GET /api/chirurgiens] Accès refusé (403) pour le rôle : ${receivedRole}`);
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 });
    }
    console.log(`[GET /api/chirurgiens] Accès autorisé pour le rôle : ${receivedRole}`);

    try {
        const surgeons = await prisma.surgeon.findMany({
            orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
            // Inclure les spécialités liées
            include: {
                specialties: {
                    select: { id: true, name: true } // Sélectionner seulement id et nom de la spécialité
                },
                // Optionnel: inclure l'utilisateur lié si besoin
                // user: { select: { id: true, login: true } }
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
    if (!hasRequiredRole()) {
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 });
    }

    try {
        const body = await request.json();
        // Retirer canDoPediatrics
        const { nom, prenom, status, userId, specialtyIds, email, phoneNumber } = body;

        // Validation basique
        if (!nom || !prenom) {
            return new NextResponse(JSON.stringify({ message: 'Nom et prénom sont obligatoires.' }), { status: 400 });
        }
        if (specialtyIds && (!Array.isArray(specialtyIds) || !specialtyIds.every(id => Number.isInteger(id)))) {
            return new NextResponse(JSON.stringify({ message: 'Le format des spécialités est invalide (doit être un tableau d\'IDs numériques).' }), { status: 400 });
        }
        // Optionnel: ajouter validation pour email/phoneNumber (format)

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
            },
            include: {
                specialties: { select: { id: true, name: true } }
            }
        });

        return new NextResponse(JSON.stringify(newSurgeon), { status: 201 });

    } catch (error: any) {
        console.error("Erreur POST /api/chirurgiens:", error);
        // Gérer les erreurs potentielles (ex: contrainte unique si on en ajoute)
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
} 