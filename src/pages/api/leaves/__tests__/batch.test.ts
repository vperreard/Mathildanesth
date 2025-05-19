import { createMocks, MockRequest, MockResponse } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, LeaveType as PrismaLeaveType, LeaveStatus, PublicHoliday, LeaveTypeSetting, Leave, SchoolHolidayPeriod, ProfessionalRole, User } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import handler from '../batch'; // L'API handler
import { prisma } from '@/lib/prisma';
import { LeaveQueryCacheService } from '@/modules/leaves/services/LeaveQueryCacheService';
import { calculateCountedDays } from '@/modules/leaves/utils/dateCalculations'; // On pourrait mocker ça aussi, mais pour l'instant on utilise la vraie
import { logger } from '@/lib/logger';
import { LeaveEvent } from '@/modules/leaves/types/cache';
import { leaveAlertThresholds } from '@/config/leaveAlertThresholds'; // Importer pour référence si besoin dans les tests

// Mock Prisma Client
jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    prisma: mockDeep<PrismaClient>(),
}));

// Mock LeaveQueryCacheService
const mockCacheServiceInstance = {
    generateBalanceKey: jest.fn(),
    getCachedData: jest.fn(),
    cacheData: jest.fn(),
    deleteCachedData: jest.fn(),
    invalidateCache: jest.fn(),
    generateUserLeavesKey: jest.fn(), // Ajouté car utilisé dans l'API batch via invalidateCache(BALANCE_UPDATED)
};
jest.mock('@/modules/leaves/services/LeaveQueryCacheService', () => ({
    __esModule: true,
    LeaveQueryCacheService: {
        getInstance: jest.fn(() => mockCacheServiceInstance),
    },
}));

