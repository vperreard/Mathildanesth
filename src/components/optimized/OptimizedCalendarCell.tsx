import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface CalendarCellProps {
    date: Date;
    events: Array<{
        id: string;
        title: string;
        type: string;
        color?: string;
    }>;
    isToday?: boolean;
    isSelected?: boolean;
    onClick?: (date: Date) => void;
    className?: string;
}

/**
 * Composant de cellule de calendrier optimisé avec React.memo
 * Ne re-render que si les props changent réellement
 */
export const OptimizedCalendarCell = memo<CalendarCellProps>(({
    date,
    events,
    isToday = false,
    isSelected = false,
    onClick,
    className
}) => {
    const handleClick = () => {
        onClick?.(date);
    };

    return (
        <div
            className={cn(
                "calendar-cell p-2 min-h-[80px] border cursor-pointer transition-colors",
                isToday && "bg-blue-50 border-blue-300",
                isSelected && "ring-2 ring-blue-500",
                "hover:bg-gray-50",
                className
            )}
            onClick={handleClick}
        >
            <div className="text-sm font-medium mb-1">
                {date.getDate()}
            </div>
            <div className="space-y-1">
                {events.slice(0, 3).map((event) => (
                    <div
                        key={event.id}
                        className={cn(
                            "text-xs p-1 rounded truncate",
                            event.color || "bg-gray-100"
                        )}
                        title={event.title}
                    >
                        {event.title}
                    </div>
                ))}
                {events.length > 3 && (
                    <div className="text-xs text-gray-500">
                        +{events.length - 3} autres
                    </div>
                )}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Fonction de comparaison personnalisée pour optimiser les re-renders
    return (
        prevProps.date.getTime() === nextProps.date.getTime() &&
        prevProps.isToday === nextProps.isToday &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.events.length === nextProps.events.length &&
        prevProps.events.every((event, index) => 
            event.id === nextProps.events[index]?.id
        )
    );
});

OptimizedCalendarCell.displayName = 'OptimizedCalendarCell';

// Export d'un composant de grille optimisé
interface CalendarGridProps {
    startDate: Date;
    endDate: Date;
    events: Map<string, Array<any>>; // Map avec clé date ISO
    selectedDate?: Date;
    onDateClick?: (date: Date) => void;
}

export const OptimizedCalendarGrid = memo<CalendarGridProps>(({
    startDate,
    endDate,
    events,
    selectedDate,
    onDateClick
}) => {
    const dates: Date[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div className="grid grid-cols-7 gap-1">
            {dates.map((date) => {
                const dateKey = date.toISOString().split('T')[0];
                const dayEvents = events.get(dateKey) || [];
                const isToday = date.getTime() === today.getTime();
                const isSelected = selectedDate && 
                    date.toDateString() === selectedDate.toDateString();

                return (
                    <OptimizedCalendarCell
                        key={dateKey}
                        date={date}
                        events={dayEvents}
                        isToday={isToday}
                        isSelected={isSelected}
                        onClick={onDateClick}
                    />
                );
            })}
        </div>
    );
});

OptimizedCalendarGrid.displayName = 'OptimizedCalendarGrid';