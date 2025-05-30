/**
 * @jest-environment node
 */

import { 
  detectLeaveConflicts, 
  validateConflictRules, 
  resolveConflict,
  getConflictPriority 
} from '../conflictDetectionService';
import { ConflictType, ConflictSeverity } from '../../types/conflict';
import { LeaveType, LeaveStatus } from '../../types/leave';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    leave: {
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    department: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock date utilities
jest.mock('@/utils/dateUtils', () => ({
  formatDate: (date: Date) => date.toISOString().split('T')[0],
  isDateInRange: (date: Date, start: Date, end: Date) => date >= start && date <= end,
}));

import { prisma } from '@/lib/prisma';
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('conflictDetectionService Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectLeaveConflicts', () => {
    const mockUserId = 'user-123';
    const mockStartDate = new Date('2024-08-19T00:00:00.000Z');
    const mockEndDate = new Date('2024-08-23T00:00:00.000Z');

    it('should detect user leave overlap conflicts', async () => {
      const overlappingLeaves = [
        {
          id: 'leave-1',
          userId: mockUserId,
          type: LeaveType.ANNUAL,
          status: LeaveStatus.APPROVED,
          startDate: new Date('2024-08-20T00:00:00.000Z'),
          endDate: new Date('2024-08-25T00:00:00.000Z'),
          days: 4,
          reason: 'Existing leave',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: mockUserId,
            nom: 'Test',
            prenom: 'User',
            email: 'test@example.com',
          },
        },
      ];

      mockPrisma.leave.findMany.mockResolvedValue(overlappingLeaves);

      const result = await detectLeaveConflicts({
        userId: mockUserId,
        startDate: mockStartDate,
        endDate: mockEndDate,
        excludeId: undefined,
      });

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe(ConflictType.USER_LEAVE_OVERLAP);
      expect(result.conflicts[0].severity).toBe(ConflictSeverity.BLOQUANT);
      expect(result.hasBlockingConflicts).toBe(true);
    });

    it('should detect team capacity conflicts', async () => {
      const teamLeaves = [
        {
          id: 'leave-2',
          userId: 'user-456',
          type: LeaveType.ANNUAL,
          status: LeaveStatus.APPROVED,
          startDate: new Date('2024-08-19T00:00:00.000Z'),
          endDate: new Date('2024-08-23T00:00:00.000Z'),
          days: 5,
          reason: 'Team member leave',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user-456',
            nom: 'Team',
            prenom: 'Member',
            email: 'team@example.com',
            departmentId: 'dept-1',
          },
        },
        {
          id: 'leave-3',
          userId: 'user-789',
          type: LeaveType.ANNUAL,
          status: LeaveStatus.APPROVED,
          startDate: new Date('2024-08-19T00:00:00.000Z'),
          endDate: new Date('2024-08-23T00:00:00.000Z'),
          days: 5,
          reason: 'Another team member leave',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user-789',
            nom: 'Another',
            prenom: 'Member',
            email: 'another@example.com',
            departmentId: 'dept-1',
          },
        },
      ];

      mockPrisma.leave.findMany.mockResolvedValue(teamLeaves);
      mockPrisma.department.findUnique.mockResolvedValue({
        id: 'dept-1',
        name: 'Test Department',
        maxSimultaneousLeaves: 1, // Only 1 person can be on leave at the same time
      });

      const result = await detectLeaveConflicts({
        userId: mockUserId,
        startDate: mockStartDate,
        endDate: mockEndDate,
        departmentId: 'dept-1',
      });

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe(ConflictType.TEAM_CAPACITY);
      expect(result.conflicts[0].severity).toBe(ConflictSeverity.AVERTISSEMENT);
    });

    it('should detect special period conflicts', async () => {
      // Mock a holiday period
      const holidayPeriods = [
        {
          id: 'holiday-1',
          name: 'Noël',
          startDate: new Date('2024-12-24T00:00:00.000Z'),
          endDate: new Date('2024-12-26T00:00:00.000Z'),
          type: 'PUBLIC_HOLIDAY',
        },
      ];

      const result = await detectLeaveConflicts({
        userId: mockUserId,
        startDate: new Date('2024-12-25T00:00:00.000Z'),
        endDate: new Date('2024-12-27T00:00:00.000Z'),
        holidayPeriods,
      });

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe(ConflictType.SPECIAL_PERIOD);
      expect(result.conflicts[0].severity).toBe(ConflictSeverity.INFORMATION);
    });

    it('should exclude specified leave ID from conflict detection', async () => {
      const excludeId = 'leave-to-exclude';
      const overlappingLeaves = [
        {
          id: excludeId,
          userId: mockUserId,
          type: LeaveType.ANNUAL,
          status: LeaveStatus.APPROVED,
          startDate: new Date('2024-08-20T00:00:00.000Z'),
          endDate: new Date('2024-08-25T00:00:00.000Z'),
          days: 4,
          reason: 'Own leave',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: mockUserId,
            nom: 'Test',
            prenom: 'User',
            email: 'test@example.com',
          },
        },
      ];

      mockPrisma.leave.findMany.mockResolvedValue(overlappingLeaves);

      const result = await detectLeaveConflicts({
        userId: mockUserId,
        startDate: mockStartDate,
        endDate: mockEndDate,
        excludeId,
      });

      expect(result.conflicts).toHaveLength(0);
      expect(result.hasBlockingConflicts).toBe(false);
    });

    it('should return no conflicts for non-overlapping dates', async () => {
      mockPrisma.leave.findMany.mockResolvedValue([]);

      const result = await detectLeaveConflicts({
        userId: mockUserId,
        startDate: mockStartDate,
        endDate: mockEndDate,
      });

      expect(result.conflicts).toHaveLength(0);
      expect(result.hasBlockingConflicts).toBe(false);
      expect(result.hasConflicts).toBe(false);
    });
  });

  describe('validateConflictRules', () => {
    it('should validate conflict rules against configuration', async () => {
      const conflicts = [
        {
          id: 'conflict-1',
          type: ConflictType.USER_LEAVE_OVERLAP,
          severity: ConflictSeverity.BLOQUANT,
          description: 'User already has leave',
          canOverride: false,
          resolved: false,
        },
        {
          id: 'conflict-2',
          type: ConflictType.TEAM_CAPACITY,
          severity: ConflictSeverity.AVERTISSEMENT,
          description: 'Team capacity exceeded',
          canOverride: true,
          resolved: false,
        },
      ];

      const rules = {
        allowOverlapForSameUser: false,
        maxTeamLeavePercentage: 50,
        blockingConflictTypes: [ConflictType.USER_LEAVE_OVERLAP],
        warningConflictTypes: [ConflictType.TEAM_CAPACITY],
      };

      const result = await validateConflictRules(conflicts, rules);

      expect(result.isValid).toBe(false);
      expect(result.blockingConflicts).toHaveLength(1);
      expect(result.warningConflicts).toHaveLength(1);
    });

    it('should allow validation to pass with only warnings', async () => {
      const conflicts = [
        {
          id: 'conflict-1',
          type: ConflictType.TEAM_CAPACITY,
          severity: ConflictSeverity.AVERTISSEMENT,
          description: 'Team capacity warning',
          canOverride: true,
          resolved: false,
        },
      ];

      const rules = {
        allowOverlapForSameUser: false,
        maxTeamLeavePercentage: 50,
        blockingConflictTypes: [ConflictType.USER_LEAVE_OVERLAP],
        warningConflictTypes: [ConflictType.TEAM_CAPACITY],
      };

      const result = await validateConflictRules(conflicts, rules);

      expect(result.isValid).toBe(true);
      expect(result.blockingConflicts).toHaveLength(0);
      expect(result.warningConflicts).toHaveLength(1);
    });
  });

  describe('resolveConflict', () => {
    it('should mark conflict as resolved', async () => {
      const conflictId = 'conflict-123';
      const userId = 'user-123';

      const result = await resolveConflict(conflictId, userId);

      expect(result.success).toBe(true);
      expect(result.conflictId).toBe(conflictId);
      expect(result.resolvedAt).toBeDefined();
      expect(result.resolvedBy).toBe(userId);
    });

    it('should handle resolution errors', async () => {
      const invalidConflictId = 'invalid-conflict';
      const userId = 'user-123';

      await expect(resolveConflict(invalidConflictId, userId)).rejects.toThrow('Conflict not found');
    });
  });

  describe('getConflictPriority', () => {
    it('should return correct priority for blocking conflicts', () => {
      const conflict = {
        id: 'conflict-1',
        type: ConflictType.USER_LEAVE_OVERLAP,
        severity: ConflictSeverity.BLOQUANT,
        description: 'Blocking conflict',
        canOverride: false,
        resolved: false,
      };

      const priority = getConflictPriority(conflict);

      expect(priority).toBe(1); // Highest priority
    });

    it('should return correct priority for warning conflicts', () => {
      const conflict = {
        id: 'conflict-1',
        type: ConflictType.TEAM_CAPACITY,
        severity: ConflictSeverity.AVERTISSEMENT,
        description: 'Warning conflict',
        canOverride: true,
        resolved: false,
      };

      const priority = getConflictPriority(conflict);

      expect(priority).toBe(2); // Medium priority
    });

    it('should return correct priority for info conflicts', () => {
      const conflict = {
        id: 'conflict-1',
        type: ConflictType.SPECIAL_PERIOD,
        severity: ConflictSeverity.INFORMATION,
        description: 'Info conflict',
        canOverride: true,
        resolved: false,
      };

      const priority = getConflictPriority(conflict);

      expect(priority).toBe(3); // Low priority
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.leave.findMany.mockRejectedValue(dbError);

      await expect(
        detectLeaveConflicts({
          userId: 'user-123',
          startDate: new Date(),
          endDate: new Date(),
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid date ranges', async () => {
      const invalidStartDate = new Date('2024-08-25T00:00:00.000Z');
      const invalidEndDate = new Date('2024-08-20T00:00:00.000Z');

      await expect(
        detectLeaveConflicts({
          userId: 'user-123',
          startDate: invalidStartDate,
          endDate: invalidEndDate,
        })
      ).rejects.toThrow('Start date must be before end date');
    });
  });

  describe('Complex conflict scenarios', () => {
    it('should handle multiple conflict types simultaneously', async () => {
      const overlappingLeaves = [
        {
          id: 'leave-1',
          userId: 'user-123',
          type: LeaveType.ANNUAL,
          status: LeaveStatus.APPROVED,
          startDate: new Date('2024-08-20T00:00:00.000Z'),
          endDate: new Date('2024-08-25T00:00:00.000Z'),
          days: 4,
          reason: 'User overlap',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user-123',
            nom: 'Test',
            prenom: 'User',
            email: 'test@example.com',
          },
        },
        {
          id: 'leave-2',
          userId: 'user-456',
          type: LeaveType.ANNUAL,
          status: LeaveStatus.APPROVED,
          startDate: new Date('2024-08-19T00:00:00.000Z'),
          endDate: new Date('2024-08-23T00:00:00.000Z'),
          days: 5,
          reason: 'Team capacity',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user-456',
            nom: 'Team',
            prenom: 'Member',
            email: 'team@example.com',
            departmentId: 'dept-1',
          },
        },
      ];

      mockPrisma.leave.findMany.mockResolvedValue(overlappingLeaves);
      mockPrisma.department.findUnique.mockResolvedValue({
        id: 'dept-1',
        name: 'Test Department',
        maxSimultaneousLeaves: 1,
      });

      const result = await detectLeaveConflicts({
        userId: 'user-123',
        startDate: new Date('2024-08-19T00:00:00.000Z'),
        endDate: new Date('2024-08-23T00:00:00.000Z'),
        departmentId: 'dept-1',
      });

      expect(result.conflicts.length).toBeGreaterThan(1);
      expect(result.hasBlockingConflicts).toBe(true);
      
      const conflictTypes = result.conflicts.map(c => c.type);
      expect(conflictTypes).toContain(ConflictType.USER_LEAVE_OVERLAP);
      expect(conflictTypes).toContain(ConflictType.TEAM_CAPACITY);
    });
  });
});