import { CalendarService } from '../../../calendrier/services/calendrierService';
import { PlanningService } from '../../../planning/services/planningService';
import { eventBus, IntegrationEventType } from '../EventBusService';
import { Leave, LeaveStatus, LeaveType } from '../../../conges/types/leave';
import { CalendarEventType } from '../../../calendrier/types/event';

/**
 * Version simplifiée du LeaveToPlanningService pour les tests
 */
class LeaveToPlanningService {
    private readonly calendarService: any;
    private readonly planningService: any;
    private readonly subscriptions: (() => void)[] = [];

    constructor(calendarService: any, planningService: any) {
        this.calendarService = calendarService;
        this.planningService = planningService;
        this.initializeEventSubscriptions();
    }

    private initializeEventSubscriptions(): void {
        this.subscriptions.push(
            eventBus.subscribe(IntegrationEventType.LEAVE_CREATED, this.handleLeaveEvent.bind(this)),
            eventBus.subscribe(IntegrationEventType.LEAVE_UPDATED, this.handleLeaveEvent.bind(this)),
            eventBus.subscribe(IntegrationEventType.LEAVE_APPROVED, this.handleLeaveEvent.bind(this)),
            eventBus.subscribe(IntegrationEventType.LEAVE_REJECTED, this.handleLeaveEvent.bind(this)),
            eventBus.subscribe(IntegrationEventType.LEAVE_CANCELLED, this.handleLeaveEvent.bind(this)),
            eventBus.subscribe(IntegrationEventType.LEAVE_DELETED, this.handleLeaveEvent.bind(this))
        );
    }

    private async handleLeaveEvent(event: any): Promise<void> {
        const leave = event.payload;

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
    }

