export type CalendarTab = 'collective' | 'personal' | 'allocation';

export interface CalendarEvent {
    id: string;
    type: string;
    startDate: Date;
    endDate: Date;
    leaveType?: string;
    status?: string;
    comment?: string;
    userId?: string;
}