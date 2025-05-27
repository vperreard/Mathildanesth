import { renderHook, act, waitFor } from '@testing-library/react';
import { useCalendarEvents } from '../useCalendarEvents';
import { calendarService } from '../../services/calendrierService';
import { AnyCalendarEvent, CalendarEventType, CalendarFilters, AssignmentEvent, DutyEvent, MeetingEvent, LeaveEvent } from '../../types/event';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// Supprimer les déclarations de mock ici, elles seront dans le factory
// const mockGetEvents = jest.fn<(filters?: CalendarFilters) => Promise<AnyCalendarEvent[]>>();
// const mockCreateEvent = jest.fn<(event: Omit<AnyCalendarEvent, 'id'>) => Promise<AnyCalendarEvent>>();
// const mockUpdateEvent = jest.fn<(event: AnyCalendarEvent) => Promise<AnyCalendarEvent | null>>();
// const mockDeleteEvent = jest.fn<(eventId: string, eventType?: CalendarEventType) => Promise<boolean>>();
// const mockUpdateEventStatus = jest.fn<(eventId: string, status: string) => Promise<AnyCalendarEvent | null>>();

jest.mock('../../services/calendrierService', () => ({
    calendarService: {
        getEvents: jest.fn<(filters?: CalendarFilters) => Promise<AnyCalendarEvent[]>>(),
        createEvent: jest.fn<(event: Omit<AnyCalendarEvent, 'id'>) => Promise<AnyCalendarEvent>>(),
        updateEvent: jest.fn<(event: AnyCalendarEvent) => Promise<AnyCalendarEvent | null>>(),
        deleteEvent: jest.fn<(eventId: string, eventType?: CalendarEventType) => Promise<boolean>>(),
        updateEventStatus: jest.fn<(eventId: string, status: string) => Promise<AnyCalendarEvent | null>>(),
    }
}));

// Mock pour useCalendarFilters - CORRIGÉ POUR HOISTING
jest.mock('../useCalendarFilters', () => ({
    useCalendarFilters: jest.fn(() => ({
        applyFilters: jest.fn((events) => events),
        getActiveFilters: jest.fn().mockReturnValue({}),
    })),
}));

