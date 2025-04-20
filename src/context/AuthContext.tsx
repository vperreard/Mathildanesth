'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user'; // Importer le type User

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (loginData: { login: string; password: string }) => Promise<void>;
    logout: () => Promise<void>;
    refetchUser: () => void; // Pour rafraîchir les données utilisateur si nécessaire
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
            // Appeler l'API pour obtenir l'utilisateur basé sur le cookie
            const response = await axios.get<User>('/api/auth/me');
            setUser(response.data);
        } catch (error) {
            // Si erreur (pas de cookie, token invalide...), l'utilisateur n'est pas connecté
            setUser(null);
            // Ne pas logger l'erreur 401 comme une vraie erreur d'application
            if (axios.isAxiosError(error) && error.response?.status !== 401) {
                console.error("Erreur lors de la récupération de l'utilisateur:", error);
            }
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
            const response = await axios.post<{ user: User }>('/api/auth/login', loginData);
            const loggedInUser = response.data.user;

            // Vérifier le flag mustChangePassword
            if (loggedInUser.mustChangePassword) {
                console.log("AuthContext: Changement de mot de passe requis, redirection vers /profil");
                setUser(loggedInUser); // Stocker l'utilisateur pour afficher ses infos sur /profil
                router.push('/profil'); // Rediriger vers la page de profil
            } else {
                console.log("AuthContext: Connexion réussie, redirection vers /");
                setUser(loggedInUser); // Stocker l'utilisateur connecté normalement
                router.push('/'); // Rediriger vers la page d'accueil après connexion réussie
            }

        } catch (error) {
            console.error("Erreur de connexion dans le context:", error);
            // Propager l'erreur pour l'afficher dans le formulaire de login
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(error.response.data.message || 'Échec de la connexion.');
            } else {
                throw new Error('Une erreur inattendue est survenue.');
            }
        }
    };

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout');
            setUser(null);
            router.push('/login'); // Rediriger vers la page de login après déconnexion
        } catch (error) {
            console.error("Erreur lors de la déconnexion:", error);
            // Gérer l'erreur si nécessaire
        }
    };

    const value = {
        user,
        isLoading,
        login,
        logout,
        refetchUser: fetchCurrentUser // Exposer la fonction pour rafraîchir
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