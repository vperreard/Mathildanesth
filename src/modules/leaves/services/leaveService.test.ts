/**
 * @jest-environment node
 */

import {
  formatLeavePeriod,
  getLeaveTypeLabel,
  getLeaveStatusLabel,
  fetchLeaves,
  submitLeaveRequest,
  calculateLeaveDays,
} from './leaveService';
import {
  LeaveStatus as AppLeaveStatus,
  LeaveType as AppLeaveType,
  Leave,
  LeaveBalance,
  LeaveFilters,
  LeaveAllowanceCheckResult,
  PaginatedLeaveResults,
  LeaveRequest,
} from '../types/leave';
// import { ConflictCheckResult, LeaveConflict, ConflictSeverity, ConflictType } from '../types/conflict'; // Commenté si non utilisé directement par les tests actifs
import { WorkSchedule, WorkFrequency, Weekday, WeekType } from '../../profiles/types/workSchedule';
// import { formatDate, ISO_DATE_FORMAT } from '@/utils/dateUtils'; // Commenté si non utilisé directement
import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
// Importer PrismaClient réel pour le typage et jest.requireActual
import {
  PrismaClient as RealPrismaClient,
  LeaveStatus as PrismaLeaveStatus,
  LeaveType as PrismaLeaveType,
  Prisma,
  Department as PrismaDepartment,
  Leave as PrismaLeave,
} from '@prisma/client';
import { User, UserRole, ExperienceLevel } from '@/types/user';

// 1. Créer l'instance mockée pour PrismaClient au niveau du module
const prismaMock = mockDeep<RealPrismaClient>();

// 2. Mocker le module '@prisma/client'
jest.mock('@prisma/client', () => {
  const { PrismaClient, ...originalModuleRest } = jest.requireActual(
    '@prisma/client'
  ) as typeof import('@prisma/client'); // Corrigé: Transtypage
  return {
    __esModule: true,
    ...originalModuleRest, // Garder tous les exports originaux (enums, types, etc.)
    PrismaClient: jest.fn(() => prismaMock), // Remplacer le constructeur par une fonction qui retourne notre mock
  };
});

// 3. Mocker le module '@/lib/prisma'.
//    Avec PrismaClient mocké ci-dessus, '@/lib/prisma' devrait initialiser
//    son 'prismaInstance' avec notre 'prismaMock'.
//    Ce mock sert de confirmation / sécurité.
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: prismaMock, // S'assurer que l'export 'prisma' est bien notre mock
}));

// Importer PrismaClient ici APRÈS les mocks pour obtenir la version mockée du constructeur
import { PrismaClient as MockablePrismaClientConstructor } from '@prisma/client';

