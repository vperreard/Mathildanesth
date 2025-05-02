import { NextRequest, NextResponse } from 'next/server';
import { generateAuthToken, setAuthToken } from '@/lib/auth-utils';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
    try {
        const { login, password } = await req.json();

        console.log(`DEBUG LOGIN: Tentative de connexion avec login=${login}`);

        if (!login || !password) {
            console.log('DEBUG LOGIN: Login ou mot de passe manquant');
            return NextResponse.json(
                { error: 'Login et mot de passe requis' },
                { status: 400 }
            );
        }

        const prisma = new PrismaClient();
        const user = await prisma.user.findUnique({
            where: { login }
        });

        if (!user) {
            console.log(`DEBUG LOGIN: Utilisateur non trouvé pour login=${login}`);
            await prisma.$disconnect();
            return NextResponse.json(
                { message: 'Login ou mot de passe incorrect' },
                { status: 401 }
            );
        }

        console.log(`DEBUG LOGIN: Utilisateur trouvé id=${user.id}, vérification du mot de passe`);

        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log(`DEBUG LOGIN: Résultat de la vérification du mot de passe: ${isValidPassword}`);

        if (!isValidPassword) {
            console.log(`DEBUG LOGIN: Mot de passe incorrect pour login=${login}`);
            await prisma.$disconnect();
            return NextResponse.json(
                { message: 'Login ou mot de passe incorrect' },
                { status: 401 }
            );
        }

        console.log(`DEBUG LOGIN: Authentification réussie pour ${login}, génération du token`);

        const token = await generateAuthToken({
            userId: user.id,
            login: user.login,
            role: user.role
        });

        await setAuthToken(token);

        await prisma.$disconnect();

        return NextResponse.json({
            user: {
                id: user.id,
                login: user.login,
                role: user.role,
                prenom: user.prenom,
                nom: user.nom,
                email: user.email,
                mustChangePassword: user.mustChangePassword
            },
            token: token
        });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        return NextResponse.json(
            { message: 'Erreur lors de la connexion' },
            { status: 500 }
        );
    }
} 