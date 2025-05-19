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

// --- Fonctions pour la gestion du token côté CLIENT (localStorage) ---
export function getClientAuthToken(): string | null {
    if (typeof window !== 'undefined') {
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