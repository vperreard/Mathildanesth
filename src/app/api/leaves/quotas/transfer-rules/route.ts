import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AuditService } from '@/services/AuditService';

const prisma = new PrismaClient();
const auditService = new AuditService();

/**
 * GET /api/conges/quotas/transfer-rules
 * Récupère toutes les règles de transfert de quotas
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const rules = await prisma.quotaTransferRule.findMany({
            where: {
                isActive: true
            },
            orderBy: {
                fromType: 'asc'
            }
        });

        return NextResponse.json(rules);
    } catch (error) {
        console.error('Erreur lors de la récupération des règles de transfert :', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des règles de transfert' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/conges/quotas/transfer-rules
 * Crée une nouvelle règle de transfert de quotas
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const data = await req.json();

        // Vérifier si la règle existe déjà
        const existingRule = await prisma.quotaTransferRule.findUnique({
            where: {
                fromType_toType: {
                    fromType: data.fromType,
                    toType: data.toType
                }
            }
        });

        if (existingRule) {
            return NextResponse.json(
                { error: 'Une règle existe déjà pour ces types de congés' },
                { status: 409 }
            );
        }

        const rule = await prisma.quotaTransferRule.create({
            data: {
                fromType: data.fromType,
                toType: data.toType,
                conversionRate: data.conversionRate || 1.0,
                maxTransferDays: data.maxTransferDays,
                maxTransferPercentage: data.maxTransferPercentage,
                requiresApproval: data.requiresApproval || false,
                authorizedRoles: data.authorizedRoles || ['ADMIN_TOTAL'],
                isActive: data.isActive !== undefined ? data.isActive : true
            }
        });

        await auditService.logAction({
            action: 'CREATE_TRANSFER_RULE',
            entityId: rule.id,
            entityType: 'QUOTA_TRANSFER_RULE',
            userId: parseInt(session.user.id),
            details: JSON.stringify(rule)
        });

        return NextResponse.json(rule, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création de la règle de transfert :', error);
        return NextResponse.json(
            { error: 'Erreur lors de la création de la règle de transfert' },
            { status: 500 }
        );
    }
} 