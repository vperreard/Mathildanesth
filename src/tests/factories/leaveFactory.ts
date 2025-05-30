import {
  LeaveRequest as Leave,
  LeaveType,
  LeaveStatus,
  LeaveBalance,
  LeaveAllowanceCheckResult,
  PaginatedLeaveResults,
  RecurringLeaveRequest,
} from '../../modules/leaves/types/leave';
import {
  ConflictCheckResult,
  LeaveConflict,
  ConflictType,
  ConflictSeverity,
} from '../../modules/leaves/types/conflict';
import { WorkSchedule, WorkFrequency, Weekday, WeekType } from '../../modules/profiles/types/workSchedule';

// Leave Factory
export const createMockLeave = (overrides: Partial<Leave> = {}): Leave => ({
  id: 'leave-123',
  userId: 'user-123',
  startDate: new Date('2025-06-01'),
  endDate: new Date('2025-06-05'),
  type: LeaveType.ANNUAL,
  status: LeaveStatus.PENDING,
  reason: 'Vacances d\'été',
  requestDate: new Date('2025-05-15'),
  countedDays: 5,
  isRecurring: false,
  createdAt: new Date('2025-05-15'),
  updatedAt: new Date('2025-05-15'),
  ...overrides,
});

// Leave Balance Factory
export const createMockLeaveBalance = (overrides: Partial<LeaveBalance> = {}): LeaveBalance => ({
  userId: 'user-123',
  year: 2025,
  initialAllowance: 25,
  additionalAllowance: 5,
  used: 10,
  pending: 2,
  remaining: 18,
  ...overrides,
});

// Conflict Detection Factory
export const createMockConflictResult = (overrides: Partial<ConflictCheckResult> = {}): ConflictCheckResult => ({
  hasConflicts: false,
  conflicts: [],
  ...overrides,
});

export const createMockLeaveConflict = (overrides: Partial<LeaveConflict> = {}): LeaveConflict => ({
  type: ConflictType.OVERLAP,
  severity: ConflictSeverity.HIGH,
  conflictingLeaveId: 'conflicting-leave-123',
  message: 'Conflit avec un congé existant',
  ...overrides,
});

// Allowance Check Factory
export const createMockAllowanceResult = (overrides: Partial<LeaveAllowanceCheckResult> = {}): LeaveAllowanceCheckResult => ({
  hasAllowance: true,
  remainingDays: 15,
  requestedDays: 5,
  ...overrides,
});

// Paginated Results Factory
export const createMockPaginatedResults = (overrides: Partial<PaginatedLeaveResults> = {}): PaginatedLeaveResults => ({
  items: [createMockLeave()],
  total: 1,
  page: 1,
  limit: 50,
  totalPages: 1,
  ...overrides,
});

// Work Schedule Factory
export const createMockWorkSchedule = (overrides: Partial<WorkSchedule> = {}): WorkSchedule => ({
  workingDays: [Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY],
  frequency: WorkFrequency.FULL_TIME,
  weekType: WeekType.BOTH,
  hoursPerDay: 8,
  ...overrides,
});

// Recurring Leave Factory
export const createMockRecurringLeave = (overrides: Partial<RecurringLeaveRequest> = {}): RecurringLeaveRequest => ({
  id: 'recurring-123',
  userId: 'user-123',
  type: LeaveType.ANNUAL,
  patternStartDate: '2025-06-01',
  patternEndDate: '2025-08-31',
  recurrencePattern: {
    frequency: 'WEEKLY',
    interval: 2,
    daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
  },
  reason: 'Congés récurrents d\'été',
  isActive: true,
  createdAt: new Date('2025-05-15'),
  updatedAt: new Date('2025-05-15'),
  ...overrides,
});

// API Response Factories
export const createMockApiResponse = <T>(data: T, success = true) => ({
  data,
  success,
  message: success ? 'Opération réussie' : 'Erreur lors de l\'opération',
});

export const createMockErrorResponse = (message: string, status = 500) => ({
  error: message,
  status,
  statusText: status === 404 ? 'Not Found' : 'Internal Server Error',
});

// User Factory for leaves context
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  login: 'testuser',
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@example.com',
  role: 'USER',
  actif: true,
  mustChangePassword: false,
  ...overrides,
});

// Date Utilities for Tests
export const getFutureDate = (daysFromNow: number = 7): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
};

export const getPastDate = (daysAgo: number = 7): Date => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
};

// Mock Fetch Response
export const createMockFetchResponse = <T>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  json: jest.fn().mockResolvedValue(data),
});

export default {
  createMockLeave,
  createMockLeaveBalance,
  createMockConflictResult,
  createMockLeaveConflict,
  createMockAllowanceResult,
  createMockPaginatedResults,
  createMockWorkSchedule,
  createMockRecurringLeave,
  createMockApiResponse,
  createMockErrorResponse,
  createMockUser,
  createMockFetchResponse,
  getFutureDate,
  getPastDate,
};