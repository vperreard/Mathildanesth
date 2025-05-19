import { createMocks, MockRequest, MockResponse } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, LeaveType as PrismaLeaveType, LeaveStatus as PrismaLeaveStatus, LeaveTypeSetting, LeaveBalance, QuotaCarryOver, QuotaTransfer, Leave } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import handler from '../balance'; // L'API handler
import { prisma } from '@/lib/prisma';
import { LeaveQueryCacheService } from '@/modules/leaves/services/LeaveQueryCacheService';
import { logger } from '@/lib/logger';

// Mock Prisma Client
jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    prisma: mockDeep<PrismaClient>(),
}));

// Mock LeaveQueryCacheService
const mockCacheServiceInstance = {
    generateBalanceKey: jest.fn(),
    getCachedData: jest.fn(),
    cacheData: jest.fn(), // Renommé depuis setCachedData et TTL simplifié
    deleteCachedData: jest.fn(), // Au cas où, mais on utilise invalidateCache
    invalidateCache: jest.fn(),
};
jest.mock('@/modules/leaves/services/LeaveQueryCacheService', () => ({
    __esModule: true,
    LeaveQueryCacheService: {
        getInstance: jest.fn(() => mockCacheServiceInstance),
        // DEFAULT_TTL n'existe plus, TTL géré par le type 'BALANCE' dans cacheData
    },
}));

