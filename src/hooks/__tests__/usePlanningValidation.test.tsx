import { renderHook, act } from '@testing-library/react';
import { usePlanningValidation } from '../usePlanningValidation';
import { ValidationService } from '@/services/ValidationService';
import { RuleConfigServiceV2 } from '@/services/RuleConfigServiceV2';

jest.mock('@/services/ValidationService');
jest.mock('@/services/RuleConfigServiceV2');

const mockValidationService = ValidationService as jest.Mocked<typeof ValidationService>;
const mockRuleService = RuleConfigServiceV2 as jest.Mocked<typeof RuleConfigServiceV2>;

describe('usePlanningValidation Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAssignment = {
    id: 1,
    userId: 1,
    date: new Date('2025-01-28'),
    roomId: 1,
    period: 'MORNING' as const,
    type: 'REGULAR' as const,
  };

  const mockRules = [
    {
      id: 1,
      name: 'Max consecutive days',
      type: 'MAX_CONSECUTIVE_DAYS',
      condition: { maxDays: 5 },
      severity: 'ERROR' as const,
      active: true,
    },
    {
      id: 2,
      name: 'Minimum rest period',
      type: 'MIN_REST_PERIOD',
      condition: { minHours: 11 },
      severity: 'WARNING' as const,
      active: true,
    },
  ];

  describe('validateAssignment', () => {
    it('devrait valider une affectation sans violations', async () => {
      mockValidationService.validateAssignment.mockResolvedValue({
        isValid: true,
        violations: [],
        warnings: [],
      });

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        const validation = await result.current.validateAssignment(mockAssignment);
        expect(validation.isValid).toBe(true);
        expect(validation.violations).toHaveLength(0);
      });

      expect(mockValidationService.validateAssignment).toHaveBeenCalledWith(mockAssignment);
    });

    it('devrait détecter des violations de règles', async () => {
      const violations = [
        {
          ruleId: 1,
          ruleName: 'Max consecutive days',
          severity: 'ERROR' as const,
          message: 'Maximum de 5 jours consécutifs dépassé',
          details: { currentDays: 6, maxDays: 5 },
        },
      ];

      mockValidationService.validateAssignment.mockResolvedValue({
        isValid: false,
        violations,
        warnings: [],
      });

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        const validation = await result.current.validateAssignment(mockAssignment);
        expect(validation.isValid).toBe(false);
        expect(validation.violations).toEqual(violations);
      });
    });

    it('devrait inclure les avertissements', async () => {
      const warnings = [
        {
          ruleId: 2,
          ruleName: 'Minimum rest period',
          severity: 'WARNING' as const,
          message: 'Période de repos insuffisante',
          details: { currentHours: 10, minHours: 11 },
        },
      ];

      mockValidationService.validateAssignment.mockResolvedValue({
        isValid: true,
        violations: [],
        warnings,
      });

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        const validation = await result.current.validateAssignment(mockAssignment);
        expect(validation.isValid).toBe(true);
        expect(validation.warnings).toEqual(warnings);
      });
    });
  });

  describe('validatePlanningPeriod', () => {
    it('devrait valider une période de planning complète', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      
      mockValidationService.validatePlanningPeriod.mockResolvedValue({
        isValid: true,
        totalViolations: 0,
        violationsByRule: {},
        criticalViolations: [],
      });

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        const validation = await result.current.validatePlanningPeriod(startDate, endDate);
        expect(validation.isValid).toBe(true);
        expect(validation.totalViolations).toBe(0);
      });

      expect(mockValidationService.validatePlanningPeriod).toHaveBeenCalledWith(startDate, endDate);
    });

    it('devrait rapporter les violations par règle', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      
      mockValidationService.validatePlanningPeriod.mockResolvedValue({
        isValid: false,
        totalViolations: 5,
        violationsByRule: {
          'Max consecutive days': 3,
          'Minimum rest period': 2,
        },
        criticalViolations: [
          {
            date: new Date('2025-01-15'),
            userId: 1,
            violation: {
              ruleId: 1,
              ruleName: 'Max consecutive days',
              severity: 'ERROR',
              message: 'Limite dépassée',
            },
          },
        ],
      });

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        const validation = await result.current.validatePlanningPeriod(startDate, endDate);
        expect(validation.isValid).toBe(false);
        expect(validation.totalViolations).toBe(5);
        expect(validation.violationsByRule['Max consecutive days']).toBe(3);
        expect(validation.criticalViolations).toHaveLength(1);
      });
    });
  });

  describe('getActiveRules', () => {
    it('devrait récupérer les règles actives', async () => {
      mockRuleService.getActiveRules.mockResolvedValue(mockRules);

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        await result.current.loadActiveRules();
      });

      expect(result.current.activeRules).toEqual(mockRules);
      expect(result.current.isLoadingRules).toBe(false);
    });

    it('devrait gérer les erreurs de chargement des règles', async () => {
      mockRuleService.getActiveRules.mockRejectedValue(new Error('Failed to load rules'));

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        await result.current.loadActiveRules();
      });

      expect(result.current.activeRules).toEqual([]);
      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoadingRules).toBe(false);
    });
  });

  describe('Real-time Validation', () => {
    it('devrait valider en temps réel pendant le drag & drop', async () => {
      mockValidationService.validateAssignment.mockResolvedValue({
        isValid: true,
        violations: [],
        warnings: [],
      });

      const { result } = renderHook(() => usePlanningValidation());

      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateDragDrop(
          mockAssignment.userId,
          mockAssignment.date,
          mockAssignment.roomId,
          mockAssignment.period
        );
      });

      expect(validationResult).toEqual({
        isValid: true,
        violations: [],
        warnings: [],
      });
    });

    it('devrait mettre en cache les validations répétées', async () => {
      mockValidationService.validateAssignment.mockResolvedValue({
        isValid: true,
        violations: [],
        warnings: [],
      });

      const { result } = renderHook(() => usePlanningValidation());

      // First validation
      await act(async () => {
        await result.current.validateAssignment(mockAssignment);
      });

      // Second validation with same data
      await act(async () => {
        await result.current.validateAssignment(mockAssignment);
      });

      // Should use cache for second call
      expect(mockValidationService.validateAssignment).toHaveBeenCalledTimes(1);
    });
  });

  describe('Batch Validation', () => {
    it('devrait valider plusieurs affectations en batch', async () => {
      const assignments = [
        mockAssignment,
        { ...mockAssignment, id: 2, date: new Date('2025-01-29') },
        { ...mockAssignment, id: 3, date: new Date('2025-01-30') },
      ];

      mockValidationService.validateBatch.mockResolvedValue({
        results: assignments.map(a => ({
          assignmentId: a.id,
          isValid: true,
          violations: [],
        })),
        summary: {
          total: 3,
          valid: 3,
          invalid: 0,
        },
      });

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        const validation = await result.current.validateBatch(assignments);
        expect(validation.summary.valid).toBe(3);
        expect(validation.summary.invalid).toBe(0);
      });
    });

    it('devrait identifier les affectations invalides dans un batch', async () => {
      const assignments = [
        mockAssignment,
        { ...mockAssignment, id: 2, date: new Date('2025-01-29') },
      ];

      mockValidationService.validateBatch.mockResolvedValue({
        results: [
          {
            assignmentId: 1,
            isValid: true,
            violations: [],
          },
          {
            assignmentId: 2,
            isValid: false,
            violations: [{
              ruleId: 1,
              ruleName: 'Max consecutive days',
              severity: 'ERROR',
              message: 'Limite dépassée',
            }],
          },
        ],
        summary: {
          total: 2,
          valid: 1,
          invalid: 1,
        },
      });

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        const validation = await result.current.validateBatch(assignments);
        expect(validation.summary.invalid).toBe(1);
        expect(validation.results[1].isValid).toBe(false);
      });
    });
  });

  describe('Rule Suggestions', () => {
    it('devrait suggérer des corrections pour les violations', async () => {
      const violation = {
        ruleId: 1,
        ruleName: 'Max consecutive days',
        severity: 'ERROR' as const,
        message: 'Maximum de 5 jours consécutifs dépassé',
      };

      mockValidationService.getSuggestions.mockResolvedValue([
        {
          type: 'SWAP_ASSIGNMENT',
          description: 'Échanger avec Dr. Martin le 29/01',
          targetUserId: 2,
          targetDate: new Date('2025-01-29'),
        },
        {
          type: 'REMOVE_ASSIGNMENT',
          description: 'Retirer l\'affectation du 28/01',
          targetDate: new Date('2025-01-28'),
        },
      ]);

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        const suggestions = await result.current.getSuggestions(violation, mockAssignment);
        expect(suggestions).toHaveLength(2);
        expect(suggestions[0].type).toBe('SWAP_ASSIGNMENT');
      });
    });
  });

  describe('Performance Metrics', () => {
    it('devrait mesurer le temps de validation', async () => {
      mockValidationService.validateAssignment.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          isValid: true,
          violations: [],
          warnings: [],
        };
      });

      const { result } = renderHook(() => usePlanningValidation());

      const start = Date.now();
      await act(async () => {
        await result.current.validateAssignment(mockAssignment);
      });
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(100);
      expect(result.current.lastValidationTime).toBeGreaterThanOrEqual(100);
    });

    it('devrait suivre les statistiques de validation', async () => {
      mockValidationService.validateAssignment
        .mockResolvedValueOnce({ isValid: true, violations: [], warnings: [] })
        .mockResolvedValueOnce({ isValid: false, violations: [{}], warnings: [] });

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        await result.current.validateAssignment(mockAssignment);
        await result.current.validateAssignment({ ...mockAssignment, id: 2 });
      });

      expect(result.current.validationStats).toEqual({
        total: 2,
        valid: 1,
        invalid: 1,
        averageTime: expect.any(Number),
      });
    });
  });

  describe('Error Handling', () => {
    it('devrait gérer les erreurs de validation gracieusement', async () => {
      mockValidationService.validateAssignment.mockRejectedValue(
        new Error('Validation service unavailable')
      );

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        const validation = await result.current.validateAssignment(mockAssignment);
        expect(validation.isValid).toBe(false);
        expect(validation.error).toBe('Validation service unavailable');
      });
    });

    it('devrait avoir un fallback pour les règles non disponibles', async () => {
      mockRuleService.getActiveRules.mockRejectedValue(new Error('Rules service down'));

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        await result.current.loadActiveRules();
      });

      // Should use default rules
      expect(result.current.activeRules).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'BASIC_VALIDATION' }),
      ]));
    });
  });
});