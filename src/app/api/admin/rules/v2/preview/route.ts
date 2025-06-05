import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RuleSimulator } from '@/modules/dynamicRules/v2/services/RuleSimulator';
import { RuleV2 } from '@/modules/dynamicRules/v2/types/ruleV2.types';
import { z } from 'zod';

const previewSchema = z.object({
  rule: z.object({
    name: z.string(),
    type: z.string(),
    conditions: z.array(z.any()),
    actions: z.array(z.any()),
    priority: z.number().optional(),
    enabled: z.boolean().optional()
  }),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str))
});

// POST /api/admin/rules/v2/preview - Preview rule impact without saving
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { rule, startDate, endDate } = previewSchema.parse(body);

    // Validate date range
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'La date de fin doit être après la date de début' },
        { status: 400 }
      );
    }

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 30) {
      return NextResponse.json(
        { error: 'La période de prévisualisation ne peut pas dépasser 30 jours' },
        { status: 400 }
      );
    }

    // Create temporary rule for simulation
    const tempRule: Partial<RuleV2> = {
      ...rule,
      id: `preview-${Date.now()}`,
      status: 'draft',
      createdBy: session.user.id,
      updatedBy: session.user.id,
      effectiveDate: startDate,
      version: 1
    };

    const simulator = new RuleSimulator();
    const simulation = await simulator.simulateRule(
      tempRule,
      startDate,
      endDate
    );

    return NextResponse.json(simulation);

  } catch (error) {
    logger.error('Error in preview:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erreur lors de la prévisualisation' },
      { status: 500 }
    );
  }
}