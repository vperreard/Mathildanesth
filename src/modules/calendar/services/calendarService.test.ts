import axios from 'axios';
import { calendarService } from './calendrierService';
import { CalendarEventType, CalendarFilters } from '../types/event';

// Mock d'axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CalendarService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Données de test
    const mockEvent = {
        id: '1',
        title: 'Événement test',
        description: 'Description de test',
        start: '2023-07-15T09:00:00.000Z',
        end: '2023-07-15T17:00:00.000Z',
        type: CalendarEventType.ASSIGNMENT,
        locationId: 'loc123',
        locationName: 'Hôpital Central'
    };

    const mockFilters: CalendarFilters = {
        eventTypes: [CalendarEventType.ASSIGNMENT, CalendarEventType.DUTY],
        userIds: ['user1', 'user2'],
        dateRange: {
            start: new Date('2023-07-01'),
            end: new Date('2023-07-31')
        }
    };

    describe('getEvents', () => {
        test('récupère les événements avec les filtres corrects', async () => {
            // Configuration du mock
            mockedAxios.get.mockResolvedValueOnce({
                data: [mockEvent]
            });

            // Appel au service
            const result = await calendarService.getEvents(mockFilters);

            // Vérifications
            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.stringContaining('/api/calendrier/events?')
            );
            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.stringContaining('eventTypes=ASSIGNMENT')
            );
            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.stringContaining('eventTypes=DUTY')
            );
            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.stringContaining('userIds=user1')
            );
            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.stringContaining('userIds=user2')
            );
            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.stringContaining('startDate=')
            );
            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.stringContaining('endDate=')
            );

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('1');
            expect(result[0].title).toBe('Événement test');
            expect(result[0].type).toBe(CalendarEventType.ASSIGNMENT);
        });

        test('gère les erreurs correctement', async () => {
            // Configuration du mock pour simuler une erreur
            mockedAxios.get.mockRejectedValueOnce(new Error('Erreur réseau'));

            // Appel au service et vérification de l'erreur
            await expect(calendarService.getEvents(mockFilters)).rejects.toThrow(
                'Impossible de récupérer les événements du calendrier'
            );
        });
    });

    describe('getEventById', () => {
        test('récupère un événement par son ID', async () => {
            // Configuration du mock
            mockedAxios.get.mockResolvedValueOnce({
                data: mockEvent
            });

            // Appel au service
            const result = await calendarService.getEventById('1', CalendarEventType.ASSIGNMENT);

            // Vérifications
            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.stringContaining('/api/calendrier/events/1?type=ASSIGNMENT')
            );
            expect(result.id).toBe('1');
            expect(result.title).toBe('Événement test');
        });
    });

    describe('updateEvent', () => {
        test('met à jour un événement existant', async () => {
            // Configuration du mock
            mockedAxios.put.mockResolvedValueOnce({
                data: { ...mockEvent, title: 'Événement modifié' }
            });

            // Appel au service
            const result = await calendarService.updateEvent({
                ...mockEvent,
                title: 'Événement modifié'
            });

            // Vérifications
            expect(mockedAxios.put).toHaveBeenCalledWith(
                expect.stringContaining('/api/calendrier/events/1'),
                expect.objectContaining({
                    title: 'Événement modifié'
                })
            );
            expect(result.title).toBe('Événement modifié');
        });
    });

    describe('createEvent', () => {
        test('crée un nouvel événement', async () => {
            // Événement sans ID pour la création
            const newEvent = {
                title: 'Nouvel événement',
                description: 'Description du nouvel événement',
                start: '2023-08-01T10:00:00.000Z',
                end: '2023-08-01T12:00:00.000Z',
                type: CalendarEventType.MEETING
            };

            // Configuration du mock
            mockedAxios.post.mockResolvedValueOnce({
                data: { ...newEvent, id: '2' }
            });

            // Appel au service
            const result = await calendarService.createEvent(newEvent);

            // Vérifications
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.stringContaining('/api/calendrier/events'),
                expect.objectContaining({
                    title: 'Nouvel événement'
                })
            );
            expect(result.id).toBe('2');
            expect(result.title).toBe('Nouvel événement');
            expect(result.type).toBe(CalendarEventType.MEETING);
        });
    });

    describe('deleteEvent', () => {
        test('supprime un événement', async () => {
            // Configuration du mock
            mockedAxios.delete.mockResolvedValueOnce({});

            // Appel au service
            await calendarService.deleteEvent('1', CalendarEventType.ASSIGNMENT);

            // Vérifications
            expect(mockedAxios.delete).toHaveBeenCalledWith(
                expect.stringContaining('/api/calendrier/events/1?type=ASSIGNMENT')
            );
        });
    });
}); 