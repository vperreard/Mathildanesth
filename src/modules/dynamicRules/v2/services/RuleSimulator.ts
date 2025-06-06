import { RuleV2, RuleSimulation, SimulationUser, SimulationViolation, SimulationMetrics } from '../types/ruleV2.types';
import { logger } from "../../../../lib/logger";
import { RuleEngineV2 } from './RuleEngineV2';
import { prisma } from '@/lib/prisma';
import { addDays, eachDayOfInterval, isWeekend, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export class RuleSimulator {
  private ruleEngine: RuleEngineV2;

  constructor() {
    this.ruleEngine = RuleEngineV2.getInstance();
  }

  async simulateRule(
    rule: Partial<RuleV2>,
    startDate: Date,
    endDate: Date
  ): Promise<RuleSimulation> {
    const simulationId = `sim-${Date.now()}`;
    const simulation: RuleSimulation = {
      id: simulationId,
      ruleId: rule.id || 'new',
      startDate,
      endDate,
      affectedUsers: [],
      violations: [],
      metrics: {
        totalViolations: 0,
        affectedUsersCount: 0,
        complianceRate: 0,
        estimatedWorkloadChange: 0
      },
      status: 'running'
    };

    try {
      // Get relevant data for simulation
      const { users, attributions, leaves } = await this.getSimulationData(startDate, endDate);
      
      // Simulate for each day in the range
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const userImpacts: Map<string, SimulationUser> = new Map();
      
      for (const day of days) {
        for (const user of users) {
          const context = {
            userId: user.id,
            date: day,
            planning: attributions.filter(a => 
              new Date(a.date).toDateString() === day.toDateString()
            ),
            leaves: leaves.filter(l => 
              l.userId === user.id &&
              new Date(l.startDate) <= day &&
              new Date(l.endDate) >= day
            ),
            user,
            metadata: {
              isWeekend: isWeekend(day),
              dayOfWeek: day.getDay()
            }
          };

          // Evaluate rule
          const result = await this.ruleEngine.evaluateRules(context, [rule.id]);
          
          if (result.length > 0 && !result[0].passed) {
            // Record violation
            const violation: SimulationViolation = {
              date: day,
              userId: user.id,
              ruleId: rule.id || 'new',
              description: result[0].violations?.[0] || 'Rule violation',
              severity: this.calculateViolationSeverity(rule, result[0])
            };
            simulation.violations.push(violation);

            // Track affected user
            if (!userImpacts.has(user.id)) {
              userImpacts.set(user.id, {
                userId: user.id,
                userName: `${user.firstName} ${user.lastName}`,
                impactLevel: 'low',
                affectedDates: []
              });
            }
            
            const userImpact = userImpacts.get(user.id)!;
            userImpact.affectedDates.push(day);
            userImpact.impactLevel = this.calculateUserImpactLevel(userImpact.affectedDates.length);
          }
        }
      }

      // Convert user impacts to array
      simulation.affectedUsers = Array.from(userImpacts.values());

      // Calculate metrics
      simulation.metrics = this.calculateMetrics(
        simulation,
        users.length,
        days.length
      );

      simulation.status = 'completed';
    } catch (error: unknown) {
      logger.error('Simulation error:', { error: error });
      simulation.status = 'failed';
    }

    return simulation;
  }

  private async getSimulationData(startDate: Date, endDate: Date) {
    const [users, attributions, leaves] = await Promise.all([
      prisma.user.findMany({
        where: {
          isActive: true,
          role: { in: ['IADE', 'MAR'] }
        }
      }),
      prisma.attribution.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          user: true,
          operatingRoom: true
        }
      }),
      prisma.leave.findMany({
        where: {
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate }
            }
          ],
          status: 'APPROVED'
        }
      })
    ]);

    return { users, attributions, leaves };
  }

  private calculateViolationSeverity(
    rule: Partial<RuleV2>,
    result: unknown
  ): string {
    // Based on rule priority and action types
    if (rule.priority && rule.priority >= 20) return 'critical';
    if (rule.priority && rule.priority >= 10) return 'high';
    if (rule.actions?.some(a => a.type === 'PREVENT')) return 'high';
    if (rule.actions?.some(a => a.type === 'NOTIFY')) return 'medium';
    return 'low';
  }

  private calculateUserImpactLevel(affectedDaysCount: number): 'low' | 'medium' | 'high' {
    if (affectedDaysCount >= 10) return 'high';
    if (affectedDaysCount >= 5) return 'medium';
    return 'low';
  }

  private calculateMetrics(
    simulation: RuleSimulation,
    totalUsers: number,
    totalDays: number
  ): SimulationMetrics {
    const totalPossibleViolations = totalUsers * totalDays;
    const actualViolations = simulation.violations.length;
    
    return {
      totalViolations: actualViolations,
      affectedUsersCount: simulation.affectedUsers.length,
      complianceRate: totalPossibleViolations > 0 
        ? (totalPossibleViolations - actualViolations) / totalPossibleViolations 
        : 1,
      estimatedWorkloadChange: this.estimateWorkloadChange(simulation)
    };
  }

  private estimateWorkloadChange(simulation: RuleSimulation): number {
    // Estimate based on violations and affected users
    const avgViolationsPerUser = simulation.affectedUsers.length > 0
      ? simulation.violations.length / simulation.affectedUsers.length
      : 0;

    // Rough estimation: each violation might require 5-10% workload adjustment
    return Math.min(avgViolationsPerUser * 7.5, 50); // Cap at 50%
  }

  async compareRules(
    rule1: RuleV2,
    rule2: RuleV2,
    startDate: Date,
    endDate: Date
  ): Promise<{
    rule1Results: RuleSimulation;
    rule2Results: RuleSimulation;
    comparison: {
      violationDiff: number;
      affectedUsersDiff: number;
      complianceRateDiff: number;
      workloadChangeDiff: number;
    };
  }> {
    const [results1, results2] = await Promise.all([
      this.simulateRule(rule1, startDate, endDate),
      this.simulateRule(rule2, startDate, endDate)
    ]);

    return {
      rule1Results: results1,
      rule2Results: results2,
      comparison: {
        violationDiff: results2.metrics.totalViolations - results1.metrics.totalViolations,
        affectedUsersDiff: results2.metrics.affectedUsersCount - results1.metrics.affectedUsersCount,
        complianceRateDiff: results2.metrics.complianceRate - results1.metrics.complianceRate,
        workloadChangeDiff: results2.metrics.estimatedWorkloadChange - results1.metrics.estimatedWorkloadChange
      }
    };
  }

  async generateImpactReport(simulation: RuleSimulation): Promise<string> {
    const report = [];
    
    report.push(`# Rapport de simulation - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`);
    report.push('');
    report.push(`## Période analysée`);
    report.push(`Du ${format(simulation.startDate, 'dd MMMM yyyy', { locale: fr })} au ${format(simulation.endDate, 'dd MMMM yyyy', { locale: fr })}`);
    report.push('');
    
    report.push(`## Résumé des impacts`);
    report.push(`- **Utilisateurs impactés**: ${simulation.metrics.affectedUsersCount}`);
    report.push(`- **Violations détectées**: ${simulation.metrics.totalViolations}`);
    report.push(`- **Taux de conformité**: ${(simulation.metrics.complianceRate * 100).toFixed(1)}%`);
    report.push(`- **Changement de charge estimé**: ${simulation.metrics.estimatedWorkloadChange > 0 ? '+' : ''}${simulation.metrics.estimatedWorkloadChange.toFixed(1)}%`);
    report.push('');
    
    if (simulation.affectedUsers.length > 0) {
      report.push(`## Utilisateurs les plus impactés`);
      const topUsers = simulation.affectedUsers
        .sort((a, b) => b.affectedDates.length - a.affectedDates.length)
        .slice(0, 5);
      
      topUsers.forEach(user => {
        report.push(`- **${user.userName}**: ${user.affectedDates.length} jours impactés (impact ${user.impactLevel})`);
      });
      report.push('');
    }
    
    if (simulation.violations.length > 0) {
      report.push(`## Violations par sévérité`);
      const violationsBySeverity = simulation.violations.reduce((acc, v) => {
        acc[v.severity] = (acc[v.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(violationsBySeverity).forEach(([severity, count]) => {
        report.push(`- **${severity}**: ${count} violations`);
      });
    }
    
    return report.join('\n');
  }
}