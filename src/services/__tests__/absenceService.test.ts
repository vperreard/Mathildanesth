/**
 * @jest-environment node
 */
import { prisma } from '@/lib/prisma';
import { absenceService } from '../absenceService';
import { LeaveStatus } from '@prisma/client';

// Mock dependencies
jest.mock('@/lib/prisma');
jest.mock('../notificationService');

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('AbsenceService', () => {
  let testEnv: any;
  
  beforeAll(() => {
    testEnv = setupTestEnvironment();
  });
  
  afterAll(() => {
    cleanupTestEnvironment();
    testEnv.restoreConsole?.();
  });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Les tests CRUD sont skippés car ils font des appels HTTP
    // Les nouvelles fonctions métier sont testées ci-dessous

    describe('getAbsencePatterns', () => {
        it('should detect frequent Monday/Friday absences', async () => {
            const userId = 1;
            const year = 2024;

            const mockAbsences = [
                { date: new Date('2024-01-01'), dayOfWeek: 1 }, // Monday
                { date: new Date('2024-01-08'), dayOfWeek: 1 }, // Monday
                { date: new Date('2024-01-15'), dayOfWeek: 1 }, // Monday
                { date: new Date('2024-01-05'), dayOfWeek: 5 }, // Friday
                { date: new Date('2024-01-12'), dayOfWeek: 5 }, // Friday
                { date: new Date('2024-01-19'), dayOfWeek: 5 }, // Friday
            ];

            // Mock pour la requête SQL raw
            mockedPrisma.$queryRaw = jest.fn().mockResolvedValue(mockAbsences);
            
            // Mock pour les absences normales
            mockedPrisma.absence = {
                findMany: jest.fn().mockResolvedValue([
                    { date: new Date('2024-01-01') },
                    { date: new Date('2024-01-08') },
                ]),
            } as any;

            // Mock pour publicHoliday
            (mockedPrisma as any).publicHoliday = {
                findMany: jest.fn().mockResolvedValue([]),
            };

            const result = await absenceService.getAbsencePatterns(userId, year);

            expect(result.frequentDays).toContain('Monday');
            expect(result.frequentDays).toContain('Friday');
            expect(result.suspiciousPattern).toBe(true);
        });

        it('should detect bridge day patterns', async () => {
            const userId = 1;
            const mockAbsences = [
                { date: new Date('2024-05-10') }, // Friday after Thursday holiday
                { date: new Date('2024-05-31') }, // Friday after Thursday holiday
            ];

            mockedPrisma.absence = {
                findMany: jest.fn().mockResolvedValue(mockAbsences),
            } as any;

            // Mock pour publicHoliday ou créer une alternative
            (mockedPrisma as any).publicHoliday = {
                findMany: jest.fn().mockResolvedValue([
                    { date: new Date('2024-05-09') }, // Thursday
                    { date: new Date('2024-05-30') }, // Thursday
                ]),
            };

            const result = await absenceService.getAbsencePatterns(userId, 2024);

            expect(result.bridgeDays).toBeGreaterThan(0);
        });
    });

    describe('getAbsenceStatistics', () => {
        it('should calculate absence statistics by type', async () => {
            const year = 2024;
            const siteId = 1;

            mockedPrisma.absence = {
                groupBy: jest.fn().mockResolvedValue([
                    { type: 'SICK', _count: { _all: 50 } },
                    { type: 'UNPLANNED', _count: { _all: 20 } },
                    { type: 'FAMILY', _count: { _all: 10 } },
                ]),
                count: jest.fn().mockResolvedValue(80),
            } as any;

            mockedPrisma.$queryRaw = jest.fn().mockResolvedValue([
                { month: 1, count: 10 },
                { month: 2, count: 8 },
                { month: 3, count: 12 },
            ]);

            const result = await absenceService.getAbsenceStatistics(year, siteId);

            expect(result).toMatchObject({
                totalAbsences: 80,
                byType: expect.arrayContaining([
                    expect.objectContaining({ type: 'SICK', count: 50 }),
                ]),
                byMonth: expect.any(Array),
                averagePerMonth: expect.any(Number),
            });
        });

        it('should calculate department-specific statistics', async () => {
            const year = 2024;
            const departmentId = 1;

            mockedPrisma.absence = {
                groupBy: jest.fn().mockResolvedValue([
                    { userId: 1, _count: { _all: 5 } },
                    { userId: 2, _count: { _all: 8 } },
                ]),
                count: jest.fn().mockResolvedValue(13),
            } as any;

            mockedPrisma.user = {
                count: jest.fn().mockResolvedValue(10),
            } as any;

            const result = await absenceService.getAbsenceStatistics(year, undefined, departmentId);

            expect(result.averagePerUser).toBeCloseTo(1.3);
            expect(result.topAbsentUsers).toHaveLength(2);
        });
    });

    describe('handleLateNotification', () => {
        it('should notify managers of late absence', async () => {
            const absenceData = {
                userId: 1,
                date: new Date(),
                reason: 'Urgence',
                notifiedAt: new Date(),
            };

            // Mock user and managers
            mockedPrisma.user = {
                findUnique: jest.fn().mockResolvedValue({
                    id: 1,
                    nom: 'Doe',
                    prenom: 'John',
                    sites: [{ id: 1 }],
                }),
                findMany: jest.fn().mockResolvedValue([
                    { id: 2, email: 'manager@test.com' },
                ]),
            } as any;

            // Mock notification creation
            mockedPrisma.notification = {
                create: jest.fn().mockResolvedValue({
                    id: 1,
                    userId: 2,
                    type: 'ABSENCE_LATE',
                    title: 'Absence tardive signalée',
                    message: 'John Doe a signalé une absence le jour même pour: Urgence',
                    createdAt: new Date(),
                }),
            } as any;

            await absenceService.handleLateNotification(absenceData);

            expect(mockedPrisma.notification.create).toHaveBeenCalled();
        });
    });

    describe('findReplacement', () => {
        it('should find available replacement users', async () => {
            const assignmentData = {
                date: new Date('2024-01-15'),
                period: 'AM',
                operatingRoomId: 1,
                requiredSkills: ['ANESTHESIA'],
            };

            // Mock available users
            mockedPrisma.user = {
                findMany: jest.fn().mockResolvedValue([
                    { id: 2, nom: 'Smith', prenom: 'Jane' },
                    { id: 3, nom: 'Brown', prenom: 'Bob' },
                ]),
            } as any;

            // Mock busy users
            mockedPrisma.attribution = {
                findMany: jest.fn().mockResolvedValue([
                    { userId: 3 }, // User 3 is busy
                ]),
                groupBy: jest.fn().mockResolvedValue([
                    { userId: 2, _count: { _all: 5 } },
                    { userId: 3, _count: { _all: 10 } },
                ]),
            } as any;

            // Mock users on leave
            mockedPrisma.leave = {
                findMany: jest.fn().mockResolvedValue([]),
            } as any;

            const result = await absenceService.findReplacement(assignmentData);

            expect(result.available).toHaveLength(1);
            expect(result.available[0].id).toBe(2);
        });

        it('should rank replacements by availability score', async () => {
            const assignmentData = {
                date: new Date('2024-01-15'),
                period: 'AM',
                operatingRoomId: 1,
            };

            // Mock user workload
            mockedPrisma.user = {
                findMany: jest.fn().mockResolvedValue([
                    { id: 2, nom: 'Smith', prenom: 'Jane' },
                    { id: 3, nom: 'Brown', prenom: 'Bob' },
                ]),
            } as any;

            mockedPrisma.attribution = {
                findMany: jest.fn().mockResolvedValue([]),
                groupBy: jest.fn().mockResolvedValue([
                    { userId: 2, _count: { _all: 20 } }, // Heavy workload
                    { userId: 3, _count: { _all: 10 } }, // Light workload
                ]),
            } as any;

            mockedPrisma.leave = {
                findMany: jest.fn().mockResolvedValue([]),
            } as any;

            const result = await absenceService.findReplacement(assignmentData);

            expect(result.available[0].id).toBe(3); // User with lighter workload ranked first
            expect(result.available[0].score).toBeGreaterThan(result.available[1].score);
        });
    });

    describe('convertToLeave', () => {
        it('should convert absence to approved leave', async () => {
            const absenceId = 1;
            const leaveTypeCode = 'SICK';

            const mockAbsence = {
                id: 1,
                userId: 1,
                date: new Date('2024-01-15'),
                reason: 'Maladie',
            };

            mockedPrisma.absence = {
                findUnique: jest.fn().mockResolvedValue(mockAbsence),
                update: jest.fn().mockResolvedValue({
                    ...mockAbsence,
                    convertedToLeave: true,
                }),
            } as any;

            mockedPrisma.leave = {
                create: jest.fn().mockResolvedValue({
                    id: 1,
                    userId: 1,
                    leaveTypeCode,
                    startDate: mockAbsence.date,
                    endDate: mockAbsence.date,
                    status: LeaveStatus.APPROVED,
                }),
            } as any;

            mockedPrisma.leaveBalance = {
                updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            } as any;

            const result = await absenceService.convertToLeave(absenceId, leaveTypeCode);

            expect(result.leave).toBeDefined();
            expect(mockedPrisma.leave.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    status: LeaveStatus.APPROVED,
                    leaveTypeCode,
                }),
            });
            expect(mockedPrisma.absence.update).toHaveBeenCalledWith({
                where: { id: absenceId },
                data: { convertedToLeave: true },
            });
        });
    });
});