import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnyCalendarEvent, CalendarEventType } from '../types/event';
import axios from 'axios';

interface CalendarQueryParams {
    startDate: Date;
    endDate: Date;
    eventTypes?: CalendarEventType[];
    userIds?: string[];
}

export const useCalendarQuery = (params: CalendarQueryParams) => {
    const queryClient = useQueryClient();

    // Clé de cache pour les événements du calendrier
    const queryKey = ['calendar-events', params];

    // Requête pour récupérer les événements
    const { data: events = [], isLoading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            const response = await axios.get('http://localhost:3000/api/calendrier/events', { params });
            return response.data as AnyCalendarEvent[];
        },
        staleTime: 5 * 60 * 1000, // Les données sont considérées comme fraîches pendant 5 minutes
        cacheTime: 30 * 60 * 1000, // Le cache est conservé pendant 30 minutes
    });

    // Mutation pour mettre à jour un événement
    const updateEventMutation = useMutation({
        mutationFn: async (event: AnyCalendarEvent) => {
            const response = await axios.put(`http://localhost:3000/api/calendrier/events/${event.id}`, event);
            return response.data;
        },
        onSuccess: () => {
            // Invalider le cache pour forcer un rechargement
            queryClient.invalidateQueries({ queryKey });
        },
    });

    // Mutation pour créer un événement
    const createEventMutation = useMutation({
        mutationFn: async (event: Omit<AnyCalendarEvent, 'id'>) => {
            const response = await axios.post('http://localhost:3000/api/calendrier/events', event);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    // Mutation pour supprimer un événement
    const deleteEventMutation = useMutation({
        mutationFn: async (eventId: string) => {
            await axios.delete(`http://localhost:3000/api/calendrier/events/${eventId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    return {
        events,
        isLoading,
        error,
        updateEvent: updateEventMutation.mutate,
        createEvent: createEventMutation.mutate,
        deleteEvent: deleteEventMutation.mutate,
    };
}; 