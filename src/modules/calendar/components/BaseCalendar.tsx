import React, { useCallback, useEffect, useState } from 'react';
import { logger } from "../../../lib/logger";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { EventInput } from '@fullcalendar/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AnyCalendarEvent,
    CalendarEventType,
    CalendarSettings,
    CalendarViewType,
    UserCalendarSettings
} from '../types/event';
import { useCalendarStore } from '../store/calendrierStore';
import { EventRenderer } from './events/EventRenderer';
import { CalendarLoadingOverlay } from './ui/CalendarLoadingOverlay';
import DayGridView from './views/DayGridView';
import WeekGridView from './views/WeekGridView';
import ListView from './views/ListView';
import { holidayCalendarService } from '../services/holidayService';
import { format } from 'date-fns';

// Styles personnalisés pour le calendrier
import './calendrier.css';

interface BaseCalendarProps {
    events?: AnyCalendarEvent[];
    view?: CalendarViewType;
    settings?: CalendarSettings;
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
    navigateToPrevious?: () => void;
    navigateToNext?: () => void;
    navigateToToday?: () => void;
}

export const BaseCalendar: React.FC<BaseCalendarProps> = ({
    events: propEvents = [],
    view: propView = CalendarViewType.MONTH,
    settings: propSettings = {
        businessHours: true,
        nowIndicator: true,
        snapDuration: '00:15:00',
        slotDuration: '00:30:00',
        slotLabelInterval: '01:00:00',
        slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
        slotMinTime: '00:00:00',
        slotMaxTime: '24:00:00'
    },
    userSettings: propUserSettings,
    loading: propLoading = false,
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
    },
    navigateToPrevious = () => { },
    navigateToNext = () => { },
    navigateToToday = () => { }
}) => {
    // Utiliser les données du store ou des props selon ce qui est disponible
    const {
        events: storeEvents,
        loading: storeLoading,
        view: storeView,
        settings: storeSettings,
        userSettings: storeUserSettings
    } = useCalendarStore();

    // Priorité aux props sur les données du store
    const finalEvents = propEvents || storeEvents;
    const finalLoading = propLoading || storeLoading;
    const finalView = propView || storeView;
    const finalSettings = propSettings || storeSettings;
    const finalUserSettings = propUserSettings || storeUserSettings;

    // Filtrer les événements en fonction des paramètres utilisateur
    const filteredEvents = finalEvents.filter(event => {
        // Ne pas afficher les congés refusés si le paramètre est désactivé
        if (!finalUserSettings?.showRejectedLeaves &&
            event.type === CalendarEventType.LEAVE &&
            'status' in event &&
            event.status === 'REJECTED') {
            return false;
        }
        return true;
    });

    // Ajout de l'état pour les jours fériés
    const [holidayEvents, setHolidayEvents] = useState<AnyCalendarEvent[]>([]);
    const [holidaysLoading, setHolidaysLoading] = useState(false);

    // Fonction pour charger les jours fériés
    const loadHolidays = useCallback(async (start: Date, end: Date) => {
        if (!finalUserSettings?.showPublicHolidays) {
            setHolidayEvents([]);
            return;
        }

        setHolidaysLoading(true);
        try {
            const startDateStr = format(start, 'yyyy-MM-dd');
            const endDateStr = format(end, 'yyyy-MM-dd');

            const holidays = await holidayCalendarService.getHolidayEvents(startDateStr, endDateStr);
            setHolidayEvents(holidays);
        } catch (error: unknown) {
            logger.error('Erreur lors du chargement des jours fériés:', error instanceof Error ? error : new Error(String(error)));
            setHolidayEvents([]);
        } finally {
            setHolidaysLoading(false);
        }
    }, [finalUserSettings?.showPublicHolidays]);

    // Mise à jour du gestionnaire de changement de plage de dates
    const handleDatesSet = useCallback((info: unknown) => {
        if (onDateRangeChange) {
            onDateRangeChange(info.view.currentStart, info.view.currentEnd);
        }

        // Charger les jours fériés pour la nouvelle plage de dates
        loadHolidays(info.view.currentStart, info.view.currentEnd);
    }, [onDateRangeChange, loadHolidays]);

    // Combiner les événements réguliers avec les jours fériés
    const allEvents = [...filteredEvents, ...holidayEvents];

    // Formater les événements pour FullCalendar
    const formattedEvents = useCallback(() => {
        return allEvents.map(event => ({
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end,
            allDay: event.allDay,
            backgroundColor: getEventBackgroundColor(event, finalUserSettings?.colorScheme),
            borderColor: getEventBorderColor(event, finalUserSettings?.colorScheme),
            textColor: finalUserSettings?.colorScheme?.textColor || '#000000',
            extendedProps: { ...event }
        }));
    }, [allEvents, finalUserSettings]);

    // Gestionnaire de clic sur un événement
    const handleEventClick = useCallback((info: unknown) => {
        if (onEventClick && info.event.extendedProps) {
            onEventClick(info.event.extendedProps);
        }
    }, [onEventClick]);

    // Gestionnaire de déplacement d'un événement
    const handleEventDrop = useCallback((info: unknown) => {
        if (onEventDrop) {
            const eventId = info.event.id;
            const newStart = info.event.start;
            const newEnd = info.event.end || info.event.start;
            onEventDrop(eventId, newStart, newEnd);
        }
    }, [onEventDrop]);

    // Gestionnaire de redimensionnement d'un événement
    const handleEventResize = useCallback((info: unknown) => {
        if (onEventResize) {
            const eventId = info.event.id;
            const newStart = info.event.start;
            const newEnd = info.event.end;
            onEventResize(eventId, newStart, newEnd);
        }
    }, [onEventResize]);

    // Gestionnaire de sélection d'une plage de dates
    const handleDateSelect = useCallback((info: unknown) => {
        if (onDateSelect) {
            onDateSelect(info.start, info.end);
        }
    }, [onDateSelect]);

    // Gestionnaire de changement de vue
    const handleViewChange = useCallback((info: unknown) => {
        if (onViewChange) {
            const newView = info.view.type as CalendarViewType;
            onViewChange(newView);
        }
    }, [onViewChange]);

    // Gestionnaire de navigation au clavier
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const calendar = document.querySelector('.fc');
        if (!calendar) return;

        switch (event.key) {
            case 'ArrowLeft':
                navigateToPrevious();
                break;
            case 'ArrowRight':
                navigateToNext();
                break;
            case 'ArrowUp':
                // Navigation vers la semaine précédente
                const currentDate = new Date();
                currentDate.setDate(currentDate.getDate() - 7);
                onDateRangeChange?.(currentDate, new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
                break;
            case 'ArrowDown':
                // Navigation vers la semaine suivante
                const nextDate = new Date();
                nextDate.setDate(nextDate.getDate() + 7);
                onDateRangeChange?.(nextDate, new Date(nextDate.getTime() + 7 * 24 * 60 * 60 * 1000));
                break;
            case ' ':
            case 'Enter':
                // Sélection de la date actuelle
                navigateToToday();
                break;
        }
    }, [navigateToPrevious, navigateToNext, navigateToToday, onDateRangeChange]);

    // Gestionnaire de raccourcis clavier
    const handleShortcuts = useCallback((event: KeyboardEvent) => {
        // Ignorer si l'utilisateur est en train de taper dans un champ de saisie
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
            return;
        }

        // Vérifier si la touche Ctrl/Cmd est pressée
        const isCtrlPressed = event.ctrlKey || event.metaKey;

        if (isCtrlPressed) {
            switch (event.key.toLowerCase()) {
                case 'n':
                    // Nouvel événement
                    event.preventDefault();
                    onDateSelect?.(new Date(), new Date());
                    break;
                case 'f':
                    // Focus sur la recherche
                    event.preventDefault();
                    const searchInput = document.querySelector('.calendar-search-input');
                    if (searchInput instanceof HTMLElement) {
                        searchInput.focus();
                    }
                    break;
                case 'h':
                    // Afficher/masquer les événements
                    event.preventDefault();
                    const eventTypes = document.querySelectorAll('.calendar-event-type');
                    eventTypes.forEach((type) => {
                        const checkbox = type.querySelector('input[type="checkbox"]');
                        if (checkbox instanceof HTMLInputElement) {
                            checkbox.checked = !checkbox.checked;
                            checkbox.dispatchEvent(new Event('change'));
                        }
                    });
                    break;
                case 't':
                    // Aller à aujourd'hui
                    event.preventDefault();
                    navigateToToday();
                    break;
            }
        }
    }, [onDateSelect, navigateToToday]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keydown', handleShortcuts);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keydown', handleShortcuts);
        };
    }, [handleKeyDown, handleShortcuts]);

    // Gestionnaire de redimensionnement pour les breakpoints
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 640);
            setIsTablet(width >= 640 && width < 1024);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Configuration responsive du calendrier
    const calendarConfig = {
        headerToolbar: isMobile
            ? {
                left: 'prev,next',
                center: 'title',
                right: 'today'
            }
            : headerToolbar,
        height: isMobile ? 'auto' : 'auto',
        contentHeight: isMobile ? 'auto' : 'auto',
        aspectRatio: isMobile ? 1.1 : isTablet ? 1.4 : 1.8,
        dayMaxEventRows: isMobile ? 2 : undefined,
        views: {
            timeGridWeek: {
                titleFormat: isMobile ? { month: 'short', day: 'numeric' } : { month: 'long', day: 'numeric' },
                slotLabelFormat: isMobile ? { hour: '2-digit', minute: '2-digit', hour12: false } : { hour: '2-digit', minute: '2-digit', hour12: false }
            },
            timeGridDay: {
                titleFormat: isMobile ? { month: 'short', day: 'numeric' } : { month: 'long', day: 'numeric' },
                slotLabelFormat: isMobile ? { hour: '2-digit', minute: '2-digit', hour12: false } : { hour: '2-digit', minute: '2-digit', hour12: false }
            }
        }
    };

    // Configuration des tooltips
    const tooltips = {
        newEvent: 'Nouvel événement (Ctrl/Cmd + N)',
        search: 'Rechercher (Ctrl/Cmd + F)',
        toggleEvents: 'Afficher/Masquer les événements (Ctrl/Cmd + H)',
        today: 'Aller à aujourd\'hui (Ctrl/Cmd + T)',
        previous: 'Mois précédent (←)',
        next: 'Mois suivant (→)',
        up: 'Semaine précédente (↑)',
        down: 'Semaine suivante (↓)'
    };

    // Rendu conditionnel de la vue
    const renderView = () => {
        switch (finalView) {
            case CalendarViewType.DAY:
                return (
                    <DayGridView
                        events={finalEvents}
                        date={new Date()}
                        onEventClick={onEventClick}
                    />
                );
            case CalendarViewType.WEEK:
                return (
                    <WeekGridView
                        events={finalEvents}
                        startDate={new Date()}
                        onEventClick={onEventClick}
                    />
                );
            case CalendarViewType.LIST:
                return (
                    <ListView
                        events={finalEvents}
                        startDate={new Date()}
                        endDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
                        onEventClick={onEventClick}
                    />
                );
            default:
                return (
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                        initialView={finalView}
                        locale={frLocale}
                        firstDay={finalUserSettings?.startWeekOn === 'monday' ? 1 : 0}
                        businessHours={finalSettings.businessHours}
                        nowIndicator={finalSettings.nowIndicator}
                        snapDuration={finalSettings.snapDuration}
                        slotDuration={finalSettings.slotDuration}
                        slotLabelInterval={finalSettings.slotLabelInterval}
                        slotLabelFormat={finalSettings.slotLabelFormat}
                        slotMinTime={finalSettings.slotMinTime}
                        slotMaxTime={finalSettings.slotMaxTime}
                        headerToolbar={headerToolbar}
                        events={formattedEvents()}
                        editable={editable}
                        selectable={selectable}
                        selectMirror={true}
                        dayMaxEvents={finalView === CalendarViewType.MONTH ? true : undefined}
                        weekends={finalUserSettings?.showWeekends ?? true}
                        eventTimeFormat={{
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: finalUserSettings?.timeFormat === '12h'
                        }}
                        height="auto"
                        contentHeight="auto"
                        aspectRatio={window?.innerWidth > 1024 ? 1.8 : window?.innerWidth > 640 ? 1.4 : 1.1}
                        expandRows={true}
                        eventContent={EventRenderer}
                        eventClick={handleEventClick}
                        eventDrop={handleEventDrop}
                        eventResize={handleEventResize}
                        select={handleDateSelect}
                        viewDidMount={handleViewChange}
                        datesSet={handleDatesSet}
                        stickyHeaderDates={true}
                        dayMaxEventRows={window?.innerWidth < 640 ? 2 : undefined}
                        moreLinkClick="week"
                    />
                );
        }
    };

    return (
        <motion.div
            className="calendar-container relative w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            tabIndex={0}
            role="application"
            aria-label="Calendrier"
        >
            {/* Indicateur de chargement */}
            <AnimatePresence>
                {finalLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <CalendarLoadingOverlay />
                    </motion.div>
                )}
            </AnimatePresence>

            {renderView()}

            <div className="calendar-tooltips">
                <div className="tooltip-group">
                    <button
                        className="tooltip-button"
                        onClick={() => onDateSelect?.(new Date(), new Date())}
                        title={tooltips.newEvent}
                    >
                        <span className="tooltip-icon">+</span>
                        <span className="tooltip-text">{tooltips.newEvent}</span>
                    </button>

                    <button
                        className="tooltip-button"
                        onClick={() => {
                            const searchInput = document.querySelector('.calendar-search-input');
                            if (searchInput instanceof HTMLElement) {
                                searchInput.focus();
                            }
                        }}
                        title={tooltips.search}
                    >
                        <span className="tooltip-icon">🔍</span>
                        <span className="tooltip-text">{tooltips.search}</span>
                    </button>

                    <button
                        className="tooltip-button"
                        onClick={() => {
                            const eventTypes = document.querySelectorAll('.calendar-event-type');
                            eventTypes.forEach((type) => {
                                const checkbox = type.querySelector('input[type="checkbox"]');
                                if (checkbox instanceof HTMLInputElement) {
                                    checkbox.checked = !checkbox.checked;
                                    checkbox.dispatchEvent(new Event('change'));
                                }
                            });
                        }}
                        title={tooltips.toggleEvents}
                    >
                        <span className="tooltip-icon">👁️</span>
                        <span className="tooltip-text">{tooltips.toggleEvents}</span>
                    </button>

                    <button
                        className="tooltip-button"
                        onClick={navigateToToday}
                        title={tooltips.today}
                    >
                        <span className="tooltip-icon">📅</span>
                        <span className="tooltip-text">{tooltips.today}</span>
                    </button>
                </div>
            </div>

            <style jsx>{`
                .calendar-tooltips {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 1000;
                }

                .tooltip-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .tooltip-button {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .tooltip-button:hover {
                    background: #f8fafc;
                    transform: translateY(-2px);
                }

                .tooltip-icon {
                    font-size: 1.2em;
                }

                .tooltip-text {
                    font-size: 0.9em;
                    color: #64748b;
                }

                @media (max-width: 640px) {
                    .calendar-tooltips {
                        bottom: 10px;
                        right: 10px;
                    }

                    .tooltip-button {
                        padding: 6px 10px;
                    }

                    .tooltip-text {
                        display: none;
                    }
                }
            `}</style>
        </motion.div>
    );
};

