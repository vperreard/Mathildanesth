import { renderHook, act } from '@testing-library/react-hooks';
import { useOptimizedQuery, invalidateQueries, clearQueryCache, setQueryCache, getQueryCache, QueryClientProvider } from '../useOptimizedQuery';

// Mock pour setTimeout pour accélérer les tests
jest.useFakeTimers();

describe('useOptimizedQuery', () => {
    // Réinitialiser le cache avant chaque test
    beforeEach(() => {
        clearQueryCache();
    });

    it('devrait charger les données correctement', async () => {
        const mockData = { id: 1, name: 'Test' };
        const mockFn = jest.fn().mockResolvedValue(mockData);

        const { result, waitForNextUpdate } = renderHook(() =>
            useOptimizedQuery(mockFn, { cacheKey: 'test-key' })
        );

        // État initial
        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toBe(null);
        expect(result.current.error).toBe(null);

        // Attendre la résolution de la requête
        await waitForNextUpdate();

        // État après chargement
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toEqual(mockData);
        expect(result.current.error).toBe(null);
        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('devrait mettre en cache les résultats', async () => {
        const mockData = { id: 1, name: 'Test' };
        const mockFn = jest.fn().mockResolvedValue(mockData);
        const cacheKey = 'test-cache-key';

        // Premier appel
        const { result: firstResult, waitForNextUpdate: firstWait } = renderHook(() =>
            useOptimizedQuery(mockFn, { cacheKey })
        );

        await firstWait();
        expect(firstResult.current.data).toEqual(mockData);
        expect(mockFn).toHaveBeenCalledTimes(1);

        // Deuxième appel avec la même clé - devrait utiliser le cache
        const { result: secondResult, waitForNextUpdate: secondWait } = renderHook(() =>
            useOptimizedQuery(mockFn, { cacheKey })
        );

        // Pas besoin d'attendre, les données devraient être disponibles immédiatement
        expect(secondResult.current.data).toEqual(mockData);
        expect(secondResult.current.isLoading).toBe(false);

        // La fonction de requête ne devrait pas être appelée une seconde fois
        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('devrait rafraîchir les données si demandé explicitement', async () => {
        const mockData1 = { id: 1, name: 'Initial' };
        const mockData2 = { id: 1, name: 'Updated' };
        const mockFn = jest.fn()
            .mockResolvedValueOnce(mockData1)
            .mockResolvedValueOnce(mockData2);

        const cacheKey = 'refresh-test';

        const { result, waitForNextUpdate } = renderHook(() =>
            useOptimizedQuery(mockFn, { cacheKey })
        );

        // Attendre le premier chargement
        await waitForNextUpdate();
        expect(result.current.data).toEqual(mockData1);

        // Rafraîchir les données
        act(() => {
            result.current.refetch();
        });

        // Devrait être en train de charger à nouveau
        expect(result.current.isLoading).toBe(true);

        // Attendre le deuxième chargement
        await waitForNextUpdate();

        // Vérifier que les données ont été mises à jour
        expect(result.current.data).toEqual(mockData2);
        expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('devrait gérer les erreurs correctement', async () => {
        const errorMessage = 'Test error';
        const mockFn = jest.fn().mockRejectedValue(new Error(errorMessage));

        const { result, waitForNextUpdate } = renderHook(() =>
            useOptimizedQuery(mockFn)
        );

        await waitForNextUpdate();

        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe(errorMessage);
        expect(result.current.data).toBe(null);
    });

    it('devrait réessayer en cas d\'erreur selon les paramètres', async () => {
        const mockFn = jest.fn()
            .mockRejectedValueOnce(new Error('Temporary error'))
            .mockResolvedValueOnce({ success: true });

        const { result, waitForNextUpdate } = renderHook(() =>
            useOptimizedQuery(mockFn, { retryCount: 1, retryDelay: 1000 })
        );

        // Attendre la première erreur
        await waitForNextUpdate();

        // Avancer le temps pour déclencher le retry
        act(() => {
            jest.advanceTimersByTime(1000);
        });

        // Attendre le deuxième appel
        await waitForNextUpdate();

        // Vérifier que la requête a réussi au deuxième essai
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(result.current.data).toEqual({ success: true });
        expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('devrait invalider correctement le cache', async () => {
        const mockFn = jest.fn()
            .mockResolvedValueOnce({ id: 1, version: 1 })
            .mockResolvedValueOnce({ id: 1, version: 2 });

        const cacheKey = 'invalidation-test';

        // Premier appel
        const { result, waitForNextUpdate, rerender } = renderHook(() =>
            useOptimizedQuery(mockFn, { cacheKey })
        );

        await waitForNextUpdate();
        expect(result.current.data).toEqual({ id: 1, version: 1 });

        // Invalider le cache
        act(() => {
            invalidateQueries(new RegExp(cacheKey));
        });

        // Forcer le re-render pour déclencher une nouvelle requête
        rerender();

        // Attendre le deuxième chargement
        await waitForNextUpdate();

        // Vérifier que les données ont été rechargées
        expect(result.current.data).toEqual({ id: 1, version: 2 });
        expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('devrait gérer correctement les données périmées', async () => {
        const mockFn = jest.fn()
            .mockResolvedValueOnce({ id: 1, version: 1 })
            .mockResolvedValueOnce({ id: 1, version: 2 });

        const cacheKey = 'stale-test';

        // Premier appel avec un staleTime très court
        const { result, waitForNextUpdate, rerender } = renderHook(() =>
            useOptimizedQuery(mockFn, { cacheKey, staleTime: 100 })
        );

        await waitForNextUpdate();
        expect(result.current.data).toEqual({ id: 1, version: 1 });

        // Avancer le temps au-delà du staleTime
        act(() => {
            jest.advanceTimersByTime(200);
        });

        // Forcer le re-render pour déclencher une nouvelle requête
        rerender();

        // Les données périmées devraient être utilisées pendant que les données fraîches sont chargées
        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toEqual({ id: 1, version: 1 });
        expect(result.current.isStale).toBe(true);

        // Attendre le deuxième chargement
        await waitForNextUpdate();

        // Vérifier que les données ont été mises à jour
        expect(result.current.data).toEqual({ id: 1, version: 2 });
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isStale).toBe(false);
        expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('devrait permettre d\'ajouter et récupérer manuellement des données du cache', () => {
        const data = { id: 1, name: 'Cached manually' };
        const cacheKey = 'manual-cache-test';

        // Ajouter au cache
        setQueryCache(cacheKey, data);

        // Récupérer du cache
        const cachedData = getQueryCache(cacheKey);

        expect(cachedData).toEqual(data);
    });

    it('devrait respecter l\'option enabled pour contrôler l\'exécution', async () => {
        const mockFn = jest.fn().mockResolvedValue({ success: true });

        // Requête désactivée
        const { result, rerender } = renderHook(
            (props) => useOptimizedQuery(mockFn, props),
            { initialProps: { enabled: false } }
        );

        // Vérifier que la requête n'a pas été exécutée
        expect(result.current.isLoading).toBe(false);
        expect(mockFn).not.toHaveBeenCalled();

        // Activer la requête
        rerender({ enabled: true });

        // Vérifier que la requête est en cours
        expect(result.current.isLoading).toBe(true);
    });
}); 