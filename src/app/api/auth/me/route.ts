import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, getAuthTokenServer } from '@/lib/auth-server-utils';
import { prisma } from '@/lib/prisma';
import { withUserRateLimit } from '@/lib/rateLimit';

async function handler(req: NextRequest) {
    try {
        // Récupérer le token depuis les cookies ou headers
        let token: string | null = null;
        
        const authHeader = req.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
        }

        if (!token) {
            token = await getAuthTokenServer();
        }

        if (!token) {
            return NextResponse.json({
                error: 'Non authentifié',
                authenticated: false
            }, { status: 401 });
        }

        // Vérifier le token
        const authResult = await verifyAuthToken(token);

        if (!authResult.authenticated || !authResult.userId) {
            return NextResponse.json({
                error: authResult.error || 'Session invalide ou expirée',
                authenticated: false
            }, { status: 401 });
        }

        // Récupérer l'utilisateur depuis la base de données
        const user = await prisma.user.findUnique({
            where: { id: authResult.userId },
            select: {
                id: true,
                login: true,
                email: true,
                nom: true,
                prenom: true,
                role: true,
            },
        });

        if (!user) {
            return NextResponse.json({
                error: 'Utilisateur non trouvé',
                authenticated: false
            }, { status: 404 });
        }

        return NextResponse.json({
            user,
            authenticated: true
        });

    } catch (error) {
        console.error('API /auth/me error:', error);
        return NextResponse.json(
            { authenticated: false, error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

export const GET = withUserRateLimit(handler);