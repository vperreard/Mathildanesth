import { NextRequest } from 'next/server';
import {
    expectToBeUndefined,
    expectToBe,
    expectToEqual,
    expectToBeDefined,
    expectArrayContaining
} from '@/tests/utils/assertions';

// Mock NextResponse pour éviter les problèmes de polyfill
jest.mock('next/server', () => ({
    NextRequest: jest.requireActual('next/server').NextRequest,
    NextResponse: {
        json: jest.fn((data: any, options?: any) => ({
            json: jest.fn().mockResolvedValue(data),
            status: options?.status || 200,
            headers: new Map([['content-type', 'application/json']])
        }))
    }
}));

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

jest.mock('@/modules/conges/services/LeaveQueryCacheService', () => ({
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

// Importer la route App Router après avoir configuré les mocks
import { GET } from '@/app/api/conges/balance/route';

describe('GET /api/conges/balance', () => {
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
            { typeCode: 'ANNUAL', status: 'APPROVED', totalDays: 5 },
            { typeCode: 'ANNUAL', status: 'PENDING', totalDays: 2 }
        ]);
    });

    it('should return correct leave balances', async () => {
        // Créer une requête NextRequest pour App Router
        const request = new NextRequest(`http://localhost:3000/api/conges/balance?userId=101&year=${currentYear}`, {
            method: 'GET'
        });

        const response = await GET(request);
        const data = await response.json();

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
        // Créer une requête sans userId
        const request = new NextRequest(`http://localhost:3000/api/conges/balance?year=${currentYear}`, {
            method: 'GET'
        });

        const response = await GET(request);
        const data = await response.json();

        expectToBe(response.status, 400);
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
            { typeCode: 'ANNUAL', status: 'APPROVED', totalDays: 15 }
        ]);

        const request = new NextRequest(`http://localhost:3000/api/conges/balance?userId=101&year=${testYear}`, {
            method: 'GET'
        });

        const response = await GET(request);
        const data = await response.json();

        expectToBe(response.status, 200);
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

        const request = new NextRequest(`http://localhost:3000/api/conges/balance?userId=999&year=${currentYear}`, {
            method: 'GET'
        });

        const response = await GET(request);
        const data = await response.json();

        expectToBe(response.status, 200);
        expectToBeDefined(data.balances);
        expectToEqual(Object.keys(data.balances).length, 0);
    });
}); 