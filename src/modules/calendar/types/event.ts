import { User } from '../../../types/user';

// Types d'événements dans le calendrier
export enum CalendarEventType {
    ASSIGNMENT = 'ASSIGNMENT',
    LEAVE = 'LEAVE',
    DUTY = 'DUTY',
    ON_CALL = 'ON_CALL',
    TRAINING = 'TRAINING',
    MEETING = 'MEETING',
    HOLIDAY = 'HOLIDAY',
    OTHER = 'OTHER'
}

// Types de vues du calendrier
export enum CalendarViewType {
    MONTH = 'dayGridMonth',
    WEEK = 'timeGridWeek',
    DAY = 'timeGridDay',
    LIST = 'listWeek',
    TIMELINE = 'timelineWeek'
}

// Base pour tous les événements du calendrier
export interface BaseCalendarEvent {
    id: string;
    title: string;
    start: string; // ISO date string
    end: string; // ISO date string
    description?: string;
    type: CalendarEventType;
    allDay?: boolean;
    color?: string;
}

// Événement d'affectation
export interface AssignmentEvent extends BaseCalendarEvent {
    type: CalendarEventType.ASSIGNMENT;
    locationId?: string;
    locationName?: string;
    teamId?: string;
    teamName?: string;
    specialtyId?: string;
    specialtyName?: string;
}

// Événement de congé
export interface LeaveEvent extends BaseCalendarEvent {
    type: CalendarEventType.LEAVE;
    leaveType?: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    countedDays?: number;
}

// Événement de garde
export interface DutyEvent extends BaseCalendarEvent {
    type: CalendarEventType.DUTY;
    locationId?: string;
    locationName?: string;
}

// Événement d'astreinte
export interface OnCallEvent extends BaseCalendarEvent {
    type: CalendarEventType.ON_CALL;
    locationId?: string;
    locationName?: string;
}

// Événement de formation
export interface TrainingEvent extends BaseCalendarEvent {
    type: CalendarEventType.TRAINING;
    trainingId?: string;
    trainingName?: string;
}

// Événement de réunion
export interface MeetingEvent extends BaseCalendarEvent {
    type: CalendarEventType.MEETING;
    meetingId?: string;
    meetingRoom?: string;
    attendees?: string[];
}

// Événement de jour férié
export interface HolidayEvent extends BaseCalendarEvent {
    type: CalendarEventType.HOLIDAY;
    isNational: boolean;
    regions?: string[];
    country?: string;
    isWorkingDay?: boolean;
}

// Événement d'autre type
export interface OtherEvent extends BaseCalendarEvent {
    type: CalendarEventType.OTHER;
}

// Type union pour tous les types d'événements
export type AnyCalendarEvent =
    | AssignmentEvent
    | LeaveEvent
    | DutyEvent
    | OnCallEvent
    | TrainingEvent
    | MeetingEvent
    | HolidayEvent
    | OtherEvent;

// Filtres du calendrier
export interface CalendarFilters {
    eventTypes: CalendarEventType[];
    userIds?: string[];
    userRoles?: string[];
    leaveTypes?: string[];
    leaveStatuses?: string[];
    locationIds?: string[];
    teamIds?: string[];
    specialtyIds?: string[];
    searchTerm?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
}

// Format d'export
export enum CalendarExportFormat {
    PDF = 'PDF',
    EXCEL = 'EXCEL',
    CSV = 'CSV',
    ICS = 'ICS'
}

// Options d'export
export interface ExportOptions {
    format: CalendarExportFormat;
    fileName?: string;
    includeAllEvents: boolean;
    eventTypes?: CalendarEventType[];
    dateRange?: {
        start: Date;
        end: Date;
    };
}

// Paramètres du calendrier
export interface CalendarSettings {
    locale: string;
    firstDay: number;
    businessHours: {
        startTime: string;
        endTime: string;
        daysOfWeek: number[];
    };
    nowIndicator: boolean;
    snapDuration: string;
    slotDuration: string;
    slotLabelInterval: string;
    slotLabelFormat: unknown;
    slotMinTime: string;
    slotMaxTime: string;
}

export interface ColorScheme {
    leave: string;
    duty: string;
    onCall: string;
    attribution: string;
    holiday: string;
    default: string;
    textColor: string;
    approved: string;
    pending: string;
    rejected: string;
}

export interface UserCalendarSettings {
    startWeekOn: 'monday' | 'sunday';
    showWeekends: boolean;
    showRejectedLeaves: boolean;
    showPublicHolidays: boolean;
    timeFormat: '12h' | '24h';
    colorScheme: ColorScheme;
} 