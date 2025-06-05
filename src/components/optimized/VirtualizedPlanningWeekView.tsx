'use client';

import React, { useMemo, useCallback, memo, CSSProperties } from 'react';
import { VariableSizeGrid as Grid } from 'react-window';
import { format, startOfWeek, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Period } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

// Types
interface PlanningEvent {
    id: number;
    title: string;
    startTime: string;
    endTime: string;
    roomId: number;
    roomName: string;
    supervisorId?: number;
    supervisorName?: string;
    activityType: string;
    color: string;
    conflicts?: string[];
}

interface VirtualizedPlanningWeekViewProps {
    currentWeek?: Date;
    events?: PlanningEvent[];
    rooms?: Array<{ id: number; name: string; sectorId: number; }>;
    onEventClick?: (event: PlanningEvent) => void;
    onTimeSlotClick?: (date: Date, period: Period, roomId: number) => void;
    onWeekChange?: (date: Date) => void;
    className?: string;
    readOnly?: boolean;
}

// Cell component memoized for performance
const Cell = memo(({ 
    columnIndex, 
    rowIndex, 
    style,
    data 
}: {
    columnIndex: number;
    rowIndex: number;
    style: CSSProperties;
    data: unknown;
}) => {
    const { 
        days, 
        periods, 
        rooms, 
        eventsByKey, 
        onEventClick, 
        onTimeSlotClick 
    } = data;

    // Header row
    if (rowIndex === 0) {
        if (columnIndex === 0) {
            return <div style={style} className="bg-gray-100 p-2 font-semibold border-r border-b">Salles</div>;
        }
        const dayIndex = Math.floor((columnIndex - 1) / periods.length);
        const periodIndex = (columnIndex - 1) % periods.length;
        const day = days[dayIndex];
        
        if (periodIndex === 0) {
            return (
                <div style={style} className="bg-gray-100 p-2 text-center font-semibold border-r border-b">
                    {format(day, 'EEEE d', { locale: fr })}
                </div>
            );
        }
        return (
            <div style={style} className="bg-gray-100 p-2 text-center text-sm border-r border-b">
                {periods[periodIndex]}
            </div>
        );
    }

    // Room column
    if (columnIndex === 0) {
        const room = rooms[rowIndex - 1];
        return (
            <div style={style} className="bg-gray-50 p-2 font-medium border-r">
                {room?.name || ''}
            </div>
        );
    }

    // Event cells
    const room = rooms[rowIndex - 1];
    const dayIndex = Math.floor((columnIndex - 1) / periods.length);
    const periodIndex = (columnIndex - 1) % periods.length;
    const day = days[dayIndex];
    const period = periods[periodIndex];
    
    const eventKey = `${format(day, 'yyyy-MM-dd')}-${period}-${room?.id}`;
    const cellEvents = eventsByKey[eventKey] || [];

    return (
        <div 
            style={style} 
            className="border-r border-b p-1 hover:bg-gray-50 cursor-pointer"
            onClick={() => {
                if (cellEvents.length === 0 && onTimeSlotClick && room) {
                    onTimeSlotClick(day, period as Period, room.id);
                }
            }}
        >
            {cellEvents.map((event: PlanningEvent) => (
                <div
                    key={event.id}
                    className="p-1 mb-1 rounded text-xs text-white cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: event.color }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                    }}
                >
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="truncate opacity-80">{event.roomName}</div>
                </div>
            ))}
        </div>
    );
});

Cell.displayName = 'Cell';

// Main component
export const VirtualizedPlanningWeekView: React.FC<VirtualizedPlanningWeekViewProps> = ({
    currentWeek = new Date(),
    events = [],
    rooms = [],
    onEventClick,
    onTimeSlotClick,
    onWeekChange,
    className = '',
    readOnly = false
}) => {
    const [selectedWeek, setSelectedWeek] = React.useState(currentWeek);

    // Calculate week days
    const days = useMemo(() => {
        const start = startOfWeek(selectedWeek, { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, [selectedWeek]);

    // Periods
    const periods = ['MORNING', 'AFTERNOON', 'NIGHT'];

    // Organize events by key for fast lookup
    const eventsByKey = useMemo(() => {
        const map: Record<string, PlanningEvent[]> = {};
        events.forEach(event => {
            // Parse event date and period from event data
            // This is a simplified version - adapt to your actual data structure
            const key = `${event.roomId}`; // Adapt this based on your event structure
            if (!map[key]) map[key] = [];
            map[key].push(event);
        });
        return map;
    }, [events]);

    // Column count: 1 for room names + (7 days * 3 periods)
    const columnCount = 1 + (7 * periods.length);
    // Row count: 1 for headers + number of rooms
    const rowCount = 1 + rooms.length;

    // Column widths
    const getColumnWidth = useCallback((index: number) => {
        if (index === 0) return 150; // Room name column
        return 120; // Event columns
    }, []);

    // Row heights
    const getRowHeight = useCallback((index: number) => {
        if (index === 0) return 50; // Header row
        return 80; // Event rows
    }, []);

    // Week navigation
    const handlePreviousWeek = () => {
        const newWeek = addDays(selectedWeek, -7);
        setSelectedWeek(newWeek);
        onWeekChange?.(newWeek);
    };

    const handleNextWeek = () => {
        const newWeek = addDays(selectedWeek, 7);
        setSelectedWeek(newWeek);
        onWeekChange?.(newWeek);
    };

    const handleToday = () => {
        const today = new Date();
        setSelectedWeek(today);
        onWeekChange?.(today);
    };

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Planning Hebdomadaire</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleToday}>
                            Aujourd'hui
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleNextWeek}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div style={{ height: '600px' }}>
                    <Grid
                        columnCount={columnCount}
                        columnWidth={getColumnWidth}
                        height={600}
                        rowCount={rowCount}
                        rowHeight={getRowHeight}
                        width={1200}
                        itemData={{
                            days,
                            periods,
                            rooms,
                            eventsByKey,
                            onEventClick,
                            onTimeSlotClick
                        }}
                    >
                        {Cell}
                    </Grid>
                </div>
            </CardContent>
        </Card>
    );
};