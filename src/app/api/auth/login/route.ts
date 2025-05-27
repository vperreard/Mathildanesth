import { NextRequest, NextResponse } from 'next/server';
import { generateAuthTokenServer, setAuthTokenServer } from '@/lib/auth-server-utils';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { withAuthRateLimit } from '@/lib/rateLimit';
import { auditService, AuditAction } from '@/services/OptimizedAuditService';

jest.mock('@/lib/prisma');


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

        // Requête optimisée : recherche login ET email en une seule requête
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { login },
                    { email: login }
                ]
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
            // Log tentative de connexion échouée
            await auditService.logLogin(0, false, {
                ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
                userAgent: req.headers.get('user-agent') || 'unknown',
                reason: 'User not found',
                metadata: { login }
            });
            return NextResponse.json(
                { message: 'Login ou mot de passe incorrect' },
                { status: 401 }
            );
        }

        // Vérification du mot de passe
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            // Log tentative de connexion échouée
            await auditService.logLogin(user.id, false, {
                ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
                userAgent: req.headers.get('user-agent') || 'unknown',
                reason: 'Invalid password',
                metadata: { login: user.login }
            });
            return NextResponse.json(
                { message: 'Login ou mot de passe incorrect' },
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

        // Log connexion réussie
        await auditService.logLogin(user.id, true, {
            ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown',
            duration: Date.now() - startTime,
            metadata: { login: user.login, role: user.role }
        });

        // Log de performance en développement
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Auth] Login successful for ${user.login} in ${Date.now() - startTime}ms`);
        }

        // Créer la réponse avec le cookie
        const response = NextResponse.json({
            user: userWithoutPassword,
            token: token
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
            { message: 'Erreur serveur lors de la connexion' },
            { status: 500 }
        );
    }
    // Note: Pas de déconnexion Prisma car on utilise un cache
}

// Export avec rate limiting (5 requêtes par minute)
export const POST = withAuthRateLimit(loginHandler); 