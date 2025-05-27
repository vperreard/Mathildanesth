import { prisma } from '@/lib/prisma'; // Import nommé
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { headers } from 'next/headers'; // Pour récupérer l'ID utilisateur depuis le middleware
import { verifyToken } from '@/lib/auth'; // Alias path

jest.mock('@/lib/prisma');


// const prisma = prisma; // Supprimé

export async function PUT(request: Request) {
    console.log("--- Requête PUT /api/auth/change-password reçue ---");
    const requestHeaders = headers();
    const userIdString = requestHeaders.get('x-user-id');
    console.log(`Header x-user-id reçu: ${userIdString}`);

    if (!userIdString) {
        console.log("Accès refusé: Header x-user-id manquant.");
        return NextResponse.json({ error: 'Non authentifié ou ID utilisateur manquant' }, { status: 401 });
    }

    const userId = parseInt(userIdString, 10);
    if (isNaN(userId)) {
        console.log(`Erreur: ID utilisateur invalide après parsing: ${userIdString}`);
        return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 });
    }
    console.log(`ID utilisateur parsé: ${userId}`);

    try {
        const { currentPassword, newPassword } = await request.json();
        console.log(`Tentative de changement pour userId: ${userId}`);

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Mot de passe actuel et nouveau requis' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }, // Utiliser l'ID parsé
        });

        if (!user) {
            console.log(`Erreur: Utilisateur non trouvé pour ID: ${userId}`);
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }
        console.log(`Utilisateur trouvé: ${user.login} (ID: ${user.id})`);

        // Vérifier le mot de passe actuel
        console.log("Comparaison du mot de passe actuel...");
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        console.log(`Résultat bcrypt.compare: ${passwordMatch}`); // Log crucial
        if (!passwordMatch) {
            console.log(`Accès refusé: Mot de passe actuel incorrect pour userId: ${userId}`);
            return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 401 }); // 401 Unauthorized est plus approprié que 403 ici
        }

        // Hacher le nouveau mot de passe
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Mettre à jour le mot de passe et le flag dans la base de données
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedNewPassword,
                mustChangePassword: false // Mettre le flag à false après changement réussi
            },
        });

        return NextResponse.json({ message: 'Mot de passe mis à jour avec succès' });

    } catch (error) {
        console.error("Erreur PUT /api/auth/change-password:", error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
} 