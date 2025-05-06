import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, getAuthToken } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

export async function GET(request: NextRequest) {
    const prisma = new PrismaClient();
    try {
        console.log("## API /auth/me: Début de la vérification d'authentification");
        console.log("## API /auth/me: JWT_SECRET =", process.env.JWT_SECRET ? "[défini]" : "[NON DÉFINI]");

        // Utiliser la fonction getAuthToken qui gère correctement l'accès aux cookies
        const token = await getAuthToken();
        console.log("## API /auth/me: token existe =", !!token);

        if (!token) {
            console.log("## API /auth/me: Pas de token trouvé dans les cookies");
            return NextResponse.json(
                { authenticated: false, error: 'Non authentifié - Aucun token' },
                { status: 401 }
            );
        }

        // Vérifier le token JWT
        console.log("## API /auth/me: Vérification du token...");
        const authResult = await verifyAuthToken(token);
        console.log("## API /auth/me: Résultat verifyAuthToken =", JSON.stringify(authResult));

        if (!authResult.authenticated || !authResult.user) {
            console.log("## API /auth/me: Token invalide ou utilisateur non trouvé dans le token");
            return NextResponse.json(
                { authenticated: false, error: authResult.error || 'Token invalide' },
                { status: 401 }
            );
        }

        // Le token est valide, récupérer les informations complètes de l'utilisateur
        try {
            const userId = Number(authResult.user.id);
            console.log(`## API /auth/me: Récupération des infos utilisateur pour id=${userId}`);

            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                console.log(`## API /auth/me: Utilisateur id=${userId} non trouvé en base`);
                return NextResponse.json(
                    { authenticated: false, error: 'Utilisateur non trouvé' },
                    { status: 401 }
                );
            }

            // Exclure le mot de passe de la réponse
            const { password, ...userWithoutPassword } = user;
            console.log(`## API /auth/me: Utilisateur ${user.login} (id=${user.id}) authentifié avec succès`);

            return NextResponse.json({
                authenticated: true,
                user: userWithoutPassword
            });
        } catch (dbError) {
            console.error("## API /auth/me: Erreur lors de la récupération utilisateur en base:", dbError);
            return NextResponse.json(
                { authenticated: false, error: 'Erreur lors de la récupération des données utilisateur' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('## API /auth/me: Erreur générale:', error);
        return NextResponse.json(
            { authenticated: false, error: 'Erreur serveur' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
} 