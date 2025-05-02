import React, { memo, useMemo } from 'react';
import { AnyCalendarEvent, CalendarEventType } from '../../types/event';
import { getEventBackgroundColor, getEventBorderColor } from '../../services/eventFormatter';

interface CalendarEventProps {
    event: AnyCalendarEvent;
    isCompact?: boolean;
    showUser?: boolean;
    showStatus?: boolean;
    onClick?: (event: AnyCalendarEvent) => void;
    className?: string;
}

/**
 * Composant réutilisable pour afficher un événement du calendrier
 * Peut être utilisé dans différents contextes (tooltip, légende, etc.)
 */
const CalendarEventComponent: React.FC<CalendarEventProps> = ({
    event,
    isCompact = false,
    showUser = true,
    showStatus = true,
    onClick,
    className = ''
}) => {
    // Mémoriser les styles calculés
    const styles = useMemo(() => ({
        backgroundColor: getEventBackgroundColor(event.type),
        borderColor: getEventBorderColor(event.type, event.type === CalendarEventType.LEAVE ? event.status : undefined),
    }), [event.type, event.status]);

    // Déterminer l'icône de statut pour les congés
    let statusIcon = '';
    let statusClass = '';

    if (event.type === CalendarEventType.LEAVE && 'status' in event) {
        const status = (event as any).status;

        switch (status) {
            case 'APPROVED':
                statusIcon = '✓';
                statusClass = 'status-approved';
                break;
            case 'PENDING':
                statusIcon = '⧖';
                statusClass = 'status-pending';
                break;
            case 'REJECTED':
                statusIcon = '✕';
                statusClass = 'status-rejected';
                break;
            case 'CANCELLED':
                statusIcon = '⊘';
                statusClass = 'status-cancelled';
                break;
        }
    }

    // Gérer le clic sur l'événement
    const handleClick = () => {
        if (onClick) {
            onClick(event);
        }
    };

    // Mémoriser le contenu de l'événement
    const eventContent = useMemo(() => (
        <div className={`event-content ${isCompact ? 'compact' : ''} ${className} ${statusClass}`}>
            <div className="event-title">{event.title}</div>
            {showUser && event.user && (
                <div className="event-user">{`${event.user.prenom} ${event.user.nom}`}</div>
            )}
            {showStatus && statusIcon && (
                <div className="event-status">{statusIcon}</div>
            )}
        </div>
    ), [event.title, event.user, event.type, isCompact, showUser, showStatus, statusIcon, className, statusClass]);

    // Affichage compact (pour les listes, légendes, etc.)
    if (isCompact) {
        return (
            <div
                className={`flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-gray-50 ${className} ${statusClass}`}
                style={styles}
                onClick={handleClick}
            >
                <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: styles.backgroundColor }}
                />
                {eventContent}
            </div>
        );
    }

    // Affichage normal (pour les détails d'événement)
    return (
        <div
            className={`p-3 border rounded-md cursor-pointer hover:shadow-sm ${className} ${statusClass}`}
            style={{
                ...styles,
                borderLeftWidth: '4px'
            }}
            onClick={handleClick}
        >
            {eventContent}

            <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                <span>
                    {new Date(event.start).toLocaleDateString('fr-FR')}
                    {event.end && ` - ${new Date(event.end).toLocaleDateString('fr-FR')}`}
                </span>
            </div>
        </div>
    );
};

export default memo(CalendarEventComponent);