import { prisma } from '@/lib/prisma';
import { calendarService } from '../calendarService';
import { LeaveStatus } from '@prisma/client';

// Mock dependencies
jest.mock('@/lib/prisma');

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('CalendarService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getEvents', () => {
        it('should return calendar events for user', async () => {
            const userId = 1;
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            // Mock assignments
            const mockAssignments = [
                {
                    id: 1,
                    date: new Date('2024-01-15'),
                    period: 'AM',
                    operatingRoom: { name: 'Salle 1' },
                },
                {
                    id: 2,
                    date: new Date('2024-01-20'),
                    period: 'PM',
                    operatingRoom: { name: 'Salle 2' },
                },
            ];

            // Mock leaves
            const mockLeaves = [
                {
                    id: 1,
                    startDate: new Date('2024-01-10'),
                    endDate: new Date('2024-01-12'),
                    status: LeaveStatus.APPROVED,
                    leaveType: { code: 'CP', label: 'Congés Payés', color: '#4CAF50' },
                },
            ];

            mockedPrisma.assignment = {
                findMany: jest.fn().mockResolvedValue(mockAssignments),
            } as any;

            mockedPrisma.leave = {
                findMany: jest.fn().mockResolvedValue(mockLeaves),
            } as any;

            const result = await calendarService.getEvents(userId, startDate, endDate);

            expect(result).toHaveLength(3); // 2 assignments + 1 leave
            expect(result).toContainEqual(
                expect.objectContaining({
                    type: 'assignment',
                    title: 'Salle 1 - Matin',
                    date: new Date('2024-01-15'),
                })
            );
            expect(result).toContainEqual(
                expect.objectContaining({
                    type: 'leave',
                    title: 'Congés Payés',
                    start: new Date('2024-01-10'),
                    end: new Date('2024-01-12'),
                })
            );

            expect(mockedPrisma.assignment.findMany).toHaveBeenCalledWith({
                where: {
                    userId,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                include: {
                    operatingRoom: true,
                },
            });

            expect(mockedPrisma.leave.findMany).toHaveBeenCalledWith({
                where: {
                    userId,
                    status: LeaveStatus.APPROVED,
                    OR: [
                        {
                            startDate: {
                                gte: startDate,
                                lte: endDate,
                            },
                        },
                        {
                            endDate: {
                                gte: startDate,
                                lte: endDate,
                            },
                        },
                    ],
                },
                include: {
                    leaveType: true,
                },
            });
        });

        it('should include pending leaves when specified', async () => {
            const userId = 1;
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            mockedPrisma.assignment = {
                findMany: jest.fn().mockResolvedValue([]),
            } as any;

            mockedPrisma.leave = {
                findMany: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        startDate: new Date('2024-01-15'),
                        endDate: new Date('2024-01-17'),
                        status: LeaveStatus.PENDING,
                        leaveType: { code: 'RTT', label: 'RTT', color: '#2196F3' },
                    },
                ]),
            } as any;

            const result = await calendarService.getEvents(userId, startDate, endDate, {
                includePendingLeaves: true,
            });

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                type: 'leave',
                status: 'pending',
                title: 'RTT (En attente)',
            });

            expect(mockedPrisma.leave.findMany).toHaveBeenCalledWith({
                where: {
                    userId,
                    status: {
                        in: [LeaveStatus.APPROVED, LeaveStatus.PENDING],
                    },
                    OR: expect.any(Array),
                },
                include: expect.any(Object),
            });
        });

        it('should return empty array when no events', async () => {
            mockedPrisma.assignment = {
                findMany: jest.fn().mockResolvedValue([]),
            } as any;

            mockedPrisma.leave = {
                findMany: jest.fn().mockResolvedValue([]),
            } as any;

            const result = await calendarService.getEvents(1, new Date(), new Date());

            expect(result).toEqual([]);
        });
    });

    describe('getTeamCalendar', () => {
        it('should return team calendar events', async () => {
            const siteId = 1;
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            // Mock team members
            const mockUsers = [
                { id: 1, nom: 'Doe', prenom: 'John' },
                { id: 2, nom: 'Smith', prenom: 'Jane' },
            ];

            // Mock assignments
            const mockAssignments = [
                {
                    id: 1,
                    userId: 1,
                    date: new Date('2024-01-15'),
                    period: 'AM',
                    user: mockUsers[0],
                    operatingRoom: { name: 'Salle 1' },
                },
            ];

            // Mock leaves
            const mockLeaves = [
                {
                    id: 1,
                    userId: 2,
                    startDate: new Date('2024-01-20'),
                    endDate: new Date('2024-01-22'),
                    status: LeaveStatus.APPROVED,
                    user: mockUsers[1],
                    leaveType: { code: 'CP', label: 'Congés Payés', color: '#4CAF50' },
                },
            ];

            mockedPrisma.user = {
                findMany: jest.fn().mockResolvedValue(mockUsers),
            } as any;

            mockedPrisma.assignment = {
                findMany: jest.fn().mockResolvedValue(mockAssignments),
            } as any;

            mockedPrisma.leave = {
                findMany: jest.fn().mockResolvedValue(mockLeaves),
            } as any;

            const result = await calendarService.getTeamCalendar(siteId, startDate, endDate);

            expect(result).toMatchObject({
                teamMembers: mockUsers,
                events: expect.arrayContaining([
                    expect.objectContaining({
                        type: 'assignment',
                        userId: 1,
                        userName: 'Doe John',
                    }),
                    expect.objectContaining({
                        type: 'leave',
                        userId: 2,
                        userName: 'Smith Jane',
                    }),
                ]),
            });

            expect(mockedPrisma.user.findMany).toHaveBeenCalledWith({
                where: {
                    sites: { some: { id: siteId } },
                    userStatus: 'ACTIF',
                },
                select: {
                    id: true,
                    nom: true,
                    prenom: true,
                },
            });
        });
    });

    describe('exportCalendar', () => {
        it('should export calendar in ICS format', async () => {
            const userId = 1;
            const year = 2024;

            const mockEvents = [
                {
                    id: 1,
                    date: new Date('2024-06-15T08:00:00'),
                    period: 'AM',
                    operatingRoom: { name: 'Salle 1' },
                },
            ];

            const mockLeaves = [
                {
                    id: 1,
                    startDate: new Date('2024-07-01'),
                    endDate: new Date('2024-07-15'),
                    status: LeaveStatus.APPROVED,
                    leaveType: { label: 'Congés Payés' },
                },
            ];

            mockedPrisma.assignment = {
                findMany: jest.fn().mockResolvedValue(mockEvents),
            } as any;

            mockedPrisma.leave = {
                findMany: jest.fn().mockResolvedValue(mockLeaves),
            } as any;

            const result = await calendarService.exportCalendar(userId, year, 'ics');

            expect(result).toContain('BEGIN:VCALENDAR');
            expect(result).toContain('BEGIN:VEVENT');
            expect(result).toContain('SUMMARY:Salle 1 - Matin');
            expect(result).toContain('SUMMARY:Congés Payés');
            expect(result).toContain('END:VCALENDAR');
        });

        it('should export calendar in JSON format', async () => {
            const userId = 1;
            const year = 2024;

            mockedPrisma.assignment = {
                findMany: jest.fn().mockResolvedValue([]),
            } as any;

            mockedPrisma.leave = {
                findMany: jest.fn().mockResolvedValue([]),
            } as any;

            const result = await calendarService.exportCalendar(userId, year, 'json');
            const parsed = JSON.parse(result);

            expect(parsed).toHaveProperty('year', year);
            expect(parsed).toHaveProperty('events');
            expect(Array.isArray(parsed.events)).toBe(true);
        });

        it('should throw error for unsupported format', async () => {
            await expect(
                calendarService.exportCalendar(1, 2024, 'pdf' as any)
            ).rejects.toThrow('Format non supporté');
        });
    });

    describe('getPublicHolidays', () => {
        it('should return public holidays for year', async () => {
            const year = 2024;
            const mockHolidays = [
                {
                    id: 1,
                    date: new Date('2024-01-01'),
                    name: 'Jour de l\'An',
                },
                {
                    id: 2,
                    date: new Date('2024-05-01'),
                    name: 'Fête du Travail',
                },
            ];

            mockedPrisma.publicHoliday = {
                findMany: jest.fn().mockResolvedValue(mockHolidays),
            } as any;

            const result = await calendarService.getPublicHolidays(year);

            expect(result).toEqual(mockHolidays);
            expect(mockedPrisma.publicHoliday.findMany).toHaveBeenCalledWith({
                where: {
                    date: {
                        gte: new Date('2024-01-01'),
                        lt: new Date('2025-01-01'),
                    },
                },
                orderBy: { date: 'asc' },
            });
        });
    });
});