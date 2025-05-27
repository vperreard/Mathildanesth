import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * GET /api/conges/quotas/carry-over-rules
 * Récupère toutes les règles de report de quotas
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const rules = await prisma.quotaCarryOverRule.findMany({
            where: {
                isActive: true
            },
            orderBy: {
                leaveType: 'asc'
            }
        });

        return NextResponse.json(rules);
    } catch (error) {
        console.error('Erreur lors de la récupération des règles de report :', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des règles de report' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/conges/quotas/carry-over-rules
 * Crée une nouvelle règle de report de quotas
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const data = await req.json();

        // Vérifier si la règle existe déjà
        const existingRule = await prisma.quotaCarryOverRule.findUnique({
            where: {
                leaveType: data.leaveType
            }
        });

        if (existingRule) {
            return NextResponse.json(
                { error: 'Une règle existe déjà pour ce type de congé' },
                { status: 409 }
            );
        }

        const rule = await prisma.quotaCarryOverRule.create({
            data: {
                leaveType: data.leaveType,
                ruleType: data.ruleType || 'PERCENTAGE',
                value: data.value || 100,
                maxCarryOverDays: data.maxCarryOverDays,
                expirationDays: data.expirationDays,
                requiresApproval: data.requiresApproval || false,
                authorizedRoles: data.authorizedRoles || ['ADMIN_TOTAL'],
                isActive: data.isActive !== undefined ? data.isActive : true
            }
        });

        // Journaliser l'action
        await prisma.auditLog.create({
            data: {
                action: 'CREATE_CARRY_OVER_RULE',
                entityId: rule.id,
                entityType: 'QUOTA_CARRY_OVER_RULE',
                userId: parseInt(session.user.id),
                details: JSON.stringify(rule)
            }
        });

        return NextResponse.json(rule, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création de la règle de report :', error);
        return NextResponse.json(
            { error: 'Erreur lors de la création de la règle de report' },
            { status: 500 }
        );
    }
} 