// Mise à jour des fonctions getEventBackgroundColor et getEventBorderColor
const getEventBackgroundColor = (
    event: AnyCalendarEvent,
    colorScheme?: unknown
): string => {
    switch (event.type) {
        case CalendarEventType.LEAVE:
            return colorScheme?.leave || '#4F46E5';
        case CalendarEventType.DUTY:
            return colorScheme?.duty || '#EF4444';
        case CalendarEventType.ON_CALL:
            return colorScheme?.onCall || '#F59E0B';
        case CalendarEventType.ASSIGNMENT:
            return colorScheme?.attribution || '#10B981';
        case CalendarEventType.HOLIDAY:
            return colorScheme?.holiday || '#8B5CF6';
        default:
            return colorScheme?.default || '#6B7280';
    }
};

const getEventBorderColor = (
    event: AnyCalendarEvent,
    colorScheme?: unknown
): string => {
    switch (event.type) {
        case CalendarEventType.LEAVE:
            return colorScheme?.leave || '#4338CA';
        case CalendarEventType.DUTY:
            return colorScheme?.duty || '#B91C1C';
        case CalendarEventType.ON_CALL:
            return colorScheme?.onCall || '#D97706';
        case CalendarEventType.ASSIGNMENT:
            return colorScheme?.attribution || '#059669';
        case CalendarEventType.HOLIDAY:
            return colorScheme?.holiday || '#7C3AED';
        default:
            return colorScheme?.default || '#4B5563';
    }
}; 