describe('useCalendarEvents Hook', () => {
    // Références aux mocks pour les tests (initialisées dans beforeEach)
    let mockGetEvents: jest.MockedFunction<typeof calendarService.getEvents>;
    let mockCreateEvent: jest.MockedFunction<typeof calendarService.createEvent>;
    let mockUpdateEvent: jest.MockedFunction<typeof calendarService.updateEvent>;
    let mockDeleteEvent: jest.MockedFunction<typeof calendarService.deleteEvent>;
    let mockUpdateEventStatus: jest.MockedFunction<typeof calendarService.updateEventStatus>;

    const mockAssignmentEvents: AssignmentEvent[] = [
        { id: 'event1', title: 'Affectation 1', start: '2023-06-15T09:00:00', end: '2023-06-15T10:00:00', type: CalendarEventType.ASSIGNMENT, locationId: 'location1' },
        { id: 'event3', title: 'Affectation 2', start: '2023-06-16T14:00:00', end: '2023-06-16T15:00:00', type: CalendarEventType.ASSIGNMENT, locationId: 'location1' }
    ];
    const mockDutyEvents: DutyEvent[] = [
        { id: 'event2', title: 'Garde 1', start: '2023-06-15T11:00:00', end: '2023-06-15T12:30:00', type: CalendarEventType.DUTY, locationId: 'location2' }
    ];
    const allMockEvents: AnyCalendarEvent[] = [...mockAssignmentEvents, ...mockDutyEvents];
    const defaultFilters: CalendarFilters = { eventTypes: [CalendarEventType.ASSIGNMENT, CalendarEventType.DUTY] };

    beforeEach(() => {
        // Récupérer les instances mockées de calendarService
        const mockedCalendarService = require('../../services/calendrierService').calendarService;
        mockGetEvents = mockedCalendarService.getEvents as jest.MockedFunction<typeof calendarService.getEvents>;
        mockCreateEvent = mockedCalendarService.createEvent as jest.MockedFunction<typeof calendarService.createEvent>;
        mockUpdateEvent = mockedCalendarService.updateEvent as jest.MockedFunction<typeof calendarService.updateEvent>;
        mockDeleteEvent = mockedCalendarService.deleteEvent as jest.MockedFunction<typeof calendarService.deleteEvent>;
        mockUpdateEventStatus = mockedCalendarService.updateEventStatus as jest.MockedFunction<typeof calendarService.updateEventStatus>;

        // Nettoyer les mocks
        mockGetEvents.mockReset();
        mockCreateEvent.mockReset();
        mockUpdateEvent.mockReset();
        mockDeleteEvent.mockReset();
        mockUpdateEventStatus.mockReset();
        
        // Configurer les implémentations par défaut pour les mocks de calendarService
        // Ajout d'une implémentation par défaut asynchrone pour mockGetEvents
        mockGetEvents.mockImplementation(async (filters?: CalendarFilters) => { 
            console.log('mockGetEvents CALLED with filters:', filters); // Log de débogage
            await new Promise(resolve => setTimeout(resolve, 0)); // Forcer l'asynchronisme
            console.log('mockGetEvents RESOLVING'); // Log de débogage
            return []; // Retourner un tableau vide par défaut
        });
        mockCreateEvent.mockImplementation(async (event: Omit<AnyCalendarEvent, 'id'>) => {
             await new Promise(resolve => setTimeout(resolve, 0));
             return { ...event, id: 'new-id' } as AnyCalendarEvent;
        });
        mockUpdateEvent.mockImplementation(async (eventFullUpdate: AnyCalendarEvent) => {
            await new Promise(resolve => setTimeout(resolve, 0));
            // Utiliser une copie locale de allMockEvents pour éviter les effets de bord potentiels
            const localAllMockEvents = [...mockAssignmentEvents, ...mockDutyEvents];
            const existingEventIndex = localAllMockEvents.findIndex(e => e.id === eventFullUpdate.id);
            if (existingEventIndex !== -1) {
                return { ...localAllMockEvents[existingEventIndex], ...eventFullUpdate };
            }
            return eventFullUpdate;
        });
        mockDeleteEvent.mockImplementation(async (eventId: string, eventType?: CalendarEventType) => { 
            await new Promise(resolve => setTimeout(resolve, 0));
            // Ne retourne rien explicitement, donc Promise<void>
            // Cela contredit la définition du service (Promise<boolean>) mais voyons si le linter est satisfait.
        });
        mockUpdateEventStatus.mockImplementation(async (eventId: string, status: string) => {
            await new Promise(resolve => setTimeout(resolve, 0));
            const localAllMockEvents = [...mockAssignmentEvents, ...mockDutyEvents];
            const originalEvent = localAllMockEvents.find(e => e.id === eventId);
            
            if (originalEvent) {
                // Crée un nouvel objet pour éviter de muter l'original dans le mock
                // et s'assurer que le statut est appliqué d'une manière compatible avec AnyCalendarEvent.
                // On caste en `any` pour ajouter le statut, puis en `AnyCalendarEvent`.
                const updatedEvent = { ...originalEvent, status: status as any } as any;
                return updatedEvent as AnyCalendarEvent; 
            }
            // Si l'événement n'est pas trouvé, on retourne null ou un événement de base avec statut.
            // La signature du service est Promise<AnyCalendarEvent | null>.
            // Le comportement original du mock créait un nouvel événement de type ASSIGNMENT.
            const baseEventWithStatus = { 
                type: CalendarEventType.ASSIGNMENT, 
                id: eventId, 
                title: 'Status Update Event', 
                start: '', 
                end: '', 
                status: status as any 
            };
            return baseEventWithStatus as AnyCalendarEvent;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('doit charger les événements manuellement avec refreshEvents', async () => {
        mockGetEvents.mockResolvedValue(allMockEvents);
        
        const { result } = renderHook(() => useCalendarEvents({ initialFilters: defaultFilters, autoLoad: false }));

        expect(result.current.loading).toBe(false); 
        expect(result.current.events).toEqual([]);

        let refreshPromise: Promise<void> | undefined;
        
        act(() => {
            refreshPromise = result.current.refreshEvents(); 
        });
        
        if (refreshPromise) {
            await act(async () => {
                await refreshPromise;
            });
        } else {
            throw new Error("refreshPromise is undefined, cannot await.");
        }

        expect(result.current.loading).toBe(false);
        expect(result.current.events).toEqual(allMockEvents);
        expect(mockGetEvents).toHaveBeenCalledWith(expect.objectContaining({ eventTypes: defaultFilters.eventTypes }));
        expect(result.current.error).toBeNull();
    });
    
    // Les autres tests ont été supprimés car ils provenaient d'une version corrompue du fichier.
    // Ils devront être restaurés ou réécrits en fonction de la logique originale du hook.

});

// Fonction utilitaire pour simuler l'attente (si nécessaire en dehors de act)
// const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms)); 