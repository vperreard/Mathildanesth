import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarEvent as CalendarEventType } from './CalendarGrid';

// Enumération des types d'événements possibles (basée sur la structure existante)
export enum EventType {
    ASSIGNMENT = 'ASSIGNMENT',
    LEAVE = 'LEAVE',
    DUTY = 'DUTY',
    ON_CALL = 'ON_CALL',
    TRAINING = 'TRAINING',
    MEETING = 'MEETING',
    OTHER = 'OTHER'
}

export interface CalendarEventProps {
    event: CalendarEventType;
    isCompact?: boolean;
    onClick?: (event: CalendarEventType) => void;
    className?: string;
    showTime?: boolean;
}

/**
 * CalendarEvent - Composant pour la représentation visuelle des événements du calendrier
 */
export const CalendarEvent: React.FC<CalendarEventProps> = ({
    event,
    isCompact = false,
    onClick,
    className = '',
    showTime = true
}) => {
    // Récupérer le type d'événement depuis les propriétés étendues
    const eventType = event.extendedProps?.type || EventType.OTHER;

    // Formater les dates de début et de fin
    const startDate = new Date(event.start);
    const endDate = event.end ? new Date(event.end) : startDate;

    const startFormatted = format(startDate, event.allDay ? 'dd/MM/yyyy' : 'dd/MM/yyyy HH:mm', { locale: fr });
    const endFormatted = format(endDate, event.allDay ? 'dd/MM/yyyy' : 'dd/MM/yyyy HH:mm', { locale: fr });

    // Obtenir les couleurs par défaut en fonction du type d'événement
    const getDefaultColors = (type: string) => {
        switch (type) {
            case EventType.LEAVE:
                return { bg: '#4299e1', border: '#3182ce', text: 'white' };
            case EventType.DUTY:
                return { bg: '#f6ad55', border: '#ed8936', text: 'white' };
            case EventType.ON_CALL:
                return { bg: '#fc8181', border: '#f56565', text: 'white' };
            case EventType.ASSIGNMENT:
                return { bg: '#68d391', border: '#48bb78', text: 'white' };
            case EventType.TRAINING:
                return { bg: '#b794f4', border: '#9f7aea', text: 'white' };
            case EventType.MEETING:
                return { bg: '#f687b3', border: '#ed64a6', text: 'white' };
            default:
                return { bg: '#a0aec0', border: '#718096', text: 'white' };
        }
    };

    // Appliquer les couleurs (à partir des props ou des valeurs par défaut)
    const defaultColors = getDefaultColors(eventType);
    const backgroundColor = event.backgroundColor || defaultColors.bg;
    const borderColor = event.borderColor || defaultColors.border;
    const textColor = event.textColor || defaultColors.text;

    // Gérer le clic sur l'événement
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClick) {
            onClick(event);
        }
    };

    // Déterminer le statut de l'événement (si disponible)
    const status = event.extendedProps?.status || null;

    // Classes CSS pour le composant
    const eventClasses = [
        'calendar-event',
        'rounded',
        'overflow-hidden',
        'cursor-pointer',
        'transition-all',
        'duration-200',
        'hover:opacity-90',
        'hover:shadow-md',
        isCompact ? 'p-1 text-xs' : 'p-2 text-sm',
        className
    ].filter(Boolean).join(' ');

    // Obtenir le symbole pour le type d'événement
    const getEventIcon = (type: string) => {
        switch (type) {
            case EventType.LEAVE:
                return '🏖️';
            case EventType.DUTY:
                return '🏥';
            case EventType.ON_CALL:
                return '📱';
            case EventType.ASSIGNMENT:
                return '📋';
            case EventType.TRAINING:
                return '🎓';
            case EventType.MEETING:
                return '👥';
            default:
                return '📅';
        }
    };

    // Rendu compact (pour les vues avec espace limité)
    if (isCompact) {
        return (
            <div
                className={eventClasses}
                style={{ backgroundColor, borderLeft: `3px solid ${borderColor}`, color: textColor }}
                onClick={handleClick}
            >
                <div className="truncate">
                    {showTime && !event.allDay && (
                        <span className="font-medium mr-1">{format(startDate, 'HH:mm')}</span>
                    )}
                    <span className="truncate">{event.title}</span>
                </div>
            </div>
        );
    }

    // Rendu complet de l'événement
    return (
        <div
            className={eventClasses}
            style={{ backgroundColor, borderLeft: `4px solid ${borderColor}`, color: textColor }}
            onClick={handleClick}
        >
            <div className="flex items-center justify-between mb-1">
                <div className="font-semibold truncate flex items-center">
                    <span className="mr-1">{getEventIcon(eventType)}</span>
                    <span className="truncate">{event.title}</span>
                </div>

                {status && (
                    <div className="text-xs rounded-full px-2 py-0.5"
                        style={{
                            backgroundColor: status === 'APPROVED' ? '#48bb78' :
                                status === 'REJECTED' ? '#f56565' :
                                    '#ecc94b',
                            color: 'white'
                        }}
                    >
                        {status === 'APPROVED' ? 'Approuvé' :
                            status === 'REJECTED' ? 'Refusé' :
                                'En attente'}
                    </div>
                )}
            </div>

            {showTime && (
                <div className="text-xs opacity-80">
                    {event.allDay ? (
                        startFormatted === endFormatted ?
                            <>Toute la journée: {startFormatted}</> :
                            <>Toute la journée: {startFormatted} - {endFormatted}</>
                    ) : (
                        <>
                            {startFormatted} - {endFormatted}
                        </>
                    )}
                </div>
            )}

            {event.description && (
                <div className="mt-1 text-xs opacity-80 truncate">
                    {event.description}
                </div>
            )}
        </div>
    );
}; 