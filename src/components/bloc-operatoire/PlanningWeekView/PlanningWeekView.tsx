'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DayOfWeek, Period } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    Filter,
    Grid,
    List,
    Maximize2,
    RefreshCw
} from 'lucide-react';

import { WeekNavigator } from './WeekNavigator';
import { ViewModeSelector } from './ViewModeSelector';
import { FilterPanel } from './FilterPanel';

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

interface PlanningWeekViewProps {
    currentWeek?: Date;
    events?: PlanningEvent[];
    rooms?: Array<{ id: number; name: string; sectorId: number; }>;
    onEventClick?: (event: PlanningEvent) => void;
    onTimeSlotClick?: (date: Date, period: Period, roomId: number) => void;
    onWeekChange?: (date: Date) => void;
    className?: string;
    readOnly?: boolean;
}

type ViewMode = 'grid' | 'list' | 'compact';

// Composant pour afficher un événement
const EventCard: React.FC<{
    event: PlanningEvent;
    onClick?: () => void;
    compact?: boolean;
}> = ({ event, onClick, compact = false }) => (
    <motion.div
        className={`
      p-2 rounded-md cursor-pointer transition-all duration-200
      ${compact ? 'text-xs' : 'text-sm'}
      hover:shadow-md hover:scale-105
    `}
        style={{ backgroundColor: event.color }}
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
    >
        <div className="text-white font-medium truncate">
            {event.title}
        </div>
        {!compact && (
            <>
                <div className="text-white/80 text-xs">
                    {event.startTime} - {event.endTime}
                </div>
                <div className="text-white/80 text-xs truncate">
                    {event.roomName}
                </div>
                {event.supervisorName && (
                    <div className="text-white/80 text-xs truncate">
                        {event.supervisorName}
                    </div>
                )}
                {event.conflicts && event.conflicts.length > 0 && (
                    <Badge variant="destructive" className="mt-1 text-xs">
                        Conflit
                    </Badge>
                )}
            </>
        )}
    </motion.div>
);

// Composant pour une cellule de temps
const TimeSlot: React.FC<{
    date: Date;
    period: Period;
    roomId: number;
    events: PlanningEvent[];
    onSlotClick?: (date: Date, period: Period, roomId: number) => void;
    onEventClick?: (event: PlanningEvent) => void;
    viewMode: ViewMode;
}> = ({ date, period, roomId, events, onSlotClick, onEventClick, viewMode }) => {
    const handleSlotClick = useCallback(() => {
        if (events.length === 0) {
            onSlotClick?.(date, period, roomId);
        }
    }, [date, period, roomId, events.length, onSlotClick]);

    return (
        <div
            className={`
        min-h-16 border border-gray-200 p-1 cursor-pointer
        hover:bg-gray-50 transition-colors duration-150
        ${events.length === 0 ? 'hover:bg-blue-50' : ''}
      `}
            onClick={handleSlotClick}
        >
            <div className="space-y-1">
                {events.map(event => (
                    <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => onEventClick?.(event)}
                        compact={viewMode === 'compact'}
                    />
                ))}
            </div>
        </div>
    );
};

