import React from 'react';
import { CalendarViewType } from '../../types/event';

interface DayGridViewProps {
    events: any[];
    date: Date;
    onEventClick?: (event: any) => void;
}

const DayGridView: React.FC<DayGridViewProps> = ({ events, date, onEventClick }) => {
    return (
        <div className="day-grid-view">
            <div className="day-grid-header">
                <h2>{date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
            </div>
            <div className="day-grid-content">
                {events.map((event) => (
                    <div
                        key={event.id}
                        className="day-grid-event"
                        onClick={() => onEventClick?.(event)}
                    >
                        <div className="event-time">
                            {event.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="event-title">{event.title}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DayGridView; 