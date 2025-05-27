import { RuleV2, RuleConflict, RuleSimulation } from '@/modules/dynamicRules/v2/types/ruleV2.types';
import { RuleEngineV2 } from '@/modules/dynamicRules/v2/services/RuleEngineV2';
import { ConflictDetector } from '@/modules/dynamicRules/v2/services/ConflictDetector';
import { RuleSimulator } from '@/modules/dynamicRules/v2/services/RuleSimulator';
import { RuleVersioningService } from '@/modules/dynamicRules/v2/services/RuleVersioningService';
import { RuleValidator } from '@/modules/dynamicRules/v2/services/RuleValidator';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma');


export class RuleConfigServiceV2 {
  private static instance: RuleConfigServiceV2;
  private ruleEngine: RuleEngineV2;
  private conflictDetector: ConflictDetector;
  private simulator: RuleSimulator;
  private versioningService: RuleVersioningService;
  private validator: RuleValidator;

  private constructor() {
    this.ruleEngine = RuleEngineV2.getInstance();
    this.conflictDetector = ConflictDetector.getInstance();
    this.simulator = new RuleSimulator();
    this.versioningService = RuleVersioningService.getInstance();
    this.validator = RuleValidator.getInstance();
  }

  static getInstance(): RuleConfigServiceV2 {
    if (!RuleConfigServiceV2.instance) {
      RuleConfigServiceV2.instance = new RuleConfigServiceV2();
    }
    return RuleConfigServiceV2.instance;
  }

  // Rule CRUD operations
  async createRule(rule: Partial<RuleV2>, userId: string): Promise<{
    rule: RuleV2;
    conflicts: RuleConflict[];
    validation: any;
  }> {
    // Validate rule
    const validation = await this.validator.validateRule(rule);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
    }

    // Check for conflicts
    const conflicts = await this.conflictDetector.detectConflicts(rule as RuleV2);

    // Create rule in database
    const newRule = await prisma.planningRule.create({
      data: {
        ...rule,
        id: `rule-${Date.now()}`,
        version: 1,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create initial version
    await this.versioningService.createVersion(
      newRule as any as RuleV2,
      userId,
      'Initial creation'
    );

    return {
      rule: newRule as any as RuleV2,
      conflicts,
      validation
    };
  }

  async updateRule(
    ruleId: string,
    updates: Partial<RuleV2>,
    userId: string
  ): Promise<{
    rule: RuleV2;
    conflicts: RuleConflict[];
    validation: any;
  }> {
    // Get current rule
    const currentRule = await this.getRule(ruleId);
    if (!currentRule) {
      throw new Error('Rule not found');
    }

    // Merge updates
    const updatedRule = { ...currentRule, ...updates };

    // Validate
    const validation = await this.validator.validateRule(updatedRule);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
    }

    // Check conflicts
    const conflicts = await this.conflictDetector.detectConflicts(updatedRule);

    // Update in database
    const updated = await prisma.planningRule.update({
      where: { id: ruleId },
      data: {
        ...updates,
        version: { increment: 1 },
        updatedBy: userId,
        updatedAt: new Date()
      }
    });

    // Create version
    await this.versioningService.createVersion(
      updated as any as RuleV2,
      userId,
      'Rule updated'
    );

    return {
      rule: updated as any as RuleV2,
      conflicts,
      validation
    };
  }

  async deleteRule(ruleId: string, userId: string): Promise<void> {
    // Soft delete by archiving
    await prisma.planningRule.update({
      where: { id: ruleId },
      data: {
        status: 'archived',
        updatedBy: userId,
        updatedAt: new Date()
      }
    });
  }

  async getRule(ruleId: string): Promise<RuleV2 | null> {
    const rule = await prisma.planningRule.findUnique({
      where: { id: ruleId }
    });
    return rule as any as RuleV2;
  }

  async getRules(filters?: {
    status?: string;
    type?: string;
    tags?: string[];
    search?: string;
  }): Promise<RuleV2[]> {
    const where: any = {};

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.type) where.type = filters.type;
      if (filters.tags) where.tags = { hasSome: filters.tags };
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
    }