// Composant principal
export const PlanningWeekView: React.FC<PlanningWeekViewProps> = ({
    currentWeek = new Date(),
    events = [],
    rooms = [],
    onEventClick,
    onTimeSlotClick,
    onWeekChange,
    className = '',
    readOnly = false
}) => {
    // État local
    const [selectedWeek, setSelectedWeek] = useState(currentWeek);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
    const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([]);

    // Calcul des jours de la semaine
    const weekDays = useMemo(() => {
        const start = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // Lundi
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, [selectedWeek]);

    // Périodes de la journée
    const periods: Period[] = [Period.MATIN, Period.APRES_MIDI, Period.JOURNEE_ENTIERE];

    // Filtrage des événements
    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            if (selectedRooms.length > 0 && !selectedRooms.includes(event.roomId)) {
                return false;
            }
            if (selectedActivityTypes.length > 0 && !selectedActivityTypes.includes(event.activityType)) {
                return false;
            }
            return true;
        });
    }, [events, selectedRooms, selectedActivityTypes]);

    // Groupement des événements par jour/période/salle
    const eventsBySlot = useMemo(() => {
        const grouped: Record<string, PlanningEvent[]> = {};

        filteredEvents.forEach(event => {
            // Ici on devrait parser la date de l'événement
            // Pour l'exemple, on assume que l'événement a une date
            const eventDate = new Date(); // À remplacer par la vraie date de l'événement
            const dayKey = format(eventDate, 'yyyy-MM-dd');
            const period = Period.MATIN; // À déterminer selon l'heure
            const key = `${dayKey}-${period}-${event.roomId}`;

            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(event);
        });

        return grouped;
    }, [filteredEvents]);

    // Gestionnaires d'événements
    const handleWeekChange = useCallback((newWeek: Date) => {
        setSelectedWeek(newWeek);
        onWeekChange?.(newWeek);
    }, [onWeekChange]);

    const handlePreviousWeek = useCallback(() => {
        handleWeekChange(subWeeks(selectedWeek, 1));
    }, [selectedWeek, handleWeekChange]);

    const handleNextWeek = useCallback(() => {
        handleWeekChange(addWeeks(selectedWeek, 1));
    }, [selectedWeek, handleWeekChange]);

    const handleToday = useCallback(() => {
        handleWeekChange(new Date());
    }, [handleWeekChange]);

    // Rendu en mode liste
    const renderListView = () => (
        <div className="space-y-4">
            {weekDays.map(day => (
                <Card key={day.toISOString()} className="overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">
                            {format(day, 'EEEE d MMMM', { locale: fr })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {periods.map(period => {
                                const dayEvents = filteredEvents.filter(event => {
                                    // Logique de filtrage par jour et période
                                    return true; // À implémenter
                                });

                                return (
                                    <div key={period} className="border-l-4 border-blue-500 pl-4">
                                        <h4 className="font-medium text-gray-900 mb-2">
                                            {period === Period.MATIN ? 'Matin' :
                                                period === Period.APRES_MIDI ? 'Après-midi' : 'Journée entière'}
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {dayEvents.map(event => (
                                                <EventCard
                                                    key={event.id}
                                                    event={event}
                                                    onClick={() => onEventClick?.(event)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    // Rendu en mode grille
    const renderGridView = () => (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th className="w-24 p-2 border border-gray-300 bg-gray-50">
                            Période
                        </th>
                        {weekDays.map(day => (
                            <th key={day.toISOString()} className="p-2 border border-gray-300 bg-gray-50">
                                <div className="text-center">
                                    <div className="font-medium">
                                        {format(day, 'EEE', { locale: fr })}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {format(day, 'd MMM', { locale: fr })}
                                    </div>
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {periods.map(period => (
                        <tr key={period}>
                            <td className="p-2 border border-gray-300 bg-gray-50 font-medium text-center">
                                {period === Period.MATIN ? 'Matin' :
                                    period === Period.APRES_MIDI ? 'Après-midi' : 'Journée entière'}
                            </td>
                            {weekDays.map(day => {
                                const dayKey = format(day, 'yyyy-MM-dd');

                                return (
                                    <td key={day.toISOString()} className="border border-gray-300 p-0">
                                        <div className="space-y-1">
                                            {rooms.map(room => {
                                                const slotKey = `${dayKey}-${period}-${room.id}`;
                                                const slotEvents = eventsBySlot[slotKey] || [];

                                                return (
                                                    <TimeSlot
                                                        key={room.id}
                                                        date={day}
                                                        period={period}
                                                        roomId={room.id}
                                                        events={slotEvents}
                                                        onSlotClick={onTimeSlotClick}
                                                        onEventClick={onEventClick}
                                                        viewMode={viewMode}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className={`h-full flex flex-col bg-white ${className}`}>
            {/* En-tête avec navigation */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Planning Bloc Opératoire
                    </h2>

                    <WeekNavigator
                        currentWeek={selectedWeek}
                        onWeekChange={handleWeekChange}
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToday}
                    >
                        <Calendar className="w-4 h-4 mr-1" />
                        Aujourd'hui
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="w-4 h-4 mr-1" />
                        Filtres
                    </Button>

                    <ViewModeSelector
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                    />

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Panel de filtres */}
            <AnimatePresence>
                {showFilters && (
                    <FilterPanel
                        rooms={rooms}
                        selectedRooms={selectedRooms}
                        onRoomsChange={setSelectedRooms}
                        selectedActivityTypes={selectedActivityTypes}
                        onActivityTypesChange={setSelectedActivityTypes}
                    />
                )}
            </AnimatePresence>

            {/* Zone principale */}
            <div className="flex-1 overflow-auto p-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={viewMode}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {viewMode === 'list' ? renderListView() : renderGridView()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PlanningWeekView; 