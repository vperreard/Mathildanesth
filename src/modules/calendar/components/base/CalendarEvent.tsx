import React, { memo } from 'react';
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
    // Déterminer le style de l'événement
    const backgroundColor = getEventBackgroundColor(event);
    const borderColor = getEventBorderColor(event);

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

    // Affichage compact (pour les listes, légendes, etc.)
    if (isCompact) {
        return (
            <div
                className={`flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-gray-50 ${className} ${statusClass}`}
                onClick={handleClick}
            >
                <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor }}
                />
                <div className="flex-1 text-sm truncate">{event.title}</div>
                {showStatus && statusIcon && (
                    <div className="ml-2 text-xs">{statusIcon}</div>
                )}
            </div>
        );
    }

    // Affichage normal (pour les détails d'événement)
    return (
        <div
            className={`p-3 border rounded-md cursor-pointer hover:shadow-sm ${className} ${statusClass}`}
            style={{ borderColor, borderLeftWidth: '4px' }}
            onClick={handleClick}
        >
            <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-800">{event.title}</h3>
                {showStatus && statusIcon && (
                    <span className="text-sm">{statusIcon}</span>
                )}
            </div>

            {showUser && event.user && (
                <div className="text-sm text-gray-600 mt-1">
                    {`${event.user.prenom} ${event.user.nom}`}
                </div>
            )}

            <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                <span>
                    {new Date(event.start).toLocaleDateString('fr-FR')}
                    {event.end && ` - ${new Date(event.end).toLocaleDateString('fr-FR')}`}
                </span>
                <span className="uppercase px-2 py-1 rounded bg-gray-100">
                    {getEventTypeLabel(event.type)}
                </span>
            </div>

            {event.description && (
                <div className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {event.description}
                </div>
            )}
        </div>
    );
};

/**
 * Obtenir le libellé d'un type d'événement
 */
const getEventTypeLabel = (type: CalendarEventType): string => {
    switch (type) {
        case CalendarEventType.LEAVE:
            return 'Congé';
        case CalendarEventType.DUTY:
            return 'Garde';
        case CalendarEventType.ON_CALL:
            return 'Astreinte';
        case CalendarEventType.ASSIGNMENT:
            return 'Affectation';
        default:
            return 'Événement';
    }
};

// Utiliser memo pour éviter les rendus inutiles
export const CalendarEvent = memo(CalendarEventComponent); 