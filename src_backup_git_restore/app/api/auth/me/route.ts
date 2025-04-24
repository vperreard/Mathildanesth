import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const headersList = headers();

    // Vérifier l'authentification directement dans la route
    const authResult = await verifyAuthToken();

    if (!authResult.authenticated) {
        // L'utilisateur n'est pas authentifié
        return NextResponse.json(
            {
                error: 'Non authentifié',
                message: authResult.error || 'Session invalide ou expirée',
                middlewareExecuted: false, // pour compatibilité avec le code antérieur
                headers: Object.fromEntries(headersList.entries())
            },
            { status: 401 }
        );
    }

    // Si l'utilisateur est authentifié, récupérer ses infos depuis la BD
    try {
        const user = await prisma.user.findUnique({
            where: { id: authResult.user.id },
            select: {
                id: true,
                nom: true,
                prenom: true,
                login: true,
                email: true,
                role: true,
                professionalRole: true,
                tempsPartiel: true,
                pourcentageTempsPartiel: true,
                dateEntree: true,
                dateSortie: true,
                actif: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        return NextResponse.json({
            ...user,
            // Ajouter des champs diagnostiques pour suivre le fonctionnement
            authMethod: 'direct-route-auth'
        });
    } catch (error) {
        console.error("Erreur GET /api/auth/me:", error);
        // Supprimer le cookie en cas d'erreur grave
        cookies().delete('auth_token');
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
} 