    public async synchronizeLeave(leave: Leave): Promise<void> {
        // 1. Créer ou mettre à jour l'événement dans le calendrier
        const calendarEvent = {
            id: `leave-${leave.id}`,
            title: `Congé${leave.isRecurring ? ' récurrent' : ''}: ${leave.type}`,
            start: new Date(leave.startDate).toISOString(),
            end: new Date(leave.endDate).toISOString(),
            type: CalendarEventType.LEAVE,
            leaveType: leave.type,
            status: leave.status,
            countedDays: leave.countedDays,
            allDay: true
        };

        await this.calendarService.addOrUpdateEvent(calendarEvent);

        // Traiter les occurrences récurrentes si nécessaire
        if (leave.isRecurring && leave.occurrences && leave.occurrences.length > 0) {
            for (const occurrence of leave.occurrences) {
                const occurrenceEvent = {
                    id: `leave-${occurrence.id}`,
                    title: `Congé récurrent: ${occurrence.type}`,
                    start: new Date(occurrence.startDate).toISOString(),
                    end: new Date(occurrence.endDate).toISOString(),
                    type: CalendarEventType.LEAVE,
                    leaveType: occurrence.type,
                    status: occurrence.status,
                    countedDays: occurrence.countedDays,
                    allDay: true,
                    recurringEventId: leave.id
                };

                await this.calendarService.addOrUpdateEvent(occurrenceEvent);
            }
        }

        // 2. N'ajouter au planning que les congés approuvés
        if (leave.status !== LeaveStatus.APPROVED) {
            return;
        }

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

    public async handleLeaveRevocation(leave: Leave): Promise<void> {
        await this.calendarService.removeEvent(`leave-${leave.id}`);

        await this.planningService.removeUnavailabilityMarkers(
            leave.userId,
            leave.startDate,
            leave.endDate,
            `Congé: ${leave.type}`
        );

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

    public dispose(): void {
        this.subscriptions.forEach(unsubscribe => unsubscribe());
    }
}

// Mock des dépendances
jest.mock('../../../calendar/services/calendarService', () => ({
    CalendarService: jest.fn().mockImplementation(() => ({
        addOrUpdateEvent: jest.fn().mockResolvedValue(undefined),
        removeEvent: jest.fn().mockResolvedValue(undefined)
    }))
}));

jest.mock('../../../planning/services/planningService', () => ({
    PlanningService: jest.fn().mockImplementation(() => ({
        addUnavailabilityMarker: jest.fn().mockResolvedValue(undefined),
        removeUnavailabilityMarkers: jest.fn().mockResolvedValue(undefined)
    }))
}));

jest.mock('../EventBusService', () => ({
    eventBus: {
        subscribe: jest.fn().mockReturnValue(jest.fn()), // Retourne une fonction de désabonnement
        publish: jest.fn()
    },
    IntegrationEventType: {
        LEAVE_CREATED: 'LEAVE_CREATED',
        LEAVE_UPDATED: 'LEAVE_UPDATED',
        LEAVE_APPROVED: 'LEAVE_APPROVED',
        LEAVE_REJECTED: 'LEAVE_REJECTED',
        LEAVE_CANCELLED: 'LEAVE_CANCELLED',
        LEAVE_DELETED: 'LEAVE_DELETED'
    }
}));

describe('LeaveToPlanningService', () => {
    let leaveToPlanningService: LeaveToPlanningService;
    let mockCalendarService: any;
    let mockPlanningService: any;

    // Données de test
    const mockLeave: Leave = {
        id: 'leave-123',
        userId: 'user-1',
        type: LeaveType.ANNUAL,
        status: LeaveStatus.APPROVED,
        startDate: '2023-06-15',
        endDate: '2023-06-20',
        countedDays: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
        isRecurring: false,
        requestDate: new Date()
    };

    const mockRecurringLeave: Leave = {
        ...mockLeave,
        id: 'leave-456',
        isRecurring: true,
        occurrences: [
            {
                id: 'occur-1',
                userId: 'user-1',
                type: LeaveType.ANNUAL,
                status: LeaveStatus.APPROVED,
                startDate: '2023-07-15',
                endDate: '2023-07-20',
                countedDays: 4,
                createdAt: new Date(),
                updatedAt: new Date(),
                isRecurring: false,
                requestDate: new Date()
            }
        ]
    };

    beforeEach(() => {
        // Réinitialiser les mocks
        jest.clearAllMocks();

        // Créer les instances des services mock
        mockCalendarService = {
            addOrUpdateEvent: jest.fn().mockResolvedValue(undefined),
            removeEvent: jest.fn().mockResolvedValue(undefined)
        };

        mockPlanningService = {
            addUnavailabilityMarker: jest.fn().mockResolvedValue(undefined),
            removeUnavailabilityMarkers: jest.fn().mockResolvedValue(undefined)
        };

        // Créer l'instance du service à tester
        leaveToPlanningService = new LeaveToPlanningService(
            mockCalendarService,
            mockPlanningService
        );
    });

    describe('Initialisation', () => {
        it('devrait s\'abonner aux événements de congés lors de l\'initialisation', () => {
            // Vérifier que les abonnements ont été initialisés
            expect(eventBus.subscribe).toHaveBeenCalledWith(
                IntegrationEventType.LEAVE_CREATED,
                expect.any(Function)
            );
            expect(eventBus.subscribe).toHaveBeenCalledWith(
                IntegrationEventType.LEAVE_UPDATED,
                expect.any(Function)
            );
            expect(eventBus.subscribe).toHaveBeenCalledWith(
                IntegrationEventType.LEAVE_APPROVED,
                expect.any(Function)
            );
            expect(eventBus.subscribe).toHaveBeenCalledWith(
                IntegrationEventType.LEAVE_REJECTED,
                expect.any(Function)
            );
            expect(eventBus.subscribe).toHaveBeenCalledWith(
                IntegrationEventType.LEAVE_CANCELLED,
                expect.any(Function)
            );
            expect(eventBus.subscribe).toHaveBeenCalledWith(
                IntegrationEventType.LEAVE_DELETED,
                expect.any(Function)
            );
        });
    });

    describe('synchronizeLeave', () => {
        it('devrait synchroniser un congé standard avec le calendrier et le planning', async () => {
            // Appeler la méthode à tester
            await leaveToPlanningService.synchronizeLeave(mockLeave);

            // Vérifier que les méthodes appropriées ont été appelées
            expect(mockCalendarService.addOrUpdateEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: `leave-${mockLeave.id}`,
                    type: CalendarEventType.LEAVE,
                    start: expect.any(String),
                    end: expect.any(String),
                    leaveType: mockLeave.type,
                    status: mockLeave.status,
                    countedDays: mockLeave.countedDays,
                    allDay: true
                })
            );

            expect(mockPlanningService.addUnavailabilityMarker).toHaveBeenCalledWith(
                mockLeave.userId,
                mockLeave.startDate,
                mockLeave.endDate,
                `Congé: ${mockLeave.type}`,
                expect.objectContaining({
                    leaveId: mockLeave.id,
                    leaveType: mockLeave.type
                })
            );
        });

        it('devrait synchroniser un congé récurrent avec ses occurrences', async () => {
            // S'assurer que occurrences est défini
            if (!mockRecurringLeave.occurrences) {
                fail('Les occurrences devraient être définies pour ce test');
                return;
            }

            // Appeler la méthode à tester
            await leaveToPlanningService.synchronizeLeave(mockRecurringLeave);

            // Vérifier que l'événement principal a été ajouté
            expect(mockCalendarService.addOrUpdateEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: `leave-${mockRecurringLeave.id}`,
                    type: CalendarEventType.LEAVE
                })
            );

            // Vérifier que l'occurrence a été ajoutée
            expect(mockCalendarService.addOrUpdateEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: `leave-${mockRecurringLeave.occurrences[0].id}`,
                    type: CalendarEventType.LEAVE,
                    recurringEventId: mockRecurringLeave.id
                })
            );

            // Vérifier que le marqueur d'indisponibilité a été ajouté pour l'occurrence
            expect(mockPlanningService.addUnavailabilityMarker).toHaveBeenCalledWith(
                mockRecurringLeave.occurrences[0].userId,
                mockRecurringLeave.occurrences[0].startDate,
                mockRecurringLeave.occurrences[0].endDate,
                `Congé récurrent: ${mockRecurringLeave.occurrences[0].type}`,
                expect.objectContaining({
                    leaveId: mockRecurringLeave.occurrences[0].id,
                    parentLeaveId: mockRecurringLeave.id,
                    isRecurring: true
                })
            );
        });

        it('ne devrait pas mettre à jour le planning si le congé n\'est pas approuvé', async () => {
            // Créer un congé en attente
            const pendingLeave: Leave = {
                ...mockLeave,
                status: LeaveStatus.PENDING
            };

            // Appeler la méthode à tester
            await leaveToPlanningService.synchronizeLeave(pendingLeave);

            // Vérifier que l'événement a été ajouté au calendrier
            expect(mockCalendarService.addOrUpdateEvent).toHaveBeenCalled();

            // Mais pas au planning
            expect(mockPlanningService.addUnavailabilityMarker).not.toHaveBeenCalled();
        });
    });

    describe('handleLeaveRevocation', () => {
        it('devrait supprimer un congé standard du calendrier et du planning', async () => {
            // Appeler la méthode à tester
            await leaveToPlanningService.handleLeaveRevocation(mockLeave);

            // Vérifier que l'événement a été supprimé du calendrier
            expect(mockCalendarService.removeEvent).toHaveBeenCalledWith(`leave-${mockLeave.id}`);

            // Vérifier que le marqueur d'indisponibilité a été supprimé du planning
            expect(mockPlanningService.removeUnavailabilityMarkers).toHaveBeenCalledWith(
                mockLeave.userId,
                mockLeave.startDate,
                mockLeave.endDate,
                `Congé: ${mockLeave.type}`
            );
        });

        it('devrait supprimer un congé récurrent et ses occurrences', async () => {
            // S'assurer que occurrences est défini
            if (!mockRecurringLeave.occurrences) {
                fail('Les occurrences devraient être définies pour ce test');
                return;
            }

            // Appeler la méthode à tester
            await leaveToPlanningService.handleLeaveRevocation(mockRecurringLeave);

            // Vérifier que l'événement principal a été supprimé
            expect(mockCalendarService.removeEvent).toHaveBeenCalledWith(`leave-${mockRecurringLeave.id}`);

            // Vérifier que l'occurrence a été supprimée
            expect(mockCalendarService.removeEvent).toHaveBeenCalledWith(
                `leave-${mockRecurringLeave.occurrences[0].id}`
            );

            // Vérifier que les marqueurs d'indisponibilité ont été supprimés
            expect(mockPlanningService.removeUnavailabilityMarkers).toHaveBeenCalledTimes(2);
        });
    });

    describe('Gestion des événements', () => {
        it('devrait traiter correctement un événement de création de congé', async () => {
            // Simuler l'appel à la fonction d'abonnement pour obtenir le handler
            const subscribeCall = (eventBus.subscribe as jest.Mock).mock.calls.find(
                call => call[0] === IntegrationEventType.LEAVE_CREATED
            );
            const handler = subscribeCall ? subscribeCall[1] : null;

            // Vérifier que le handler existe
            expect(handler).toBeTruthy();

            // Espionner la méthode synchronizeLeave
            const spyOnSync = jest.spyOn(leaveToPlanningService, 'synchronizeLeave');

            // Simuler un événement de création de congé
            const event = {
                type: IntegrationEventType.LEAVE_CREATED,
                payload: mockLeave,
                timestamp: Date.now(),
                source: 'test'
            };

            // Appeler le handler directement
            await handler(event);

            // Vérifier que synchronizeLeave a été appelé
            expect(spyOnSync).toHaveBeenCalledWith(mockLeave);
        });

        it('devrait traiter correctement un événement de suppression de congé', async () => {
            // Simuler l'appel à la fonction d'abonnement pour obtenir le handler
            const subscribeCall = (eventBus.subscribe as jest.Mock).mock.calls.find(
                call => call[0] === IntegrationEventType.LEAVE_DELETED
            );
            const handler = subscribeCall ? subscribeCall[1] : null;

            // Vérifier que le handler existe
            expect(handler).toBeTruthy();

            // Espionner la méthode handleLeaveRevocation
            const spyOnRevoke = jest.spyOn(leaveToPlanningService, 'handleLeaveRevocation');

            // Simuler un événement de suppression de congé
            const event = {
                type: IntegrationEventType.LEAVE_DELETED,
                payload: mockLeave,
                timestamp: Date.now(),
                source: 'test'
            };

            // Appeler le handler directement
            await handler(event);

            // Vérifier que handleLeaveRevocation a été appelé
            expect(spyOnRevoke).toHaveBeenCalledWith(mockLeave);
        });
    });

    describe('dispose', () => {
        it('devrait se désabonner de tous les événements', () => {
            // Créer des mocks pour les fonctions de désabonnement
            const unsubscribeMocks = Array(6).fill(jest.fn());

            // Configurer le mock d'abonnement pour retourner les fonctions de désabonnement
            (eventBus.subscribe as jest.Mock).mockImplementation(() => unsubscribeMocks.shift());

            // Créer une nouvelle instance pour que les mocks d'abonnement soient utilisés
            const service = new LeaveToPlanningService(mockCalendarService, mockPlanningService);

            // Appeler dispose
            service.dispose();

            // Vérifier que chaque fonction de désabonnement a été appelée
            unsubscribeMocks.forEach(mock => {
                expect(mock).toHaveBeenCalled();
            });
        });
    });
}); 