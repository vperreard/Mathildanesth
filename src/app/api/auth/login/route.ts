import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { createToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { login, password } = await request.json();
        console.log("DEBUG: DATABASE_URL =", process.env.DATABASE_URL);
        console.log("DEBUG: JWT_SECRET =", process.env.JWT_SECRET);
        console.log("DEBUG: login API called for login =", login);

        if (!login || !password) {
            return NextResponse.json({ error: 'Login et mot de passe requis' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { login },
        });

        if (!user) {
            console.log(`DEBUG: Utilisateur non trouvé pour login: ${login}`);
            return NextResponse.json({ error: 'Login ou mot de passe incorrect' }, { status: 401 });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            console.log(`DEBUG: Mot de passe incorrect pour login: ${login}`);
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
        let token;
        try {
            console.log("DEBUG: Création du token JWT avec payload:", { userId: user.id, login: user.login, role: user.role });
            token = await createToken({ userId: user.id, login: user.login, role: user.role });
            console.log("DEBUG: Token créé avec succès");
        } catch (e) {
            console.error("DEBUG: Erreur lors de la création du token JWT:", e);
            return NextResponse.json({ error: 'Erreur interne du serveur lors de la création du token' }, { status: 500 });
        }

        // Définir le cookie HTTPOnly
        try {
            const cookieStore = cookies();
            cookieStore.set('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7, // 7 jours
                path: '/',
                sameSite: 'lax',
            });
            console.log("DEBUG: Cookie auth_token défini avec succès");
        } catch (cookieError) {
            console.error("DEBUG: Erreur lors de la définition du cookie:", cookieError);
            return NextResponse.json({ error: 'Erreur lors de la définition du cookie d\'authentification' }, { status: 500 });
        }

        // Renvoyer les informations utilisateur (sans le mot de passe, mais avec le flag)
        const { password: _, ...userWithoutPassword } = user; // Inclut mustChangePassword par défaut
        console.log("Login API: Renvoi des données utilisateur:", userWithoutPassword);
        return NextResponse.json({ user: userWithoutPassword });

    } catch (error) {
        console.error("Erreur POST /api/auth/login:", error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
} 