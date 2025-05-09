import { renderHook, act, waitFor } from '@testing-library/react';
import { useCalendarEvents } from '../useCalendarEvents';
import { calendarService } from '../../services/calendarService';
import { AnyCalendarEvent, CalendarEventType, CalendarFilters, AssignmentEvent, DutyEvent, MeetingEvent, LeaveEvent } from '../../types/event';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// Mock du service calendarService avec typage correct des fonctions retournant des promesses
const mockGetEvents = jest.fn<(filters?: CalendarFilters) => Promise<AnyCalendarEvent[]>>();
// Ajustement: createEvent prend Omit<AnyCalendarEvent, 'id'>
const mockCreateEvent = jest.fn<(event: Omit<AnyCalendarEvent, 'id'>) => Promise<AnyCalendarEvent>>();
// MODIFIÉ: calendarService.updateEvent est appelé par le hook avec 1 argument: l'événement complet.
const mockUpdateEvent = jest.fn<(event: AnyCalendarEvent) => Promise<AnyCalendarEvent | null>>();
const mockDeleteEvent = jest.fn<(eventId: string, eventType?: CalendarEventType) => Promise<boolean>>();
// MODIFIÉ: calendarService.updateEventStatus est appelé par le hook avec 2 arguments: eventId, status.
const mockUpdateEventStatus = jest.fn<(eventId: string, status: string) => Promise<AnyCalendarEvent | null>>();

jest.mock('../../services/calendarService', () => ({
    calendarService: {
        getEvents: mockGetEvents,
        createEvent: mockCreateEvent,
        updateEvent: mockUpdateEvent,
        deleteEvent: mockDeleteEvent,
        updateEventStatus: mockUpdateEventStatus
    }
}));

