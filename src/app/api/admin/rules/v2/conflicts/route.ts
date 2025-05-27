import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ConflictDetector } from '@/modules/dynamicRules/v2/services/ConflictDetector';
import { RuleV2 } from '@/modules/dynamicRules/v2/types/ruleV2.types';
import { z } from 'zod';

const conflictCheckSchema = z.object({
  rule: z.object({
    id: z.string().optional(),
    name: z.string(),
    type: z.string(),
    conditions: z.array(z.any()),
    actions: z.array(z.any()),
    priority: z.number().optional(),
    effectiveDate: z.any().optional(),
    expirationDate: z.any().optional()
  })
});

const resolveConflictSchema = z.object({
  conflictId: z.string(),
  strategy: z.enum(['priority', 'merge', 'override', 'manual']),
  resolution: z.any().optional()
});

// POST /api/admin/rules/v2/conflicts - Check for conflicts
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    
    if (body.action === 'check') {
      const { rule } = conflictCheckSchema.parse(body);
      
      const conflictDetector = ConflictDetector.getInstance();
      const conflicts = await conflictDetector.detectConflicts(rule as RuleV2);

      return NextResponse.json({
        conflicts,
        count: conflicts.length
      });

    } else if (body.action === 'resolve') {
      const { conflictId, strategy, resolution } = resolveConflictSchema.parse(body);
      
      // Get conflict details
      const conflict = await getConflictById(conflictId);
      if (!conflict) {
        return NextResponse.json(
          { error: 'Conflit non trouvé' },
          { status: 404 }
        );
      }

      const conflictDetector = ConflictDetector.getInstance();
      const resolved = await conflictDetector.resolveConflict(
        conflict,
        strategy,
        resolution
      );

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'RESOLVE_RULE_CONFLICT',
          details: {
            conflictId,
            strategy,
            resolvedBy: session.user.id
          }
        }
      });

      return NextResponse.json({
        resolution: resolved,
        message: 'Conflit résolu avec succès'
      });

    } else {
      return NextResponse.json(
        { error: 'Action non reconnue' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in conflict handling:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erreur lors du traitement des conflits' },
      { status: 500 }
    );
  }
}

// GET /api/admin/rules/v2/conflicts - Get all active conflicts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Get all active rules
    const activeRules = await prisma.planningRule.findMany({
      where: { status: 'active' }
    });

    const conflictDetector = ConflictDetector.getInstance();
    const allConflicts: any[] = [];

    // Check conflicts between all pairs of rules
    for (let i = 0; i < activeRules.length; i++) {
      for (let j = i + 1; j < activeRules.length; j++) {
        const conflicts = await conflictDetector.detectConflicts(
          activeRules[i] as any,
          [activeRules[j] as any]
        );
        allConflicts.push(...conflicts);
      }
    }

    // Group conflicts by severity
    const groupedConflicts = allConflicts.reduce((acc, conflict) => {
      if (!acc[conflict.severity]) {
        acc[conflict.severity] = [];
      }
      acc[conflict.severity].push(conflict);
      return acc;
    }, {});

    return NextResponse.json({
      conflicts: allConflicts,
      grouped: groupedConflicts,
      total: allConflicts.length,
      summary: {
        critical: groupedConflicts.critical?.length || 0,
        high: groupedConflicts.high?.length || 0,
        medium: groupedConflicts.medium?.length || 0,
        low: groupedConflicts.low?.length || 0
      }
    });

  } catch (error) {
    console.error('Error fetching conflicts:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des conflits' },
      { status: 500 }
    );
  }
}

// Helper function to get conflict by ID (would need proper storage in production)
async function getConflictById(conflictId: string) {
  // In production, conflicts would be stored in database
  // For now, we'll regenerate based on the conflict ID pattern
  const [, ruleId1, ruleId2] = conflictId.match(/conflict-(.+)-(.+)/) || [];
  
  if (!ruleId1 || !ruleId2) return null;

  const [rule1, rule2] = await Promise.all([
    prisma.planningRule.findUnique({ where: { id: ruleId1 } }),
    prisma.planningRule.findUnique({ where: { id: ruleId2 } })
  ]);

  if (!rule1 || !rule2) return null;

  const conflictDetector = ConflictDetector.getInstance();
  const conflicts = await conflictDetector.detectConflicts(rule1 as any, [rule2 as any]);
  
  return conflicts.find(c => c.id === conflictId);
}