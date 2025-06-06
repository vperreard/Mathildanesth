import React, { ReactElement } from 'react';
import { render, RenderOptions, waitFor, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

// Créer un QueryClient pour les tests
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Mock user pour AuthProvider
const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER' as const,
  login: 'testuser',
};

// Mock auth context value
const mockAuthContext = {
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
  isAuthenticated: true,
  hasRole: jest.fn(() => true),
  refreshUser: jest.fn(),
};

// Mock theme context value
const mockThemeContext = {
  theme: 'light' as const,
  setTheme: jest.fn(),
  toggleTheme: jest.fn(),
};

/**
 * Utilitaire pour rendre les composants avec tous les providers nécessaires au test
 * Inclut QueryClient, AuthContext, ThemeContext
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    queryClient?: QueryClient;
    mockAuth?: typeof mockAuthContext;
    mockTheme?: typeof mockThemeContext;
    withAuth?: boolean;
    withTheme?: boolean;
}

export function renderWithProviders(
    ui: ReactElement,
    options: CustomRenderOptions = {}
) {
    const {
        queryClient = createTestQueryClient(),
        mockAuth = mockAuthContext,
        mockTheme = mockThemeContext,
        withAuth = true,
        withTheme = true,
        ...renderOptions
    } = options;

    const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
        let wrappedChildren = (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );

        if (withTheme) {
            // Mock ThemeProvider avec une valeur simple
            const MockThemeProvider = ({ children }: { children: React.ReactNode }) => (
                <div data-theme-provider="true">{children}</div>
            );
            wrappedChildren = (
                <MockThemeProvider>
                    {wrappedChildren}
                </MockThemeProvider>
            );
        }

        if (withAuth) {
            // Mock AuthProvider avec une valeur simple
            const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
                <div data-auth-provider="true">{children}</div>
            );
            wrappedChildren = (
                <MockAuthProvider>
                    {wrappedChildren}
                </MockAuthProvider>
            );
        }

        return wrappedChildren;
    };

    return render(ui, { wrapper: AllTheProviders, ...renderOptions });
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
export const mockApiResponse = (url: string, response: unknown, status = 200) => {
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