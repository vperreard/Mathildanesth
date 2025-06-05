import { describe, it, expect } from '@jest/globals';
import { validateAssignments } from '../validation';
import { Attribution, AttributionType } from '@/types/attribution';
import { RulesConfiguration } from '@/types/rules';

describe('Validation Service', () => {
  const mockRules: RulesConfiguration = {
    maxConsecutiveDays: 5,
    maxWeeklyHours: 48,
    minRestHours: 11,
    maxMonthlyGuards: 5,
    intervalle: {
      minJoursEntreGardes: 2,
      maxGardesMois: 5,
    },
    quotas: {
      global: {
        min: 1,
        max: 10,
      },
    },
  };

  describe('validateAssignments', () => {
    it('should return valid for non-conflicting assignments', () => {
      const attributions: Attribution[] = [
        {
          id: '1',
          userId: 1,
          date: new Date('2025-06-01'),
          type: 'GARDE' as AttributionType,
          status: 'CONFIRMED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          userId: 2,
          date: new Date('2025-06-01'),
          type: 'GARDE' as AttributionType,
          status: 'CONFIRMED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = validateAssignments(attributions, mockRules);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect schedule conflicts for same user same day', () => {
      const attributions: Attribution[] = [
        {
          id: '1',
          userId: 1,
          date: new Date('2025-06-01'),
          type: 'GARDE' as AttributionType,
          status: 'CONFIRMED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          userId: 1,
          date: new Date('2025-06-01'),
          type: 'VACATION' as AttributionType,
          status: 'CONFIRMED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = validateAssignments(attributions, mockRules);

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('CONFLICT_SCHEDULE');
    });

    it('should handle string dates correctly', () => {
      const attributions: Attribution[] = [
        {
          id: '1',
          userId: 1,
          date: '2025-06-01' as any,
          type: 'GARDE' as AttributionType,
          status: 'CONFIRMED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          userId: 1,
          date: '2025-06-01' as any,
          type: 'VACATION' as AttributionType,
          status: 'CONFIRMED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = validateAssignments(attributions, mockRules);

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
    });
  });


  describe('Complex validation scenarios', () => {
    it('should handle multiple violations', () => {
      const attributions: Attribution[] = [
        {
          id: '1',
          userId: 1,
          date: new Date('2025-06-01'),
          type: 'GARDE' as AttributionType,
          status: 'CONFIRMED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          userId: 1,
          date: new Date('2025-06-01'),
          type: 'VACATION' as AttributionType,
          status: 'CONFIRMED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          userId: 2,
          date: new Date('2025-06-01'),
          type: 'GARDE' as AttributionType,
          status: 'CONFIRMED',
          requiredSkills: ['SURGERY'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = validateAssignments(attributions, mockRules);

      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should validate empty assignments list', () => {
      const result = validateAssignments([], mockRules);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });
});