import React, { useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import {
    AnyCalendarEvent,
    CalendarEventType,
    CalendarSettings,
    CalendarViewType
} from '../types/event';

interface EventRenderProps {
    event: {
        id: string;
        title: string;
        start: Date;
        end: Date;
        allDay: boolean;
        extendedProps: any;
    };
    view: {
        type: string;
    };
}

interface BaseCalendarProps {
    events: AnyCalendarEvent[];
    view: CalendarViewType;
    settings: CalendarSettings;
    loading?: boolean;
    editable?: boolean;
    selectable?: boolean;
    onEventClick?: (eventId: string, eventType: string) => void;
    onEventDrop?: (eventId: string, newStart: Date, newEnd: Date) => void;
    onEventResize?: (eventId: string, newStart: Date, newEnd: Date) => void;
    onDateSelect?: (start: Date, end: Date, allDay: boolean) => void;
    onViewChange?: (view: CalendarViewType) => void;
    onDateRangeChange?: (start: Date, end: Date) => void;
    headerToolbar?: {
        left: string;
        center: string;
        right: string;
    };
}

export const BaseCalendar: React.FC<BaseCalendarProps> = ({
    events,
    view,
    settings,
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
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    }
}) => {
    // Formater les événements pour FullCalendar
    const formattedEvents = events.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay !== undefined ? event.allDay : true,
        extendedProps: {
            ...event
        },
        color: getEventColor(event.type),
        textColor: getEventTextColor(event.type)
    }));

    // Gestionnaire de clic sur un événement
    const handleEventClick = useCallback((info: any) => {
        if (onEventClick) {
            const eventId = info.event.id;
            const eventType = info.event.extendedProps.type;
            onEventClick(eventId, eventType);
        }
    }, [onEventClick]);

    // Gestionnaire de déplacement d'un événement
    const handleEventDrop = useCallback((info: any) => {
        if (onEventDrop) {
            const eventId = info.event.id;
            const newStart = info.event.start;
            const newEnd = info.event.end || info.event.start;
            onEventDrop(eventId, newStart, newEnd);
        }
    }, [onEventDrop]);

    // Gestionnaire de redimensionnement d'un événement
    const handleEventResize = useCallback((info: any) => {
        if (onEventResize) {
            const eventId = info.event.id;
            const newStart = info.event.start;
            const newEnd = info.event.end;
            onEventResize(eventId, newStart, newEnd);
        }
    }, [onEventResize]);

    // Gestionnaire de sélection d'une plage de dates
    const handleDateSelect = useCallback((info: any) => {
        if (onDateSelect) {
            onDateSelect(info.start, info.end, info.allDay);
        }
    }, [onDateSelect]);

    // Gestionnaire de changement de vue
    const handleViewChange = useCallback((info: any) => {
        if (onViewChange) {
            const newView = info.view.type as CalendarViewType;
            onViewChange(newView);
        }
    }, [onViewChange]);

    // Gestionnaire de changement de plage de dates
    const handleDatesSet = useCallback((info: any) => {
        if (onDateRangeChange) {
            onDateRangeChange(info.view.currentStart, info.view.currentEnd);
        }
    }, [onDateRangeChange]);

    // Personnaliser le rendu des événements
    const renderEvent = useCallback((info: EventRenderProps) => {
        const { event, view } = info;
        const eventType = event.extendedProps.type;
        const status = event.extendedProps.status;

        // Classes CSS en fonction du type d'événement et du statut
        let className = 'py-1 px-2 rounded';
        let statusClass = '';

        if (status) {
            switch (status) {
                case 'APPROVED':
                    statusClass = 'border-l-4 border-green-500';
                    break;
                case 'PENDING':
                    statusClass = 'border-l-4 border-yellow-500';
                    break;
                case 'REJECTED':
                    statusClass = 'border-l-4 border-red-500';
                    break;
                default:
                    statusClass = '';
            }
        }

        // Contenu différent selon la vue
        if (view.type === 'listWeek') {
            return (
                <div className={`${className} ${statusClass} flex items-center gap-2`}>
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getEventColor(eventType) }}
                    ></div>
                    <span>{event.title}</span>
                </div>
            );
        }

        return (
            <div className={`${className} ${statusClass}`}>
                <div className="text-xs font-semibold">{event.title}</div>
            </div>
        );
    }, []);

    return (
        <div className="relative h-full">
            {/* Indicateur de chargement */}
            {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}

            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView={view}
                locale={frLocale}
                firstDay={settings.firstDay}
                businessHours={settings.businessHours}
                nowIndicator={settings.nowIndicator}
                snapDuration={settings.snapDuration}
                slotDuration={settings.slotDuration}
                slotLabelInterval={settings.slotLabelInterval}
                slotLabelFormat={settings.slotLabelFormat}
                slotMinTime={settings.slotMinTime}
                slotMaxTime={settings.slotMaxTime}
                headerToolbar={headerToolbar}
                events={formattedEvents}
                editable={editable}
                selectable={selectable}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }}
                height="auto"
                contentHeight="auto"
                expandRows={true}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                select={handleDateSelect}
                datesSet={handleDatesSet}
                eventContent={renderEvent}
                viewDidMount={handleViewChange}
            />
        </div>
    );
};

// Fonction utilitaire pour obtenir la couleur d'un événement en fonction de son type
function getEventColor(eventType: string): string {
    switch (eventType) {
        case CalendarEventType.LEAVE:
            return '#3B82F6'; // blue-500
        case CalendarEventType.DUTY:
            return '#10B981'; // emerald-500
        case CalendarEventType.ON_CALL:
            return '#6366F1'; // indigo-500
        case CalendarEventType.ASSIGNMENT:
            return '#EC4899'; // pink-500
        default:
            return '#9CA3AF'; // gray-400
    }
}

// Fonction utilitaire pour obtenir la couleur du texte d'un événement en fonction de son type
function getEventTextColor(eventType: string): string {
    return '#FFFFFF'; // white
} 