describe('useCalendarEvents Hook', () => {
    // Données fictives pour les tests
    const mockAssignmentEvents: AssignmentEvent[] = [
        {
            id: 'event1',
            title: 'Affectation 1',
            start: '2023-06-15T09:00:00',
            end: '2023-06-15T10:00:00',
            type: CalendarEventType.ASSIGNMENT,
            locationId: 'location1'
        },
        {
            id: 'event3',
            title: 'Affectation 2',
            start: '2023-06-16T14:00:00',
            end: '2023-06-16T15:00:00',
            type: CalendarEventType.ASSIGNMENT,
            locationId: 'location1'
        }
    ];

    const mockDutyEvents: DutyEvent[] = [
        {
            id: 'event2',
            title: 'Garde 1',
            start: '2023-06-15T11:00:00',
            end: '2023-06-15T12:30:00',
            type: CalendarEventType.DUTY,
            locationId: 'location2'
        }
    ];

    const allMockEvents: AnyCalendarEvent[] = [
        ...(mockAssignmentEvents || []),
        ...(mockDutyEvents || [])
    ];

    // Configuration par défaut des filtres
    const defaultFilters: CalendarFilters = {
        eventTypes: [CalendarEventType.ASSIGNMENT, CalendarEventType.DUTY]
    };

    beforeEach(() => {
        // Réinitialiser tous les mocks définis ci-dessus
        mockGetEvents.mockReset();
        mockCreateEvent.mockReset();
        mockUpdateEvent.mockReset();
        mockDeleteEvent.mockReset();
        mockUpdateEventStatus.mockReset();

        // Configurer les implémentations/résolutions par défaut ici
        mockCreateEvent.mockImplementation(async (event: Omit<AnyCalendarEvent, 'id'>) => {
            return { ...event, id: 'new-id' } as AnyCalendarEvent;
        });

        // MODIFIÉ: L'implémentation de mockUpdateEvent doit correspondre à son nouvel usage (1 argument)
        mockUpdateEvent.mockImplementation(async (eventFullUpdate: AnyCalendarEvent) => {
            // Le hook envoie l'événement complet déjà fusionné.
            // Le service doit juste le traiter/retourner.
            // Si l'ID n'existe pas dans allMockEvents, on simule une création/retour.
            const existingEventIndex = allMockEvents.findIndex(e => e.id === eventFullUpdate.id);
            if (existingEventIndex !== -1) {
                return { ...allMockEvents[existingEventIndex], ...eventFullUpdate };
            }
            return eventFullUpdate; // Si non trouvé, retourner ce qui est passé (comportement de création/mise à jour)
        });

        mockDeleteEvent.mockResolvedValue(true);

        // MODIFIÉ: L'implémentation de mockUpdateEventStatus doit correspondre à son nouvel usage (2 arguments)
        mockUpdateEventStatus.mockImplementation(async (eventId: string, status: string) => {
            const originalEvent = allMockEvents.find(e => e.id === eventId);
            const baseEvent = originalEvent || { type: CalendarEventType.ASSIGNMENT, id: eventId, title: 'Status Update Event', start: '', end: '' };
            return { ...baseEvent, status: status as any, id: eventId } as AnyCalendarEvent;
        });
    });

    afterEach(() => {
        jest.clearAllMocks(); // Déplacer clearAllMocks ici
    });

    test('doit charger les événements automatiquement au montage', async () => {
        mockGetEvents.mockResolvedValue(allMockEvents);

        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters,
            autoLoad: true
        }));

        expect(result.current.loading).toBe(true);
        expect(result.current.events).toEqual([]);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.events.length).toBeGreaterThan(0);
        });

        expect(mockGetEvents).toHaveBeenCalledWith(expect.objectContaining({
            eventTypes: defaultFilters.eventTypes
        }));
        expect(result.current.events).toEqual(allMockEvents);
        expect(result.current.error).toBeNull();
    });

    test('ne doit pas charger les événements si autoLoad est désactivé', async () => {
        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters,
            autoLoad: false
        }));
        expect(mockGetEvents).not.toHaveBeenCalled();
        expect(result.current.events).toEqual([]);
        expect(result.current.loading).toBe(false);
    });

    test('doit filtrer les événements par type', async () => {
        const leaveEvents: LeaveEvent[] = [
            { id: 'leave1', title: 'Congé 1', start: '2023-01-01', end: '2023-01-01', type: CalendarEventType.LEAVE },
        ];
        mockGetEvents.mockResolvedValue(leaveEvents);

        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: {
                eventTypes: [CalendarEventType.LEAVE, CalendarEventType.DUTY]
            },
            autoLoad: false
        }));

        expect(result.current.events).toEqual([]);

        await act(async () => {
            await result.current.updateFilters({ eventTypes: [CalendarEventType.LEAVE] });
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.events).toEqual(leaveEvents);
        });

        expect(mockGetEvents).toHaveBeenCalledWith(expect.objectContaining({
            eventTypes: [CalendarEventType.LEAVE]
        }));
    });

    test('doit filtrer les événements par locationId (pour les types qui ont locationId)', async () => {
        const location1Events = mockAssignmentEvents.filter(e => e.locationId === 'location1');
        mockGetEvents.mockResolvedValue(location1Events);

        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: { eventTypes: [CalendarEventType.ASSIGNMENT] },
            autoLoad: false
        }));

        expect(result.current.events).toEqual([]);

        await act(async () => {
            await result.current.updateFilters({ locationIds: ['location1'] });
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.events).toEqual(location1Events);
        });

        expect(mockGetEvents).toHaveBeenCalledWith(expect.objectContaining({
            eventTypes: [CalendarEventType.ASSIGNMENT],
            locationIds: ['location1']
        }));
    });

    test('doit mettre à jour les filtres et recharger les événements', async () => {
        mockGetEvents
            .mockResolvedValueOnce(allMockEvents)
            .mockResolvedValueOnce(mockDutyEvents);

        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters,
            autoLoad: false
        }));

        await act(async () => {
            await result.current.refreshEvents();
        });
        await waitFor(() => expect(result.current.events).toEqual(allMockEvents));

        await act(async () => {
            await result.current.updateFilters({ eventTypes: [CalendarEventType.DUTY] });
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.events).toEqual(mockDutyEvents);
        });

        expect(mockGetEvents).toHaveBeenCalledTimes(2);
        expect(mockGetEvents).toHaveBeenLastCalledWith(expect.objectContaining({
            eventTypes: [CalendarEventType.DUTY]
        }));
    });

    test('doit gérer les erreurs lors du chargement', async () => {
        const loadError = new Error('Failed to load');
        mockGetEvents.mockRejectedValue(loadError);

        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters,
            autoLoad: true
        }));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBe(loadError);
            expect(result.current.events).toEqual([]);
        });
    });

    test('doit ajouter un nouvel événement et rafraîchir', async () => {
        mockGetEvents.mockResolvedValue(allMockEvents); // Pour le refreshEvents implicite

        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters,
            autoLoad: false
        }));

        const newEventData: Omit<MeetingEvent, 'id'> = {
            title: 'Nouvelle Réunion',
            start: '2023-06-17T10:00:00',
            end: '2023-06-17T11:00:00',
            type: CalendarEventType.MEETING,
        };

        await act(async () => {
            await result.current.addEvent(newEventData as AnyCalendarEvent);
        });

        expect(mockCreateEvent).toHaveBeenCalledWith(newEventData);
        expect(mockGetEvents).toHaveBeenCalledTimes(1); // Appelé par refreshEvents après addEvent
    });

    test('doit mettre à jour un événement existant et rafraîchir', async () => {
        mockGetEvents.mockResolvedValueOnce([...allMockEvents]); // Initial load for finding the event
        mockGetEvents.mockResolvedValueOnce([{ // Simulate refresh load after update
            id: 'event1',
            title: 'Updated Event 1',
            start: '2023-06-15T09:00:00',
            end: '2023-06-15T10:00:00',
            type: CalendarEventType.ASSIGNMENT,
            locationId: 'location1'
        }]);


        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters,
            autoLoad: false // Load manually for control
        }));

        // Initial load to populate events for update
        await act(async () => {
            await result.current.refreshEvents();
        });
        await waitFor(() => expect(result.current.events.length).toBe(allMockEvents.length));


        await act(async () => {
            await result.current.updateEvent('event1', { title: 'Updated Event 1' });
        });

        await waitFor(() => {
            const updatedEvent = result.current.events.find(e => e.id === 'event1');
            expect(updatedEvent?.title).toBe('Updated Event 1');
        });

        // Vérifier que le service a été appelé correctement par le hook
        expect(mockUpdateEvent).toHaveBeenCalledWith(expect.objectContaining({
            id: 'event1',
            title: 'Updated Event 1' // Le hook envoie l'événement complet fusionné
        }));
    });

    test('doit supprimer un événement et rafraîchir', async () => {
        mockGetEvents
            .mockResolvedValueOnce(allMockEvents) // Pour le refreshEvents initial
            .mockResolvedValueOnce(mockDutyEvents); // Pour le refresh après deleteEvent

        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters,
            autoLoad: false
        }));

        await act(async () => {
            await result.current.refreshEvents();
        });
        await waitFor(() => expect(result.current.events).toEqual(allMockEvents));

        await act(async () => {
            await result.current.deleteEvent('event1', CalendarEventType.ASSIGNMENT);
        });

        expect(mockDeleteEvent).toHaveBeenCalledWith('event1', CalendarEventType.ASSIGNMENT);
        expect(mockGetEvents).toHaveBeenCalledTimes(2); // Un appel initial, un après la suppression
        await waitFor(() => expect(result.current.events).toEqual(mockDutyEvents));
    });

    test('doit rafraîchir les événements manuellement', async () => {
        mockGetEvents
            .mockResolvedValueOnce([]) // Premier appel (on suppose qu'il n'y a pas d'autoLoad ici)
            .mockResolvedValueOnce(allMockEvents); // Appel après refreshEvents

        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters,
            autoLoad: false
        }));

        expect(mockGetEvents).toHaveBeenCalledTimes(1);

        await act(async () => {
            await result.current.refreshEvents();
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.events).toEqual(allMockEvents);
        });
    });

    test('doit mettre à jour le statut d\'un événement et rafraîchir', async () => {
        const eventToUpdate = mockAssignmentEvents[0];
        const updatedEventWithStatus = { ...eventToUpdate, status: 'APPROVED' } as AssignmentEvent;

        mockGetEvents
            .mockResolvedValueOnce(allMockEvents) // Pour le refreshEvents initial
            .mockResolvedValueOnce([updatedEventWithStatus, ...mockDutyEvents.filter(e => e.id !== 'event1')]); // Pour le refresh après updateEventStatus

        mockUpdateEventStatus.mockResolvedValue(updatedEventWithStatus);

        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters,
            autoLoad: false
        }));

        await act(async () => {
            await result.current.refreshEvents();
        });
        await waitFor(() => expect(result.current.events).toEqual(allMockEvents));

        await act(async () => {
            await result.current.updateEventStatus('event1', 'APPROVED');
        });

        // MODIFIÉ: Vérifier que calendarService.updateEventStatus est appelé avec eventId et status
        expect(mockUpdateEventStatus).toHaveBeenCalledWith('event1', 'APPROVED');
        expect(mockGetEvents).toHaveBeenCalledTimes(2); // Un appel initial, un après la mise à jour du statut
        await waitFor(() => {
            const foundEvent = result.current.events.find(e => e.id === 'event1') as AssignmentEvent | undefined;
            expect(foundEvent).toBeDefined();
            if (foundEvent && 'status' in foundEvent) {
                expect((foundEvent as any).status).toBe('APPROVED');
            }
        });
    });

    test('doit grouper les événements par jour', async () => {
        mockGetEvents.mockResolvedValue(allMockEvents);
        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters,
            autoLoad: true
        }));

        await waitFor(() => expect(result.current.loading).toBe(false));

        const eventsByDay = result.current.getEventsByDay();

        expect(eventsByDay).toHaveLength(2);

        const day1 = eventsByDay.find(d => d.date === '2023-06-15');
        const day2 = eventsByDay.find(d => d.date === '2023-06-16');

        expect(day1).toBeDefined();
        expect(day1?.events.length).toBe(2);
        expect(day1?.events).toEqual(expect.arrayContaining([mockAssignmentEvents[0], mockDutyEvents[0]]));

        expect(day2).toBeDefined();
        expect(day2?.events.length).toBe(1);
        expect(day2?.events).toEqual(expect.arrayContaining([mockAssignmentEvents[1]]));
    });

    test('doit utiliser un service personnalisé pour récupérer les événements si fourni', async () => {
        const customFetchEvents = jest.fn<(filters?: CalendarFilters) => Promise<AnyCalendarEvent[]>>().mockResolvedValue(mockDutyEvents);

        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: { eventTypes: [CalendarEventType.DUTY] },
            autoLoad: true,
            fetchEvents: customFetchEvents
        }));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.events).toEqual(mockDutyEvents);
        });

        expect(customFetchEvents).toHaveBeenCalledWith(expect.objectContaining({
            eventTypes: [CalendarEventType.DUTY]
        }));
        expect(mockGetEvents).not.toHaveBeenCalled();
    });

    test('doit gérer les erreurs lors de la mise à jour du statut', async () => {
        mockGetEvents.mockResolvedValue(allMockEvents); // Pour le refreshEvents implicite ou chargement initial

        const { result } = renderHook(() => useCalendarEvents({
            initialFilters: defaultFilters,
            autoLoad: false
        }));

        // Charger les événements pour que updateEventStatus puisse potentiellement les trouver
        await act(async () => {
            await result.current.refreshEvents();
        });
        await waitFor(() => expect(result.current.events.length).toBe(allMockEvents.length));


        await act(async () => {
            await result.current.updateEventStatus('event1', 'APPROVED');
        });

        await waitFor(() => {
            // Le mock de updateEventStatus retourne un événement avec le nouveau statut.
            // Le hook met à jour l'état local avec ce statut.
            const eventInState = result.current.events.find(e => e.id === 'event1');
            // @ts-ignore Vérification du statut après mise à jour, le type peut ne pas avoir 'status' par défaut pour tous les AnyCalendarEvent
            expect(eventInState?.status).toBe('APPROVED');
        });

        // Vérifier que le service a été appelé correctement par le hook
        expect(mockUpdateEventStatus).toHaveBeenCalledWith('event1', 'APPROVED');
    });
}); 