/**
 * Types d'événements du système pour la communication entre modules
 */
export enum EventType {
    // Événements liés aux congés
    LEAVE_CREATED = 'leave:created',
    LEAVE_UPDATED = 'leave:updated',
    LEAVE_DELETED = 'leave:deleted',
    LEAVE_STATUS_CHANGED = 'leave:statusChanged',
    LEAVE_APPROVED = 'leave:approved',
    LEAVE_REJECTED = 'leave:rejected',
    LEAVE_CANCELLED = 'leave:cancelled',
    RECURRING_LEAVE_CREATED = 'leave:recurring:created',
    RECURRING_LEAVE_UPDATED = 'leave:recurring:updated',

    // Événements liés au planning
    PLANNING_CREATED = 'planning:created',
    PLANNING_UPDATED = 'planning:updated',
    PLANNING_DELETED = 'planning:deleted',
    PLANNING_PUBLISHED = 'planning:published',
    PLANNING_EVENT_ADDED = 'planning:event:added',
    PLANNING_EVENT_UPDATED = 'planning:event:updated',
    PLANNING_EVENT_REMOVED = 'planning:event:removed',
    PLANNING_CONFLICT_DETECTED = 'planning:conflict:detected',
    AVAILABILITY_CHANGED = 'planning:availability:changed',
    TEAM_AVAILABILITY_CRITICAL = 'planning:availability:critical',

    // Événements liés aux quotas
    QUOTA_UPDATED = 'quota:updated',
    QUOTA_TRANSFERRED = 'quota:transferred',
    QUOTA_LOW = 'quota:low',

    // Événements liés aux absences
    ABSENCE_CREATED = 'absence:created',
    ABSENCE_UPDATED = 'absence:updated',
    ABSENCE_DELETED = 'absence:deleted',

    // Événements liés au dashboard
    DASHBOARD_REFRESH = 'dashboard:refresh',
    REPORT_GENERATED = 'report:generated'
}

/**
 * Interface de base pour tous les événements
 */
export interface BaseEvent {
    type: EventType;
    timestamp: Date;
    sourceModule: string;
}

/**
 * Interface pour les événements liés aux congés
 */
export interface LeaveEvent extends BaseEvent {
    leaveId: string;
    userId: string;
    details?: any;
}

/**
 * Interface pour les événements liés au planning
 */
export interface PlanningEvent extends BaseEvent {
    planningId?: string;
    userId?: string;
    teamId?: string;
    period?: {
        startDate: Date;
        endDate: Date;
    };
    details?: any;
}

/**
 * Interface pour les événements liés aux quotas
 */
export interface QuotaEvent extends BaseEvent {
    userId: string;
    leaveType: string;
    amount: number;
    remainingDays?: number;
    details?: any;
}

/**
 * Interface pour les événements liés aux absences
 */
export interface AbsenceEvent extends BaseEvent {
    absenceId: string;
    userId: string;
    details?: any;
}

/**
 * Interface pour les événements liés au dashboard
 */
export interface DashboardEvent extends BaseEvent {
    dashboardId?: string;
    filter?: any;
    details?: any;
}

/**
 * Type d'union pour tous les types d'événements
 */
export type AppEvent =
    | LeaveEvent
    | PlanningEvent
    | QuotaEvent
    | AbsenceEvent
    | DashboardEvent; 