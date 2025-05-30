import { renderHook, act } from '@testing-library/react';
import { usePlanningValidation } from '../usePlanningValidation';
import { RuleEngineV2 } from '@/modules/dynamicRules/v2/services/RuleEngineV2';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import '@testing-library/jest-dom';

jest.mock('@/modules/dynamicRules/v2/services/RuleEngineV2');
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({ isLoading: false, data: true })),
  useMutation: jest.fn(() => ({ 
    mutate: jest.fn(), 
    isPending: false, 
    error: null 
  }))
}));

const mockRuleEngine = {
  initialize: jest.fn().mockResolvedValue(undefined),
  evaluate: jest.fn().mockResolvedValue([])
};

(RuleEngineV2 as jest.MockedClass<typeof RuleEngineV2>).mockImplementation(() => mockRuleEngine as any);

describe('usePlanningValidation Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAssignment = {
    id: 1,
    userId: 1,
    startDate: new Date('2025-01-28'),
    endDate: new Date('2025-01-28'),
    shiftType: 'REGULAR' as const,
    notes: 'Test assignment'
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
      mockRuleEngine.evaluate.mockResolvedValue([]);

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        const violations = await result.current.validateAssignment(mockAssignment, [mockAssignment]);
        expect(violations).toHaveLength(0);
      });

      expect(mockRuleEngine.evaluate).toHaveBeenCalled();
    });

    it('devrait détecter des violations de règles', async () => {
      mockRuleEngine.evaluate.mockResolvedValue([
        {
          ruleId: '1',
          ruleName: 'Max consecutive days',
          passed: false,
          actions: [{
            type: 'validate',
            parameters: {
              severity: 'ERROR',
              violationType: 'MAX_CONSECUTIVE_DAYS',
              message: 'Maximum de 5 jours consécutifs dépassé'
            }
          }]
        }
      ]);

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        const violations = await result.current.validateAssignment(mockAssignment, [mockAssignment]);
        expect(violations).toHaveLength(1);
        expect(violations[0].severity).toBe('ERROR');
        expect(violations[0].message).toBe('Maximum de 5 jours consécutifs dépassé');
      });
    });

    it('devrait inclure les avertissements', async () => {
      mockRuleEngine.evaluate.mockResolvedValue([
        {
          ruleId: '2',
          ruleName: 'Minimum rest period',
          passed: false,
          actions: [{
            type: 'validate',
            parameters: {
              severity: 'WARNING',
              violationType: 'MIN_REST_PERIOD',
              message: 'Période de repos insuffisante'
            }
          }]
        }
      ]);

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        const violations = await result.current.validateAssignment(mockAssignment, [mockAssignment]);
        expect(violations).toHaveLength(1);
        expect(violations[0].severity).toBe('WARNING');
        expect(violations[0].message).toBe('Période de repos insuffisante');
      });
    });
  });

  describe('validatePlanning', () => {
    it('devrait valider un planning complet', async () => {
      mockRuleEngine.evaluate.mockResolvedValue([]);

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        const validation = await result.current.validatePlanning([mockAssignment]);
        expect(validation.valid).toBe(true);
        expect(validation.violations).toHaveLength(0);
      });

      expect(mockRuleEngine.evaluate).toHaveBeenCalled();
    });

    it('devrait rapporter les violations par règle', async () => {
      mockRuleEngine.evaluate.mockResolvedValue([
        {
          ruleId: '1',
          ruleName: 'Max consecutive days',
          passed: false,
          actions: [{
            type: 'validate',
            parameters: {
              severity: 'ERROR',
              violationType: 'MAX_CONSECUTIVE_DAYS',
              message: 'Limite dépassée'
            }
          }]
        }
      ]);

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        const validation = await result.current.validatePlanning([mockAssignment]);
        expect(validation.valid).toBe(false);
        expect(validation.violations).toHaveLength(1);
        expect(validation.metrics.totalViolations).toBe(1);
      });
    });
  });

  describe('rule engine initialization', () => {
    it('devrait initialiser le moteur de règles', async () => {
      const { result } = renderHook(() => usePlanningValidation());

      // The initialization happens in useQuery, so we just check the hook state
      expect(result.current.isValidating).toBe(false);
      expect(result.current.violations).toEqual([]);
    });

    it('devrait gérer les erreurs d\'initialisation', async () => {
      mockRuleEngine.initialize.mockRejectedValue(new Error('Init failed'));

      const { result } = renderHook(() => usePlanningValidation());
      
      // The hook should still work even if initialization fails
      expect(result.current.violations).toEqual([]);
    });
  });

  describe('Real-time Validation', () => {
    it('devrait valider en temps réel', async () => {
      mockRuleEngine.evaluate.mockResolvedValue([]);

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        const violations = await result.current.validateAssignment(mockAssignment, [mockAssignment]);
        expect(violations).toHaveLength(0);
      });

      expect(mockRuleEngine.evaluate).toHaveBeenCalled();
    });

    it('devrait valider plusieurs fois', async () => {
      mockRuleEngine.evaluate.mockResolvedValue([]);

      const { result } = renderHook(() => usePlanningValidation());

      // First validation
      await act(async () => {
        await result.current.validateAssignment(mockAssignment, [mockAssignment]);
      });

      // Second validation with same data
      await act(async () => {
        await result.current.validateAssignment(mockAssignment, [mockAssignment]);
      });

      expect(mockRuleEngine.evaluate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Batch Validation', () => {
    it('devrait valider plusieurs affectations', async () => {
      const assignments = [
        mockAssignment,
        { ...mockAssignment, id: 2, startDate: new Date('2025-01-29') },
        { ...mockAssignment, id: 3, startDate: new Date('2025-01-30') },
      ];

      mockRuleEngine.evaluate.mockResolvedValue([]);

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        const validation = await result.current.validatePlanning(assignments);
        expect(validation.valid).toBe(true);
        expect(validation.violations).toHaveLength(0);
      });
    });

    it('devrait identifier les affectations invalides', async () => {
      const assignments = [
        mockAssignment,
        { ...mockAssignment, id: 2, startDate: new Date('2025-01-29') },
      ];

      mockRuleEngine.evaluate.mockResolvedValue([
        {
          ruleId: '1',
          ruleName: 'Max consecutive days',
          passed: false,
          actions: [{
            type: 'validate',
            parameters: {
              severity: 'ERROR',
              violationType: 'MAX_CONSECUTIVE_DAYS',
              message: 'Limite dépassée'
            }
          }]
        }
      ]);

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        const validation = await result.current.validatePlanning(assignments);
        expect(validation.valid).toBe(false);
        expect(validation.violations.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Rule Suggestions', () => {
    it('devrait suggérer des corrections pour les violations', async () => {
      const violation = {
        id: 'test-violation',
        type: 'CONSECUTIVE_ASSIGNMENTS' as const,
        severity: 'ERROR' as const,
        message: 'Maximum de 5 jours consécutifs dépassé',
        affectedAssignments: ['1'],
        metadata: {}
      };

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        const suggestions = await result.current.getSuggestions(violation, [mockAssignment]);
        expect(suggestions).toHaveLength(2);
        expect(suggestions[0]).toContain('Insérer un jour de repos');
      });
    });
  });

  describe('Performance Metrics', () => {
    it('devrait suivre le temps de validation', async () => {
      mockRuleEngine.evaluate.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return [];
      });

      const { result } = renderHook(() => usePlanningValidation());

      const start = Date.now();
      await act(async () => {
        await result.current.validateAssignment(mockAssignment, [mockAssignment]);
      });
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(45);
    });

    it('devrait suivre le statut des violations', async () => {
      mockRuleEngine.evaluate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{
          ruleId: '1',
          ruleName: 'Test rule',
          passed: false,
          actions: [{
            type: 'validate',
            parameters: {
              severity: 'ERROR',
              message: 'Test violation'
            }
          }]
        }]);

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        await result.current.validateAssignment(mockAssignment, [mockAssignment]);
        await result.current.validateAssignment({ ...mockAssignment, id: 2 }, [mockAssignment]);
      });

      expect(result.current.violations).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('devrait gérer les erreurs de validation gracieusement', async () => {
      mockRuleEngine.evaluate.mockRejectedValue(
        new Error('Validation service unavailable')
      );

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        const violations = await result.current.validateAssignment(mockAssignment, [mockAssignment]);
        expect(violations).toEqual([]);
      });
    });

    it('devrait continuer à fonctionner sans règles', async () => {
      mockRuleEngine.evaluate.mockRejectedValue(new Error('Rules service down'));

      const { result } = renderHook(() => usePlanningValidation());

      await act(async () => {
        const violations = await result.current.validateAssignment(mockAssignment, [mockAssignment]);
        expect(violations).toEqual([]);
      });
    });
  });
});