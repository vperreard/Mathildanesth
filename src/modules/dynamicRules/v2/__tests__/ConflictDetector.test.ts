import { ConflictDetector } from '../services/ConflictDetector';
import { RuleV2 } from '../types/ruleV2.types';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    planningRule: {
      findMany: jest.fn(),
      findUnique: jest.fn()
    },
    activityLog: {
      create: jest.fn()
    }
  }
}));

jest.mock('@/lib/prisma');

describe('ConflictDetector', () => {
  let detector: ConflictDetector;

  beforeEach(() => {
    jest.clearAllMocks();
    
    detector = ConflictDetector.getInstance();
    jest.clearAllMocks();
  });

  describe('detectConflicts', () => {
    const baseRule: RuleV2 = {
      id: 'rule-1',
      name: 'Base Rule',
      description: 'Test rule',
      type: 'PLANNING',
      priority: 10,
      enabled: true,
      status: 'active',
      version: 1,
      createdBy: 'user-1',
      updatedBy: 'user-1',
      effectiveDate: new Date('2024-01-01'),
      conditions: [
        { field: 'user.role', operator: 'EQUALS', value: 'IADE' },
        { field: 'planning.guardCount', operator: 'GREATER_THAN', value: 2 }
      ],
      actions: [
        { type: 'PREVENT', target: 'attribution', message: 'Limit reached' }
      ]
    };

    describe('condition overlaps', () => {
      it('should detect direct contradictions', async () => {
        const conflictingRule: RuleV2 = {
          ...baseRule,
          id: 'rule-2',
          name: 'Conflicting Rule',
          conditions: [
            { field: 'user.role', operator: 'EQUALS', value: 'MAR' },
            { field: 'planning.guardCount', operator: 'LESS_THAN', value: 5 }
          ]
        };

        (prisma.planningRule.findMany as jest.Mock).mockResolvedValue([conflictingRule]);

        const conflicts = await detector.detectConflicts(baseRule);
        
        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].type).toBe('condition_overlap');
        expect(conflicts[0].severity).toBe('medium');
      });

      it('should detect range overlaps', async () => {
        const rule1: RuleV2 = {
          ...baseRule,
          conditions: [
            { field: 'hours', operator: 'BETWEEN', value: [10, 20] }
          ]
        };

        const rule2: RuleV2 = {
          ...baseRule,
          id: 'rule-2',
          conditions: [
            { field: 'hours', operator: 'BETWEEN', value: [15, 25] }
          ]
        };

        (prisma.planningRule.findMany as jest.Mock).mockResolvedValue([rule2]);

        const conflicts = await detector.detectConflicts(rule1);
        
        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].description).toContain('plages de valeurs qui se chevauchent');
      });

      it('should detect inclusion conflicts', async () => {
        const rule1: RuleV2 = {
          ...baseRule,
          conditions: [
            { field: 'sector', operator: 'IN', value: ['A', 'B', 'C'] }
          ]
        };

        const rule2: RuleV2 = {
          ...baseRule,
          id: 'rule-2',
          conditions: [
            { field: 'sector', operator: 'NOT_IN', value: ['B', 'D'] }
          ]
        };

        (prisma.planningRule.findMany as jest.Mock).mockResolvedValue([rule2]);

        const conflicts = await detector.detectConflicts(rule1);
        
        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].description).toContain('conflits d\'inclusion/exclusion');
      });
    });

    describe('action contradictions', () => {
      it('should detect opposite actions on same target', async () => {
        const rule1: RuleV2 = {
          ...baseRule,
          actions: [
            { type: 'ALLOW', target: 'leave' }
          ]
        };

        const rule2: RuleV2 = {
          ...baseRule,
          id: 'rule-2',
          actions: [
            { type: 'PREVENT', target: 'leave' }
          ]
        };

        (prisma.planningRule.findMany as jest.Mock).mockResolvedValue([rule2]);

        const conflicts = await detector.detectConflicts(rule1);
        
        const actionConflict = conflicts.find(c => c.type === 'action_contradiction');
        expect(actionConflict).toBeDefined();
        expect(actionConflict?.description).toContain('Actions opposées sur leave');
      });

      it('should detect conflicting modifications', async () => {
        const rule1: RuleV2 = {
          ...baseRule,
          actions: [
            { type: 'MODIFY', target: 'quota', value: 10 }
          ]
        };

        const rule2: RuleV2 = {
          ...baseRule,
          id: 'rule-2',
          actions: [
            { type: 'MODIFY', target: 'quota', value: 20 }
          ]
        };

        (prisma.planningRule.findMany as jest.Mock).mockResolvedValue([rule2]);

        const conflicts = await detector.detectConflicts(rule1);
        
        const actionConflict = conflicts.find(c => c.type === 'action_contradiction');
        expect(actionConflict?.description).toContain('Modifications conflictuelles');
      });
    });

    describe('resource conflicts', () => {
      it('should detect resource competition', async () => {
        const rule1: RuleV2 = {
          ...baseRule,
          conditions: [
            { field: 'user.id', operator: 'EQUALS', value: 'user-1' }
          ],
          actions: [
            { type: 'MODIFY', target: 'attribution.room', value: 'A' }
          ]
        };

        const rule2: RuleV2 = {
          ...baseRule,
          id: 'rule-2',
          conditions: [
            { field: 'user.id', operator: 'EQUALS', value: 'user-1' }
          ],
          actions: [
            { type: 'MODIFY', target: 'attribution.room', value: 'B' }
          ]
        };

        (prisma.planningRule.findMany as jest.Mock).mockResolvedValue([rule2]);

        const conflicts = await detector.detectConflicts(rule1);
        
        const resourceConflict = conflicts.find(c => c.type === 'resource_conflict');
        expect(resourceConflict).toBeDefined();
      });
    });

    describe('timing conflicts', () => {
      it('should detect overlapping effective periods', async () => {
        const rule1: RuleV2 = {
          ...baseRule,
          effectiveDate: new Date('2024-01-01'),
          expirationDate: new Date('2024-12-31'),
          conditions: [
            { field: 'date.dayOfWeek', operator: 'EQUALS', value: 1 }
          ]
        };

        const rule2: RuleV2 = {
          ...baseRule,
          id: 'rule-2',
          effectiveDate: new Date('2024-06-01'),
          expirationDate: new Date('2025-05-31'),
          conditions: [
            { field: 'date.dayOfWeek', operator: 'EQUALS', value: 1 }
          ]
        };

        (prisma.planningRule.findMany as jest.Mock).mockResolvedValue([rule2]);

        const conflicts = await detector.detectConflicts(rule1);
        
        const timingConflict = conflicts.find(c => c.type === 'timing_conflict');
        expect(timingConflict).toBeDefined();
      });
    });
  });

  describe('resolveConflict', () => {
    const conflict = {
      id: 'conflict-1',
      ruleIds: ['rule-1', 'rule-2'],
      type: 'condition_overlap' as const,
      severity: 'high' as const,
      description: 'Test conflict',
      detectedAt: new Date()
    };

    const rule1: RuleV2 = {
      id: 'rule-1',
      name: 'Rule 1',
      description: 'Test',
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

    const rule2: RuleV2 = {
      ...rule1,
      id: 'rule-2',
      name: 'Rule 2',
      priority: 20
    };

    beforeEach(() => {
    jest.clearAllMocks();
      (prisma.planningRule.findMany as jest.Mock).mockResolvedValue([rule1, rule2]);
    });

    it('should resolve by priority', async () => {
      const resolution = await detector.resolveConflict(conflict, 'priority');
      
      expect(resolution.strategy).toBe('priority');
      expect(resolution.resolvedRules).toHaveLength(2);
      expect(resolution.resolvedRules[0].priority).toBe(20); // Higher priority first
    });

    it('should resolve by merge', async () => {
      const resolution = await detector.resolveConflict(conflict, 'merge');
      
      expect(resolution.strategy).toBe('merge');
      expect(resolution.resolvedRules).toHaveLength(1);
      expect(resolution.resolvedRules[0].name).toContain('Rule 1 + Rule 2');
    });

    it('should resolve by override', async () => {
      const resolution = await detector.resolveConflict(conflict, 'override');
      
      expect(resolution.strategy).toBe('override');
      expect(resolution.resolvedRules).toHaveLength(1);
      expect(resolution.resolvedRules[0].priority).toBe(20); // Keeps highest priority
    });

    it('should handle manual resolution', async () => {
      const manualResolution = [{ ...rule1, priority: 30 }];
      const resolution = await detector.resolveConflict(conflict, 'manual', manualResolution);
      
      expect(resolution.strategy).toBe('manual');
      expect(resolution.resolvedRules[0].priority).toBe(30);
    });
  });

  describe('severity calculation', () => {
    it('should calculate critical severity for high-priority contradictions', async () => {
      const rule1: RuleV2 = {
        id: 'rule-1',
        name: 'Critical Rule 1',
        description: 'Test',
        type: 'PLANNING',
        priority: 20,
        enabled: true,
        status: 'active',
        version: 1,
        createdBy: 'user-1',
        updatedBy: 'user-1',
        effectiveDate: new Date(),
        conditions: [
          { field: 'status', operator: 'EQUALS', value: 'active' }
        ],
        actions: []
      };

      const rule2: RuleV2 = {
        ...rule1,
        id: 'rule-2',
        name: 'Critical Rule 2',
        conditions: [
          { field: 'status', operator: 'EQUALS', value: 'inactive' }
        ]
      };

      (prisma.planningRule.findMany as jest.Mock).mockResolvedValue([rule2]);

      const conflicts = await detector.detectConflicts(rule1);
      const conflict = conflicts.find(c => c.type === 'condition_overlap');
      
      expect(conflict?.severity).toBe('critical');
    });
  });
});