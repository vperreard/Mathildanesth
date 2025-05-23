import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, getAuthTokenServer } from '@/lib/auth-server-utils';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';

export async function GET(req: NextRequest) {
    let prisma: PrismaClient | null = null;
    try {
        console.log("## API /auth/me: Début de la vérification d'authentification");

        // 1. Vérifier d'abord via NextAuth (la méthode privilégiée)
        const session = await getServerSession(authOptions);

        if (session?.user?.id) {
            console.log(`API ME: Utilisateur authentifié via NextAuth. ID: ${session.user.id}, Login: ${session.user.login}`);

            // Récupérer rapidement les données utilisateur depuis NextAuth
            const userData = {
                id: session.user.id,
                login: session.user.login,
                email: session.user.email,
                name: session.user.name,
                role: session.user.role,
                accessToken: session.user.accessToken
            };

            return NextResponse.json({
                user: userData,
                authMethod: 'nextauth',
                authenticated: true
            });
        }

        console.log("API ME: Session NextAuth non trouvée. Tentative avec token personnalisé...");

        // 2. Si pas de session NextAuth, essayer avec le token personnalisé
        let tokenFromHeader: string | null = null;
        const authHeader = req.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            tokenFromHeader = authHeader.replace('Bearer ', '');
        }

        let tokenFromCookie: string | null = null;
        if (!tokenFromHeader) {
            tokenFromCookie = await getAuthTokenServer();
        }

        const authToken: string | null = tokenFromHeader || tokenFromCookie;
        const source = tokenFromHeader ? 'Header Authorization' : (tokenFromCookie ? 'Cookie httpOnly' : 'Aucun');

        if (!authToken) {
            console.warn('API ME: Token non trouvé (ni header, ni cookie, ni session).');
            return NextResponse.json({
                error: 'Non authentifié',
                authenticated: false
            }, { status: 401 });
        }

        console.log(`API ME: Token trouvé via ${source}. Vérification...`);

        const authResult = await verifyAuthToken(authToken);

        if (!authResult.authenticated || !authResult.userId) {
            console.warn(`API ME: Échec vérification token. Erreur: ${authResult.error}`);
            return NextResponse.json({
                error: authResult.error || 'Session invalide ou expirée',
                authenticated: false
            }, { status: 401 });
        }

        console.log(`API ME: Token vérifié. User ID: ${authResult.userId}, Rôle: ${authResult.role}`);

        prisma = new PrismaClient();
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
            console.warn(`API ME: Utilisateur non trouvé en BDD pour ID: ${authResult.userId}`);
            return NextResponse.json({
                error: 'Utilisateur non trouvé',
                authenticated: false
            }, { status: 404 });
        }

        console.log(`API ME: Utilisateur ${user.login} récupéré avec succès via token personnalisé.`);
        return NextResponse.json({
            user,
            authMethod: 'custom_token',
            authenticated: true
        });

    } catch (error) {
        console.error('## API /auth/me: Erreur générale:', error);
        return NextResponse.json(
            { authenticated: false, error: 'Erreur serveur' },
            { status: 500 }
        );
    } finally {
        await prisma?.$disconnect();
    }
} 