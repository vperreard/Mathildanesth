import { RuleV2, RuleEvaluationContext, RuleEvaluationResult, RuleConflict } from '../types/ruleV2.types';
import { logger } from "../../../../lib/logger";
import { RuleCondition, RuleAction, ConditionGroup } from '../../types/rule';
import { prisma } from '@/lib/prisma';
import { cache } from 'react';
import { getRuleNotificationService } from '../../services/RuleNotificationService';
import { RuleSeverity } from '@/types/rules';

export class RuleEngineV2 {
  private static instance: RuleEngineV2;
  private rulesCache: Map<string, { rule: RuleV2; timestamp: number }> = new Map();
  private evaluationCache: Map<string, RuleEvaluationResult> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private notificationService = getRuleNotificationService();
  private enableNotifications = true;

  private constructor() {}

  static getInstance(): RuleEngineV2 {
    if (!RuleEngineV2.instance) {
      RuleEngineV2.instance = new RuleEngineV2();
    }
    return RuleEngineV2.instance;
  }

  async evaluateRules(
    context: RuleEvaluationContext,
    ruleIds?: string[]
  ): Promise<RuleEvaluationResult[]> {
    const startTime = Date.now();
    
    // Get active rules
    const rules = await this.getActiveRules(ruleIds);
    const results: RuleEvaluationResult[] = [];

    // Evaluate rules in parallel batches
    const batchSize = 10;
    for (let i = 0; i < rules.length; i += batchSize) {
      const batch = rules.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(rule => this.evaluateRule(rule, context))
      );
      results.push(...batchResults);
    }

    // Update metrics
    await this.updateEvaluationMetrics(results, Date.now() - startTime);

