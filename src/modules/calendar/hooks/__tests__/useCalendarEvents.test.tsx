import { renderHook, act, waitFor } from '@testing-library/react';
import { useCalendarEvents } from '../useCalendarEvents';
import { calendarService } from '../../services/calendarService';
import { AnyCalendarEvent, CalendarEventType, CalendarFilters } from '../../types/event';

// Mock du service calendarService
jest.mock('../../services/calendarService', () => ({
    calendarService: {
        getEvents: jest.fn(),
        createEvent: jest.fn(),
        updateEvent: jest.fn(),
        deleteEvent: jest.fn(),
        updateEventStatus: jest.fn()
    }
}));

describe('useCalendarEvents Hook', () => {
    // Données fictives pour les tests
    const mockEvents: AnyCalendarEvent[] = [
        {
            id: 'event1',
            title: 'Consultation 1',
            start: '2023-06-15T09:00:00',
            end: '2023-06-15T10:00:00',
            type: 'CONSULTATION' as CalendarEventType,
            userId: 'user1',
            locationId: 'location1'
        },
        {
            id: 'event2',
            title: 'Intervention 1',
            start: '2023-06-15T11:00:00',
            end: '2023-06-15T12:30:00',
            type: 'INTERVENTION' as CalendarEventType,
            userId: 'user2',
            locationId: 'location2'
        },
        {
            id: 'event3',
            title: 'Consultation 2',
            start: '2023-06-16T14:00:00',
            end: '2023-06-16T15:00:00',
            type: 'CONSULTATION' as CalendarEventType,
            userId: 'user1',
            locationId: 'location1'
        }
    ];

    // Configuration par défaut des filtres
    const defaultFilters: CalendarFilters = {
        eventTypes: ['CONSULTATION', 'INTERVENTION']
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Configuration par défaut du mock
        (calendarService.getEvents as jest.Mock).mockResolvedValue(mockEvents);
        (calendarService.createEvent as jest.Mock).mockImplementation((event) =>
            Promise.resolve({ ...event, id: 'new-id' }));
        (calendarService.updateEvent as jest.Mock).mockImplementation((event) =>
            Promise.resolve(event));
        (calendarService.deleteEvent as jest.Mock).mockResolvedValue(true);
        (calendarService.updateEventStatus as jest.Mock).mockImplementation((eventId, status) =>
            Promise.resolve({ id: eventId, status }));
    });

    test('doit charger les événements automatiquement au montage', async () => {
        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters,
            autoLoad: true
        }));

        // Vérifier l'état initial
        expect(result.current.loading).toBe(true);
        expect(result.current.events).toEqual([]);

        // Attendre que les événements soient chargés
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Vérifier que getEvents a été appelé
        expect(calendarService.getEvents).toHaveBeenCalledWith(expect.objectContaining({
            eventTypes: expect.any(Array)
        }));

        // Vérifier que les événements ont été chargés
        expect(result.current.events).toEqual(mockEvents);
        expect(result.current.error).toBeNull();
    });

    test('ne doit pas charger les événements si autoLoad est désactivé', async () => {
        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters,
            autoLoad: false
        }));

        // Vérifier que getEvents n'a pas été appelé
        expect(calendarService.getEvents).not.toHaveBeenCalled();

        // Vérifier que les événements sont vides
        expect(result.current.events).toEqual([]);
        expect(result.current.loading).toBe(false);
    });

    test('doit filtrer les événements par type', async () => {
        const typedEvents = [
            { ...mockEvents[0], type: CalendarEventType.LEAVE },
            { ...mockEvents[1], type: CalendarEventType.DUTY },
            { ...mockEvents[2], type: CalendarEventType.LEAVE }
        ];

        (calendarService.getEvents as jest.Mock).mockResolvedValue(typedEvents);

        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: {
                eventTypes: [CalendarEventType.LEAVE]
            }
        }));

        // Attendre que les événements soient chargés
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Vérifier que les événements ont été filtrés
        await act(async () => {
            await result.current.updateFilters({ eventTypes: [CalendarEventType.LEAVE] });
        });

        // Vérifier que getEvents a été appelé avec le filtre
        expect(calendarService.getEvents).toHaveBeenCalledWith(expect.objectContaining({
            eventTypes: [CalendarEventType.LEAVE]
        }));
    });

    test('doit filtrer les événements par utilisateur', async () => {
        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters
        }));

        // Attendre que les événements soient chargés
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Mettre à jour les filtres pour filtrer par utilisateur
        await act(async () => {
            await result.current.updateFilters({ userIds: ['user1'] });
        });

        // Vérifier que getEvents a été appelé avec le bon filtre
        expect(calendarService.getEvents).toHaveBeenCalledWith(expect.objectContaining({
            userIds: ['user1']
        }));
    });

    test('doit mettre à jour les filtres', async () => {
        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters
        }));

        // Attendre que les événements soient chargés
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Mettre à jour les filtres
        await act(async () => {
            await result.current.updateFilters({ locationIds: ['location2'] });
        });

        // Vérifier que getEvents a été appelé avec les bons filtres
        expect(calendarService.getEvents).toHaveBeenCalledWith(expect.objectContaining({
            locationIds: ['location2']
        }));
    });

    test('doit ajouter un nouvel événement', async () => {
        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters
        }));

        // Attendre que les événements soient chargés
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Préparer un nouvel événement
        const newEvent = {
            title: 'Nouvelle consultation',
            start: '2023-06-17T10:00:00',
            end: '2023-06-17T11:00:00',
            type: CalendarEventType.MEETING,
            userId: 'user3'
        };

        // Simuler la création d'un événement
        await act(async () => {
            await result.current.addEvent(newEvent);
        });

        // Vérifier que createEvent a été appelé avec les bonnes données
        expect(calendarService.createEvent).toHaveBeenCalledWith(newEvent);
    });

    test('doit mettre à jour un événement existant', async () => {
        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters
        }));

        // Attendre que les événements soient chargés
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Préparer la mise à jour d'un événement
        const eventUpdate = {
            title: 'Consultation mise à jour'
        };

        // Simuler la mise à jour d'un événement
        await act(async () => {
            await result.current.updateEvent('event1', eventUpdate);
        });

        // Vérifier que updateEvent a été appelé
        expect(calendarService.updateEvent).toHaveBeenCalled();
    });

    test('doit supprimer un événement', async () => {
        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters
        }));

        // Attendre que les événements soient chargés
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Simuler la suppression d'un événement
        await act(async () => {
            await result.current.deleteEvent('event1');
        });

        // Vérifier que deleteEvent a été appelé
        expect(calendarService.deleteEvent).toHaveBeenCalledWith('event1', expect.any(String));
    });

    test('doit gérer les erreurs lors du chargement', async () => {
        // Simuler une erreur dans getEvents
        const error = new Error('Erreur de chargement');
        (calendarService.getEvents as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters
        }));

        // Attendre que l'erreur soit traitée
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.error).not.toBeNull();
        });

        // Vérifier que l'erreur a été correctement capturée
        expect(result.current.error).toEqual(error);
    });

    test('doit rafraîchir les événements', async () => {
        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters
        }));

        // Attendre que les événements soient chargés
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Réinitialiser le mock pour vérifier l'appel de rafraîchissement
        jest.clearAllMocks();

        // Simuler un rafraîchissement
        await act(async () => {
            await result.current.refreshEvents();
        });

        // Vérifier que getEvents a été appelé à nouveau
        expect(calendarService.getEvents).toHaveBeenCalled();
    });

    test('doit mettre à jour le statut d\'un événement', async () => {
        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters
        }));

        // Attendre que les événements soient chargés
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Simuler la mise à jour du statut d'un événement
        await act(async () => {
            await result.current.updateEventStatus('event1', 'APPROVED');
        });

        // Vérifier que updateEventStatus a été appelé
        expect(calendarService.updateEventStatus).toHaveBeenCalledWith('event1', 'APPROVED');
    });

    test('doit grouper les événements par jour', async () => {
        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters
        }));

        // Attendre que les événements soient chargés
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Récupérer les événements groupés par jour
        const eventsByDay = result.current.getEventsByDay();

        // Vérifier la structure des événements groupés
        expect(eventsByDay).toHaveLength(2); // 2 jours différents dans les données de test
        expect(eventsByDay[0].date).toBeDefined();
        expect(eventsByDay[0].events).toBeInstanceOf(Array);
    });

    test('doit utiliser un service personnalisé pour récupérer les événements', async () => {
        const customFetchEvents = jest.fn().mockResolvedValue([]);

        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters,
            fetchEvents: customFetchEvents
        }));

        // Attendre que les événements soient chargés
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Vérifier que la fonction personnalisée a été utilisée
        expect(customFetchEvents).toHaveBeenCalled();
        // Vérifier que la fonction par défaut n'a pas été utilisée
        expect(calendarService.getEvents).not.toHaveBeenCalled();
    });
}); 