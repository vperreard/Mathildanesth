import { AnyCalendarEvent, CalendarEventType, ColorScheme } from '../types/event';
import { EventInput } from '@fullcalendar/core';

/**
 * Service de formatage des événements du calendrier
 * Convertit les événements de l'API au format FullCalendar
 */

// Schéma de couleurs par défaut
const DEFAULT_COLOR_SCHEME: ColorScheme = {
    leave: '#4299e1', // bleu
    duty: '#f6ad55', // orange
    onCall: '#9f7aea', // violet
    assignment: '#48bb78', // vert
    default: '#a0aec0', // gris
    textColor: '#2d3748', // gris foncé
    approved: '#48bb78', // vert
    pending: '#ecc94b', // jaune
    rejected: '#f56565', // rouge
};

/**
 * Formater un tableau d'événements pour FullCalendar
 * @param events Liste des événements à formater
 * @param colorScheme Schéma de couleurs à utiliser
 * @returns Liste des événements formatés pour FullCalendar
 */
export const formatEvents = (
    events: AnyCalendarEvent[],
    colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME
): EventInput[] => {
    return events.map(event => formatEvent(event, colorScheme));
};

/**
 * Formater un événement pour FullCalendar
 * @param event Événement à formater
 * @param colorScheme Schéma de couleurs à utiliser
 * @returns Événement formaté pour FullCalendar
 */
export const formatEvent = (
    event: AnyCalendarEvent,
    colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME
): EventInput => {
    return {
        id: event.id,
        title: formatEventTitle(event),
        start: event.start,
        end: event.end,
        allDay: event.allDay !== undefined ? event.allDay : true,
        backgroundColor: getEventBackgroundColor(event, colorScheme),
        borderColor: getEventBorderColor(event, colorScheme),
        textColor: colorScheme.textColor,
        extendedProps: {
            originalEvent: event,
            type: event.type,
            userId: event.userId,
            user: event.user,
            description: event.description,
            // Propriétés spécifiques selon le type d'événement
            ...(event.type === CalendarEventType.LEAVE && {
                leaveId: (event as any).leaveId,
                leaveType: (event as any).leaveType,
                status: (event as any).status,
                countedDays: (event as any).countedDays
            }),
            ...(event.type === CalendarEventType.DUTY && {
                dutyId: (event as any).dutyId,
                locationId: (event as any).locationId,
                locationName: (event as any).locationName
            }),
            ...(event.type === CalendarEventType.ON_CALL && {
                onCallId: (event as any).onCallId,
                locationId: (event as any).locationId,
                locationName: (event as any).locationName
            }),
            ...(event.type === CalendarEventType.ASSIGNMENT && {
                assignmentId: (event as any).assignmentId,
                locationId: (event as any).locationId,
                locationName: (event as any).locationName,
                teamId: (event as any).teamId,
                teamName: (event as any).teamName,
                specialtyId: (event as any).specialtyId,
                specialtyName: (event as any).specialtyName
            })
        }
    };
};

/**
 * Formater le titre d'un événement
 * @param event Événement dont on veut formater le titre
 * @returns Titre formaté
 */
export const formatEventTitle = (event: AnyCalendarEvent): string => {
    // Si l'événement a déjà un titre, le retourner
    if (event.title) return event.title;

    // Sinon, créer un titre en fonction du type d'événement
    switch (event.type) {
        case CalendarEventType.LEAVE:
            const leaveEvent = event as any;
            return `Congé${leaveEvent.leaveType ? ` - ${leaveEvent.leaveType}` : ''}`;
        case CalendarEventType.DUTY:
            const dutyEvent = event as any;
            return `Garde${dutyEvent.locationName ? ` - ${dutyEvent.locationName}` : ''}`;
        case CalendarEventType.ON_CALL:
            const onCallEvent = event as any;
            return `Astreinte${onCallEvent.locationName ? ` - ${onCallEvent.locationName}` : ''}`;
        case CalendarEventType.ASSIGNMENT:
            const assignmentEvent = event as any;
            return `Affectation${assignmentEvent.specialtyName ? ` - ${assignmentEvent.specialtyName}` : ''}`;
        default:
            return 'Événement';
    }
};

/**
 * Obtenir la couleur de fond d'un événement
 * @param event Événement
 * @param colorScheme Schéma de couleurs
 * @returns Couleur de fond
 */
