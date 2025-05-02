import React, { memo, useMemo } from 'react';
import { AnyCalendarEvent, CalendarEventType } from '../../types/event';
import { ShiftType } from '@/types/common';
import { formatDate } from '@/utils/dateUtils';

interface CalendarEventProps {
    event: AnyCalendarEvent;
    isCompact?: boolean;
    showTime?: boolean;
    onClick?: (event: AnyCalendarEvent) => void;
    className?: string;
}

/**
 * Composant réutilisable pour afficher un événement dans le calendrier
 * Gère différents types d'événements avec un rendu adapté
 */
export const CalendarEvent: React.FC<CalendarEventProps> = memo(({
    event,
    isCompact = false,
    showTime = true,
    onClick,
    className = ''
}) => {
    // Couleurs et icônes adaptées au type d'événement
    const eventStyles = useMemo(() => getEventStyles(event), [event]);

    // Formatage de l'heure de l'événement
    const timeDisplay = useMemo(() => {
        if (!showTime || !event.start) return '';

        const startTime = formatDate(event.start, 'HH:mm');
        if (event.allDay) return 'Journée entière';
        if (!event.end) return startTime;

        const endTime = formatDate(event.end, 'HH:mm');
        return `${startTime} - ${endTime}`;
    }, [event, showTime]);

    // Gestion du clic sur l'événement
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClick) onClick(event);
    };

    // Contenu de l'événement adapté selon le mode compact ou non
    return (
        <div
            className={`rounded px-2 py-1 ${eventStyles.bgClass} ${eventStyles.textClass} cursor-pointer overflow-hidden ${className}`}
            style={{ borderLeft: `3px solid ${eventStyles.accentColor}` }}
            onClick={handleClick}
            aria-label={`Événement: ${event.title}`}
        >
            {/* Titre et informations principales */}
            <div className="font-medium truncate">
                {!isCompact && eventStyles.icon}
                <span className="ml-1">{event.title}</span>
            </div>

            {/* Informations supplémentaires (uniquement en mode détaillé) */}
            {!isCompact && (
                <div className="text-xs mt-1 opacity-90">
                    {timeDisplay && <div>{timeDisplay}</div>}

                    {/* Informations spécifiques selon le type d'événement */}
                    {event.type === CalendarEventType.LEAVE && 'status' in event && (
                        <div>Statut: {getLeaveStatusLabel(event.status)}</div>
                    )}

                    {event.type === CalendarEventType.SHIFT && 'shiftType' in event && (
                        <div>Type: {getShiftTypeLabel(event.shiftType)}</div>
                    )}

                    {event.location && (
                        <div className="truncate">Lieu: {event.location}</div>
                    )}
                </div>
            )}
        </div>
    );
});

// Utilitaires pour le style des événements
function getEventStyles(event: AnyCalendarEvent) {
    switch (event.type) {
        case CalendarEventType.LEAVE:
            return {
                bgClass: 'bg-blue-100',
                textClass: 'text-blue-800',
                accentColor: '#3b82f6',
                icon: <span>🏖️</span>
            };
        case CalendarEventType.SHIFT:
            return {
                bgClass: 'bg-green-100',
                textClass: 'text-green-800',
                accentColor: '#22c55e',
                icon: <span>👨‍⚕️</span>
            };
        case CalendarEventType.MEETING:
            return {
                bgClass: 'bg-purple-100',
                textClass: 'text-purple-800',
                accentColor: '#a855f7',
                icon: <span>📅</span>
            };
        default:
            return {
                bgClass: 'bg-gray-100',
                textClass: 'text-gray-800',
                accentColor: '#9ca3af',
                icon: <span>📌</span>
            };
    }
}

// Labels pour les statuts de congé
function getLeaveStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        PENDING: 'En attente',
        APPROVED: 'Approuvé',
        REJECTED: 'Refusé',
        CANCELLED: 'Annulé'
    };
    return labels[status] || status;
}

// Labels pour les types de shift
function getShiftTypeLabel(shiftType: ShiftType): string {
    const labels: Record<ShiftType, string> = {
        [ShiftType.JOUR]: 'Garde de jour',
        [ShiftType.NUIT]: 'Garde de nuit',
        [ShiftType.GARDE_24H]: 'Garde 24h',
        [ShiftType.GARDE_WEEKEND]: 'Garde weekend',
        [ShiftType.ASTREINTE]: 'Astreinte',
        [ShiftType.ASTREINTE_SEMAINE]: 'Astreinte semaine',
        [ShiftType.ASTREINTE_WEEKEND]: 'Astreinte weekend',
        [ShiftType.MATIN]: 'Matin',
        [ShiftType.APRES_MIDI]: 'Après-midi',
        [ShiftType.URGENCE]: 'Urgence',
        [ShiftType.CONSULTATION]: 'Consultation'
    };
    return labels[shiftType] || shiftType;
} 