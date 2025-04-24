import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

// Helper pour vérifier les rôles admin
const hasRequiredRole = (): boolean => {
    const headersList = headers();
    const userRoleString = headersList.get('x-user-role');
    return !!userRoleString && ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(userRoleString);
};

// --- GET : Lister les utilisateurs non liés à un profil chirurgien ---
export async function GET(request: Request) {
    if (!hasRequiredRole()) {
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 });
    }

    try {
        const linkableUsers = await prisma.user.findMany({
            where: {
                surgeonProfile: null // Ne sélectionner que ceux sans profil chirurgien lié
            },
            select: {
                id: true,
                nom: true,
                prenom: true,
                login: true
            },
            orderBy: [
                { nom: 'asc' },
                { prenom: 'asc' },
            ],
        });
        return NextResponse.json(linkableUsers);
    } catch (error) {
        console.error("Erreur GET /api/users/linkable:", error);
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
}
