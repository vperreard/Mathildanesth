import { analyticsService, RoomUtilizationReport } from './analyticsService';
import { PrismaClient, Period, Site, OperatingSector, OperatingRoom, BlocDayPlanning, BlocRoomAssignment } from '@prisma/client';

// Mock Prisma Client
// @ts-ignore
global.jest = require('jest'); // Assurer que jest est disponible globalement pour les mocks

const prismaMock = {
    blocRoomAssignment: {
        findMany: jest.fn(),
    },
    operatingRoom: {
        findMany: jest.fn(),
    },
};

// Mocking PrismaClient et Period enum
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => prismaMock),
    Period: {
        MATIN: 'MATIN', // Assurez-vous que ce sont les vraies valeurs de votre enum
        APRES_MIDI: 'APRES_MIDI',
        JOURNEE_ENTIERE: 'JOURNEE_ENTIERE',
    },
    // Mock d'autres exports de @prisma/client si nécessaire
    OperatingRoom: {}, // Exemple
    OperatingSector: {}, // Exemple
}));

describe('AnalyticsService', () => {
    let service: typeof analyticsService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = analyticsService;
    });

    describe('getRoomUtilizationStats', () => {
        const siteId = 'test-site-1';
        const startDate = new Date('2023-01-01T00:00:00.000Z');
        const endDate = new Date('2023-01-01T23:59:59.999Z');

        it('devrait retourner des statistiques vides si aucune affectation n\'est trouvée', async () => {
            (prismaMock.operatingRoom.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.blocRoomAssignment.findMany as jest.Mock).mockResolvedValue([]);

            const result = await service.getRoomUtilizationStats(siteId, startDate, endDate);

            expect(result.bySectorCategory).toEqual([]);
            expect(result.byRoomType).toEqual([]);
            expect(result.summary.siteId).toBe(siteId);
        });

        it('devrait retourner des statistiques vides si aucune salle active n\'est trouvée', async () => {
            (prismaMock.operatingRoom.findMany as jest.Mock).mockResolvedValue([]);
            const mockAssignments: any[] = [
                { period: Period.MATIN, operatingRoom: { id: 1, type: 'STANDARD', sector: { id: 1, category: 'CHIRURGIE' } } }
            ];
            (prismaMock.blocRoomAssignment.findMany as jest.Mock).mockResolvedValue(mockAssignments);

            const result = await service.getRoomUtilizationStats(siteId, startDate, endDate);

            expect(result.bySectorCategory).toEqual([]);
            expect(result.byRoomType).toEqual([]);
        });

        it('devrait calculer correctement les statistiques pour un ensemble simple', async () => {
            const mockActiveRooms: any[] = [
                { id: 1, name: 'Salle 1', isActive: true, type: 'STANDARD', sectorId: 1, sector: { id: 1, name: 'Secteur A', category: 'CHIRURGIE', isActive: true, siteId: siteId } },
                { id: 2, name: 'Salle 2', isActive: true, type: 'ASEPTIQUE', sectorId: 1, sector: { id: 1, name: 'Secteur A', category: 'CHIRURGIE', isActive: true, siteId: siteId } },
                { id: 3, name: 'Salle 3', isActive: true, type: 'STANDARD', sectorId: 2, sector: { id: 2, name: 'Secteur B', category: 'OPHTALMO', isActive: true, siteId: siteId } },
            ];
            (prismaMock.operatingRoom.findMany as jest.Mock).mockResolvedValue(mockActiveRooms);

            const mockAssignments: any[] = [
                { period: Period.MATIN, operatingRoomId: 1, operatingRoom: mockActiveRooms[0] },
                { period: Period.APRES_MIDI, operatingRoomId: 1, operatingRoom: mockActiveRooms[0] },
                { period: Period.MATIN, operatingRoomId: 2, operatingRoom: mockActiveRooms[1] },
                { period: Period.JOURNEE_ENTIERE, operatingRoomId: 3, operatingRoom: mockActiveRooms[2] },
            ];
            (prismaMock.blocRoomAssignment.findMany as jest.Mock).mockResolvedValue(mockAssignments);

            const result = await service.getRoomUtilizationStats(siteId, startDate, endDate);

            const chirurgieStats = result.bySectorCategory.find(s => s.category === 'CHIRURGIE');
            expect(chirurgieStats).toBeDefined();
            expect(chirurgieStats?.numberOfRooms).toBe(2);
            expect(chirurgieStats?.totalPlannedHours).toBe(15);
            expect(chirurgieStats?.numberOfProcedures).toBe(3);
            expect(chirurgieStats?.totalAvailableHours).toBe(20);
            expect(chirurgieStats?.occupancyRate).toBe(0.75);
            expect(chirurgieStats?.averageProcedureDurationMinutes).toBe(300);

            const ophtalmoStats = result.bySectorCategory.find(s => s.category === 'OPHTALMO');
            expect(ophtalmoStats).toBeDefined();
            expect(ophtalmoStats?.numberOfRooms).toBe(1);
            expect(ophtalmoStats?.totalPlannedHours).toBe(10);
            expect(ophtalmoStats?.numberOfProcedures).toBe(1);
            expect(ophtalmoStats?.totalAvailableHours).toBe(10);
            expect(ophtalmoStats?.occupancyRate).toBe(1);
            expect(ophtalmoStats?.averageProcedureDurationMinutes).toBe(600);

            const standardRoomStats = result.byRoomType.find(r => r.type === 'STANDARD');
            expect(standardRoomStats).toBeDefined();
            expect(standardRoomStats?.numberOfRooms).toBe(2);
            expect(standardRoomStats?.totalPlannedHours).toBe(20);
            expect(standardRoomStats?.numberOfProcedures).toBe(3);
            expect(standardRoomStats?.totalAvailableHours).toBe(20);
            expect(standardRoomStats?.occupancyRate).toBe(1);
            expect(standardRoomStats?.averageProcedureDurationMinutes).toBe(400);

            const aseptiqueRoomStats = result.byRoomType.find(r => r.type === 'ASEPTIQUE');
            expect(aseptiqueRoomStats).toBeDefined();
            expect(aseptiqueRoomStats?.numberOfRooms).toBe(1);
            expect(aseptiqueRoomStats?.totalPlannedHours).toBe(5);
            expect(aseptiqueRoomStats?.numberOfProcedures).toBe(1);
            expect(aseptiqueRoomStats?.totalAvailableHours).toBe(10);
            expect(aseptiqueRoomStats?.occupancyRate).toBe(0.5);
            expect(aseptiqueRoomStats?.averageProcedureDurationMinutes).toBe(300);
        });

        // TODO: Ajouter d'autres cas de test importants (voir commentaires dans la version précédente du fichier)
    });

    // TODO: Testez la fonction `getPeriodDurationInHours` séparément si sa logique devient complexe
    // describe('getPeriodDurationInHours', () => { ... });
});