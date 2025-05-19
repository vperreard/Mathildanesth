import { createMocks } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Leave, LeaveStatus, Role as UserRole } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import handler from '../approve'; // L'API handler
import { prisma } from '@/lib/prisma';
import { LeaveQueryCacheService } from '@/modules/leaves/services/LeaveQueryCacheService';
import { logger } from '@/lib/logger';

// Mocks
jest.mock('@/lib/prisma', () => ({ __esModule: true, prisma: mockDeep<PrismaClient>() }));
const mockCacheServiceInstance = { invalidateCache: jest.fn() };
jest.mock('@/modules/leaves/services/LeaveQueryCacheService', () => ({
    __esModule: true,
    LeaveQueryCacheService: { getInstance: jest.fn(() => mockCacheServiceInstance) },
}));
jest.mock('@/lib/logger', () => ({
    __esModule: true,
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }
}));

// Mock de la session utilisateur (à adapter selon votre implémentation réelle)
// jest.mock('@/lib/auth', () => ({
//     __esModule: true,
//     getSessionUser: jest.fn().mockResolvedValue({ id: 999, role: UserRole.ADMIN_TOTAL }) // Mock admin user
// }));

describe('POST /api/leaves/[leaveId]/approve', () => {
    let mockPrisma: DeepMockProxy<PrismaClient>;
    const mockLeaveId = 'leave_to_approve_123';
    const mockUserId = 1;

    const pendingLeave: Partial<Leave> = {
        id: mockLeaveId,
        userId: mockUserId,
        status: LeaveStatus.PENDING,
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-09-05'),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;
        Object.values(mockCacheServiceInstance).forEach(mockFn => mockFn.mockReset());
        // @ts-ignore
        mockPrisma.notification.create.mockResolvedValue({} as any); // Pour le TODO sur les notifications
    });

    test('should approve a PENDING leave successfully and return 200', async () => {
        // @ts-ignore
        mockPrisma.leave.findUnique.mockResolvedValue(pendingLeave as Leave);
        const approvedLeaveData = { ...pendingLeave, status: LeaveStatus.APPROVED, approvalDate: new Date(), approvedById: 999 };
        // @ts-ignore
        mockPrisma.leave.update.mockResolvedValue(approvedLeaveData as Leave);

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
            method: 'POST',
            query: { leaveId: mockLeaveId },
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const responseData = res._getJSONData();
        expect(responseData.status).toBe(LeaveStatus.APPROVED);
        expect(responseData.approvedById).toBe(999); // mockApproverId
        expect(mockPrisma.leave.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: mockLeaveId },
            data: {
                status: LeaveStatus.APPROVED,
                approvalDate: expect.any(Date),
                approvedById: 999,
            },
        }));
        expect(mockCacheServiceInstance.invalidateCache).toHaveBeenCalled();
        // expect(mockPrisma.notification.create).toHaveBeenCalled(); // Décommenter quand les notifications sont implémentées
    });

    test('should return 404 if leave to approve is not found', async () => {
        // @ts-ignore
        mockPrisma.leave.findUnique.mockResolvedValue(null);
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
            method: 'POST',
            query: { leaveId: 'non_existent_id' },
        });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(404);
        expect(res._getJSONData().error).toBe('Leave not found.');
    });

    test('should return 400 if leave is not in PENDING status', async () => {
        // @ts-ignore
        mockPrisma.leave.findUnique.mockResolvedValue({ ...pendingLeave, status: LeaveStatus.APPROVED } as Leave);
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
            method: 'POST',
            query: { leaveId: mockLeaveId },
        });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(res._getJSONData().error).toContain('Leave is not in PENDING status');
    });

    // TODO: Ajouter des tests pour les permissions (quand getSessionUser est implémenté)
}); 