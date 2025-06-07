import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { PlanningService } from '../planningService';
import { Attribution, RuleViolation } from '@/types/attribution';

// Mock fetch globalement
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('PlanningService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('saveAssignments', () => {
    const mockAttributions: Attribution[] = [
      {
        id: '1',
        userId: 1,
        date: new Date('2025-06-01'),
        type: 'GARDE',
        status: 'CONFIRMED',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        userId: 2,
        date: new Date('2025-06-02'),
        type: 'VACATION',
        status: 'CONFIRMED',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should successfully save assignments via API', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await PlanningService.saveAssignments(mockAttributions);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/gardes/vacations',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attributions: mockAttributions }),
        }
      );
    });

    it('should return false when API returns error', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Validation failed' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await PlanningService.saveAssignments(mockAttributions);

      expect(result).toBe(false);
      // The function returns false on error, so we just verify the result
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await PlanningService.saveAssignments(mockAttributions);

      expect(result).toBe(false);
    });
  });

  describe('validateAssignments', () => {
    const mockAttributions: Attribution[] = [
      {
        id: '1',
        userId: 1,
        date: new Date('2025-06-01'),
        type: 'GARDE',
        status: 'CONFIRMED',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return empty array when all assignments are valid', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ violations: [] }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await PlanningService.validateAssignments(mockAttributions);

      expect(result).toEqual([]);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/gardes/vacations/validate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attributions: mockAttributions }),
        }
      );
    });

    it('should return violations when assignments break rules', async () => {
      const mockViolations: RuleViolation[] = [
        {
          ruleId: 'MAX_CONSECUTIVE_DAYS',
          message: 'Cannot work more than 5 consecutive days',
          severity: 'ERROR',
          affectedUsers: [1],
        },
      ];

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ violations: mockViolations }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await PlanningService.validateAssignments(mockAttributions);

      expect(result).toEqual(mockViolations);
    });

    it('should throw error when API returns error', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Validation service unavailable' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(PlanningService.validateAssignments(mockAttributions)).rejects.toThrow('Validation service unavailable');
    });

    it('should throw error on network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network timeout'));

      await expect(PlanningService.validateAssignments(mockAttributions)).rejects.toThrow('Network timeout');
    });
  });

  describe('getAssignments', () => {
    const startDate = new Date('2025-06-01');
    const endDate = new Date('2025-06-07');

    it('should fetch assignments for date range', async () => {
      const mockAssignments = [
        {
          id: '1',
          userId: 1,
          date: '2025-06-01T00:00:00.000Z',
          type: 'GARDE',
          status: 'CONFIRMED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ attributions: mockAssignments }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await PlanningService.getAssignments(startDate, endDate);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBeInstanceOf(Date);
      expect(global.fetch).toHaveBeenCalledWith(
        `http://localhost:3000/api/gardes/vacations?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      );
    });

    it('should handle empty assignments response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ attributions: [] }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await PlanningService.getAssignments(startDate, endDate);

      expect(result).toEqual([]);
    });

    it('should handle missing attributions in response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await PlanningService.getAssignments(startDate, endDate);

      expect(result).toEqual([]);
    });

    it('should throw error when API returns error', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Database error' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(
        PlanningService.getAssignments(startDate, endDate)
      ).rejects.toThrow('Database error');
    });

    it('should throw error on network failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        PlanningService.getAssignments(startDate, endDate)
      ).rejects.toThrow('Network error');
    });
  });

});