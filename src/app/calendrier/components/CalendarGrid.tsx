import React, { useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { CalendarViewType } from './CalendarHeader';

// Types pour les événements du calendrier
export interface CalendarEvent {
    id: string;
    title: string;
    start: string | Date;
    end: string | Date;
    description?: string;
    allDay?: boolean;
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    extendedProps?: any;
}

export interface CalendarGridProps {
    events: CalendarEvent[];
    view: CalendarViewType;
    loading?: boolean;
    editable?: boolean;
    selectable?: boolean;
    onEventClick?: (event: CalendarEvent) => void;
    onEventDrop?: (eventId: string, newStart: Date, newEnd: Date) => void;
    onEventResize?: (eventId: string, newStart: Date, newEnd: Date) => void;
    onDateSelect?: (start: Date, end: Date) => void;
    onViewChange?: (view: CalendarViewType) => void;
    onDateRangeChange?: (start: Date, end: Date) => void;
    headerToolbar?: {
        left: string;
        center: string;
        right: string;
    };
    height?: string;
    settings?: {
        businessHours?: boolean | object;
        nowIndicator?: boolean;
        snapDuration?: string;
        slotDuration?: string;
        slotLabelInterval?: string;
        slotLabelFormat?: any;
        slotMinTime?: string;
        slotMaxTime?: string;
    };
}

/**
 * CalendarGrid - Composant pour la structure de base du calendrier
 */
export const CalendarGrid: React.FC<CalendarGridProps> = ({
    events,
    view,
    loading = false,
    editable = false,
    selectable = false,
    onEventClick,
    onEventDrop,
    onEventResize,
    onDateSelect,
    onViewChange,
    onDateRangeChange,
    headerToolbar = {
        left: '',
        center: '',
        right: '',
    },
    height = 'auto',
    settings = {
        businessHours: true,
        nowIndicator: true,
        snapDuration: '00:15:00',
        slotDuration: '00:30:00',
        slotLabelInterval: '01:00:00',
        slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
        slotMinTime: '00:00:00',
        slotMaxTime: '24:00:00'
    }
}) => {
    const calendarRef = useRef<FullCalendar | null>(null);

    // Handlers pour les événements du calendrier
    const handleEventClick = (info: any) => {
        if (onEventClick && info.event.extendedProps) {
            onEventClick({
                ...info.event.extendedProps,
                id: info.event.id,
                title: info.event.title,
                start: info.event.start,
                end: info.event.end || info.event.start,
                allDay: info.event.allDay
            });
        }
    };

    const handleEventDrop = (info: any) => {
        if (onEventDrop) {
            const eventId = info.event.id;
            const newStart = info.event.start;
            const newEnd = info.event.end || info.event.start;
            onEventDrop(eventId, newStart, newEnd);
        }
    };

    const handleEventResize = (info: any) => {
        if (onEventResize) {
            const eventId = info.event.id;
            const newStart = info.event.start;
            const newEnd = info.event.end;
            onEventResize(eventId, newStart, newEnd);
        }
    };

    const handleDateSelect = (info: any) => {
        if (onDateSelect) {
            onDateSelect(info.start, info.end);
        }
    };

    const handleViewChange = (info: any) => {
        if (onViewChange) {
            const newView = info.view.type as CalendarViewType;
            onViewChange(newView);
        }
    };

    const handleDatesSet = (info: any) => {
        if (onDateRangeChange) {
            onDateRangeChange(info.view.currentStart, info.view.currentEnd);
        }
    };

    // Synchroniser la vue avec FullCalendar
    useEffect(() => {
        if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            calendarApi.changeView(view);
        }
    }, [view]);

    return (
        <div className="calendar-grid-container relative" style={{ minHeight: '500px' }}>
            {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-70 z-10 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}

            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView={view}
                headerToolbar={headerToolbar}
                events={events}
                editable={editable}
                selectable={selectable}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                height={height}
                locale={frLocale}
                businessHours={settings.businessHours}
                nowIndicator={settings.nowIndicator}
                snapDuration={settings.snapDuration}
                slotDuration={settings.slotDuration}
                slotLabelInterval={settings.slotLabelInterval}
                slotLabelFormat={settings.slotLabelFormat}
                slotMinTime={settings.slotMinTime}
                slotMaxTime={settings.slotMaxTime}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                select={handleDateSelect}
                datesSet={handleDatesSet}
                viewDidMount={handleViewChange}
                eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                allDayText="Toute la journée"
                moreLinkText="+ %d"
            />
        </div>
    );
}; 