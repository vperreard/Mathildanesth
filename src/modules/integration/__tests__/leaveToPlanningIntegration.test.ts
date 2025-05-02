import { Leave, LeaveStatus, LeaveType } from '../../leaves/types/leave';
import { LeaveToPlanningService } from '../services/leaveToPlanningService';

// Mocks des services
const mockCalendarService = {
    addOrUpdateEvent: jest.fn().mockResolvedValue(true),
    removeEvent: jest.fn().mockResolvedValue(true),
};

const mockPlanningService = {
    getUserPlanning: jest.fn().mockResolvedValue([]),
    markAsUnavailable: jest.fn().mockResolvedValue(true),
    removeUnavailabilityMarkers: jest.fn().mockResolvedValue(true),
};

describe('Intégration Congés-Planning', () => {
    let leaveToPlanningService: LeaveToPlanningService;
    let testLeave: Leave;

    beforeEach(() => {
        // Réinitialisation des mocks
        jest.clearAllMocks();

        // Initialisation du service
        leaveToPlanningService = new LeaveToPlanningService(
            mockCalendarService,
            mockPlanningService
        );

        // Création d'un congé test
        testLeave = {
            id: 'leave-123',
            userId: 'user-456',
            startDate: new Date('2023-07-15'),
            endDate: new Date('2023-07-25'),
            type: LeaveType.ANNUAL,
            status: LeaveStatus.APPROVED,
            countedDays: 7,
            requestDate: new Date('2023-06-01'),
            createdAt: new Date('2023-06-01'),
            updatedAt: new Date('2023-06-02'),
        };
    });

    test('devrait synchroniser un congé approuvé avec le calendrier et le planning', async () => {
        // Exécution de la synchronisation
        await leaveToPlanningService.synchronizeLeave(testLeave);

        // Vérification de l'appel au service de calendrier
        expect(mockCalendarService.addOrUpdateEvent).toHaveBeenCalledTimes(1);
        expect(mockCalendarService.addOrUpdateEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                id: `leave-${testLeave.id}`,
                title: 'Congé annuel', // Le titre est généré en fonction du type de congé
                start: testLeave.startDate.toISOString(),
                end: testLeave.endDate.toISOString(),
                type: 'LEAVE',
                leaveType: LeaveType.ANNUAL,
                status: 'APPROVED',
                countedDays: 7,
            })
        );

        // Vérification de l'appel au service de planning
        expect(mockPlanningService.getUserPlanning).toHaveBeenCalledTimes(1);
        expect(mockPlanningService.getUserPlanning).toHaveBeenCalledWith(
            testLeave.userId,
            testLeave.startDate,
            testLeave.endDate
        );

        expect(mockPlanningService.markAsUnavailable).toHaveBeenCalledTimes(1);
        expect(mockPlanningService.markAsUnavailable).toHaveBeenCalledWith(
            testLeave.userId,
            testLeave.startDate,
            testLeave.endDate,
            `Congé: ${testLeave.type}`
        );
    });

    test('ne devrait pas mettre à jour le planning pour un congé en attente', async () => {
        // Modification du statut du congé test
        testLeave.status = LeaveStatus.PENDING;

        // Exécution de la synchronisation
        await leaveToPlanningService.synchronizeLeave(testLeave);

        // Vérification de l'appel au service de calendrier (toujours appelé)
        expect(mockCalendarService.addOrUpdateEvent).toHaveBeenCalledTimes(1);

        // Vérification que le planning n'est pas modifié
        expect(mockPlanningService.getUserPlanning).not.toHaveBeenCalled();
        expect(mockPlanningService.markAsUnavailable).not.toHaveBeenCalled();
    });

    test('devrait gérer correctement la révocation d\'un congé', async () => {
        // Exécution de la révocation
        await leaveToPlanningService.handleLeaveRevocation(testLeave);

        // Vérification de la suppression de l'événement du calendrier
        expect(mockCalendarService.removeEvent).toHaveBeenCalledTimes(1);
        expect(mockCalendarService.removeEvent).toHaveBeenCalledWith(`leave-${testLeave.id}`);

        // Vérification de la restauration du planning
        expect(mockPlanningService.removeUnavailabilityMarkers).toHaveBeenCalledTimes(1);
        expect(mockPlanningService.removeUnavailabilityMarkers).toHaveBeenCalledWith(
            testLeave.userId,
            testLeave.startDate,
            testLeave.endDate,
            `Congé: ${testLeave.type}`
        );
    });

    test('devrait gérer les congés récurrents', async () => {
        // Création d'un congé récurrent avec des occurrences
        const occurence1: Leave = {
            ...testLeave,
            id: 'occurrence-1',
            startDate: new Date('2023-08-15'),
            endDate: new Date('2023-08-25'),
            parentId: testLeave.id,
        };

        const occurence2: Leave = {
            ...testLeave,
            id: 'occurrence-2',
            startDate: new Date('2023-09-15'),
            endDate: new Date('2023-09-25'),
            parentId: testLeave.id,
        };

        testLeave.isRecurring = true;
        testLeave.occurrences = [occurence1, occurence2];

        // Exécution de la synchronisation
        await leaveToPlanningService.synchronizeLeave(testLeave);

        // Vérification que les occurrences sont également synchronisées
        expect(mockPlanningService.markAsUnavailable).toHaveBeenCalledTimes(3); // Parent + 2 occurrences
        expect(mockPlanningService.markAsUnavailable).toHaveBeenNthCalledWith(
            2, // Deuxième appel (première occurrence)
            testLeave.userId,
            occurence1.startDate,
            occurence1.endDate,
            `Congé récurrent: ${testLeave.type}`
        );
        expect(mockPlanningService.markAsUnavailable).toHaveBeenNthCalledWith(
            3, // Troisième appel (deuxième occurrence)
            testLeave.userId,
            occurence2.startDate,
            occurence2.endDate,
            `Congé récurrent: ${testLeave.type}`
        );
    });

    test('devrait synchroniser tous les congés pour une période donnée', async () => {
        // Mock pour le service de congés
        const mockLeaveService = {
            getLeavesByDateRange: jest.fn().mockResolvedValue([testLeave]),
        };

        // Injection du service mocké
        (leaveToPlanningService as any).leaveService = mockLeaveService;

        // Exécution de la synchronisation pour une période
        const startDate = new Date('2023-07-01');
        const endDate = new Date('2023-07-31');
        await leaveToPlanningService.synchronizeAllLeaves(startDate, endDate);

        // Vérification de la récupération des congés
        expect(mockLeaveService.getLeavesByDateRange).toHaveBeenCalledWith(startDate, endDate);

        // Vérification de la synchronisation de chaque congé
        expect(mockCalendarService.addOrUpdateEvent).toHaveBeenCalledTimes(1);
        expect(mockPlanningService.markAsUnavailable).toHaveBeenCalledTimes(1);
    });
}); 