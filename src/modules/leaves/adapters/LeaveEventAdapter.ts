import { Leave, LeaveStatus } from '../types/leave';
import eventService from '../../../core/events/EventService';
import { EventType, LeaveEvent } from '../../../core/events/EventTypes';

/**
 * Adaptateur qui fait le lien entre le module de congés et le système d'événements.
 * Cette classe se charge de convertir les actions du module de congés en événements
 * et de les publier dans le système d'événements centralisé.
 */
export class LeaveEventAdapter {
    private static instance: LeaveEventAdapter;
    private readonly sourceModule = 'leaves';

    private constructor() { }

    /**
     * Obtenir l'instance unique de l'adaptateur
     */
    public static getInstance(): LeaveEventAdapter {
        if (!LeaveEventAdapter.instance) {
            LeaveEventAdapter.instance = new LeaveEventAdapter();
        }
        return LeaveEventAdapter.instance;
    }

    /**
     * Émet un événement lors de la création d'un congé
     */
    public emitLeaveCreated(leave: Leave): void {
        const event: LeaveEvent = {
            type: EventType.LEAVE_CREATED,
            timestamp: new Date(),
            sourceModule: this.sourceModule,
            leaveId: leave.id,
            userId: leave.userId,
            details: {
                startDate: leave.startDate,
                endDate: leave.endDate,
                type: leave.type,
                status: leave.status,
                countedDays: leave.countedDays,
                isRecurring: leave.isRecurring || false
            }
        };

        eventService.publish(event);
    }

    /**
     * Émet un événement lors de la mise à jour d'un congé
     */
    public emitLeaveUpdated(leave: Leave, previousStatus?: LeaveStatus): void {
        const event: LeaveEvent = {
            type: EventType.LEAVE_UPDATED,
            timestamp: new Date(),
            sourceModule: this.sourceModule,
            leaveId: leave.id,
            userId: leave.userId,
            details: {
                startDate: leave.startDate,
                endDate: leave.endDate,
                type: leave.type,
                status: leave.status,
                countedDays: leave.countedDays,
                previousStatus,
                isRecurring: leave.isRecurring || false
            }
        };

        eventService.publish(event);

        // Si le statut a changé, émettre également un événement de changement de statut
        if (previousStatus && previousStatus !== leave.status) {
            this.emitLeaveStatusChanged(leave, previousStatus);
        }
    }

    /**
     * Émet un événement lors de la suppression d'un congé
     */
    public emitLeaveDeleted(leave: Leave): void {
        const event: LeaveEvent = {
            type: EventType.LEAVE_DELETED,
            timestamp: new Date(),
            sourceModule: this.sourceModule,
            leaveId: leave.id,
            userId: leave.userId,
            details: {
                startDate: leave.startDate,
                endDate: leave.endDate,
                type: leave.type,
                status: leave.status
            }
        };

        eventService.publish(event);
    }

    /**
     * Émet un événement lors du changement de statut d'un congé
     */
    public emitLeaveStatusChanged(leave: Leave, previousStatus: LeaveStatus): void {
        const event: LeaveEvent = {
            type: EventType.LEAVE_STATUS_CHANGED,
            timestamp: new Date(),
            sourceModule: this.sourceModule,
            leaveId: leave.id,
            userId: leave.userId,
            details: {
                status: leave.status,
                previousStatus,
                startDate: leave.startDate,
                endDate: leave.endDate,
                type: leave.type
            }
        };

        eventService.publish(event);

        // Émettre des événements spécifiques selon le nouveau statut
        switch (leave.status) {
            case LeaveStatus.APPROVED:
                this.emitLeaveApproved(leave);
                break;
            case LeaveStatus.REJECTED:
                this.emitLeaveRejected(leave);
                break;
            case LeaveStatus.CANCELLED:
                this.emitLeaveCancelled(leave);
                break;
        }
    }

    /**
     * Émet un événement lors de l'approbation d'un congé
     */
    public emitLeaveApproved(leave: Leave): void {
        const event: LeaveEvent = {
            type: EventType.LEAVE_APPROVED,
            timestamp: new Date(),
            sourceModule: this.sourceModule,
            leaveId: leave.id,
            userId: leave.userId,
            details: {
                startDate: leave.startDate,
                endDate: leave.endDate,
                type: leave.type,
                countedDays: leave.countedDays,
                approverId: leave.approvedBy
            }
        };

        eventService.publish(event);
    }

    /**
     * Émet un événement lors du rejet d'un congé
     */
    public emitLeaveRejected(leave: Leave): void {
        const event: LeaveEvent = {
            type: EventType.LEAVE_REJECTED,
            timestamp: new Date(),
            sourceModule: this.sourceModule,
            leaveId: leave.id,
            userId: leave.userId,
            details: {
                startDate: leave.startDate,
                endDate: leave.endDate,
                type: leave.type,
                rejectionReason: leave.comment,
                rejecterId: leave.approvedBy
            }
        };

        eventService.publish(event);
    }

    /**
     * Émet un événement lors de l'annulation d'un congé
     */
    public emitLeaveCancelled(leave: Leave): void {
        const event: LeaveEvent = {
            type: EventType.LEAVE_CANCELLED,
            timestamp: new Date(),
            sourceModule: this.sourceModule,
            leaveId: leave.id,
            userId: leave.userId,
            details: {
                startDate: leave.startDate,
                endDate: leave.endDate,
                type: leave.type,
                cancellationReason: leave.comment
            }
        };

        eventService.publish(event);
    }

    /**
     * Émet un événement lors de la création d'un congé récurrent
     */
    public emitRecurringLeaveCreated(recurringLeave: Leave): void {
        const event: LeaveEvent = {
            type: EventType.RECURRING_LEAVE_CREATED,
            timestamp: new Date(),
            sourceModule: this.sourceModule,
            leaveId: recurringLeave.id,
            userId: recurringLeave.userId,
            details: {
                startDate: recurringLeave.startDate,
                endDate: recurringLeave.endDate,
                type: recurringLeave.type,
                recurrencePattern: recurringLeave.recurrencePattern
            }
        };

        eventService.publish(event);
    }

    /**
     * Émet un événement lors de la mise à jour d'un congé récurrent
     */
    public emitRecurringLeaveUpdated(recurringLeave: Leave): void {
        const event: LeaveEvent = {
            type: EventType.RECURRING_LEAVE_UPDATED,
            timestamp: new Date(),
            sourceModule: this.sourceModule,
            leaveId: recurringLeave.id,
            userId: recurringLeave.userId,
            details: {
                startDate: recurringLeave.startDate,
                endDate: recurringLeave.endDate,
                type: recurringLeave.type,
                recurrencePattern: recurringLeave.recurrencePattern
            }
        };

        eventService.publish(event);
    }
}

// Exporter une instance unique de l'adaptateur
export const leaveEventAdapter = LeaveEventAdapter.getInstance();

export default leaveEventAdapter; 