    return results;
  }

  private async evaluateRule(
    rule: RuleV2,
    context: RuleEvaluationContext
  ): Promise<RuleEvaluationResult> {
    const startTime = Date.now();
    const cacheKey = `${rule.id}-${JSON.stringify(context)}`;

    // Check cache
    const cached = this.evaluationCache.get(cacheKey);
    if (cached && Date.now() - startTime < 1000) {
      return cached;
    }

    try {
      // Evaluate conditions
      const conditionsPassed = await this.evaluateConditions(
        rule.conditions || [],
        rule.conditionGroups || [],
        context
      );

      const result: RuleEvaluationResult = {
        ruleId: rule.id,
        ruleName: rule.name,
        passed: conditionsPassed,
        actions: conditionsPassed ? rule.actions : [],
        violations: conditionsPassed ? [] : [`Rule ${rule.name} conditions not met`],
        executionTime: Date.now() - startTime,
        context
      };

      // Cache result
      this.evaluationCache.set(cacheKey, result);

      // Send notification for violations
      if (!conditionsPassed && this.enableNotifications && rule.type === 'validation') {
        await this.sendViolationNotification(rule, result, context);
      }

      return result;
    } catch (error: unknown) {
      logger.error(`Error evaluating rule ${rule.id}:`, error instanceof Error ? error : new Error(String(error)));
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        passed: false,
        violations: [`Error evaluating rule: ${error.message}`],
        executionTime: Date.now() - startTime,
        context
      };
    }
  }

  private async sendViolationNotification(
    rule: RuleV2,
    result: RuleEvaluationResult,
    context: RuleEvaluationContext
  ): Promise<void> {
    try {
      // Extraire la sévérité depuis les actions
      let severity = RuleSeverity.INFO;
      let message = result.violations?.[0] || `Violation de la règle: ${rule.name}`;
      
      if (result.actions) {
        for (const action of result.actions) {
          if (action.type === 'validate' && action.parameters?.severity) {
            severity = action.parameters.severity as RuleSeverity;
            if (action.parameters.message) {
              message = action.parameters.message;
            }
            break;
          }
        }
      }

      // Envoyer uniquement pour les violations ERROR et WARNING
      if (severity === RuleSeverity.ERROR || severity === RuleSeverity.WARNING) {
        await this.notificationService.sendViolation(
          {
            ...result,
            ruleName: rule.name,
            actions: result.actions || []
          },
          context
        );
      }
    } catch (error: unknown) {
      logger.error('Failed to send violation notification:', error instanceof Error ? error : new Error(String(error)));
      // Ne pas faire échouer l'évaluation si la notification échoue
    }
  }

  private async evaluateConditions(
    conditions: RuleCondition[],
    conditionGroups: ConditionGroup[],
    context: RuleEvaluationContext
  ): Promise<boolean> {
    // Evaluate individual conditions
    const conditionResults = await Promise.all(
      conditions.map(condition => this.evaluateCondition(condition, context))
    );

    // Evaluate condition groups
    const groupResults = await Promise.all(
      conditionGroups.map(group => this.evaluateConditionGroup(group, context))
    );

    // Default to AND logic if no explicit operator
    const allResults = [...conditionResults, ...groupResults];
    return allResults.length === 0 || allResults.every(result => result);
  }

  private async evaluateCondition(
    condition: RuleCondition,
    context: RuleEvaluationContext
  ): Promise<boolean> {
    const fieldValue = this.getFieldValue(condition.field, context);
    
    switch (condition.operator) {
      case 'EQUALS':
        return fieldValue === condition.value;
      case 'NOT_EQUALS':
        return fieldValue !== condition.value;
      case 'GREATER_THAN':
        return Number(fieldValue) > Number(condition.value);
      case 'LESS_THAN':
        return Number(fieldValue) < Number(condition.value);
      case 'CONTAINS':
        return String(fieldValue).includes(String(condition.value));
      case 'IN':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'NOT_IN':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case 'BETWEEN':
        const [min, max] = condition.value as [number, number];
        const numValue = Number(fieldValue);
        return numValue >= min && numValue <= max;
      case 'REGEX':
        return new RegExp(String(condition.value)).test(String(fieldValue));
      case 'CUSTOM':
        return await this.evaluateCustomCondition(condition, context);
      default:
        return false;
    }
  }

  private async evaluateConditionGroup(
    group: ConditionGroup,
    context: RuleEvaluationContext
  ): Promise<boolean> {
    const results = await Promise.all(
      group.conditions.map(condition => this.evaluateCondition(condition, context))
    );

    switch (group.operator) {
      case 'AND':
        return results.every(result => result);
      case 'OR':
        return results.some(result => result);
      case 'NOT':
        return !results[0];
      default:
        return false;
    }
  }

  private getFieldValue(field: string, context: RuleEvaluationContext): any {
    const parts = field.split('.');
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private async evaluateCustomCondition(
    condition: RuleCondition,
    context: RuleEvaluationContext
  ): Promise<boolean> {
    // Implement custom condition evaluation
    // This could involve calling external services or complex logic
    if (typeof condition.customFunction === 'string') {
      try {
        const func = new Function('context', 'value', condition.customFunction);
        return func(context, condition.value);
      } catch (error: unknown) {
        logger.error('Error in custom condition:', error instanceof Error ? error : new Error(String(error)));
        return false;
      }
    }
    return false;
  }

  async detectConflicts(rule: RuleV2): Promise<RuleConflict[]> {
    const conflicts: RuleConflict[] = [];
    const activeRules = await this.getActiveRules();

    for (const existingRule of activeRules) {
      if (existingRule.id === rule.id) continue;

      // Check for condition overlaps
      const overlap = this.detectConditionOverlap(rule, existingRule);
      if (overlap) {
        conflicts.push({
          id: `conflict-${rule.id}-${existingRule.id}`,
          ruleIds: [rule.id, existingRule.id],
          type: 'condition_overlap',
          severity: overlap.severity,
          description: overlap.description,
          detectedAt: new Date()
        });
      }

      // Check for action contradictions
      const contradiction = this.detectActionContradiction(rule, existingRule);
      if (contradiction) {
        conflicts.push({
          id: `conflict-${rule.id}-${existingRule.id}-action`,
          ruleIds: [rule.id, existingRule.id],
          type: 'action_contradiction',
          severity: contradiction.severity,
          description: contradiction.description,
          detectedAt: new Date()
        });
      }
    }

    return conflicts;
  }

  private detectConditionOverlap(
    rule1: RuleV2,
    rule2: RuleV2
  ): { severity: 'low' | 'medium' | 'high' | 'critical'; description: string } | null {
    // Simplified overlap detection - in reality, this would be more complex
    const fields1 = new Set(rule1.conditions?.map(c => c.field) || []);
    const fields2 = new Set(rule2.conditions?.map(c => c.field) || []);
    
    const commonFields = [...fields1].filter(f => fields2.has(f));
    
    if (commonFields.length > 0) {
      const severity = rule1.priority === 'CRITICAL' || rule2.priority === 'CRITICAL' 
        ? 'critical' 
        : commonFields.length > 2 
        ? 'high' 
        : 'medium';
        
      return {
        severity,
        description: `Rules have overlapping conditions on fields: ${commonFields.join(', ')}`
      };
    }
    
    return null;
  }

  private detectActionContradiction(
    rule1: RuleV2,
    rule2: RuleV2
  ): { severity: 'low' | 'medium' | 'high' | 'critical'; description: string } | null {
    // Check if actions contradict each other
    const actions1 = rule1.actions || [];
    const actions2 = rule2.actions || [];

    for (const action1 of actions1) {
      for (const action2 of actions2) {
        if (action1.target === action2.target && action1.type !== action2.type) {
          return {
            severity: 'high',
            description: `Contradicting actions on target ${action1.target}: ${action1.type} vs ${action2.type}`
          };
        }
      }
    }

    return null;
  }

  private async getActiveRules(ruleIds?: string[]): Promise<RuleV2[]> {
    const now = new Date();
    
    // Check cache first
    if (!ruleIds) {
      const cachedRules = Array.from(this.rulesCache.values())
        .filter(entry => now.getTime() - entry.timestamp < this.CACHE_TTL)
        .map(entry => entry.rule)
        .filter(rule => rule.status === 'active');
      
      if (cachedRules.length > 0) {
        return cachedRules;
      }
    }

    // Fetch from database
    const where: any = {
      status: 'active',
      effectiveDate: { lte: now },
      OR: [
        { expirationDate: null },
        { expirationDate: { gte: now } }
      ]
    };

    if (ruleIds) {
      where.id = { in: ruleIds };
    }

    const rules = await prisma.planningRule.findMany({
      where,
      orderBy: { priority: 'desc' }
    });

    // Update cache
    rules.forEach(rule => {
      this.rulesCache.set(rule.id, {
        rule: rule as any as RuleV2,
        timestamp: now.getTime()
      });
    });

    return rules as any as RuleV2[];
  }

  private async updateEvaluationMetrics(
    results: RuleEvaluationResult[],
    totalExecutionTime: number
  ): Promise<void> {
    // Update metrics in database
    const updates = results.map(result => ({
      where: { id: result.ruleId },
      data: {
        metrics: {
          update: {
            evaluationCount: { increment: 1 },
            averageExecutionTime: result.executionTime,
            lastEvaluatedAt: new Date()
          }
        }
      }
    }));

    // Batch update metrics
    await Promise.all(
      updates.map(update => 
        prisma.planningRule.update(update).catch(err => 
          logger.error('Failed to update metrics:', err)
        )
      )
    );
  }

  clearCache(): void {
    this.rulesCache.clear();
    this.evaluationCache.clear();
  }
}