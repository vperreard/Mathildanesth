import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';

// Interface pour le payload JWT
export interface UserJWTPayload extends jose.JWTPayload {
    userId: number;
    login: string;
    role: string;
}

// Type pour les rôles (au lieu d'importer de Prisma)
export type UserRole = 'ADMIN_TOTAL' | 'ADMIN_PARTIEL' | 'USER';

// Fonction pour vérifier le token JWT directement dans une route API
export async function verifyAuthToken(req?: NextRequest) {
    // Récupérer le token depuis les cookies
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        return {
            authenticated: false,
            error: 'Token non trouvé'
        };
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        console.error('JWT_SECRET manquant dans les variables d\'environnement');
        return {
            authenticated: false,
            error: 'Configuration serveur incorrecte'
        };
    }

    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        // Vérifier et décoder le token
        const { payload } = await jose.jwtVerify<UserJWTPayload>(token, secret);

        return {
            authenticated: true,
            user: {
                id: payload.userId,
                login: payload.login,
                role: payload.role
            }
        };
    } catch (error) {
        console.error('Erreur de vérification du token:', error);
        return {
            authenticated: false,
            error: 'Token invalide ou expiré'
        };
    }
}

// Fonction pour vérifier si l'utilisateur a l'un des rôles requis
export async function checkUserRole(allowedRoles: UserRole[]) {
    const authResult = await verifyAuthToken();

    if (!authResult.authenticated) {
        return {
            hasRequiredRole: false,
            error: authResult.error
        };
    }

    const userRole = authResult.user.role;
    const hasRole = allowedRoles.includes(userRole as UserRole);

    return {
        hasRequiredRole: hasRole,
        user: authResult.user,
        error: hasRole ? null : 'Accès non autorisé pour ce rôle'
    };
} 