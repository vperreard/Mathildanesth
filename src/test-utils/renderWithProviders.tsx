import React, { ReactElement } from 'react';
import { render, RenderOptions, waitFor, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Créer un QueryClient pour les tests
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

/**
 * Utilitaire pour rendre les composants avec tous les providers nécessaires au test
 * Cet utilitaire simplifie les tests en ajoutant automatiquement les contextes requis
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    // Options personnalisées pour configurer les providers
    queryClient?: QueryClient;
    // Autres options à ajouter si nécessaire
}

export function renderWithProviders(
    ui: ReactElement,
    options?: CustomRenderOptions
) {
    const queryClient = options?.queryClient || createTestQueryClient();

    const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    };

    return render(ui, { wrapper: AllTheProviders, ...options });
}

// Export d'utilitaires supplémentaires
export * from '@testing-library/react';
export { renderWithProviders as render };

// Helper pour attendre que les requêtes se terminent
export const waitForLoadingToFinish = () =>
  waitFor(() => {
    const loaders = screen.queryAllByTestId(/loading/i);
    const spinners = screen.queryAllByRole('progressbar');
    expect([...loaders, ...spinners]).toHaveLength(0);
  });

// Helper pour mock les réponses API
export const mockApiResponse = (url: string, response: any, status = 200) => {
  global.fetch = jest.fn().mockImplementation((requestUrl) => {
    if (requestUrl.includes(url)) {
      return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: async () => response,
        text: async () => JSON.stringify(response),
      });
    }
    return Promise.reject(new Error('Not found'));
  });
}; 