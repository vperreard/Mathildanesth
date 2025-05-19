import { cookies, headers as nextHeaders } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
// Importer les types depuis le fichier client pour éviter la duplication
import type { UserRole, AuthResult } from './auth-client-utils';

const JWT_SECRET = process.env.JWT_SECRET || 'un_secret_jwt_robuste_et_difficile_a_deviner_pour_la_securite_de_l_application';
const TOKEN_EXPIRATION = 24 * 60 * 60; // 24 heures en secondes
const AUTH_TOKEN_KEY = 'auth_token';

export async function generateAuthTokenServer(payload: any) {
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

export async function verifyAuthToken(token: string): Promise<AuthResult> {
    try {
        const secretKey = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);

        if (!payload.userId || !payload.role) {
            return {
                authenticated: false,
                error: 'Token invalide'
            };
        }

        return {
            authenticated: true,
            userId: payload.userId as number,
            role: payload.role as string
        };
    } catch (error) {
        console.error('Erreur de vérification du token (serveur):', error);
        return {
            authenticated: false,
            error: 'Token invalide ou expiré'
        };
    }
}

export async function getAuthTokenServer() {
    try {
        // 1. Essayer de récupérer depuis le header Authorization
        const headersList = await nextHeaders(); // Attendre la résolution de la promesse
        const authHeader = headersList.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            if (token) {
                console.log('[Auth Server] Token récupéré depuis le header Authorization.');
                return token;
            }
        }

        // 2. Si non trouvé dans le header, essayer de récupérer depuis le cookie
        const cookieStore = await cookies();
        const cookieToken = cookieStore.get(AUTH_TOKEN_KEY)?.value;
        if (cookieToken) {
            console.log('[Auth Server] Token récupéré depuis le cookie.');
            return cookieToken;
        }

        console.log('[Auth Server] Aucun token trouvé (ni header, ni cookie).');
        return null;
    } catch (error) {
        console.error('Erreur lors de la récupération du token (serveur):', error);
        return null;
    }
}

export async function setAuthTokenServer(token: string) {
    try {
        const cookieStore = await cookies();
        cookieStore.set(AUTH_TOKEN_KEY, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: TOKEN_EXPIRATION,
            path: '/',
        });
    } catch (error) {
        console.error('Erreur lors de la définition du token (serveur):', error);
    }
}

export async function removeAuthTokenServer() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete(AUTH_TOKEN_KEY);
    } catch (error) {
        console.error('Erreur lors de la suppression du token (serveur):', error);
    }
}

// Fonction pour vérifier si l'utilisateur a l'un des rôles requis
export async function checkUserRole(allowedRoles: UserRole[], authToken?: string | null): Promise<{ hasRequiredRole: boolean; user: { id: number, role: string } | null; error: string | null }> {
    let tokenToVerify = authToken;
    if (authToken === undefined) { // Contexte serveur, token non fourni explicitement
        tokenToVerify = await getAuthTokenServer();
    }

    if (!tokenToVerify) {
        return {
            hasRequiredRole: false,
            user: null,
            error: 'Token non fourni ou non récupérable'
        };
    }

    const authResult = await verifyAuthToken(tokenToVerify);

    if (!authResult.authenticated || !authResult.userId || !authResult.role) {
        return {
            hasRequiredRole: false,
            user: null,
            error: authResult.error || 'Utilisateur non authentifié'
        };
    }

    const user = { id: authResult.userId, role: authResult.role };
    const userRole = authResult.role as UserRole;
    const hasRole = allowedRoles.includes(userRole);

    return {
        hasRequiredRole: hasRole,
        user: user,
        error: hasRole ? null : 'Accès non autorisé pour ce rôle'
    };
} 