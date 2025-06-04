import React from 'react';
import { CalendarEventType } from '../../types/event';
import { EventContentArg } from '@fullcalendar/core';

interface EventInfo {
    eventInfo: EventContentArg;
}

export const EventRenderer: React.FC<EventInfo> = ({ eventInfo }) => {
    const { event, view } = eventInfo;
    const { title, extendedProps } = event;
    const { type, status, user } = extendedProps;

    // Nom d'utilisateur formaté si disponible
    const userName = user ? `${user.prenom} ${user.nom}` : '';

    // Classes CSS en fonction du type d'événement et du statut
    let statusClass = '';
    let statusIcon = '';

    if (status) {
        switch (status) {
            case 'APPROVED':
                statusClass = 'event-approved';
                statusIcon = '✓';
                break;
            case 'PENDING':
                statusClass = 'event-pending';
                statusIcon = '⧖';
                break;
            case 'REJECTED':
                statusClass = 'event-rejected';
                statusIcon = '✕';
                break;
            case 'CANCELLED':
                statusClass = 'event-cancelled';
                statusIcon = '⊘';
                break;
            default:
                statusClass = '';
        }
    }

    // Classes CSS basées sur le type d'événement
    let typeClass = '';

    switch (type) {
        case CalendarEventType.LEAVE:
            typeClass = 'event-leave';
            break;
        case CalendarEventType.DUTY:
            typeClass = 'event-duty';
            break;
        case CalendarEventType.ON_CALL:
            typeClass = 'event-oncall';
            break;
        case CalendarEventType.ASSIGNMENT:
            typeClass = 'event-attribution';
            break;
        default:
            typeClass = '';
    }

    // Contenu différent selon la vue
    if (view.type === 'listWeek' || view.type === 'listMonth') {
        return (
            <div className={`event-list-item ${typeClass} ${statusClass}`}>
                <div className="event-list-indicator"></div>
                <div className="event-list-content">
                    <span className="event-title">{title}</span>
                    {userName && <span className="event-user">{userName}</span>}
                </div>
                {statusIcon && <span className="event-status-icon">{statusIcon}</span>}
            </div>
        );
    }

    // Pour les vues grid (mois, semaine, jour)
    return (
        <div className={`event-grid-item ${typeClass} ${statusClass}`}>
            <div className="event-grid-content">
                <div className="event-title">{title}</div>
                {userName && <div className="event-user">{userName}</div>}
            </div>
            {statusIcon && <span className="event-status-icon">{statusIcon}</span>}
        </div>
    );
}; 