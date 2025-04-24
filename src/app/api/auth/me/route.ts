import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        console.log("DEBUG /api/auth/me: JWT_SECRET =", process.env.JWT_SECRET);
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token')?.value;
        console.log("DEBUG /api/auth/me: token existe =", !!token);

        // Utiliser notre système de JWT personnalisé
        const authResult = await verifyAuthToken(request);
        console.log("DEBUG /api/auth/me: résultat verifyAuthToken =", JSON.stringify(authResult));

        if (authResult.authenticated) {
            return NextResponse.json({
                authenticated: true,
                user: authResult.user
            });
        }

        // Aucune authentification valide
        return NextResponse.json(
            { authenticated: false, error: 'Non authentifié' },
            { status: 401 }
        );
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        return NextResponse.json(
            { authenticated: false, error: 'Erreur serveur' },
            { status: 500 }
        );
    }
} 