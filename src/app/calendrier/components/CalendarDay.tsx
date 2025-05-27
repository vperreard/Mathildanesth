import React from 'react';
import { format, isToday, isSameMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarEvent } from './CalendarGrid';

export interface CalendarDayProps {
    date: Date;
    events: CalendarEvent[];
    isCurrentMonth?: boolean;
    isWeekend?: boolean;
    isHoliday?: boolean;
    onClick?: (date: Date) => void;
    onEventClick?: (event: CalendarEvent) => void;
    maxVisibleEvents?: number;
    currentView?: 'month' | 'week' | 'day';
}

/**
 * CalendarDay - Composant pour les cellules individuelles représentant un jour
 */
export const CalendarDay: React.FC<CalendarDayProps> = ({
    date,
    events = [],
    isCurrentMonth = true,
    isWeekend = false,
    isHoliday = false,
    onClick,
    onEventClick,
    maxVisibleEvents = 3,
    currentView = 'month'
}) => {
    // Formatage de la date
    const dayNumber = format(date, 'd');
    const dayName = format(date, 'EEEE', { locale: fr });
    const fullDate = format(date, 'dd/MM/yyyy');

    // Déterminer si le jour est aujourd'hui
    const isTodayDate = isToday(date);

    // Trier les événements par ordre chronologique
    const sortedEvents = [...events].sort((a, b) => {
        const aStart = new Date(a.start);
        const bStart = new Date(b.start);
        return aStart.getTime() - bStart.getTime();
    });

    // Limiter le nombre d'événements visibles
    const visibleEvents = sortedEvents.slice(0, maxVisibleEvents);
    const hiddenEventsCount = sortedEvents.length - maxVisibleEvents;

    // Gérer le clic sur un jour
    const handleDayClick = () => {
        if (onClick) {
            onClick(date);
        }
    };

    // Gérer le clic sur un événement
    const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
        e.stopPropagation(); // Empêcher le déclenchement du clic sur le jour
        if (onEventClick) {
            onEventClick(event);
        }
    };

    // Classes CSS conditionnelles pour la cellule
    const dayClasses = [
        'calendar-day',
        'relative',
        'border',
        'p-1',
        'h-full',
        'min-h-[6rem]',
        isCurrentMonth ? 'bg-white' : 'bg-gray-50',
        isWeekend ? 'bg-gray-50' : '',
        isHoliday ? 'bg-red-50' : '',
        isTodayDate ? 'border-blue-500 border-2' : 'border-gray-200',
        isCurrentMonth ? 'text-gray-800' : 'text-gray-400',
    ].filter(Boolean).join(' ');

    // Classes CSS pour l'en-tête du jour
    const dayHeaderClasses = [
        'day-header',
        'flex',
        'items-center',
        'justify-between',
        'mb-1',
        isTodayDate ? 'text-blue-600 font-bold' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={dayClasses} onClick={handleDayClick}>
            <div className={dayHeaderClasses}>
                <div className="text-xs">{currentView !== 'day' && dayName}</div>
                <div className={`day-number ${isTodayDate ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                    {dayNumber}
                </div>
            </div>

            <div className="day-events space-y-1 overflow-y-auto max-h-[calc(100%-2rem)]">
                {visibleEvents.map((event) => (
                    <div
                        key={event.id}
                        className="text-xs p-1 rounded truncate cursor-pointer"
                        style={{
                            backgroundColor: event.backgroundColor || '#4f46e5',
                            color: event.textColor || 'white',
                            borderLeft: `3px solid ${event.borderColor || event.backgroundColor || '#4f46e5'}`
                        }}
                        onClick={(e) => handleEventClick(event, e)}
                        title={event.title}
                    >
                        {event.allDay ? (
                            <span>{event.title}</span>
                        ) : (
                            <>
                                <span className="font-medium">
                                    {format(new Date(event.start), 'HH:mm')}
                                </span>
                                {' '}
                                <span className="truncate">{event.title}</span>
                            </>
                        )}
                    </div>
                ))}

                {hiddenEventsCount > 0 && (
                    <div className="text-xs text-gray-500 p-1">
                        + {hiddenEventsCount} autre{hiddenEventsCount > 1 ? 's' : ''}
                    </div>
                )}
            </div>
        </div>
    );
}; 