import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { BusinessRulesValidator } from '../businessRulesValidator';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    leaveRequest: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    assignment: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    operatingRoom: {
      findUnique: jest.fn(),
    },
    quota: {
      findUnique: jest.fn(),
    },
  },
}));

describe('BusinessRulesValidator', () => {
  let validator: BusinessRulesValidator;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    validator = new BusinessRulesValidator();
    mockPrisma = prisma as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateLeaveRequest', () => {
    const mockLeaveInput = {
      userId: 'user-1',
      startDate: new Date('2025-06-15'),
      endDate: new Date('2025-06-20'),
      type: 'ANNUAL',
      quotaId: 'quota-1'
    };

    it('should validate a simple leave request successfully', async () => {
      mockPrisma.leaveRequest.findMany.mockResolvedValue([]);
      mockPrisma.leaveRequest.count.mockResolvedValue(0);
      mockPrisma.quota.findUnique.mockResolvedValue({
        id: 'quota-1',
        totalDays: 25,
        usedDays: 10,
        remainingDays: 15
      });

      const result = await validator.validateLeaveRequest(mockLeaveInput);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject leave request exceeding maximum consecutive days', async () => {
      const longLeaveInput = {
        ...mockLeaveInput,
        endDate: new Date('2025-08-20') // Plus de 30 jours
      };

      mockPrisma.leaveRequest.findMany.mockResolvedValue([]);
      mockPrisma.quota.findUnique.mockResolvedValue({
        id: 'quota-1',
        totalDays: 50,
        usedDays: 0,
        remainingDays: 50
      });

      const result = await validator.validateLeaveRequest(longLeaveInput);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'La durée maximale de congés consécutifs est de 30 jours'
      );
    });

    it('should reject leave request when insufficient quota', async () => {
      mockPrisma.leaveRequest.findMany.mockResolvedValue([]);
      mockPrisma.quota.findUnique.mockResolvedValue({
        id: 'quota-1',
        totalDays: 25,
        usedDays: 23,
        remainingDays: 2
      });

      const result = await validator.validateLeaveRequest(mockLeaveInput);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Quota insuffisant: 2 jours restants, 6 jours demandés'
      );
    });

    it('should reject leave request with overlapping periods', async () => {
      mockPrisma.leaveRequest.findMany.mockResolvedValue([
        {
          id: 'existing-leave',
          userId: 'user-1',
          startDate: new Date('2025-06-18'),
          endDate: new Date('2025-06-25'),
          status: 'APPROVED'
        }
      ]);
      mockPrisma.quota.findUnique.mockResolvedValue({
        id: 'quota-1',
        totalDays: 25,
        usedDays: 10,
        remainingDays: 15
      });

      const result = await validator.validateLeaveRequest(mockLeaveInput);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Conflit avec un congé existant du 18/06/2025 au 25/06/2025'
      );
    });

    it('should reject leave request too close to previous long leave', async () => {
      const previousLongLeave = new Date('2025-05-01');
      mockPrisma.leaveRequest.findMany
        .mockResolvedValueOnce([]) // Pas de conflits directs
        .mockResolvedValueOnce([ // Congés longs précédents
          {
            id: 'long-leave',
            userId: 'user-1',
            startDate: previousLongLeave,
            endDate: new Date('2025-05-20'), // 20 jours = congé long
            status: 'APPROVED'
          }
        ]);
      mockPrisma.quota.findUnique.mockResolvedValue({
        id: 'quota-1',
        totalDays: 25,
        usedDays: 10,
        remainingDays: 15
      });

      const longLeaveInput = {
        ...mockLeaveInput,
        endDate: new Date('2025-06-30') // Nouveau congé long
      };

      const result = await validator.validateLeaveRequest(longLeaveInput);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Délai minimum de 90 jours entre deux congés longs non respecté'
      );
    });

    it('should handle missing quota gracefully', async () => {
      mockPrisma.leaveRequest.findMany.mockResolvedValue([]);
      mockPrisma.quota.findUnique.mockResolvedValue(null);

      const result = await validator.validateLeaveRequest(mockLeaveInput);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Quota non trouvé');
    });
  });

  describe('validateAssignment', () => {
    const mockAssignmentInput = {
      userId: 'user-1',
      operatingRoomId: 'room-1',
      date: new Date('2025-06-15'),
      shiftType: 'GARDE' as const,
      duration: 12
    };

    it('should validate a simple assignment successfully', async () => {
      mockPrisma.assignment.findMany.mockResolvedValue([]);
      mockPrisma.assignment.count.mockResolvedValue(2); // 2 gardes ce mois
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe'
      });
      mockPrisma.operatingRoom.findUnique.mockResolvedValue({
        id: 'room-1',
        name: 'Salle 1'
      });

      const result = await validator.validateAssignment(mockAssignmentInput);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject assignment exceeding maximum guards per month', async () => {
      mockPrisma.assignment.findMany.mockResolvedValue([]);
      mockPrisma.assignment.count.mockResolvedValue(4); // Déjà 4 gardes
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe'
      });
      mockPrisma.operatingRoom.findUnique.mockResolvedValue({
        id: 'room-1',
        name: 'Salle 1'
      });

      const result = await validator.validateAssignment(mockAssignmentInput);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Nombre maximum de gardes par mois dépassé (4/4)'
      );
    });

    it('should reject assignment too close to previous guard', async () => {
      const recentGuard = new Date('2025-06-10'); // 5 jours avant
      mockPrisma.assignment.findMany.mockResolvedValue([
        {
          id: 'recent-guard',
          userId: 'user-1',
          date: recentGuard,
          shiftType: 'GARDE',
          startTime: '08:00',
          endTime: '20:00'
        }
      ]);
      mockPrisma.assignment.count.mockResolvedValue(2);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe'
      });
      mockPrisma.operatingRoom.findUnique.mockResolvedValue({
        id: 'room-1',
        name: 'Salle 1'
      });

      const result = await validator.validateAssignment(mockAssignmentInput);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Délai minimum de 7 jours entre deux gardes non respecté'
      );
    });

    it('should reject assignment with insufficient rest time', async () => {
      const recentAssignment = new Date('2025-06-14T22:00:00'); // Fini à 22h la veille
      mockPrisma.assignment.findMany.mockResolvedValue([
        {
          id: 'recent-assignment',
          userId: 'user-1',
          date: new Date('2025-06-14'),
          shiftType: 'JOUR',
          startTime: '08:00',
          endTime: '22:00' // Fini tard
        }
      ]);
      mockPrisma.assignment.count.mockResolvedValue(2);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe'
      });
      mockPrisma.operatingRoom.findUnique.mockResolvedValue({
        id: 'room-1',
        name: 'Salle 1'
      });

      // Assignment le lendemain à 8h = moins de 11h de repos
      const morningAssignment = {
        ...mockAssignmentInput,
        shiftType: 'JOUR' as const,
        date: new Date('2025-06-15T08:00:00')
      };

      const result = await validator.validateAssignment(morningAssignment);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Temps de repos minimum de 11 heures non respecté'
      );
    });

    it('should handle non-existent user', async () => {
      mockPrisma.assignment.findMany.mockResolvedValue([]);
      mockPrisma.assignment.count.mockResolvedValue(0);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await validator.validateAssignment(mockAssignmentInput);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Utilisateur non trouvé');
    });

    it('should handle non-existent operating room', async () => {
      mockPrisma.assignment.findMany.mockResolvedValue([]);
      mockPrisma.assignment.count.mockResolvedValue(0);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe'
      });
      mockPrisma.operatingRoom.findUnique.mockResolvedValue(null);

      const result = await validator.validateAssignment(mockAssignmentInput);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Bloc opératoire non trouvé');
    });
  });

  describe('validatePlanningGeneration', () => {
    const mockPlanningInput = {
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-06-30'),
      siteId: 'site-1',
      includeWeekends: true,
      respectQuotas: true
    };

    it('should validate planning generation parameters successfully', async () => {
      const result = await validator.validatePlanningGeneration(mockPlanningInput);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject planning with invalid date range', async () => {
      const invalidInput = {
        ...mockPlanningInput,
        startDate: new Date('2025-06-30'),
        endDate: new Date('2025-06-01') // Fin avant début
      };

      const result = await validator.validatePlanningGeneration(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'La date de fin doit être postérieure à la date de début'
      );
    });

    it('should reject planning with too long period', async () => {
      const longPeriodInput = {
        ...mockPlanningInput,
        endDate: new Date('2026-06-30') // Plus d'un an
      };

      const result = await validator.validatePlanningGeneration(longPeriodInput);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'La période de génération ne peut pas dépasser 12 mois'
      );
    });

    it('should reject planning starting in the past', async () => {
      const pastInput = {
        ...mockPlanningInput,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      };

      const result = await validator.validatePlanningGeneration(pastInput);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'La génération de planning ne peut pas commencer dans le passé'
      );
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockLeaveInput = {
        userId: 'user-1',
        startDate: new Date('2025-06-15'),
        endDate: new Date('2025-06-20'),
        type: 'ANNUAL'
      };

      mockPrisma.leaveRequest.findMany.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        validator.validateLeaveRequest(mockLeaveInput)
      ).rejects.toThrow('Database connection failed');
    });

    it('should validate empty date ranges', async () => {
      const emptyInput = {
        startDate: new Date('2025-06-15'),
        endDate: new Date('2025-06-15'), // Même jour
        siteId: 'site-1'
      };

      const result = await validator.validatePlanningGeneration(emptyInput);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});