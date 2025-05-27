import { RuleV2, RuleConflict, ConflictResolution } from '../types/ruleV2.types';
import { RuleCondition, RuleAction } from '../../types/rule';
import { prisma } from '@/lib/prisma';

export class ConflictDetector {
  private static instance: ConflictDetector;

  private constructor() {}

  static getInstance(): ConflictDetector {
    if (!ConflictDetector.instance) {
      ConflictDetector.instance = new ConflictDetector();
    }
    return ConflictDetector.instance;
  }

  async detectConflicts(rule: RuleV2, existingRules?: RuleV2[]): Promise<RuleConflict[]> {
    const conflicts: RuleConflict[] = [];
    const rules = existingRules || await this.getActiveRules(rule.id);

    for (const existingRule of rules) {
      if (existingRule.id === rule.id) continue;

      // 1. Check condition overlaps
      const conditionConflict = this.analyzeConditionOverlap(rule, existingRule);
      if (conditionConflict) {
        conflicts.push(conditionConflict);
      }

      // 2. Check action contradictions
      const actionConflict = this.analyzeActionContradiction(rule, existingRule);
      if (actionConflict) {
        conflicts.push(actionConflict);
      }

      // 3. Check resource conflicts
      const resourceConflict = this.analyzeResourceConflict(rule, existingRule);
      if (resourceConflict) {
        conflicts.push(resourceConflict);
      }

      // 4. Check timing conflicts
      const timingConflict = this.analyzeTimingConflict(rule, existingRule);
      if (timingConflict) {
        conflicts.push(timingConflict);
      }
    }

    return conflicts;
  }

  private analyzeConditionOverlap(rule1: RuleV2, rule2: RuleV2): RuleConflict | null {
    const conditions1 = rule1.conditions || [];
    const conditions2 = rule2.conditions || [];

    // Find overlapping conditions
    const overlaps = this.findConditionOverlaps(conditions1, conditions2);
    
    if (overlaps.length === 0) return null;

    // Calculate severity based on overlap extent and rule priorities
    const severity = this.calculateOverlapSeverity(overlaps, rule1, rule2);

    return {
      id: `overlap-${rule1.id}-${rule2.id}`,
      ruleIds: [rule1.id, rule2.id],
      type: 'condition_overlap',
      severity,
      description: this.generateOverlapDescription(overlaps, rule1, rule2),
      detectedAt: new Date()
    };
  }

  private findConditionOverlaps(
    conditions1: RuleCondition[],
    conditions2: RuleCondition[]
  ): Array<{ field: string; overlap: string }> {
    const overlaps: Array<{ field: string; overlap: string }> = [];

    for (const c1 of conditions1) {
      for (const c2 of conditions2) {
        if (c1.field === c2.field) {
          const overlap = this.checkValueOverlap(c1, c2);
          if (overlap) {
            overlaps.push({ field: c1.field, overlap });
          }
        }
      }
    }

    return overlaps;
  }

  private checkValueOverlap(c1: RuleCondition, c2: RuleCondition): string | null {
    // Check for direct contradictions
    if (c1.operator === 'EQUALS' && c2.operator === 'EQUALS' && c1.value !== c2.value) {
      return 'contradiction';
    }

    // Check for range overlaps
    if (c1.operator === 'BETWEEN' && c2.operator === 'BETWEEN') {
      const [min1, max1] = c1.value as [number, number];
      const [min2, max2] = c2.value as [number, number];
      if (max1 >= min2 && max2 >= min1) {
        return 'range_overlap';
      }
    }

    // Check for inclusion conflicts
    if (c1.operator === 'IN' && c2.operator === 'NOT_IN') {
      const values1 = c1.value as any[];
      const values2 = c2.value as any[];
      const intersection = values1.filter(v => values2.includes(v));
      if (intersection.length > 0) {
        return 'inclusion_conflict';
      }
    }

    return null;
  }

