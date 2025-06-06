import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { auditService, AuditAction } from '@/services/OptimizedAuditService';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/audit-logs
 * Récupère l'historique des logs d'audit
 * Accessible uniquement aux administrateurs
 */
export async function GET(req: NextRequest) {
    try {
        // Vérification manuelle de l'authentification
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : null;

        if (!token) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const authResult = await verifyAuthToken(token);
        if (!authResult.authenticated) {
            return NextResponse.json(
                { error: authResult.error || 'Invalid token' },
                { status: 401 }
            );
        }

        // Vérifier le rôle
        const user = await prisma.user.findUnique({
            where: { id: authResult.userId },
            select: {
                id: true,
                role: true,
                actif: true
            }
        });

        if (!user || !user.actif) {
            return NextResponse.json(
                { error: 'User not found or inactive' },
                { status: 403 }
            );
        }

        if (user.role !== 'ADMIN_TOTAL' && user.role !== 'ADMIN_PARTIEL') {
            return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        
        // Paramètres de filtrage
        const entityType = searchParams.get('entityType') || undefined;
        const entityId = searchParams.get('entityId') || undefined;
        const userId = searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : undefined;
        const action = searchParams.get('action') as AuditAction | undefined;
        const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
        const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Récupérer les logs d'audit
        const logs = await auditService.getAuditHistory({
            entityType,
            entityId,
            userId,
            action,
            startDate,
            endDate,
            limit,
            offset
        });

        // Formater la réponse
        const formattedLogs = logs.map(log => {
            let parsedDetails = {};
            try {
                if (log.details) {
                    parsedDetails = JSON.parse(log.details);
                }
            } catch (e: unknown) {
                parsedDetails = { raw: log.details };
            }

            return {
                id: log.id,
                action: log.action,
                entityType: log.entityType,
                entityId: log.entityId,
                timestamp: log.timestamp,
                user: log.user ? {
                    id: log.user.id,
                    nom: log.user.nom,
                    prenom: log.user.prenom,
                    login: log.user.login,
                    role: log.user.role
                } : null,
                details: parsedDetails
            };
        });

        return NextResponse.json({
            success: true,
            data: formattedLogs,
            pagination: {
                limit,
                offset,
                total: logs.length,
                hasMore: logs.length === limit
            }
        });

    } catch (error: unknown) {
        logger.error('Error fetching audit logs', { error: error });
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/audit-logs/statistics
 * Récupère les statistiques des logs d'audit
 */
export async function POST(req: NextRequest) {
    try {
        // Vérification manuelle de l'authentification
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : null;

        if (!token) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const authResult = await verifyAuthToken(token);
        if (!authResult.authenticated) {
            return NextResponse.json(
                { error: authResult.error || 'Invalid token' },
                { status: 401 }
            );
        }

        // Vérifier le rôle
        const user = await prisma.user.findUnique({
            where: { id: authResult.userId },
            select: {
                id: true,
                role: true,
                actif: true
            }
        });

        if (!user || !user.actif) {
            return NextResponse.json(
                { error: 'User not found or inactive' },
                { status: 403 }
            );
        }

        if (user.role !== 'ADMIN_TOTAL') {
            return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { startDate, endDate } = body;

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'Start date and end date are required' },
                { status: 400 }
            );
        }

        const statistics = await auditService.getAuditStatistics(
            new Date(startDate),
            new Date(endDate)
        );

        if (!statistics) {
            return NextResponse.json(
                { error: 'Failed to generate statistics' },
                { status: 500 }
            );
        }

        // Enrichir les statistiques avec des informations supplémentaires
        const enrichedStats = {
            ...statistics,
            period: {
                start: startDate,
                end: endDate,
                durationDays: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
            },
            averageActionsPerDay: statistics.totalActions / Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))),
            topActions: Object.entries(statistics.actionsByType)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([action, count]) => ({ action, count })),
            topUsers: Object.entries(statistics.actionsByUser)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([userId, count]) => ({ userId: parseInt(userId), count })),
            securityMetrics: {
                accessDeniedCount: statistics.actionsByType['ACCESS_DENIED'] || 0,
                rateLimitExceededCount: statistics.actionsByType['RATE_LIMIT_EXCEEDED'] || 0,
                loginFailedCount: statistics.actionsByType['USER_LOGIN_FAILED'] || 0,
                suspiciousActivityCount: statistics.actionsByType['SUSPICIOUS_ACTIVITY'] || 0
            }
        };

        return NextResponse.json({
            success: true,
            data: enrichedStats
        });

    } catch (error: unknown) {
        logger.error('Error generating audit statistics', { error: error });
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}