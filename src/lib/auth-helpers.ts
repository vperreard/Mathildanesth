import Cookies from 'js-cookie';

import { logger } from "./logger";
/**
 * Récupère le token JWT depuis les cookies ou la session
 * @param session La session utilisateur (peut venir de useSession ou getServerSession)
 * @returns Le token JWT ou null si aucun n'est trouvé
 */
export const getAuthToken = (session: unknown): string | null => {
    // Essayer de récupérer le token depuis les cookies
    const jwtToken = Cookies.get('next-auth.session-token') || Cookies.get('__Secure-next-auth.session-token') || Cookies.get('jwt_token');

    // Si disponible dans les cookies, l'utiliser
    if (jwtToken) {
        return jwtToken;
    }

    // Sinon, essayer de le récupérer depuis la session
    // Différentes structures possibles selon l'implémentation de next-auth
    if (session?.token) {
        return session.token;
    }

    if (session?.user?.token) {
        return session.user.token;
    }

    if (typeof session?.user?.accessToken === 'string') {
        return session.user.accessToken;
    }

    if (session?.accessToken) {
        return session.accessToken;
    }

    // Vérifier les jetons dans le localStorage (en cas de besoin)
    try {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (storedToken) {
            return storedToken;
        }
    } catch (error: unknown) {
        logger.warn('Impossible d\'accéder au localStorage:', error instanceof Error ? error : new Error(String(error)));
    }

    return null;
};

/**
 * Crée les en-têtes HTTP avec authentification pour les requêtes fetch
 * @param session La session utilisateur
 * @returns Les en-têtes HTTP à utiliser avec fetch
 */
export const createAuthHeaders = (session: unknown): HeadersInit => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    const token = getAuthToken(session);
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

/**
 * Fonction fetch améliorée qui inclut automatiquement 
 * les en-têtes d'authentification
 */
export const fetchWithAuth = async (
    url: string,
    options: RequestInit = {},
    session: unknown
): Promise<Response> => {
    const authHeaders = createAuthHeaders(session);

    const mergedOptions: RequestInit = {
        ...options,
        headers: {
            ...authHeaders,
            ...(options.headers || {}),
        },
        credentials: 'include', // Assurez-vous que les cookies sont envoyés avec la requête
    };

    return fetch(url, mergedOptions);
}; 