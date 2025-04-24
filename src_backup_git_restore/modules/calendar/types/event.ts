import { User } from '../../../types/user';

// Types d'événements dans le calendrier
export enum CalendarEventType {
    LEAVE = 'LEAVE',
    DUTY = 'DUTY',
    ON_CALL = 'ON_CALL',
    ASSIGNMENT = 'ASSIGNMENT'
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
export interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay?: boolean;
    type: CalendarEventType;
    userId: string;
    user?: User;
    description?: string;
}

// Événement de congé
export interface LeaveCalendarEvent extends CalendarEvent {
    type: CalendarEventType.LEAVE;
    leaveId: string;
    leaveType: string;
    status: string;
    countedDays: number;
}

// Événement de garde
export interface DutyCalendarEvent extends CalendarEvent {
    type: CalendarEventType.DUTY;
    dutyId: string;
    locationId?: string;
    locationName?: string;
}

// Événement d'astreinte
export interface OnCallCalendarEvent extends CalendarEvent {
    type: CalendarEventType.ON_CALL;
    onCallId: string;
    locationId?: string;
    locationName?: string;
}

// Événement d'affectation
export interface AssignmentCalendarEvent extends CalendarEvent {
    type: CalendarEventType.ASSIGNMENT;
    assignmentId: string;
    locationId?: string;
    locationName?: string;
    teamId?: string;
    teamName?: string;
    specialtyId?: string;
    specialtyName?: string;
}

// Type union pour tous les types d'événements
export type AnyCalendarEvent =
    | LeaveCalendarEvent
    | DutyCalendarEvent
    | OnCallCalendarEvent
    | AssignmentCalendarEvent;

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
    slotLabelFormat: any;
    slotMinTime: string;
    slotMaxTime: string;
} 