  private calculateOverlapSeverity(
    overlaps: Array<{ field: string; overlap: string }>,
    rule1: RuleV2,
    rule2: RuleV2
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical if both rules are high priority and have contradictions
    if (
      rule1.priority >= 10 && 
      rule2.priority >= 10 && 
      overlaps.some(o => o.overlap === 'contradiction')
    ) {
      return 'critical';
    }

    // High if multiple overlaps or contradiction exists
    if (overlaps.length > 2 || overlaps.some(o => o.overlap === 'contradiction')) {
      return 'high';
    }

    // Medium for range overlaps
    if (overlaps.some(o => o.overlap === 'range_overlap')) {
      return 'medium';
    }

    return 'low';
  }

  private generateOverlapDescription(
    overlaps: Array<{ field: string; overlap: string }>,
    rule1: RuleV2,
    rule2: RuleV2
  ): string {
    const overlapTypes = {
      contradiction: 'conditions contradictoires',
      range_overlap: 'plages de valeurs qui se chevauchent',
      inclusion_conflict: 'conflits d\'inclusion/exclusion'
    };

    const fields = [...new Set(overlaps.map(o => o.field))];
    const types = [...new Set(overlaps.map(o => overlapTypes[o.overlap] || o.overlap))];

    return `Les règles "${rule1.name}" et "${rule2.name}" ont des ${types.join(', ')} ` +
           `sur les champs: ${fields.join(', ')}`;
  }

  private analyzeActionContradiction(rule1: RuleV2, rule2: RuleV2): RuleConflict | null {
    const actions1 = rule1.actions || [];
    const actions2 = rule2.actions || [];

    const contradictions: string[] = [];

    for (const a1 of actions1) {
      for (const a2 of actions2) {
        if (a1.target === a2.target) {
          // Check for opposite actions
          if (
            (a1.type === 'ALLOW' && a2.type === 'PREVENT') ||
            (a1.type === 'PREVENT' && a2.type === 'ALLOW')
          ) {
            contradictions.push(`Actions opposées sur ${a1.target}`);
          }

          // Check for conflicting modifications
          if (a1.type === 'MODIFY' && a2.type === 'MODIFY' && a1.value !== a2.value) {
            contradictions.push(`Modifications conflictuelles sur ${a1.target}`);
          }
        }
      }
    }

    if (contradictions.length === 0) return null;

    return {
      id: `action-${rule1.id}-${rule2.id}`,
      ruleIds: [rule1.id, rule2.id],
      type: 'action_contradiction',
      severity: contradictions.length > 1 ? 'high' : 'medium',
      description: `Contradictions d'actions: ${contradictions.join(', ')}`,
      detectedAt: new Date()
    };
  }

  private analyzeResourceConflict(rule1: RuleV2, rule2: RuleV2): RuleConflict | null {
    // Check if rules compete for same resources (e.g., same users, same time slots)
    const resources1 = this.extractResourceTargets(rule1);
    const resources2 = this.extractResourceTargets(rule2);

    const commonResources = resources1.filter(r => resources2.includes(r));
    
    if (commonResources.length === 0) return null;

    // Check if actions on common resources conflict
    const hasConflict = this.checkResourceActionConflict(
      rule1.actions || [],
      rule2.actions || [],
      commonResources
    );

    if (!hasConflict) return null;

    return {
      id: `resource-${rule1.id}-${rule2.id}`,
      ruleIds: [rule1.id, rule2.id],
      type: 'resource_conflict',
      severity: 'medium',
      description: `Les règles tentent de contrôler les mêmes ressources: ${commonResources.join(', ')}`,
      detectedAt: new Date()
    };
  }

  private extractResourceTargets(rule: RuleV2): string[] {
    const resources: string[] = [];

    // Extract from conditions
    rule.conditions?.forEach(c => {
      if (c.field.includes('user.') || c.field.includes('assignment.')) {
        resources.push(c.field);
      }
    });

    // Extract from actions
    rule.actions?.forEach(a => {
      if (a.target) {
        resources.push(a.target);
      }
    });

    return [...new Set(resources)];
  }

