import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { useOptimizedQuery, QueryClientProvider } from '../useOptimizedQuery';

// Mock pour setTimeout
jest.useFakeTimers();

// Fonction asynchrone simulée
const mockFetchData = jest.fn();

// Fonction pour nettoyer le cache 
const clearQueryCache = () => {
    QueryClientProvider.getClient().clearCache();
};

// Fonction pour invalider une requête
const invalidateQueries = (key: string) => {
    QueryClientProvider.getClient().invalidateQuery(key);
};

// Fonction pour définir le cache
const setQueryCache = (key: string, data: any) => {
    QueryClientProvider.getClient().addToCache(key, data, 60000);
};

// Fonction pour récupérer du cache
const getQueryCache = (key: string) => {
    const cached = QueryClientProvider.getClient().getFromCache(key);
    return cached?.data;
};

// Créer un wrapper pour le test
const createWrapper = () => {
    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        return children;
    };
    return Wrapper;
};

describe('useOptimizedQuery', () => {
    beforeEach(() => {
        mockFetchData.mockClear();
        jest.clearAllTimers();
        clearQueryCache();
    });

    it('devrait récupérer des données avec succès', async () => {
        mockFetchData.mockResolvedValue('Données test');
        const wrapper = createWrapper();
        const { result, rerender } = renderHook(() => useOptimizedQuery('test-key', mockFetchData), { wrapper });

        // Initialement, isLoading devrait être true
        expect(result.current.isLoading).toBeTruthy();

        // Exécuter les promesses et les timers en attente
        await act(async () => {
            jest.runAllTimers();
        });

        // Rerender pour s'assurer que le hook a mis à jour son état
        rerender();

        // Après le chargement, vérifier que les données sont présentes et que isLoading est false
        expect(result.current.isLoading).toBeFalsy();
        expect(result.current.data).toBe('Données test');
        expect(mockFetchData).toHaveBeenCalledTimes(1);
    });

    it('devrait gérer les erreurs de requête', async () => {
        const mockError = new Error('Échec de la requête');
        mockFetchData.mockRejectedValue(mockError);
        const wrapper = createWrapper();
        const { result, rerender } = renderHook(() => useOptimizedQuery('error-key', mockFetchData), { wrapper });

        // Exécuter les promesses et les timers en attente
        await act(async () => {
            jest.runAllTimers();
        });

        // Rerender pour s'assurer que le hook a mis à jour son état
        rerender();

        // Vérifier que l'erreur est bien transmise
        expect(result.current.isLoading).toBeFalsy();
        expect(result.current.error).toBeDefined();
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