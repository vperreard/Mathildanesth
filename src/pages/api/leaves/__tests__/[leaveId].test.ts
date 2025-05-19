import { createMocks, RequestMethod } from 'node-mocks-http';
import { getSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../[leaveId]';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { LeaveQueryCacheService } from '@/modules/leaves/services/LeaveQueryCacheService';
import { LeaveStatus, Role, LeaveType as PrismaLeaveType, Leave as PrismaLeave } from '@prisma/client';
import { parseISO } from 'date-fns';
import { LeaveEvent } from '@/modules/leaves/types/cache';

jest.mock('next-auth/react');
jest.mock('@/lib/prisma', () => ({
    prisma: {
        leave: {
            findUnique: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        leaveTypeSetting: {
            findFirst: jest.fn(),
        },
        publicHoliday: {
            findMany: jest.fn(),
        },
    },
}));
jest.mock('@/lib/logger');
jest.mock('@/modules/leaves/services/LeaveQueryCacheService', () => ({
    LeaveQueryCacheService: {
        getInstance: jest.fn(),
    }
}));

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockPrismaLeave = prisma.leave as jest.Mocked<typeof prisma.leave>;
const mockPrismaLeaveTypeSetting = prisma.leaveTypeSetting as jest.Mocked<typeof prisma.leaveTypeSetting>;
const mockPrismaPublicHoliday = prisma.publicHoliday as jest.Mocked<typeof prisma.publicHoliday>;
const mockInvalidateCache = jest.fn();

// Définir baseSessionUser et baseSession ici, au scope du describe principal
const baseSessionUser = { id: '1', name: 'Test User', email: 'user@example.com' };
const baseSession: Session = {
    user: { ...baseSessionUser, role: Role.USER },
    expires: 'some-future-date',
    accessToken: 'mock-access-token',
};

describe('/api/leaves/[leaveId] API Endpoint', () => {
    let mockLeaveQueryCacheServiceInstance: jest.Mocked<LeaveQueryCacheService>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockLeaveQueryCacheServiceInstance = {
            invalidateCache: mockInvalidateCache,
            getCachedData: jest.fn().mockResolvedValue(null),
            cacheData: jest.fn().mockResolvedValue(undefined),
        } as unknown as jest.Mocked<LeaveQueryCacheService>;

        (LeaveQueryCacheService.getInstance as jest.Mock).mockReturnValue(mockLeaveQueryCacheServiceInstance);
        mockGetSession.mockResolvedValue(baseSession);
        mockPrismaLeaveTypeSetting.findFirst.mockResolvedValue({
            id: 'clLeaveType1',
            code: 'ANNUAL',
            label: 'Congé Annuel',
            isActive: true,
            isUserSelectable: true,
        } as any);
        mockPrismaPublicHoliday.findMany.mockResolvedValue([]);
    });

    describe('GET /api/leaves/[leaveId]', () => {
        const leaveId = 'test-leave-id-get';
        const userId = 1;
        const adminId = 2;
        const sampleLeave: PrismaLeave = {
            id: leaveId,
            userId: userId,
            startDate: parseISO('2024-08-01T00:00:00.000Z'),
            endDate: parseISO('2024-08-05T00:00:00.000Z'),
            typeCode: 'ANNUAL',
            type: PrismaLeaveType.ANNUAL,
            status: LeaveStatus.PENDING,
            reason: 'Vacances',
            comment: null,
            requestDate: new Date(),
            approvalDate: null,
            approvedById: null,
            countedDays: 5,
            calculationDetails: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            isRecurring: false,
            parentId: null,
            recurrencePattern: null,
            isHalfDay: false,
            halfDayPeriod: null,
        };
        const userSession: Session = { ...baseSession, user: { ...baseSessionUser, id: userId.toString(), role: Role.USER } };
        const adminSession: Session = { ...baseSession, user: { ...baseSessionUser, id: adminId.toString(), role: Role.ADMIN_TOTAL } };
        const otherUserSession: Session = { ...baseSession, user: { ...baseSessionUser, id: '99', role: Role.USER } };

        it('should return 401 if user is not authenticated', async () => {
            mockGetSession.mockResolvedValueOnce(null);
            const { req, res } = createMocks({ method: 'GET', query: { leaveId } });
            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
            expect(res._getStatusCode()).toBe(401);
            expect(res._getJSONData().error).toContain('Unauthorized');
        });

        it('should return 400 if leaveId is not a string (e.g. missing)', async () => {
            const { req, res } = createMocks({ method: 'GET', query: {} });
            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
            expect(res._getStatusCode()).toBe(400);
            expect(res._getJSONData().error).toContain('Leave ID must be a string');
        });

        it('should return 404 if leave is not found', async () => {
            mockGetSession.mockResolvedValueOnce(userSession);
            mockPrismaLeave.findUnique.mockResolvedValueOnce(null);
            const { req, res } = createMocks({ method: 'GET', query: { leaveId: 'non-existent-id' } });
            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
            expect(res._getStatusCode()).toBe(404);
            expect(res._getJSONData().error).toBe('Leave not found.');
        });

        it('should return the leave if user is owner', async () => {
            mockGetSession.mockResolvedValueOnce(userSession);
            mockPrismaLeave.findUnique.mockResolvedValue(sampleLeave);
            const { req, res } = createMocks({ method: 'GET', query: { leaveId } });
            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
            expect(res._getStatusCode()).toBe(200);
            expect(res._getJSONData().id).toBe(leaveId);
            expect(res._getJSONData().userId).toBe(userId);
            expect(mockPrismaLeave.findUnique).toHaveBeenCalledWith({ where: { id: leaveId } });
            expect(mockPrismaLeave.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: leaveId }, include: expect.any(Object) }));
        });

        it('should return the leave if user is ADMIN_TOTAL', async () => {
            mockGetSession.mockResolvedValueOnce(adminSession);
            mockPrismaLeave.findUnique.mockResolvedValue(sampleLeave);
            const { req, res } = createMocks({ method: 'GET', query: { leaveId } });
            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
            expect(res._getStatusCode()).toBe(200);
            expect(res._getJSONData().id).toBe(leaveId);
        });

        it('should return 403 if user is not owner and not admin', async () => {
            mockGetSession.mockResolvedValueOnce(otherUserSession);
            mockPrismaLeave.findUnique.mockResolvedValue(sampleLeave);
            const { req, res } = createMocks({ method: 'GET', query: { leaveId } });
            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
            expect(res._getStatusCode()).toBe(403);
            expect(res._getJSONData().error).toContain('Forbidden');
        });
    });

    describe('PUT /api/leaves/[leaveId]', () => {
        const leaveId = 'test-leave-id-put';
        const ownerUserId = 1;
        const adminUserId = 2;

        const existingPendingLeave: PrismaLeave = {
            id: leaveId,
            userId: ownerUserId,
            startDate: parseISO('2024-09-01T00:00:00.000Z'),
            endDate: parseISO('2024-09-05T00:00:00.000Z'),
            typeCode: 'ANNUAL',
            type: PrismaLeaveType.ANNUAL,
            status: LeaveStatus.PENDING,
            reason: 'Vacances initiales',
            countedDays: 5,
            comment: null,
            requestDate: new Date(),
            approvalDate: null,
            approvedById: null,
            calculationDetails: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            isRecurring: false,
            parentId: null,
            recurrencePattern: null,
            isHalfDay: false,
            halfDayPeriod: null,
        };

        const updatePayload = {
            startDate: '2024-09-02',
            endDate: '2024-09-06',
            reason: 'Vacances modifiées par admin',
            typeCode: 'ANNUAL',
        };
        const adminUserSession: Session = { ...baseSession, user: { ...baseSessionUser, id: adminUserId.toString(), role: Role.ADMIN_TOTAL } };

        const ownerUserSession: Session = { ...baseSession, user: { ...baseSessionUser, id: ownerUserId.toString(), role: Role.USER } };
        const otherUserPutSession: Session = { ...baseSession, user: { ...baseSessionUser, id: '99', role: Role.USER } };

        it('should return 401 if user is not authenticated', async () => {
            mockGetSession.mockResolvedValueOnce(null);
            const { req, res } = createMocks({ method: 'PUT' as RequestMethod, query: { leaveId }, body: updatePayload });
            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
            expect(res._getStatusCode()).toBe(401);
        });

        it('should return 404 if leave to update is not found', async () => {
            mockGetSession.mockResolvedValueOnce(ownerUserSession);
            mockPrismaLeave.findUnique.mockResolvedValueOnce(null);
            const { req, res } = createMocks({ method: 'PUT' as RequestMethod, query: { leaveId: 'non-existent-id' }, body: updatePayload });
            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
            expect(res._getStatusCode()).toBe(404);
        });

        it('should return 403 if user is not owner and not admin', async () => {
            mockGetSession.mockResolvedValueOnce(otherUserPutSession);
            mockPrismaLeave.findUnique.mockResolvedValue(existingPendingLeave);
            const { req, res } = createMocks({ method: 'PUT' as RequestMethod, query: { leaveId }, body: updatePayload });
            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
            expect(res._getStatusCode()).toBe(403);
            expect(res._getJSONData().error).toContain('You can only update your own leaves');
        });

        it('should return 403 if user tries to update a non-PENDING leave (and is not admin)', async () => {
            mockGetSession.mockResolvedValueOnce(ownerUserSession);
            mockPrismaLeave.findUnique.mockResolvedValue({
                ...existingPendingLeave,
                status: LeaveStatus.APPROVED,
            });
            const { req, res } = createMocks({ method: 'PUT' as RequestMethod, query: { leaveId }, body: updatePayload });
            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
            expect(res._getStatusCode()).toBe(403);
            expect(res._getJSONData().error).toContain('Leave cannot be updated by you as its status is APPROVED');
        });

        it('should return 400 for invalid update payload (e.g., endDate before startDate)', async () => {
            mockGetSession.mockResolvedValueOnce(ownerUserSession);
            mockPrismaLeave.findUnique.mockResolvedValue(existingPendingLeave);
            const { req, res } = createMocks({ method: 'PUT' as RequestMethod, query: { leaveId }, body: { ...updatePayload, endDate: '2024-09-01', startDate: '2024-09-02' } });
            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
            expect(res._getStatusCode()).toBe(400);
            expect(res._getJSONData().error).toBe('Validation failed');
            expect(res._getJSONData().details.fieldErrors.endDate).toContain('endDate must be after or equal to startDate.');
        });

        it('should successfully update a PENDING leave for the owner', async () => {
            mockGetSession.mockResolvedValueOnce(ownerUserSession);
            mockPrismaLeave.findUnique.mockResolvedValue(existingPendingLeave);
            mockPrismaLeave.count.mockResolvedValue(0); // Pas de conflits
            mockPrismaPublicHoliday.findMany.mockResolvedValue([]); // Pas de jours fériés

            const updatedLeaveData = {
                ...existingPendingLeave,
                startDate: parseISO(updatePayload.startDate),
                endDate: parseISO(updatePayload.endDate),
                reason: updatePayload.reason,
                status: LeaveStatus.PENDING, // Doit revenir à PENDING
                countedDays: 5, // Supposons que le calcul donne 5 jours
                updatedAt: new Date(), // La date sera mise à jour
            };
            mockPrismaLeave.update.mockResolvedValue(updatedLeaveData as any);

            const { req, res } = createMocks({ method: 'PUT' as RequestMethod, query: { leaveId }, body: updatePayload });

            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

            expect(res._getStatusCode()).toBe(200);
            const responseData = res._getJSONData();
            expect(responseData.id).toBe(leaveId);
            expect(responseData.reason).toBe(updatePayload.reason);
            expect(responseData.status).toBe(LeaveStatus.PENDING);

            expect(mockPrismaLeave.update).toHaveBeenCalledWith({
                where: { id: leaveId },
                data: expect.objectContaining({
                    startDate: parseISO(updatePayload.startDate),
                    endDate: parseISO(updatePayload.endDate),
                    reason: updatePayload.reason,
                    status: LeaveStatus.PENDING, // Vérifier que le statut est bien PENDING
                    countedDays: 5, // À ajuster si la logique de calcul des jours est testée ici
                }),
            });
            expect(mockInvalidateCache).toHaveBeenCalledWith(
                LeaveEvent.BALANCE_UPDATED, // Utilisez l'enum LeaveEvent importé
                { userId: ownerUserId.toString(), year: 2024 }
            );
        });

        it('should allow ADMIN_TOTAL to update an APPROVED leave', async () => {
            mockGetSession.mockResolvedValueOnce(adminUserSession);
            const approvedLeave: PrismaLeave = {
                ...existingPendingLeave,
                userId: ownerUserId, // Important pour s'assurer que l'admin modifie le congé de quelqu'un d'autre
                status: LeaveStatus.APPROVED,
            };
            mockPrismaLeave.findUnique.mockResolvedValue(approvedLeave);
            mockPrismaLeave.count.mockResolvedValue(0); // Pas de conflits
            mockPrismaPublicHoliday.findMany.mockResolvedValue([]);

            const updatedLeaveFromAdmin = {
                ...approvedLeave,
                startDate: parseISO(updatePayload.startDate),
                endDate: parseISO(updatePayload.endDate),
                reason: updatePayload.reason,
                status: LeaveStatus.PENDING, // La modification par un admin doit aussi repasser le statut à PENDING
                countedDays: 5, // Recalculé
            };
            mockPrismaLeave.update.mockResolvedValue(updatedLeaveFromAdmin as any);

            const { req, res } = createMocks({
                method: 'PUT' as RequestMethod,
                query: { leaveId },
                body: updatePayload,
            });

            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
            expect(res._getStatusCode()).toBe(200);
            const responseData = res._getJSONData();
            expect(responseData.status).toBe(LeaveStatus.PENDING);
            expect(responseData.reason).toBe(updatePayload.reason);
            expect(mockInvalidateCache).toHaveBeenCalledWith(
                LeaveEvent.BALANCE_UPDATED,
                { userId: ownerUserId.toString(), year: 2024 }
            );
        });

        it('should return 409 if updated leave conflicts with an existing leave', async () => {
            mockGetSession.mockResolvedValueOnce(ownerUserSession);
            mockPrismaLeave.findUnique.mockResolvedValue(existingPendingLeave);
            mockPrismaLeave.count.mockResolvedValue(1); // Simule un conflit
            // Pas besoin de mocker publicHoliday ou update ici car on s'attend à une erreur avant

            const { req, res } = createMocks({
                method: 'PUT' as RequestMethod,
                query: { leaveId },
                body: updatePayload, // Utilise le payload standard qui change les dates
            });

            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
            expect(res._getStatusCode()).toBe(409);
            expect(res._getJSONData().error).toContain('Leave request conflicts with an existing leave');
        });

        it('should return 400 if typeCode is invalid or not selectable', async () => {
            mockGetSession.mockResolvedValueOnce(ownerUserSession);
            mockPrismaLeave.findUnique.mockResolvedValue(existingPendingLeave);
            mockPrismaLeaveTypeSetting.findFirst.mockResolvedValueOnce(null); // Simule un typeCode invalide

            const payloadWithInvalidType = { ...updatePayload, typeCode: 'INVALID_TYPE' };

            const { req, res } = createMocks({
                method: 'PUT' as RequestMethod,
                query: { leaveId },
                body: payloadWithInvalidType,
            });

            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
            expect(res._getStatusCode()).toBe(400);
            expect(res._getJSONData().error).toContain('Invalid or non-selectable leave typeCode: INVALID_TYPE');
        });

        it('should successfully update a leave to be a half-day', async () => {
            mockGetSession.mockResolvedValueOnce(ownerUserSession);
            const singleDayLeave: PrismaLeave = {
                ...existingPendingLeave,
                startDate: parseISO('2024-09-01T00:00:00.000Z'),
                endDate: parseISO('2024-09-01T00:00:00.000Z'), // Congé d'un seul jour
                isHalfDay: false,
                halfDayPeriod: null,
                countedDays: 1,
            };
            mockPrismaLeave.findUnique.mockResolvedValue(singleDayLeave);
            mockPrismaLeave.count.mockResolvedValue(0);
            mockPrismaPublicHoliday.findMany.mockResolvedValue([]);

            const halfDayUpdatePayload = {
                isHalfDay: true,
                halfDayPeriod: 'AM',
                // startDate et endDate ne sont pas fournis, donc celles de singleDayLeave sont utilisées
                // reason et typeCode peuvent aussi être omis si on ne les change pas
            };

            const expectedUpdatedHalfDayLeave = {
                ...singleDayLeave,
                isHalfDay: true,
                halfDayPeriod: 'AM',
                status: LeaveStatus.PENDING,
                countedDays: 0.5, // Le calcul doit donner 0.5
            };
            mockPrismaLeave.update.mockResolvedValue(expectedUpdatedHalfDayLeave as any);

            const { req, res } = createMocks({
                method: 'PUT',
                query: { leaveId },
                body: halfDayUpdatePayload
            });

            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
            expect(res._getStatusCode()).toBe(200);
            const responseData = res._getJSONData();
            expect(responseData.isHalfDay).toBe(true);
            expect(responseData.halfDayPeriod).toBe('AM');
            expect(responseData.countedDays).toBe(0.5);
            expect(responseData.status).toBe(LeaveStatus.PENDING);
            expect(mockPrismaLeave.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    isHalfDay: true,
                    halfDayPeriod: 'AM',
                    countedDays: 0.5,
                }),
            }));
            expect(mockInvalidateCache).toHaveBeenCalled();
        });
    });

    // --- Tests pour DELETE /api/leaves/[leaveId] ---
    describe('DELETE /api/leaves/[leaveId]', () => {
        const leaveId = 'test-leave-id-delete';
        const ownerUserId = 1;

        const existingPendingLeaveForDelete: PrismaLeave = {
            id: leaveId,
            userId: ownerUserId,
            startDate: parseISO('2024-10-01'),
            endDate: parseISO('2024-10-05'),
            typeCode: 'ANNUAL', type: PrismaLeaveType.ANNUAL, status: LeaveStatus.PENDING,
            reason: '', comment: null, requestDate: new Date(), approvalDate: null, approvedById: null, countedDays: 5, calculationDetails: {}, createdAt: new Date(), updatedAt: new Date(), isRecurring: false, parentId: null, recurrencePattern: null, isHalfDay: false, halfDayPeriod: null,
        };
        const existingApprovedLeaveForDelete: PrismaLeave = {
            ...existingPendingLeaveForDelete,
            status: LeaveStatus.APPROVED,
        };

        const ownerUserDeleteSession: Session = { ...baseSession, user: { ...baseSessionUser, id: ownerUserId.toString(), role: Role.USER } };
        const otherUserDeleteSession: Session = { ...baseSession, user: { ...baseSessionUser, id: '99', role: Role.USER } };
        const adminDeleteSession: Session = { ...baseSession, user: { ...baseSessionUser, id: 'admin123', role: Role.ADMIN_TOTAL } };

        it('should return 401 if user is not authenticated', async () => {
            mockGetSession.mockResolvedValueOnce(null);
            const { req, res } = createMocks({ method: 'DELETE' as RequestMethod, query: { leaveId } });
            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
            expect(res._getStatusCode()).toBe(401);
        });

        it('should return 404 if leave to cancel is not found', async () => {
            mockGetSession.mockResolvedValueOnce(ownerUserDeleteSession);
            mockPrismaLeave.findUnique.mockResolvedValueOnce(null);
            const { req, res } = createMocks({ method: 'DELETE' as RequestMethod, query: { leaveId: 'non-existent' } });
            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
            expect(res._getStatusCode()).toBe(404);
        });

        it('should return 403 if user is not owner and not admin', async () => {
            mockGetSession.mockResolvedValueOnce(otherUserDeleteSession);
            mockPrismaLeave.findUnique.mockResolvedValue(existingPendingLeaveForDelete);
            const { req, res } = createMocks({ method: 'DELETE' as RequestMethod, query: { leaveId } });
            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
            expect(res._getStatusCode()).toBe(403);
        });

        it('should return 400 if trying to cancel a REJECTED leave', async () => {
            mockGetSession.mockResolvedValueOnce(ownerUserDeleteSession);
            mockPrismaLeave.findUnique.mockResolvedValue({ ...existingPendingLeaveForDelete, status: LeaveStatus.REJECTED });
            const { req, res } = createMocks({ method: 'DELETE' as RequestMethod, query: { leaveId } });
            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
            expect(res._getStatusCode()).toBe(400);
            expect(res._getJSONData().error).toContain('Cannot cancel leave with status REJECTED');
        });

        it('should successfully cancel a PENDING leave for the owner', async () => {
            mockGetSession.mockResolvedValueOnce(ownerUserDeleteSession);
            mockPrismaLeave.findUnique.mockResolvedValue(existingPendingLeaveForDelete);

            const cancelledLeaveData = { ...existingPendingLeaveForDelete, status: LeaveStatus.CANCELLED, updatedAt: new Date() };
            mockPrismaLeave.update.mockResolvedValue(cancelledLeaveData as any);

            const { req, res } = createMocks({ method: 'DELETE' as RequestMethod, query: { leaveId } });
            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

            expect(res._getStatusCode()).toBe(200);
            expect(res._getJSONData().message).toBe('Leave successfully cancelled');
            expect(res._getJSONData().leave.status).toBe(LeaveStatus.CANCELLED);
            expect(mockPrismaLeave.update).toHaveBeenCalledWith({
                where: { id: leaveId },
                data: { status: LeaveStatus.CANCELLED },
            });
            expect(mockInvalidateCache).toHaveBeenCalledWith(
                LeaveEvent.BALANCE_UPDATED, // Utilisez l'enum LeaveEvent importé
                { userId: ownerUserId.toString(), year: 2024 } // Année de début du congé
            );
        });

        it('should successfully cancel an APPROVED leave for an ADMIN_TOTAL', async () => {
            mockGetSession.mockResolvedValueOnce(adminDeleteSession);
            mockPrismaLeave.findUnique.mockResolvedValue(existingApprovedLeaveForDelete);

            const cancelledLeaveData = { ...existingApprovedLeaveForDelete, status: LeaveStatus.CANCELLED };
            mockPrismaLeave.update.mockResolvedValue(cancelledLeaveData as any);

            const { req, res } = createMocks({ method: 'DELETE' as RequestMethod, query: { leaveId } });
            await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

            expect(res._getStatusCode()).toBe(200);
            expect(res._getJSONData().leave.status).toBe(LeaveStatus.CANCELLED);
            expect(mockInvalidateCache).toHaveBeenCalledWith(
                LeaveEvent.BALANCE_UPDATED, // Utilisez l'enum LeaveEvent importé
                { userId: ownerUserId.toString(), year: 2024 }
            );
        });
    });

}); 