import eventService from '../../core/events/EventService';
import { logger } from "../../lib/logger";
import { EventType, LeaveEvent, PlanningEvent } from '../../core/events/EventTypes';
import { Leave, LeaveStatus } from '../conges/types/leave';
import { PlanningEventType } from '../planning/types/planning';
import leaveEventAdapter from '../conges/adapters/LeaveEventAdapter';
import planningEventAdapter from '../planning/adapters/PlanningEventAdapter';

/**
 * Service d'intégration entre les modules de congés et de planning
 * Ce service écoute les événements des deux modules et assure la synchronisation
 * entre les congés et le planning.
 */
export class LeavePlanningIntegration {
    private static instance: LeavePlanningIntegration;
    private isInitialized: boolean = false;

    // Événements des congés à surveiller
    private leaveEventsToMonitor = [
        EventType.LEAVE_CREATED,
        EventType.LEAVE_UPDATED,
        EventType.LEAVE_STATUS_CHANGED,
        EventType.LEAVE_APPROVED,
        EventType.LEAVE_REJECTED,
        EventType.LEAVE_CANCELLED,
        EventType.RECURRING_LEAVE_CREATED,
        EventType.RECURRING_LEAVE_UPDATED
    ];

    // Événements du planning à surveiller
    private planningEventsToMonitor = [
        EventType.PLANNING_EVENT_ADDED,
        EventType.PLANNING_EVENT_UPDATED,
        EventType.PLANNING_EVENT_REMOVED,
        EventType.PLANNING_CONFLICT_DETECTED
    ];

    private constructor() { }

    /**
     * Obtenir l'instance unique du service d'intégration
     */
    public static getInstance(): LeavePlanningIntegration {
        if (!LeavePlanningIntegration.instance) {
            LeavePlanningIntegration.instance = new LeavePlanningIntegration();
        }
        return LeavePlanningIntegration.instance;
    }

    /**
     * Initialise le service et abonne aux événements
     */
    public initialize(): void {
        if (this.isInitialized) return;

        // S'abonner aux événements des congés
        this.leaveEventsToMonitor.forEach(eventType => {
            eventService.subscribe(eventType, this.handleLeaveEvent.bind(this));
        });

        // S'abonner aux événements du planning
        this.planningEventsToMonitor.forEach(eventType => {
            eventService.subscribe(eventType, this.handlePlanningEvent.bind(this));
        });

        this.isInitialized = true;
        logger.info('LeavePlanningIntegration: Service initialized');
    }

    /**
     * Gère les événements liés aux congés
     */
    private async handleLeaveEvent(event: LeaveEvent): Promise<void> {
        try {
            logger.info(`LeavePlanningIntegration: Processing leave event ${event.type}`, event.leaveId);

            // Récupérer le congé complet depuis l'API (si besoin)
            const leave = await this.fetchLeaveDetails(event.leaveId);

            // Traiter l'événement selon son type
            switch (event.type) {
                case EventType.LEAVE_CREATED:
                    // Ne créer des événements dans le planning que pour les congés approuvés
                    if (leave.status === LeaveStatus.APPROVED) {
                        await this.createPlanningEventFromLeave(leave);
                    }
                    break;

                case EventType.LEAVE_APPROVED:
                    // Créer un événement dans le planning quand un congé est approuvé
                    await this.createPlanningEventFromLeave(leave);
                    break;

                case EventType.LEAVE_UPDATED:
                    // Mettre à jour l'événement dans le planning
                    if (leave.status === LeaveStatus.APPROVED) {
                        await this.updatePlanningEventFromLeave(leave);
                    }
                    break;

                case EventType.LEAVE_CANCELLED:
                case EventType.LEAVE_REJECTED:
                    // Supprimer l'événement du planning
                    await this.removePlanningEventForLeave(leave);
                    break;

                case EventType.RECURRING_LEAVE_CREATED:
                case EventType.RECURRING_LEAVE_UPDATED:
                    // Traitement spécial pour les congés récurrents
                    await this.handleRecurringLeave(leave);
                    break;
            }
        } catch (error: unknown) {
            logger.error('LeavePlanningIntegration: Error handling leave event', { error: error });
        }
    }