const mockAppLeave: Leave = {
  id: 'app-leave-id-1',
  userId: 'user-test-id',
  startDate: new Date('2024-01-10T00:00:00.000Z'),
  endDate: new Date('2024-01-12T23:59:59.999Z'),
  type: AppLeaveType.ANNUAL,
  status: AppLeaveStatus.APPROVED,
  reason: 'Vacances annuelles',
  requestDate: new Date('2023-12-01T10:00:00.000Z'),
  isRecurring: false,
  countedDays: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Strictement minimaliste pour PrismaDepartment
const mockUserDepartment: Partial<PrismaDepartment> = {
  // Utilisation de Partial pour flexibilité
  id: 'dep-prisma-id-1',
  name: 'Cardiologie',
  description: 'Service de cardiologie',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUser: User = {
  id: 'user-test-id',
  email: 'test@example.com',
  role: UserRole.UTILISATEUR,
  prenom: 'Test',
  nom: 'User',
  firstName: 'Test',
  lastName: 'User',
  departmentId: mockUserDepartment.id!, // Non-null assertion car id est dans Partial
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  profilePictureUrl: undefined,
  specialtyId: undefined,
  specialties: undefined,
  phoneNumber: undefined,
  experienceLevel: undefined,
  hireDate: undefined,
  mustChangePassword: undefined,
};

// Strictement minimaliste pour PrismaLeave
const mockPrismaLeaveRecord: Partial<PrismaLeave> = {
  // Utilisation de Partial pour flexibilité
  id: 'db-leave-cuid-1',
  userId: 1,
  startDate: new Date('2024-01-15T00:00:00.000Z'),
  endDate: new Date('2024-01-17T23:59:59.999Z'),
  type: PrismaLeaveType.ANNUAL,
  status: PrismaLeaveStatus.APPROVED,
  createdAt: new Date(),
  updatedAt: new Date(),
  // Les autres champs sont omis pour éviter les erreurs de type "does not exist"
};

// Commenter prismaLeavesDataWithUser car il cause trop d'erreurs de linter
/*
const prismaLeavesDataWithUser: (PrismaLeave & {
    user: (Prisma.UserGetPayload<{ include: { department: true } }>) | null;
})[] = [
        {
            ...(mockPrismaLeaveRecord as PrismaLeave), // Cast si mockPrismaLeaveRecord est Partial
            id: 'L1_DB_CUID',
            userId: 101, 
            user: {
                id: 101, 
                email: mockUser.email!,
                firstName: mockUser.firstName,
                lastName: mockUser.lastName,
                prenom: mockUser.prenom,
                nom: mockUser.nom,
                department: { 
                    id: mockUserDepartment.id!,
                    name: mockUserDepartment.name!,
                    description: mockUserDepartment.description,
                    createdAt: mockUserDepartment.createdAt!,
                    updatedAt: mockUserDepartment.updatedAt!,
                 },
                role: 'USER', 
                isActive: true,
                emailVerified: null, 
                image: null, 
                passwordHash: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                departmentId: mockUserDepartment.id!, 
                specialtyId: null,
                workScheduleId: null,
                dateOfBirth: null,
                employeeId: null,
                gender: null,
                iban: null,
                isSystemAccount: false,
                lastLogin: null,
                middleName: null,
                nationality: null,
                phoneNumber: null,
                preferredLanguage: null,
                resetToken: null,
                resetTokenExpires: null,
                supervisorId: null,
                addressId: null,
                planningConstraintId: null,
                userPreferenceId: null,
                chirurgienId: null, 
                siteId: null, 
            }
        },
    ];
*/

const mockUserSchedule: WorkSchedule = {
  id: 'ws-1',
  userId: 1,
  frequency: WorkFrequency.FULL_TIME,
  workingDays: [
    Weekday.MONDAY,
    Weekday.TUESDAY,
    Weekday.WEDNESDAY,
    Weekday.THURSDAY,
    Weekday.FRIDAY,
  ],
  annualLeaveAllowance: 25,
  validFrom: new Date('2024-01-01'),
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  weekType: WeekType.BOTH,
  workingTimePercentage: 100,
};

const mockLeaveBalance: LeaveBalance = {
  userId: '456',
  year: 2024,
  balances: {
    [AppLeaveType.ANNUAL]: { initial: 20, used: 8, pending: 5, remaining: 7, acquired: 25 },
    [AppLeaveType.SICK]: { initial: 10, used: 2, pending: 0, remaining: 8, acquired: 10 },
    [AppLeaveType.RECOVERY]: { initial: 5, used: 1, pending: 0, remaining: 4, acquired: 5 },
  },
  lastUpdated: new Date(),
};

describe('leaveService', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let MockedPrismaClient: jest.MockedClass<typeof RealPrismaClient>;

  beforeAll(() => {
    delete global.prisma;
    (process.env as any).NODE_ENV = 'test';
  });

  beforeEach(() => {
    mockReset(prismaMock);
    MockedPrismaClient = MockablePrismaClientConstructor as jest.MockedClass<
      typeof RealPrismaClient
    >;
    MockedPrismaClient.mockClear();

    global.fetch = jest.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
      headers: new Headers(),
      type: 'basic' as ResponseType,
      redirected: false,
      statusText: 'OK',
      url: '',
      clone: function () {
        return this;
      },
      body: null,
      bodyUsed: false,
      arrayBuffer: async () => new ArrayBuffer(0),
      blob: async () => new Blob(),
      formData: async () => new FormData(),
    } as Response);
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  });

  describe('formatLeavePeriod', () => {
    it('should format the period correctly', () => {
      expect(formatLeavePeriod(new Date(2024, 7, 19), new Date(2024, 7, 23))).toMatch(
        /19\/08\/2024 au 23\/08\/2024/
      );
      expect(formatLeavePeriod(new Date(2024, 7, 19), new Date(2024, 7, 19))).toBe('19/08/2024');
    });
  });

  describe('getLeaveTypeLabel', () => {
    it('should return correct labels for known types', () => {
      expect(getLeaveTypeLabel(AppLeaveType.ANNUAL)).toBe('Congé annuel');
      expect(getLeaveTypeLabel(AppLeaveType.SICK)).toBe('Maladie');
      expect(getLeaveTypeLabel(AppLeaveType.RECOVERY)).toBe('Récupération');
      expect(getLeaveTypeLabel(AppLeaveType.TRAINING)).toBe('Formation');
      expect(getLeaveTypeLabel(AppLeaveType.MATERNITY)).toBe('Maternité');
      expect(getLeaveTypeLabel(AppLeaveType.SPECIAL)).toBe('Congé spécial');
      expect(getLeaveTypeLabel(AppLeaveType.UNPAID)).toBe('Congé sans solde');
      expect(getLeaveTypeLabel(AppLeaveType.OTHER)).toBe('Autre');
    });

    it('should return the type itself for unknown types', () => {
      expect(getLeaveTypeLabel('UNKNOWN_TYPE' as AppLeaveType)).toBe('UNKNOWN_TYPE');
    });
  });

  describe('getLeaveStatusLabel', () => {
    it('should return correct labels for known statuses', () => {
      expect(getLeaveStatusLabel(AppLeaveStatus.PENDING)).toBe('En attente');
      expect(getLeaveStatusLabel(AppLeaveStatus.APPROVED)).toBe('Approuvé');
      expect(getLeaveStatusLabel(AppLeaveStatus.REJECTED)).toBe('Refusé');
    });

    it('should return the status itself for unknown statuses', () => {
      expect(getLeaveStatusLabel('UNKNOWN_STATUS' as AppLeaveStatus)).toBe('UNKNOWN_STATUS');
    });
  });

  describe('fetchLeaves', () => {
    it('should call prisma.leave.count and prisma.leave.findMany with default parameters', async () => {
      const mockLeavesData: PrismaLeave[] = [];
      const mockTotalCount = 0;

      prismaMock.leave.count.mockResolvedValue(mockTotalCount);
      prismaMock.leave.findMany.mockResolvedValue(mockLeavesData);

      const filters: LeaveFilters = {};
      await fetchLeaves(filters);

      expect(prismaMock.leave.count).toHaveBeenCalledTimes(1);
      expect(prismaMock.leave.count).toHaveBeenCalledWith({
        where: {},
      });

      expect(prismaMock.leave.findMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.leave.findMany).toHaveBeenCalledWith({
        where: {},
        select: {
          id: true,
          userId: true,
          startDate: true,
          endDate: true,
          countedDays: true,
          type: true,
          reason: true,
          status: true,
          requestDate: true,
          approvedById: true,
          approvalDate: true,
          isRecurring: true,
          recurrencePattern: true,
          parentId: true,
          createdAt: true,
          updatedAt: true,
          user: { include: { department: true } },
        },
        skip: 0,
        take: 50,
        orderBy: [{ startDate: 'desc' }],
      });
    });

    it('should apply filters correctly to prisma queries', async () => {
      const filters: LeaveFilters = {
        userId: '123',
        departmentId: 'dept-abc',
        statuses: [AppLeaveStatus.APPROVED, AppLeaveStatus.PENDING],
        types: [AppLeaveType.ANNUAL],
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z',
        searchTerm: 'Test User',
        // @ts-expect-error // Attend une erreur si ces champs ne sont pas dans LeaveFilters.
        page: 2,
        limit: 10,
        sortBy: 'userName',
        sortOrder: 'asc',
      };

      const expectedPrismaStatuses: PrismaLeaveStatus[] = [
        PrismaLeaveStatus.APPROVED,
        PrismaLeaveStatus.PENDING,
      ];
      const expectedPrismaTypes: PrismaLeaveType[] = [PrismaLeaveType.ANNUAL];
      const mockPrismaLeavesResult: PrismaLeave[] = [];

      prismaMock.leave.count.mockResolvedValue(0);
      prismaMock.leave.findMany.mockResolvedValue(mockPrismaLeavesResult);

      await fetchLeaves(filters);

      const expectedWhere: Prisma.LeaveWhereInput = {
        userId: 123,
        user: { departmentId: 'dept-abc' },
        status: { in: expectedPrismaStatuses },
        type: { in: expectedPrismaTypes },
        AND: [
          { startDate: { gte: new Date('2024-01-01T00:00:00.000Z') } },
          { endDate: { lte: new Date('2024-01-31T23:59:59.999Z') } },
        ],
        OR: [
          { user: { prenom: { contains: 'Test User', mode: 'insensitive' } } },
          { user: { nom: { contains: 'Test User', mode: 'insensitive' } } },
          { reason: { contains: 'Test User', mode: 'insensitive' } },
        ],
      };

      expect(prismaMock.leave.count).toHaveBeenCalledTimes(1);
      expect(prismaMock.leave.count).toHaveBeenCalledWith({ where: expectedWhere });

      expect(prismaMock.leave.findMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.leave.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        select: expect.any(Object),
        skip: 10,
        take: 10,
        orderBy: [{ user: { prenom: 'asc' } }, { user: { nom: 'asc' } }],
      });
    });
  });

  describe('submitLeaveRequest', () => {
    it('should submit a leave request', async () => {
      // TODO: Implement test.
    });
  });

  describe('calculateLeaveDays', () => {
    it('should calculate leave days based on schedule', () => {
      const result = calculateLeaveDays(
        new Date('2024-08-19'),
        new Date('2024-08-23'),
        mockUserSchedule
      );
      expect(result).toBe(5);
    });
  });
});
