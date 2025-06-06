import React from 'react';
import { CalendarViewType } from '../../types/event';

interface ListViewProps {
    events: unknown[];
    startDate: Date;
    endDate: Date;
    onEventClick?: (event: unknown) => void;
}

const ListView: React.FC<ListViewProps> = ({ events, startDate, endDate, onEventClick }) => {
    // Filtrer les événements dans la plage de dates
    const filteredEvents = events.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate >= startDate && eventDate <= endDate;
    });

    // Trier les événements par date
    const sortedEvents = filteredEvents.sort((a, b) => {
        return new Date(a.start).getTime() - new Date(b.start).getTime();
    });

    return (
        <div className="list-view">
            <div className="list-header">
                <h2>
                    {startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} - {endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </h2>
            </div>
            <div className="list-content">
                {sortedEvents.map((event) => (
                    <div
                        key={event.id}
                        className="list-event"
                        onClick={() => onEventClick?.(event)}
                    >
                        <div className="event-date">
                            {new Date(event.start).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                        <div className="event-time">
                            {new Date(event.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="event-title">{event.title}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ListView; 