// Mock Logger
jest.mock('@/lib/logger', () => ({
    __esModule: true,
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

// Mock calculateCountedDays pour certains tests où on veut isoler la logique de l'API
// jest.mock('@/modules/leaves/utils/dateCalculations');

describe('/api/leaves/batch API Endpoint', () => {
    let mockPrisma: DeepMockProxy<PrismaClient>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;
        Object.values(mockCacheServiceInstance).forEach(mockFn => mockFn.mockReset());
        // (calculateCountedDays as jest.Mock).mockClear(); // Si on mock calculateCountedDays

        // Mock par défaut pour les nouvelles dépendances pour éviter les erreurs "undefined"
        // @ts-ignore
        mockPrisma.schoolHolidayPeriod.findMany.mockResolvedValue([]);
        // @ts-ignore
        mockPrisma.leaveRequestAlert.create.mockResolvedValue({} as any); // Mock simple pour la création d'alerte
    });

    const mockUserId1 = 1;
    const mockUserId2 = 2;
    const mockUserIdMAR = 10; // Utilisateur MAR
    const mockUserIdIADE = 11; // Utilisateur IADE

    test('should return 400 if request body is not an array or is empty', async () => {
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
            method: 'POST',
            body: { "not": "an array" },
        });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(res._getJSONData().error).toBe('Request body must be a non-empty array of leave inputs.');

        const { req: req2, res: res2 } = createMocks<NextApiRequest, NextApiResponse>({
            method: 'POST',
            body: [],
        });
        await handler(req2, res2);
        expect(res2._getStatusCode()).toBe(400);
        expect(res2._getJSONData().error).toBe('Request body must be a non-empty array of leave inputs.');
    });

    test('should create leaves successfully for valid inputs and return 200 (no alerts)', async () => {
        const leaveInputs = [
            { userId: mockUserId1, startDate: '2024-09-01', endDate: '2024-09-02', typeCode: 'ANNUAL' },
        ];

        mockPrisma.publicHoliday.findMany.mockResolvedValue([]);
        mockPrisma.leaveTypeSetting.findMany.mockResolvedValue([
            { code: 'ANNUAL', label: 'Congé Annuel', isActive: true, isUserSelectable: true } as LeaveTypeSetting,
        ]);
        mockPrisma.leave.count.mockResolvedValue(0); // No conflicts
        // @ts-ignore
        mockPrisma.user.findUnique.mockResolvedValue({ professionalRole: ProfessionalRole.SECRETAIRE }); // Non MAR/IADE

        const createdLeave1 = { id: 'leave1', ...leaveInputs[0], status: LeaveStatus.PENDING, countedDays: 2, type: 'ANNUAL' as PrismaLeaveType, requestDate: new Date(), userId: mockUserId1, startDate: new Date(leaveInputs[0].startDate), endDate: new Date(leaveInputs[0].endDate) };
        // @ts-ignore
        mockPrisma.leave.create.mockResolvedValueOnce(createdLeave1 as any);

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
            method: 'POST',
            body: leaveInputs,
        });
        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const { results } = res._getJSONData();
        expect(results[0].success).toBe(true);
        expect(results[0].alerts).toBeUndefined();
        expect(mockPrisma.leaveRequestAlert.create).not.toHaveBeenCalled();
    });

    test('should create leave and generate MAR threshold alert (off holidays)', async () => {
        const leaveInputs = [
            { userId: mockUserIdMAR, startDate: '2024-07-01', endDate: '2024-07-01', typeCode: 'ANNUAL' },
        ];
        mockPrisma.publicHoliday.findMany.mockResolvedValue([]);
        // @ts-ignore
        mockPrisma.schoolHolidayPeriod.findMany.mockResolvedValue([]); // Pas de vacances scolaires
        mockPrisma.leaveTypeSetting.findMany.mockResolvedValue([
            { code: 'ANNUAL', label: 'Congé Annuel', isActive: true, isUserSelectable: true } as LeaveTypeSetting,
        ]);
        mockPrisma.leave.count.mockResolvedValue(0); // Pas de chevauchement initial

        // Simuler l'utilisateur actuel et son rôle
        // @ts-ignore
        mockPrisma.user.findUnique.mockResolvedValue({ id: mockUserIdMAR, professionalRole: ProfessionalRole.MAR });

        // Simuler 2 autres MAR déjà en congé (seuil hors vacances = 2, donc 2+1 = 3 > 2)
        const existingLeaves = [
            { userId: 20, user: { professionalRole: ProfessionalRole.MAR } },
            { userId: 21, user: { professionalRole: ProfessionalRole.MAR } },
        ];
        // @ts-ignore
        mockPrisma.leave.findMany.mockResolvedValue(existingLeaves as any);

        const createdLeave = {
            id: 'leaveMAR1', ...leaveInputs[0], status: LeaveStatus.PENDING, countedDays: 1, type: 'ANNUAL' as PrismaLeaveType, requestDate: new Date(),
            userId: mockUserIdMAR, startDate: new Date(leaveInputs[0].startDate), endDate: new Date(leaveInputs[0].endDate)
        };
        // @ts-ignore
        mockPrisma.leave.create.mockResolvedValue(createdLeave as any);
        // @ts-ignore
        mockPrisma.leaveRequestAlert.create.mockResolvedValue({} as any); // Mock de la création d'alerte

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
            method: 'POST', body: leaveInputs,
        });
        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const { results } = res._getJSONData();
        expect(results[0].success).toBe(true);
        expect(results[0].leaveId).toBe('leaveMAR1');
        expect(results[0].alerts).toHaveLength(1);
        expect(results[0].alerts[0].ruleCode).toBe('MAR_THRESHOLD_OFF_HOLIDAYS_EXCEEDED');
        expect(results[0].alerts[0].message).toContain('Seuil MAR dépassé (3 / 2) hors vacances scolaires.');
        expect(mockPrisma.leaveRequestAlert.create).toHaveBeenCalledTimes(1);
        expect(mockPrisma.leaveRequestAlert.create).toHaveBeenCalledWith({
            data: {
                leaveId: 'leaveMAR1',
                ruleCode: 'MAR_THRESHOLD_OFF_HOLIDAYS_EXCEEDED',
                messageDetails: expect.stringContaining('Seuil MAR dépassé (3 / 2) hors vacances scolaires.')
            }
        });
        // Vérifier l'invalidation du cache pour mockUserIdMAR, 2024
        expect(mockCacheServiceInstance.invalidateCache).toHaveBeenCalledWith(LeaveEvent.BALANCE_UPDATED, { userId: mockUserIdMAR.toString(), year: 2024 });
    });

    test('should create leave and generate IADE threshold alert (during holidays)', async () => {
        const leaveInputs = [
            { userId: mockUserIdIADE, startDate: '2024-08-01', endDate: '2024-08-01', typeCode: 'RTT' },
        ];
        mockPrisma.publicHoliday.findMany.mockResolvedValue([]);
        // @ts-ignore
        mockPrisma.schoolHolidayPeriod.findMany.mockResolvedValue([
            { id: 1, name: 'Vacances été', startDate: new Date('2024-07-15'), endDate: new Date('2024-08-15'), createdAt: new Date(), updatedAt: new Date() } as SchoolHolidayPeriod
        ]);
        mockPrisma.leaveTypeSetting.findMany.mockResolvedValue([
            { code: 'RTT', label: 'RTT', isActive: true, isUserSelectable: true } as LeaveTypeSetting,
        ]);
        mockPrisma.leave.count.mockResolvedValue(0);
        // @ts-ignore
        mockPrisma.user.findUnique.mockResolvedValue({ id: mockUserIdIADE, professionalRole: ProfessionalRole.IADE });

        // Seuil IADE pendant vacances = 3. Simuler 3 autres IADEs (3+1 = 4 > 3)
        const existingLeaves = [
            { userId: 30, user: { professionalRole: ProfessionalRole.IADE } },
            { userId: 31, user: { professionalRole: ProfessionalRole.IADE } },
            { userId: 32, user: { professionalRole: ProfessionalRole.IADE } },
        ];
        // @ts-ignore
        mockPrisma.leave.findMany.mockResolvedValue(existingLeaves as any);

        const createdLeave = {
            id: 'leaveIADE1', ...leaveInputs[0], status: LeaveStatus.PENDING, countedDays: 1, type: 'RTT' as PrismaLeaveType, requestDate: new Date(),
            userId: mockUserIdIADE, startDate: new Date(leaveInputs[0].startDate), endDate: new Date(leaveInputs[0].endDate)
        };
        // @ts-ignore
        mockPrisma.leave.create.mockResolvedValue(createdLeave as any);

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
            method: 'POST', body: leaveInputs,
        });
        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const { results } = res._getJSONData();
        expect(results[0].success).toBe(true);
        expect(results[0].alerts).toHaveLength(1);
        expect(results[0].alerts[0].ruleCode).toBe('IADE_THRESHOLD_HOLIDAYS_EXCEEDED');
        expect(results[0].alerts[0].message).toContain('Seuil IADE dépassé (4 / 3) pendant vacances scolaires.');
        expect(mockPrisma.leaveRequestAlert.create).toHaveBeenCalledTimes(1);
    });

    test('should create leave and generate TOTAL MAR+IADE threshold alert', async () => {
        const leaveInputs = [
            { userId: mockUserIdMAR, startDate: '2024-10-01', endDate: '2024-10-01', typeCode: 'ANNUAL' },
        ];
        mockPrisma.publicHoliday.findMany.mockResolvedValue([]);
        // @ts-ignore
        mockPrisma.schoolHolidayPeriod.findMany.mockResolvedValue([]); // Hors vacances
        mockPrisma.leaveTypeSetting.findMany.mockResolvedValue([
            { code: 'ANNUAL', label: 'Congé Annuel', isActive: true, isUserSelectable: true } as LeaveTypeSetting,
        ]);
        mockPrisma.leave.count.mockResolvedValue(0);
        // @ts-ignore
        mockPrisma.user.findUnique.mockResolvedValue({ id: mockUserIdMAR, professionalRole: ProfessionalRole.MAR });

        // Seuil MAR hors vacances = 2 (1 MAR demandeur => 1/2 ok)
        // Seuil IADE hors vacances = 2 (0 IADE demandeur => 0/2 ok)
        // Seuil TOTAL hors vacances = 3
        // Simuler 1 MAR et 1 IADE déjà en congé. Avec le MAR demandeur: 1+1 MAR + 1 IADE = 3. Ce n'est PAS > 3. 
        // Pour dépasser: 1 MAR (demandeur) + 1 MAR existant + 1 IADE existant = 3 MARIADE.  thresholds.MAX_TOTAL_MAR_IADE = 3.  3 > 3 is false
        // Il faut donc 1 MAR (demandeur) + 1 MAR existant + 2 IADE existants = 4 > 3
        const existingLeaves = [
            { userId: 20, user: { professionalRole: ProfessionalRole.MAR } }, // Total MAR = 1(current) + 1 = 2
            { userId: 30, user: { professionalRole: ProfessionalRole.IADE } },// Total IADE = 1
            { userId: 31, user: { professionalRole: ProfessionalRole.IADE } },// Total IADE = 2
        ]; // Total MAR+IADE = 1 (current MAR) + 1 (other MAR) + 2 (other IADE) = 4.  4 > 3, so alert.

        // @ts-ignore
        mockPrisma.leave.findMany.mockResolvedValue(existingLeaves as any);

        const createdLeave = {
            id: 'leaveTotal1', ...leaveInputs[0], status: LeaveStatus.PENDING, countedDays: 1, type: 'ANNUAL' as PrismaLeaveType, requestDate: new Date(),
            userId: mockUserIdMAR, startDate: new Date(leaveInputs[0].startDate), endDate: new Date(leaveInputs[0].endDate)
        };
        // @ts-ignore
        mockPrisma.leave.create.mockResolvedValue(createdLeave as any);

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
            method: 'POST', body: leaveInputs,
        });
        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const { results } = res._getJSONData();
        expect(results[0].success).toBe(true);
        expect(results[0].alerts).toHaveLength(1); // Attend une alerte pour le total
        expect(results[0].alerts[0].ruleCode).toBe('TOTAL_MAR_IADE_THRESHOLD_OFF_HOLIDAYS_EXCEEDED');
        expect(results[0].alerts[0].message).toContain('Seuil total MAR+IADE dépassé (4 / 3) hors vacances scolaires.');
        expect(mockPrisma.leaveRequestAlert.create).toHaveBeenCalledTimes(1);
    });

    test('should create leaves successfully for valid inputs and return 200', async () => {
        const leaveInputs = [
            { userId: mockUserId1, startDate: '2024-09-01', endDate: '2024-09-02', typeCode: 'ANNUAL' },
            { userId: mockUserId2, startDate: '2024-10-01', endDate: '2024-10-01', typeCode: 'RTT', reason: 'Repos' },
        ];

        mockPrisma.publicHoliday.findMany.mockResolvedValue([]); // No holidays
        mockPrisma.leaveTypeSetting.findMany.mockResolvedValue([
            { code: 'ANNUAL', label: 'Congé Annuel', isActive: true, isUserSelectable: true } as LeaveTypeSetting,
            { code: 'RTT', label: 'RTT', isActive: true, isUserSelectable: true } as LeaveTypeSetting,
        ]);
        mockPrisma.leave.count.mockResolvedValue(0); // No conflicts

        const createdLeave1 = { id: 'leave1', ...leaveInputs[0], status: LeaveStatus.PENDING, countedDays: 2, type: 'ANNUAL' as PrismaLeaveType, requestDate: new Date() };
        const createdLeave2 = { id: 'leave2', ...leaveInputs[1], status: LeaveStatus.PENDING, countedDays: 1, type: 'RTT' as PrismaLeaveType, requestDate: new Date() };
        mockPrisma.leave.create.mockResolvedValueOnce(createdLeave1 as any).mockResolvedValueOnce(createdLeave2 as any);

        mockCacheServiceInstance.generateBalanceKey.mockImplementation((userId, year) => `balance:${userId}:${year}`);
        mockCacheServiceInstance.generateUserLeavesKey.mockImplementation((userId, year) => `userleaves:${userId}:${year}`);

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
            method: 'POST',
            body: leaveInputs,
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const { results } = res._getJSONData();
        expect(results).toHaveLength(2);
        expect(results[0].success).toBe(true);
        expect(results[0].leaveId).toBe('leave1');
        expect(results[0].createdLeave.userId).toBe(mockUserId1);
        expect(results[1].success).toBe(true);
        expect(results[1].leaveId).toBe('leave2');
        expect(results[1].createdLeave.userId).toBe(mockUserId2);

        expect(mockPrisma.leave.create).toHaveBeenCalledTimes(2);
        expect(mockPrisma.leave.create).toHaveBeenNthCalledWith(1, expect.objectContaining({ data: expect.objectContaining({ userId: mockUserId1, countedDays: 2 }) }));
        expect(mockPrisma.leave.create).toHaveBeenNthCalledWith(2, expect.objectContaining({ data: expect.objectContaining({ userId: mockUserId2, countedDays: 1 }) }));

        // Check cache invalidation
        expect(mockCacheServiceInstance.invalidateCache).toHaveBeenCalledTimes(2); // Une fois pour mockUserId1, 2024 et une fois pour mockUserId2, 2024
        expect(mockCacheServiceInstance.invalidateCache).toHaveBeenCalledWith(LeaveEvent.BALANCE_UPDATED, { userId: mockUserId1.toString(), year: 2024 });
        expect(mockCacheServiceInstance.invalidateCache).toHaveBeenCalledWith(LeaveEvent.BALANCE_UPDATED, { userId: mockUserId2.toString(), year: 2024 });
    });

    test('should handle partial success with mixed valid and invalid inputs, returning 207', async () => {
        const leaveInputs = [
            { userId: mockUserId1, startDate: '2024-11-04', endDate: '2024-11-05', typeCode: 'ANNUAL' }, // Valide (2 jours)
            { userId: mockUserId1, startDate: '2024-11-10', endDate: '2024-11-10', typeCode: 'UNKNOWN_TYPE' }, // typeCode invalide
            { userId: mockUserId2, startDate: '2024-12-02', endDate: '2024-12-03', typeCode: 'RTT' }, // Conflit (2 jours)
            { userId: mockUserId2, startDate: '2024-12-10', endDate: '2024-12-09', typeCode: 'RTT' }, // endDate < startDate
        ];

        mockPrisma.publicHoliday.findMany.mockResolvedValue([]); // Pas de jours fériés pour simplifier ce test
        mockPrisma.leaveTypeSetting.findMany.mockResolvedValue([
            { code: 'ANNUAL', label: 'Congé Annuel', isActive: true, isUserSelectable: true } as LeaveTypeSetting,
            { code: 'RTT', label: 'RTT', isActive: true, isUserSelectable: true } as LeaveTypeSetting,
        ]);

        // Scénario pour les conflits:
        // Le 1er (ANNUAL) est valide, pas de conflit.
        // Le 3ème (RTT pour mockUserId2) aura un conflit.
        mockPrisma.leave.count
            .mockResolvedValueOnce(0) // Pas de conflit pour le 1er (input[0])
            // Le 2ème (UNKNOWN_TYPE) échoue avant la vérification de conflit
            .mockResolvedValueOnce(1); // Conflit pour le 3ème (input[2])
        // Le 4ème (endDate < startDate) échoue avant la vérification de conflit

        const validCreatedLeave = { id: 'leaveValid', ...leaveInputs[0], status: LeaveStatus.PENDING, countedDays: 2, type: 'ANNUAL' as PrismaLeaveType, requestDate: new Date() };
        mockPrisma.leave.create.mockResolvedValueOnce(validCreatedLeave as any);

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
            method: 'POST',
            body: leaveInputs,
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(207); // Multi-Status
        const { results } = res._getJSONData();
        expect(results).toHaveLength(4);

        // 1. Demande valide
        expect(results[0].success).toBe(true);
        expect(results[0].leaveId).toBe('leaveValid');
        expect(results[0].message).toBe('Leave created successfully.');

        // 2. typeCode invalide
        expect(results[1].success).toBe(false);
        expect(results[1].message).toBe('Invalid or non-selectable leave typeCode: UNKNOWN_TYPE.');

        // 3. Conflit
        expect(results[2].success).toBe(false);
        expect(results[2].message).toBe('Leave request conflicts with an existing leave for this user.');

        // 4. endDate < startDate
        expect(results[3].success).toBe(false);
        expect(results[3].message).toBe('endDate cannot be before startDate.');

        expect(mockPrisma.leave.create).toHaveBeenCalledTimes(1); // Seule la demande valide est créée
        expect(mockPrisma.leave.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: mockUserId1, typeCode: 'ANNUAL' }) }));

        // Invalidation du cache uniquement pour la création réussie
        expect(mockCacheServiceInstance.invalidateCache).toHaveBeenCalledTimes(1);
        expect(mockCacheServiceInstance.invalidateCache).toHaveBeenCalledWith(LeaveEvent.BALANCE_UPDATED, { userId: mockUserId1.toString(), year: 2024 });
    });

    // Plus de tests à venir ici...

    describe('Half-Day Scenarios', () => {
        const userId = 1;
        const validDate = '2024-11-04'; // Un lundi
        const weekendDate = '2024-11-02'; // Un samedi
        const holidayDate = '2024-11-01'; // Toussaint, un vendredi

        beforeEach(() => {
            // Ce beforeEach est spécifique aux scénarios de demi-journée ou peut être fusionné
            // avec le beforeEach parent si les mocks sont compatibles.
            // Pour l'instant, on le garde séparé pour plus de clarté.
            mockPrisma.leaveTypeSetting.findMany.mockResolvedValue([
                { code: 'ANNUAL', label: 'Congé Annuel', isActive: true, isUserSelectable: true } as any,
            ]);
            mockPrisma.publicHoliday.findMany.mockResolvedValue([
                { date: new Date(holidayDate) } as PublicHoliday,
            ]);
            // @ts-ignore
            mockPrisma.user.findUnique.mockResolvedValue({ professionalRole: ProfessionalRole.SECRETAIRE } as any);
            // @ts-ignore
            mockPrisma.schoolHolidayPeriod.findMany.mockResolvedValue([]);
            // Réinitialiser le mock de création de congé pour chaque test de demi-journée
            // @ts-ignore
            mockPrisma.leave.create.mockReset();
            // @ts-ignore
            mockPrisma.leave.count.mockReset();
        });

        test('should create a half-day leave successfully (AM)', async () => {
            const halfDayInput = {
                userId,
                startDate: validDate,
                endDate: validDate,
                typeCode: 'ANNUAL',
                isHalfDay: true,
                halfDayPeriod: 'AM' as 'AM' | 'PM',
            };
            // @ts-ignore
            mockPrisma.leave.count.mockResolvedValue(0); // No conflict
            const createdLeave = {
                ...halfDayInput,
                id: 'halfLeave1',
                countedDays: 0.5,
                status: LeaveStatus.PENDING,
                type: 'ANNUAL' as PrismaLeaveType,
                requestDate: new Date(),
                userId: userId,
                startDate: new Date(validDate),
                endDate: new Date(validDate),
                isHalfDay: true, // Assurer que ces champs sont dans le mock de retour
                halfDayPeriod: 'AM'
            };
            // @ts-ignore
            mockPrisma.leave.create.mockResolvedValue(createdLeave as any);

            const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
                method: 'POST',
                body: [halfDayInput],
            });
            await handler(req, res);

            expect(res._getStatusCode()).toBe(200);
            const { results } = res._getJSONData();
            expect(results[0].success).toBe(true);
            expect(results[0].createdLeave.countedDays).toBe(0.5);
            expect(mockPrisma.leave.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    userId: userId,
                    startDate: new Date(validDate),
                    endDate: new Date(validDate),
                    typeCode: 'ANNUAL',
                    isHalfDay: true,
                    halfDayPeriod: 'AM',
                    countedDays: 0.5,
                }),
            }));
        });

        test('should fail if halfDayPeriod is missing for a half-day leave', async () => {
            const input = {
                userId,
                startDate: validDate,
                endDate: validDate,
                typeCode: 'ANNUAL',
                isHalfDay: true,
                // halfDayPeriod: undefined // Manquant intentionnellement
            };
            const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
                method: 'POST',
                body: [input],
            });
            await handler(req, res);
            // La réponse globale est 400 car toutes les demandes échouent ici (il n'y en a qu'une)
            expect(res._getStatusCode()).toBe(400);
            const { results } = res._getJSONData();
            expect(results[0].success).toBe(false);
            expect(results[0].message).toBe('halfDayPeriod (AM/PM) is required when isHalfDay is true.');
        });

        test('should fail if startDate and endDate differ for a half-day leave', async () => {
            const input = {
                userId,
                startDate: validDate, // 2024-11-04
                endDate: '2024-11-05', // Différent
                typeCode: 'ANNUAL',
                isHalfDay: true,
                halfDayPeriod: 'AM' as 'AM' | 'PM',
            };
            const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
                method: 'POST',
                body: [input],
            });
            await handler(req, res);
            expect(res._getStatusCode()).toBe(400);
            const { results } = res._getJSONData();
            expect(results[0].success).toBe(false);
            expect(results[0].message).toBe('For a half-day leave, startDate and endDate must be the same.');
        });

        test('should fail if half-day leave falls on a weekend', async () => {
            const input = {
                userId,
                startDate: weekendDate, // Samedi
                endDate: weekendDate,
                typeCode: 'ANNUAL',
                isHalfDay: true,
                halfDayPeriod: 'AM' as 'AM' | 'PM',
            };
            // @ts-ignore
            mockPrisma.leave.count.mockResolvedValue(0); // Pas de conflit pour simplifier

            const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
                method: 'POST',
                body: [input],
            });
            await handler(req, res);
            expect(res._getStatusCode()).toBe(400);
            const responseData = res._getJSONData();
            expect(responseData.results[0].success).toBe(false);
            expect(responseData.results[0].message).toBe('Half-day leave falls on a non-working day (weekend or public holiday).');
        });

        test('should fail if half-day leave falls on a public holiday', async () => {
            const input = {
                userId,
                startDate: holidayDate, // Toussaint (Vendredi férié)
                endDate: holidayDate,
                typeCode: 'ANNUAL',
                isHalfDay: true,
                halfDayPeriod: 'PM' as 'AM' | 'PM',
            };
            // @ts-ignore
            mockPrisma.leave.count.mockResolvedValue(0);

            const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
                method: 'POST',
                body: [input],
            });
            await handler(req, res);
            expect(res._getStatusCode()).toBe(400);
            const responseData = res._getJSONData();
            expect(responseData.results[0].success).toBe(false);
            expect(responseData.results[0].message).toBe('Half-day leave falls on a non-working day (weekend or public holiday).');
        });
    }); // Fin du describe 'Half-Day Scenarios'

}); // Fin du describe principal '/api/leaves/batch API Endpoint' 