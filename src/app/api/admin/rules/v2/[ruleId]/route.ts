import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RuleV2 } from '@/modules/dynamicRules/v2/types/ruleV2.types';
import { RuleVersioningService } from '@/modules/dynamicRules/v2/services/RuleVersioningService';
import { ConflictDetector } from '@/modules/dynamicRules/v2/services/ConflictDetector';
import { z } from 'zod';

const updateRuleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(['PLANNING', 'LEAVE', 'CONSTRAINT', 'ALLOCATION', 'SUPERVISION']).optional(),
  priority: z.number().min(0).max(100).optional(),
  enabled: z.boolean().optional(),
  status: z.enum(['draft', 'active', 'archived', 'pending_approval']).optional(),
  conditions: z
    .array(
      z.object({
        field: z.string(),
        operator: z.string(),
        value: z.any(),
      })
    )
    .optional(),
  actions: z
    .array(
      z.object({
        type: z.string(),
        target: z.string().optional(),
        value: z.any().optional(),
        message: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .optional(),
  effectiveDate: z
    .string()
    .optional()
    .transform(str => (str ? new Date(str) : undefined)),
  expirationDate: z
    .string()
    .nullable()
    .optional()
    .transform(str => (str ? new Date(str) : null)),
  tags: z.array(z.string()).optional(),
  contexts: z.array(z.string()).optional(),
});

// GET /api/admin/rules/v2/[ruleId] - Get rule details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const rule = await prisma.planningRule.findUnique({
      where: { id: params.ruleId },
      include: {
        _count: {
          select: {
            versions: true,
          },
        },
      },
    });

    if (!rule) {
      return NextResponse.json({ error: 'Règle non trouvée' }, { status: 404 });
    }

    // Get latest metrics
    const metrics = await prisma.ruleMetrics.findUnique({
      where: { ruleId: params.ruleId },
    });

    // Get conflicts
    const conflictDetector = ConflictDetector.getInstance();
    const conflicts = await conflictDetector.detectConflicts(rule as any as RuleV2);

    return NextResponse.json({
      rule: {
        ...rule,
        versionCount: rule._count.versions,
        metrics,
        conflicts,
      },
    });
  } catch (error: unknown) {
    logger.error('Error fetching rule:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la règle' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/rules/v2/[ruleId] - Update rule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateRuleSchema.parse(body);

    // Get current rule
    const currentRule = await prisma.planningRule.findUnique({
      where: { id: params.ruleId },
    });

    if (!currentRule) {
      return NextResponse.json({ error: 'Règle non trouvée' }, { status: 404 });
    }

    // Check for conflicts
    const updatedRule = { ...currentRule, ...validatedData } as RuleV2;
    const conflictDetector = ConflictDetector.getInstance();
    const conflicts = await conflictDetector.detectConflicts(updatedRule);

    // Update rule
    const updated = await prisma.planningRule.update({
      where: { id: params.ruleId },
      data: {
        ...validatedData,
        version: { increment: 1 },
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
    });

    // Create version
    const versioningService = RuleVersioningService.getInstance();
    await versioningService.createVersion(
      updated as any as RuleV2,
      session.user.id,
      body.versionMessage || 'Mise à jour de la règle'
    );

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_RULE',
        details: {
          ruleId: params.ruleId,
          changes: Object.keys(validatedData),
          conflicts: conflicts.length,
        },
      },
    });

    return NextResponse.json({
      rule: updated,
      conflicts,
      message:
        conflicts.length > 0
          ? `Règle mise à jour avec ${conflicts.length} conflit(s) potentiel(s)`
          : 'Règle mise à jour avec succès',
    });
  } catch (error: unknown) {
    logger.error('Error updating rule:', error instanceof Error ? error : new Error(String(error)));
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la règle' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/rules/v2/[ruleId] - Delete rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Check if rule exists
    const rule = await prisma.planningRule.findUnique({
      where: { id: params.ruleId },
    });

    if (!rule) {
      return NextResponse.json({ error: 'Règle non trouvée' }, { status: 404 });
    }

    // Soft delete by archiving
    await prisma.planningRule.update({
      where: { id: params.ruleId },
      data: {
        status: 'archived',
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE_RULE',
        details: {
          ruleId: params.ruleId,
          ruleName: rule.name,
        },
      },
    });

    return NextResponse.json({
      message: 'Règle archivée avec succès',
    });
  } catch (error: unknown) {
    logger.error('Error deleting rule:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la règle' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/rules/v2/[ruleId] - Quick actions (enable/disable, status change)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { action, value } = await request.json();

    const updateData: any = {};
    let actionName = '';

    switch (action) {
      case 'toggle':
        updateData.enabled = value;
        actionName = value ? 'ENABLE_RULE' : 'DISABLE_RULE';
        break;
      case 'status':
        updateData.status = value;
        actionName = 'CHANGE_RULE_STATUS';
        break;
      case 'priority':
        updateData.priority = value;
        actionName = 'CHANGE_RULE_PRIORITY';
        break;
      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
    }

    updateData.updatedBy = session.user.id;
    updateData.updatedAt = new Date();

    const updated = await prisma.planningRule.update({
      where: { id: params.ruleId },
      data: updateData,
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: actionName,
        details: {
          ruleId: params.ruleId,
          value,
        },
      },
    });

    return NextResponse.json({
      rule: updated,
      message: 'Action effectuée avec succès',
    });
  } catch (error: unknown) {
    logger.error('Error performing quick action:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Erreur lors de l'exécution de l'action" }, { status: 500 });
  }
}
