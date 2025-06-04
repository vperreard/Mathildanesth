'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useOptimizedBlocOperatoire } from '@/hooks/useOptimizedBlocOperatoire';
import { useAuth } from '@/hooks/useAuth';

// Context pour partager l'instance optimisée
const BlocOperatoireContext = createContext<ReturnType<typeof useOptimizedBlocOperatoire> | null>(null);

// Configuration optimisée du QueryClient pour le bloc opératoire
const createOptimizedQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Configuration par défaut optimisée
      staleTime: 1000 * 60 * 5, // 5 minutes par défaut
      gcTime: 1000 * 60 * 30, // 30 minutes en cache
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      retry: (failureCount, error: any) => {
        // Retry intelligent basé sur le type d'erreur
        if (error?.response?.status === 401) return false; // Pas de retry pour les erreurs d'auth
        if (error?.response?.status >= 400 && error?.response?.status < 500) return false; // Pas de retry pour les erreurs client
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        console.error('Mutation error:', error);
        // TODO: Intégrer avec le système de notifications
      },
    },
  },
});

let queryClientInstance: QueryClient | null = null;

// Singleton QueryClient pour éviter les re-créations
const getQueryClient = () => {
  if (!queryClientInstance) {
    queryClientInstance = createOptimizedQueryClient();
  }
  return queryClientInstance;
};

interface BlocOperatoireProviderProps {
  children: React.ReactNode;
  siteId?: string;
  enablePrefetch?: boolean;
}

// Provider interne qui utilise le hook optimisé
const BlocOperatoireProviderInner = ({ 
  children, 
  siteId, 
  enablePrefetch = true 
}: BlocOperatoireProviderProps) => {
  const { user } = useAuth();
  
  // Initialiser le hook optimisé avec la configuration
  const blocOperatoire = useOptimizedBlocOperatoire({
    siteId: siteId || user?.siteId,
    enablePrefetch,
    staleTime: 1000 * 60 * 2, // 2 minutes pour le contexte général
    cacheTime: 1000 * 60 * 10, // 10 minutes en cache
  });

  // Précharger les données critiques au montage si l'utilisateur est autorisé
  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'RESPONSABLE_BLOC')) {
      blocOperatoire.prefetchCriticalData();
    }
  }, [user, blocOperatoire]);

  return (
    <BlocOperatoireContext.Provider value={blocOperatoire}>
      {children}
    </BlocOperatoireContext.Provider>
  );
};

// Provider principal avec QueryClient
export const OptimizedProvider = ({ children, ...props }: BlocOperatoireProviderProps) => {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BlocOperatoireProviderInner {...props}>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools 
            initialIsOpen={false} 
            buttonPosition="bottom-left"
          />
        )}
      </BlocOperatoireProviderInner>
    </QueryClientProvider>
  );
};

// Hook pour utiliser le contexte optimisé
export const useBlocOperatoireContext = () => {
  const context = useContext(BlocOperatoireContext);
  if (!context) {
    throw new Error('useBlocOperatoireContext must be used within OptimizedProvider');
  }
  return context;
};

export default OptimizedProvider;