import axios from 'axios';
import { logger } from "../../../lib/logger";
import { CONFIG } from '@/config';
import { CalendarFilters, AnyCalendarEvent, CalendarEventType, BaseCalendarEvent } from '../types/event';

/**
 * Service de gestion des événements de calendrier
 * Centralise les appels API et la logique métier liée au calendrier
 */
class CalendarService {
    private readonly baseUrl = `${CONFIG.API_BASE_URL}/api/calendrier`;

    /**
     * Récupère les événements du calendrier selon les filtres spécifiés
     */
    async getEvents(filters: CalendarFilters): Promise<AnyCalendarEvent[]> {
        try {
            const queryParams = this.buildQueryParams(filters);
            const response = await axios.get(`${this.baseUrl}/events${queryParams}`);
            return this.normalizeEvents(response.data);
        } catch (error) {
            logger.error('Erreur lors de la récupération des événements:', error);
            // Renvoyer une erreur plus spécifique ou logger différemment
            throw new Error('Impossible de récupérer les événements du calendrier');
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
            logger.error('Erreur lors de la récupération de l\'événement:', error);
            throw new Error('Impossible de récupérer l\'événement demandé');
        }
    }

    /**
     * Met à jour un événement existant
     */
    async updateEvent(event: AnyCalendarEvent): Promise<AnyCalendarEvent> {
        try {
            const formattedEvent = this.formatEventForApi(event);
            const response = await axios.put(`${this.baseUrl}/events/${event.id}?type=${event.type}`, formattedEvent);
            const [normalizedEvent] = this.normalizeEvents([response.data]);
            return normalizedEvent;
        } catch (error) {
            logger.error('Erreur lors de la mise à jour de l\'événement:', error);
            throw new Error('Impossible de mettre à jour l\'événement');
        }
    }

    /**
     * Crée un nouvel événement
     */
    async createEvent(event: Omit<AnyCalendarEvent, 'id'>): Promise<AnyCalendarEvent> {
        try {
            const formattedEvent = this.formatEventForApi(event);
            const response = await axios.post(`${this.baseUrl}/events`, formattedEvent);
            const [normalizedEvent] = this.normalizeEvents([response.data]);
            return normalizedEvent;
        } catch (error) {
            logger.error('Erreur lors de la création de l\'événement:', error);
            throw new Error('Impossible de créer l\'événement');
        }
    }

    /**
     * Supprime un événement
     */
    async deleteEvent(eventId: string, eventType: CalendarEventType): Promise<void> {
        try {
            await axios.delete(`${this.baseUrl}/events/${eventId}?type=${eventType}`);
        } catch (error) {
            logger.error('Erreur lors de la suppression de l\'événement:', error);
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
        const fieldsToOmit = ['formattedTitle', 'formattedDescription', 'color', 'createdAt', 'updatedAt']; // Ajouter createdAt/updatedAt
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
    async updateEventStatus(eventId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED', eventType: CalendarEventType): Promise<AnyCalendarEvent> {
        try {
            const response = await axios.patch(`${this.baseUrl}/events/${eventId}/status?type=${eventType}`, { status });
            const [normalizedEvent] = this.normalizeEvents([response.data]);
            return normalizedEvent;
        } catch (error) {
            logger.error('Erreur lors de la mise à jour du statut de l\'événement:', error);
            throw new Error('Impossible de mettre à jour le statut de l\'événement');
        }
    }
}

// Exporter une instance unique du service
export const calendarService = new CalendarService(); 