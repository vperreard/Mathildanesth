/**
 * Types et factories pour les mocks de test
 * Élimine le besoin d'utiliser @ts-ignore dans les tests
 */

import {
    User,
    Leave,
    LeaveTypeSetting,
    SchoolHolidayPeriod,
    PublicHoliday,
    LeaveRequestAlert,
    ProfessionalRole,
    LeaveStatus,
    LeaveType as PrismaLeaveType
} from '@prisma/client';

// Types de mocks partiels
export type MockUser = Partial<User> & {
    id?: number;
    professionalRole?: ProfessionalRole;
};

export type MockLeave = Partial<Leave> & {
    id?: string;
    userId?: number;
    user?: MockUser;
    startDate?: Date;
    endDate?: Date;
    status?: LeaveStatus;
    type?: PrismaLeaveType;
};

export type MockLeaveTypeSetting = Partial<LeaveTypeSetting> & {
    code?: string;
    label?: string;
    isActive?: boolean;
    isUserSelectable?: boolean;
};

export type MockSchoolHolidayPeriod = Partial<SchoolHolidayPeriod> & {
    id?: number;
    name?: string;
    startDate?: Date;
    endDate?: Date;
};

export type MockPublicHoliday = Partial<PublicHoliday> & {
    id?: string;
    date?: Date;
    name?: string;
};

export type MockLeaveRequestAlert = Partial<LeaveRequestAlert> & {
    id?: number;
    leaveId?: string;
    ruleCode?: string;
    messageDetails?: string;
};

// Factories pour créer des mocks typés
export const createMockUser = (overrides: MockUser = {}): User => ({
    id: 1,
    nom: 'User',
    prenom: 'Test',
    login: 'test-user',
    email: 'test@example.com',
    password: 'hashed-password',
    role: 'USER' as any,
    professionalRole: ProfessionalRole.SECRETAIRE,
    tempsPartiel: false,
    pourcentageTempsPartiel: null,
    dateEntree: null,
    dateSortie: null,
    actif: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    mustChangePassword: false,
    phoneNumber: null,
    alias: null,
    workOnMonthType: null,
    workPattern: 'FULL_TIME' as any,
    joursTravaillesSemaineImpaire: [],
    joursTravaillesSemainePaire: [],
    displayPreferences: null,
    lastLogin: null,
    departmentId: null,
    canSuperviseEndo: false,
    canSuperviseOphtalmo: false,
    ...overrides
} as User);

export const createMockLeave = (overrides: MockLeave = {}): Leave => ({
    id: 'leave-1',
    userId: 1,
    type: PrismaLeaveType.ANNUAL,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-02'),
    status: LeaveStatus.PENDING,
    countedDays: 1,
    requestDate: new Date(),
    reason: null,
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isRecurring: false,
    recurringUntil: null,
    recurringFrequency: null,
    parentRecurringLeaveId: null,
    ...overrides
} as Leave);

export const createMockLeaveTypeSetting = (overrides: MockLeaveTypeSetting = {}): LeaveTypeSetting => ({
    id: 1,
    code: 'ANNUAL',
    label: 'Congé Annuel',
    isActive: true,
    isUserSelectable: true,
    color: '#000000',
    maxConsecutiveDays: null,
    requiresApproval: true,
    minAdvanceNotice: null,
    maxAdvanceBooking: null,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
} as LeaveTypeSetting);

export const createMockSchoolHolidayPeriod = (overrides: MockSchoolHolidayPeriod = {}): SchoolHolidayPeriod => ({
    id: 1,
    name: 'Vacances d\'été',
    startDate: new Date('2024-07-01'),
    endDate: new Date('2024-08-31'),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
} as SchoolHolidayPeriod);

export const createMockPublicHoliday = (overrides: MockPublicHoliday = {}): PublicHoliday => ({
    id: 'holiday-1',
    date: new Date('2024-01-01'),
    name: 'Nouvel An',
    description: null,
    isNational: true,
    region: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
} as PublicHoliday);

export const createMockLeaveRequestAlert = (overrides: MockLeaveRequestAlert = {}): LeaveRequestAlert => ({
    id: 1,
    leaveId: 'leave-1',
    ruleCode: 'TEST_RULE',
    messageDetails: 'Test alert message',
    generatedAt: new Date(),
    ...overrides
} as LeaveRequestAlert);

// Types pour les mocks Prisma
export interface MockPrismaClient {
    user: {
        findUnique: jest.Mock;
        findMany: jest.Mock;
        create: jest.Mock;
        update: jest.Mock;
        delete: jest.Mock;
        count: jest.Mock;
    };
    leave: {
        findUnique: jest.Mock;
        findMany: jest.Mock;
        create: jest.Mock;
        update: jest.Mock;
        delete: jest.Mock;
        count: jest.Mock;
    };
    leaveTypeSetting: {
        findUnique: jest.Mock;
        findMany: jest.Mock;
        create: jest.Mock;
        update: jest.Mock;
        delete: jest.Mock;
    };
    schoolHolidayPeriod: {
        findMany: jest.Mock;
        create: jest.Mock;
        update: jest.Mock;
        delete: jest.Mock;
    };
    publicHoliday: {
        findMany: jest.Mock;
        create: jest.Mock;
        update: jest.Mock;
        delete: jest.Mock;
    };
    leaveRequestAlert: {
        create: jest.Mock;
        findMany: jest.Mock;
        update: jest.Mock;
        delete: jest.Mock;
    };
}

// Helper pour créer un mock Prisma typé
export const createMockPrisma = (): MockPrismaClient => ({
    user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    leave: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    leaveTypeSetting: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    schoolHolidayPeriod: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    publicHoliday: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    leaveRequestAlert: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
});

// Helper pour valider les types au runtime
export const assertMockType = <T>(mock: any, expected: Partial<T>): T => {
    return { ...expected, ...mock } as T;
}; 