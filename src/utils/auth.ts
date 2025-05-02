/**
 * Utilitaires d'authentification
 */

// Clé utilisée pour stocker le token dans le localStorage
const TOKEN_KEY = 'auth_token';

/**
 * Récupère le token d'authentification du localStorage
 * @returns Le token ou null si non trouvé
 */
export const getToken = (): string | null => {
    if (typeof window === 'undefined') {
        return null;
    }
    return localStorage.getItem(TOKEN_KEY);
};

/**
 * Sauvegarde le token d'authentification dans le localStorage
 * @param token Token à sauvegarder
 */
export const setToken = (token: string): void => {
    if (typeof window === 'undefined') {
        return;
    }
    localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Supprime le token d'authentification et redirige vers la page de connexion
 * @param redirectPath Chemin de redirection (défaut: '/login')
 */
export const clearTokenAndRedirect = (redirectPath: string = '/login'): void => {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.removeItem(TOKEN_KEY);

    // Vérifie si on est déjà sur la page de connexion pour éviter des redirections inutiles
    if (!window.location.pathname.includes(redirectPath)) {
        window.location.href = redirectPath;
    }
};

/**
 * Vérifie si l'utilisateur est authentifié
 * @returns true si un token existe, false sinon
 */
export const isAuthenticated = (): boolean => {
    return !!getToken();
};

/**
 * Décode un token JWT pour extraire les informations
 * @param token Token JWT à décoder
 * @returns Contenu du token décodé ou null si token invalide
 */
export const decodeToken = (token: string): any | null => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Erreur de décodage du token:', error);
        return null;
    }
};

/**
 * Vérifie si le token a expiré
 * @returns true si le token a expiré ou n'existe pas, false sinon
 */
export const isTokenExpired = (): boolean => {
    const token = getToken();
    if (!token) return true;

    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    // exp est en secondes, Date.now() en millisecondes
    return decoded.exp * 1000 < Date.now();
}; 