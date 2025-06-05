import React from 'react';
import { logger } from "./logger";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { prefetchFrequentLeaveData } from '@/modules/leaves/hooks/useLeaveQueries';
import { useAuth } from '@/context/AuthContext';

// Configuration optimisée du client React Query
export const createQueryClient = () => {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Configuration par défaut pour toutes les requêtes
                retry: process.env.NODE_ENV === 'production' ? 3 : 0, // Moins de tentatives en développement
                retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000), // Backoff exponentiel
                staleTime: 1000 * 60, // Par défaut 1 minute
                cacheTime: 1000 * 60 * 10, // 10 minutes en cache
                refetchOnWindowFocus: process.env.NODE_ENV === 'production', // Désactivé en développement
                refetchOnReconnect: true,
                refetchOnMount: true,
            },
            mutations: {
                retry: false, // Ne pas réessayer les mutations par défaut
                onError: (error) => {
                    // Logger les erreurs de mutation
                    logger.error('Erreur de mutation:', error);
                }
            }
        }
    });
};

// Singleton du client React Query
export const queryClient = createQueryClient();

/**
 * Initialise et précharge les données au démarrage de l'application
 */
export const initializeAppData = async (userId?: string) => {
    // Précharger les données fréquemment consultées
    await prefetchFrequentLeaveData(queryClient, userId);
};

/**
 * Provider React Query pour l'application
 */
export const ReactQueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    // Précharger les données au montage du provider
    React.useEffect(() => {
        if (user?.id) {
            initializeAppData(user.id);
        }
    }, [user?.id]);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV !== 'production' && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    );
}; 