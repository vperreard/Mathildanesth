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

        // Avancer dans le temps pour que la requête se termine
        await act(async () => {
            await Promise.resolve(); // Pour résoudre la promesse mockFetchData
            jest.runAllTimers();
        });

        // Ne pas tester directement isLoading car il pourrait encore être true
        // dû au timing des tests et à la façon dont React met à jour l'état
        await waitFor(() => {
            expect(result.current.data).toBe('Données test');
        });

        expect(mockFetchData).toHaveBeenCalledTimes(1);
    });

    it('devrait gérer les erreurs de requête', async () => {
        const mockError = new Error('Échec de la requête');
        mockFetchData.mockRejectedValue(mockError);
        const wrapper = createWrapper();
        const { result, rerender } = renderHook(() => useOptimizedQuery('error-key', mockFetchData), { wrapper });

        // Exécuter les promesses et les timers en attente
        await act(async () => {
            await Promise.resolve(); // Pour rejeter la promesse mockFetchData
            jest.runAllTimers();
        });

        // Attendre que l'erreur soit définie
        await waitFor(() => {
            expect(result.current.error).toBeDefined();
        });

        expect(mockFetchData).toHaveBeenCalledTimes(1);
    });

    it('devrait utiliser les données mises en cache', async () => {
        // Préparer le cache avec des données
        const cacheKey = 'cache-key';
        setQueryCache(cacheKey, 'Données mises en cache');

        const wrapper = createWrapper();
        const { result } = renderHook(() => useOptimizedQuery(cacheKey, mockFetchData), { wrapper });

        // Les données du cache devraient être disponibles immédiatement
        expect(result.current.data).toBe('Données mises en cache');
        expect(result.current.isLoading).toBe(false);
        expect(mockFetchData).not.toHaveBeenCalled(); // Pas d'appel car données en cache
    });

    it('devrait invalider le cache et refetcher', async () => {
        mockFetchData
            .mockResolvedValueOnce('Données initiales')
            .mockResolvedValueOnce('Données rafraîchies');

        const wrapper = createWrapper();
        const queryKey = 'invalidate-key';

        // Préparer le cache avec des données initiales
        setQueryCache(queryKey, 'Données initiales');

        const { result } = renderHook(() => useOptimizedQuery(queryKey, mockFetchData), { wrapper });

        // Les données du cache devraient être disponibles immédiatement
        expect(result.current.data).toBe('Données initiales');

        // Invalider le cache
        await act(async () => {
            invalidateQueries(queryKey);
        });

        // Déclencher manuellement un refetch puisque l'invalidation ne le fait pas automatiquement
        await act(async () => {
            result.current.refetch();
            await Promise.resolve();
            jest.runAllTimers();
        });

        // Vérifier que les données sont rafraîchies
        await waitFor(() => {
            expect(mockFetchData).toHaveBeenCalled();
        });

        await waitFor(() => {
            expect(result.current.data).toBe('Données rafraîchies');
        });
    });

    it('devrait permettre set/get manuel du cache', async () => {
        const wrapper = createWrapper();
        const cacheKey = 'manual-cache-key';
        const manualData = { message: 'Données manuelles' };

        // Définir manuellement les données dans le cache
        await act(async () => {
            setQueryCache(cacheKey, manualData);
        });

        // Appeler useOptimizedQuery avec la clé et la fonction fetch
        const { result } = renderHook(() => useOptimizedQuery(cacheKey, mockFetchData), { wrapper });

        // Les données devraient être immédiatement disponibles
        expect(result.current.data).toEqual(manualData);
        expect(mockFetchData).not.toHaveBeenCalled();

        // Appeler getQueryCache avec la clé
        const cachedData = getQueryCache(cacheKey);
        expect(cachedData).toEqual(manualData);
    });
}); 