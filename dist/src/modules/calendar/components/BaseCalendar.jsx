var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import React, { useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { CalendarEventType } from '../types/event';
// Styles personnalisés pour le calendrier
import './calendar.css';
export var BaseCalendar = function (_a) {
    var events = _a.events, view = _a.view, settings = _a.settings, _b = _a.loading, loading = _b === void 0 ? false : _b, _c = _a.editable, editable = _c === void 0 ? false : _c, _d = _a.selectable, selectable = _d === void 0 ? false : _d, onEventClick = _a.onEventClick, onEventDrop = _a.onEventDrop, onEventResize = _a.onEventResize, onDateSelect = _a.onDateSelect, onViewChange = _a.onViewChange, onDateRangeChange = _a.onDateRangeChange, _e = _a.headerToolbar, headerToolbar = _e === void 0 ? {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    } : _e;
    // Formater les événements pour FullCalendar
    var formattedEvents = events.map(function (event) { return ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay !== undefined ? event.allDay : true,
        extendedProps: __assign({}, event),
        color: getEventColor(event.type),
        textColor: getEventTextColor(event.type),
        borderColor: getEventBorderColor(event.type, event.type === CalendarEventType.LEAVE ? event.status : undefined)
    }); });
    // Gestionnaire de clic sur un événement
    var handleEventClick = useCallback(function (info) {
        if (onEventClick) {
            var eventId = info.event.id;
            var eventType = info.event.extendedProps.type;
            onEventClick(eventId, eventType);
        }
    }, [onEventClick]);
    // Gestionnaire de déplacement d'un événement
    var handleEventDrop = useCallback(function (info) {
        if (onEventDrop) {
            var eventId = info.event.id;
            var newStart = info.event.start;
            var newEnd = info.event.end || info.event.start;
            onEventDrop(eventId, newStart, newEnd);
        }
    }, [onEventDrop]);
    // Gestionnaire de redimensionnement d'un événement
    var handleEventResize = useCallback(function (info) {
        if (onEventResize) {
            var eventId = info.event.id;
            var newStart = info.event.start;
            var newEnd = info.event.end;
            onEventResize(eventId, newStart, newEnd);
        }
    }, [onEventResize]);
    // Gestionnaire de sélection d'une plage de dates
    var handleDateSelect = useCallback(function (info) {
        if (onDateSelect) {
            onDateSelect(info.start, info.end, info.allDay);
        }
    }, [onDateSelect]);
    // Gestionnaire de changement de vue
    var handleViewChange = useCallback(function (info) {
        if (onViewChange) {
            var newView = info.view.type;
            onViewChange(newView);
        }
    }, [onViewChange]);
    // Gestionnaire de changement de plage de dates
    var handleDatesSet = useCallback(function (info) {
        if (onDateRangeChange) {
            onDateRangeChange(info.view.currentStart, info.view.currentEnd);
        }
    }, [onDateRangeChange]);
    // Personnaliser le rendu des événements
    var renderEvent = useCallback(function (info) {
        var event = info.event, view = info.view;
        var eventType = event.extendedProps.type;
        var status = event.extendedProps.status;
        var userName = event.extendedProps.user ?
            "".concat(event.extendedProps.user.prenom, " ").concat(event.extendedProps.user.nom) : '';
        // Classes CSS en fonction du type d'événement et du statut
        var statusClass = '';
        var statusIcon = '';
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
            return (<div className={"event-list-item ".concat(statusClass)}>
                    <div className="event-list-indicator" style={{ backgroundColor: getEventColor(eventType) }}></div>
                    <div className="event-list-content">
                        <span className="event-title">{event.title}</span>
                        {userName && <span className="event-user">{userName}</span>}
                    </div>
                    {statusIcon && <span className="event-status-icon">{statusIcon}</span>}
                </div>);
        }
        // Pour les vues grid
        return (<div className={"event-grid-item ".concat(statusClass)}>
                <div className="event-grid-content">
                    <div className="event-title">{event.title}</div>
                    {userName && <div className="event-user">{userName}</div>}
                </div>
                {statusIcon && <span className="event-status-icon">{statusIcon}</span>}
            </div>);
    }, []);
    return (<div className="calendar-container">
            {/* Indicateur de chargement */}
            {loading && (<div className="calendar-loading-overlay">
                    <div className="calendar-loading-spinner"></div>
                </div>)}

            <FullCalendar plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]} initialView={view} locale={frLocale} firstDay={settings.firstDay} businessHours={settings.businessHours} nowIndicator={settings.nowIndicator} snapDuration={settings.snapDuration} slotDuration={settings.slotDuration} slotLabelInterval={settings.slotLabelInterval} slotLabelFormat={settings.slotLabelFormat} slotMinTime={settings.slotMinTime} slotMaxTime={settings.slotMaxTime} headerToolbar={headerToolbar} events={formattedEvents} editable={editable} selectable={selectable} selectMirror={true} dayMaxEvents={true} weekends={true} eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }} height="auto" contentHeight="auto" expandRows={true} eventClick={handleEventClick} eventDrop={handleEventDrop} eventResize={handleEventResize} select={handleDateSelect} datesSet={handleDatesSet} eventContent={renderEvent} viewDidMount={handleViewChange} dayHeaderClassNames="calendar-day-header" dayHeaderFormat={{ weekday: 'short', day: 'numeric' }} allDayClassNames="calendar-all-day" dayCellClassNames="calendar-day-cell" moreLinkClassNames="calendar-more-link" nowIndicatorClassNames="calendar-now-indicator" eventClassNames="calendar-event" slotLabelClassNames="calendar-slot-label" slotLaneClassNames="calendar-slot-lane" buttonText={{
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
            list: 'Liste'
        }}/>
        </div>);
};
// Fonction utilitaire pour obtenir la couleur d'un événement en fonction de son type
function getEventColor(eventType) {
    switch (eventType) {
        case CalendarEventType.LEAVE:
            return 'rgba(59, 130, 246, 0.8)'; // blue-500 avec transparence
        case CalendarEventType.DUTY:
            return 'rgba(16, 185, 129, 0.8)'; // emerald-500 avec transparence
        case CalendarEventType.ON_CALL:
            return 'rgba(99, 102, 241, 0.8)'; // indigo-500 avec transparence
        case CalendarEventType.ASSIGNMENT:
            return 'rgba(236, 72, 153, 0.8)'; // pink-500 avec transparence
        default:
            return 'rgba(156, 163, 175, 0.8)'; // gray-400 avec transparence
    }
}
// Fonction utilitaire pour obtenir la couleur du texte d'un événement
function getEventTextColor(eventType) {
    return '#FFFFFF'; // white pour tous les types
}
// Fonction utilitaire pour obtenir la couleur de bordure des événements (indicateur de statut)
function getEventBorderColor(eventType, status) {
    if (!status)
        return getEventColor(eventType);
    switch (status) {
        case 'APPROVED':
            return '#10B981'; // emerald-500
        case 'PENDING':
            return '#F59E0B'; // amber-500
        case 'REJECTED':
            return '#EF4444'; // red-500
        case 'CANCELLED':
            return '#6B7280'; // gray-500
        default:
            return getEventColor(eventType);
    }
}
