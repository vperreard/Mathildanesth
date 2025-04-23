import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            orderBy: [
                { nom: 'asc' },
                { prenom: 'asc' },
            ],
            select: {
                id: true,
                nom: true,
                prenom: true,
                login: true,
                email: true,
                role: true,
                professionalRole: true,
                createdAt: true,
                updatedAt: true,
                // type: true, // Supprimé car n'existe pas
            }
        });
        return NextResponse.json(users);
    } catch (error) {
        console.error("Erreur GET /planning-anesthesie/api/utilisateurs:", error);
        return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Assurez-vous que les champs envoyés correspondent au modèle Prisma (utiliser `password`)
        const { nom, prenom, email, login, password /* utiliser password */ } = body;

        if (!nom || !prenom || !email || !login || !password) {
            return NextResponse.json({ message: 'Données manquantes' }, { status: 400 });
        }

        // Hacher le mot de passe
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = await prisma.user.create({
            data: {
                nom,
                prenom,
                login,
                email,
                password: hashedPassword, // Utiliser le champ correct
                // role: body.role, // Ajouter les rôles si nécessaire
                // professionalRole: body.professionalRole,
            },
            select: { // Sélectionner les champs à retourner (sans password)
                id: true,
                nom: true,
                prenom: true,
                login: true,
                email: true,
                role: true,
                professionalRole: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        // Pas besoin de déstructurer motDePasse ici car select l'exclut déjà
        // const { motDePasse, ...userWithoutPassword } = user;
        return NextResponse.json(user);
    } catch (error) {
        console.error("Erreur POST /planning-anesthesie/api/utilisateurs:", error);
        return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
    }
} 