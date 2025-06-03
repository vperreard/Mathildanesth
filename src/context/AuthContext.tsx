'use client';

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user'; // Importer le type User
import {
  getClientAuthToken,
  setClientAuthToken,
  removeClientAuthToken
} from '@/lib/auth-client-utils'; // Mise à jour de l'import
// import Cookies from 'js-cookie'; // Plus nécessaire ici

// Cache simple pour éviter les requêtes redondantes
const userCache = new Map<string, { user: User; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Configuration Axios optimisée - une seule fois
const setupAxiosInterceptors = (() => {
  let isSetup = false;
  return () => {
    if (isSetup) return;
    isSetup = true;

    axios.interceptors.request.use(
      config => {
        const token = getClientAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Cache busting plus léger - seulement pour les APIs critiques
        if (config.url && (config.url.includes('/api/auth/') || config.url.includes('/api/me'))) {
          const timestamp = new Date().getTime();
          const separator = config.url.includes('?') ? '&' : '?';
          config.url = `${config.url}${separator}_t=${timestamp}`;
        }

        return config;
      },
      error => Promise.reject(error)
    );

    axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          // Nettoyer le cache utilisateur en cas d'erreur 401
          userCache.clear();
          removeClientAuthToken();
        }
        return Promise.reject(error);
      }
    );
  };
})();

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

  // Configuration des intercepteurs
  useMemo(() => {
    setupAxiosInterceptors();
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const token = getClientAuthToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return null;
      }

      // Vérifier le cache utilisateur
      const cachedEntry = userCache.get(token);
      if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_DURATION) {
        setUser(cachedEntry.user);
        setIsLoading(false);
        return cachedEntry.user;
      }

      const response = await axios.get('/api/auth/me');
      const userData = response.data.user;

      // Mettre en cache
      userCache.set(token, { user: userData, timestamp: Date.now() });
      setUser(userData);
      return userData;
    } catch (error) {
      console.log("AuthContext: Erreur lors de la récupération de l'utilisateur");
      setUser(null);
      userCache.clear();
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
      const config = {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000, // 10s timeout
      };

      const response = await axios.post('/api/auth/login', credentials, config);

      if (response.data.token) {
        setClientAuthToken(response.data.token);
        // Mettre en cache immédiatement
        userCache.set(response.data.token, {
          user: response.data.user,
          timestamp: Date.now()
        });
      }

      setUser(response.data.user);
      // Utiliser l'URL de redirection fournie par l'API ou /dashboard par défaut
      const redirectUrl = response.data.redirectUrl || '/dashboard';
      router.push(redirectUrl);
      return response.data.user;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw new Error('Identifiants incorrects');
    }
  };

  const logout = async () => {
    try {
      await axios.post('http://localhost:3000/api/auth/deconnexion');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      removeClientAuthToken();
      userCache.clear();
      setUser(null);
      router.push('/auth/connexion');
    }
  };

  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
    refetchUser: fetchCurrentUser,
    isAuthenticated: !!user,
  }), [user, isLoading, fetchCurrentUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personnalisé pour utiliser le contexte
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
};
