import axios from 'axios';
import { CONFIG } from '@/config';
import { CalendarFilters, AnyCalendarEvent, CalendarEventType, BaseCalendarEvent } from '../types/event';

/**
 * Service de gestion des événements de calendrier
 * Centralise les appels API et la logique métier liée au calendrier
 */
class CalendarService {
    private readonly baseUrl = `${CONFIG.API_BASE_URL}/api/calendar`;

    /**
     * Récupère les événements du calendrier selon les filtres spécifiés
     */
    async getEvents(filters: CalendarFilters): Promise<AnyCalendarEvent[]> {
        try {
            // Dans une vraie implémentation, on ferait un appel API
            // Simuler un délai
            await new Promise(resolve => setTimeout(resolve, 100));

            // Renvoyer des données simulées
            return [
                {
                    id: 'event1',
                    title: 'Congé annuel',
                    start: '2023-06-01',
                    end: '2023-06-05',
                    type: CalendarEventType.LEAVE,
                    userId: 'user1',
                    allDay: true
                },
                {
                    id: 'event2',
                    title: 'Garde',
                    start: '2023-06-10',
                    end: '2023-06-11',
                    type: CalendarEventType.DUTY,
                    userId: 'user1',
                    allDay: true
                },
                {
                    id: 'event3',
                    title: 'Formation',
                    start: '2023-06-15',
                    end: '2023-06-16',
                    type: CalendarEventType.TRAINING,
                    userId: 'user2',
                    allDay: true
                }
            ] as AnyCalendarEvent[];
        } catch (error) {
            console.error('Erreur lors de la récupération des événements:', error);
            throw error;
        }
    }

    /**
     * Récupère un événement spécifique par son ID
     */
    async getEventById(eventId: string, eventType?: CalendarEventType): Promise<AnyCalendarEvent> {
        try {
            const typeParam = eventType ? `?type=${eventType}` : '';
            const response = await axios.get(`${this.baseUrl}/events/${eventId}${typeParam}`);
            const [normalizedEvent] = this.normalizeEvents([response.data]);
            return normalizedEvent;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'événement:', error);
            throw new Error('Impossible de récupérer l\'événement demandé');
        }
    }

    /**
     * Met à jour un événement existant
     */
    async updateEvent(event: AnyCalendarEvent): Promise<AnyCalendarEvent> {
        try {
            // Dans une vraie implémentation, on ferait un appel API
            // Simuler un délai
            await new Promise(resolve => setTimeout(resolve, 100));

            // Simuler une mise à jour
            return event;
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'événement:', error);
            throw error;
        }
    }

    /**
     * Crée un nouvel événement
     */
    async createEvent(event: Omit<AnyCalendarEvent, 'id'>): Promise<AnyCalendarEvent> {
        try {
            // Dans une vraie implémentation, on ferait un appel API
            // Simuler un délai
            await new Promise(resolve => setTimeout(resolve, 100));

            // Simuler une création
            const newId = `event-${Date.now()}`;
            return {
                ...event,
                id: newId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            } as AnyCalendarEvent;
        } catch (error) {
            console.error('Erreur lors de la création de l\'événement:', error);
            throw error;
        }
    }

    /**
     * Supprime un événement
     */
    async deleteEvent(eventId: string, eventType: CalendarEventType): Promise<void> {
        try {
            await axios.delete(`${this.baseUrl}/events/${eventId}?type=${eventType}`);
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'événement:', error);
            throw new Error('Impossible de supprimer l\'événement');
        }
    }

    /**
     * Construit les paramètres de requête à partir des filtres
     */
    private buildQueryParams(filters: CalendarFilters): string {
        const {
            eventTypes,
            userIds,
            teamIds,
            locationIds,
            userRoles,
            specialtyIds,
            dateRange,
        } = filters;

        const params = new URLSearchParams();

        // Ajouter chaque filtre aux paramètres de requête s'il est défini
        if (eventTypes?.length) {
            eventTypes.forEach(type => params.append('eventTypes', type));
        }

        if (userIds?.length) {
            userIds.forEach(id => params.append('userIds', id));
        }

        if (teamIds?.length) {
            teamIds.forEach(id => params.append('teamIds', id));
        }

        if (locationIds?.length) {
            locationIds.forEach(id => params.append('locationIds', id));
        }

        if (userRoles?.length) {
            userRoles.forEach(role => params.append('userRoles', role));
        }

        if (specialtyIds?.length) {
            specialtyIds.forEach(id => params.append('specialtyIds', id));
        }

        if (dateRange) {
            params.append('startDate', dateRange.start.toISOString());
            params.append('endDate', dateRange.end.toISOString());
        }

        const queryString = params.toString();
        return queryString ? `?${queryString}` : '';
    }

    /**
     * Normalise les événements reçus de l'API pour assurer un format cohérent
     */
    private normalizeEvents(events: any[]): AnyCalendarEvent[] {
        return events.map(event => ({
            ...event,
            // Convertir les dates en objets Date pour traitement interne
            // Mais conserver les chaînes ISO pour l'interface AnyCalendarEvent
            start: event.start,
            end: event.end,
            // S'assurer que l'ID est au bon format
            id: String(event.id)
        }));
    }

    /**
     * Formate un événement pour l'API en fonction de son type
     */
    private formatEventForApi(event: Partial<AnyCalendarEvent>): any {
        // Format de base
        const formattedEvent: Record<string, any> = { ...event };

        // Suppression des champs calculés qui ne doivent pas être envoyés à l'API
        const fieldsToOmit = ['formattedTitle', 'formattedDescription', 'color'];
        fieldsToOmit.forEach(field => {
            if (field in formattedEvent) {
                delete formattedEvent[field];
            }
        });

        return formattedEvent;
    }

    /**
     * Met à jour le statut d'un événement
     * @param eventId ID de l'événement à mettre à jour
     * @param status Nouveau statut
     * @returns Événement mis à jour
     */
    async updateEventStatus(eventId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<AnyCalendarEvent> {
        try {
            // Dans une vraie implémentation, on ferait un appel API
            // Simuler un délai
            await new Promise(resolve => setTimeout(resolve, 100));

            // Simuler une mise à jour de statut
            return {
                id: eventId,
                title: 'Événement mis à jour',
                start: '2023-06-01',
                end: '2023-06-05',
                type: CalendarEventType.LEAVE,
                userId: 'user1',
                status: status,
                allDay: true,
                updatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut de l\'événement:', error);
            throw error;
        }
    }
}

// Exporter une instance unique du service
export const calendarService = new CalendarService(); 