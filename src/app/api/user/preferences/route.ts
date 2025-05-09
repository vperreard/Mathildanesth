import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { defaultDisplayConfig } from '@/app/planning/hebdomadaire/defaultConfig'; // Modification de l'importation
import { DisplayConfig } from '@/app/planning/hebdomadaire/types'; // Ajuster le chemin si nécessaire
import { verifyAuthToken, UserJWTPayload } from '@/lib/auth-utils'; // Importer la fonction de vérification et UserJWTPayload

const prisma = new PrismaClient();

// Fonction pour récupérer l'ID de l'utilisateur connecté via le token JWT
async function getCurrentUserIdFromToken(): Promise<number | null> {
    const authResult = await verifyAuthToken();
    if (authResult.authenticated && authResult.user) {
        // Utiliser une assertion de type ou une vérification plus sûre
        const payload = authResult.user as Partial<UserJWTPayload>;
        if (payload.userId !== undefined) {
            const userId = typeof payload.userId === 'string'
                ? parseInt(payload.userId, 10)
                : payload.userId;
            return isNaN(userId) ? null : userId;
        }
    }
    return null;
}

// Handler pour récupérer les préférences (GET)
export async function GET() {
    const userId = await getCurrentUserIdFromToken();

    if (!userId) {
        // Message d'erreur plus précis
        return NextResponse.json({ error: 'Utilisateur non authentifié via token' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { displayPreferences: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        if (user.displayPreferences && typeof user.displayPreferences === 'object' && !Array.isArray(user.displayPreferences)) {
            return NextResponse.json(user.displayPreferences as DisplayConfig);
        } else {
            console.log("## API /user/preferences: Tentative de retour de defaultDisplayConfig:", JSON.stringify(defaultDisplayConfig, null, 2));
            try {
                return NextResponse.json(defaultDisplayConfig);
            } catch (serializationError) {
                console.error("## API /user/preferences: Erreur explicite de sérialisation JSON pour defaultDisplayConfig:", serializationError);
                // Retourner une erreur plus spécifique si la sérialisation échoue explicitement ici
                return NextResponse.json({ error: 'Erreur de sérialisation interne pour defaultDisplayConfig' }, { status: 500 });
            }
        }
    } catch (error) {
        console.error("Erreur API GET /user/preferences:", error);
        return NextResponse.json({ error: 'Erreur serveur interne lors de la récupération des préférences' }, { status: 500 });
    }
}

// Handler pour sauvegarder les préférences (PUT)
export async function PUT(request: Request) {
    const userId = await getCurrentUserIdFromToken();

    if (!userId) {
        // Message d'erreur plus précis
        return NextResponse.json({ error: 'Utilisateur non authentifié via token' }, { status: 401 });
    }

    try {
        const newPreferences = await request.json();

        if (!newPreferences || typeof newPreferences !== 'object') {
            return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { displayPreferences: newPreferences as Prisma.InputJsonValue },
        });

        return NextResponse.json({ message: 'Préférences sauvegardées' });

    } catch (error) {
        console.error("Erreur API PUT /user/preferences:", error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: 'JSON invalide dans la requête' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Erreur serveur interne lors de la sauvegarde des préférences' }, { status: 500 });
    }
} 