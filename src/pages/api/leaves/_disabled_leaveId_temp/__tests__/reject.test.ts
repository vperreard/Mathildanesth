import { createMocks } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Leave, LeaveStatus, Role as UserRole } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import handler from '../reject'; // L'API handler
import { prisma } from '@/lib/prisma';
import { LeaveQueryCacheService } from '@/modules/leaves/services/LeaveQueryCacheService';
import { logger } from '@/lib/logger';

// Mocks (similaires à approve.test.ts)
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

// jest.mock('@/lib/auth', () => ({
//     __esModule: true,
//     getSessionUser: jest.fn().mockResolvedValue({ id: 999, role: UserRole.ADMIN_TOTAL })
// }));

describe('POST /api/leaves/[leaveId]/reject', () => {
    let mockPrisma: DeepMockProxy<PrismaClient>;
    const mockLeaveId = 'leave_to_reject_123';
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
        mockPrisma.notification.create.mockResolvedValue({} as any);
    });

    test('should reject a PENDING leave successfully with a reason and return 200', async () => {
        // @ts-ignore
        mockPrisma.leave.findUnique.mockResolvedValue(pendingLeave as Leave);
        const rejectionReason = "Motif de test pour le rejet";
        const rejectedLeaveData = {
            ...pendingLeave,
            status: LeaveStatus.REJECTED,
            comment: `Rejeté: ${rejectionReason}`
        };
        // @ts-ignore
        mockPrisma.leave.update.mockResolvedValue(rejectedLeaveData as Leave);

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
            method: 'POST',
            query: { leaveId: mockLeaveId },
            body: { rejectionReason },
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const responseData = res._getJSONData();
        expect(responseData.status).toBe(LeaveStatus.REJECTED);
        expect(responseData.comment).toContain(rejectionReason);
        expect(mockPrisma.leave.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: mockLeaveId },
            data: {
                status: LeaveStatus.REJECTED,
                comment: `Rejeté: ${rejectionReason}`,
            },
        }));
        expect(mockCacheServiceInstance.invalidateCache).toHaveBeenCalled();
    });

    test('should reject a PENDING leave successfully without a reason and return 200', async () => {
        // @ts-ignore
        mockPrisma.leave.findUnique.mockResolvedValue(pendingLeave as Leave);
        const rejectedLeaveData = { ...pendingLeave, status: LeaveStatus.REJECTED };
        // @ts-ignore
        mockPrisma.leave.update.mockResolvedValue(rejectedLeaveData as Leave);

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
            method: 'POST',
            query: { leaveId: mockLeaveId },
            body: {}, // Pas de motif
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        expect(res._getJSONData().status).toBe(LeaveStatus.REJECTED);
        expect(mockPrisma.leave.update).toHaveBeenCalledWith(expect.objectContaining({
            data: { status: LeaveStatus.REJECTED }, // comment ne devrait pas être là ou être undefined
        }));
    });

    test('should return 404 if leave to reject is not found', async () => {
        // @ts-ignore
        mockPrisma.leave.findUnique.mockResolvedValue(null);
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
            method: 'POST',
            query: { leaveId: 'non_existent_id' },
            body: { rejectionReason: 'Test' },
        });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(404);
    });

    test('should return 400 if leave is not in PENDING status', async () => {
        // @ts-ignore
        mockPrisma.leave.findUnique.mockResolvedValue({ ...pendingLeave, status: LeaveStatus.APPROVED } as Leave);
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
            method: 'POST',
            query: { leaveId: mockLeaveId },
            body: { rejectionReason: 'Test' },
        });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(400);
    });

    // TODO: Ajouter des tests pour les permissions
}); 