    const rules = await prisma.planningRule.findMany({
      where,
      orderBy: { priority: 'desc' }
    });

    return rules as any as RuleV2[];
  }

  // Rule evaluation
  async evaluateRules(context: any): Promise<any[]> {
    return this.ruleEngine.evaluateRules(context);
  }

  // Conflict management
  async checkConflicts(rule: RuleV2): Promise<RuleConflict[]> {
    return this.conflictDetector.detectConflicts(rule);
  }

  async resolveConflict(
    conflict: RuleConflict,
    strategy: 'priority' | 'merge' | 'override' | 'manual',
    resolution?: Partial<RuleV2>[]
  ): Promise<any> {
    return this.conflictDetector.resolveConflict(conflict, strategy, resolution);
  }

  // Simulation
  async simulateRule(
    rule: Partial<RuleV2>,
    startDate: Date,
    endDate: Date
  ): Promise<RuleSimulation> {
    return this.simulator.simulateRule(rule, startDate, endDate);
  }

  async compareRules(
    rule1: RuleV2,
    rule2: RuleV2,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    return this.simulator.compareRules(rule1, rule2, startDate, endDate);
  }

  // Versioning
  async getVersionHistory(ruleId: string, limit?: number): Promise<any[]> {
    return this.versioningService.getVersionHistory(ruleId, limit);
  }

  async revertToVersion(
    ruleId: string,
    targetVersion: number,
    userId: string
  ): Promise<RuleV2> {
    return this.versioningService.revertToVersion(ruleId, targetVersion, userId);
  }

  // Bulk operations
  async bulkUpdateRules(
    ruleIds: string[],
    updates: Partial<RuleV2>,
    userId: string
  ): Promise<number> {
    const result = await prisma.planningRule.updateMany({
      where: { id: { in: ruleIds } },
      data: {
        ...updates,
        updatedBy: userId,
        updatedAt: new Date()
      }
    });

    return result.count;
  }

  async bulkDeleteRules(ruleIds: string[], userId: string): Promise<number> {
    const result = await prisma.planningRule.updateMany({
      where: { id: { in: ruleIds } },
      data: {
        status: 'archived',
        updatedBy: userId,
        updatedAt: new Date()
      }
    });

    return result.count;
  }

  // Import/Export
  async exportRules(ruleIds?: string[]): Promise<any> {
    const where = ruleIds ? { id: { in: ruleIds } } : {};
    const rules = await prisma.planningRule.findMany({ where });

    return {
      version: '2.0',
      exportDate: new Date(),
      rules: rules.map(rule => ({
        ...rule,
        id: undefined, // Remove IDs for import
        createdAt: undefined,
        updatedAt: undefined
      }))
    };
  }

  async importRules(data: any, userId: string): Promise<{
    imported: number;
    failed: number;
    errors: any[];
  }> {
    const results = {
      imported: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const rule of data.rules) {
      try {
        await this.createRule(rule, userId);
        results.imported++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          rule: rule.name,
          error: error.message
        });
      }
    }

    return results;
  }

  // Cache management
  clearCache(): void {
    this.ruleEngine.clearCache();
  }

  // Monitoring
  async getRuleMetrics(ruleId: string): Promise<any> {
    const metrics = await prisma.ruleMetrics.findUnique({
      where: { ruleId }
    });

    if (!metrics) {
      return {
        evaluationCount: 0,
        averageExecutionTime: 0,
        successRate: 0,
        lastEvaluatedAt: null
      };
    }

    return metrics;
  }

  async getSystemMetrics(): Promise<any> {
    const [
      totalRules,
      activeRules,
      totalEvaluations,
      avgExecutionTime
    ] = await Promise.all([
      prisma.planningRule.count(),
      prisma.planningRule.count({ where: { status: 'active' } }),
      prisma.ruleMetrics.aggregate({
        _sum: { evaluationCount: true }
      }),
      prisma.ruleMetrics.aggregate({
        _avg: { averageExecutionTime: true }
      })
    ]);

    return {
      totalRules,
      activeRules,
      totalEvaluations: totalEvaluations._sum.evaluationCount || 0,
      avgExecutionTime: avgExecutionTime._avg.averageExecutionTime || 0
    };
  }
}