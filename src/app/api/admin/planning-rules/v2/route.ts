import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { 
    canViewRules, 
    canCreateRules,
    filterRulesForUser,
    RULES_PERMISSIONS 
} from '@/modules/dynamicRules/permissions';
import { getRuleNotificationService } from '@/modules/dynamicRules/services/RuleNotificationService';

// Schémas de validation
const QuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: z.enum(['active', 'inactive', 'draft']).optional(),
    type: z.enum(['validation', 'generation', 'transformation']).optional(),
    search: z.string().optional()
});

const CreateRuleSchema = z.object({
    name: z.string().min(3).max(100),
    description: z.string().optional(),
    type: z.enum(['validation', 'generation', 'transformation']),
    priority: z.number().min(1).max(100),
    status: z.enum(['active', 'inactive', 'draft']).default('draft'),
    conditions: z.any(), // Validation plus poussée possible
    actions: z.array(z.any()),
    metadata: z.record(z.any()).optional()
});

/**
 * GET /api/admin/planning-rules/v2
 * Récupère la liste des règles avec pagination et filtrage
 */
export async function GET(request: NextRequest) {
    try {
        // Vérifier l'authentification
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
        
        if (!token) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const authResult = await verifyAuthToken(token);
        if (!authResult.authenticated) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Récupérer l'utilisateur et vérifier les permissions
        const user = await prisma.user.findUnique({
            where: { id: authResult.userId },
            select: { id: true, role: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const authContext = { userId: user.id, role: user.role };
        
        if (!canViewRules(authContext)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        // Parser les paramètres de requête
        const { searchParams } = new URL(request.url);
        const queryParams = Object.fromEntries(searchParams.entries());
        const query = QuerySchema.parse(queryParams);

        // Construire les filtres Prisma
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

        // Récupérer les règles avec pagination
        const [rules, total] = await Promise.all([
            prisma.planningRule.findMany({
                where,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: [
                    { priority: 'desc' },
                    { updatedAt: 'desc' }
                ],
                include: {
                    metrics: true,
                    versions: {
                        take: 1,
                        orderBy: { version: 'desc' }
                    }
                }
            }),
            prisma.planningRule.count({ where })
        ]);

        // Filtrer les règles selon les permissions
        const filteredRules = filterRulesForUser(rules, authContext);

        return NextResponse.json({
            rules: filteredRules,
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
                { error: 'Invalid query parameters', details: error.errors },
                { status: 400 }
            );
        }
        
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/planning-rules/v2
 * Crée une nouvelle règle
 */
export async function POST(request: NextRequest) {
    try {
        // Vérifier l'authentification
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
        
        if (!token) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const authResult = await verifyAuthToken(token);
        if (!authResult.authenticated) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Récupérer l'utilisateur et vérifier les permissions
        const user = await prisma.user.findUnique({
            where: { id: authResult.userId },
            select: { id: true, role: true, email: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const authContext = { userId: user.id, role: user.role };
        
        if (!canCreateRules(authContext)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        // Parser et valider les données
        const body = await request.json();
        const data = CreateRuleSchema.parse(body);

        // Créer la règle
        const rule = await prisma.planningRule.create({
            data: {
                ...data,
                createdBy: user.email || `user-${user.id}`,
                conditions: data.conditions || {},
                actions: data.actions || [],
                metadata: data.metadata || {}
            },
            include: {
                metrics: true
            }
        });

        // Créer les métriques associées si elles n'existent pas
        if (!rule.metrics) {
            await prisma.ruleMetrics.create({
                data: {
                    ruleId: rule.id,
                    executionCount: 0,
                    successCount: 0,
                    failureCount: 0,
                    avgExecutionTime: 0,
                    impactScore: 0
                }
            });
        }

        // Logger l'action
        await prisma.auditSecurityLog.create({
            data: {
                userId: user.id,
                action: 'CREATE_PLANNING_RULE',
                resource: `/rules/${rule.id}`,
                details: {
                    ruleName: rule.name,
                    ruleType: rule.type
                },
                severity: 'INFO',
                timestamp: new Date()
            }
        });

        // Envoyer notification de changement
        try {
            const notificationService = getRuleNotificationService();
            await notificationService.sendRuleChange(
                'created',
                rule.id,
                rule.name,
                user.email || `user-${user.id}`
            );
        } catch (error) {
            console.error('Failed to send rule change notification:', error);
        }

        return NextResponse.json(rule, { status: 201 });

    } catch (error) {
        console.error('Error creating rule:', error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid rule data', details: error.errors },
                { status: 400 }
            );
        }
        
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}