// Mock Logger pour éviter les logs en console pendant les tests
jest.mock('@/lib/logger', () => ({
    __esModule: true,
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));


describe('/api/leaves/balance API Endpoint', () => {
    let mockPrisma: DeepMockProxy<PrismaClient>;
    // const mockCache: DeepMockProxy<LeaveQueryCacheService>; // Pas besoin si on mock l'instance directement

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;
        // Réinitialiser les mocks du service de cache
        Object.values(mockCacheServiceInstance).forEach(mockFn => mockFn.mockReset());
    });

    const mockUserId = 123;
    const mockYear = 2024;
    const mockCacheKey = `leave:balance:${mockUserId}:${mockYear}`;

    test('should return 400 if userId or year is missing', async () => {
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
            method: 'GET',
            query: { userId: mockUserId.toString() }, // year is missing
        });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(res._getJSONData().error).toBe('userId and year parameters are required');

        const { req: req2, res: res2 } = createMocks<NextApiRequest, NextApiResponse>({
            method: 'GET',
            query: { year: mockYear.toString() }, // userId is missing
        });
        await handler(req2, res2);
        expect(res2._getStatusCode()).toBe(400);
        expect(res2._getJSONData().error).toBe('userId and year parameters are required');
    });

    test('should return cached data if available', async () => {
        const mockCachedBalance = { balances: { ANNUAL: { remaining: 10 } }, totals: {}, metadata: {} };
        mockCacheServiceInstance.generateBalanceKey.mockReturnValue(mockCacheKey);
        mockCacheServiceInstance.getCachedData.mockResolvedValue(mockCachedBalance);

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
            method: 'GET',
            query: { userId: mockUserId.toString(), year: mockYear.toString() },
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        expect(res._getJSONData()).toEqual(mockCachedBalance);
        expect(mockCacheServiceInstance.generateBalanceKey).toHaveBeenCalledWith(mockUserId.toString(), mockYear);
        expect(mockCacheServiceInstance.getCachedData).toHaveBeenCalledWith(mockCacheKey);
        expect(mockPrisma.leaveTypeSetting.findMany).not.toHaveBeenCalled(); // Ne doit pas appeler prisma si cache hit
    });

    test('should calculate balances if not in cache (no initial balances, no leaves, no adjustments)', async () => {
        mockCacheServiceInstance.generateBalanceKey.mockReturnValue(mockCacheKey);
        mockCacheServiceInstance.getCachedData.mockResolvedValue(null); // Cache miss

        const mockActiveLeaveTypes = [
            { code: 'ANNUAL' as PrismaLeaveType, label: 'Congés Annuels' },
            { code: 'RTT' as PrismaLeaveType, label: 'RTT' },
        ];
        mockPrisma.leaveTypeSetting.findMany.mockResolvedValue(mockActiveLeaveTypes as any); // any pour simplifier le type complexe de retour de findMany
        mockPrisma.$queryRawUnsafe.mockResolvedValue([]); // No leaves consumed
        mockPrisma.leaveBalance.findMany.mockResolvedValue([]); // No initial balances
        mockPrisma.quotaCarryOver.findMany.mockResolvedValue([]); // No carry-overs
        mockPrisma.quotaTransfer.findMany.mockResolvedValue([]); // No transfers

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
            method: 'GET',
            query: { userId: mockUserId.toString(), year: mockYear.toString() },
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const responseData = res._getJSONData();

        expect(responseData.balances['ANNUAL']).toEqual({
            label: 'Congés Annuels',
            initial: 0,
            carryOver: 0,
            transfers: 0,
            effectiveInitial: 0,
            used: 0,
            pending: 0,
            remaining: 0,
        });
        expect(responseData.balances['RTT']).toEqual({
            label: 'RTT',
            initial: 0,
            carryOver: 0,
            transfers: 0,
            effectiveInitial: 0,
            used: 0,
            pending: 0,
            remaining: 0,
        });
        expect(responseData.totals).toEqual({
            initial: 0, carryOver: 0, transfers: 0, effectiveInitial: 0, used: 0, pending: 0, remaining: 0
        });
        expect(responseData.metadata).toEqual({
            userId: mockUserId,
            year: mockYear,
            generatedAt: expect.any(String), // Vérifier que la date est générée
        });

        // Vérifier que le cache est alimenté
        expect(mockCacheServiceInstance.cacheData).toHaveBeenCalledWith(
            mockCacheKey,
            responseData, // Les données exactes retournées
            'BALANCE' // Le type de TTL
        );
    });

    test('should calculate balances with initial balances, leaves, carry-overs, and transfers', async () => {
        mockCacheServiceInstance.generateBalanceKey.mockReturnValue(mockCacheKey);
        mockCacheServiceInstance.getCachedData.mockResolvedValue(null); // Cache miss

        const mockActiveLeaveTypes = [
            { code: 'ANNUAL' as PrismaLeaveType, label: 'Congés Annuels' },
            { code: 'RTT' as PrismaLeaveType, label: 'RTT' },
            { code: 'SICK' as PrismaLeaveType, label: 'Maladie' }, // Un type sans transactions pour vérifier l'initialisation
        ];
        mockPrisma.leaveTypeSetting.findMany.mockResolvedValue(mockActiveLeaveTypes as any);

        // Mock LeaveBalance (droits initiaux)
        const mockInitialBalances: LeaveBalance[] = [
            { id: 'bal1', userId: mockUserId, leaveType: 'ANNUAL', year: mockYear, initial: 25, used: 0, pending: 0, remaining: 0, lastUpdated: new Date(), createdAt: new Date(), updatedAt: new Date() },
            { id: 'bal2', userId: mockUserId, leaveType: 'RTT', year: mockYear, initial: 10, used: 0, pending: 0, remaining: 0, lastUpdated: new Date(), createdAt: new Date(), updatedAt: new Date() },
        ];
        mockPrisma.leaveBalance.findMany.mockResolvedValue(mockInitialBalances);

        // Mock Leaves (congés posés)
        const mockLeavesConsumed: { typeCode: string, status: PrismaLeaveStatus, totalDays: number }[] = [
            { typeCode: 'ANNUAL', status: PrismaLeaveStatus.APPROVED, totalDays: 5 },
            { typeCode: 'ANNUAL', status: PrismaLeaveStatus.PENDING, totalDays: 2 },
            { typeCode: 'RTT', status: PrismaLeaveStatus.APPROVED, totalDays: 3 },
        ];
        mockPrisma.$queryRawUnsafe.mockResolvedValue(mockLeavesConsumed as any);

        // Mock QuotaCarryOver (reports N-1)
        const mockCarryOvers: QuotaCarryOver[] = [
            { id: 'co1', userId: mockUserId, leaveType: 'ANNUAL', fromYear: mockYear - 1, toYear: mockYear, amount: 2.5, status: 'APPROVED', expiryDate: null, approvedById: null, approvalDate: null, reason: null, comments: null, createdAt: new Date(), updatedAt: new Date() },
        ];
        mockPrisma.quotaCarryOver.findMany.mockResolvedValue(mockCarryOvers);

        // Mock QuotaTransfer (transferts)
        const mockTransfers: QuotaTransfer[] = [
            // Transfert sortant pour ANNUAL
            { id: 'qt1', userId: mockUserId, fromType: 'ANNUAL', toType: 'RTT', amount: 1, convertedAmount: 1, reason: 'transfer', transferDate: new Date(mockYear, 5, 1), status: 'APPROVED', approvedById: null, approvalDate: null, comments: null, createdAt: new Date(), updatedAt: new Date() },
            // Note: ce transfert crédite RTT et débite ANNUAL pour le même utilisateur mockUserId.
        ];
        mockPrisma.quotaTransfer.findMany.mockResolvedValue(mockTransfers);

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
            method: 'GET',
            query: { userId: mockUserId.toString(), year: mockYear.toString() },
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const responseData = res._getJSONData();

        // Vérifications pour ANNUAL
        // Initial: 25 (from LeaveBalance)
        // CarryOver: +2.5
        // Transfers: -1 (from ANNUAL to RTT)
        // EffectiveInitial: 25 + 2.5 - 1 = 26.5
        // Used: 5 (APPROVED)
        // Pending: 2 (PENDING)
        // Remaining: 26.5 - 5 - 2 = 19.5
        expect(responseData.balances['ANNUAL']).toEqual({
            label: 'Congés Annuels',
            initial: 25,
            carryOver: 2.5,
            transfers: -1,
            effectiveInitial: 26.5,
            used: 5,
            pending: 2,
            remaining: 19.5,
        });

        // Vérifications pour RTT
        // Initial: 10 (from LeaveBalance)
        // CarryOver: 0
        // Transfers: +1 (from ANNUAL to RTT)
        // EffectiveInitial: 10 + 0 + 1 = 11
        // Used: 3 (APPROVED)
        // Pending: 0
        // Remaining: 11 - 3 - 0 = 8
        expect(responseData.balances['RTT']).toEqual({
            label: 'RTT',
            initial: 10,
            carryOver: 0,
            transfers: 1,
            effectiveInitial: 11,
            used: 3,
            pending: 0,
            remaining: 8,
        });

        // Vérifications pour SICK (aucune transaction)
        expect(responseData.balances['SICK']).toEqual({
            label: 'Maladie',
            initial: 0, // Pas de LeaveBalance pour SICK
            carryOver: 0,
            transfers: 0,
            effectiveInitial: 0,
            used: 0,
            pending: 0,
            remaining: 0,
        });

        // Vérifications des totaux
        // Initial: 25 (ANNUAL) + 10 (RTT) + 0 (SICK) = 35
        // CarryOver: 2.5 (ANNUAL) + 0 (RTT) + 0 (SICK) = 2.5
        // Transfers: -1 (ANNUAL) + 1 (RTT) + 0 (SICK) = 0
        // EffectiveInitial: 26.5 (ANNUAL) + 11 (RTT) + 0 (SICK) = 37.5
        // Used: 5 (ANNUAL) + 3 (RTT) + 0 (SICK) = 8
        // Pending: 2 (ANNUAL) + 0 (RTT) + 0 (SICK) = 2
        // Remaining: 19.5 (ANNUAL) + 8 (RTT) + 0 (SICK) = 27.5
        expect(responseData.totals).toEqual({
            initial: 35,
            carryOver: 2.5,
            transfers: 0,
            effectiveInitial: 37.5,
            used: 8,
            pending: 2,
            remaining: 27.5,
        });

        expect(mockCacheServiceInstance.cacheData).toHaveBeenCalledWith(
            mockCacheKey,
            responseData,
            'BALANCE'
        );
    });

    // Plus de tests à venir ici...
}); 