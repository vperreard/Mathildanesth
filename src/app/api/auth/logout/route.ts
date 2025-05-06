import { NextResponse } from 'next/server';
import { removeAuthToken } from '@/lib/auth-utils';

export async function POST() {
    try {
        console.log("API LOGOUT: Tentative de déconnexion");

        // Utiliser la fonction dédiée pour supprimer le cookie d'authentification
        await removeAuthToken();

        console.log("API LOGOUT: Cookie d'authentification supprimé avec succès");
        return NextResponse.json({ message: 'Déconnexion réussie' });

    } catch (error) {
        console.error("API LOGOUT ERROR:", error);
        return NextResponse.json(
            { message: 'Erreur interne du serveur lors de la déconnexion' },
            { status: 500 }
        );
    }
} 