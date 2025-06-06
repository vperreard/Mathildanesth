import { Planning, PlanningEvent as PlanningScheduleEvent } from '../types/planning';
import eventService from '../../../core/events/EventService';
import { EventType, PlanningEvent } from '../../../core/events/EventTypes';

/**
 * Adaptateur qui fait le lien entre le module de planification et le système d'événements.
 * Cette classe se charge de convertir les actions du module de planification en événements
 * et de les publier dans le système d'événements centralisé.
 */
export class PlanningEventAdapter {
    private static instance: PlanningEventAdapter;
    private readonly sourceModule = 'planning';

    private constructor() { }

    /**
     * Obtenir l'instance unique de l'adaptateur
     */
    public static getInstance(): PlanningEventAdapter {
        if (!PlanningEventAdapter.instance) {
            PlanningEventAdapter.instance = new PlanningEventAdapter();
        }
        return PlanningEventAdapter.instance;
    }

    /**
     * Émet un événement lors de la création d'un planning
     */
    public emitPlanningCreated(planning: Planning): void {
        const event: PlanningEvent = {
            type: EventType.PLANNING_CREATED,
            timestamp: new Date(),
            sourceModule: this.sourceModule,
            planningId: planning.id,
            userId: planning.userId,
            details: {
                startDate: planning.startDate,
                endDate: planning.endDate,
                department: planning.department,
                isPublished: planning.isPublished || false
            }
        };

        eventService.publish(event);
    }

    /**
     * Émet un événement lors de la mise à jour d'un planning
     */
    public emitPlanningUpdated(planning: Planning): void {
        const event: PlanningEvent = {
            type: EventType.PLANNING_UPDATED,
            timestamp: new Date(),
            sourceModule: this.sourceModule,
            planningId: planning.id,
            userId: planning.userId,
            details: {
                startDate: planning.startDate,
                endDate: planning.endDate,
                department: planning.department,
                isPublished: planning.isPublished || false,
                updatedFields: planning.lastUpdatedFields || []
            }
        };

        eventService.publish(event);

        // Si le planning est publié, émettre un événement supplémentaire
        if (planning.isPublished) {
            this.emitPlanningPublished(planning);
        }
    }

    /**
     * Émet un événement lors de la publication d'un planning
     */
    public emitPlanningPublished(planning: Planning): void {
        const event: PlanningEvent = {
            type: EventType.PLANNING_PUBLISHED,
            timestamp: new Date(),
            sourceModule: this.sourceModule,
            planningId: planning.id,
            userId: planning.userId,
            details: {
                startDate: planning.startDate,
                endDate: planning.endDate,
                department: planning.department,
                affectedUsers: planning.affectedUsers || []
            }
        };

        eventService.publish(event);
    }

    /**
     * Émet un événement lors de la suppression d'un planning
     */
    public emitPlanningDeleted(planning: Planning): void {
        const event: PlanningEvent = {
            type: EventType.PLANNING_DELETED,
            timestamp: new Date(),
            sourceModule: this.sourceModule,
            planningId: planning.id,
            userId: planning.userId,
            details: {
                startDate: planning.startDate,
                endDate: planning.endDate,
                department: planning.department
            }
        };

        eventService.publish(event);
    }

    /**
     * Émet un événement lors de l'ajout d'un événement au planning
     */
    public emitPlanningEventAdded(planning: Planning, planningEvent: PlanningScheduleEvent): void {
        const event: PlanningEvent = {
            type: EventType.PLANNING_EVENT_ADDED,
            timestamp: new Date(),
            sourceModule: this.sourceModule,
            planningId: planning.id,
            userId: planningEvent.userId,
            details: {
                eventId: planningEvent.id,
                startDate: planningEvent.startDate,
                endDate: planningEvent.endDate,
                title: planningEvent.title,
                eventType: planningEvent.type,
                isRecurring: planningEvent.isRecurring || false
            }
        };

        eventService.publish(event);
    }

    /**
     * Émet un événement lors de la modification d'un événement du planning
     */
    public emitPlanningEventUpdated(planning: Planning, planningEvent: PlanningScheduleEvent): void {
        const event: PlanningEvent = {
            type: EventType.PLANNING_EVENT_UPDATED,
            timestamp: new Date(),
            sourceModule: this.sourceModule,
            planningId: planning.id,
            userId: planningEvent.userId,
            details: {
                eventId: planningEvent.id,
                startDate: planningEvent.startDate,
                endDate: planningEvent.endDate,
                title: planningEvent.title,
                eventType: planningEvent.type,
                isRecurring: planningEvent.isRecurring || false
            }
        };

        eventService.publish(event);
    }

    /**
     * Émet un événement lors de la suppression d'un événement du planning
     */
    public emitPlanningEventRemoved(planning: Planning, planningEvent: PlanningScheduleEvent): void {
        const event: PlanningEvent = {
            type: EventType.PLANNING_EVENT_REMOVED,
            timestamp: new Date(),
            sourceModule: this.sourceModule,
            planningId: planning.id,
            userId: planningEvent.userId,
            details: {
                eventId: planningEvent.id,
                startDate: planningEvent.startDate,
                endDate: planningEvent.endDate,
                title: planningEvent.title,
                eventType: planningEvent.type
            }
        };

        eventService.publish(event);
    }

    /**
     * Émet un événement lors d'un conflit détecté dans le planning
     */
    public emitPlanningConflictDetected(planning: Planning, conflictDetails: unknown): void {
        const event: PlanningEvent = {
            type: EventType.PLANNING_CONFLICT_DETECTED,
            timestamp: new Date(),
            sourceModule: this.sourceModule,
            planningId: planning.id,
            userId: conflictDetails.userId,
            details: {
                conflictType: conflictDetails.type,
                startDate: conflictDetails.startDate,
                endDate: conflictDetails.endDate,
                conflictingEvents: conflictDetails.events || [],
                severity: conflictDetails.severity || 'warning'
            }
        };

        eventService.publish(event);
    }
}

// Exporter une instance unique de l'adaptateur
export const planningEventAdapter = PlanningEventAdapter.getInstance();

export default planningEventAdapter; 