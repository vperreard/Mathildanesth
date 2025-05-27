import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RuleV2 } from '@/modules/dynamicRules/v2/types/ruleV2.types';
import { RuleVersioningService } from '@/modules/dynamicRules/v2/services/RuleVersioningService';
import { ConflictDetector } from '@/modules/dynamicRules/v2/services/ConflictDetector';
import { z } from 'zod';

// Validation schemas
const createRuleSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().min(1, 'La description est requise'),
  type: z.enum(['PLANNING', 'LEAVE', 'CONSTRAINT', 'ALLOCATION', 'SUPERVISION']),
  priority: z.number().min(0).max(100).default(5),
  enabled: z.boolean().default(true),
  status: z.enum(['draft', 'active', 'archived', 'pending_approval']).default('draft'),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.any()
  })).min(1, 'Au moins une condition est requise'),
  actions: z.array(z.object({
    type: z.string(),
    target: z.string().optional(),
    value: z.any().optional(),
    message: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })).min(1, 'Au moins une action est requise'),
  effectiveDate: z.string().transform(str => new Date(str)),
  expirationDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  tags: z.array(z.string()).optional(),
  contexts: z.array(z.string()).optional()
});

const updateRuleSchema = createRuleSchema.partial();

const querySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => parseInt(val || '10')),
  status: z.enum(['draft', 'active', 'archived', 'pending_approval']).optional(),
  type: z.string().optional(),
  search: z.string().optional(),
  tags: z.string().optional().transform(val => val ? val.split(',') : undefined),
  sortBy: z.enum(['name', 'priority', 'createdAt', 'updatedAt']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// GET /api/admin/rules/v2 - List rules with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = querySchema.parse(searchParams);

    // Build where clause
    const where: any = {};
    
    if (query.status) {
      where.status = query.status;
    }
    
    if (query.type) {
      where.type = query.type;
    }
    
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } }
      ];
    }
    
    if (query.tags && query.tags.length > 0) {
      where.tags = { hasSome: query.tags };
    }

    // Count total
    const total = await prisma.planningRule.count({ where });

    // Fetch rules
    const rules = await prisma.planningRule.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortOrder },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: {
        _count: {
          select: {
            versions: true
          }
        }
      }
    });

    // Add metrics
    const rulesWithMetrics = rules.map(rule => ({
      ...rule,
      versionCount: rule._count.versions
    }));

    return NextResponse.json({
      rules: rulesWithMetrics,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit)
      }
    });

  } catch (error) {
    console.error('Error fetching rules:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des règles' },
      { status: 500 }
    );
  }
}

// POST /api/admin/rules/v2 - Create a new rule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createRuleSchema.parse(body);

    // Check for conflicts before creating
    const conflictDetector = ConflictDetector.getInstance();
    const potentialConflicts = await conflictDetector.detectConflicts(validatedData as RuleV2);

    // Create rule
    const newRule = await prisma.planningRule.create({
      data: {
        ...validatedData,
        id: `rule-${Date.now()}`,
        version: 1,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        conditions: validatedData.conditions,
        actions: validatedData.actions,
        tags: validatedData.tags || [],
        contexts: validatedData.contexts || [],
        metadata: {
          createdByName: session.user.name || session.user.email
        }
      }
    });

    // Create initial version
    const versioningService = RuleVersioningService.getInstance();
    await versioningService.createVersion(
      newRule as any as RuleV2,
      session.user.id,
      'Création initiale de la règle'
    );

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_RULE',
        details: {
          ruleId: newRule.id,
          ruleName: newRule.name,
          conflicts: potentialConflicts.length
        }
      }
    });

    return NextResponse.json({
      rule: newRule,
      conflicts: potentialConflicts,
      message: potentialConflicts.length > 0 
        ? `Règle créée avec ${potentialConflicts.length} conflit(s) potentiel(s)`
        : 'Règle créée avec succès'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating rule:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erreur lors de la création de la règle' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/rules/v2 - Bulk update rules
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { ruleIds, updates } = await request.json();

    if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
      return NextResponse.json(
        { error: 'Liste des IDs de règles requise' },
        { status: 400 }
      );
    }

    // Validate updates
    const validatedUpdates = updateRuleSchema.parse(updates);

    // Update rules
    const result = await prisma.planningRule.updateMany({
      where: { id: { in: ruleIds } },
      data: {
        ...validatedUpdates,
        updatedBy: session.user.id,
        updatedAt: new Date()
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'BULK_UPDATE_RULES',
        details: {
          ruleIds,
          updates: Object.keys(validatedUpdates),
          count: result.count
        }
      }
    });

    return NextResponse.json({
      message: `${result.count} règle(s) mise(s) à jour`,
      count: result.count
    });

  } catch (error) {
    console.error('Error bulk updating rules:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des règles' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/rules/v2 - Bulk delete rules
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { ruleIds } = await request.json();

    if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
      return NextResponse.json(
        { error: 'Liste des IDs de règles requise' },
        { status: 400 }
      );
    }

    // Soft delete by archiving
    const result = await prisma.planningRule.updateMany({
      where: { id: { in: ruleIds } },
      data: {
        status: 'archived',
        updatedBy: session.user.id,
        updatedAt: new Date()
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'ARCHIVE_RULES',
        details: {
          ruleIds,
          count: result.count
        }
      }
    });

    return NextResponse.json({
      message: `${result.count} règle(s) archivée(s)`,
      count: result.count
    });

  } catch (error) {
    console.error('Error archiving rules:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'archivage des règles' },
      { status: 500 }
    );
  }
}