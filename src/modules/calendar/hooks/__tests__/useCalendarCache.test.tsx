import { render, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useCalendarCache } from '../useCalendarCache';
import { calendarCache } from '../../services/calendarCache';
import { fetchCalendarEvents } from '../../services/calendarService';
import { CalendarEventType } from '../../types/event';
import { act } from 'react-dom/test-utils';

// Mock des dépendances
jest.mock('../../services/calendarCache', () => ({
    calendarCache: {
        getCachedEvents: jest.fn(),
        cacheEvents: jest.fn(),
        invalidateEvents: jest.fn(),
        clearCache: jest.fn(),
    },
}));

jest.mock('../../services/calendarService', () => ({
    fetchCalendarEvents: jest.fn(),
}));

describe('useCalendarCache', () => {
    const mockFilters = {
        eventTypes: [CalendarEventType.LEAVE],
        dateRange: {
            start: new Date(2023, 0, 1),
            end: new Date(2023, 0, 31),
        },
    };

    const mockEvents = [
        {
            id: '1',
            title: 'Congé',
            start: '2023-01-10',
            end: '2023-01-15',
            type: CalendarEventType.LEAVE,
            userId: 'user1',
            leaveId: 'leave1',
            leaveType: 'congé annuel',
            status: 'APPROVED',
            countedDays: 5,
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('devrait charger les données du cache si disponibles', async () => {
        // Configurer le mock pour retourner des données du cache
        (calendarCache.getCachedEvents as jest.Mock).mockReturnValue(mockEvents);

        // Rendre le hook
        const { result } = renderHook(() => useCalendarCache(mockFilters));

        // Attendre que le cache soit consulté
        await waitFor(() => {
            expect(calendarCache.getCachedEvents).toHaveBeenCalledWith(mockFilters);
        });

        // Vérifier que les données du cache sont utilisées
        expect(fetchCalendarEvents).not.toHaveBeenCalled();
        expect(result.current.events).toEqual(mockEvents);
        expect(result.current.isCacheHit).toBe(true);
    });

    it('devrait appeler l\'API si aucune donnée en cache', async () => {
        // Configurer les mocks
        (calendarCache.getCachedEvents as jest.Mock).mockReturnValue(null);
        (fetchCalendarEvents as jest.Mock).mockResolvedValue(mockEvents);

        // Rendre le hook
        const { result } = renderHook(() => useCalendarCache(mockFilters));

        // Attendre que l'API soit appelée
        await waitFor(() => {
            expect(fetchCalendarEvents).toHaveBeenCalledWith(mockFilters);
        });

        // Vérifier que l'API est appelée et le cache mis à jour
        expect(calendarCache.getCachedEvents).toHaveBeenCalledWith(mockFilters);
        expect(calendarCache.cacheEvents).toHaveBeenCalledWith(
            mockEvents,
            mockFilters,
            expect.objectContaining({ ttl: expect.any(Number) })
        );
        expect(result.current.events).toEqual(mockEvents);
        expect(result.current.isCacheHit).toBe(false);
    });

    it('devrait gérer les erreurs correctement', async () => {
        // Configurer les mocks pour simuler une erreur
        (calendarCache.getCachedEvents as jest.Mock).mockReturnValue(null);
        const mockError = new Error('Erreur API');
        (fetchCalendarEvents as jest.Mock).mockRejectedValue(mockError);

        // Espionner console.error
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        // Rendre le hook
        const { result } = renderHook(() => useCalendarCache(mockFilters));

        // Attendre que l'erreur soit traitée
        await waitFor(() => {
            expect(result.current.error).toEqual(mockError);
        });

        // Vérifier que l'erreur est correctement gérée
        expect(result.current.events).toEqual([]);
        expect(consoleErrorSpy).toHaveBeenCalled();

        // Restaurer console.error
        consoleErrorSpy.mockRestore();
    });

    it('ne devrait pas utiliser le cache si désactivé', async () => {
        // Configurer les mocks
        (fetchCalendarEvents as jest.Mock).mockResolvedValue(mockEvents);

        // Rendre le hook avec cache désactivé
        const { result } = renderHook(() => useCalendarCache(mockFilters, { enabled: false }));

        // Attendre que l'API soit appelée
        await waitFor(() => {
            expect(fetchCalendarEvents).toHaveBeenCalledWith(mockFilters);
        });

        // Vérifier que le cache n'est pas utilisé
        expect(calendarCache.getCachedEvents).not.toHaveBeenCalled();
        expect(calendarCache.cacheEvents).not.toHaveBeenCalled();
        expect(result.current.events).toEqual(mockEvents);
    });

    it('devrait pouvoir invalider le cache', async () => {
        // Rendre le hook
        const { result } = renderHook(() => useCalendarCache(mockFilters));

        // Invalider le cache pour des filtres spécifiques
        act(() => {
            result.current.invalidateCache(mockFilters);
        });

        // Vérifier que l'invalidation est appelée
        expect(calendarCache.invalidateEvents).toHaveBeenCalledWith(mockFilters);

        // Invalider tout le cache
        act(() => {
            result.current.invalidateCache();
        });

        // Vérifier que tout le cache est invalidé
        expect(calendarCache.clearCache).toHaveBeenCalled();
    });

    it('devrait mettre à jour les événements lorsque fetchEvents est appelé', async () => {
        // Configurer les mocks
        (calendarCache.getCachedEvents as jest.Mock).mockReturnValue(null);
        (fetchCalendarEvents as jest.Mock).mockResolvedValue(mockEvents);

        // Rendre le hook
        const { result } = renderHook(() => useCalendarCache(mockFilters));

        // Attendre que les données soient chargées
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Réinitialiser les mocks
        jest.clearAllMocks();
        const newEvents = [...mockEvents, {
            id: '2',
            title: 'Nouveau congé',
            start: '2023-01-20',
            end: '2023-01-25',
            type: CalendarEventType.LEAVE,
            userId: 'user1',
            leaveId: 'leave2',
            leaveType: 'congé annuel',
            status: 'PENDING',
            countedDays: 5,
        }];
        (fetchCalendarEvents as jest.Mock).mockResolvedValue(newEvents);

        // Appeler fetchEvents manuellement
        let fetchResult;
        await act(async () => {
            fetchResult = await result.current.fetchEvents(mockFilters);
        });

        // Vérifier que les événements sont mis à jour
        expect(fetchCalendarEvents).toHaveBeenCalledWith(mockFilters);
        expect(result.current.events).toEqual(newEvents);
        expect(fetchResult).toEqual(newEvents);
    });
}); 