import * as jose from 'jose'; // Pour UserJWTPayload

// --- Types et Interfaces Partagés ---
export interface UserJWTPayload extends jose.JWTPayload {
    userId: number;
    login: string;
    role: string;
}

export type UserRole = 'ADMIN_TOTAL' | 'ADMIN_PARTIEL' | 'USER';

export interface AuthResult {
    authenticated: boolean;
    userId?: number;
    role?: string;
    error?: string;
}
// --- Fin Types et Interfaces Partagés ---

const AUTH_TOKEN_KEY = 'auth_token';

// --- Fonctions pour la gestion du token côté CLIENT (cookies et localStorage) ---
export function getClientAuthToken(): string | null {
    if (typeof window !== 'undefined') {
        // Essayer d'abord dans les cookies (auth_token)
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === AUTH_TOKEN_KEY) {
                return decodeURIComponent(value);
            }
        }
        // Si pas trouvé dans les cookies, essayer localStorage comme fallback
        return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return null;
}

export function setClientAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
}

export function removeClientAuthToken(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_TOKEN_KEY);
    }
}
// --- Fin des fonctions client --- 