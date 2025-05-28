import { NextRequest, NextResponse } from 'next/server';
import { generateAuthTokenServer, setAuthTokenServer } from '@/lib/auth-server-utils';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { withAuthRateLimit } from '@/lib/rateLimit';

async function loginHandler(req: NextRequest) {
    const startTime = Date.now();

    try {
        const { login, password } = await req.json();

        if (!login || !password) {
            return NextResponse.json(
                { error: 'Login et mot de passe requis' },
                { status: 400 }
            );
        }

        // Utilisation du client Prisma importé

        // Recherche uniquement par login
        const user = await prisma.user.findFirst({
            where: {
                login
            },
            select: {
                id: true,
                login: true,
                email: true,
                nom: true,
                prenom: true,
                role: true,
                password: true, // Nécessaire pour la vérification
                actif: true,
            }
        });

        if (!user || !user.password) {
            // Log tentative de connexion échouée (temporairement commenté)
            // await auditService.logAction({...});
            return NextResponse.json(
                { error: 'Identifiants invalides' },
                { status: 401 }
            );
        }

        // Vérification que l'utilisateur est actif
        if (!user.actif) {
            return NextResponse.json(
                { error: 'Compte désactivé' },
                { status: 403 }
            );
        }

        // Vérification du mot de passe
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            // Log tentative de connexion échouée (temporairement commenté)
            // await auditService.logAction({...});
            return NextResponse.json(
                { error: 'Identifiants invalides' },
                { status: 401 }
            );
        }

        // Génération du token
        const token = await generateAuthTokenServer({
            userId: user.id,
            login: user.login,
            role: user.role
        });

        // Exclure le mot de passe de la réponse
        const { password: _, ...userWithoutPassword } = user;

        // Log connexion réussie (temporairement commenté)
        // await auditService.logAction({...});

        // Log de performance en développement
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Auth] Login successful for ${user.login} in ${Date.now() - startTime}ms`);
        }

        // Créer la réponse avec le cookie
        const response = NextResponse.json({
            user: userWithoutPassword,
            token: token,
            redirectUrl: '/tableau-de-bord'
        });

        // Définir le cookie d'authentification
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60, // 24 heures
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('API LOGIN ERROR:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la connexion' },
            { status: 500 }
        );
    }
    // Note: Pas de déconnexion Prisma car on utilise un cache
}

// Export avec rate limiting (5 requêtes par minute)
export const POST = withAuthRateLimit(loginHandler); 