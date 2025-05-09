import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

// Interface pour le payload JWT
export interface UserJWTPayload extends jose.JWTPayload {
    userId: number;
    login: string;
    role: string;
}

// Type pour les rôles (au lieu d'importer de Prisma)
export type UserRole = 'ADMIN_TOTAL' | 'ADMIN_PARTIEL' | 'USER';

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_super_securise';
const TOKEN_EXPIRATION = 24 * 60 * 60; // 24 heures en secondes

export async function generateAuthToken(payload: any) {
    const token = await new SignJWT({
        ...payload,
        iss: 'mathildanesth',
        aud: 'mathildanesth-client'
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(new TextEncoder().encode(JWT_SECRET));

    return token;
}

export async function verifyAuthToken(token?: string | null) {
    try {
        // Si aucun token n'est explicitement fourni, le récupérer via la fonction asynchrone
        if (!token) {
            token = await getAuthToken();
        }

        if (!token) {
            return { authenticated: false, error: 'Token non fourni' };
        }

        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(JWT_SECRET),
            {
                algorithms: ['HS256'],
                issuer: 'mathildanesth',
                audience: 'mathildanesth-client',
                clockTolerance: 30 // Tolérance de 30 secondes pour la vérification de l'expiration
            }
        );

        // Vérifier que le payload a la structure attendue
        if (typeof payload.userId !== 'number' ||
            typeof payload.login !== 'string' ||
            typeof payload.role !== 'string') {
            return { authenticated: false, error: 'Structure du token invalide' };
        }

        return {
            authenticated: true,
            user: {
                userId: payload.userId,
                login: payload.login,
                role: payload.role
            } as UserJWTPayload
        };
    } catch (error) {
        console.error('Erreur de vérification du token:', error);
        return { authenticated: false, error: 'Token invalide ou expiré' };
    }
}

export async function getAuthToken() {
    try {
        const cookieStore = await cookies();
        return cookieStore.get('auth_token')?.value;
    } catch (error) {
        console.error('Erreur lors de la récupération du token:', error);
        return null;
    }
}

export async function setAuthToken(token: string) {
    try {
        const cookieStore = await cookies();
        cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: TOKEN_EXPIRATION,
            path: '/',
        });
    } catch (error) {
        console.error('Erreur lors de la définition du token:', error);
    }
}

export async function removeAuthToken() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('auth_token');
    } catch (error) {
        console.error('Erreur lors de la suppression du token:', error);
    }
}

// Fonction pour vérifier si l'utilisateur a l'un des rôles requis
export async function checkUserRole(allowedRoles: UserRole[]) {
    const authResult = await verifyAuthToken();

    if (!authResult.authenticated || !authResult.user) {
        return {
            hasRequiredRole: false,
            error: authResult.error || 'Utilisateur non authentifié'
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