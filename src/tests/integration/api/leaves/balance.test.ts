import { createMocks } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';
import {
    expectToBeUndefined,
    expectToBe,
    expectToEqual,
    expectToBeDefined,
    expectArrayContaining
} from '@/tests/utils/assertions';

// Définir les valeurs enum manuellement pour les tests
const LeaveType = {
    ANNUAL: 'ANNUAL',
    RECOVERY: 'RECOVERY',
    TRAINING: 'TRAINING',
    SICK: 'SICK',
    MATERNITY: 'MATERNITY',
    SPECIAL: 'SPECIAL',
    UNPAID: 'UNPAID',
    OTHER: 'OTHER'
};

const LeaveStatus = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED'
};

// Mocker l'enum PrismaLeaveStatus qui est utilisé dans le handler
jest.mock('@prisma/client', () => ({
    LeaveStatus: {
        PENDING: 'PENDING',
        APPROVED: 'APPROVED',
        REJECTED: 'REJECTED',
        CANCELLED: 'CANCELLED'
    },
    LeaveType: {
        ANNUAL: 'ANNUAL',
        RECOVERY: 'RECOVERY',
        TRAINING: 'TRAINING',
        SICK: 'SICK',
        MATERNITY: 'MATERNITY',
        SPECIAL: 'SPECIAL',
        UNPAID: 'UNPAID',
        OTHER: 'OTHER'
    }
}));

// Créer des mocks pour Prisma
const mockFindManyLeaveTypeSetting = jest.fn();
const mockFindManyLeaveBalance = jest.fn();
const mockFindManyQuotaCarryOver = jest.fn();
const mockFindManyQuotaTransfer = jest.fn();
const mockQueryRawUnsafe = jest.fn();
const mockDisconnect = jest.fn();

// Mock le module prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        leaveTypeSetting: { findMany: mockFindManyLeaveTypeSetting },
        leaveBalance: { findMany: mockFindManyLeaveBalance },
        quotaCarryOver: { findMany: mockFindManyQuotaCarryOver },
        quotaTransfer: { findMany: mockFindManyQuotaTransfer },
        $queryRawUnsafe: mockQueryRawUnsafe,
        $disconnect: mockDisconnect
    }
}));

// Mock le module de cache
const mockGetCachedData = jest.fn().mockResolvedValue(null);
const mockCacheData = jest.fn().mockResolvedValue(undefined);
const mockGenerateBalanceKey = jest.fn().mockImplementation((userId, year) => `leave:balance:${userId}:${year}`);

const mockLeaveQueryCacheService = {
    getInstance: jest.fn().mockReturnValue({
        getCachedData: mockGetCachedData,
        cacheData: mockCacheData,
        generateBalanceKey: mockGenerateBalanceKey
    })
};

jest.mock('@/modules/leaves/services/LeaveQueryCacheService', () => ({
    LeaveQueryCacheService: mockLeaveQueryCacheService
}));

// Mock le module logger
jest.mock('@/lib/logger', () => ({
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));

// Importer le handler après avoir configuré les mocks
import handler from '../../../../pages/api/leaves/balance';

describe('GET /api/leaves/balance', () => {
    const currentYear = new Date().getFullYear();

    beforeEach(() => {
        jest.clearAllMocks();

        // Configurer les mocks par défaut
        mockFindManyLeaveTypeSetting.mockResolvedValue([
            { code: 'ANNUAL', label: 'Congé Annuel (Balance Test)', isActive: true },
            { code: 'SICK', label: 'Congé Maladie (Balance Test)', isActive: true }
        ]);

        mockFindManyLeaveBalance.mockResolvedValue([
            { userId: 101, year: currentYear, leaveType: 'ANNUAL', initial: 25, used: 5, pending: 0, remaining: 22 }
        ]);

        mockFindManyQuotaCarryOver.mockResolvedValue([]);
        mockFindManyQuotaTransfer.mockResolvedValue([]);

        mockQueryRawUnsafe.mockResolvedValue([
            { typeCode: 'ANNUAL', status: LeaveStatus.APPROVED, totalDays: 5 },
            { typeCode: 'ANNUAL', status: LeaveStatus.PENDING, totalDays: 2 }
        ]);
    });

    it('should return correct leave balances', async () => {
        const { req, res } = createMocks({
            method: 'GET',
            query: { userId: '101', year: currentYear.toString() },
        });

        await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

        expectToBe(res.statusCode, 200);
        const data = JSON.parse(res._getData());

        // Valider le format de la réponse selon l'API
        expectToBeDefined(data.balances);
        expectToBeDefined(data.totals);
        expectToBeDefined(data.metadata);

        const annualBalance = data.balances.ANNUAL;
        expectToBeDefined(annualBalance);
        if (annualBalance) {
            expectToBe(annualBalance.label, 'Congé Annuel (Balance Test)');
            expectToBe(annualBalance.initial, 25);
            expectToBe(annualBalance.used, 5);
            expectToBe(annualBalance.pending, 2);
            expectToBe(annualBalance.remaining, 18);
        }

        const sickBalance = data.balances.SICK;
        expectToBeDefined(sickBalance);
        if (sickBalance) {
            expectToBe(sickBalance.label, 'Congé Maladie (Balance Test)');
            expectToBe(sickBalance.initial, 0);
            expectToBe(sickBalance.used, 0);
            expectToBe(sickBalance.pending, 0);
            expectToBe(sickBalance.remaining, 0);
        }
    });

    it('should return 400 if userId is missing', async () => {
        const { req, res } = createMocks({
            method: 'GET',
            query: { year: currentYear.toString() },
        });

        await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

        expectToBe(res.statusCode, 400);
        const data = JSON.parse(res._getData());
        expectToBeDefined(data.error);
        expectToBe(data.error, 'userId and year parameters are required');
    });

    it('should handle year parameter correctly', async () => {
        const testYear = currentYear - 1;

        // Configurer les mocks pour ce test spécifique
        mockFindManyLeaveBalance.mockResolvedValue([
            { userId: 101, year: testYear, leaveType: 'ANNUAL', initial: 20, used: 15, pending: 0, remaining: 6 }
        ]);

        mockFindManyQuotaCarryOver.mockResolvedValue([
            { userId: 101, leaveType: 'ANNUAL', amount: 1, toYear: testYear, status: 'APPROVED' }
        ]);

        mockQueryRawUnsafe.mockResolvedValue([
            { typeCode: 'ANNUAL', status: LeaveStatus.APPROVED, totalDays: 15 }
        ]);

        const { req, res } = createMocks({
            method: 'GET',
            query: { userId: '101', year: testYear.toString() },
        });

        await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

        expectToBe(res.statusCode, 200);
        const data = JSON.parse(res._getData());
        const annualBalance = data.balances.ANNUAL;
        expectToBeDefined(annualBalance);
        if (annualBalance) {
            expectToBe(annualBalance.initial, 20);
            expectToBe(annualBalance.used, 15);
            expectToBe(annualBalance.carryOver, 1);
            expectToBe(annualBalance.remaining, 6);
            expectToBe(annualBalance.pending, 0);
        }
    });

    it('should return empty balances if no leave types are defined for the user/system', async () => {
        // Mock un cas où aucun type de congé n'est défini
        mockFindManyLeaveTypeSetting.mockResolvedValue([]);

        const { req, res } = createMocks({
            method: 'GET',
            query: { userId: '999', year: currentYear.toString() },
        });

        await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

        expectToBe(res.statusCode, 200);
        const data = JSON.parse(res._getData());
        expectToBeDefined(data.balances);
        expectToEqual(Object.keys(data.balances).length, 0);
    });
}); 