import {
    notificationEventService,
    NotificationEventService
} from '../../../../../src/modules/conges/services/notificationEventService';
import { leaveNotificationService } from '../../../../../src/modules/conges/services/notificationService';
import {
    LeaveNotificationType,
    LeaveNotificationEvent,
    NotificationConfig
} from '../../../../../src/modules/conges/types/notification';
import { Leave, LeaveStatus, LeaveType } from '../../../../../src/modules/conges/types/leave';
import { User, UserRole, ExperienceLevel } from '../../../../../src/types/user';

// Mock du service de notification
jest.mock('../../../../../src/modules/conges/services/notificationService', () => ({
    leaveNotificationService: {
        notifyLeaveRequest: jest.fn(),
        notifyLeaveStatusUpdate: jest.fn(),
        notifyLeaveConflict: jest.fn(),
        notifyQuotaLow: jest.fn(),
        sendNotification: jest.fn(),
        sendLeaveReminder: jest.fn()
    }
}));

describe('NotificationEventService', () => {
    // Réinitialiser les mocks avant chaque test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Singleton Pattern', () => {
        it('devrait retourner la même instance lors d\'appels multiples à getInstance', () => {
            const instance1 = NotificationEventService.getInstance();
            const instance2 = NotificationEventService.getInstance();

            expect(instance1).toBe(instance2);
        });

        it('devrait exporter une instance singleton par défaut', () => {
            expect(notificationEventService).toBe(NotificationEventService.getInstance());
        });
    });

    describe('updateConfig', () => {
        it('devrait mettre à jour la configuration des notifications', () => {
            // Configuration de test
            const testConfig: Partial<NotificationConfig> = {
                reminderDays: [2, 5],
                quotaThreshold: 15
            };

            // Mise à jour de la configuration
            notificationEventService.updateConfig(testConfig);

            // Vérifier que la configuration est mise à jour en exécutant une méthode qui l'utilise
            const mockLeave = createMockLeave();
            notificationEventService.handleQuotaUpdated('user123', 3, 20, 2023);

            // Vérifier que notifyQuotaLow a été appelé car 3/20 = 15%
            expect(leaveNotificationService.notifyQuotaLow).toHaveBeenCalledWith(
                'user123', 3, 20, 2023
            );

            // Réinitialiser et tester avec une valeur qui ne devrait pas déclencher de notification
            jest.clearAllMocks();
            notificationEventService.handleQuotaUpdated('user123', 4, 20, 2023); // 20%

            // notifyQuotaLow ne devrait pas être appelé car 4/20 > 15%
            expect(leaveNotificationService.notifyQuotaLow).not.toHaveBeenCalled();
        });
    });

    describe('handleLeaveCreated', () => {
        it('devrait notifier les approbateurs d\'une nouvelle demande de congé', async () => {
            // Créer un congé et un utilisateur de test
            const testLeave = createMockLeave();
            const testUser = createMockUser();

            // Appeler la méthode à tester
            await notificationEventService.handleLeaveCreated(testLeave, testUser);

            // Vérifier que notifyLeaveRequest a été appelé
            expect(leaveNotificationService.notifyLeaveRequest).toHaveBeenCalledWith(
                testLeave,
                testUser
            );
        });
    });

    describe('handleLeaveStatusChanged', () => {
        it('devrait notifier le demandeur du changement de statut', async () => {
            // Créer un congé et un utilisateur de test
            const testLeave = createMockLeave();
            const testUser = createMockUser();

            // Appeler la méthode à tester
            await notificationEventService.handleLeaveStatusChanged(testLeave, testUser);

            // Vérifier que notifyLeaveStatusUpdate a été appelé
            expect(leaveNotificationService.notifyLeaveStatusUpdate).toHaveBeenCalledWith(
                testLeave,
                testUser
            );
        });
    });

    describe('handleLeaveConflict', () => {
        it('devrait notifier les gestionnaires de planning d\'un conflit', async () => {
            // Créer un congé de test
            const testLeave = createMockLeave();
            const conflictingLeaves = [createMockLeave('leave456'), createMockLeave('leave789')];

            // Appeler la méthode à tester
            await notificationEventService.handleLeaveConflict(testLeave, conflictingLeaves);

            // Vérifier que notifyLeaveConflict a été appelé
            expect(leaveNotificationService.notifyLeaveConflict).toHaveBeenCalledWith(
                testLeave,
                conflictingLeaves
            );
        });
    });

    describe('processEvent', () => {
        it('devrait traiter un événement de demande de congé', async () => {
            // Créer un congé et un utilisateur de test
            const testLeave = createMockLeave();
            const testUser = createMockUser();

            // Espionner les méthodes appelées
            const handleSpy = jest.spyOn(notificationEventService, 'handleLeaveCreated');

            // Créer un événement de test
            const testEvent: LeaveNotificationEvent = {
                eventType: LeaveNotificationType.LEAVE_REQUEST,
                leave: testLeave,
                updatedBy: testUser
            };

            // Appeler la méthode à tester
            await notificationEventService.processEvent(testEvent);

            // Vérifier que handleLeaveCreated a été appelé
            expect(handleSpy).toHaveBeenCalledWith(testLeave, testUser);
        });

        it('devrait traiter un événement de mise à jour de statut', async () => {
            // Créer un congé et un utilisateur de test
            const testLeave = createMockLeave();
            const testUser = createMockUser();

            // Espionner les méthodes appelées
            const handleSpy = jest.spyOn(notificationEventService, 'handleLeaveStatusChanged');

            // Créer un événement de test
            const testEvent: LeaveNotificationEvent = {
                eventType: LeaveNotificationType.LEAVE_STATUS_UPDATE,
                leave: testLeave,
                updatedBy: testUser
            };

            // Appeler la méthode à tester
            await notificationEventService.processEvent(testEvent);

            // Vérifier que handleLeaveStatusChanged a été appelé
            expect(handleSpy).toHaveBeenCalledWith(testLeave, testUser);
        });

        it('devrait traiter un événement de conflit', async () => {
            // Créer un congé de test
            const testLeave = createMockLeave();
            const conflictingLeaves = [createMockLeave('leave456'), createMockLeave('leave789')];

            // Espionner les méthodes appelées
            const handleSpy = jest.spyOn(notificationEventService, 'handleLeaveConflict');

            // Créer un événement de test
            const testEvent: LeaveNotificationEvent = {
                eventType: LeaveNotificationType.LEAVE_CONFLICT,
                leave: testLeave,
                additionalData: {
                    conflictingLeaves
                }
            };

            // Appeler la méthode à tester
            await notificationEventService.processEvent(testEvent);

            // Vérifier que handleLeaveConflict a été appelé
            expect(handleSpy).toHaveBeenCalledWith(testLeave, conflictingLeaves);
        });
    });

    describe('checkUpcomingLeaves', () => {
        it('devrait envoyer des rappels pour les congés à venir selon la configuration', async () => {
            // Définir la date actuelle pour le test
            const today = new Date('2023-12-15');
            const realDate = Date;
            // Utiliser un mock Jest pour Date
            jest.useFakeTimers().setSystemTime(today);

            // Mettre à jour la configuration
            notificationEventService.updateConfig({
                reminderDays: [3, 7]
            });

            // Créer des congés de test
            const leaves: Leave[] = [
                // Congé qui commence dans 3 jours (devrait déclencher un rappel)
                {
                    ...createMockLeave('leave1'),
                    startDate: new Date('2023-12-18'),
                    status: LeaveStatus.APPROVED
                },
                // Congé qui commence dans 7 jours (devrait déclencher un rappel)
                {
                    ...createMockLeave('leave2'),
                    startDate: new Date('2023-12-22'),
                    status: LeaveStatus.APPROVED
                },
                // Congé qui commence dans 5 jours (ne devrait pas déclencher de rappel)
                {
                    ...createMockLeave('leave3'),
                    startDate: new Date('2023-12-20'),
                    status: LeaveStatus.APPROVED
                },
                // Congé qui n'est pas approuvé (ne devrait pas déclencher de rappel)
                {
                    ...createMockLeave('leave4'),
                    startDate: new Date('2023-12-18'),
                    status: LeaveStatus.PENDING
                }
            ];

            // Appeler la méthode à tester
            await notificationEventService.checkUpcomingLeaves(leaves);

            // Vérifier que sendLeaveReminder a été appelé pour les bonnes demandes
            expect(leaveNotificationService.sendLeaveReminder).toHaveBeenCalledTimes(2);
            expect(leaveNotificationService.sendLeaveReminder).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'leave1' }),
                3
            );
            expect(leaveNotificationService.sendLeaveReminder).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'leave2' }),
                7
            );

            // Restaurer les timers originaux
            jest.useRealTimers();
        });
    });
});

// Fonctions utilitaires pour créer des objets de test
function createMockLeave(id: string = 'leave123'): Leave {
    return {
        id,
        userId: 'user123',
        startDate: new Date('2023-12-18'),
        endDate: new Date('2023-12-22'),
        type: LeaveType.ANNUAL,
        status: LeaveStatus.PENDING,
        countedDays: 5,
        requestDate: new Date('2023-12-01'),
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date('2023-12-01')
    };
}

function createMockUser(id: string = 'user123'): User {
    return {
        id,
        prenom: 'Jean',
        nom: 'Dupont',
        email: 'jean.dupont@example.com',
        role: UserRole.DOCTOR,
        specialties: [],
        experienceLevel: ExperienceLevel.SENIOR,
        createdAt: new Date(),
        updatedAt: new Date()
    };
} 