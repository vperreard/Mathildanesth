import React from 'react';
import { CalendarViewType } from '../../types/event';

interface WeekGridViewProps {
    events: unknown[];
    startDate: Date;
    onEventClick?: (event: unknown) => void;
}

const WeekGridView: React.FC<WeekGridViewProps> = ({ events, startDate, onEventClick }) => {
    // Générer les dates de la semaine
    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        return date;
    });

    return (
        <div className="week-grid-view">
            <div className="week-grid-header">
                {weekDates.map((date) => (
                    <div key={date.toISOString()} className="week-day-header">
                        <div className="week-day-name">
                            {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </div>
                        <div className="week-day-number">
                            {date.getDate()}
                        </div>
                    </div>
                ))}
            </div>
            <div className="week-grid-content">
                {weekDates.map((date) => {
                    const dayEvents = events.filter(event => {
                        const eventDate = new Date(event.start);
                        return eventDate.toDateString() === date.toDateString();
                    });

                    return (
                        <div key={date.toISOString()} className="week-day-column">
                            {dayEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="week-day-event"
                                    onClick={() => onEventClick?.(event)}
                                >
                                    <div className="event-time">
                                        {event.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="event-title">{event.title}</div>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WeekGridView; 