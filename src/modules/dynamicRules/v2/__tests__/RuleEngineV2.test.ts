import { RuleEngineV2 } from '../services/RuleEngineV2';
import { RuleV2, RuleEvaluationContext } from '../types/ruleV2.types';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    planningRule: {
      findMany: jest.fn(),
      update: jest.fn()
    }
  }
}));

jest.mock('@/lib/prisma');

describe('RuleEngineV2', () => {
  let ruleEngine: RuleEngineV2;

  beforeEach(() => {
    jest.clearAllMocks();
    
    ruleEngine = RuleEngineV2.getInstance();
    jest.clearAllMocks();
    ruleEngine.clearCache();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = RuleEngineV2.getInstance();
      const instance2 = RuleEngineV2.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('evaluateRules', () => {
    const mockRule: RuleV2 = {
      id: 'rule-1',
      name: 'Test Rule',
      description: 'Test description',
      type: 'PLANNING',
      priority: 10,
      enabled: true,
      status: 'active',
      version: 1,
      createdBy: 'user-1',
      updatedBy: 'user-1',
      effectiveDate: new Date('2024-01-01'),
      conditions: [
        {
          field: 'user.role',
          operator: 'EQUALS',
          value: 'IADE'
        }
      ],
      actions: [
        {
          type: 'PREVENT',
          target: 'assignment',
          message: 'Not allowed'
        }
      ]
    };

    const mockContext: RuleEvaluationContext = {
      userId: 'user-1',
      date: new Date(),
      metadata: {
        user: { role: 'IADE' }
      }
    };

    beforeEach(() => {
    jest.clearAllMocks();
      (prisma.planningRule.findMany as jest.Mock).mockResolvedValue([mockRule]);
    });

    it('should evaluate rules and return results', async () => {
      const results = await ruleEngine.evaluateRules(mockContext);

      expect(results).toHaveLength(1);
      expect(results[0].ruleId).toBe('rule-1');
      expect(results[0].passed).toBe(true);
      expect(results[0].actions).toHaveLength(1);
    });

    it('should handle rule evaluation failure', async () => {
      const contextWithWrongRole = {
        ...mockContext,
        metadata: { user: { role: 'MAR' } }
      };

      const results = await ruleEngine.evaluateRules(contextWithWrongRole);

      expect(results[0].passed).toBe(false);
      expect(results[0].violations).toContain('Rule Test Rule conditions not met');
    });

    it('should evaluate multiple conditions with AND logic', async () => {
      const ruleWithMultipleConditions = {
        ...mockRule,
        conditions: [
          { field: 'user.role', operator: 'EQUALS', value: 'IADE' },
          { field: 'date.isWeekend', operator: 'EQUALS', value: true }
        ]
      };

      (prisma.planningRule.findMany as jest.Mock).mockResolvedValue([ruleWithMultipleConditions]);

      const contextWeekend = {
        ...mockContext,
        metadata: {
          user: { role: 'IADE' },
          date: { isWeekend: true }
        }
      };

      const results = await ruleEngine.evaluateRules(contextWeekend);
      expect(results[0].passed).toBe(true);
    });

    it('should handle complex operators', async () => {
      const testCases = [
        {
          operator: 'GREATER_THAN',
          value: 5,
          contextValue: 10,
          expected: true
        },
        {
          operator: 'LESS_THAN',
          value: 5,
          contextValue: 3,
          expected: true
        },
        {
          operator: 'CONTAINS',
          value: 'test',
          contextValue: 'this is a test',
          expected: true
        },
        {
          operator: 'IN',
          value: ['A', 'B', 'C'],
          contextValue: 'B',
          expected: true
        },
        {
          operator: 'BETWEEN',
          value: [1, 10],
          contextValue: 5,
          expected: true
        },
        {
          operator: 'REGEX',
          value: '^test.*',
          contextValue: 'testing123',
          expected: true
        }
      ];

      for (const testCase of testCases) {
        const rule = {
          ...mockRule,
          conditions: [{
            field: 'testValue',
            operator: testCase.operator as any,
            value: testCase.value
          }]
        };

        (prisma.planningRule.findMany as jest.Mock).mockResolvedValue([rule]);

        const context = {
          ...mockContext,
          testValue: testCase.contextValue
        };

        const results = await ruleEngine.evaluateRules(context);
        expect(results[0].passed).toBe(testCase.expected);
      }
    });
  });

  describe('detectConflicts', () => {
    const rule1: RuleV2 = {
      id: 'rule-1',
      name: 'Rule 1',
      description: 'Test rule 1',
      type: 'PLANNING',
      priority: 10,
      enabled: true,
      status: 'active',
      version: 1,
      createdBy: 'user-1',
      updatedBy: 'user-1',
      effectiveDate: new Date(),
      conditions: [
        { field: 'user.role', operator: 'EQUALS', value: 'IADE' }
      ],
      actions: [
        { type: 'PREVENT', target: 'assignment' }
      ]
    };

    const rule2: RuleV2 = {
      id: 'rule-2',
      name: 'Rule 2',
      description: 'Test rule 2',
      type: 'PLANNING',
      priority: 15,
      enabled: true,
      status: 'active',
      version: 1,
      createdBy: 'user-1',
      updatedBy: 'user-1',
      effectiveDate: new Date(),
      conditions: [
        { field: 'user.role', operator: 'EQUALS', value: 'IADE' }
      ],
      actions: [
        { type: 'ALLOW', target: 'assignment' }
      ]
    };

    beforeEach(() => {
    jest.clearAllMocks();
      (prisma.planningRule.findMany as jest.Mock).mockResolvedValue([rule1, rule2]);
    });

    it('should detect condition overlaps', async () => {
      const conflicts = await ruleEngine.detectConflicts(rule1);

      expect(conflicts).toHaveLength(2); // condition overlap + action contradiction
      expect(conflicts[0].type).toBe('condition_overlap');
      expect(conflicts[0].ruleIds).toContain('rule-1');
      expect(conflicts[0].ruleIds).toContain('rule-2');
    });

    it('should detect action contradictions', async () => {
      const conflicts = await ruleEngine.detectConflicts(rule1);

      const actionConflict = conflicts.find(c => c.type === 'action_contradiction');
      expect(actionConflict).toBeDefined();
      expect(actionConflict?.severity).toBe('high');
    });

    it('should calculate conflict severity correctly', async () => {
      const criticalRule = { ...rule1, priority: 20 };
      const conflicts = await ruleEngine.detectConflicts(criticalRule);

      const conflict = conflicts.find(c => c.type === 'condition_overlap');
      expect(conflict?.severity).toBe('critical');
    });
  });

  describe('cache management', () => {
    const mockRule: RuleV2 = {
      id: 'rule-1',
      name: 'Cached Rule',
      description: 'Test caching',
      type: 'PLANNING',
      priority: 10,
      enabled: true,
      status: 'active',
      version: 1,
      createdBy: 'user-1',
      updatedBy: 'user-1',
      effectiveDate: new Date(),
      conditions: [],
      actions: []
    };

    it('should cache active rules', async () => {
      (prisma.planningRule.findMany as jest.Mock).mockResolvedValue([mockRule]);

      // First call - should hit database
      await ruleEngine.evaluateRules({ userId: 'test', date: new Date() });
      expect(prisma.planningRule.findMany).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await ruleEngine.evaluateRules({ userId: 'test', date: new Date() });
      expect(prisma.planningRule.findMany).toHaveBeenCalledTimes(1);
    });

    it('should clear cache on demand', async () => {
      (prisma.planningRule.findMany as jest.Mock).mockResolvedValue([mockRule]);

      await ruleEngine.evaluateRules({ userId: 'test', date: new Date() });
      ruleEngine.clearCache();
      await ruleEngine.evaluateRules({ userId: 'test', date: new Date() });

      expect(prisma.planningRule.findMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('performance', () => {
    it('should handle batch evaluation efficiently', async () => {
      const rules = Array.from({ length: 20 }, (_, i) => ({
        id: `rule-${i}`,
        name: `Rule ${i}`,
        description: 'Test',
        type: 'PLANNING',
        priority: i,
        enabled: true,
        status: 'active',
        version: 1,
        createdBy: 'user-1',
        updatedBy: 'user-1',
        effectiveDate: new Date(),
        conditions: [
          { field: 'value', operator: 'EQUALS', value: i }
        ],
        actions: [
          { type: 'LOG', message: `Rule ${i} triggered` }
        ]
      }));

      (prisma.planningRule.findMany as jest.Mock).mockResolvedValue(rules);

      const startTime = Date.now();
      const results = await ruleEngine.evaluateRules({
        userId: 'test',
        date: new Date(),
        value: 5
      });
      const endTime = Date.now();

      expect(results).toHaveLength(20);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});