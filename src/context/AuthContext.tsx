'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user'; // Importer le type User
// import Cookies from 'js-cookie'; // Plus nécessaire ici

// Ajout d'un intercepteur pour afficher les headers, utile pour le debug
axios.interceptors.request.use(
    config => {
        console.log('Request headers (sans Auth manuel):', config.headers);

        // Conserver l'ajout du timestamp pour éviter le cache
        if (config.url && (config.url.startsWith('/api/') || config.url.startsWith('api/'))) {
            const timestamp = new Date().getTime();
            const separator = config.url.includes('?') ? '&' : '?';
            config.url = `${config.url}${separator}_t=${timestamp}`;
        }

        return config;
    },
    error => {
        console.error('Erreur dans l\'intercepteur de requête Axios:', error);
        return Promise.reject(error);
    }
);

// Intercepteur pour les erreurs
axios.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        if (error.response && error.response.status === 401) {
            console.log('Intercepteur Axios: Erreur 401 détectée');
        }
        return Promise.reject(error);
    }
);

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (credentials: { login: string; password: string }) => Promise<void>;
    logout: () => Promise<void>;
    refetchUser: () => Promise<User | null>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const router = useRouter();

    const fetchCurrentUser = useCallback(async () => {
        try {
            console.log('AuthContext: Tentative de récupération de l\'utilisateur courant');
            const response = await axios.get('/api/auth/me');
            setUser(response.data.user);
            return response.data.user;
        } catch (error) {
            console.log('AuthContext: Erreur lors de la récupération de l\'utilisateur', error);
            setUser(null);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);

    const login = async (credentials: { login: string; password: string }) => {
        try {
            console.log('AuthContext: Tentative de connexion avec:', credentials.login);

            // S'assurer que la requête a le bon type de contenu
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            // Envoyer à l'API avec le bon format de requête
            const response = await axios.post('/api/auth/login', credentials, config);

            console.log('AuthContext: Connexion réussie, réponse:', response.data);

            // Définir l'utilisateur à partir de la réponse
            setUser(response.data.user);

            // Rediriger vers la page d'accueil
            router.push('/');

            return response.data.user;
        } catch (error) {
            console.error('Erreur de connexion dans le context:', error);
            throw new Error('Identifiants incorrects');
        }
    };

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout');
            setUser(null);
            router.push('/auth/login');
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            // Déconnexion côté client même en cas d'erreur
            setUser(null);
            router.push('/auth/login');
        }
    };

    const value = {
        user,
        isLoading,
        login,
        logout,
        refetchUser: fetchCurrentUser,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personnalisé pour utiliser le contexte
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
    }
    return context;
}; 