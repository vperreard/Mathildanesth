import { Leave, LeaveStatus } from '../../conges/types/leave';
import { logger } from "../../../lib/logger";
import { CalendarEventType, LeaveEvent } from '../../calendrier/types/event';
import { CalendarService } from '../../calendrier/services/calendrierService';
import { PlanningService } from '../../planning/services/planningService';
import { eventBus, IntegrationEventType, IntegrationEvent } from './EventBusService';

/**
 * Service qui gère l'intégration entre le système de congés et le module de planning
 * Version simplifiée sans les décorateurs pour les tests
 */
export class LeaveToPlanningService {
    private readonly calendarService: CalendarService;
    private readonly planningService: PlanningService;
    private readonly debug: boolean = process.env.NODE_ENV === 'development';
    private readonly subscriptions: (() => void)[] = [];

    constructor(calendarService: CalendarService, planningService: PlanningService) {
        this.calendarService = calendarService;
        this.planningService = planningService;

        // S'abonner aux événements de congés via le bus d'événements
        this.initializeEventSubscriptions();
    }

    /**
     * Initialiser les abonnements aux événements
     */
    private initializeEventSubscriptions(): void {
        // S'abonner aux créations/mises à jour de congés
        this.subscriptions.push(
            eventBus.subscribe<Leave>(IntegrationEventType.LEAVE_CREATED, this.handleLeaveEvent.bind(this)),
            eventBus.subscribe<Leave>(IntegrationEventType.LEAVE_UPDATED, this.handleLeaveEvent.bind(this)),
            eventBus.subscribe<Leave>(IntegrationEventType.LEAVE_APPROVED, this.handleLeaveEvent.bind(this)),
            eventBus.subscribe<Leave>(IntegrationEventType.LEAVE_REJECTED, this.handleLeaveEvent.bind(this)),
            eventBus.subscribe<Leave>(IntegrationEventType.LEAVE_CANCELLED, this.handleLeaveEvent.bind(this)),
            eventBus.subscribe<Leave>(IntegrationEventType.LEAVE_DELETED, this.handleLeaveEvent.bind(this))
        );

        if (this.debug) {
            logger.debug('[LeaveToPlanningService] Event subscriptions initialized');
        }
    }

    /**
     * Gestionnaire d'événements de congé
     */
    private async handleLeaveEvent(event: IntegrationEvent<Leave>): Promise<void> {
        const leave = event.payload;

        try {
            switch (event.type) {
                case IntegrationEventType.LEAVE_CREATED:
                case IntegrationEventType.LEAVE_UPDATED:
                case IntegrationEventType.LEAVE_APPROVED:
                    await this.synchronizeLeave(leave);
                    break;
                case IntegrationEventType.LEAVE_REJECTED:
                case IntegrationEventType.LEAVE_CANCELLED:
                case IntegrationEventType.LEAVE_DELETED:
                    await this.handleLeaveRevocation(leave);
                    break;
            }

            if (this.debug) {
                logger.debug(`[LeaveToPlanningService] Handled event: ${event.type} for leave ${leave.id}`);
            }
        } catch (error) {
            logger.error(`[LeaveToPlanningService] Error handling event ${event.type}:`, error);
        }
    }

    /**
     * Synchronise un congé avec le calendrier et le planning
     * @param leave Congé à synchroniser
     */
    public async synchronizeLeave(leave: Leave): Promise<void> {
        // 1. Créer ou mettre à jour l'événement dans le calendrier
        await this.syncWithCalendar(leave);

        // 2. Mettre à jour le planning en conséquence
        await this.syncWithPlanning(leave);
    }

