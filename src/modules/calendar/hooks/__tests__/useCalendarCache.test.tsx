import { render, screen, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { useCalendarCache } from '../useCalendarCache';
import { calendarCache } from '../../services/calendarCache';
import { calendarService } from '../../services/calendarService';
import { CalendarEventType, CalendarFilters } from '../../types/event';

// Mock des dépendances avec plus de flexibilité
jest.mock('../../services/calendarCache', () => ({
    calendarCache: {
        getCachedEvents: jest.fn((filters) => {
            // Accepte à la fois une chaîne JSON et un objet
            return null;
        }),
        cacheEvents: jest.fn((events, filters, options) => {
            // Fonction flexible qui accepte les deux formats
        }),
        invalidateEvents: jest.fn((filters) => {
            // Fonction flexible qui accepte les deux formats
        }),
        clearCache: jest.fn(),
    },
}));

jest.mock('../../services/calendarService', () => ({
    calendarService: {
        getEvents: jest.fn((filters) => {
            // Garantit que l'objet filtre est bien utilisé, pas la chaîne
            return [];
        }),
    },
}));

describe('useCalendarCache', () => {
    const mockFilters = {
        eventTypes: [CalendarEventType.LEAVE],
        dateRange: {
            start: new Date('2023-01-01T00:00:00.000Z'),
            end: new Date('2023-01-31T23:59:59.999Z'),
        },
    };
    const mockFiltersStringified = JSON.stringify(mockFilters);

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
        (calendarCache.getCachedEvents as jest.Mock).mockReturnValue(null);
        (calendarService.getEvents as jest.Mock).mockResolvedValue(mockEvents);
    });

    it('devrait charger les données du cache si disponibles', async () => {
        (calendarCache.getCachedEvents as jest.Mock).mockImplementation((filters) => {
            // Vérifier si les filtres correspondent, que ce soit une chaîne ou un objet
            const key = typeof filters === 'string' ? filters : JSON.stringify(filters);
            return key === mockFiltersStringified ? mockEvents : null;
        });

        const { result } = renderHook(() => useCalendarCache(mockFilters));

        await waitFor(() => {
            expect(calendarCache.getCachedEvents).toHaveBeenCalled();
        });

        expect(calendarService.getEvents).not.toHaveBeenCalled();
        expect(result.current.events).toEqual(mockEvents);
        expect(result.current.isCacheHit).toBe(true);
    });

    it('devrait appeler l\'API si aucune donnée en cache', async () => {
        const { result } = renderHook(() => useCalendarCache(mockFilters));

        await waitFor(() => {
            expect(calendarService.getEvents).toHaveBeenCalledWith(mockFilters);
        });

        expect(calendarCache.getCachedEvents).toHaveBeenCalled();
        expect(calendarCache.cacheEvents).toHaveBeenCalledWith(
            mockEvents,
            expect.any(String),
            expect.objectContaining({ ttl: expect.any(Number) })
        );
        expect(result.current.events).toEqual(mockEvents);
        expect(result.current.isCacheHit).toBe(false);
    });

    it('devrait gérer les erreurs correctement', async () => {
        const mockError = new Error('Erreur API');
        (calendarService.getEvents as jest.Mock).mockRejectedValue(mockError);

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        const { result } = renderHook(() => useCalendarCache(mockFilters));

        await waitFor(() => {
            expect(result.current.error).toBe(mockError);
        });

        expect(result.current.events).toEqual([]);
        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });

    it('ne devrait pas utiliser le cache si désactivé', async () => {
        const { result } = renderHook(() => useCalendarCache(mockFilters, { enabled: false }));

        await waitFor(() => {
            expect(calendarService.getEvents).toHaveBeenCalledWith(mockFilters);
        });

        expect(calendarCache.getCachedEvents).not.toHaveBeenCalled();
        expect(calendarCache.cacheEvents).not.toHaveBeenCalled();
        expect(result.current.events).toEqual(mockEvents);
    });

    it('devrait pouvoir invalider le cache', async () => {
        const { result } = renderHook(() => useCalendarCache(mockFilters));

        act(() => {
            result.current.invalidateCache(mockFiltersStringified);
        });

        expect(calendarCache.invalidateEvents).toHaveBeenCalledWith(mockFiltersStringified);

        act(() => {
            result.current.invalidateCache();
        });

        expect(calendarCache.clearCache).toHaveBeenCalled();
    });

    it('devrait mettre à jour les événements lorsque fetchEvents est appelé', async () => {
        const { result } = renderHook(() => useCalendarCache(mockFilters));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(calendarService.getEvents).toHaveBeenCalledTimes(1);
        });

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
        (calendarService.getEvents as jest.Mock).mockResolvedValue(newEvents);

        let fetchResult;
        await act(async () => {
            fetchResult = await result.current.fetchEvents(mockFilters);
        });

        expect(calendarService.getEvents).toHaveBeenCalledWith(mockFilters);
        expect(result.current.events).toEqual(newEvents);
        expect(fetchResult).toEqual(newEvents);
        expect(calendarCache.cacheEvents).toHaveBeenCalledWith(
            newEvents,
            expect.any(String),
            expect.any(Object)
        );
    });
}); 