export const getEventBackgroundColor = (
    event: AnyCalendarEvent,
    colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME
): string => {
    switch (event.type) {
        case CalendarEventType.LEAVE:
            return colorScheme.leave;
        case CalendarEventType.DUTY:
            return colorScheme.duty;
        case CalendarEventType.ON_CALL:
            return colorScheme.onCall;
        case CalendarEventType.ASSIGNMENT:
            return colorScheme.assignment;
        default:
            return colorScheme.default;
    }
};

/**
 * Obtenir la couleur de bordure d'un événement
 * @param event Événement
 * @param colorScheme Schéma de couleurs
 * @returns Couleur de bordure
 */
export const getEventBorderColor = (
    event: AnyCalendarEvent,
    colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME
): string => {
    // Pour les congés, la bordure dépend du statut
    if (event.type === CalendarEventType.LEAVE) {
        const leaveEvent = event as any;
        switch (leaveEvent.status) {
            case 'APPROVED':
                return colorScheme.approved;
            case 'PENDING':
                return colorScheme.pending;
            case 'REJECTED':
                return colorScheme.rejected;
            default:
                return getEventBackgroundColor(event, colorScheme);
        }
    }

    // Pour les autres types d'événements, la bordure est de la même couleur que le fond
    return getEventBackgroundColor(event, colorScheme);
};

/**
 * Personnaliser l'affichage d'un événement pour FullCalendar
 * @param info Informations sur l'événement
 * @returns Élément HTML personnalisé
 */
export const customEventRender = (info: any): HTMLElement => {
    const { event, view } = info;
    const originalEvent = event.extendedProps.originalEvent;
    const type = originalEvent.type;
    const status = originalEvent.status;

    // Créer un élément conteneur
    const container = document.createElement('div');
    container.className = 'calendar-event';

    // Ajouter une classe spécifique au type d'événement
    container.classList.add(`event-type-${type.toLowerCase()}`);

    // Ajouter une classe spécifique au statut pour les congés
    if (type === CalendarEventType.LEAVE && status) {
        container.classList.add(`event-status-${status.toLowerCase()}`);
    }

    // Contenu différent selon la vue
    if (view.type === 'listWeek') {
        // Vue liste
        const indicator = document.createElement('div');
        indicator.className = 'event-list-indicator';
        indicator.style.backgroundColor = event.backgroundColor;

        const content = document.createElement('div');
        content.className = 'event-list-content';

        const title = document.createElement('span');
        title.className = 'event-title';
        title.textContent = event.title;
        content.appendChild(title);

        // Afficher l'utilisateur si présent
        if (originalEvent.user) {
            const userElement = document.createElement('span');
            userElement.className = 'event-user';
            userElement.textContent = `${originalEvent.user.prenom} ${originalEvent.user.nom}`;
            content.appendChild(userElement);
        }

        container.appendChild(indicator);
        container.appendChild(content);

        // Ajouter une icône de statut pour les congés
        if (type === CalendarEventType.LEAVE && status) {
            const statusIcon = document.createElement('span');
            statusIcon.className = 'event-status-icon';

            switch (status) {
                case 'APPROVED':
                    statusIcon.textContent = '✓';
                    break;
                case 'PENDING':
                    statusIcon.textContent = '⧖';
                    break;
                case 'REJECTED':
                    statusIcon.textContent = '✕';
                    break;
                case 'CANCELLED':
                    statusIcon.textContent = '⊘';
                    break;
            }

            container.appendChild(statusIcon);
        }
    } else {
        // Vue grille (mois, semaine, jour)
        const content = document.createElement('div');
        content.className = 'event-grid-content';

        const title = document.createElement('div');
        title.className = 'event-title';
        title.textContent = event.title;
        content.appendChild(title);

        // Afficher l'utilisateur si présent
        if (originalEvent.user) {
            const userElement = document.createElement('div');
            userElement.className = 'event-user';
            userElement.textContent = `${originalEvent.user.prenom} ${originalEvent.user.nom}`;
            content.appendChild(userElement);
        }

        container.appendChild(content);

        // Ajouter une icône de statut pour les congés
        if (type === CalendarEventType.LEAVE && status) {
            const statusIcon = document.createElement('span');
            statusIcon.className = 'event-status-icon';

            switch (status) {
                case 'APPROVED':
                    statusIcon.textContent = '✓';
                    break;
                case 'PENDING':
                    statusIcon.textContent = '⧖';
                    break;
                case 'REJECTED':
                    statusIcon.textContent = '✕';
                    break;
                case 'CANCELLED':
                    statusIcon.textContent = '⊘';
                    break;
            }

            container.appendChild(statusIcon);
        }
    }

    return container;
}; 