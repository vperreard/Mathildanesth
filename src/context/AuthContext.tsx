'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user'; // Importer le type User

// Configuration de l'intercepteur Axios pour ajouter le token d'authentification
// à toutes les requêtes sortantes
axios.interceptors.request.use(
    config => {
        // Ne pas ajouter d'en-têtes pour les requêtes vers d'autres domaines (CORS)
        if (config.url && (config.url.startsWith('/api/') || config.url.startsWith('api/'))) {
            // Récupérer le token depuis localStorage
            const token = localStorage.getItem('auth_token');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            // Ajoutons des entêtes supplémentaires pour le debug
            config.headers['X-Requested-With'] = 'XMLHttpRequest';

            // Ajoutons un timestamp pour éviter les problèmes de cache
            const timestamp = new Date().getTime();
            config.url += config.url.includes('?') ? `&_t=${timestamp}` : `?_t=${timestamp}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs d'authentification globalement
axios.interceptors.response.use(
    response => response,
    error => {
        // Si nous recevons une erreur 401, l'utilisateur n'est pas authentifié
        if (error.response && error.response.status === 401) {
            console.log("Intercepteur Axios: Erreur 401 détectée");
            // Rediriger vers la page de connexion seulement si nous ne sommes pas déjà sur la page de connexion
            const currentPath = window.location.pathname;
            if (currentPath !== '/auth/login' && currentPath !== '/login') {
                window.location.href = '/auth/login';
            }
        }
        return Promise.reject(error);
    }
);

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (loginData: { login: string; password: string }) => Promise<void>;
    logout: () => Promise<void>;
    refetchUser: () => void; // Pour rafraîchir les données utilisateur si nécessaire
    ensureAuthenticated: () => Promise<string | null>; // Nouvelle fonction pour garantir l'authentification
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchCurrentUser = useCallback(async () => {
        setIsLoading(true);
        try {
            console.log("AuthContext: Tentative de récupération de l'utilisateur courant");
            const response = await axios.get('/api/auth/me');
            console.log("AuthContext: Réponse de l'API:", response.data);

            // Vérifier si la réponse contient la structure attendue
            if (response.data.authenticated && response.data.user) {
                // Extraire l'utilisateur de la réponse qui a la structure {authenticated: true, user: {...}}
                console.log("AuthContext: Utilisateur récupéré avec succès", response.data.user);
                setUser(response.data.user);
            } else if (response.data.id) {
                // Si l'API renvoie directement l'utilisateur sans structure englobante
                console.log("AuthContext: Utilisateur récupéré avec succès (format direct)", response.data);
                setUser(response.data);
            } else {
                console.log("AuthContext: Format de réponse inattendu", response.data);
                setUser(null);
            }
        } catch (error) {
            console.error("AuthContext: Erreur lors de la récupération de l'utilisateur", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);

    const login = async (loginData: { login: string; password: string }) => {
        try {
            // Faire l'appel API login
            const response = await axios.post<{ user: User; token: string }>('/api/auth/login', loginData);
            const { user: loggedInUser, token } = response.data;

            // Stocker le token
            if (token) {
                localStorage.setItem('auth_token', token);
            }

            // Vérifier le flag mustChangePassword
            if (loggedInUser.mustChangePassword) {
                console.log("AuthContext: Changement de mot de passe requis, redirection vers /profil");
                setUser(loggedInUser);
                router.push('/profil');
            } else {
                console.log("AuthContext: Connexion réussie, redirection vers /");
                setUser(loggedInUser);
                router.push('/');
            }

        } catch (error) {
            console.error("Erreur de connexion dans le context:", error);
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(error.response.data.message || error.response.data.error || 'Échec de la connexion.');
            } else {
                throw new Error('Une erreur inattendue est survenue.');
            }
        }
    };

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout');
            // Supprimer le token lors de la déconnexion
            localStorage.removeItem('auth_token');
            setUser(null);
            router.push('/auth/login');
        } catch (error) {
            console.error("Erreur lors de la déconnexion:", error);
        }
    };

    const ensureAuthenticated = async (): Promise<string | null> => {
        try {
            // Vérifier si nous avons un token dans localStorage
            const storedToken = localStorage.getItem('auth_token');

            if (storedToken) {
                // Vérifier si le token est valide en appelant /api/auth/me
                try {
                    const response = await axios.get('/api/auth/me');
                    if (response.data.authenticated) {
                        console.log("Token valide, utilisateur authentifié", response.data.user);
                        return storedToken;
                    }
                } catch (error) {
                    console.error("Le token stocké n'est pas valide:", error);
                    // Le token n'est pas valide, on continue pour essayer de se réauthentifier
                }
            }

            // Si nous avons des identifiants stockés, essayer de se reconnecter
            const storedCredentials = localStorage.getItem('saved_credentials');
            if (storedCredentials) {
                try {
                    const credentials = JSON.parse(storedCredentials);
                    const response = await axios.post<{ user: User }>('/api/auth/login', {
                        login: credentials.login,
                        password: credentials.password
                    });

                    if (response.data.user) {
                        setUser(response.data.user);
                        console.log("Réauthentification réussie", response.data.user);
                        // Un nouveau token a été mis en place par l'API
                        return localStorage.getItem('auth_token');
                    }
                } catch (error) {
                    console.error("Échec de la réauthentification avec les identifiants sauvegardés:", error);
                }
            }

            // Si nous arrivons ici, pas d'authentification possible
            return null;
        } catch (error) {
            console.error("Erreur lors de la vérification d'authentification:", error);
            return null;
        }
    };

    const value = {
        user,
        isLoading,
        login,
        logout,
        refetchUser: fetchCurrentUser, // Exposer la fonction pour rafraîchir
        ensureAuthenticated // Ajouter la nouvelle fonction
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personnalisé pour utiliser le contexte
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
    }
    return context;
}; 