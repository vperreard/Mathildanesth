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

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await PlanningService.saveAssignments(mockAttributions);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Erreur API lors de la sauvegarde:', { error: 'Validation failed' });
      
      consoleSpy.mockRestore();
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await PlanningService.saveAssignments(mockAttributions);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Erreur lors de la sauvegarde des gardes/vacations via API:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
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

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(PlanningService.validateAssignments(mockAttributions)).rejects.toThrow('Validation service unavailable');
      
      expect(consoleSpy).toHaveBeenCalledWith('Erreur API lors de la validation:', { error: 'Validation service unavailable' });
      
      consoleSpy.mockRestore();
    });

    it('should throw error on network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network timeout'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(PlanningService.validateAssignments(mockAttributions)).rejects.toThrow('Network timeout');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Erreur lors de la validation des gardes/vacations via API:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

});