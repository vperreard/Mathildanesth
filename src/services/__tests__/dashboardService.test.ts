import { prisma } from '@/lib/prisma';
import { dashboardService } from '../dashboardService';
import { Role, LeaveStatus } from '@prisma/client';

// Mock dependencies
jest.mock('@/lib/prisma');

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('DashboardService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserDashboard', () => {
        it('should return user dashboard data', async () => {
            const userId = 1;
            const currentDate = new Date();
            const year = currentDate.getFullYear();

            // Mock assignments
            mockedPrisma.assignment = {
                findMany: jest.fn().mockResolvedValue([
                    { id: 1, date: new Date(), period: 'AM' },
                    { id: 2, date: new Date(Date.now() + 86400000), period: 'PM' },
                ]),
                count: jest.fn().mockResolvedValue(15),
            } as any;

            // Mock leaves
            mockedPrisma.leave = {
                findMany: jest.fn().mockResolvedValue([
                    { id: 1, status: LeaveStatus.PENDING, countedDays: 5 },
                ]),
                count: jest.fn().mockResolvedValue(3),
            } as any;

            // Mock leave balances
            mockedPrisma.leaveBalance = {
                findMany: jest.fn().mockResolvedValue([
                    {
                        leaveTypeCode: 'CP',
                        initialAllowance: 25,
                        used: 10,
                        carriedOver: 2,
                        leaveType: { code: 'CP', label: 'Congés Payés' },
                    },
                ]),
            } as any;

            // Mock notifications
            mockedPrisma.notification = {
                count: jest.fn().mockResolvedValue(5),
            } as any;

            const result = await dashboardService.getUserDashboard(userId);

            expect(result).toMatchObject({
                upcomingAssignments: expect.any(Array),
                totalAssignmentsThisMonth: 15,
                pendingLeaveRequests: expect.any(Array),
                totalLeavesThisYear: 3,
                leaveBalances: expect.any(Array),
                unreadNotifications: 5,
            });

            expect(mockedPrisma.assignment.findMany).toHaveBeenCalledWith({
                where: {
                    userId,
                    date: { gte: expect.any(Date) },
                },
                orderBy: { date: 'asc' },
                take: 10,
                include: expect.any(Object),
            });
        });

        it('should handle empty dashboard data', async () => {
            const userId = 1;

            // Mock empty responses
            mockedPrisma.assignment = {
                findMany: jest.fn().mockResolvedValue([]),
                count: jest.fn().mockResolvedValue(0),
            } as any;

            mockedPrisma.leave = {
                findMany: jest.fn().mockResolvedValue([]),
                count: jest.fn().mockResolvedValue(0),
            } as any;

            mockedPrisma.leaveBalance = {
                findMany: jest.fn().mockResolvedValue([]),
            } as any;

            mockedPrisma.notification = {
                count: jest.fn().mockResolvedValue(0),
            } as any;

            const result = await dashboardService.getUserDashboard(userId);

            expect(result).toEqual({
                upcomingAssignments: [],
                totalAssignmentsThisMonth: 0,
                pendingLeaveRequests: [],
                totalLeavesThisYear: 0,
                leaveBalances: [],
                unreadNotifications: 0,
            });
        });
    });

    describe('getAdminDashboard', () => {
        it('should return admin dashboard data', async () => {
            const adminUserId = 1;

            // Mock admin specific data
            mockedPrisma.leave = {
                count: jest.fn()
                    .mockResolvedValueOnce(10) // pending leaves
                    .mockResolvedValueOnce(50), // total leaves this month
            } as any;

            mockedPrisma.user = {
                count: jest.fn()
                    .mockResolvedValueOnce(100) // total users
                    .mockResolvedValueOnce(95), // active users
            } as any;

            mockedPrisma.assignment = {
                count: jest.fn().mockResolvedValue(200),
                groupBy: jest.fn().mockResolvedValue([
                    { status: 'ASSIGNED', _count: { _all: 150 } },
                    { status: 'VACANT', _count: { _all: 50 } },
                ]),
            } as any;

            mockedPrisma.assignmentSwapRequest = {
                count: jest.fn().mockResolvedValue(5),
                findMany: jest.fn().mockResolvedValue([
                    { id: 1, status: 'PENDING' },
                ]),
            } as any;

            const result = await dashboardService.getAdminDashboard(adminUserId);

            expect(result).toMatchObject({
                pendingLeaveRequests: 10,
                totalLeavesThisMonth: 50,
                totalUsers: 100,
                activeUsers: 95,
                totalAssignmentsThisMonth: 200,
                assignmentStatistics: expect.any(Array),
                pendingSwapRequests: 5,
                recentSwapRequests: expect.any(Array),
            });
        });

        it('should handle partial admin role', async () => {
            const adminUserId = 1;
            const siteIds = [1, 2];

            // Mock site-filtered data
            mockedPrisma.leave = {
                count: jest.fn().mockResolvedValue(5),
            } as any;

            mockedPrisma.user = {
                count: jest.fn().mockResolvedValue(30),
            } as any;

            mockedPrisma.assignment = {
                count: jest.fn().mockResolvedValue(50),
                groupBy: jest.fn().mockResolvedValue([]),
            } as any;

            mockedPrisma.assignmentSwapRequest = {
                count: jest.fn().mockResolvedValue(2),
                findMany: jest.fn().mockResolvedValue([]),
            } as any;

            const result = await dashboardService.getAdminDashboard(adminUserId, siteIds);

            // Verify site filtering was applied
            expect(mockedPrisma.user.count).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    sites: { some: { id: { in: siteIds } } },
                }),
            });
        });
    });

    describe('getTeamDashboard', () => {
        it('should return team dashboard for site', async () => {
            const siteId = 1;
            const startDate = new Date();
            const endDate = new Date(Date.now() + 7 * 86400000);

            // Mock team members
            mockedPrisma.user = {
                findMany: jest.fn().mockResolvedValue([
                    { id: 1, nom: 'Doe', prenom: 'John' },
                    { id: 2, nom: 'Smith', prenom: 'Jane' },
                ]),
            } as any;

            // Mock assignments
            mockedPrisma.assignment = {
                findMany: jest.fn().mockResolvedValue([
                    { userId: 1, date: startDate, period: 'AM' },
                    { userId: 2, date: startDate, period: 'PM' },
                ]),
            } as any;

            // Mock leaves
            mockedPrisma.leave = {
                findMany: jest.fn().mockResolvedValue([
                    { userId: 1, startDate, endDate, status: LeaveStatus.APPROVED },
                ]),
            } as any;

            const result = await dashboardService.getTeamDashboard(siteId, startDate, endDate);

            expect(result).toMatchObject({
                teamMembers: expect.arrayContaining([
                    expect.objectContaining({ id: 1 }),
                    expect.objectContaining({ id: 2 }),
                ]),
                assignments: expect.any(Array),
                leaves: expect.any(Array),
                statistics: expect.objectContaining({
                    totalMembers: 2,
                    totalAssignments: 2,
                    totalLeaves: 1,
                }),
            });
        });
    });

    describe('getDashboardStatistics', () => {
        it('should calculate statistics correctly', async () => {
            const userId = 1;
            const year = new Date().getFullYear();

            // Mock monthly assignments
            mockedPrisma.$queryRaw = jest.fn().mockResolvedValue([
                { month: 1, count: 20 },
                { month: 2, count: 18 },
                { month: 3, count: 22 },
            ]);

            // Mock leave statistics
            mockedPrisma.leave = {
                groupBy: jest.fn().mockResolvedValue([
                    { leaveTypeCode: 'CP', _sum: { countedDays: 15 } },
                    { leaveTypeCode: 'RTT', _sum: { countedDays: 5 } },
                ]),
            } as any;

            const result = await dashboardService.getDashboardStatistics(userId, year);

            expect(result).toMatchObject({
                monthlyAssignments: expect.any(Array),
                leavesByType: expect.any(Array),
                yearlyTotals: expect.objectContaining({
                    totalAssignments: expect.any(Number),
                    totalLeaveDays: 20,
                }),
            });
        });
    });
});