  private checkResourceActionConflict(
    actions1: RuleAction[],
    actions2: RuleAction[],
    resources: string[]
  ): boolean {
    for (const resource of resources) {
      const resourceActions1 = actions1.filter(a => a.target === resource);
      const resourceActions2 = actions2.filter(a => a.target === resource);

      if (resourceActions1.length > 0 && resourceActions2.length > 0) {
        // Check if actions conflict
        for (const a1 of resourceActions1) {
          for (const a2 of resourceActions2) {
            if (this.areActionsConflicting(a1, a2)) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  private areActionsConflicting(a1: RuleAction, a2: RuleAction): boolean {
    // Opposite allow/prevent
    if (
      (a1.type === 'ALLOW' && a2.type === 'PREVENT') ||
      (a1.type === 'PREVENT' && a2.type === 'ALLOW')
    ) {
      return true;
    }

    // Different modifications
    if (a1.type === 'MODIFY' && a2.type === 'MODIFY' && a1.value !== a2.value) {
      return true;
    }

    return false;
  }

  private analyzeTimingConflict(rule1: RuleV2, rule2: RuleV2): RuleConflict | null {
    // Check if rules have overlapping effective periods
    const overlap = this.checkDateOverlap(
      rule1.effectiveDate,
      rule1.expirationDate,
      rule2.effectiveDate,
      rule2.expirationDate
    );

    if (!overlap) return null;

    // Check if they apply to same time-based conditions
    const timeConditions1 = rule1.conditions?.filter(c => 
      c.field.includes('date') || c.field.includes('time')
    ) || [];
    const timeConditions2 = rule2.conditions?.filter(c => 
      c.field.includes('date') || c.field.includes('time')
    ) || [];

    if (timeConditions1.length === 0 || timeConditions2.length === 0) return null;

    // Check for conflicts in time conditions
    const hasTimeConflict = this.checkTimeConditionConflict(timeConditions1, timeConditions2);

    if (!hasTimeConflict) return null;

    return {
      id: `timing-${rule1.id}-${rule2.id}`,
      ruleIds: [rule1.id, rule2.id],
      type: 'timing_conflict',
      severity: 'medium',
      description: 'Les règles ont des périodes d\'application qui se chevauchent avec des conditions temporelles conflictuelles',
      detectedAt: new Date()
    };
  }

  private checkDateOverlap(
    start1: Date,
    end1?: Date,
    start2: Date,
    end2?: Date
  ): boolean {
    const effectiveEnd1 = end1 || new Date('2100-01-01');
    const effectiveEnd2 = end2 || new Date('2100-01-01');

    return start1 <= effectiveEnd2 && effectiveEnd1 >= start2;
  }

  private checkTimeConditionConflict(
    conditions1: RuleCondition[],
    conditions2: RuleCondition[]
  ): boolean {
    // Simplified check - in reality, this would be more complex
    for (const c1 of conditions1) {
      for (const c2 of conditions2) {
        if (c1.field === c2.field) {
          const overlap = this.checkValueOverlap(c1, c2);
          if (overlap === 'contradiction') {
            return true;
          }
        }
      }
    }

    return false;
  }

  async resolveConflict(
    conflict: RuleConflict,
    strategy: 'priority' | 'merge' | 'override' | 'manual',
    manualResolution?: Partial<RuleV2>[]
  ): Promise<ConflictResolution> {
    let resolvedRules: RuleV2[] = [];

    switch (strategy) {
      case 'priority':
        resolvedRules = await this.resolvePriorityBased(conflict);
        break;
      case 'merge':
        resolvedRules = await this.resolveMerge(conflict);
        break;
      case 'override':
        resolvedRules = await this.resolveOverride(conflict);
        break;
      case 'manual':
        if (!manualResolution) {
          throw new Error('Manual resolution requires resolved rules');
        }
        resolvedRules = manualResolution as RuleV2[];
        break;
    }

    const resolution: ConflictResolution = {
      id: `resolution-${conflict.id}`,
      conflictId: conflict.id,
      strategy,
      resolvedRules,
      resolvedAt: new Date(),
      notes: `Conflict resolved using ${strategy} strategy`
    };

    // Save resolution to database
    await this.saveResolution(resolution);

    return resolution;
  }

  private async resolvePriorityBased(conflict: RuleConflict): Promise<RuleV2[]> {
    const rules = await this.getRulesById(conflict.ruleIds);
    
    // Sort by priority (highest first)
    rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Adjust lower priority rule to avoid conflict
    if (rules.length >= 2) {
      const higherPriorityRule = rules[0];
      const lowerPriorityRule = { ...rules[1] };

      // Add exception for higher priority rule
      lowerPriorityRule.exceptions = [
        ...(lowerPriorityRule.exceptions || []),
        higherPriorityRule
      ];

      return [higherPriorityRule, lowerPriorityRule];
    }

    return rules;
  }

  private async resolveMerge(conflict: RuleConflict): Promise<RuleV2[]> {
    const rules = await this.getRulesById(conflict.ruleIds);
    
    if (rules.length < 2) return rules;

    // Create merged rule
    const mergedRule: RuleV2 = {
      ...rules[0],
      id: `merged-${rules[0].id}-${rules[1].id}`,
      name: `${rules[0].name} + ${rules[1].name}`,
      description: `Merged rule from conflict resolution`,
      conditions: [...(rules[0].conditions || []), ...(rules[1].conditions || [])],
      actions: this.mergeActions(rules[0].actions || [], rules[1].actions || []),
      priority: Math.max(rules[0].priority || 0, rules[1].priority || 0)
    };

    return [mergedRule];
  }

  private mergeActions(actions1: RuleAction[], actions2: RuleAction[]): RuleAction[] {
    const merged: RuleAction[] = [...actions1];

    for (const action2 of actions2) {
      const existing = merged.find(a => 
        a.type === action2.type && a.target === action2.target
      );

      if (!existing) {
        merged.push(action2);
      } else if (action2.type === 'MODIFY') {
        // For modifications, keep the one with higher value or combine
        existing.value = this.combineValues(existing.value, action2.value);
      }
    }

    return merged;
  }

  private combineValues(value1: any, value2: any): any {
    if (typeof value1 === 'number' && typeof value2 === 'number') {
      return Math.max(value1, value2);
    }
    if (Array.isArray(value1) && Array.isArray(value2)) {
      return [...new Set([...value1, ...value2])];
    }
    return value2; // Default to second value
  }

  private async resolveOverride(conflict: RuleConflict): Promise<RuleV2[]> {
    const rules = await this.getRulesById(conflict.ruleIds);
    
    // Keep only the highest priority rule
    const highestPriorityRule = rules.reduce((prev, curr) => 
      (curr.priority || 0) > (prev.priority || 0) ? curr : prev
    );

    return [highestPriorityRule];
  }

  private async getActiveRules(excludeId?: string): Promise<RuleV2[]> {
    const where: any = {
      status: 'active',
      effectiveDate: { lte: new Date() }
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const rules = await prisma.planningRule.findMany({ where });
    return rules as any as RuleV2[];
  }

  private async getRulesById(ruleIds: string[]): Promise<RuleV2[]> {
    const rules = await prisma.planningRule.findMany({
      where: { id: { in: ruleIds } }
    });
    return rules as any as RuleV2[];
  }

  private async saveResolution(resolution: ConflictResolution): Promise<void> {
    // Save to database - implementation depends on schema
    await prisma.activityLog.create({
      data: {
        userId: resolution.resolvedBy || 'system',
        action: 'RESOLVE_RULE_CONFLICT',
        details: {
          conflictId: resolution.conflictId,
          strategy: resolution.strategy,
          resolvedRules: resolution.resolvedRules.map(r => r.id)
        }
      }
    });
  }
}