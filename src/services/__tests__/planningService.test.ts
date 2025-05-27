import { prisma } from '@/lib/prisma';
import { planningService } from '../planningService';
import { Role } from '@prisma/client';

// Mock dependencies
jest.mock('@/lib/prisma');
jest.mock('../planningGenerator');
jest.mock('../blocPlanningValidator');

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('PlanningService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getPlanning', () => {
        it('should retrieve planning for date range', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');
            const siteId = 1;

            const mockAssignments = [
                {
                    id: 1,
                    date: new Date('2024-01-15'),
                    period: 'AM',
                    userId: 1,
                    operatingRoomId: 1,
                    user: { nom: 'Doe', prenom: 'John' },
                    operatingRoom: { 
                        name: 'Salle 1',
                        sector: { name: 'Bloc A', siteId: 1 }
                    },
                },
            ];

            mockedPrisma.attribution = {
                findMany: jest.fn().mockResolvedValue(mockAssignments),
            } as any;

            const result = await planningService.getPlanning(startDate, endDate, siteId);

            expect(result).toEqual(mockAssignments);
            expect(mockedPrisma.attribution.findMany).toHaveBeenCalledWith({
                where: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                    operatingRoom: {
                        sector: {
                            siteId: siteId,
                        },
                    },
                },
                include: {
                    user: true,
                    operatingRoom: {
                        include: {
                            sector: true,
                        },
                    },
                },
                orderBy: [
                    { date: 'asc' },
                    { operatingRoomId: 'asc' },
                    { period: 'asc' },
                ],
            });
        });

        it('should filter by roomIds when provided', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');
            const roomIds = [1, 2, 3];

            mockedPrisma.attribution = {
                findMany: jest.fn().mockResolvedValue([]),
            } as any;

            await planningService.getPlanning(startDate, endDate, undefined, roomIds);

            expect(mockedPrisma.attribution.findMany).toHaveBeenCalledWith({
                where: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                    operatingRoomId: {
                        in: roomIds,
                    },
                },
                include: expect.any(Object),
                orderBy: expect.any(Array),
            });
        });
    });

    describe('createAssignment', () => {
        it('should create a new attribution with validation', async () => {
            const assignmentData = {
                userId: 1,
                operatingRoomId: 1,
                date: new Date('2024-01-15'),
                period: 'AM' as const,
            };

            // Mock conflict check
            mockedPrisma.attribution = {
                findFirst: jest.fn().mockResolvedValue(null),
                create: jest.fn().mockResolvedValue({
                    id: 1,
                    ...assignmentData,
                }),
            } as any;

            // Mock leave check
            mockedPrisma.leave = {
                findFirst: jest.fn().mockResolvedValue(null),
            } as any;

            const result = await planningService.createAssignment(assignmentData);

            expect(result).toMatchObject(assignmentData);
            expect(mockedPrisma.attribution.findFirst).toHaveBeenCalled();
            expect(mockedPrisma.leave.findFirst).toHaveBeenCalled();
        });

        it('should throw error for conflicting attribution', async () => {
            const assignmentData = {
                userId: 1,
                operatingRoomId: 1,
                date: new Date('2024-01-15'),
                period: 'AM' as const,
            };

            // Mock existing attribution
            mockedPrisma.attribution = {
                findFirst: jest.fn().mockResolvedValue({
                    id: 999,
                    userId: 2,
                }),
            } as any;

            await expect(
                planningService.createAssignment(assignmentData)
            ).rejects.toThrow('Conflit');
        });

        it('should throw error if user is on leave', async () => {
            const assignmentData = {
                userId: 1,
                operatingRoomId: 1,
                date: new Date('2024-01-15'),
                period: 'AM' as const,
            };

            mockedPrisma.attribution = {
                findFirst: jest.fn().mockResolvedValue(null),
            } as any;

            // Mock user on leave
            mockedPrisma.leave = {
                findFirst: jest.fn().mockResolvedValue({
                    id: 1,
                    startDate: new Date('2024-01-10'),
                    endDate: new Date('2024-01-20'),
                }),
            } as any;

            await expect(
                planningService.createAssignment(assignmentData)
            ).rejects.toThrow('en congé');
        });
    });

    describe('bulkCreateAssignments', () => {
        it('should create multiple attributions in transaction', async () => {
            const attributions = [
                {
                    userId: 1,
                    operatingRoomId: 1,
                    date: new Date('2024-01-15'),
                    period: 'AM' as const,
                },
                {
                    userId: 2,
                    operatingRoomId: 2,
                    date: new Date('2024-01-15'),
                    period: 'PM' as const,
                },
            ];

            mockedPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
                return callback(mockedPrisma);
            });

            mockedPrisma.attribution = {
                createMany: jest.fn().mockResolvedValue({ count: 2 }),
            } as any;

            const result = await planningService.bulkCreateAssignments(attributions);

            expect(result.created).toBe(2);
            expect(mockedPrisma.$transaction).toHaveBeenCalled();
        });

        it('should skip conflicting attributions', async () => {
            const attributions = [
                {
                    userId: 1,
                    operatingRoomId: 1,
                    date: new Date('2024-01-15'),
                    period: 'AM' as const,
                },
            ];

            mockedPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
                return callback(mockedPrisma);
            });

            // Mock conflict
            mockedPrisma.attribution = {
                findFirst: jest.fn().mockResolvedValue({ id: 999 }),
            } as any;

            const result = await planningService.bulkCreateAssignments(attributions);

            expect(result.created).toBe(0);
            expect(result.skipped).toBe(1);
            expect(result.errors).toHaveLength(1);
        });
    });

    describe('swapAssignments', () => {
        it('should swap two attributions', async () => {
            const assignment1 = {
                id: 1,
                userId: 1,
                operatingRoomId: 1,
                date: new Date('2024-01-15'),
                period: 'AM',
            };

            const assignment2 = {
                id: 2,
                userId: 2,
                operatingRoomId: 2,
                date: new Date('2024-01-20'),
                period: 'PM',
            };

            mockedPrisma.attribution = {
                findUnique: jest.fn()
                    .mockResolvedValueOnce(assignment1)
                    .mockResolvedValueOnce(assignment2),
            } as any;

            mockedPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
                return callback(mockedPrisma);
            });

            mockedPrisma.attribution.update = jest.fn()
                .mockResolvedValueOnce({ ...assignment1, userId: 2 })
                .mockResolvedValueOnce({ ...assignment2, userId: 1 });

            const result = await planningService.swapAssignments(1, 2);

            expect(result).toHaveLength(2);
            expect(mockedPrisma.attribution.update).toHaveBeenCalledTimes(2);
        });

        it('should throw error if attributions not found', async () => {
            mockedPrisma.attribution = {
                findUnique: jest.fn().mockResolvedValue(null),
            } as any;

            await expect(
                planningService.swapAssignments(999, 1000)
            ).rejects.toThrow('Attribution introuvable');
        });
    });

    describe('validatePlanning', () => {
        it('should validate planning and return violations', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-07');
            const siteId = 1;

            const mockAssignments = [
                {
                    id: 1,
                    userId: 1,
                    date: new Date('2024-01-01'),
                    period: 'AM',
                },
                {
                    id: 2,
                    userId: 1,
                    date: new Date('2024-01-01'),
                    period: 'PM',
                },
                // User 1 has 2 attributions on same day - potential violation
            ];

            mockedPrisma.attribution = {
                findMany: jest.fn().mockResolvedValue(mockAssignments),
            } as any;

            const result = await planningService.validatePlanning(startDate, endDate, siteId);

            expect(result.violations).toBeDefined();
            expect(result.statistics).toBeDefined();
            expect(result.statistics.totalAssignments).toBe(2);
        });
    });

    describe('getAvailableUsers', () => {
        it('should return available users for a specific créneau', async () => {
            const date = new Date('2024-01-15');
            const period = 'AM';
            const siteId = 1;

            const mockUsers = [
                { id: 1, nom: 'Doe', prenom: 'John' },
                { id: 2, nom: 'Smith', prenom: 'Jane' },
            ];

            // Mock users at site
            mockedPrisma.user = {
                findMany: jest.fn().mockResolvedValue(mockUsers),
            } as any;

            // Mock busy users
            mockedPrisma.attribution = {
                findMany: jest.fn().mockResolvedValue([
                    { userId: 2 }, // User 2 is busy
                ]),
            } as any;

            // Mock users on leave
            mockedPrisma.leave = {
                findMany: jest.fn().mockResolvedValue([]),
            } as any;

            const result = await planningService.getAvailableUsers(date, period, siteId);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(1); // Only user 1 is available
        });

        it('should exclude users on leave', async () => {
            const date = new Date('2024-01-15');
            const period = 'AM';
            const siteId = 1;

            mockedPrisma.user = {
                findMany: jest.fn().mockResolvedValue([
                    { id: 1, nom: 'Doe', prenom: 'John' },
                ]),
            } as any;

            mockedPrisma.attribution = {
                findMany: jest.fn().mockResolvedValue([]),
            } as any;

            // User 1 is on leave
            mockedPrisma.leave = {
                findMany: jest.fn().mockResolvedValue([
                    { userId: 1 },
                ]),
            } as any;

            const result = await planningService.getAvailableUsers(date, period, siteId);

            expect(result).toHaveLength(0);
        });
    });

    describe('getStatistics', () => {
        it('should calculate planning statistics', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');
            const siteId = 1;

            mockedPrisma.attribution = {
                count: jest.fn().mockResolvedValue(50),
                groupBy: jest.fn().mockResolvedValue([
                    { userId: 1, _count: { _all: 10 } },
                    { userId: 2, _count: { _all: 15 } },
                    { userId: 3, _count: { _all: 25 } },
                ]),
            } as any;

            mockedPrisma.operatingRoom = {
                count: jest.fn().mockResolvedValue(5),
            } as any;

            const result = await planningService.getStatistics(startDate, endDate, siteId);

            expect(result).toMatchObject({
                totalAssignments: 50,
                assignmentsByUser: expect.any(Array),
                averageAssignmentsPerUser: expect.any(Number),
                coverageRate: expect.any(Number),
            });
        });
    });
});