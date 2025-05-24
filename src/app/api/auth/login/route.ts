import { NextRequest, NextResponse } from 'next/server';
import { generateAuthTokenServer, setAuthTokenServer } from '@/lib/auth-server-utils';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Cache pour éviter les reconnexions Prisma répétées
let cachedPrisma: PrismaClient | null = null;

function getPrismaClient(isCypressTest: boolean): PrismaClient {
    if (cachedPrisma) return cachedPrisma;

    const dbUrl = isCypressTest
        ? process.env.TEST_DATABASE_URL || 'postgresql://mathildanesth_user:mathildanesth_password@localhost:5433/mathildanesth_test'
        : process.env.DATABASE_URL;

    if (!dbUrl) {
        throw new Error('Variable d\'environnement DATABASE_URL manquante');
    }

    cachedPrisma = new PrismaClient({
        datasources: { db: { url: dbUrl } },
        log: process.env.NODE_ENV === 'development' ? ['error'] : [], // Logs réduits
    });

    return cachedPrisma;
}

export async function POST(req: NextRequest) {
    const startTime = Date.now();

    try {
        const { login, password } = await req.json();

        if (!login || !password) {
            return NextResponse.json(
                { error: 'Login et mot de passe requis' },
                { status: 400 }
            );
        }

        const isCypressTest = req.headers.get('user-agent')?.includes('Cypress');
        const prisma = getPrismaClient(isCypressTest);

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
            return NextResponse.json(
                { message: 'Login ou mot de passe incorrect' },
                { status: 401 }
            );
        }

        // Vérification du mot de passe
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
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

        await setAuthTokenServer(token);

        // Exclure le mot de passe de la réponse
        const { password: _, ...userWithoutPassword } = user;

        // Log de performance en développement
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Auth] Login successful for ${user.login} in ${Date.now() - startTime}ms`);
        }

        return NextResponse.json({
            user: userWithoutPassword,
            token: token
        });
    } catch (error) {
        console.error('API LOGIN ERROR:', error);
        return NextResponse.json(
            { message: 'Erreur serveur lors de la connexion' },
            { status: 500 }
        );
    }
    // Note: Pas de déconnexion Prisma car on utilise un cache
} 