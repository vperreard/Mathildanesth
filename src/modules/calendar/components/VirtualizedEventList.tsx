import React, { memo, useCallback, useState, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { AnyCalendarEvent, CalendarEventType } from '../types/event';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';

interface EventItemProps {
    event: AnyCalendarEvent;
    onClick: (event: AnyCalendarEvent) => void;
    style: React.CSSProperties;
    isSelected: boolean;
}

// Composant mémorisé pour un élément d'événement dans la liste
const EventItem = memo(({ event, onClick, style, isSelected }: EventItemProps) => {
    // Déterminer la couleur de fond en fonction du type d'événement
    const getBackgroundColor = useMemo(() => {
        switch (event.type) {
            case CalendarEventType.LEAVE:
                return 'bg-blue-100 hover:bg-blue-200';
            case CalendarEventType.DUTY:
                return 'bg-green-100 hover:bg-green-200';
            case CalendarEventType.ASSIGNMENT:
                return 'bg-yellow-100 hover:bg-yellow-200';
            case CalendarEventType.ON_CALL:
                return 'bg-purple-100 hover:bg-purple-200';
            case CalendarEventType.TRAINING:
                return 'bg-indigo-100 hover:bg-indigo-200';
            case CalendarEventType.MEETING:
                return 'bg-pink-100 hover:bg-pink-200';
            case CalendarEventType.OPERATION:
                return 'bg-red-100 hover:bg-red-200';
            case CalendarEventType.CONSULTATION:
                return 'bg-orange-100 hover:bg-orange-200';
            default:
                return 'bg-gray-100 hover:bg-gray-200';
        }
    }, [event.type]);

    // Gestion du clic sur un événement
    const handleClick = useCallback(() => {
        onClick(event);
    }, [event, onClick]);

    // Formater les dates pour l'affichage
    const formattedStartDate = useMemo(() => {
        return format(new Date(event.start), 'dd MMM yyyy HH:mm', { locale: fr });
    }, [event.start]);

    const formattedEndDate = useMemo(() => {
        return format(new Date(event.end), 'dd MMM yyyy HH:mm', { locale: fr });
    }, [event.end]);

    // Déterminer les classes CSS pour les bordures et le style sélectionné
    const borderClasses = isSelected
        ? 'border-2 border-blue-500'
        : 'border border-gray-200';

    return (
        <div
            style={style}
            className={`p-3 rounded-md shadow-sm mb-2 cursor-pointer transition-colors ${getBackgroundColor} ${borderClasses}`}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            aria-selected={isSelected}
        >
            <div className="font-medium">{event.title}</div>
            <div className="text-sm text-gray-600">
                {formattedStartDate} - {formattedEndDate}
            </div>
            {event.description && (
                <div className="text-sm mt-1 text-gray-700">{event.description}</div>
            )}
            <div className="flex items-center mt-2">
                <span className="text-xs font-medium bg-gray-200 rounded px-2 py-1">
                    {event.type}
                </span>
                {'userId' in event && event.user && (
                    <span className="text-xs ml-2 text-gray-600">
                        {event.user.prenom} {event.user.nom}
                    </span>
                )}
            </div>
        </div>
    );
});

// Pour éviter l'avertissement sur les composants anonymes
EventItem.displayName = 'EventItem';

interface EventRowProps {
    index: number;
    style: React.CSSProperties;
    data: {
        events: AnyCalendarEvent[];
        onEventClick: (event: AnyCalendarEvent) => void;
        selectedEventId: string | null;
    };
}

// Composant pour une ligne de la liste virtualisée
const EventRow = memo(({ index, style, data }: EventRowProps) => {
    const { events, onEventClick, selectedEventId } = data;
    const event = events[index];

    return (
        <EventItem
            event={event}
            onClick={onEventClick}
            style={style}
            isSelected={selectedEventId === event.id}
        />
    );
});

// Pour éviter l'avertissement sur les composants anonymes
EventRow.displayName = 'EventRow';

interface VirtualizedEventListProps {
    events: AnyCalendarEvent[];
    onEventClick?: (event: AnyCalendarEvent) => void;
    selectedEventId?: string | null;
    height?: number | string;
    className?: string;
    itemHeight?: number;
    emptyMessage?: string;
}

/**
 * Composant optimisé pour afficher une liste virtualisée d'événements
 * Utilisant react-window pour la virtualisation et l'optimisation des performances
 */
const VirtualizedEventList: React.FC<VirtualizedEventListProps> = ({
    events,
    onEventClick = () => { },
    selectedEventId = null,
    height = 400,
    className = '',
    itemHeight = 120,
    emptyMessage = "Aucun événement à afficher"
}) => {
    // Gérer le clic sur un événement
    const handleEventClick = useCallback((event: AnyCalendarEvent) => {
        onEventClick(event);
    }, [onEventClick]);

    // Mémorisation des données pour éviter les re-rendus
    const listData = useMemo(() => {
        return {
            events,
            onEventClick: handleEventClick,
            selectedEventId
        };
    }, [events, handleEventClick, selectedEventId]);

    return (
        <div style={{ height }} className={`w-full ${className}`}>
            {events.length > 0 ? (
                <AutoSizer>
                    {({ height, width }) => (
                        <List
                            height={height}
                            width={width}
                            itemCount={events.length}
                            itemSize={itemHeight}
                            itemData={listData}
                        >
                            {EventRow}
                        </List>
                    )}
                </AutoSizer>
            ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                    {emptyMessage}
                </div>
            )}
        </div>
    );
};

export default memo(VirtualizedEventList); 