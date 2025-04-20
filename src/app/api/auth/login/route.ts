import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { createToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { login, password } = await request.json();

        if (!login || !password) {
            return NextResponse.json({ error: 'Login et mot de passe requis' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { login },
        });

        if (!user) {
            return NextResponse.json({ error: 'Login ou mot de passe incorrect' }, { status: 401 });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return NextResponse.json({ error: 'Login ou mot de passe incorrect' }, { status: 401 });
        }

        // --- ENREGISTREMENT DU LOG DE CONNEXION --- 
        try {
            await prisma.loginLog.create({
                data: {
                    userId: user.id,
                    // timestamp est ajouté automatiquement par @default(now())
                }
            });
            console.log(`Login successful and logged for user ID: ${user.id}`);
        } catch (logError) {
            console.error(`Failed to log login for user ID: ${user.id}`, logError);
            // Important: Ne pas bloquer la connexion si le log échoue
        }
        // --- FIN ENREGISTREMENT LOG ---

        // Créer le token JWT
        const token = await createToken({ userId: user.id, login: user.login, role: user.role });

        // Définir le cookie HTTPOnly
        const cookieStore = cookies();
        cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 7 jours
            path: '/',
            sameSite: 'lax',
        });

        // Renvoyer les informations utilisateur (sans le mot de passe, mais avec le flag)
        const { password: _, ...userWithoutPassword } = user; // Inclut mustChangePassword par défaut
        console.log("Login API: Renvoi des données utilisateur:", userWithoutPassword);
        return NextResponse.json({ user: userWithoutPassword });

    } catch (error) {
        console.error("Erreur POST /api/auth/login:", error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
} 