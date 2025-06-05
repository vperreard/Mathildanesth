import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { canViewRules } from '@/modules/dynamicRules/permissions';
import { subHours, subDays, startOfHour, endOfHour } from 'date-fns';

/**
 * GET /api/admin/planning-rules/v2/stats
 * Récupère les statistiques des règles pour le dashboard
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

        // Parser les paramètres
        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '24h';

        // Calculer la période
        let startDate: Date;
        const now = new Date();
        
        switch (range) {
            case '1h':
                startDate = subHours(now, 1);
                break;
            case '24h':
                startDate = subDays(now, 1);
                break;
            case '7d':
                startDate = subDays(now, 7);
                break;
            case '30d':
                startDate = subDays(now, 30);
                break;
            default:
                startDate = subDays(now, 1);
        }

        // Récupérer les statistiques
        const [
            activeRules,
            totalRules,
            recentMetrics,
            topViolations
        ] = await Promise.all([
            // Nombre de règles actives
            prisma.planningRule.count({
                where: { status: 'active' }
            }),
            
            // Nombre total de règles
            prisma.planningRule.count(),
            
            // Métriques récentes
            prisma.ruleMetrics.findMany({
                where: {
                    lastExecutedAt: {
                        gte: startDate
                    }
                },
                include: {
                    rule: {
                        select: {
                            name: true,
                            type: true
                        }
                    }
                },
                orderBy: {
                    executionCount: 'desc'
                },
                take: 10
            }),
            
            // Top des violations (basé sur les logs d'audit)
            prisma.auditSecurityLog.groupBy({
                by: ['resource'],
                where: {
                    action: 'RULE_VIOLATION',
                    timestamp: {
                        gte: startDate
                    }
                },
                _count: {
                    id: true
                },
                orderBy: {
                    _count: {
                        id: 'desc'
                    }
                },
                take: 5
            })
        ]);

        // Calculer les tendances
        const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
        
        const [currentPeriodViolations, previousPeriodViolations] = await Promise.all([
            prisma.auditSecurityLog.count({
                where: {
                    action: 'RULE_VIOLATION',
                    timestamp: {
                        gte: startDate,
                        lte: now
                    }
                }
            }),
            prisma.auditSecurityLog.count({
                where: {
                    action: 'RULE_VIOLATION',
                    timestamp: {
                        gte: previousPeriodStart,
                        lt: startDate
                    }
                }
            })
        ]);

        const trend = previousPeriodViolations > 0
            ? ((currentPeriodViolations - previousPeriodViolations) / previousPeriodViolations) * 100
            : 0;

        // Calculer les statistiques par heure pour le graphique
        const hourlyStats = await prisma.$queryRaw<Array<{
            hour: Date;
            count: bigint;
        }>>`
            SELECT 
                date_trunc('hour', timestamp) as hour,
                COUNT(*) as count
            FROM "AuditSecurityLog"
            WHERE action = 'RULE_VIOLATION'
                AND timestamp >= ${startDate}
            GROUP BY hour
            ORDER BY hour
        `;

        // Formater les données
        const stats = {
            activeRules,
            totalRules,
            trend: Math.round(trend),
            
            // Métriques d'exécution
            executionMetrics: recentMetrics.map(m => ({
                ruleName: m.rule.name,
                ruleType: m.rule.type,
                executionCount: m.executionCount,
                successRate: m.executionCount > 0 
                    ? ((m.successCount / m.executionCount) * 100).toFixed(1)
                    : 0,
                avgExecutionTime: m.avgExecutionTime,
                impactScore: m.impactScore
            })),
            
            // Top violations
            topViolatedRules: topViolations.map(v => ({
                ruleId: v.resource.replace('/rules/', ''),
                count: v._count.id
            })),
            
            // Données horaires
            hourlyData: hourlyStats.map(h => ({
                hour: h.hour,
                count: Number(h.count)
            })),
            
            // Statistiques globales sur la période
            periodStats: {
                totalViolations: currentPeriodViolations,
                avgViolationsPerHour: currentPeriodViolations / Math.max(1, (now.getTime() - startDate.getTime()) / (1000 * 60 * 60))
            }
        };

        return NextResponse.json(stats);

    } catch (error: unknown) {
        logger.error('Error fetching rule stats:', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}