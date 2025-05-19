import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, getAuthTokenServer } from '@/lib/auth-server-utils';
import { PrismaClient } from '@prisma/client';

export async function GET(req: NextRequest) {
    let prisma: PrismaClient | null = null;
    try {
        console.log("## API /auth/me: Début de la vérification d'authentification");
        console.log("## API /auth/me: JWT_SECRET =", process.env.JWT_SECRET ? "[défini]" : "[NON DÉFINI]");

        let tokenFromHeader: string | null = null;
        const authHeader = req.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            tokenFromHeader = authHeader.replace('Bearer ', '');
        }

        let tokenFromCookie: string | null = null;
        if (!tokenFromHeader) {
            tokenFromCookie = await getAuthTokenServer();
        }

        const authToken: string | null = tokenFromHeader ? tokenFromHeader : tokenFromCookie;
        const source = tokenFromHeader ? 'Header Authorization' : (tokenFromCookie ? 'Cookie httpOnly' : 'Aucun');

        if (!authToken) {
            console.warn('API ME: Token non trouvé (ni header, ni cookie).');
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        console.log(`API ME: Token trouvé via ${source}. Vérification...`);

        const authResult = await verifyAuthToken(authToken);

        if (!authResult.authenticated || !authResult.userId) {
            console.warn(`API ME: Échec vérification token. Erreur: ${authResult.error}`);
            return NextResponse.json({ error: authResult.error || 'Session invalide ou expirée' }, { status: 401 });
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
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        console.log(`API ME: Utilisateur ${user.login} récupéré avec succès.`);
        return NextResponse.json({ user });

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