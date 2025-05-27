'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Configuration optimisée du QueryClient pour le bloc opératoire
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache de 5 minutes pour les données relativement stables
      staleTime: 5 * 60 * 1000,
      // Garder en cache pendant 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry une seule fois en cas d'échec
      retry: 1,
      // Refetch on window focus désactivé pour éviter les requêtes inutiles
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry désactivé pour les mutations
      retry: 0,
    },
  },
});

interface OptimizedProviderProps {
  children: ReactNode;
}

export default function OptimizedProvider({ children }: OptimizedProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  );
}

// Hooks optimisés réexportés pour usage dans le bloc opératoire
export { useOptimizedBlocOperatoire } from '@/hooks/useOptimizedBlocOperatoire';
export { useOptimizedPlanning } from '@/hooks/useOptimizedPlanning';