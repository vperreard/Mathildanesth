import { AnyCalendarEvent, CalendarFilters, ExportOptions } from '../types/event';

// Récupérer tous les événements du calendrier avec filtrage
export const fetchCalendarEvents = async (filters: CalendarFilters): Promise<AnyCalendarEvent[]> => {
    try {
        // Construire l'URL avec les paramètres de filtrage
        const url = new URL('/api/calendar', window.location.origin);

        // Ajouter les types d'événements
        if (filters.eventTypes.length > 0) {
            filters.eventTypes.forEach(type => {
                url.searchParams.append('eventTypes', type);
            });
        }

        // Ajouter les utilisateurs
        if (filters.userIds && filters.userIds.length > 0) {
            filters.userIds.forEach(id => {
                url.searchParams.append('userIds', id);
            });
        }

        // Ajouter les rôles d'utilisateurs
        if (filters.userRoles && filters.userRoles.length > 0) {
            filters.userRoles.forEach(role => {
                url.searchParams.append('userRoles', role);
            });
        }

        // Ajouter les types de congés
        if (filters.leaveTypes && filters.leaveTypes.length > 0) {
            filters.leaveTypes.forEach(type => {
                url.searchParams.append('leaveTypes', type);
            });
        }

        // Ajouter les statuts de congés
        if (filters.leaveStatuses && filters.leaveStatuses.length > 0) {
            filters.leaveStatuses.forEach(status => {
                url.searchParams.append('leaveStatuses', status);
            });
        }

        // Ajouter les lieux
        if (filters.locationIds && filters.locationIds.length > 0) {
            filters.locationIds.forEach(id => {
                url.searchParams.append('locationIds', id);
            });
        }

        // Ajouter les équipes
        if (filters.teamIds && filters.teamIds.length > 0) {
            filters.teamIds.forEach(id => {
                url.searchParams.append('teamIds', id);
            });
        }

        // Ajouter les spécialités
        if (filters.specialtyIds && filters.specialtyIds.length > 0) {
            filters.specialtyIds.forEach(id => {
                url.searchParams.append('specialtyIds', id);
            });
        }

        // Ajouter le terme de recherche
        if (filters.searchTerm) {
            url.searchParams.append('searchTerm', filters.searchTerm);
        }

        // Ajouter les dates
        if (filters.dateRange) {
            url.searchParams.append('startDate', filters.dateRange.start.toISOString());
            url.searchParams.append('endDate', filters.dateRange.end.toISOString());
        }

        // Faire la requête
        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`Erreur lors de la récupération des événements: ${response.statusText}`);
        }

        // Récupérer et retourner les données
        const events: AnyCalendarEvent[] = await response.json();
        return events;
    } catch (error) {
        console.error('Erreur dans fetchCalendarEvents:', error);
        throw error;
    }
};

// Exporter les événements du calendrier
export const exportCalendarEvents = async (options: ExportOptions): Promise<Blob> => {
    try {
        // Faire la requête d'export
        const response = await fetch('/api/calendar/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(options),
        });

        if (!response.ok) {
            throw new Error(`Erreur lors de l'export: ${response.statusText}`);
        }

        // Récupérer le blob du fichier
        const blob = await response.blob();
        return blob;
    } catch (error) {
        console.error('Erreur dans exportCalendarEvents:', error);
        throw error;
    }
};

// Télécharger le blob généré
export const downloadBlob = (blob: Blob, fileName: string): void => {
    // Créer un lien temporaire pour le téléchargement
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;

    // Ajouter, cliquer et supprimer le lien
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Libérer l'URL
    window.URL.revokeObjectURL(url);
}; 