    /**
     * Gère les événements liés au planning
     */
    private async handlePlanningEvent(event: PlanningEvent): Promise<void> {
        try {
            logger.info(`LeavePlanningIntegration: Processing planning event ${event.type}`);

            switch (event.type) {
                case EventType.PLANNING_CONFLICT_DETECTED:
                    // Si le conflit concerne un congé, notifier le module de congés
                    if (event.details?.conflictingEvents?.some((e: unknown) => e.type === PlanningEventType.LEAVE)) {
                        await this.handleLeaveConflict(event);
                    }
                    break;

                case EventType.PLANNING_EVENT_REMOVED:
                    // Si un événement de congé est supprimé manuellement du planning
                    if (event.details?.eventType === PlanningEventType.LEAVE && event.details?.linkedLeaveId) {
                        await this.handleLeaveRemovedFromPlanning(event.details.linkedLeaveId);
                    }
                    break;
            }
        } catch (error: unknown) {
            logger.error('LeavePlanningIntegration: Error handling planning event', { error: error });
        }
    }

    /**
     * Récupère les détails d'un congé depuis l'API
     */
    private async fetchLeaveDetails(leaveId: string): Promise<Leave> {
        // TODO: Implémenter l'appel API réel
        // Simuler un appel API pour l'exemple
        return {
            id: leaveId,
            userId: 'user-123',
            startDate: new Date(),
            endDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
            type: 'ANNUAL' as any,
            status: LeaveStatus.APPROVED,
            countedDays: 1,
            requestDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    /**
     * Crée un événement dans le planning à partir d'un congé
     */
    private async createPlanningEventFromLeave(leave: Leave): Promise<void> {
        try {
            // TODO: Implémenter l'appel API réel
            logger.info(`LeavePlanningIntegration: Creating planning event for leave ${leave.id}`);

            // Créer un événement de planning
            const planningEvent = {
                id: `planning-${leave.id}`,
                userId: leave.userId,
                planningId: `planning-for-${leave.userId}`,
                type: PlanningEventType.LEAVE,
                title: `Congé - ${leave.type}`,
                startDate: leave.startDate,
                endDate: leave.endDate,
                linkedLeaveId: leave.id,
                isRecurring: leave.isRecurring || false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // TODO: Appeler l'API du planning pour créer l'événement

            // Notifier le succès via l'adaptateur d'événements
            // Simuler un objet planning pour l'exemple
            const planning = {
                id: `planning-for-${leave.userId}`,
                userId: 'scheduler-123',
                startDate: new Date(leave.startDate.getFullYear(), leave.startDate.getMonth(), 1),
                endDate: new Date(leave.endDate.getFullYear(), leave.endDate.getMonth() + 1, 0),
                department: 'default',
                isPublished: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Publier l'événement via l'adaptateur d'événements
            planningEventAdapter.emitPlanningEventAdded(planning, planningEvent);
        } catch (error: unknown) {
            logger.error(`LeavePlanningIntegration: Error creating planning event`, { error: error });
        }
    }

    /**
     * Met à jour un événement dans le planning à partir d'un congé
     */
    private async updatePlanningEventFromLeave(leave: Leave): Promise<void> {
        try {
            // TODO: Implémenter l'appel API réel
            logger.info(`LeavePlanningIntegration: Updating planning event for leave ${leave.id}`);

            // Mettre à jour l'événement de planning
            const planningEvent = {
                id: `planning-${leave.id}`,
                userId: leave.userId,
                planningId: `planning-for-${leave.userId}`,
                type: PlanningEventType.LEAVE,
                title: `Congé - ${leave.type}`,
                startDate: leave.startDate,
                endDate: leave.endDate,
                linkedLeaveId: leave.id,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // TODO: Appeler l'API du planning pour mettre à jour l'événement

            // Simuler un objet planning pour l'exemple
            const planning = {
                id: `planning-for-${leave.userId}`,
                userId: 'scheduler-123',
                startDate: new Date(leave.startDate.getFullYear(), leave.startDate.getMonth(), 1),
                endDate: new Date(leave.endDate.getFullYear(), leave.endDate.getMonth() + 1, 0),
                department: 'default',
                isPublished: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Publier l'événement via l'adaptateur d'événements
            planningEventAdapter.emitPlanningEventUpdated(planning, planningEvent);
        } catch (error: unknown) {
            logger.error(`LeavePlanningIntegration: Error updating planning event`, { error: error });
        }
    }

    /**
     * Supprime un événement du planning lié à un congé
     */
    private async removePlanningEventForLeave(leave: Leave): Promise<void> {
        try {
            // TODO: Implémenter l'appel API réel
            logger.info(`LeavePlanningIntegration: Removing planning event for leave ${leave.id}`);

            // Définir l'événement à supprimer
            const planningEvent = {
                id: `planning-${leave.id}`,
                userId: leave.userId,
                planningId: `planning-for-${leave.userId}`,
                type: PlanningEventType.LEAVE,
                title: `Congé - ${leave.type}`,
                startDate: leave.startDate,
                endDate: leave.endDate,
                linkedLeaveId: leave.id,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // TODO: Appeler l'API du planning pour supprimer l'événement

            // Simuler un objet planning pour l'exemple
            const planning = {
                id: `planning-for-${leave.userId}`,
                userId: 'scheduler-123',
                startDate: new Date(leave.startDate.getFullYear(), leave.startDate.getMonth(), 1),
                endDate: new Date(leave.endDate.getFullYear(), leave.endDate.getMonth() + 1, 0),
                department: 'default',
                isPublished: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Publier l'événement via l'adaptateur d'événements
            planningEventAdapter.emitPlanningEventRemoved(planning, planningEvent);
        } catch (error: unknown) {
            logger.error(`LeavePlanningIntegration: Error removing planning event`, { error: error });
        }
    }

    /**
     * Gère un congé récurrent
     */
    private async handleRecurringLeave(leave: Leave): Promise<void> {
        // Spécifique aux congés récurrents
        if (!leave.isRecurring) return;

        try {
            logger.info(`LeavePlanningIntegration: Processing recurring leave ${leave.id}`);

            // Vérifier si le congé a des occurrences
            // et traiter chaque occurrence comme un congé individuel dans le planning
            if (leave.occurrences && leave.occurrences.length > 0) {
                for (const occurrence of leave.occurrences) {
                    if (occurrence.status === LeaveStatus.APPROVED) {
                        // Créer ou mettre à jour l'événement dans le planning pour chaque occurrence
                        await this.createPlanningEventFromLeave(occurrence);
                    }
                }
            } else {
                // Si le congé récurrent est approuvé mais que les occurrences ne sont pas encore générées
                if (leave.status === LeaveStatus.APPROVED) {
                    await this.createPlanningEventFromLeave(leave);
                }
            }
        } catch (error: unknown) {
            logger.error(`LeavePlanningIntegration: Error handling recurring leave`, { error: error });
        }
    }

    /**
     * Gère un conflit détecté dans le planning impliquant un congé
     */
    private async handleLeaveConflict(event: PlanningEvent): Promise<void> {
        try {
            logger.info(`LeavePlanningIntegration: Processing planning conflict involving leaves`);

            // Extraire les IDs des congés concernés
            const leaveIds = event.details?.conflictingEvents
                ?.filter((e: unknown) => e.type === PlanningEventType.LEAVE)
                ?.map((e: unknown) => e.linkedLeaveId);

            if (!leaveIds || leaveIds.length === 0) return;

            // Notifier le module de congés pour chaque congé concerné
            for (const leaveId of leaveIds) {
                // TODO: Notifier le module de congés du conflit
                logger.info(`LeavePlanningIntegration: Notifying leave module about conflict for leave ${leaveId}`);
            }
        } catch (error: unknown) {
            logger.error(`LeavePlanningIntegration: Error handling leave conflict`, { error: error });
        }
    }

    /**
     * Gère la suppression manuelle d'un événement de congé du planning
     */
    private async handleLeaveRemovedFromPlanning(leaveId: string): Promise<void> {
        try {
            logger.info(`LeavePlanningIntegration: Processing leave removed from planning ${leaveId}`);

            // Récupérer les détails du congé
            const leave = await this.fetchLeaveDetails(leaveId);

            // Si le congé est toujours approuvé, il faudrait le synchroniser à nouveau
            if (leave.status === LeaveStatus.APPROVED) {
                logger.info(`LeavePlanningIntegration: Leave ${leaveId} is still approved, re-syncing`);
                // Optionnel : recréer l'événement ou notifier un administrateur
            }
        } catch (error: unknown) {
            logger.error(`LeavePlanningIntegration: Error handling leave removed from planning`, { error: error });
        }
    }
}

// Exporter une instance unique
export const leavePlanningIntegration = LeavePlanningIntegration.getInstance();
export default leavePlanningIntegration; 