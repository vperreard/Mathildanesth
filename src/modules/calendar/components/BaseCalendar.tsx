import React, { useCallback, FC } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { EventInput } from '@fullcalendar/core';
import {
    AnyCalendarEvent,
    CalendarEventType,
    CalendarSettings,
    CalendarViewType,
    UserCalendarSettings,
    CalendarEvent,
    ColorScheme
} from '../types/event';

// Styles personnalisés pour le calendrier
import './calendar.css';

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
    options?: Partial<CalendarSettings>;
    userSettings?: UserCalendarSettings;
    loading?: boolean;
    editable?: boolean;
    selectable?: boolean;
    onEventClick?: (event: AnyCalendarEvent) => void;
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
}

export const BaseCalendar: FC<BaseCalendarProps> = ({
    events,
    view,
    settings,
    options,
    userSettings,
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
    // Filtrer les événements en fonction des paramètres utilisateur
    const filteredEvents = events.filter(event => {
        // Ne pas afficher les congés refusés si le paramètre est désactivé
        if (!userSettings?.showRejectedLeaves &&
            event.type === CalendarEventType.LEAVE &&
            'status' in event &&
            event.status === 'REJECTED') {
            return false;
        }
        return true;
    });

    // Formater les événements pour FullCalendar
    const formattedEvents = filteredEvents.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        backgroundColor: getEventBackgroundColor(event, userSettings?.colorScheme),
        borderColor: getEventBorderColor(event, userSettings?.colorScheme),
        textColor: userSettings?.colorScheme?.textColor || '#000000',
        extendedProps: { originalEvent: event }
    }));

    // Gestionnaire de clic sur un événement
    const handleEventClick = useCallback((info: any) => {
        if (onEventClick && info.event.extendedProps) {
            onEventClick(info.event.extendedProps as AnyCalendarEvent);
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
            onDateSelect(info.start, info.end);
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
        const userName = event.extendedProps.user ?
            `${event.extendedProps.user.prenom} ${event.extendedProps.user.nom}` : '';

        // Classes CSS en fonction du type d'événement et du statut
        let statusClass = '';
        let statusIcon = '';

        if (status) {
            switch (status) {
                case 'APPROVED':
                    statusClass = 'event-approved';
                    statusIcon = '✓';
                    break;
                case 'PENDING':
                    statusClass = 'event-pending';
                    statusIcon = '⧖';
                    break;
                case 'REJECTED':
                    statusClass = 'event-rejected';
                    statusIcon = '✕';
                    break;
                case 'CANCELLED':
                    statusClass = 'event-cancelled';
                    statusIcon = '⊘';
                    break;
                default:
                    statusClass = '';
            }
        }

        // Contenu différent selon la vue
        if (view.type === 'listWeek') {
            return (
                <div className={`event-list-item ${statusClass}`}>
                    <div className="event-list-indicator" style={{ backgroundColor: getEventBackgroundColor(event, userSettings?.colorScheme) }}></div>
                    <div className="event-list-content">
                        <span className="event-title">{event.title}</span>
                        {userName && <span className="event-user">{userName}</span>}
                    </div>
                    {statusIcon && <span className="event-status-icon">{statusIcon}</span>}
                </div>
            );
        }

        // Pour les vues grid
        return (
            <div className={`event-grid-item ${statusClass}`}>
                <div className="event-grid-content">
                    <div className="event-title">{event.title}</div>
                    {userName && <div className="event-user">{userName}</div>}
                </div>
                {statusIcon && <span className="event-status-icon">{statusIcon}</span>}
            </div>
        );
    }, [userSettings]);

    return (
        <div className="calendar-container">
            {/* Indicateur de chargement */}
            {loading && (
                <div className="calendar-loading-overlay">
                    <div className="calendar-loading-spinner"></div>
                </div>
            )}

            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView={view}
                locale={frLocale}
                firstDay={userSettings?.startWeekOn === 'monday' ? 1 : 0}
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
                weekends={userSettings?.showWeekends ?? true}
                eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: userSettings?.timeFormat === '12h'
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
                dayHeaderClassNames="calendar-day-header"
                dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
                allDayClassNames="calendar-all-day"
                dayCellClassNames="calendar-day-cell"
                moreLinkClassNames="calendar-more-link"
                nowIndicatorClassNames="calendar-now-indicator"
                eventClassNames="calendar-event"
                slotLabelClassNames="calendar-slot-label"
                slotLaneClassNames="calendar-slot-lane"
                buttonText={{
                    today: "Aujourd'hui",
                    month: 'Mois',
                    week: 'Semaine',
                    day: 'Jour',
                    list: 'Liste'
                }}
                {...options}
            />
        </div>
    );
};

const formatEvents = (
    events: AnyCalendarEvent[],
    userSettings?: UserCalendarSettings
): EventInput[] => {
    return events
        .filter(event => {
            if (!userSettings?.showRejectedLeaves &&
                event.type === CalendarEventType.LEAVE &&
                'status' in event &&
                event.status === 'REJECTED') {
                return false;
            }
            return true;
        })
        .map((event): EventInput => ({
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end,
            allDay: event.allDay,
            backgroundColor: getEventBackgroundColor(event, userSettings?.colorScheme),
            borderColor: getEventBorderColor(event, userSettings?.colorScheme),
            textColor: userSettings?.colorScheme?.textColor || '#000000',
            extendedProps: { originalEvent: event }
        }));
};

const getEventBackgroundColor = (
    event: AnyCalendarEvent,
    colorScheme?: ColorScheme
): string => {
    if (!colorScheme) return '#E2E8F0';

    switch (event.type) {
        case CalendarEventType.LEAVE:
            return colorScheme.leave;
        case CalendarEventType.DUTY:
            return colorScheme.duty;
        case CalendarEventType.ON_CALL:
            return colorScheme.onCall;
        case CalendarEventType.ASSIGNMENT:
            return colorScheme.assignment;
        default:
            return colorScheme.default;
    }
};

const getEventBorderColor = (
    event: AnyCalendarEvent,
    colorScheme?: ColorScheme
): string => {
    if (!colorScheme) return '#CBD5E0';

    if (event.type === CalendarEventType.LEAVE && 'status' in event) {
        switch (event.status) {
            case 'APPROVED':
                return colorScheme.approved;
            case 'PENDING':
                return colorScheme.pending;
            case 'REJECTED':
                return colorScheme.rejected;
            default:
                return colorScheme.default;
        }
    }

    return colorScheme.default;
}; 