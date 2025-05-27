import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RuleSimulator } from '@/modules/dynamicRules/v2/services/RuleSimulator';
import { z } from 'zod';

const simulationSchema = z.object({
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  compareWith: z.string().optional() // Another rule ID to compare
});

// POST /api/admin/rules/v2/[ruleId]/simulate - Simulate rule impact
export async function POST(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate, compareWith } = simulationSchema.parse(body);

    // Validate date range
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'La date de fin doit être après la date de début' },
        { status: 400 }
      );
    }

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      return NextResponse.json(
        { error: 'La période de simulation ne peut pas dépasser 90 jours' },
        { status: 400 }
      );
    }

    // Get rule
    const rule = await prisma.planningRule.findUnique({
      where: { id: params.ruleId }
    });

    if (!rule) {
      return NextResponse.json(
        { error: 'Règle non trouvée' },
        { status: 404 }
      );
    }

    const simulator = new RuleSimulator();

    // Run simulation
    if (compareWith) {
      // Compare two rules
      const compareRule = await prisma.planningRule.findUnique({
        where: { id: compareWith }
      });

      if (!compareRule) {
        return NextResponse.json(
          { error: 'Règle de comparaison non trouvée' },
          { status: 404 }
        );
      }

      const comparison = await simulator.compareRules(
        rule as any,
        compareRule as any,
        startDate,
        endDate
      );

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'COMPARE_RULES_SIMULATION',
          details: {
            ruleId1: params.ruleId,
            ruleId2: compareWith,
            startDate,
            endDate
          }
        }
      });

      return NextResponse.json(comparison);

    } else {
      // Single rule simulation
      const simulation = await simulator.simulateRule(
        rule as any,
        startDate,
        endDate
      );

      // Generate report
      const report = await simulator.generateImpactReport(simulation);

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'SIMULATE_RULE',
          details: {
            ruleId: params.ruleId,
            startDate,
            endDate,
            violations: simulation.metrics.totalViolations,
            affectedUsers: simulation.metrics.affectedUsersCount
          }
        }
      });

      return NextResponse.json({
        simulation,
        report
      });
    }

  } catch (error) {
    console.error('Error running simulation:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erreur lors de la simulation' },
      { status: 500 }
    );
  }
}