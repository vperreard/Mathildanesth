import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { 
    canViewRules, 
    canEditRules,
    canDeleteRules,
    canManageSystemRules,
    filterRulesForUser
} from '@/modules/dynamicRules/permissions';
import { getRuleNotificationService } from '@/modules/dynamicRules/services/RuleNotificationService';

const UpdateRuleSchema = z.object({
    name: z.string().min(3).max(100).optional(),
    description: z.string().optional(),
    type: z.enum(['validation', 'generation', 'transformation']).optional(),
    priority: z.number().min(1).max(100).optional(),
    status: z.enum(['active', 'inactive', 'draft']).optional(),
    conditions: z.any().optional(),
    actions: z.array(z.any()).optional(),
    metadata: z.record(z.any()).optional()
});

/**
 * GET /api/admin/planning-rules/v2/[ruleId]
 * Récupère une règle spécifique
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { ruleId: string } }
) {
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

        // Récupérer la règle
        const rule = await prisma.planningRule.findUnique({
            where: { id: params.ruleId },
            include: {
                metrics: true,
                versions: {
                    orderBy: { version: 'desc' },
                    take: 10
                }
            }
        });

        if (!rule) {
            return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
        }

        // Vérifier que l'utilisateur peut voir cette règle
        const filteredRules = filterRulesForUser([rule], authContext);
        if (filteredRules.length === 0) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json(rule);

    } catch (error) {
        console.error('Error fetching rule:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/planning-rules/v2/[ruleId]
 * Met à jour une règle
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { ruleId: string } }
) {
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
        
        if (!canEditRules(authContext)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        // Récupérer la règle existante
        const existingRule = await prisma.planningRule.findUnique({
            where: { id: params.ruleId }
        });

        if (!existingRule) {
            return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
        }

        // Vérifier les permissions pour les règles système
        if (existingRule.metadata?.isDefault && !canManageSystemRules(authContext)) {
            return NextResponse.json(
                { error: 'Cannot modify system rules' },
                { status: 403 }
            );
        }

        // Parser et valider les données
        const body = await request.json();
        const data = UpdateRuleSchema.parse(body);

        // Créer une nouvelle version si nécessaire
        const hasSignificantChanges = 
            data.conditions !== undefined || 
            data.actions !== undefined ||
            data.type !== undefined;

        if (hasSignificantChanges) {
            // Sauvegarder l'ancienne version
            await prisma.planningRule.create({
                data: {
                    ...existingRule,
                    id: undefined,
                    parentId: existingRule.parentId || existingRule.id,
                    version: existingRule.version,
                    status: 'inactive',
                    createdAt: existingRule.createdAt,
                    updatedAt: existingRule.updatedAt
                }
            });
        }

        // Mettre à jour la règle
        const updatedRule = await prisma.planningRule.update({
            where: { id: params.ruleId },
            data: {
                ...data,
                version: hasSignificantChanges ? existingRule.version + 1 : existingRule.version,
                updatedAt: new Date()
            },
            include: {
                metrics: true
            }
        });

        // Logger l'action
        await prisma.auditSecurityLog.create({
            data: {
                userId: user.id,
                action: 'UPDATE_PLANNING_RULE',
                resource: `/rules/${params.ruleId}`,
                details: {
                    ruleName: updatedRule.name,
                    changes: Object.keys(data),
                    versionChange: hasSignificantChanges
                },
                severity: 'INFO',
                timestamp: new Date()
            }
        });

        // Envoyer notification de changement
        try {
            const notificationService = getRuleNotificationService();
            const changeType = data.status === 'active' && existingRule.status !== 'active' 
                ? 'activated' 
                : data.status === 'inactive' && existingRule.status === 'active'
                ? 'deactivated'
                : 'updated';
                
            await notificationService.sendRuleChange(
                changeType,
                updatedRule.id,
                updatedRule.name,
                user.email || `user-${user.id}`,
                data
            );
        } catch (error) {
            console.error('Failed to send rule change notification:', error);
        }

        return NextResponse.json(updatedRule);

    } catch (error) {
        console.error('Error updating rule:', error);
        
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

/**
 * DELETE /api/admin/planning-rules/v2/[ruleId]
 * Supprime une règle (soft delete)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { ruleId: string } }
) {
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
        
        if (!canDeleteRules(authContext)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        // Récupérer la règle existante
        const existingRule = await prisma.planningRule.findUnique({
            where: { id: params.ruleId }
        });

        if (!existingRule) {
            return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
        }

        // Vérifier les permissions pour les règles système
        if (existingRule.metadata?.isDefault && !canManageSystemRules(authContext)) {
            return NextResponse.json(
                { error: 'Cannot delete system rules' },
                { status: 403 }
            );
        }

        // Soft delete : mettre le statut à 'deleted' et archiver
        const deletedRule = await prisma.planningRule.update({
            where: { id: params.ruleId },
            data: {
                status: 'inactive',
                metadata: {
                    ...existingRule.metadata,
                    deletedAt: new Date().toISOString(),
                    deletedBy: user.id
                }
            }
        });

        // Logger l'action
        await prisma.auditSecurityLog.create({
            data: {
                userId: user.id,
                action: 'DELETE_PLANNING_RULE',
                resource: `/rules/${params.ruleId}`,
                details: {
                    ruleName: deletedRule.name,
                    ruleType: deletedRule.type
                },
                severity: 'WARNING',
                timestamp: new Date()
            }
        });

        // Envoyer notification de changement
        try {
            const notificationService = getRuleNotificationService();
            await notificationService.sendRuleChange(
                'deleted',
                deletedRule.id,
                deletedRule.name,
                user.email || `user-${user.id}`
            );
        } catch (error) {
            console.error('Failed to send rule change notification:', error);
        }

        return NextResponse.json({ message: 'Rule deleted successfully' });

    } catch (error) {
        console.error('Error deleting rule:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}