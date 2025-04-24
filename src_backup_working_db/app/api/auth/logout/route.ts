import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        // Supprimer le cookie d'authentification
        cookies().set('auth_token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: -1, // Date d'expiration passée pour supprimer le cookie
            path: '/',
        });

        return new NextResponse(JSON.stringify({ message: 'Déconnexion réussie' }), { status: 200 });

    } catch (error) {
        console.error("Erreur POST /api/auth/logout:", error);
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur lors de la déconnexion' }), { status: 500 });
    }
} 