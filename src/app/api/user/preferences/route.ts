import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { defaultDisplayConfig } from '@/app/planning/hebdomadaire/DisplayConfigPanel'; // Ajuster le chemin si nécessaire
import { DisplayConfig } from '@/app/planning/hebdomadaire/types'; // Ajuster le chemin si nécessaire

// Assurez-vous d'avoir une fonction pour récupérer l'ID de l'utilisateur connecté
// La méthode exacte dépendra de votre système d'authentification (ex: NextAuth.js, Clerk, etc.)
async function getCurrentUserId(): Promise<number | null> {
    // Logique pour obtenir l'ID de l'utilisateur connecté depuis la session/token
    // Exemple (à adapter !) :
    // const session = await getServerSession(authOptions); // Si vous utilisez NextAuth.js
    // return session?.user?.id ? parseInt(session.user.id) : null;
    console.warn("getCurrentUserId() n'est pas implémenté. Retourne un ID fixe pour le test.");
    // Pour les tests, on pourrait essayer de récupérer l'admin par défaut
    // A remplacer par la vraie logique d'authentification
    const testAdmin = await prisma.user.findUnique({ where: { login: 'admin' } });
    return testAdmin?.id ?? null;
}

const prisma = new PrismaClient();

// Handler pour récupérer les préférences (GET)
export async function GET() {
    const userId = await getCurrentUserId();

    if (!userId) {
        return NextResponse.json({ error: 'Non authentifié ou utilisateur admin non trouvé pour test' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { displayPreferences: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        // Si les préférences existent et sont valides, les retourner
        // Prisma retourne JsonValue, il faut s'assurer que c'est bien un objet
        if (user.displayPreferences && typeof user.displayPreferences === 'object' && !Array.isArray(user.displayPreferences)) {
            // On pourrait ajouter une validation plus poussée ici avec Zod par exemple
            return NextResponse.json(user.displayPreferences as DisplayConfig);
        } else {
            // Sinon, retourner la configuration par défaut
            return NextResponse.json(defaultDisplayConfig);
        }
    } catch (error) {
        console.error("Erreur API GET /user/preferences:", error);
        return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 });
    }
}

// Handler pour sauvegarder les préférences (PUT)
export async function PUT(request: Request) {
    const userId = await getCurrentUserId();

    if (!userId) {
        return NextResponse.json({ error: 'Non authentifié ou utilisateur admin non trouvé pour test' }, { status: 401 });
    }

    try {
        const newPreferences = await request.json();

        // TODO: Ajouter une validation robuste des données reçues (newPreferences)
        // pour s'assurer qu'elles correspondent bien à la structure DisplayConfig.
        // Utiliser une librairie comme Zod est recommandé.
        if (!newPreferences || typeof newPreferences !== 'object') {
            return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: userId },
            // Assurer que Prisma reçoit un type compatible avec Json?
            data: { displayPreferences: newPreferences as Prisma.InputJsonValue },
        });

        return NextResponse.json({ message: 'Préférences sauvegardées' });

    } catch (error) {
        console.error("Erreur API PUT /user/preferences:", error);
        if (error instanceof SyntaxError) { // Erreur si le JSON est mal formé
            return NextResponse.json({ error: 'JSON invalide dans la requête' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 });
    }
} 