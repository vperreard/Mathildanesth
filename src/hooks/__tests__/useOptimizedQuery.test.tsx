import { renderHook, act, waitFor } from '@testing-library/react';
// Importer QueryClient/Provider depuis la source
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOptimizedQuery, invalidateQueries, clearQueryCache, setQueryCache, getQueryCache } from '../useOptimizedQuery'; // Garder les fonctions spécifiques
import React from 'react';

// Mock pour setTimeout
jest.useFakeTimers();

// Fonction asynchrone simulée
const mockFetchData = jest.fn();

// Créer un wrapper avec un nouveau QueryClient (Syntaxe alternative)
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    // Utiliser une fonction fléchée directe
    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    };
    return Wrapper;
};

describe('useOptimizedQuery', () => {
    beforeEach(() => {
        mockFetchData.mockClear();
        jest.clearAllTimers();
        // Nettoyer le cache interne de useOptimizedQuery s'il est différent de celui de React Query
        clearQueryCache();
    });

    it('devrait récupérer des données avec succès', async () => {
        mockFetchData.mockResolvedValue('Données test');
        const wrapper = createWrapper();
        const { result } = renderHook(() => useOptimizedQuery('test-key', mockFetchData), { wrapper });

        // @ts-ignore
        await waitFor(() => expect(result.current.data).toBeDefined());

        // @ts-ignore
        expect(result.current.isLoading).toBe(false);
        // @ts-ignore
        expect(result.current.data).toBe('Données test');
        // @ts-ignore
        expect(result.current.error).toBeNull();
        // @ts-ignore
        expect(mockFetchData).toHaveBeenCalledTimes(1);
    });

    it('devrait gérer les erreurs de requête', async () => {
        const mockError = new Error('Échec de la requête');
        mockFetchData.mockRejectedValue(mockError);
        const wrapper = createWrapper();
        const { result } = renderHook(() => useOptimizedQuery('error-key', mockFetchData), { wrapper });

        // @ts-ignore
        await waitFor(() => expect(result.current.error).toBeDefined());

        // @ts-ignore
        expect(result.current.isLoading).toBe(false);
        // @ts-ignore
        expect(result.current.data).toBeUndefined();
        // @ts-ignore
        expect(result.current.error).toBe(mockError);
        // @ts-ignore
        expect(mockFetchData).toHaveBeenCalledTimes(1);
    });

    it('devrait utiliser les données mises en cache', async () => {
        mockFetchData.mockResolvedValue('Données mises en cache');
        const wrapper = createWrapper();

        const { result: firstResult } = renderHook(() => useOptimizedQuery('cache-key', mockFetchData), { wrapper });
        // @ts-ignore
        await waitFor(() => expect(firstResult.current.data).toBeDefined());
        // @ts-ignore
        expect(firstResult.current.data).toBe('Données mises en cache');
        // @ts-ignore
        expect(mockFetchData).toHaveBeenCalledTimes(1);

        const { result: secondResult } = renderHook(() => useOptimizedQuery('cache-key', mockFetchData), { wrapper });
        // Ne devrait pas être en chargement car les données sont en cache
        // @ts-ignore
        expect(secondResult.current.isLoading).toBe(false);
        // @ts-ignore
        expect(secondResult.current.data).toBe('Données mises en cache');
        // Ne devrait pas avoir rappelé la fonction fetch
        // @ts-ignore
        expect(mockFetchData).toHaveBeenCalledTimes(1);
    });

    it('devrait invalider le cache et refetcher', async () => {
        mockFetchData
            .mockResolvedValueOnce('Données initiales')
            .mockResolvedValueOnce('Données rafraîchies');
        const wrapper = createWrapper();
        const queryKey = 'invalidate-key'; // Utiliser une variable pour la clé

        const { result } = renderHook(() => useOptimizedQuery(queryKey, mockFetchData), { wrapper });
        // @ts-ignore
        await waitFor(() => expect(result.current.data).toBeDefined());
        // @ts-ignore
        expect(result.current.data).toBe('Données initiales');
        // @ts-ignore
        expect(mockFetchData).toHaveBeenCalledTimes(1);

        await act(async () => {
            // Passer la clé de requête à invalidateQueries
            await invalidateQueries(queryKey);
        });

        // @ts-ignore
        await waitFor(() => expect(mockFetchData).toHaveBeenCalledTimes(2));
        // @ts-ignore
        await waitFor(() => expect(result.current.data).toBe('Données rafraîchies'));
        // @ts-ignore
        expect(result.current.data).toBe('Données rafraîchies');
    });

    it('devrait permettre set/get manuel du cache', async () => {
        const wrapper = createWrapper();
        const cacheKey = 'manual-cache-key';
        const manualData = { message: 'Données manuelles' };

        await act(async () => {
            // Passer la clé et les données à setQueryCache
            await setQueryCache(cacheKey, manualData);
        });

        // Appeler useOptimizedQuery avec la clé et la fonction fetch
        const { result } = renderHook(() => useOptimizedQuery(cacheKey, mockFetchData), { wrapper });

        // @ts-ignore
        expect(result.current.isLoading).toBe(false);
        // @ts-ignore
        expect(result.current.data).toEqual(manualData);
        // @ts-ignore
        expect(mockFetchData).not.toHaveBeenCalled();

        // Appeler getQueryCache avec la clé
        const cachedData = await getQueryCache(cacheKey);
        // @ts-ignore
        expect(cachedData).toEqual(manualData);
    });
}); 