    /**
     * Synchronise un congé avec le calendrier
     */
    private async syncWithCalendar(leave: Leave): Promise<void> {
        // Créer un événement de type congé pour le calendrier
        const calendarEvent: LeaveEvent = {
            id: `leave-${leave.id}`,
            title: this.generateEventTitle(leave),
            start: new Date(leave.startDate).toISOString(),
            end: new Date(leave.endDate).toISOString(),
            type: CalendarEventType.LEAVE,
            leaveType: leave.type,
            status: leave.status as 'PENDING' | 'APPROVED' | 'REJECTED',
            countedDays: leave.countedDays,
            allDay: true,
            userId: leave.userId,
            editable: false,
            className: this.getEventClassName(leave),
        };

        // Ajouter ou mettre à jour l'événement dans le calendrier
        await this.calendarService.addOrUpdateEvent(calendarEvent);

        // Si le congé est récurrent, traiter les occurrences
        if (leave.isRecurring && leave.occurrences && leave.occurrences.length > 0) {
            for (const occurrence of leave.occurrences) {
                const occurrenceEvent: LeaveEvent = {
                    id: `leave-${occurrence.id}`,
                    title: this.generateEventTitle(occurrence),
                    start: new Date(occurrence.startDate).toISOString(),
                    end: new Date(occurrence.endDate).toISOString(),
                    type: CalendarEventType.LEAVE,
                    leaveType: occurrence.type,
                    status: occurrence.status as 'PENDING' | 'APPROVED' | 'REJECTED',
                    countedDays: occurrence.countedDays,
                    allDay: true,
                    userId: occurrence.userId,
                    editable: false,
                    className: this.getEventClassName(occurrence),
                    recurringEventId: leave.id
                };

                await this.calendarService.addOrUpdateEvent(occurrenceEvent);
            }
        }
    }

    /**
     * Génère le titre de l'événement de congé
     */
    private generateEventTitle(leave: Leave): string {
        return `Congé${leave.isRecurring ? ' récurrent' : ''}: ${leave.type}`;
    }

    /**
     * Détermine la classe CSS pour l'événement
     */
    private getEventClassName(leave: Leave): string {
        const baseClass = 'leave-event';
        const statusClass = `leave-status-${leave.status.toLowerCase()}`;
        const typeClass = `leave-type-${leave.type.toLowerCase()}`;
        return `${baseClass} ${statusClass} ${typeClass}`;
    }

    /**
     * Synchronise un congé avec le planning
     */
    private async syncWithPlanning(leave: Leave): Promise<void> {
        // N'ajouter au planning que les congés approuvés
        if (leave.status !== LeaveStatus.APPROVED) {
            return;
        }

        // Ajouter un marqueur d'indisponibilité au planning
        await this.planningService.addUnavailabilityMarker(
            leave.userId,
            leave.startDate,
            leave.endDate,
            `Congé: ${leave.type}`,
            { leaveId: leave.id, leaveType: leave.type }
        );

        // Traiter les occurrences récurrentes si nécessaire
        if (leave.isRecurring && leave.occurrences && leave.occurrences.length > 0) {
            for (const occurrence of leave.occurrences) {
                if (occurrence.status === LeaveStatus.APPROVED) {
                    await this.planningService.addUnavailabilityMarker(
                        occurrence.userId,
                        occurrence.startDate,
                        occurrence.endDate,
                        `Congé récurrent: ${occurrence.type}`,
                        {
                            leaveId: occurrence.id,
                            parentLeaveId: leave.id,
                            leaveType: occurrence.type,
                            isRecurring: true
                        }
                    );
                }
            }
        }
    }

    /**
     * Gère la révocation d'un congé (annulation ou refus)
     */
    public async handleLeaveRevocation(leave: Leave): Promise<void> {
        // 1. Supprimer l'événement du calendrier
        await this.calendarService.removeEvent(`leave-${leave.id}`);

        // 2. Restaurer le planning en supprimant les marqueurs d'indisponibilité
        await this.planningService.removeUnavailabilityMarkers(
            leave.userId,
            leave.startDate,
            leave.endDate,
            `Congé: ${leave.type}`
        );

        // 3. Si le congé était récurrent, gérer les occurrences
        if (leave.isRecurring && leave.occurrences && leave.occurrences.length > 0) {
            for (const occurrence of leave.occurrences) {
                await this.calendarService.removeEvent(`leave-${occurrence.id}`);

                await this.planningService.removeUnavailabilityMarkers(
                    occurrence.userId,
                    occurrence.startDate,
                    occurrence.endDate,
                    `Congé récurrent: ${occurrence.type}`
                );
            }
        }
    }

    /**
     * Libérer les ressources (désabonnement des événements)
     */
    public dispose(): void {
        // Désabonner tous les abonnements
        this.subscriptions.forEach(unsubscribe => unsubscribe());

        if (this.debug) {
            logger.debug('[LeaveToPlanningService] Disposed and unsubscribed from events');
        }
    }
} 